import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChildren, ElementRef, EventEmitter, inject, Input, OnChanges, OnDestroy, Output, QueryList, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Subject, take, takeUntil } from 'rxjs';
import { TableColumnProvider, TableProvider } from '../jquery-table.model';
import { JqtCellDefDirective } from '../directive/jqt-cell-def.directive';
import { SlicePanelComponent } from './slice-panel/slice-panel.component';
import { getFrenchPaginatorIntl, humanizeKey, normalizeCellValue } from './table.utils';

@Component({
  standalone: true,
  selector: 'jquery-table',
  imports: [ CommonModule, FormsModule, MatTableModule, MatButtonModule, MatPaginatorModule, MatSortModule, MatMenuModule, MatIconModule, MatSelectModule, SlicePanelComponent ],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: MatPaginatorIntl, useFactory: getFrenchPaginatorIntl }],
})
export class TableComponent<T = any> implements OnChanges, AfterViewInit, OnDestroy {
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

  @ViewChild(MatPaginator)
  set paginator(value: MatPaginator | undefined) {
    this._paginator = value;
    if (value) {
      this.attachPaginator();
      this._scheduleRender();
    }
  }
  get paginator(): MatPaginator | undefined { return this._paginator; }
  private _paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;
  @ViewChild('tableBodyScroll') tableBodyScrollRef?: ElementRef<HTMLElement>;
  @ViewChild(SlicePanelComponent) slicePanelRef?: SlicePanelComponent<T>;
  @ViewChild('viewMenuTrigger') viewMenuTrigger?: MatMenuTrigger;
  @ContentChildren(JqtCellDefDirective) _cellDefs!: QueryList<JqtCellDefDirective>;

  renderedColumns: string[] = [];
  tableDataSource = new MatTableDataSource<any>([]);
  activeColumns: TableColumnProvider<T>[] = [];

  activeSliceFilter: (row: T) => boolean = () => true;

  // Propriétés stables pour les bindings du template (contre erreur NG0100)
  _sliceConfigs: any[] = [];
  _sliceColumns: TableColumnProvider<T>[] = [];
  _sliceData: T[] = [];
  _sliceShowToggle = true;
  _staticSlicesForMenu: Array<{ key: string; title: string; icon?: string }> = [];
  _activeDynamicSliceColumns: TableColumnProvider<T>[] = [];
  _availableColumnsForDynamicSlice: TableColumnProvider<T>[] = [];
  _allDynamicSliceColumns: TableColumnProvider<T>[] = [];
  _activeSliceByLabel = 'Aucun';

  searchQuery = '';
  activeGroupByKey: string | null = null;
  _matSortActive = '';
  _matSortDirection: 'asc' | 'desc' | '' = '';
  private _collapsedGroups = new Set<string>();
  private _activeSort: { active: string; direction: 'asc' | 'desc' | '' } = { active: '', direction: '' };
  private _sortSubscribed: MatSort | null = null;
  private _destroy$ = new Subject<void>();
  private _defaultGroupCollapsed = false;
  private _groupPages = new Map<string, number>();
  private _totalFilteredCount = 0;

  _lazyColumnStatus = new Map<string, 'idle' | 'loading' | 'loaded' | 'error'>();
  _lazyColumnData = new Map<string, Map<any, any>>();
  private _lazyFetchCancels = new Map<string, Subject<void>>();
  private _cdr = inject(ChangeDetectorRef);
  private _el = inject(ElementRef<HTMLElement>);

  isGroupHeader = (_: number, row: any): boolean => row.__groupHeader === true;

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  pageSize = 5;
  pageSizeOptions: number[] = [5, 10, 20];
  pageSizeOptionsGroupBy: number[] = [5, 10, 20];
  groupPageSize = 5;
  groupSortOrder: 'asc' | 'desc' = 'asc';

  draggedColumnKey: string | null = null;
  dragOverColumnKey: string | null = null;

  private userCustomizedColumns = false;
  private resolvedConfig: TableProvider<T> = { columns: [] };
  private _resolvedData: T[] = [];
  private _preservePageIndex: number | null = null;
  private _initialSearchApplied = false;

