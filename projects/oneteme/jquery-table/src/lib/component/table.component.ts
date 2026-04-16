import { CommonModule } from '@angular/common';
import { AfterContentInit, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChildren, ElementRef, EventEmitter, inject, Input, NgZone, OnChanges, OnDestroy, Output, QueryList, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';
import { TableColumnProvider, TableProvider, TableViewConfig } from '../jquery-table.model';
import { JqtI18n, JQT_I18N, JQT_I18N_DEFAULTS } from '../jqt-i18n.token';
import { JqtCellDefDirective } from '../directive/jqt-cell-def.directive';
import { SliceConfig } from './slice-panel/slice-panel.model';
import { SlicePanelComponent } from './slice-panel/slice-panel.component';
import { getFrenchPaginatorIntl, humanizeKey, normalizeCellValue } from './table.utils';
import { ViewFacade } from './view/view.facade';
import { LazyColumnManager } from './lazy-column-manager';
import { TablePreferencesManager } from './table-preferences.manager';
import { GroupByManager } from './group-by.manager';
import { ExportManager } from './export.manager';
import {
  GROUP_ROW_COLUMN, GROUP_HEADER_MARKER,
  GROUP_KEY_LAZY_LOADING, GROUP_KEY_TOO_MANY,
  ROW_RAW_KEY, ROW_INDEX_KEY,
  ROW_GROUP_KEY, ROW_GROUP_COUNT, ROW_GROUP_PAGE, ROW_GROUP_PAGE_COUNT,
  LAZY_LOADING_VALUE, LAZY_ERROR_VALUE,
} from './table.constants';

/** Cache interne du groupement — invalidé dès que les données, la clé ou les paramètres de tri changent. */
interface GroupByCache<T> {
  rows: T[];
  key: string;
  sortOrder: 'asc' | 'desc';
  sortActive: string;
  sortDir: string;
  order: string[];
  map: Map<string, T[]>;
}

@Component({
  standalone: true,
  selector: 'jquery-table',
  imports: [ CommonModule, FormsModule, MatTableModule, MatButtonModule, MatDividerModule, MatPaginatorModule, MatSortModule, MatMenuModule, MatIconModule, MatSelectModule, SlicePanelComponent ],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: MatPaginatorIntl, useFactory: getFrenchPaginatorIntl }],
})
export class TableComponent<T = any> implements OnChanges, AfterContentInit, AfterViewInit, OnDestroy {
  @Input() config?: TableProvider<T>;

  @Input() dataSource?: T[] | { data: T[] };
  @Input() data?: T[];
  @Input() displayedColumns?: string[];
  @Input() columnsConfig?: TableColumnProvider<T>[];

  /**
   * Mode HTML : active et configure le panneau View indépendamment du `[config]`.
   * Prend le dessus sur `config.view` si défini.
   * Exemple : `<jquery-table [view]="{ enabled: true }">`
   */
  @Input() view?: TableViewConfig;

  @Input() columnLabels?: Record<string, string>;
  @Input() isLoading = false;

  @Output() addRequested = new EventEmitter<void>();
  @Output() columnAdded = new EventEmitter<TableColumnProvider<T>>();
  @Output() columnRemoved = new EventEmitter<TableColumnProvider<T>>();
  @Output() categorySelected = new EventEmitter<string>();
  @Output() rowSelected = new EventEmitter<T>();

  /** Émis à chaque changement de tri (y compris le tri initial). */
  @Output() sortChange    = new EventEmitter<{ active: string; direction: 'asc' | 'desc' | '' }>();
  /** Émis à chaque changement de page ou de taille de page. */
  @Output() pageChange    = new EventEmitter<{ pageIndex: number; pageSize: number }>();
  /** Émis à chaque changement de la recherche texte. */
  @Output() searchChange  = new EventEmitter<string>();
  /** Émis quand le Group by change (clé de colonne, ou `null` si désactivé). */
  @Output() groupByChange = new EventEmitter<string | null>();
  /** Émis quand la liste des colonnes visibles change (clés dans l’ordre d’affichage). */
  @Output() columnsChange = new EventEmitter<string[]>();

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
  /** Map clé→TemplateRef pré-calculée depuis _cellDefs. Mise à jour dans ngAfterContentInit et sur _cellDefs.changes. */
  private _cellDefMap = new Map<string, TemplateRef<{ $implicit: any; index: number }>>();

  renderedColumns: string[] = [];
  tableDataSource = new MatTableDataSource<any>([]);

  /** Constante exposée au template pour le matColumnDef de la ligne de groupe. */
  readonly _GROUP_ROW_COLUMN = GROUP_ROW_COLUMN;
  /** Clés d'accès aux propriétés des lignes projetées — exposées pour le template. */
  readonly _ROW_RAW_KEY = ROW_RAW_KEY;
  readonly _ROW_INDEX_KEY = ROW_INDEX_KEY;
  readonly _ROW_GROUP_KEY = ROW_GROUP_KEY;
  readonly _ROW_GROUP_COUNT = ROW_GROUP_COUNT;
  readonly _ROW_GROUP_PAGE = ROW_GROUP_PAGE;
  readonly _ROW_GROUP_PAGE_COUNT = ROW_GROUP_PAGE_COUNT;

  /** Facade View : état et actions centralisés (Champs / Group by / Slice by) */
  readonly _view = new ViewFacade<T>();

  /**
   * Snapshot stable synchronisé depuis _view.fields.activeColumns dans refreshViewModel().
   * Propriété (non getter) pour qu'Angular puisse la suivre sans NG0100.
   */
  activeColumns: TableColumnProvider<T>[] = [];

  activeSliceFilter: (row: T) => boolean = () => true;

  // Propriétés stables pour les bindings du template (contre erreur NG0100)
  _sliceConfigs: any[] = [];
  _sliceColumns: TableColumnProvider<T>[] = [];
  _sliceData: T[] = [];
  _sliceShowToggle = true;
  /** Snapshot stable de la visibilité du panneau slice — jamais calculé depuis @ViewChild */
  _showSlicePanel = false;
  /** Snapshot stable de l'état collapsed du panneau slice, mis à jour via (collapsedChange) */
  _slicePanelCollapsed = false;

  // Délégués vers _view (conservés pour compatibilité template sans refactoring HTML)
  get _staticSlicesForMenu(): Array<{ key: string; title: string; icon?: string }> { return this._view.staticSlicesForMenu; }
  get _activeDynamicSliceColumns(): TableColumnProvider<T>[] { return this._view.sliceBy.activeDynamicColumns; }
  get _availableColumnsForDynamicSlice(): TableColumnProvider<T>[] { return this._view.sliceBy.availableForDynamic; }
  get _allDynamicSliceColumns(): TableColumnProvider<T>[] { return this._view.sliceBy.allDynamicColumns; }
  get _activeSliceByLabel(): string { return this._view.sliceBy.activeLabel; }
  _sliceByMenuItems: Array<{ isStatic: boolean; key: string; title: string; icon?: string; col?: TableColumnProvider<T> }> = [];

