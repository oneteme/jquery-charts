import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Subject, take, takeUntil } from 'rxjs';
import { TableCategorySliceProvider, TableColumnProvider, TableProvider } from '../jquery-table.model';

function getFrenchPaginatorIntl(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Éléments par page :';
  intl.nextPageLabel = 'Page suivante';
  intl.previousPageLabel = 'Page précédente';
  intl.firstPageLabel = 'Première page';
  intl.lastPageLabel = 'Dernière page';
  intl.getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) return `0 sur ${length}`;
    length = Math.max(length, 0);
    const start = page * pageSize;
    const end = start < length ? Math.min(start + pageSize, length) : start + pageSize;
    return `${start + 1} – ${end} sur ${length}`;
  };
  return intl;
}

@Component({
  standalone: true,
  selector: 'jquery-table',
  imports: [ CommonModule, FormsModule, MatTableModule, MatButtonModule, MatPaginatorModule, MatSortModule, MatMenuModule, MatIconModule, MatSelectModule ],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: MatPaginatorIntl, useFactory: getFrenchPaginatorIntl }],
})
export class TableComponent<T = any> implements OnChanges, AfterViewInit {
  @Input() config?: TableProvider<T>;

  @Input() dataSource?: T[] | { data: T[] };
  @Input() data?: T[];
  @Input() displayedColumns?: string[];
  @Input() columnsConfig?: TableColumnProvider<T>[];

  @Input() columnLabels?: Record<string, string>;
  @Input() isLoading = false;

  @Output() addRequested = new EventEmitter<void>();
  @Output() columnAdded = new EventEmitter<TableColumnProvider<T>>();
  @Output() columnRemoved = new EventEmitter<TableColumnProvider<T>>();
  @Output() categorySelected = new EventEmitter<string>();
  @Output() rowSelected = new EventEmitter<T>();

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;
  @ViewChild('tableBodyScroll') tableBodyScrollRef?: ElementRef<HTMLElement>;

  renderedColumns: string[] = [];
  tableDataSource = new MatTableDataSource<any>([]);
  activeColumns: TableColumnProvider<T>[] = [];

  readonly allCategoryKey = '__all';
  activeKeysBySlice: Map<number, Set<string>> = new Map();
  isSlicePanelCollapsed = false;
  private _expandedSlices = new Set<number>();
  private _dynamicSlices: Array<{ key: string; slice: TableCategorySliceProvider<T> }> = [];

  searchQuery = '';
  activeGroupByKey: string | null = null;
  private _collapsedGroups = new Set<string>();
  private _defaultGroupCollapsed = false;
  private _groupPages = new Map<string, number>();
  private _totalFilteredCount = 0;
  private _hiddenStaticSliceKeys = new Set<string>();

  _lazyColumnStatus = new Map<string, 'idle' | 'loading' | 'loaded' | 'error'>();
  private _lazyColumnData = new Map<string, Map<any, any>>();
  private _lazyFetchCancels = new Map<string, Subject<void>>();
  private _cdr = inject(ChangeDetectorRef);

  isGroupHeader = (_: number, row: any): boolean => row.__groupHeader === true;

  pageSize = 5;
  pageSizeOptions: number[] = [5, 10, 20];
  pageSizeOptionsGroupBy: number[] = [5, 10, 20];
  groupPageSize = 5;

  draggedColumnKey: string | null = null;
  dragOverColumnKey: string | null = null;