  // ── Optimisation performance ─────────────────────────────────────────────
  private _allFilteredRows: T[] = [];
  private _paginatorSubscribed: MatPaginator | null = null;
  private _pendingRender: ReturnType<typeof setTimeout> | null = null;


  ngOnChanges(changes: SimpleChanges): void {
    const dataChanged = !!(changes['config'] || changes['data'] || changes['dataSource']);
    if (dataChanged) {
      this._lazyFetchCancels.forEach(s => { s.next(); s.complete(); });
      this._lazyFetchCancels.clear();
      this._lazyColumnStatus = new Map();
      this._lazyColumnData = new Map();
    }
    if (changes['config'] && !this._initialSearchApplied) {
      const initial = this.config?.initialSearchQuery;
      if (initial != null) {
        this.searchQuery = initial;
        this._initialSearchApplied = true;
      }
    }
    this.refreshViewModel();
    if (dataChanged) {
      this.activeColumns.filter(c => c.lazy && c.fetchFn).forEach(c => this.triggerLazyFetch(c));
    }
  }

  ngAfterViewInit(): void {
    this.attachPaginator();
    this.attachSort();
    this._measureHeaderHeight();
  }

  ngOnDestroy(): void {
    if (this._pendingRender !== null) {
      clearTimeout(this._pendingRender);
    }
    this._destroy$.next();
    this._destroy$.complete();
  }

  private _measureHeaderHeight(): void {
    const headerRow = this._el.nativeElement.querySelector('tr.mat-mdc-header-row') as HTMLElement;
    if (headerRow) {
      const h = headerRow.getBoundingClientRect().height;
      if (h > 0) {
        this._el.nativeElement.style.setProperty('--actual-header-height', h + 'px');
      }
    }
  }