  searchQuery = '';
  get activeGroupByKey(): string | null { return this._view.groupBy.activeKey; }
  _matSortActive = '';
  _matSortDirection: 'asc' | 'desc' | '' = '';
  private _activeSort: { active: string; direction: 'asc' | 'desc' | '' } = { active: '', direction: '' };
  private _sortSubscribed: MatSort | null = null;
  private _destroy$ = new Subject<void>();
  private _totalFilteredCount = 0;

  /** Gestionnaire du mode Group By (état collapsed, pagination, tri des groupes). */
  readonly _groupBy = new GroupByManager(
    () => { this._projectCurrentPage(); this._cdr.markForCheck(); },
    () => this.refreshViewModel(),
  );

  /** Délégués vers GroupByManager pour la compatibilité des templates. */
  get groupPageSize(): number { return this._groupBy.groupPageSize; }
  set groupPageSize(v: number) { this._groupBy.groupPageSize = v; }
  get groupSortOrder(): 'asc' | 'desc' { return this._groupBy.groupSortOrder; }
  set groupSortOrder(v: 'asc' | 'desc') { this._groupBy.groupSortOrder = v; }

  /** Gestionnaire du cycle de vie des colonnes lazy (fetch, annulation, statuts, données). */
  private _lazy = new LazyColumnManager<T>();
  /** Compatibilité template : retourne la map de statuts lazy. */
  get _lazyColumnStatus() { return this._lazy.status; }
  /** Compatibilité template : retourne la map de données lazy. */
  get _lazyColumnData() { return this._lazy.data; }
  private _cdr = inject(ChangeDetectorRef);
  private _el = inject(ElementRef<HTMLElement>);
  private _ngZone = inject(NgZone);
  private _i18nRaw = inject(JQT_I18N, { optional: true });

  /** Labels de l’interface. Fusionnés depuis JQT_I18N_DEFAULTS et le token JQT_I18N injecté. */
  readonly i18n: JqtI18n = { ...JQT_I18N_DEFAULTS, ...(this._i18nRaw ?? {}) };

  isGroupHeader = (_: number, row: any): boolean => row[GROUP_HEADER_MARKER] === true;

  /** Retourne true si la ligne de groupe est une ligne normale (ni lazy, ni too-many). */
  isNormalGroupRow(row: any): boolean {
    return row[ROW_GROUP_KEY] !== GROUP_KEY_LAZY_LOADING && row[ROW_GROUP_KEY] !== GROUP_KEY_TOO_MANY;
  }
  isGroupRowLoading(row: any): boolean { return row[ROW_GROUP_KEY] === GROUP_KEY_LAZY_LOADING; }
  isGroupRowTooMany(row: any): boolean { return row[ROW_GROUP_KEY] === GROUP_KEY_TOO_MANY; }

  /** Gère le clic sur une ligne d'en-tête de groupe (no-op pour les états spéciaux). */
  onGroupHeaderClick(row: any): void {
    if (!this.isNormalGroupRow(row)) return;
    this.toggleGroupCollapse(row[ROW_GROUP_KEY]);
  }

  /** Gestionnaire export CSV. */
  private readonly _export = new ExportManager<T>(
    () => this._allFilteredRows,
    () => this.activeColumns,
    () => this.resolvedConfig.export,
    (col, row, idx) => this.resolveCellValue(col, row, idx),
  );

  // ── Lifecycle

  pageSize = 5;
  pageSizeOptions: number[] = [5, 10, 20];
  pageSizeOptionsGroupBy: number[] = [5, 10, 20];

  draggedColumnKey: string | null = null;
  dragOverColumnKey: string | null = null;

  // ── Mode édition (Préférences)
  /** Vrai quand le mode édition est actif (resize + drag colonnes, interactions désactivées). */
  _editMode = false;
  /** Largeurs de colonnes personnalisées par l'utilisateur (clé → px). */
  _columnWidths: Record<string, number> = {};
  /** Message de feedback après save/clear. `null` = pas de message. */
  _preferencesMessage: string | null = null;
  /** Vrai si une configuration est sauvegardée pour ce tableau. */
  _hasSavedConfig = false;
  private _preferencesManager: TablePreferencesManager | null = null;
  private _resizeState: { key: string; startX: number; startWidth: number } | null = null;
  /** Dynamic slice keys à restaurer après ngAfterViewInit (slicePanelRef pas encore dispo). */
  private _pendingDynamicSliceKeys: string[] | null = null;
  /** Filtres de slice à restaurer après ngAfterViewInit (slicePanelRef pas encore dispo). */
  private _pendingSliceFilters: Record<number, string[]> | null = null;

  private resolvedConfig: TableProvider<T> = { columns: [] };
  private _columnMap: Map<string, TableColumnProvider<T>> = new Map();
  private _resolvedData: T[] = [];
  private _preservePageIndex: number | null = null;
  private _initialSearchApplied = false;

  // Seuil au-delà duquel le rendu groupé est bloqué pour protéger le navigateur
  private static readonly MAX_GROUP_COUNT = 500;

  // ── Optimisation performance
  private _allFilteredRows: T[] = [];
  private _paginatorSubscribed: MatPaginator | null = null;

  /** Cache groupBy — invalidé dès que rows/key/tri changent. */
  private _groupCache: GroupByCache<T> | null = null;
  private _pendingRender: ReturnType<typeof setTimeout> | null = null;

  private _staticSliceHiddenKeys = new Set<string>();
  private _configHiddenKeys = new Set<string>();