  private userCustomizedColumns = false;
  private resolvedConfig: TableProvider<T> = { columns: [], data: [] };
  private _preservePageIndex: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    const dataChanged = !!(changes['config'] || changes['data'] || changes['dataSource']);
    if (dataChanged) {
      this._lazyFetchCancels.forEach(s => { s.next(); s.complete(); });
      this._lazyFetchCancels.clear();
      this._lazyColumnStatus.clear();
      this._lazyColumnData.clear();
    }
    this.refreshViewModel();
    if (dataChanged) {
      this.activeColumns.filter(c => c.lazy && c.fetchFn).forEach(c => this.triggerLazyFetch(c));
    }
  }

  ngAfterViewInit(): void {
    this.attachPaginator();
    this.attachSort();
  }

  get title(): string {
    return this.resolvedConfig.title ?? '';
  }

  get showTitle(): boolean {
    return !!this.resolvedConfig.title;
  }

  get visibleColumns(): TableColumnProvider<T>[] {
    return this.activeColumns;
  }

  get showSearchBar(): boolean { return this.resolvedConfig.enableSearchBar === true; }
  get showViewButton(): boolean { return this.resolvedConfig.enableViewButton === true; }
  get showToolbar(): boolean { return this.showSearchBar || this.showViewButton; }
  get showFields(): boolean { return this.showViewButton; }
  get showGroupBySection(): boolean { return this.showViewButton; }

  get filteredRowCount(): number {
    return this.activeGroupByKey ? this._totalFilteredCount : this.tableDataSource.data.filter((r) => !r.__groupHeader).length;
  }

  get activeGroupByLabel(): string {
    if (!this.activeGroupByKey) return 'Aucun';
    const col = this.groupByColumns.find((c) => c.key === this.activeGroupByKey);
    return col?.header || this.activeGroupByKey;
  }

  get totalColumnCount(): number {
    return new Set((this.resolvedConfig.columns || []).map((c) => c.key)).size;
  }

  get activeSliceByLabel(): string {
    const staticActiveCount = (this.resolvedConfig.slices || []).filter(
      (s) => !s.columnKey || !this._hiddenStaticSliceKeys.has(s.columnKey)
    ).length;
    const total = staticActiveCount + this._dynamicSlices.length;
    if (total === 0) return 'Aucun';
    if (total === 1) {
      const first = (this.resolvedConfig.slices || []).find(
        (s) => !s.columnKey || !this._hiddenStaticSliceKeys.has(s.columnKey)
      );
      if (first) return first.title || first.columnKey || '1';
      return this.activeDynamicSliceColumns[0]?.header || '1';
    }
    return `${total} actifs`;
  }

  get activeDynamicSliceColumns(): TableColumnProvider<T>[] {
    const allCols = this.resolvedConfig.columns || [];
    return this._dynamicSlices
      .map((d) => allCols.find((c) => c.key === d.key))
      .filter((c): c is TableColumnProvider<T> => !!c);
  }

  removeDynamicSliceByKey(key: string): void {
    const dynamicIndex = this._dynamicSlices.findIndex((d) => d.key === key);
    if (dynamicIndex < 0) return;
    const sliceIndex = this.staticSliceCount + dynamicIndex;
    this.removeDynamicSlice(sliceIndex);
  }

  get groupByColumns(): TableColumnProvider<T>[] {
    const all = this.resolvedConfig.columns || [];
    const seen = new Set<string>();
    return all.filter((c) => {
      if (seen.has(c.key)) return false;
      seen.add(c.key);
      return true;
    });
  }

  onSearchChange(): void {
    this._preservePageIndex = 0;
    this.refreshViewModel();
    this.paginator?.firstPage();
  }

  onGroupByChange(key: string | null): void {
    this.activeGroupByKey = key;
    this._defaultGroupCollapsed = key !== null;
    this._collapsedGroups.clear();
    this._groupPages.clear();
    this.groupPageSize = this.resolveDefaultGroupPageSize();
    this.refreshViewModel();
    this.paginator?.firstPage();
    if (key) {
      const colDef = (this.resolvedConfig.columns || []).find(c => c.key === key);
      if (colDef?.lazy && colDef.fetchFn && this._lazyColumnStatus.get(key) !== 'loaded') {
        this.triggerLazyFetch(colDef);
      }
    }
  }

  onGroupPageSizeChange(size: number | string): void {
    this.groupPageSize = Number(size);
    this._groupPages.clear();
    this.refreshViewModel();
    const openGroup = this._defaultGroupCollapsed
      ? (this._collapsedGroups.size === 1 ? [...this._collapsedGroups][0] : null)
      : null;
    if (openGroup) {
      setTimeout(() => this.scrollToGroupHeader(openGroup), 0);
    }
  }

  getLazyColumnStatus(key: string): 'idle' | 'loading' | 'loaded' | 'error' {
    return this._lazyColumnStatus.get(key) ?? 'idle';
  }

  getLazyRenderType(rowValue: any): 'loading' | 'error' | 'value' {
    if (rowValue === '__lazy_loading__') return 'loading';
    if (rowValue === '__lazy_error__') return 'error';
    return 'value';
  }

  retryLazyColumn(column: TableColumnProvider<T>): void {
    const k = column.key;
    const prev = this._lazyFetchCancels.get(k);
    if (prev) { prev.next(); prev.complete(); }
    this._lazyFetchCancels.delete(k);
    this._lazyColumnStatus.delete(k);
    this._lazyColumnData.delete(k);
    this.triggerLazyFetch(column);
  }

  triggerLazyFetch(column: TableColumnProvider<T>): void {
    if (!column.fetchFn) return;
    const k = column.key;
    if (this._lazyColumnStatus.get(k) === 'loading') return;

    const prev = this._lazyFetchCancels.get(k);
    if (prev) { prev.next(); prev.complete(); }
    const cancel$ = new Subject<void>();
    this._lazyFetchCancels.set(k, cancel$);

    this._lazyColumnStatus.set(k, 'loading');
    this.refreshViewModel();

    column.fetchFn().pipe(
      take(1),
      takeUntil(cancel$),
    ).subscribe({
      next: (values: any[]) => {
        const rowMap = new Map<any, any>();
        const data = this.resolvedConfig.data || [];
        values.forEach((value, i) => {
          if (i < data.length) rowMap.set(data[i], value);
        });
        this._lazyColumnData.set(k, rowMap);
        this._lazyColumnStatus.set(k, 'loaded');
        this.refreshViewModel();
        this._cdr.markForCheck();
      },
      error: () => {
        this._lazyColumnStatus.set(k, 'error');
        this.refreshViewModel();
        this._cdr.markForCheck();
      },
    });
  }

  toggleGroupCollapse(groupKey: string): void {
    if (this._collapsedGroups.has(groupKey)) {
      this._collapsedGroups.delete(groupKey);
    } else {
      this._collapsedGroups.clear();
      this._collapsedGroups.add(groupKey);
      setTimeout(() => this.scrollToGroupHeader(groupKey), 0);
    }
    this.refreshViewModel();
  }

  private scrollToGroupHeader(groupKey: string): void {
    const container = this.tableBodyScrollRef?.nativeElement;
    if (!container) return;
    const row = container.querySelector<HTMLElement>(`tr[data-group-key="${CSS.escape(groupKey)}"]`);
    if (!row) return;
    const headerHeight = parseFloat(
      getComputedStyle(container).getPropertyValue('--mat-table-header-container-height') || '56'
    ) || 56;
    const rowTop = row.offsetTop - container.offsetTop;
    container.scrollTo({ top: rowTop - headerHeight, behavior: 'smooth' });
  }

  isGroupCollapsed(groupKey: string): boolean {
    return this._defaultGroupCollapsed ? !this._collapsedGroups.has(groupKey) : this._collapsedGroups.has(groupKey);
  }

  groupPageBack(groupKey: string): void {
    const current = this._groupPages.get(groupKey) ?? 0;
    if (current > 0) {
      this._groupPages.set(groupKey, current - 1);
      this.refreshViewModel();
    }
  }

  groupPageForward(groupKey: string, totalCount: number): void {
    const maxPage = Math.ceil(totalCount / this.groupPageSize) - 1;
    const current = this._groupPages.get(groupKey) ?? 0;
    if (current < maxPage) {
      this._groupPages.set(groupKey, current + 1);
      this.refreshViewModel();
    }
  }

  isSliceCollapsed(sliceIndex: number): boolean {
    if (this.slices.length === 1) {
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
      }
      return;
    }
    if (this._expandedSlices.has(sliceIndex)) {
      this._expandedSlices.delete(sliceIndex);
    } else {
      this._expandedSlices.clear();
      this._expandedSlices.add(sliceIndex);
    }
  }

  get hasAddableColumns(): boolean {
    return this.menuBaseColumns.length > 0 || this.menuOptionalColumns.length > 0;
  }

  get menuBaseColumns(): TableColumnProvider<T>[] {
    return this.uniqueColumnsByKey((this.resolvedConfig.columns || []).filter((c) => !c.optional));
  }

  get menuOptionalColumns(): TableColumnProvider<T>[] {
    return this.uniqueColumnsByKey((this.resolvedConfig.columns || []).filter((c) => c.optional));
  }

  get availableColumnsToAdd(): TableColumnProvider<T>[] {
    const activeKeys = new Set(this.activeColumns.map((column) => column.key));
    return (this.resolvedConfig.columns || []).filter((c) => c.optional && !activeKeys.has(c.key));
  }

  get allowColumnRemoval(): boolean {
    return this.resolvedConfig.allowColumnRemoval === true;
  }

  get slices(): TableCategorySliceProvider<T>[] {
    const cfg = this.resolvedConfig;
    const data = cfg.data || [];
    const staticSlices: TableCategorySliceProvider<T>[] = (cfg.slices || []).filter(
      (s) => !s.columnKey || !this._hiddenStaticSliceKeys.has(s.columnKey)
    );
    const allSlices = [...staticSlices, ...this._dynamicSlices.map((d) => d.slice)];
    return allSlices.map((slice) => this.materializeSlice(slice, data));
  }

  get staticSlicesForMenu(): Array<{ key: string; title: string }> {
    return (this.resolvedConfig.slices || [])
      .filter((s) => !!s.columnKey)
      .map((s) => ({ key: s.columnKey!, title: s.title || s.columnKey! }));
  }

  isStaticSliceVisible(columnKey: string): boolean {
    return !this._hiddenStaticSliceKeys.has(columnKey);
  }

  toggleStaticSlice(columnKey: string): void {
    const next = new Set(this._hiddenStaticSliceKeys);
    if (next.has(columnKey)) next.delete(columnKey);
    else next.add(columnKey);
    this._hiddenStaticSliceKeys = next;
    this.refreshViewModel();
  }

  private materializeSlice(slice: TableCategorySliceProvider<T>, data: T[]): TableCategorySliceProvider<T> {
    if (!slice.columnKey || (slice.categories && slice.categories.length > 0)) {
      return slice;
    }
    const col = (this.resolvedConfig.columns || []).find(c => c.key === slice.columnKey);
    const isLazy = !!col?.lazy;

    if (isLazy && this._lazyColumnStatus.get(slice.columnKey!) !== 'loaded') {
      return { ...slice, categories: [] };
    }

    const distinctValues = [
      ...new Set(
        data
          .map((row) => {
            const val = this.getLazyAwareValue(slice.columnKey!, row);
            return val != null && val !== '' ? String(val) : null;
          })
          .filter((v): v is string => v !== null)
      ),
    ].sort();
    return {
      ...slice,
      categories: distinctValues.map((v) => ({
        key: v,
        label: v,
        filter: (row: T) => String(this.getLazyAwareValue(slice.columnKey!, row) ?? '') === v,
      })),
    };
  }

  get staticSliceCount(): number {
    return (this.resolvedConfig.slices || []).filter(
      (s) => !s.columnKey || !this._hiddenStaticSliceKeys.has(s.columnKey)
    ).length;
  }

  isSliceDynamic(sliceIndex: number): boolean {
    return sliceIndex >= this.staticSliceCount;
  }

  getDynamicSliceColumnKey(sliceIndex: number): string | null {
    const dynamicIndex = sliceIndex - this.staticSliceCount;
    return this._dynamicSlices[dynamicIndex]?.key ?? null;
  }

  isSliceLoading(sliceIndex: number): boolean {
    const key = this.getDynamicSliceColumnKey(sliceIndex);
    if (!key) return false;
    const colDef = (this.resolvedConfig.columns || []).find(c => c.key === key);
    if (!colDef?.lazy) return false;
    const status = this._lazyColumnStatus.get(key) ?? 'idle';
    return status === 'loading' || status === 'idle';
  }

  get showAddSliceButton(): boolean { return this.showToolbar; }

  get availableColumnsForDynamicSlice(): TableColumnProvider<T>[] {
    const dynamicKeys = new Set(this._dynamicSlices.map((d) => d.key));
    const cfg = this.resolvedConfig;
    const staticKeys = new Set(
      (cfg.slices || []).map((s) => s.columnKey).filter((k): k is string => !!k)
    );
    const existingKeys = new Set([...dynamicKeys, ...staticKeys]);
    const allCols = cfg.columns || [];
    const seen = new Set<string>();
    return allCols.filter((c) => {
      if (existingKeys.has(c.key) || seen.has(c.key)) return false;
      seen.add(c.key);
      return true;
    });
  }

  addDynamicSlice(column: TableColumnProvider<T>): void {
    const data = this.resolvedConfig.data || [];
    const distinctValues = [
      ...new Set(
        data
          .map((row) => {
            const val = this.getLazyAwareValue(column.key, row);
            return val != null && val !== '' ? String(val) : null;
          })
          .filter((v): v is string => v !== null)
      ),
    ].sort();
    const newSlice: TableCategorySliceProvider<T> = {
      title: column.header,
      categories: distinctValues.map((v) => ({
        key: v,
        label: v,
        filter: (row: T) => String(this.getLazyAwareValue(column.key, row) ?? '') === v,
      })),
    };
    this._dynamicSlices = [...this._dynamicSlices, { key: column.key, slice: newSlice }];
    this.refreshViewModel();
    if (column.lazy && column.fetchFn && this._lazyColumnStatus.get(column.key) !== 'loaded') {
      this.triggerLazyFetch(column);
    }
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
    this.refreshViewModel();
  }

  get showSlicePanel(): boolean {
    return this.slices.length > 0 && (this.resolvedConfig.data || []).length > 0;
  }

  get showSliceToggle(): boolean {
    return this.resolvedConfig.showSliceToggle !== false;
  }

  get emptyStateLabel(): string {
    return this.resolvedConfig.emptyStateLabel || 'Aucune donnée';
  }

  get loadingStateLabel(): string {
    return this.resolvedConfig.loadingStateLabel || 'Chargement des données...';
  }

  get effectiveIsLoading(): boolean {
    return this.resolvedConfig.isLoading ?? this.isLoading;
  }

  get showPagination(): boolean {
    if (this.activeGroupByKey !== null) return false;
    return this.resolvedConfig.enablePagination !== false;
  }

  get isColumnDragDropEnabled(): boolean {
    return this.resolvedConfig.enableColumnDragDrop === true;
  }

  get totalRows(): number {
    return this.tableDataSource.data.filter((r) => !r.__groupHeader).length;
  }

  onAddColumn(column: TableColumnProvider<T>): void {
    this.userCustomizedColumns = true;
    this.activeColumns = [...this.activeColumns, column];
    this._preservePageIndex = this.paginator?.pageIndex ?? null;
    this.refreshViewModel();

    if (column.lazy && column.fetchFn) {
      this.triggerLazyFetch(column);
    }

    this.addRequested.emit();
    this.columnAdded.emit(column);
  }

  onColumnVisibilityChange(column: TableColumnProvider<T>, checked: boolean): void {
    const isVisible = this.isColumnVisible(column.key);

    if (checked && !isVisible) {
      this.onAddColumn(column);
      return;
    }

    if (!checked && isVisible) {
      if (!column.optional && !this.allowColumnRemoval) {
        return;
      }

      if (this.activeColumns.length <= 1) {
        return;
      }

      this.userCustomizedColumns = true;
      this.activeColumns = this.activeColumns.filter((item) => item.key !== column.key);
      this._preservePageIndex = this.paginator?.pageIndex ?? null;
      this.refreshViewModel();
      this.columnRemoved.emit(column);
    }
  }

  isColumnVisible(columnKey: string): boolean {
    return this.activeColumns.some((column) => column.key === columnKey);
  }

  onCategorySelected(categoryKey: string): void {
    this.onSliceCategorySelected(0, categoryKey);
    this.categorySelected.emit(categoryKey);
  }

  onSliceCategorySelected(sliceIndex: number, categoryKey: string): void {
    const slice = this.slices[sliceIndex];
    if (!slice) return;

    if (!this.activeKeysBySlice.has(sliceIndex)) {
      this.activeKeysBySlice.set(sliceIndex, new Set());
    }

    const activeKeys = this.activeKeysBySlice.get(sliceIndex)!;
    // Multi-select par défaut (sauf si multiSelect === false)
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

    this.refreshViewModel();
    this.paginator?.firstPage();
  }

  onSliceAllSelected(sliceIndex: number): void {
    if (this.activeKeysBySlice.has(sliceIndex)) {
      this.activeKeysBySlice.get(sliceIndex)!.clear();
    }
    this.refreshViewModel();
    this.paginator?.firstPage();
  }

  onRemoveColumn(columnKey: string, event?: Event): void {
    event?.stopPropagation();
    if (!this.allowColumnRemoval) {
      return;
    }

    const column = this.activeColumns.find((item) => item.key === columnKey);
    if (!column || !this.canRemoveColumn(column)) {
      return;
    }

    this.userCustomizedColumns = true;
    this.activeColumns = this.activeColumns.filter((item) => item.key !== columnKey);

    this.refreshViewModel();
    this.columnRemoved.emit(column);
  }

  toggleSlicePanel(): void {
    this.isSlicePanelCollapsed = !this.isSlicePanelCollapsed;
  }

  getRowClass(row: any): string | string[] | Record<string, boolean> {
    const fn = this.resolvedConfig.rowClass;
    if (!fn || row?.__groupHeader) return {};
    return fn(row.__raw ?? row, row.__index ?? 0);
  }

  onRowClick(row: any): void {
    if (row?.__groupHeader) return;
    this.rowSelected.emit((row?.__raw ?? row) as T);
  }

  onHeaderDragStart(columnKey: string, event: DragEvent): void {
    if (!this.isColumnDragDropEnabled) {
      return;
    }

    this.draggedColumnKey = columnKey;
    this.dragOverColumnKey = null;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', columnKey);
    }
  }

  onHeaderDragOver(columnKey: string, event: DragEvent): void {
    if (!this.isColumnDragDropEnabled || !this.draggedColumnKey) {
      return;
    }

    event.preventDefault();
    this.dragOverColumnKey = columnKey;
  }

  onHeaderDrop(targetColumnKey: string, event: DragEvent): void {
    if (!this.isColumnDragDropEnabled || !this.draggedColumnKey) {
      return;
    }

    event.preventDefault();

    const previousIndex = this.activeColumns.findIndex((column) => column.key === this.draggedColumnKey);
    const currentIndex = this.activeColumns.findIndex((column) => column.key === targetColumnKey);

    if (previousIndex === -1 || currentIndex === -1 || previousIndex === currentIndex) {
      this.onHeaderDragEnd();
      return;
    }

    this.userCustomizedColumns = true;
    const reordered = [...this.activeColumns];
    const [moved] = reordered.splice(previousIndex, 1);
    reordered.splice(currentIndex, 0, moved);
    this.activeColumns = reordered;
    this.refreshViewModel();
    this.onHeaderDragEnd();
  }

  onHeaderDragEnd(): void {
    this.draggedColumnKey = null;
    this.dragOverColumnKey = null;
  }

  isHeaderDropTarget(columnKey: string): boolean {
    return !!this.draggedColumnKey && this.dragOverColumnKey === columnKey && this.draggedColumnKey !== columnKey;
  }

  canRemoveColumn(column: TableColumnProvider<T>): boolean {
    return (
      this.allowColumnRemoval &&
      column.removable !== false &&
      this.activeColumns.length > 1
    );
  }

  isCategoryActive(categoryKey: string): boolean {
    return this.isSliceCategoryActive(0, categoryKey);
  }

  isSliceCategoryActive(sliceIndex: number, categoryKey: string): boolean {
    return this.activeKeysBySlice.get(sliceIndex)?.has(categoryKey) ?? false;
  }

  isSliceAllActive(sliceIndex: number): boolean {
    return !this.activeKeysBySlice.has(sliceIndex) || this.activeKeysBySlice.get(sliceIndex)!.size === 0;
  }

  categoryCount(categoryKey: string): number {
    return this.sliceCategoryCount(0, categoryKey);
  }

  sliceCategoryCount(sliceIndex: number, categoryKey: string): number {
    const slice = this.slices[sliceIndex];
    if (!slice) return 0;
    const category = (slice.categories || []).find((item) => item.key === categoryKey);
    if (!category) return 0;
    return (this.resolvedConfig.data || []).filter((row) => category.filter(row)).length;
  }

  sliceAllCount(sliceIndex: number): number {
    return (this.resolvedConfig.data || []).length;
  }

  asTitle(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  }

  private refreshDynamicSlices(): void {
    const data = this.resolvedConfig.data || [];
    this._dynamicSlices = this._dynamicSlices.map(({ key, slice }) => {
      const distinctValues = [
        ...new Set(
          data
            .map((row) => {
              const val = this.getLazyAwareValue(key, row);
              return val != null && val !== '' ? String(val) : null;
            })
            .filter((v): v is string => v !== null)
        ),
      ].sort();
      return {
        key,
        slice: {
          ...slice,
          categories: distinctValues.map((v) => ({
            key: v,
            label: v,
            filter: (row: T) => String(this.getLazyAwareValue(key, row) ?? '') === v,
          })),
        },
      };
    });
  }

  private refreshViewModel(): void {
    this.resolvedConfig = this.buildEffectiveConfig();
    this.refreshDynamicSlices();
    const defaultColumns = (this.resolvedConfig.columns || []).filter(c => !c.optional);

    if (!this.userCustomizedColumns || this.activeColumns.length === 0) {
      this.activeColumns = [...defaultColumns];
    } else {
      const allowedKeys = new Set(
        (this.resolvedConfig.columns || []).map((column) => column.key)
      );
      this.activeColumns = this.activeColumns.filter((column) => allowedKeys.has(column.key));
    }

    this.renderedColumns = this.activeColumns.map((column) => column.key);

    const categoryRows = this.getCategoryFilteredData();
    const projectedRows = this.projectRows(categoryRows);

    this.pageSize = this.paginator?.pageSize || this.resolvePageSize();
    this.pageSizeOptions = this.resolvePageSizeOptions();
    this.pageSizeOptionsGroupBy = this.resolvePageSizeOptionsGroupBy();
    if (this.groupPageSize !== 0 && !this.pageSizeOptionsGroupBy.includes(this.groupPageSize)) {
      this.groupPageSize = this.resolveDefaultGroupPageSize();
    }
    this.tableDataSource.data = projectedRows;
    this.attachPaginator();
    this.attachSort();
  }

  private buildEffectiveConfig(): TableProvider<T> {
    const config = this.config || {};
    const rows = this.resolveData();

    const columns =
      config.columns ||
      this.columnsConfig ||
      this.resolveColumnsFromCompat(rows);

    return {
      ...config,
      data: rows,
      columns,
      enableSearchBar: config.enableSearchBar ?? false,
      enableViewButton: config.enableViewButton ?? false,
      showSliceToggle: config.showSliceToggle ?? true,
      slices: config.slices || [],
      allowColumnRemoval: config.allowColumnRemoval ?? true,
      enablePagination: config.enablePagination ?? true,
      enableColumnDragDrop: config.enableColumnDragDrop ?? false,
      pageSize: config.pageSize || 5,
      pageSizeOptions: config.pageSizeOptions || [5, 10, 20],
      pageSizeOptionsGroupBy: config.pageSizeOptionsGroupBy || undefined,
      isLoading: config.isLoading ?? false,
      loadingStateLabel: config.loadingStateLabel,
    };
  }

  private resolveData(): T[] {
    if (Array.isArray(this.config?.data)) {
      return this.config.data;
    }

    if (Array.isArray(this.data)) {
      return this.data;
    }

    if (Array.isArray(this.dataSource)) {
      return this.dataSource;
    }

    if (this.dataSource && Array.isArray((this.dataSource as any).data)) {
      return (this.dataSource as any).data;
    }

    return [];
  }

  private resolveColumnsFromCompat(rows: T[]): TableColumnProvider<T>[] {
    if (this.displayedColumns?.length) {
      return this.displayedColumns.map((key) => ({
        key,
        header: this.columnLabels?.[key] || this.humanizeKey(key),
      }));
    }

    const firstRow = rows[0] as any;
    if (!firstRow || typeof firstRow !== 'object') {
      return [];
    }

    return Object.keys(firstRow).map((key) => ({
      key,
      header: this.columnLabels?.[key] || this.humanizeKey(key),
    }));
  }

  private getCategoryFilteredData(): T[] {
    const data = this.resolvedConfig.data || [];

    let filtered = data;
    if (this.showSlicePanel) {
      filtered = data.filter((row) =>
        this.slices.every((slice, sliceIndex) => {
          const activeKeys = this.activeKeysBySlice.get(sliceIndex);
          if (!activeKeys || activeKeys.size === 0) return true;
          return [...activeKeys].some((key) => {
            const category = (slice.categories || []).find((c) => c.key === key);
            return category ? category.filter(row) : false;
          });
        })
      );
    }

    const query = this.searchQuery?.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter((row) =>
        this.activeColumns.some((col) => {
          const val = this.getLazyAwareValue(col.key, row);
          return val != null && String(val).toLowerCase().includes(query);
        })
      );
    }
    return filtered;
  }

  private projectRows(rows: T[]): any[] {
    const groupKey = this.activeGroupByKey;

    if (!groupKey) {
      const result: any[] = [];
      rows.forEach((row, index) => {
        const projected: any = { __raw: row, __index: index };
        this.activeColumns.forEach((col) => {
          projected[col.key] = this.resolveCellValue(col, row, index);
        });
        result.push(projected);
      });
      return result;
    }

    const groupColDef = (this.resolvedConfig.columns || []).find(c => c.key === groupKey);
    const groupLazyStatus = groupColDef?.lazy ? (this._lazyColumnStatus.get(groupKey) ?? 'idle') : 'loaded';

    if (groupLazyStatus !== 'loaded') {
      this._totalFilteredCount = rows.length;
      return [{ __groupHeader: true, __groupKey: '__lazy_loading__', __groupCount: rows.length, __groupPage: 0, __groupPageCount: 1 }];
    }

    const sorted = [...rows].sort((a, b) => {
      const va = String(this.getLazyAwareValue(groupKey, a) ?? '');
      const vb = String(this.getLazyAwareValue(groupKey, b) ?? '');
      return va.localeCompare(vb);
    });

    const groupOrder: string[] = [];
    const groupMap = new Map<string, T[]>();
    sorted.forEach((row) => {
      const groupValue = String(this.getLazyAwareValue(groupKey, row) ?? '');
      if (!groupMap.has(groupValue)) {
        groupOrder.push(groupValue);
        groupMap.set(groupValue, []);
      }
      groupMap.get(groupValue)!.push(row);
    });

    this._totalFilteredCount = rows.length;
    const pageSize = this.groupPageSize;
    const result: any[] = [];

    groupOrder.forEach((groupValue) => {
      const groupRows = groupMap.get(groupValue)!;
      const totalCount = groupRows.length;
      const currentPage = pageSize === 0 ? 0 : (this._groupPages.get(groupValue) ?? 0);
      const pageCount = pageSize === 0 ? 1 : Math.max(1, Math.ceil(totalCount / pageSize));
      const collapsed = this.isGroupCollapsed(groupValue);

      result.push({ __groupHeader: true, __groupKey: groupValue, __groupCount: totalCount, __groupPage: currentPage, __groupPageCount: pageCount });

      if (!collapsed) {
        const start = pageSize === 0 ? 0 : currentPage * pageSize;
        const end = pageSize === 0 ? totalCount : Math.min(start + pageSize, totalCount);
        groupRows.slice(start, end).forEach((row, i) => {
          const idx = start + i;
          const projected: any = { __raw: row, __index: idx };
          this.activeColumns.forEach((col) => {
            projected[col.key] = this.resolveCellValue(col, row, idx);
          });
          result.push(projected);
        });
      }
    });

    return result;
  }

  private normalizeCellValue(value: any): any {
    if (value === null || value === undefined) {
      return '';
    }

    if (value instanceof Date) {
      return value.toLocaleString('fr-FR');
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.normalizeCellValue(item)).join(', ');
    }

    if (typeof value === 'object') {
      if ('label' in value && value.label !== undefined) {
        return String(value.label);
      }
      if ('name' in value && value.name !== undefined) {
        return String(value.name);
      }
      return JSON.stringify(value);
    }

    return value;
  }

  private getLazyAwareValue(columnKey: string, row: T): any {
    const colDef = (this.resolvedConfig.columns || []).find(c => c.key === columnKey);
    if (colDef?.lazy) {
      return this._lazyColumnData.get(columnKey)?.get(row) ?? null;
    }
    return (row as any)[columnKey];
  }

  private resolveCellValue(col: TableColumnProvider<T>, row: T, index: number): any {
    if (col.lazy) {
      const status = this._lazyColumnStatus.get(col.key) ?? 'idle';
      if (status === 'loading') return '__lazy_loading__';
      if (status === 'error') return '__lazy_error__';
      if (status === 'loaded') {
        const rowMap = this._lazyColumnData.get(col.key);
        return this.normalizeCellValue(rowMap?.get(row) ?? '');
      }
      return '';
    }
    const valueProvider = col.value;
    const rawValue = valueProvider ? valueProvider(row, index) : (row as any)?.[col.key];
    return this.normalizeCellValue(rawValue);
  }

  private resolvePageSize(): number {
    return Math.max(1, this.resolvedConfig.pageSize || this.pageSize || 5);
  }

  private resolvePageSizeOptions(): number[] {
    const options = this.resolvedConfig.pageSizeOptions || [5, 10, 20];
    const unique = [...new Set(options.filter((value) => value > 0))];

    if (!unique.includes(this.pageSize)) {
      unique.push(this.pageSize);
    }

    return unique.sort((a, b) => a - b);
  }

  private resolvePageSizeOptionsGroupBy(): number[] {
    const options = this.resolvedConfig.pageSizeOptionsGroupBy || this.resolvedConfig.pageSizeOptions || [5, 10, 20];
    const unique = [...new Set(options.filter((v) => v > 0))];
    if (this.groupPageSize > 0 && !unique.includes(this.groupPageSize)) {
      unique.push(this.groupPageSize);
    }
    return unique.sort((a, b) => a - b);
  }

  private resolveDefaultGroupPageSize(): number {
    const cfg = this.resolvedConfig;
    const options = cfg.pageSizeOptionsGroupBy || cfg.pageSizeOptions;
    if (options?.length) return options[0];
    return cfg.pageSize || 5;
  }

  private uniqueColumnsByKey(columns: TableColumnProvider<T>[]): TableColumnProvider<T>[] {
    const seen = new Set<string>();
    return columns.filter((column) => {
      if (seen.has(column.key)) {
        return false;
      }
      seen.add(column.key);
      return true;
    });
  }

  private attachPaginator(): void {
    if (!this.showPagination) {
      this.tableDataSource.paginator = null;
      return;
    }

    if (this.paginator) {
      const savedIndex = this._preservePageIndex ?? this.paginator.pageIndex;
      this.paginator.pageSize = this.pageSize;
      this.tableDataSource.paginator = this.paginator;
      this.paginator.pageIndex = savedIndex;
      this._preservePageIndex = null;
    }
  }

  private attachSort(): void {
    if (this.sort && this.tableDataSource.sort !== this.sort) {
      this.tableDataSource.sort = this.sort;
    }
  }

  private humanizeKey(key: string): string {
    return key
      .replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replaceAll(/[_-]+/g, ' ')
      .replace(/^./, (value) => value.toUpperCase());
  }
}
