import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostBinding, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import { SliceColumnDef, SliceConfig } from './slice-panel.model';

const EMPTY_CATEGORY_KEY = '__empty__';
const EMPTY_CATEGORY_LABEL = 'Vide';

const I18N = {
  expandFilterTitle: 'Déplier le filtre',
  collapseFilterTitle: 'Replier le filtre',
  filterPanelTitle: (count: number) => count > 1 ? 'Filtres' : 'Filtre',
  filterBlockDefaultTitle: 'Filtrer',
  filterEmptyState: 'Aucune donnée',
};

export type SlicePanelFilters = Record<string, string[]>;

@Component({
  standalone: true,
  selector: 'slice-panel',
  imports: [CommonModule, MatIconModule],
  templateUrl: './slice-panel.component.html',
  styleUrls: ['./slice-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlicePanelComponent<T = any> implements OnChanges, OnInit {

  @Input() sliceConfigs: SliceConfig<T>[] = [];
  @Input() columns: SliceColumnDef<T>[] = [];
  @Input() data: T[] = [];
  @Input() lazyData: Map<string, Map<any, any>> = new Map();
  @Input() lazyStatus: Map<string, 'idle' | 'loading' | 'loaded' | 'error'> = new Map();
  @Input() showToggle = true;
  @Input() showCounts = true;
  @Input() collapsedByDefault = false;
  @Input() alwaysShow = false;

  @Output() filterChange = new EventEmitter<(row: T) => boolean>();
  @Output() activeKeysChange = new EventEmitter<string[][]>();
  @Output() dynamicSliceKeysChange = new EventEmitter<string[]>();
  @Output() collapsedChange = new EventEmitter<boolean>();

  @ViewChild('slicePanelBody') slicePanelBodyRef?: ElementRef<HTMLElement>;

  private _cdr = inject(ChangeDetectorRef);

  readonly i18n = I18N;

  isCollapsed = false;

  @HostBinding('class.collapsed') get hostCollapsed(): boolean { return this.isCollapsed; }
  activeKeysBySlice: Map<number, Set<string>> = new Map();
  private _expandedSlices = new Set<number>();
  _dynamicSlices: Array<{ key: string; slice: SliceConfig<T> }> = [];

  _cachedSlices: SliceConfig<T>[] = [];
  private _countCache = new Map<string, number>();

  readonly trackBySliceIndex = (index: number, _: any): number => index;
  readonly trackByCategoryKey = (_: number, cat: any): string => cat.key;

  ngOnInit(): void {
    this.isCollapsed = this.collapsedByDefault;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sliceConfigs'] || changes['data'] || changes['columns'] || changes['lazyData'] || changes['lazyStatus']) {
      const hadActiveFilters = this._hasActiveFilters();
      this._refreshDynamicSlices();
      this._rebuildCache();
      const shouldReemitFilter = !!(changes['sliceConfigs'] || changes['data'] || changes['columns'] || changes['lazyData'] || changes['lazyStatus']);
      // Un slice retiré de la config emporte sa sélection : le parent doit en être informé.
      if (shouldReemitFilter && (hadActiveFilters || this._hasActiveFilters())) {
        this._emitFilter();
      }
      this._cdr.markForCheck();
    }
  }

  private _hasActiveFilters(): boolean {
    return [...this.activeKeysBySlice.values()].some(s => s.size > 0);
  }

  get showPanel(): boolean {
    const hasCfg = (this.sliceConfigs || []).length > 0 || this._dynamicSlices.length > 0;
    if (this.alwaysShow) return hasCfg;
    return hasCfg && (this.data?.length ?? 0) > 0;
  }

  get slices(): SliceConfig<T>[] {
    return this._cachedSlices;
  }

  get staticSliceCount(): number {
    return (this.sliceConfigs || []).length;
  }

  get staticSlicesForMenu(): Array<{ key: string; title: string }> {
    return (this.sliceConfigs || [])
      .filter((s) => !!s.columnKey)
      .map((s) => ({ key: s.columnKey!, title: s.title || s.columnKey! }));
  }

  get activeDynamicSliceColumns(): SliceColumnDef<T>[] {
    return this._dynamicSlices
      .map((d) => (this.columns || []).find((c) => c.key === d.key))
      .filter((c): c is SliceColumnDef<T> => !!c);
  }

  get availableColumnsForDynamicSlice(): SliceColumnDef<T>[] {
    const dynamicKeys = new Set(this._dynamicSlices.map((d) => d.key));
    const staticKeys = new Set(
      (this.sliceConfigs || []).map((s) => s.columnKey).filter((k): k is string => !!k)
    );
    const existingKeys = new Set([...dynamicKeys, ...staticKeys]);
    const seen = new Set<string>();
    return (this.columns || []).filter((c) => {
      if (existingKeys.has(c.key) || seen.has(c.key)) return false;
      seen.add(c.key);
      return true;
    });
  }

  isSliceCollapsed(sliceIndex: number): boolean {
    if (this._cachedSlices.length === 1) {
      return this._expandedSlices.has(-1 - sliceIndex);
    }
    return !this._expandedSlices.has(sliceIndex);
  }

  toggleSliceCollapse(sliceIndex: number): void {
    if (this.slices.length === 1) {
      const closedKey = -1 - sliceIndex;
      if (this._expandedSlices.has(closedKey)) {
        this._expandedSlices.delete(closedKey);
      } else {
        this._expandedSlices.add(closedKey);
        this._scrollSliceTitleIntoView(sliceIndex);
      }
    } else {
      if (this._expandedSlices.has(sliceIndex)) {
        this._expandedSlices.delete(sliceIndex);
      } else {
        this._expandedSlices.clear();
        this._expandedSlices.add(sliceIndex);
        this._scrollSliceTitleIntoView(sliceIndex);
      }
    }
    this._cdr.markForCheck();
  }

  togglePanel(): void {
    this.isCollapsed = !this.isCollapsed;
    this.collapsedChange.emit(this.isCollapsed);
    this._cdr.markForCheck();
  }

  isSliceDynamic(sliceIndex: number): boolean {
    return sliceIndex >= this.staticSliceCount;
  }

  isSliceLoading(sliceIndex: number): boolean {
    const staticSlice = (this.sliceConfigs || [])[sliceIndex];
    if (staticSlice?.columnKey) {
      const colDef = (this.columns || []).find(c => c.key === staticSlice.columnKey);
      if (colDef?.lazy) {
        const status = this.lazyStatus.get(staticSlice.columnKey!) ?? 'idle';
        return status === 'loading' || status === 'idle';
      }
      return false;
    }
    const key = this._getDynamicSliceColumnKey(sliceIndex);
    if (!key) return false;
    const colDef = (this.columns || []).find(c => c.key === key);
    if (!colDef?.lazy) return false;
    const status = this.lazyStatus.get(key) ?? 'idle';
    return status === 'loading' || status === 'idle';
  }

  isStaticSliceVisible(_columnKey: string): boolean {
    return true;
  }

  getSliceIcon(slice: SliceConfig<T>): string | undefined {
    if (slice.icon) return slice.icon;
    if (slice.columnKey) {
      return (this.columns || []).find(c => c.key === slice.columnKey)?.icon;
    }
    return undefined;
  }

  isSliceCategoryActive(sliceIndex: number, categoryKey: string): boolean {
    return this.activeKeysBySlice.get(sliceIndex)?.has(categoryKey) ?? false;
  }

  isSliceAllActive(sliceIndex: number): boolean {
    return !this.activeKeysBySlice.has(sliceIndex) || this.activeKeysBySlice.get(sliceIndex)!.size === 0;
  }

  sliceCategoryCount(sliceIndex: number, categoryKey: string): number {
    const slice = this._cachedSlices[sliceIndex];
    if (!slice) return 0;
    const category = (slice.categories || []).find((c) => c.key === categoryKey);
    if (category?.count !== undefined) return category.count;
    const cacheKey = `${sliceIndex}:${categoryKey}`;
    if (this._countCache.has(cacheKey)) {
      return this._countCache.get(cacheKey)!;
    }
    const count = category ? (this.data || []).filter((row) => category.filter ? category.filter(row) : true).length : 0;
    this._countCache.set(cacheKey, count);
    return count;
  }

  isSliceEmpty(sliceIndex: number): boolean {
    const slice = this._cachedSlices[sliceIndex];
    if (!slice) return true;
    return (slice.categories || []).every(c => this.sliceCategoryCount(sliceIndex, c.key) === 0);
  }

  onSliceCategorySelected(sliceIndex: number, categoryKey: string): void {
    const slice = this.slices[sliceIndex];
    if (!slice) return;
    if (!this.activeKeysBySlice.has(sliceIndex)) {
      this.activeKeysBySlice.set(sliceIndex, new Set());
    }
    const activeKeys = this.activeKeysBySlice.get(sliceIndex)!;
    if (slice.multiSelect === false) {
      if (activeKeys.has(categoryKey)) {
        activeKeys.clear();
      } else {
        activeKeys.clear();
        activeKeys.add(categoryKey);
      }
    } else {
      if (activeKeys.has(categoryKey)) {
        activeKeys.delete(categoryKey);
      } else {
        activeKeys.add(categoryKey);
      }
    }
    this._emitFilter();
    this._cdr.markForCheck();
  }

  onSliceAllSelected(sliceIndex: number): void {
    if (this.activeKeysBySlice.has(sliceIndex)) {
      this.activeKeysBySlice.get(sliceIndex)!.clear();
    }
    this._emitFilter();
    this._cdr.markForCheck();
  }

  getActiveFilters(): SlicePanelFilters {
    const result: SlicePanelFilters = {};
    this._cachedSlices.forEach((slice, idx) => {
      const keys = this.activeKeysBySlice.get(idx);
      result[this._getPersistentSliceKey(slice, idx)] = keys ? [...keys] : [];
    });
    return result;
  }

  restoreFilters(filters: SlicePanelFilters): void {
    this.activeKeysBySlice = new Map();
    this._cachedSlices.forEach((slice, index) => {
      // Les préférences historiques utilisaient l'index numérique comme clé.
      const keys = filters[this._getPersistentSliceKey(slice, index)] ?? filters[String(index)];
      if (keys?.length) this.activeKeysBySlice.set(index, new Set(keys));
    });
    this._emitFilter();
    this._cdr.markForCheck();
  }

  addDynamicSlice(column: SliceColumnDef<T>): void {
    if (this._dynamicSlices.some(slice => slice.key === column.key)) return;
    const distinct = this._computeDistinctValues(column.key);
    const newSlice: SliceConfig<T> = {
      title: column.header,
      columnKey: column.key,
      categories: this._buildCategories(column.key, distinct),
    };
    this._dynamicSlices = [...this._dynamicSlices, { key: column.key, slice: newSlice }];
    this._rebuildCache();
    this.dynamicSliceKeysChange.emit(this._dynamicSlices.map(d => d.key));
    this._emitFilter();
    this._cdr.markForCheck();
  }

  removeDynamicSlice(sliceIndex: number): void {
    const dynamicIndex = sliceIndex - this.staticSliceCount;
    if (dynamicIndex < 0) return;
    // Les sélections sont rapprochées des slices restants par identité dans _rebuildCache.
    this._dynamicSlices = this._dynamicSlices.filter((_, i) => i !== dynamicIndex);
    this._rebuildCache();
    this.dynamicSliceKeysChange.emit(this._dynamicSlices.map(d => d.key));
    this._emitFilter();
    this._cdr.markForCheck();
  }

  removeDynamicSliceByKey(key: string): void {
    const dynamicIndex = this._dynamicSlices.findIndex((d) => d.key === key);
    if (dynamicIndex < 0) return;
    const sliceIndex = this.staticSliceCount + dynamicIndex;
    this.removeDynamicSlice(sliceIndex);
  }

  private _emitFilter(): void {
    const slices = this.slices;
    const activeKeysBySlice = this.activeKeysBySlice;

    this.activeKeysChange.emit(
      slices.map((_, i) => {
        const keys = activeKeysBySlice.get(i);
        return keys ? [...keys] : [];
      })
    );

    const pred = (row: T): boolean =>
      slices.every((slice, sliceIndex) => {
        const activeKeys = activeKeysBySlice.get(sliceIndex);
        if (!activeKeys || activeKeys.size === 0) return true;
        if (!slice.categories || slice.categories.length === 0) return true;
        return [...activeKeys].some((key) => {
          const category = (slice.categories || []).find((c) => c.key === key);
          if (!category) return false;
          if (!category?.filter) return true;
          return category.filter(row);
        });
      });
    this.filterChange.emit(pred);
  }

  private _getDynamicSliceColumnKey(sliceIndex: number): string | null {
    const dynamicIndex = sliceIndex - this.staticSliceCount;
    return this._dynamicSlices[dynamicIndex]?.key ?? null;
  }

  private _getPersistentSliceKey(slice: SliceConfig<T>, index: number): string {
    return slice.columnKey ? `column:${slice.columnKey}` : `index:${index}`;
  }

  private _getSliceIdentity(slice: SliceConfig<T>, fallbackIndex: number): string {
    if (slice.columnKey) return `column:${slice.columnKey}`;
    if (slice.title) return `title:${slice.title}`;
    const categoryKeys = (slice.categories || []).map((c) => c.key).join('|');
    return `index:${fallbackIndex}|categories:${categoryKeys}`;
  }

  private _materializeSlice(slice: SliceConfig<T>): SliceConfig<T> {
    if (!slice.columnKey || (slice.categories && slice.categories.length > 0)) {
      return slice;
    }
    const col = this._column(slice.columnKey);
    const isLazy = !!col?.lazy;
    if (isLazy && this.lazyStatus.get(slice.columnKey!) !== 'loaded') {
      return { ...slice, categories: [] };
    }
    if (slice.bucket) {
      const bucket = slice.bucket;
      const counts = new Map<string, number>();
      (this.data || []).forEach(row => { const v = bucket(row); counts.set(v, (counts.get(v) ?? 0) + 1); });
      return {
        ...slice,
        categories: [...counts.keys()].sort().map((v) => ({
          key: v, label: v, count: counts.get(v),
          filter: (row: T) => bucket(row) === v,
        })),
      };
    }
    return {
      ...slice,
      categories: this._buildCategories(slice.columnKey!, this._computeDistinctValues(slice.columnKey!)),
    };
  }

  private _buildCategories(columnKey: string, distinct: { values: string[]; counts: Map<string, number> }) {
    return distinct.values.map((v) => this._buildCategoryFromValue(columnKey, v, distinct.counts.get(v)));
  }

  private _buildCategoryFromValue(columnKey: string, v: string, count?: number): { key: string; label: string; filter: (row: T) => boolean; count?: number } {
    if (v === EMPTY_CATEGORY_KEY) {
      return {
        key: EMPTY_CATEGORY_KEY,
        label: EMPTY_CATEGORY_LABEL,
        count,
        filter: (row: T) => {
          const val = this._getLazyAwareValue(columnKey, row);
          return val == null || val === '';
        },
      };
    }
    return {
      key: v, label: v, count,
      filter: (row: T) => String(this._getLazyAwareValue(columnKey, row) ?? '') === v,
    };
  }

  /** Valeurs distinctes (triées, « vide » en dernier) et effectifs, calculés en un seul passage. */
  private _computeDistinctValues(columnKey: string): { values: string[]; counts: Map<string, number> } {
    const counts = new Map<string, number>();
    let empty = 0;
    (this.data || []).forEach((row) => {
      const val = this._getLazyAwareValue(columnKey, row);
      if (val != null && val !== '') {
        const text = String(val);
        counts.set(text, (counts.get(text) ?? 0) + 1);
      } else {
        empty++;
      }
    });
    const values = [...counts.keys()].sort();
    if (empty > 0) {
      values.push(EMPTY_CATEGORY_KEY);
      counts.set(EMPTY_CATEGORY_KEY, empty);
    }
    return { values, counts };
  }

  private _columnsRef?: SliceColumnDef<T>[];
  private _columnIndex = new Map<string, SliceColumnDef<T>>();

  private _column(key: string | undefined): SliceColumnDef<T> | undefined {
    if (this._columnsRef !== this.columns) {
      this._columnsRef = this.columns;
      this._columnIndex = new Map();
      (this.columns || []).forEach(c => { if (!this._columnIndex.has(c.key)) this._columnIndex.set(c.key, c); });
    }
    return key === undefined ? undefined : this._columnIndex.get(key);
  }

  private _getLazyAwareValue(columnKey: string, row: T): any {
    const colDef = this._column(columnKey);
    if (colDef?.lazy) {
      return this.lazyData.get(columnKey)?.get(row) ?? null;
    }
    if (colDef?.value) {
      return (colDef.value as any)(row, 0);
    }
    return (row as any)[columnKey];
  }

  private _rebuildCache(): void {
    const previousSlices = this._cachedSlices;
    const previousActiveKeys = this.activeKeysBySlice;
    const allSlices = [...(this.sliceConfigs || []), ...this._dynamicSlices.map((d) => d.slice)];
    this._cachedSlices = allSlices.map((slice) => this._materializeSlice(slice));

    const previousKeysByIdentity = new Map<string, Set<string>>();
    previousSlices.forEach((slice, index) => {
      const activeKeys = previousActiveKeys.get(index);
      if (!activeKeys || activeKeys.size === 0) return;
      previousKeysByIdentity.set(this._getSliceIdentity(slice, index), new Set(activeKeys));
    });

    const nextActiveKeys = new Map<number, Set<string>>();
    this._cachedSlices.forEach((slice, index) => {
      const previousKeys = previousKeysByIdentity.get(this._getSliceIdentity(slice, index));
      if (!previousKeys || previousKeys.size === 0) return;
      const availableKeys = new Set((slice.categories || []).map((c) => c.key));
      const matchingKeys = [...previousKeys].filter((key) => availableKeys.has(key));
      if (matchingKeys.length > 0) nextActiveKeys.set(index, new Set(matchingKeys));
    });
    this.activeKeysBySlice = nextActiveKeys;
    this._countCache.clear();
  }

  private _refreshDynamicSlices(): void {
    this._dynamicSlices = this._dynamicSlices.map(({ key, slice }) => ({
      key,
      slice: { ...slice, categories: this._buildCategories(key, this._computeDistinctValues(key)) },
    }));
  }

  private _scrollSliceTitleIntoView(sliceIndex: number): void {
    setTimeout(() => {
      const body = this.slicePanelBodyRef?.nativeElement;
      if (!body) return;
      const el = body.querySelector(`[data-slice-index="${sliceIndex}"]`) as HTMLElement | null;
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  }
}
