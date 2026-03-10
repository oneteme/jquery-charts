import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  ElementRef, EventEmitter, Input, OnChanges, OnInit, Output,
  SimpleChanges, ViewChild, inject
} from '@angular/core';
import { SliceColumnDef, SliceConfig } from './slice-panel.model';

@Component({
  standalone: true,
  selector: 'slice-panel',
  imports: [CommonModule],
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
  /** Affiche le compteur de lignes sur chaque catégorie. Désactiver pour les contextes non-tabulaires (graphiques…). */
  @Input() showCounts = true;
  /** Replie le panneau entier à l'initialisation. */
  @Input() collapsedByDefault = false;
  /** Affiche le panneau même si `data` est vide. Utile pour les graphiques où les données ne transitent pas par `data`. */
  @Input() alwaysShow = false;

  @Output() filterChange = new EventEmitter<(row: T) => boolean>();
  /** Émet les clés actives par slice en parallèle de `sliceConfigs` (index 0 = première slice, etc.). Alternatif à `filterChange` pour les consommateurs non-tabulaires. */
  @Output() activeKeysChange = new EventEmitter<string[][]>();
  @Output() dynamicSliceKeysChange = new EventEmitter<string[]>();
  /** Émet `true` quand le panneau est replié, `false` quand il est ouvert. */
  @Output() collapsedChange = new EventEmitter<boolean>();

  @ViewChild('slicePanelBody') slicePanelBodyRef?: ElementRef<HTMLElement>;

  private _cdr = inject(ChangeDetectorRef);

  isCollapsed = false;
  activeKeysBySlice: Map<number, Set<string>> = new Map();
  private _expandedSlices = new Set<number>();
  _dynamicSlices: Array<{ key: string; slice: SliceConfig<T> }> = [];
  private _hiddenStaticSliceKeys = new Set<string>();

  // ── Cache ─────────────────────────────────────────────────────
  _cachedSlices: SliceConfig<T>[] = [];
  private _countCache = new Map<string, number>();

  readonly trackBySliceIndex = (index: number, _: any): number => index;
  readonly trackByCategoryKey = (_: number, cat: any): string => cat.key;

  // ── Lifecycle ─────────────────────────────────────────────────

  ngOnInit(): void {
    this.isCollapsed = this.collapsedByDefault;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sliceConfigs'] || changes['data'] || changes['columns'] || changes['lazyData'] || changes['lazyStatus']) {
      this._refreshDynamicSlices();
      this._rebuildCache();
      this._cdr.markForCheck();
    }
  }

  // ── Computed ──────────────────────────────────────────────────

  get showPanel(): boolean {
    const visibleStaticCount = (this.sliceConfigs || []).filter(
      (s) => !s.columnKey || !this._hiddenStaticSliceKeys.has(s.columnKey)
    ).length;
    const hasCfg = visibleStaticCount > 0 || this._dynamicSlices.length > 0;
    if (this.alwaysShow) return hasCfg;
    return hasCfg && (this.data?.length ?? 0) > 0;
  }

  get slices(): SliceConfig<T>[] {
    return this._cachedSlices;
  }

  get staticSliceCount(): number {
    return (this.sliceConfigs || []).filter(
      (s) => !s.columnKey || !this._hiddenStaticSliceKeys.has(s.columnKey)
    ).length;
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

  get activeSliceByLabel(): string {
    const staticActiveCount = (this.sliceConfigs || []).filter(
      (s) => !s.columnKey || !this._hiddenStaticSliceKeys.has(s.columnKey)
    ).length;
    const total = staticActiveCount + this._dynamicSlices.length;
    if (total === 0) return 'Aucun';
    if (total === 1) {
      const first = (this.sliceConfigs || []).find(
        (s) => !s.columnKey || !this._hiddenStaticSliceKeys.has(s.columnKey)
      );
      if (first) return first.title || first.columnKey || '1';
      return this.activeDynamicSliceColumns[0]?.header || '1';
    }
    return `${total} actifs`;
  }

  // ── UI state ──────────────────────────────────────────────────

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
    // Slice statique avec columnKey lazy
    const staticSlice = (this.sliceConfigs || [])[sliceIndex];
    if (staticSlice?.columnKey) {
      const colDef = (this.columns || []).find(c => c.key === staticSlice.columnKey);
      if (colDef?.lazy) {
        const status = this.lazyStatus.get(staticSlice.columnKey!) ?? 'idle';
        return status === 'loading' || status === 'idle';
      }
      return false;
    }
    // Slice dynamique
    const key = this._getDynamicSliceColumnKey(sliceIndex);
    if (!key) return false;
    const colDef = (this.columns || []).find(c => c.key === key);
    if (!colDef?.lazy) return false;
    const status = this.lazyStatus.get(key) ?? 'idle';
    return status === 'loading' || status === 'idle';
  }

  isStaticSliceVisible(columnKey: string): boolean {
    return !this._hiddenStaticSliceKeys.has(columnKey);
  }

  toggleStaticSlice(columnKey: string): void {
    const next = new Set(this._hiddenStaticSliceKeys);
    if (next.has(columnKey)) next.delete(columnKey);
    else next.add(columnKey);
    this._hiddenStaticSliceKeys = next;
    this._rebuildCache();
    this._emitFilter();
    this._cdr.markForCheck();
  }

  // ── Selection ─────────────────────────────────────────────────

  isSliceCategoryActive(sliceIndex: number, categoryKey: string): boolean {
    return this.activeKeysBySlice.get(sliceIndex)?.has(categoryKey) ?? false;
  }

  isSliceAllActive(sliceIndex: number): boolean {
    return !this.activeKeysBySlice.has(sliceIndex) || this.activeKeysBySlice.get(sliceIndex)!.size === 0;
  }

  sliceCategoryCount(sliceIndex: number, categoryKey: string): number {
    const cacheKey = `${sliceIndex}:${categoryKey}`;
    if (this._countCache.has(cacheKey)) {
      return this._countCache.get(cacheKey)!;
    }
    const slice = this._cachedSlices[sliceIndex];
    if (!slice) return 0;
    const category = (slice.categories || []).find((c) => c.key === categoryKey);
    const count = category ? (this.data || []).filter((row) => category.filter(row)).length : 0;
    this._countCache.set(cacheKey, count);
    return count;
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

  // ── Dynamic slice management ──────────────────────────────────

  addDynamicSlice(column: SliceColumnDef<T>): void {
    const distinctValues = this._computeDistinctValues(column.key);
    const newSlice: SliceConfig<T> = {
      title: column.header,
      categories: distinctValues.map((v) => ({
        key: v,
        label: v,
        filter: (row: T) => String(this._getLazyAwareValue(column.key, row) ?? '') === v,
      })),
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
    const newActiveKeys = new Map<number, Set<string>>();
    this.activeKeysBySlice.forEach((keys, idx) => {
      if (idx < sliceIndex) newActiveKeys.set(idx, keys);
      else if (idx > sliceIndex) newActiveKeys.set(idx - 1, keys);
    });
    this.activeKeysBySlice = newActiveKeys;
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

  // ── Private helpers ───────────────────────────────────────────

  private _emitFilter(): void {
    const slices = this.slices;
    const activeKeysBySlice = this.activeKeysBySlice;

    // Emit active keys per slice (for non-predicate consumers e.g. charts)
    this.activeKeysChange.emit(
      slices.map((_, i) => {
        const keys = activeKeysBySlice.get(i);
        return keys ? [...keys] : [];
      })
    );

    // Emit row predicate (for tabular consumers)
    const pred = (row: T): boolean =>
      slices.every((slice, sliceIndex) => {
        const activeKeys = activeKeysBySlice.get(sliceIndex);
        if (!activeKeys || activeKeys.size === 0) return true;
        return [...activeKeys].some((key) => {
          const category = (slice.categories || []).find((c) => c.key === key);
          return category ? category.filter(row) : false;
        });
      });
    this.filterChange.emit(pred);
  }

  private _getDynamicSliceColumnKey(sliceIndex: number): string | null {
    const dynamicIndex = sliceIndex - this.staticSliceCount;
    return this._dynamicSlices[dynamicIndex]?.key ?? null;
  }

  private _materializeSlice(slice: SliceConfig<T>): SliceConfig<T> {
    if (!slice.columnKey || (slice.categories && slice.categories.length > 0)) {
      return slice;
    }
    const col = (this.columns || []).find(c => c.key === slice.columnKey);
    const isLazy = !!col?.lazy;
    if (isLazy && this.lazyStatus.get(slice.columnKey!) !== 'loaded') {
      return { ...slice, categories: [] };
    }
    const distinctValues = this._computeDistinctValues(slice.columnKey!);
    return {
      ...slice,
      categories: distinctValues.map((v) => ({
        key: v,
        label: v,
        filter: (row: T) => String(this._getLazyAwareValue(slice.columnKey!, row) ?? '') === v,
      })),
    };
  }

  private _computeDistinctValues(columnKey: string): string[] {
    return [
      ...new Set(
        (this.data || [])
          .map((row) => {
            const val = this._getLazyAwareValue(columnKey, row);
            return val != null && val !== '' ? String(val) : null;
          })
          .filter((v): v is string => v !== null)
      ),
    ].sort();
  }

  private _getLazyAwareValue(columnKey: string, row: T): any {
    const colDef = (this.columns || []).find(c => c.key === columnKey);
    if (colDef?.lazy) {
      return this.lazyData.get(columnKey)?.get(row) ?? null;
    }
    return (row as any)[columnKey];
  }

  private _rebuildCache(): void {
    const staticSlices = (this.sliceConfigs || []).filter(
      (s) => !s.columnKey || !this._hiddenStaticSliceKeys.has(s.columnKey)
    );
    const allSlices = [...staticSlices, ...this._dynamicSlices.map((d) => d.slice)];
    this._cachedSlices = allSlices.map((slice) => this._materializeSlice(slice));
    this._countCache.clear();
  }

  private _refreshDynamicSlices(): void {
    this._dynamicSlices = this._dynamicSlices.map(({ key, slice }) => {
      const distinctValues = this._computeDistinctValues(key);
      return {
        key,
        slice: {
          ...slice,
          categories: distinctValues.map((v) => ({
            key: v,
            label: v,
            filter: (row: T) => String(this._getLazyAwareValue(key, row) ?? '') === v,
          })),
        },
      };
    });
  }

  private _scrollSliceTitleIntoView(sliceIndex: number): void {
    setTimeout(() => {
      const container = this.slicePanelBodyRef?.nativeElement;
      if (!container) return;
      const row = container.querySelector(`[data-slice-index="${sliceIndex}"]`) as HTMLElement;
      if (!row) return;
      row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 0);
  }
}