  /** Clés des colonnes visibles du dernier émission columnsChange (pour éviter les émissions dupliquement). */
  private _prevColumnKeys: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    const dataChanged = !!(changes['config'] || changes['data'] || changes['dataSource']);
    if (dataChanged) {
      this._lazy.cancelAll();
    }
    if (changes['config'] && !this._initialSearchApplied) {
      const initial = this.config?.search?.initialQuery;
      if (initial != null) {
        this.searchQuery = initial;
        this._initialSearchApplied = true;
      }
    }
    this.refreshViewModel();
    if (dataChanged) {
      this.activeColumns.filter(c => c.lazy).forEach(c => this.triggerLazyFetch(c));
    }
  }

  ngAfterContentInit(): void {
    this._rebuildCellDefMap();
    this._cellDefs.changes.pipe(takeUntil(this._destroy$)).subscribe(() => {
      this._rebuildCellDefMap();
      this._cdr.markForCheck();
    });
  }

  ngAfterViewInit(): void {
    this.attachPaginator();
    this.attachSort();
    this._measureHeaderHeight();
    this._applyPendingDynamicSliceKeys();
  }

  private _applyPendingDynamicSliceKeys(): void {
    const hasPendingDynamic = !!this._pendingDynamicSliceKeys;
    const hasPendingFilters = !!this._pendingSliceFilters;
    if (!hasPendingDynamic && !hasPendingFilters) return;

    const allCols = this.resolvedConfig.columns ?? [];
    const keys = hasPendingDynamic ? [...this._pendingDynamicSliceKeys!] : [];
    const filters = this._pendingSliceFilters ? { ...this._pendingSliceFilters } : null;
    this._pendingDynamicSliceKeys = null;
    this._pendingSliceFilters = null;

    // Tout est différé dans le même setTimeout pour :
    // 1. Éviter NG0100 (modifications après vérification dans ngAfterViewInit)
    // 2. Garantir que les dynamic slices sont ajoutées AVANT la restauration des filtres
    //    (les indices dans sliceFilters dépendent de l'ordre final de _cachedSlices)
    setTimeout(() => {
      keys.forEach(key => {
        const col = allCols.find(c => c.key === key);
        if (col) this.addDynamicSlice(col);
      });
      if (filters) {
        if (this.slicePanelRef) {
          this.slicePanelRef.restoreFilters(filters);
        } else {
          // slicePanelRef toujours null (données pas encore arrivées) :
          // remettre en attente pour que _recomputeShowSlicePanel les applique
          this._pendingSliceFilters = filters;
        }
      }
      this._cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    if (this._pendingRender !== null) {
      clearTimeout(this._pendingRender);
    }
    if (this._preferencesMessageTimer !== null) {
      clearTimeout(this._preferencesMessageTimer);
    }
    // Nettoie un éventuel resize en cours (listeners window non retirés)
    this._resizeState = null;
    this._destroy$.next();
    this._destroy$.complete();
    this._view.destroy();
  }

  private _measureHeaderHeight(): void {
    const measure = () => {
      const headerRow = this._el.nativeElement.querySelector('tr.mat-mdc-header-row') as HTMLElement;
      if (headerRow) {
        const h = headerRow.getBoundingClientRect().height;
        if (h > 0) {
          this._el.nativeElement.style.setProperty('--actual-header-height', h + 'px');
          return;
        }
      }
      // Header pas encore rendu (ex: lazy Angular Material), on réessaie après le prochain frame
      this._ngZone.runOutsideAngular(() => requestAnimationFrame(() => measure()));
    };
    this._ngZone.runOutsideAngular(() => requestAnimationFrame(() => measure()));
  }

  // ── Getters d'affichage

  get title(): string {
    return this.resolvedConfig.title ?? '';
  }

  get showTitle(): boolean {
    return !!this.resolvedConfig.title;
  }

  get visibleColumns(): TableColumnProvider<T>[] {
    return this.activeColumns;
  }

  get showSearchBar(): boolean { return this.resolvedConfig.search?.enabled === true; }
  get showViewButton(): boolean { return this._view.enabled || this.showExportButton || this.showPreferencesMenu; }
  get showSliceExpandBtn(): boolean { return this._showSlicePanel && this._slicePanelCollapsed && this._sliceShowToggle; }
  get showExportButton(): boolean {
    return this.resolvedConfig.export?.enabled === true;
  }
  get showPreferencesMenu(): boolean {
    return this.resolvedConfig.preferences?.enabled === true;
  }
  get hasSavedPreferences(): boolean { return this._hasSavedConfig; }

  get showToolbar(): boolean { return this.showSearchBar || this.showViewButton || this.showSliceExpandBtn; }

  expandSlicePanel(): void {
    this.slicePanelRef?.togglePanel();
  }
  get showFields(): boolean { return this._view.showFields; }
  get showGroupBySection(): boolean { return this._view.showGroupBySection; }

  get filteredRowCount(): number {
    return this.activeGroupByKey ? this._totalFilteredCount : this._allFilteredRows.length;
  }

  get activeGroupByLabel(): string { return this._view.activeGroupByLabel; }

  get totalColumnCount(): number { return this._view.totalColumnCount; }

  get activeSliceByLabel(): string { return this._view.sliceBy.activeLabel; }

  get activeDynamicSliceColumns(): TableColumnProvider<T>[] { return this._view.sliceBy.activeDynamicColumns; }

  removeDynamicSliceByKey(key: string): void {
    this.slicePanelRef?.removeDynamicSliceByKey(key);
  }

  get groupByColumns(): TableColumnProvider<T>[] { return this._view.groupByColumns; }

  colLabel(col: { key: string; header?: string }): string { return this._view.colLabel(col); }

  // ── Actions utilisateur

  onSearchChange(): void {
    this._preservePageIndex = 0;
    this.refreshViewModel();
    this.paginator?.firstPage();
    this.searchChange.emit(this.searchQuery);
  }

  onGroupByChange(key: string | null): void {
    this._view.setGroupBy(key);
    this._groupBy.setDefaultCollapsed(key !== null);
    this._groupBy.reset();
    this._groupBy.groupPageSize = this.resolveDefaultGroupPageSize();
    this.refreshViewModel();
    this.paginator?.firstPage();
    this.groupByChange.emit(key);
    if (key) {
      this.viewMenuTrigger?.closeMenu();
      const colDef = (this.resolvedConfig.columns || []).find(c => c.key === key);
      if (colDef?.lazy && this._lazyColumnStatus.get(key) !== 'loaded') {
        this.triggerLazyFetch(colDef);
      }
    } else {
      this._ngZone.runOutsideAngular(() => setTimeout(() => {
        this.tableBodyScrollRef?.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
      }, 0));
    }
  }

  onGroupPageSizeChange(size: number | string): void {
    this._groupBy.onGroupPageSizeChange(Number(size));
  }

  onGroupSortToggle(dir: 'asc' | 'desc'): void {
    this._groupBy.onGroupSortToggle(dir, (key) => {
      this._ngZone.runOutsideAngular(() => setTimeout(() => this.scrollToGroupHeader(key), 0));
    });
  }

  // ── Lazy loading

  getLazyColumnStatus(key: string): 'idle' | 'loading' | 'loaded' | 'error' {
    return this._lazy.getStatus(key);
  }

  getLazyRenderType(rowValue: any): 'loading' | 'error' | 'value' {
    return this._lazy.getRenderType(rowValue);
  }

  retryLazyColumn(column: TableColumnProvider<T>): void {
    this._lazy.retry(column, this._resolvedData, this._lazyCallbacks());
  }

  triggerLazyFetch(column: TableColumnProvider<T>): void {
    this._lazy.fetch(column, this._resolvedData, this._lazyCallbacks());
  }

  private _lazyCallbacks() {
    return {
      onRefresh: () => this.refreshViewModel(),
      onMarkForCheck: () => this._cdr.markForCheck(),
    };
  }

  // ── Groupement

  toggleGroupCollapse(groupKey: string): void {
    this._groupBy.toggleGroupCollapse(groupKey, (key) => {
      this._ngZone.runOutsideAngular(() => setTimeout(() => this.scrollToGroupHeader(key), 0));
    });
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
    return this._groupBy.isGroupCollapsed(groupKey);
  }

  groupPageBack(groupKey: string): void {
    this._groupBy.groupPageBack(groupKey);
  }

  groupPageForward(groupKey: string, totalCount: number): void {
    this._groupBy.groupPageForward(groupKey, totalCount);
  }

  // ── Colonnes

  get hasAddableColumns(): boolean {
    return this._view.menuBaseColumns.length > 0 || this._view.menuOptionalColumns.length > 0;
  }

  get menuBaseColumns(): TableColumnProvider<T>[] {
    return this._view.menuBaseColumns;
  }

  get menuOptionalColumns(): TableColumnProvider<T>[] {
    return this._view.menuOptionalColumns;
  }

  get availableColumnsToAdd(): TableColumnProvider<T>[] {
    const activeKeys = new Set(this.activeColumns.map((column) => column.key));
    return (this.resolvedConfig.columns || []).filter((c) => c.optional && !activeKeys.has(c.key));
  }

  get allowColumnRemoval(): boolean {
    return this._view.allowColumnRemoval;
  }

  // ── Slices

  get hasSliceConfig(): boolean {
    return (this.resolvedConfig.slices?.length ?? 0) > 0;
  }

  get showSlicePanel(): boolean {
    return this._showSlicePanel;
  }

  onSlicePanelCollapsedChange(collapsed: boolean): void {
    this._slicePanelCollapsed = collapsed;
    this._cdr.markForCheck();
  }

  private _recomputeShowSlicePanel(): void {
    const hasCfg = this._sliceConfigs.length > 0 || this._view.sliceBy.activeDynamicColumns.length > 0;
    const wasVisible = this._showSlicePanel;
    this._showSlicePanel = hasCfg && this._resolvedData.length > 0;
    // Le SlicePanelComponent vient d'être rendu pour la 1ère fois
    // (données arrivées) → appliquer les filtres en attente
    if (!wasVisible && this._showSlicePanel && this._pendingSliceFilters) {
      const filters = this._pendingSliceFilters;
      this._pendingSliceFilters = null;
      setTimeout(() => {
        this.slicePanelRef?.restoreFilters(filters);
        this._cdr.markForCheck();
      });
    }
  }

  get showAddSliceButton(): boolean {
    return this._view.showSliceBySection;
  }

  get staticSlicesForMenu(): Array<{ key: string; title: string; icon?: string }> {
    return this._view.staticSlicesForMenu;
  }

  get availableColumnsForDynamicSlice(): TableColumnProvider<T>[] {
    return this._view.sliceBy.availableForDynamic;
  }

  isStaticSliceVisible(columnKey: string): boolean {
    return !this._staticSliceHiddenKeys.has(columnKey);
  }

  toggleStaticSlice(columnKey: string): void {
    const next = new Set(this._staticSliceHiddenKeys);
    if (next.has(columnKey)) next.delete(columnKey);
    else next.add(columnKey);
    this._staticSliceHiddenKeys = next;
    this._view.updateHiddenStaticKeys(this._staticSliceHiddenKeys);
    this._sliceConfigs = this._computeSliceConfigs();
    // Si une slice vient d'être cachée, réinitialise le filtre actif pour éviter
    // un filtre orphelin (la slice n'est plus visible mais son filtre resterait actif)
    if (next.has(columnKey)) {
      this.activeSliceFilter = () => true;
    }
    this._recomputeShowSlicePanel();
    this._scheduleRender();
    this._cdr.markForCheck();
  }

  addDynamicSlice(column: TableColumnProvider<T>): void {
    this.slicePanelRef?.addDynamicSlice(column);
    if (column.lazy && this._lazyColumnStatus.get(column.key) !== 'loaded') {
      this.triggerLazyFetch(column);
    }
  }

  get allDynamicSliceColumns(): TableColumnProvider<T>[] {
    return this._allDynamicSliceColumns;
  }

  isDynamicSliceActive(key: string): boolean {
    return this._view.isDynamicSliceActive(key);
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
    this._view.onDynamicSliceKeysChange(keys);
    this._recomputeShowSlicePanel();
    this._cdr.markForCheck();
  }

  get emptyStateLabel(): string {
    return this.resolvedConfig.labels?.empty || this.i18n.emptyState;
  }

  get loadingStateLabel(): string {
    return this.resolvedConfig.labels?.loading || this.i18n.loadingState;
  }

  get effectiveIsLoading(): boolean {
    return this.isLoading;
  }

  get isEmpty(): boolean {
    // _pendingRender : le rendu interne n'est pas encore terminé → pas de message vide prématuré
    return !this.isLoading && this._pendingRender === null && this._allFilteredRows.length === 0;
  }

  get showPagination(): boolean {
    if (this.activeGroupByKey !== null) return false;
    return this.resolvedConfig.pagination?.enabled !== false;
  }

  get isColumnDragDropEnabled(): boolean {
    return this._view.isColumnDragDropEnabled;
  }

  get totalRows(): number {
    return this.activeGroupByKey
      ? this.tableDataSource.data.filter((r) => !r[GROUP_HEADER_MARKER]).length
      : this._allFilteredRows.length;
  }

  // ── Gestion des colonnes

  onAddColumn(column: TableColumnProvider<T>): void {
    this._view.addColumn(column);
    this._preservePageIndex = this.paginator?.pageIndex ?? null;
    this.refreshViewModel();

    if (column.lazy) {
      this.triggerLazyFetch(column);
    }

    this.addRequested.emit();
    this.columnAdded.emit(column);
  }

  onColumnVisibilityChange(column: TableColumnProvider<T>, checked: boolean): void {
    const isVisible = this._view.isColumnVisible(column.key);

    if (checked && !isVisible) {
      this.onAddColumn(column);
      return;
    }

    if (!checked && isVisible) {
      const removed = this._view.removeColumn(column.key);
      if (!removed) return;
      this._preservePageIndex = this.paginator?.pageIndex ?? null;
      this.refreshViewModel();
      this.columnRemoved.emit(column);
    }
  }

  isColumnVisible(columnKey: string): boolean {
    return this.activeColumns.some(c => c.key === columnKey);
  }

  onRemoveColumn(columnKey: string, event?: Event): void {
    event?.stopPropagation();
    const column = this.activeColumns.find(item => item.key === columnKey);
    if (!column) return;
    const removed = this._view.removeColumn(columnKey);
    if (!removed) return;
    this.refreshViewModel();
    this.columnRemoved.emit(column);
  }

  // ── Lignes

  private _rebuildCellDefMap(): void {
    this._cellDefMap = new Map(
      (this._cellDefs ?? []).map(d => [d.columnKey, d.template] as [string, TemplateRef<{ $implicit: any; index: number }>])
    );
  }

  getCellTemplate(key: string): TemplateRef<{ $implicit: any; index: number }> | null {
    return this._cellDefMap.get(key) ?? null;
  }

  get hasCustomCellDefs(): boolean {
    return this._cellDefMap.size > 0;
  }

  get hasRowClickHandler(): boolean {
    return this.rowSelected.observed || !!this.resolvedConfig.onRowSelected;
  }

  /** Largeur minimale du tableau en px, calculée depuis les largeurs explicites des colonnes actives.
   * Retourne null si aucune colonne n'a de largeur définie (le tableau remplit alors 100% du conteneur).
   * Seules les valeurs explicitement en `px` sont sommables ; les pourcentages ou autres unités sont ignorés. */
  get tableMinWidth(): string | null {
    const hasSomeExplicitWidth = this.activeColumns.some(c => c.width);
    if (!hasSomeExplicitWidth) return null;
    let sum = 0;
    for (const col of this.activeColumns) {
      if (col.width) {
        const isPx = col.width.trim().toLowerCase().endsWith('px');
        const px = Number.parseFloat(col.width);
        if (isPx && !Number.isNaN(px)) { sum += px; }
      } else {
        sum += 120; // largeur minimale estimée pour une colonne sans largeur explicite
      }
    }
    return sum + 'px';
  }

  trackRowFn = (_index: number, row: any): any =>
    row[GROUP_HEADER_MARKER] ? `__group_${row[ROW_GROUP_KEY]}` : row[ROW_INDEX_KEY] ?? _index;

  getRowClass(row: any): string | string[] | Record<string, boolean> {
    const fn = this.resolvedConfig.rowClass;
    if (!fn || row?.[GROUP_HEADER_MARKER]) return {};
    return fn(row[ROW_RAW_KEY] ?? row, row[ROW_INDEX_KEY] ?? 0);
  }

  onRowClick(row: any, event: MouseEvent | null): void {
    if (row?.[GROUP_HEADER_MARKER]) return;
    if (!this.hasRowClickHandler) return;
    const resolved = (row?.[ROW_RAW_KEY] ?? row) as T;
    this.resolvedConfig.onRowSelected?.(resolved, event);
    this.rowSelected.emit(resolved);
  }

  // ── Drag & drop

  onHeaderDragStart(columnKey: string, event: DragEvent): void {
    if (!this.isColumnDragDropEnabled && !this._editMode) {
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
    if ((!this.isColumnDragDropEnabled && !this._editMode) || !this.draggedColumnKey) {
      return;
    }

    event.preventDefault();
    this.dragOverColumnKey = columnKey;
  }

  onHeaderDrop(targetColumnKey: string, event: DragEvent): void {
    if ((!this.isColumnDragDropEnabled && !this._editMode) || !this.draggedColumnKey) {
      return;
    }

    event.preventDefault();

    const moved = this._view.reorderColumns(this.draggedColumnKey, targetColumnKey);
    if (!moved) {
      this.onHeaderDragEnd();
      return;
    }

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

  // ── Préférences : mode édition

  enterEditMode(): void {
    this._editMode = true;
    this._preferencesMessage = null;
    this._cdr.markForCheck();
  }

  confirmEditMode(): void {
    this._editMode = false;
    this._cdr.markForCheck();
  }

  /** Démarre le resize d'une colonne (mousedown sur la poignée droite). */
  onResizeStart(columnKey: string, event: MouseEvent): void {
    if (!this._editMode) return;
    event.preventDefault();
    event.stopPropagation();

    const th = (event.target as HTMLElement).closest('th') as HTMLElement | null;
    if (!th) return;

    this._resizeState = { key: columnKey, startX: event.clientX, startWidth: th.offsetWidth };

    const onMove = (e: MouseEvent) => {
      if (!this._resizeState) {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        return;
      }
      const delta = e.clientX - this._resizeState.startX;
      const newWidth = Math.max(60, this._resizeState.startWidth + delta);
      this._columnWidths = { ...this._columnWidths, [this._resizeState.key]: newWidth };
      // detectChanges() pour forcer la mise à jour immédiate en mode OnPush
      // (les listeners window tournent hors zone Angular avec runOutsideAngular)
      this._cdr.detectChanges();
    };

    const onUp = () => {
      this._resizeState = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    // Listeners hors zone Angular pour éviter des cycles CD à chaque mousemove
    this._ngZone.runOutsideAngular(() => {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });
  }

  /** Retourne la largeur CSS d'une colonne (px si personnalisée, sinon la valeur de config ou auto). */
  getColumnWidth(key: string): string {
    if (this._columnWidths[key] != null) return this._columnWidths[key] + 'px';
    const col = this._columnMap.get(key);
    return col?.width ?? 'auto';
  }

  // ── Préférences : save / clear

  savePreferences(): void {
    if (!this._preferencesManager) return;
    const dynamicSliceKeys = this._view.sliceBy.activeDynamicColumns.map(c => c.key);
    const config: import('../jquery-table.model').SavedTableConfig = {
      search:              this.searchQuery || undefined,
      groupBy:             this.activeGroupByKey,
      columnOrder:         this.activeColumns.map(c => c.key),
      visibleColumns:      this.activeColumns.map(c => c.key),
      columnWidths:        Object.keys(this._columnWidths).length ? { ...this._columnWidths } : undefined,
      slicePanelCollapsed: this._slicePanelCollapsed,
      hiddenSliceKeys:     [...this._staticSliceHiddenKeys],
      dynamicSliceKeys:    dynamicSliceKeys.length ? dynamicSliceKeys : undefined,
      sliceFilters:        this.slicePanelRef ? this.slicePanelRef.getActiveFilters() : undefined,
    };
    this._preferencesManager.save(config);
    this._hasSavedConfig = true;
    this._showPreferencesMessage(this.i18n.preferencesSavedMessage);
  }

  clearPreferences(): void {
    if (!this._preferencesManager) return;
    this._preferencesManager.clear();
    this._hasSavedConfig = false;

    // Capturer les dynamic slices actives AVANT le reset (resetToDefaults() les vide)
    const dynamicSlicesToRemove = this._view.sliceBy.activeDynamicColumns.slice();

    // Reset complet de l'état vers les valeurs par défaut de la config
    this.searchQuery = '';
    this._columnWidths = {};
    this._slicePanelCollapsed = false;
    this._groupBy.reset();
    this._groupBy.setDefaultCollapsed(false);

    // Slices statiques : revenir aux seules celles cachées par la config (pas par l'utilisateur)
    this._staticSliceHiddenKeys = new Set(this._configHiddenKeys);
    this._view.updateHiddenStaticKeys(this._staticSliceHiddenKeys);

    // Colonnes et groupBy : reset via la facade (retire les optionnelles, remet l'ordre config)
    this._view.resetToDefaults();

    // Dynamic slices : les retirer du slice panel avec la liste capturée avant le reset
    dynamicSlicesToRemove.forEach(col => {
      this.slicePanelRef?.removeDynamicSliceByKey(col.key);
    });

    // Filtre de slice actif
    this.activeSliceFilter = () => true;
    if (this.slicePanelRef) this.slicePanelRef.restoreFilters({});

    // Rafraîchit toute la vue
    this.activeColumns = this._view.fields.activeColumns;
    this.renderedColumns = this.activeColumns.map(c => c.key);
    this._pendingDynamicSliceKeys = null;
    this._pendingSliceFilters = null;
    this.refreshViewModel();

    this._showPreferencesMessage(this.i18n.preferencesClearedMessage);
  }

  private _preferencesMessageTimer: ReturnType<typeof setTimeout> | null = null;

  private _showPreferencesMessage(msg: string): void {
    if (this._preferencesMessageTimer !== null) clearTimeout(this._preferencesMessageTimer);
    this._preferencesMessage = msg;
    this._cdr.markForCheck();
    this._preferencesMessageTimer = setTimeout(() => {
      this._preferencesMessageTimer = null;
      this._preferencesMessage = null;
      this._cdr.markForCheck();
    }, 4000);
  }

  private _applyPreferences(saved: import('../jquery-table.model').SavedTableConfig | null): void {
    if (!saved) return;
    // Recherche
    if (saved.search) this.searchQuery = saved.search;
    // Largeurs colonnes
    if (saved.columnWidths) this._columnWidths = { ...saved.columnWidths };
    // Group by
    if (saved.groupBy !== undefined) {
      this._view.setGroupBy(saved.groupBy);
      if (saved.groupBy) {
        this._groupBy.setDefaultCollapsed(true);
        this._groupBy.reset();
      }
    }
    // État panneau slice
    if (saved.slicePanelCollapsed !== undefined) this._slicePanelCollapsed = saved.slicePanelCollapsed;
    // Slices statiques cachées — on utilise la valeur exacte sauvegardée (pas les defaults de config)
    if (saved.hiddenSliceKeys !== undefined) {
      this._staticSliceHiddenKeys = new Set(saved.hiddenSliceKeys);
      this._view.updateHiddenStaticKeys(this._staticSliceHiddenKeys);
    }
    // Colonnes visibles + ordre — reconstruit activeColumns en une seule passe.
    // On part de saved.columnOrder (ordre sauvegardé) si disponible, sinon saved.visibleColumns.
    // Cela gère à la fois : colonnes optionnelles ajoutées, colonnes retirées, et réordonnancement.
    const targetKeys = saved.columnOrder ?? saved.visibleColumns;
    if (targetKeys?.length) {
      const allByKey = new Map((this.resolvedConfig.columns ?? []).map(c => [c.key, c]));
      // Colonnes dans l'ordre sauvegardé (on ne garde que celles connues de la config)
      const ordered = targetKeys
        .map(key => allByKey.get(key))
        .filter((c): c is TableColumnProvider<T> => c !== undefined);
      // Colonnes actives actuelllement non présentes dans targetKeys (non-optional passées sous silence)
      // → on les exclut : l'utilisateur avait explicitement choisi ce sous-ensemble
      if (ordered.length > 0) {
        this._view.setActiveColumns(ordered);
      }
    }
    // Dynamic slices — différé : slicePanelRef pas encore disponible au moment de ngOnChanges
    if (saved.dynamicSliceKeys?.length) {
      this._pendingDynamicSliceKeys = saved.dynamicSliceKeys;
    }
    // Filtres actifs du slice panel
    // Filtres actifs du slice panel — toujours stockés en pending :
    // appliqués par _applyPendingDynamicSliceKeys (si dynamic slices) ou
    // par _recomputeShowSlicePanel (quand les données arrivent et rendent le panel visible)
    if (saved.sliceFilters && Object.keys(saved.sliceFilters).length) {
      this._pendingSliceFilters = saved.sliceFilters;
    }
  }

  canRemoveColumn(column: TableColumnProvider<T>): boolean {
    return (
      this._view.allowColumnRemoval &&
      column.removable !== false &&
      this.activeColumns.length > 1
    );
  }

  isCellEmpty(value: any): boolean {
    return value === '' || value == null;
  }

  asTitle(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  }

  // ── Export CSV

  onExport(): void {
    this._export.export();
  }

  // ── Pipeline de données (privé)

  private refreshViewModel(): void {
    this._resolvedData = this.resolveData();
    this.resolvedConfig = this.buildEffectiveConfig();
    this._columnMap = new Map((this.resolvedConfig.columns || []).map(c => [c.key, c]));

    // ── Initialiser le gestionnaire de préférences si l'option est activée
    const prefsId = this.resolvedConfig.preferences?.enabled
      ? this.resolvedConfig.preferences.tableId
      : null;
    const currentId = prefsId ?? null;
    // Préférences à appliquer après _view.update() (quand activeColumns est déjà peuplé)
    let pendingPrefs: import('../jquery-table.model').SavedTableConfig | null = null;
    if (currentId && this._preferencesManager?.key !== ('jqt_prefs_' + currentId)) {
      this._preferencesManager = new TablePreferencesManager(currentId);
      this._hasSavedConfig = this._preferencesManager.hasSaved();
      pendingPrefs = this._preferencesManager.load();
    } else if (!currentId) {
      this._preferencesManager = null;
      this._hasSavedConfig = false;
    }

    // Délègue à la facade : mise à jour de l'état View (colonnes, groupBy meta, sliceBy meta)
    this._view.update({
      config: this.resolvedConfig.view,
      columns: this.resolvedConfig.columns ?? [],
      sliceConfigs: this.resolvedConfig.slices ?? [],
    });

    // Synchronise la propriété stable (évite NG0100 — la facade est source de vérité)
    this.activeColumns = this._view.fields.activeColumns;

    this.renderedColumns = this.activeColumns.map(c => c.key);

    this.pageSize = this.paginator?.pageSize || this.resolvePageSize();
    this.pageSizeOptions = this.resolvePageSizeOptions();
    this.pageSizeOptionsGroupBy = this.resolvePageSizeOptionsGroupBy();
    if (this.groupPageSize !== 0 && !this.pageSizeOptionsGroupBy.includes(this.groupPageSize)) {
      this.groupPageSize = this.resolveDefaultGroupPageSize();
    }

    this.attachPaginator();
    this.attachSort();

    // Réinitialise _staticSliceHiddenKeys seulement si les clés hidden de la config ont vraiment changé
    // ET qu'il n'y a pas de préférences sauvegardées (qui géreront hiddenSliceKeys elles-mêmes).
    const newConfigHidden = new Set<string>(
      (this.resolvedConfig.slices ?? []).filter(s => s.hidden && s.columnKey).map(s => s.columnKey!)
    );
    if (!TableComponent._setsEqual(newConfigHidden, this._configHiddenKeys)) {
      this._configHiddenKeys = newConfigHidden;
      // N'écraser _staticSliceHiddenKeys que si on n'est PAS en train d'appliquer des prefs
      // (pendingPrefs les gèrera lui-même via _applyPreferences → hiddenSliceKeys)
      if (!pendingPrefs) {
        this._staticSliceHiddenKeys = new Set(newConfigHidden);
        this._view.updateHiddenStaticKeys(this._staticSliceHiddenKeys);
      }
    }

    // Applique les préférences ICI, APRÈS _view.update() ET après _configHiddenKeys mis à jour,
    // mais avant _computeSliceConfigs() pour que hiddenSliceKeys soit déjà restauré.
    if (pendingPrefs) {
      this._applyPreferences(pendingPrefs);
    }

    // Propriétés stables pour les bindings du template
    // On recalcule _sliceConfigs en reflétant l'état courant des slices cachées,
    // pour que SlicePanelComponent.ngOnInit reçoive la bonne valeur de `hidden`
    // même quand le composant est créé pour la 1ère fois après un toggle.
    this._sliceConfigs = this._computeSliceConfigs();
    this._sliceColumns = this.resolvedConfig.columns ?? [];
    this._sliceData = this._resolvedData;
    this._sliceShowToggle = this.resolvedConfig.enableSliceToggle !== false;
    this._recomputeShowSlicePanel();
    if (!this._activeSort.active && this.resolvedConfig.defaultSort) {
      this._matSortActive = this.resolvedConfig.defaultSort.active;
      this._matSortDirection = this.resolvedConfig.defaultSort.direction;
    }
    this._buildSliceByMenuItems();

    this._scheduleRender();
  }

  /** Retourne uniquement les slices visibles (non cachées par _staticSliceHiddenKeys).
   * Le SlicePanelComponent affiche tout ce qu'il reçoit — c'est ici que se fait le filtrage. */
  private _computeSliceConfigs(): SliceConfig<T>[] {
    return (this.resolvedConfig.slices ?? []).filter(
      s => !s.columnKey || !this._staticSliceHiddenKeys.has(s.columnKey)
    );
  }

  private static _setsEqual(a: Set<string>, b: Set<string>): boolean {
    if (a.size !== b.size) return false;
    for (const v of a) if (!b.has(v)) return false;
    return true;
  }

  private _buildSliceByMenuItems(): void {
    const staticSliceMap = new Map(this._staticSlicesForMenu.map(s => [s.key, s]));
    const dynamicSliceSet = new Set(this._allDynamicSliceColumns.map(c => c.key));
    const seen = new Set<string>();
    const items: Array<{ isStatic: boolean; key: string; title: string; icon?: string; col?: TableColumnProvider<T> }> = [];
    for (const col of this.resolvedConfig.columns ?? []) {
      if (seen.has(col.key)) continue;
      if (staticSliceMap.has(col.key)) {
        const s = staticSliceMap.get(col.key)!;
        items.push({ isStatic: true, key: s.key, title: s.title, icon: s.icon });
        seen.add(col.key);
      } else if (dynamicSliceSet.has(col.key)) {
        items.push({ isStatic: false, key: col.key, title: this.colLabel(col), icon: col.icon, col });
        seen.add(col.key);
      }
    }
    for (const s of this._staticSlicesForMenu) {
      if (!seen.has(s.key)) {
        items.push({ isStatic: true, key: s.key, title: s.title, icon: s.icon });
      }
    }
    this._sliceByMenuItems = items;
  }

  get sliceByMenuItems() { return this._sliceByMenuItems; }

  onSliceMenuItemClick(item: { isStatic: boolean; key: string; col?: TableColumnProvider<T> }): void {
    if (item.isStatic) {
      this.toggleStaticSlice(item.key);
    } else if (item.col) {
      this.toggleDynamicSlice(item.col);
    }
  }

  isSliceMenuItemActive(item: { isStatic: boolean; key: string }): boolean {
    return item.isStatic ? this.isStaticSliceVisible(item.key) : this.isDynamicSliceActive(item.key);
  }

  private _scheduleRender(): void {
    if (this._pendingRender !== null) {
      clearTimeout(this._pendingRender);
      this._pendingRender = null;
    }
    this._ngZone.runOutsideAngular(() => {
      this._pendingRender = setTimeout(() => {
        this._pendingRender = null;
        this._ngZone.run(() => this._executeRender());
      }, 0);
    });
  }

  private _executeRender(): void {
    const categoryRows = this.getCategoryFilteredData();
    if (this.activeGroupByKey) {
      // En mode groupBy, projectRows gère tout le tri internement — pas de sort global inutile
      this._allFilteredRows = categoryRows;
    } else {
      const compareFn = this._buildSortComparator();
      this._allFilteredRows = compareFn ? [...categoryRows].sort(compareFn) : categoryRows;
    }

    // Mettre à jour le paginator avec le nouveau total
    if (this.paginator) {
      const savedIndex = this._preservePageIndex ?? this.paginator.pageIndex;
      const maxPage = Math.max(0, Math.ceil(this._allFilteredRows.length / this.pageSize) - 1);
      this.paginator.length = this._allFilteredRows.length;
      this.paginator.pageIndex = Math.min(savedIndex, maxPage);
      this._preservePageIndex = null;
    }

    this._projectCurrentPage();
    // detectChanges() au lieu de markForCheck() : met à jour uniquement CE composant
    // sans déclencher un cycle CD global qui provoquerait NG0100 dans les parents.
    this._cdr.detectChanges();
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
      const p: any = { [ROW_RAW_KEY]: row, [ROW_INDEX_KEY]: idx };
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

    // Mode HTML : [view] prend le dessus sur config.view si fourni (Phase 3).
    const view = this.view ?? config.view;

    return {
      ...config,
      columns,
      view,
      slices: config.slices || [],
      enableSliceToggle: config.enableSliceToggle ?? true,
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
      const restrictedKeys = this.resolvedConfig.search?.searchColumns;
      const searchCols = restrictedKeys?.length
        ? [...this._columnMap.values()].filter(col => restrictedKeys.includes(col.key))
        : [...this._columnMap.values()];
      filtered = filtered.filter((row) =>
        searchCols.some((col) => {
          const val = this.getDisplayValueForSearch(col, row);
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
        const projected: any = { [ROW_RAW_KEY]: row, [ROW_INDEX_KEY]: index };
        this.activeColumns.forEach((col) => {
          projected[col.key] = this.resolveCellValue(col, row, index);
        });
        result.push(projected);
      });
      return result;
    }

    const groupColDef = this._columnMap.get(groupKey);
    const groupLazyStatus = groupColDef?.lazy ? (this._lazyColumnStatus.get(groupKey) ?? 'idle') : 'loaded';

    if (groupLazyStatus !== 'loaded') {
      this._totalFilteredCount = rows.length;
      return [{ [GROUP_HEADER_MARKER]: true, [ROW_GROUP_KEY]: GROUP_KEY_LAZY_LOADING, [ROW_GROUP_COUNT]: rows.length, [ROW_GROUP_PAGE]: 0, [ROW_GROUP_PAGE_COUNT]: 1 }];
    }

    const effectiveSort = this._activeSort.active && this._activeSort.direction
      ? this._activeSort
      : this.resolvedConfig.defaultSort ?? { active: '', direction: '' as const };

    // Vérifie si le cache est encore valide (même référence de rows + même paramètres de tri/groupe)
    const cacheValid =
      this._groupCache !== null &&
      this._groupCache.rows === rows &&
      this._groupCache.key === groupKey &&
      this._groupCache.sortOrder === this._groupBy.groupSortOrder &&
      this._groupCache.sortActive === (effectiveSort.active ?? '') &&
      this._groupCache.sortDir === (effectiveSort.direction ?? '');

    let groupOrder: string[];
    let groupMap: Map<string, T[]>;

    if (cacheValid) {
      groupOrder = this._groupCache!.order;
      groupMap = this._groupCache!.map;
    } else {
      // Pré-calcul des valeurs de groupe en un seul passage (évite O(n) find() par comparaison)
      const groupValueCache = new Map<T, string>();
      rows.forEach(row => groupValueCache.set(row, String(this.getLazyAwareValue(groupKey, row) ?? '')));

      // Pré-calcul des valeurs de tri (évite O(n log n) × getLazyAwareValue dans le comparateur)
      let fastCompareFn: ((a: T, b: T) => number) | null = null;
      if (effectiveSort.active && effectiveSort.direction) {
        const sortValueCache = new Map<T, any>();
        rows.forEach(row => sortValueCache.set(row, this.getLazyAwareValue(effectiveSort.active, row)));
        const dir = effectiveSort.direction;
        fastCompareFn = (a: T, b: T): number => {
          const va = sortValueCache.get(a);
          const vb = sortValueCache.get(b);
          let cmp = 0;
          if (typeof va === 'number' && typeof vb === 'number') {
            cmp = va < vb ? -1 : va > vb ? 1 : 0;
          } else {
            const sa = va == null ? '' : String(va).toLowerCase();
            const sb = vb == null ? '' : String(vb).toLowerCase();
            cmp = sa < sb ? -1 : sa > sb ? 1 : 0;
          }
          return dir === 'asc' ? cmp : -cmp;
        };
      }

      const sorted = [...rows].sort((a, b) => {
        const va = groupValueCache.get(a)!;
        const vb = groupValueCache.get(b)!;
        const cmp = va.localeCompare(vb);
        return this._groupBy.groupSortOrder === 'desc' ? -cmp : cmp;
      });

      groupOrder = [];
      groupMap = new Map<string, T[]>();
      sorted.forEach((row) => {
        const groupValue = groupValueCache.get(row)!;
        if (!groupMap.has(groupValue)) {
          groupOrder.push(groupValue);
          groupMap.set(groupValue, []);
        }
        groupMap.get(groupValue)!.push(row);
      });

      // Tri intra-groupe stocké dans le cache — évite le re-tri sur collapse/expand/pagination
      if (fastCompareFn) {
        const fn = fastCompareFn;
        groupMap.forEach((groupRows, key) => {
          groupMap.set(key, [...groupRows].sort(fn));
        });
      }

      // Mise en cache
      this._groupCache = {
        rows,
        key: groupKey,
        sortOrder: this._groupBy.groupSortOrder,
        sortActive: effectiveSort.active ?? '',
        sortDir: effectiveSort.direction ?? '',
        order: groupOrder,
        map: groupMap,
      };
    }

    this._totalFilteredCount = rows.length;

    // Protection contre les jeux de données à trop haute cardinalité
    if (groupOrder.length > TableComponent.MAX_GROUP_COUNT) {
      return [{ [GROUP_HEADER_MARKER]: true, [ROW_GROUP_KEY]: GROUP_KEY_TOO_MANY, [ROW_GROUP_COUNT]: groupOrder.length, [ROW_GROUP_PAGE]: 0, [ROW_GROUP_PAGE_COUNT]: 1 }];
    }

    const pageSize = this.groupPageSize;
    const result: any[] = [];

    groupOrder.forEach((groupValue) => {
      const groupRows = groupMap.get(groupValue)!;
      const totalCount = groupRows.length;
      const currentPage = pageSize === 0 ? 0 : this._groupBy.getPage(groupValue);
      const pageCount = pageSize === 0 ? 1 : Math.max(1, Math.ceil(totalCount / pageSize));
      const collapsed = this.isGroupCollapsed(groupValue);

      result.push({ [GROUP_HEADER_MARKER]: true, [ROW_GROUP_KEY]: groupValue, [ROW_GROUP_COUNT]: totalCount, [ROW_GROUP_PAGE]: currentPage, [ROW_GROUP_PAGE_COUNT]: pageCount });

      if (!collapsed) {
        const start = pageSize === 0 ? 0 : currentPage * pageSize;
        const end = pageSize === 0 ? totalCount : Math.min(start + pageSize, totalCount);
        groupRows.slice(start, end).forEach((row, i) => {
          const idx = start + i;
          const projected: any = { [ROW_RAW_KEY]: row, [ROW_INDEX_KEY]: idx };
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

  /**
   * Retourne la valeur telle qu'elle est affichée dans la cellule, en suivant exactement
   * le même chemin que resolveCellValue — utilisée pour la recherche plein-texte.
   * Ne passe pas par sortValue (valeur brute de tri) contrairement à getLazyAwareValue.
   */
  private getDisplayValueForSearch(col: TableColumnProvider<T>, row: T): any {
    if (col.lazy) {
      const status = this._lazyColumnStatus.get(col.key) ?? 'idle';
      if (status !== 'loaded') return null;
      const rowMap = this._lazyColumnData.get(col.key);
      return normalizeCellValue(rowMap?.get(row) ?? '');
    }
    if (col.searchValue) {
      return col.searchValue(row, 0);
    }
    const rawValue = col.value ? col.value(row, 0) : (row as any)?.[col.key];
    return normalizeCellValue(rawValue);
  }

  private getLazyAwareValue(columnKey: string, row: T): any {
    const colDef = this._columnMap.get(columnKey);
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
      if (status === 'loading') return LAZY_LOADING_VALUE;
      if (status === 'error') return LAZY_ERROR_VALUE;
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
    return Math.max(1, this.resolvedConfig.pagination?.pageSize || this.pageSize || 5);
  }

  private resolvePageSizeOptions(): number[] {
    const options = this.resolvedConfig.pagination?.pageSizeOptions || [5, 10, 20];
    const unique = [...new Set(options.filter((value) => value > 0))];

    if (!unique.includes(this.pageSize)) {
      unique.push(this.pageSize);
    }

    return unique.sort((a, b) => a - b);
  }

  private resolvePageSizeOptionsGroupBy(): number[] {
    const options = this.resolvedConfig.pagination?.pageSizeOptionsGroupBy || this.resolvedConfig.pagination?.pageSizeOptions || [5, 10, 20];
    const unique = [...new Set(options.filter((v) => v > 0))];
    if (this.groupPageSize > 0 && !unique.includes(this.groupPageSize)) {
      unique.push(this.groupPageSize);
    }
    return unique.sort((a, b) => a - b);
  }

  private resolveDefaultGroupPageSize(): number {
    const cfg = this.resolvedConfig;
    const options = cfg.pagination?.pageSizeOptionsGroupBy || cfg.pagination?.pageSizeOptions;
    if (options?.length) return options[0];
    return cfg.pagination?.pageSize || 5;
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
        this.pageChange.emit({ pageIndex: this.paginator!.pageIndex, pageSize: this.paginator!.pageSize });
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
        this.sortChange.emit({ active: this.sort.active, direction: this.sort.direction });
        this._scheduleRender();
      });
    }
  }
}