  // ── Getters d'affichage ────────────────────────────────────────────────────

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
    return this.activeGroupByKey ? this._totalFilteredCount : this._allFilteredRows.length;
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
    return this._activeSliceByLabel;
  }

  get activeDynamicSliceColumns(): TableColumnProvider<T>[] {
    return this._activeDynamicSliceColumns;
  }

  removeDynamicSliceByKey(key: string): void {
    this.slicePanelRef?.removeDynamicSliceByKey(key);
  }

  get groupByColumns(): TableColumnProvider<T>[] {
    const all = this.resolvedConfig.columns || [];
    const seen = new Set<string>();
    return all.filter((c) => {
      if (c.groupable === false || seen.has(c.key)) return false;
      if (!c.header && c.groupable !== true) return false;
      seen.add(c.key);
      return true;
    });
  }

  colLabel(col: { key: string; header?: string }): string {
    return col.header || humanizeKey(col.key);
  }

  // ── Actions utilisateur ────────────────────────────────────────────────────

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
      this.viewMenuTrigger?.closeMenu();
      const colDef = (this.resolvedConfig.columns || []).find(c => c.key === key);
      if (colDef?.lazy && colDef.fetchFn && this._lazyColumnStatus.get(key) !== 'loaded') {
        this.triggerLazyFetch(colDef);
      }
    } else {
      setTimeout(() => {
        this.tableBodyScrollRef?.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
      }, 0);
    }
  }

  onGroupPageSizeChange(size: number | string): void {
    this.groupPageSize = Number(size);
    this._groupPages.clear();
    this.refreshViewModel();
  }

  onGroupSortToggle(dir: 'asc' | 'desc'): void {
    if (this.groupSortOrder === dir) return;
    this.groupSortOrder = dir;
    this._groupPages.clear();
    this.refreshViewModel();
    const openGroup = this._defaultGroupCollapsed
      ? (this._collapsedGroups.size === 1 ? [...this._collapsedGroups][0] : null)
      : null;
    if (openGroup) {
      setTimeout(() => this.scrollToGroupHeader(openGroup), 0);
    }
  }

  // ── Lazy loading ─────────────────────────────────────────────────────────

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
    const newStatus = new Map(this._lazyColumnStatus);
    newStatus.delete(k);
    this._lazyColumnStatus = newStatus;
    const newData = new Map(this._lazyColumnData);
    newData.delete(k);
    this._lazyColumnData = newData;
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

    const newStatus1 = new Map(this._lazyColumnStatus);
    newStatus1.set(k, 'loading');
    this._lazyColumnStatus = newStatus1;
    this.refreshViewModel();

    column.fetchFn().pipe(
      take(1),
      takeUntil(cancel$),
    ).subscribe({
      next: (values: any[]) => {
        const rowMap = new Map<any, any>();
        const data = this._resolvedData;
        values.forEach((value, i) => {
          if (i < data.length) rowMap.set(data[i], value);
        });
        const newData = new Map(this._lazyColumnData);
        newData.set(k, rowMap);
        this._lazyColumnData = newData;
        const newStatus2 = new Map(this._lazyColumnStatus);
        newStatus2.set(k, 'loaded');
        this._lazyColumnStatus = newStatus2;
        this.refreshViewModel();
        this._cdr.markForCheck();
      },
      error: () => {
        const newStatusErr = new Map(this._lazyColumnStatus);
        newStatusErr.set(k, 'error');
        this._lazyColumnStatus = newStatusErr;
        this.refreshViewModel();
        this._cdr.markForCheck();
      },
    });
  }

  // ── Groupement ────────────────────────────────────────────────────────────

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
      this._el.nativeElement.style.getPropertyValue('--actual-header-height') || '56'
    ) || 56;
    const containerRect = container.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const currentScrollTop = container.scrollTop;
    const targetScrollTop = currentScrollTop + (rowRect.top - containerRect.top) - headerHeight;
    container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
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

  // ── Colonnes ──────────────────────────────────────────────────────────────

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

  // ── Slices ────────────────────────────────────────────────────────────────

  get hasSliceConfig(): boolean {
    return (this.resolvedConfig.slices?.length ?? 0) > 0;
  }

  get showSlicePanel(): boolean {
    return this.slicePanelRef?.showPanel ?? (this.hasSliceConfig && this._resolvedData.length > 0);
  }

  get showAddSliceButton(): boolean { return this.showToolbar; }

  get staticSlicesForMenu(): Array<{ key: string; title: string; icon?: string }> {
    return this._staticSlicesForMenu;
  }

  get availableColumnsForDynamicSlice(): TableColumnProvider<T>[] {
    return this._availableColumnsForDynamicSlice;
  }

  isStaticSliceVisible(columnKey: string): boolean {
    return this.slicePanelRef?.isStaticSliceVisible(columnKey) ?? true;
  }

  toggleStaticSlice(columnKey: string): void {
    this.slicePanelRef?.toggleStaticSlice(columnKey);
  }

  addDynamicSlice(column: TableColumnProvider<T>): void {
    this.slicePanelRef?.addDynamicSlice(column);
    if (column.lazy && column.fetchFn && this._lazyColumnStatus.get(column.key) !== 'loaded') {
      this.triggerLazyFetch(column);
    }
  }

  get allDynamicSliceColumns(): TableColumnProvider<T>[] {
    return this._allDynamicSliceColumns;
  }

  isDynamicSliceActive(key: string): boolean {
    return this._activeDynamicSliceColumns.some(c => c.key === key);
  }

  toggleDynamicSlice(col: TableColumnProvider<T>): void {
    if (this.isDynamicSliceActive(col.key)) {
      this.removeDynamicSliceByKey(col.key);
    } else {
      this.addDynamicSlice(col);
    }
  }

  onSliceFilterChange(pred: (row: T) => boolean): void {
    this.activeSliceFilter = pred;
    this._preservePageIndex = 0;
    this.refreshViewModel();
    this.paginator?.firstPage();
  }

  onDynamicSliceKeysChange(keys: string[]): void {
    const allCols = this.resolvedConfig.columns ?? [];
    const staticKeys = new Set(
      (this.resolvedConfig.slices ?? []).map(s => s.columnKey).filter((k): k is string => !!k)
    );
    const dynamicKeySet = new Set(keys);
    const existingKeys = new Set([...staticKeys, ...dynamicKeySet]);
    this._activeDynamicSliceColumns = keys
      .map(k => allCols.find(c => c.key === k))
      .filter((c): c is TableColumnProvider<T> => !!c);
    const seen = new Set<string>();
    this._availableColumnsForDynamicSlice = allCols.filter(c => {
      if (c.sliceable === false || existingKeys.has(c.key) || seen.has(c.key)) return false;
      seen.add(c.key);
      return true;
    });
    this._computeSliceLabel();
    this._cdr.markForCheck();
  }

  get emptyStateLabel(): string {
    return this.resolvedConfig.emptyStateLabel || 'Aucune donnée';
  }

  get loadingStateLabel(): string {
    return this.resolvedConfig.loadingStateLabel || 'Chargement des données...';
  }

  get effectiveIsLoading(): boolean {
    return this.isLoading || this._pendingRender !== null;
  }

  get isEmpty(): boolean {
    return !this.effectiveIsLoading && this._allFilteredRows.length === 0;
  }

  get showPagination(): boolean {
    if (this.activeGroupByKey !== null) return false;
    return this.resolvedConfig.enablePagination !== false;
  }

  get isColumnDragDropEnabled(): boolean {
    return this.resolvedConfig.enableColumnDragDrop === true;
  }

  get totalRows(): number {
    return this.activeGroupByKey
      ? this.tableDataSource.data.filter((r) => !r.__groupHeader).length
      : this._allFilteredRows.length;
  }

  // ── Gestion des colonnes ─────────────────────────────────────────────────

  onAddColumn(column: TableColumnProvider<T>): void {
    this.userCustomizedColumns = true;
    const configCols = this.resolvedConfig.columns ?? [];
    const configIndex = configCols.findIndex(c => c.key === column.key);
    if (configIndex === -1) {
      this.activeColumns = [...this.activeColumns, column];
    } else {
      const insertBefore = this.activeColumns.findIndex(c => {
        const ci = configCols.findIndex(cc => cc.key === c.key);
        return ci !== -1 && ci > configIndex;
      });
      if (insertBefore === -1) {
        this.activeColumns = [...this.activeColumns, column];
      } else {
        const copy = [...this.activeColumns];
        copy.splice(insertBefore, 0, column);
        this.activeColumns = copy;
      }
    }
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

  // ── Lignes ────────────────────────────────────────────────────────────────

  getCellTemplate(key: string): TemplateRef<{ $implicit: any; index: number }> | null {
    return this._cellDefs?.find((d) => d.columnKey === key)?.template ?? null;
  }

  get hasCustomCellDefs(): boolean {
    return (this._cellDefs?.length ?? 0) > 0;
  }

  trackRowFn = (_index: number, row: any): any =>
    row.__groupHeader ? `__group_${row.__groupKey}` : row.__index ?? _index;

  getRowClass(row: any): string | string[] | Record<string, boolean> {
    const fn = this.resolvedConfig.rowClass;
    if (!fn || row?.__groupHeader) return {};
    return fn(row.__raw ?? row, row.__index ?? 0);
  }

  onRowClick(row: any): void {
    if (row?.__groupHeader) return;
    if (this.hasCustomCellDefs) return;
    this.rowSelected.emit((row?.__raw ?? row) as T);
  }

  // ── Drag & drop ───────────────────────────────────────────────────────────

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

  asTitle(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  }

  // ── Pipeline de données (privé) ──────────────────────────────────────────

  private refreshViewModel(): void {
    this._resolvedData = this.resolveData();
    this.resolvedConfig = this.buildEffectiveConfig();
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

    this.pageSize = this.paginator?.pageSize || this.resolvePageSize();
    this.pageSizeOptions = this.resolvePageSizeOptions();
    this.pageSizeOptionsGroupBy = this.resolvePageSizeOptionsGroupBy();
    if (this.groupPageSize !== 0 && !this.pageSizeOptionsGroupBy.includes(this.groupPageSize)) {
      this.groupPageSize = this.resolveDefaultGroupPageSize();
    }

    this.attachPaginator();
    this.attachSort();

    // Mise à jour des propriétés stables pour les bindings du template
    this._sliceConfigs = this.resolvedConfig.slices ?? [];
    this._sliceColumns = this.resolvedConfig.columns ?? [];
    this._sliceData = this._resolvedData;
    this._sliceShowToggle = this.resolvedConfig.showSliceToggle !== false;
    this._staticSlicesForMenu = (this.resolvedConfig.slices ?? [])
      .filter(s => !!s.columnKey)
      .map(s => {
        const colIcon = (this.resolvedConfig.columns ?? []).find(c => c.key === s.columnKey)?.icon;
        return { key: s.columnKey!, title: s.title || humanizeKey(s.columnKey!), icon: s.icon ?? colIcon };
      });
    if (!this._activeSort.active && this.resolvedConfig.defaultSort) {
      this._matSortActive = this.resolvedConfig.defaultSort.active;
      this._matSortDirection = this.resolvedConfig.defaultSort.direction;
    }
    const staticKeys = new Set(
      (this.resolvedConfig.slices ?? []).map(s => s.columnKey).filter((k): k is string => !!k)
    );
    const activeDynKeys = new Set(this._activeDynamicSliceColumns.map(c => c.key));
    const seen = new Set<string>();
    this._availableColumnsForDynamicSlice = (this.resolvedConfig.columns ?? []).filter(c => {
      if (c.sliceable === false || staticKeys.has(c.key) || activeDynKeys.has(c.key) || seen.has(c.key)) return false;
      if (!c.header && c.sliceable !== true) return false;
      seen.add(c.key);
      return true;
    });
    const seen2 = new Set<string>();
    this._allDynamicSliceColumns = (this.resolvedConfig.columns ?? []).filter(c => {
      if (c.sliceable === false || staticKeys.has(c.key) || seen2.has(c.key)) return false;
      if (!c.header && c.sliceable !== true) return false;
      seen2.add(c.key);
      return true;
    });
    this._computeSliceLabel();

    this._scheduleRender();
  }

  private _computeSliceLabel(): void {
    const visibleStaticCount = this.slicePanelRef?.staticSliceCount
      ?? this._sliceConfigs.length;
    const total = visibleStaticCount + this._activeDynamicSliceColumns.length;
    if (total === 0) { this._activeSliceByLabel = 'Aucun'; return; }
    if (total === 1) {
      if (visibleStaticCount === 1) {
        const first = this._sliceConfigs.find(
          s => !s.columnKey || this.isStaticSliceVisible(s.columnKey)
        );
        this._activeSliceByLabel = first?.title || first?.columnKey || '1';
        return;
      }
      this._activeSliceByLabel = this._activeDynamicSliceColumns[0]?.header || '1';
      return;
    }
    this._activeSliceByLabel = `${total} actifs`;
  }

  private _scheduleRender(): void {
    if (this._pendingRender !== null) {
      clearTimeout(this._pendingRender);
      this._pendingRender = null;
    }
    this._pendingRender = setTimeout(() => {
      this._pendingRender = null;
      this._executeRender();
    }, 0);
  }

  private _executeRender(): void {
    const categoryRows = this.getCategoryFilteredData();
    const compareFn = this._buildSortComparator();
    this._allFilteredRows = compareFn ? [...categoryRows].sort(compareFn) : categoryRows;

    // Mettre à jour le paginator avec le nouveau total
    if (this.paginator) {
      const savedIndex = this._preservePageIndex ?? this.paginator.pageIndex;
      const maxPage = Math.max(0, Math.ceil(this._allFilteredRows.length / this.pageSize) - 1);
      this.paginator.length = this._allFilteredRows.length;
      this.paginator.pageIndex = Math.min(savedIndex, maxPage);
      this._preservePageIndex = null;
    }

    this._projectCurrentPage();
    this._cdr.markForCheck();
  }

  private _projectCurrentPage(): void {
    if (this.activeGroupByKey) {
      this.tableDataSource.data = this.projectRows(this._allFilteredRows);
      return;
    }

    const pageIndex = this.paginator?.pageIndex ?? 0;
    const start = pageIndex * this.pageSize;
    const pageRows = this._allFilteredRows.slice(start, start + this.pageSize);

    const projected: any[] = [];
    pageRows.forEach((row, i) => {
      const idx = start + i;
      const p: any = { __raw: row, __index: idx };
      this.activeColumns.forEach((col) => {
        p[col.key] = this.resolveCellValue(col, row, idx);
      });
      projected.push(p);
    });
    this.tableDataSource.data = projected;
  }

  private buildEffectiveConfig(): TableProvider<T> {
    const config = this.config || {};
    const rows = this._resolvedData;

    const columns =
      config.columns ||
      this.columnsConfig ||
      this.resolveColumnsFromCompat(rows);

    return {
      ...config,
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
      loadingStateLabel: config.loadingStateLabel,
    };
  }

  private resolveData(): T[] {
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
        header: this.columnLabels?.[key] || humanizeKey(key),
      }));
    }

    const firstRow = rows[0] as any;
    if (!firstRow || typeof firstRow !== 'object') {
      return [];
    }

    return Object.keys(firstRow).map((key) => ({
      key,
      header: this.columnLabels?.[key] || humanizeKey(key),
    }));
  }

  private getCategoryFilteredData(): T[] {
    const data = this._resolvedData;

    let filtered = data.filter(this.activeSliceFilter);

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
      const cmp = va.localeCompare(vb);
      return this.groupSortOrder === 'desc' ? -cmp : cmp;
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
    const compareFn = this._buildSortComparator();

    groupOrder.forEach((groupValue) => {
      const rawGroupRows = groupMap.get(groupValue)!;
      const groupRows = compareFn ? [...rawGroupRows].sort(compareFn) : rawGroupRows;
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

  private _buildSortComparator(): ((a: T, b: T) => number) | null {
    const sort = this._activeSort.active && this._activeSort.direction
      ? this._activeSort
      : this.resolvedConfig.defaultSort ?? { active: '', direction: '' as const };
    const { active, direction } = sort;
    if (!active || !direction) return null;
    return (a: T, b: T): number => {
      const va = this.getLazyAwareValue(active, a);
      const vb = this.getLazyAwareValue(active, b);
      let cmp = 0;
      if (typeof va === 'number' && typeof vb === 'number') {
        cmp = va < vb ? -1 : va > vb ? 1 : 0;
      } else {
        const sa = va == null ? '' : String(va).toLowerCase();
        const sb = vb == null ? '' : String(vb).toLowerCase();
        cmp = sa < sb ? -1 : sa > sb ? 1 : 0;
      }
      return direction === 'asc' ? cmp : -cmp;
    };
  }

  private getLazyAwareValue(columnKey: string, row: T): any {
    const colDef = (this.resolvedConfig.columns || []).find(c => c.key === columnKey);
    if (colDef?.lazy) {
      return this._lazyColumnData.get(columnKey)?.get(row) ?? null;
    }
    if (colDef?.sortValue) {
      return normalizeCellValue(colDef.sortValue(row, 0));
    }
    if (colDef?.value) {
      return normalizeCellValue(colDef.value(row, 0));
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
        return normalizeCellValue(rowMap?.get(row) ?? '');
      }
      return '';
    }
    const valueProvider = col.value;
    const rawValue = valueProvider ? valueProvider(row, index) : (row as any)?.[col.key];
    return normalizeCellValue(rawValue);
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
    if (!this.paginator) return;

    this.tableDataSource.paginator = null;
    this.paginator.pageSize = this.pageSize;

    if (this._paginatorSubscribed !== this.paginator) {
      this._paginatorSubscribed = this.paginator;
      this.paginator.page.pipe(takeUntil(this._destroy$)).subscribe(() => {
        this.pageSize = this.paginator!.pageSize;
        if (this._pendingRender !== null) return;
        this._projectCurrentPage();
        this._cdr.markForCheck();
      });
    }
  }

  private attachSort(): void {
    if (!this.sort) return;

    this.tableDataSource.sort = null as any;

    if (this._sortSubscribed !== this.sort) {
      this._sortSubscribed = this.sort;
      this.sort.sortChange.pipe(takeUntil(this._destroy$)).subscribe(() => {
        this._activeSort = {
          active: this.sort.active,
          direction: this.sort.direction,
        };
        this._scheduleRender();
      });
    }
  }

}

