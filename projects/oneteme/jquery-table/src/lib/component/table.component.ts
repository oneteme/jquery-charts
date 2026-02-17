import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TableCategoryProvider, TableColumnProvider, TableProvider } from '../jquery-table.model';

@Component({
  standalone: true,
  selector: 'jquery-table',
  imports: [ CommonModule, MatTableModule, MatButtonModule, MatPaginatorModule, MatMenuModule, MatCheckboxModule ],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent<T = any> implements OnChanges, AfterViewInit {
  @Input() config?: TableProvider<T>;

  @Input() dataSource?: T[] | { data: T[] };
  @Input() data?: T[];
  @Input() displayedColumns?: string[];
  @Input() columnsConfig?: TableColumnProvider<T>[];
  @Input() availableColumnsInput?: TableColumnProvider<T>[];
  @Input() columnLabels?: Record<string, string>;
  @Input() isLoading = false;

  @Output() addRequested = new EventEmitter<void>();
  @Output() columnAdded = new EventEmitter<TableColumnProvider<T>>();
  @Output() columnRemoved = new EventEmitter<TableColumnProvider<T>>();
  @Output() categorySelected = new EventEmitter<string>();
  @Output() rowSelected = new EventEmitter<T>();

  @ViewChild(MatPaginator) paginator?: MatPaginator;

  renderedColumns: string[] = [];
  tableDataSource = new MatTableDataSource<any>([]);
  activeColumns: TableColumnProvider<T>[] = [];

  readonly allCategoryKey = '__all';
  activeCategoryKey: string = this.allCategoryKey;
  isCategorySliceCollapsed = false;

  pageSize = 5;
  pageSizeOptions: number[] = [5, 10, 20];

  draggedColumnKey: string | null = null;
  dragOverColumnKey: string | null = null;

  private userCustomizedColumns = false;
  private resolvedConfig: TableProvider<T> = { columns: [], data: [] };

  ngOnChanges(_: SimpleChanges): void {
    this.refreshViewModel();
  }

  ngAfterViewInit(): void {
    this.attachPaginator();
  }

  get title(): string {
    return this.resolvedConfig.title || 'Table';
  }

  get addColumnLabel(): string {
    return 'Colonnes';
  }

  get visibleColumns(): TableColumnProvider<T>[] {
    return this.activeColumns;
  }

  get showAddColumnButton(): boolean {
    return this.resolvedConfig.showAddColumnButton === true;
  }

  get showBottomActionsDock(): boolean {
    return this.showAddColumnButton;
  }

  get hasAddableColumns(): boolean {
    return this.menuBaseColumns.length > 0 || this.menuOptionalColumns.length > 0;
  }

  get menuBaseColumns(): TableColumnProvider<T>[] {
    return this.uniqueColumnsByKey(this.resolvedConfig.columns || []);
  }

  get menuOptionalColumns(): TableColumnProvider<T>[] {
    const pool = this.resolvedConfig.optionalColumns || this.resolvedConfig.availableColumns || [];
    const baseKeys = new Set(this.menuBaseColumns.map((column) => column.key));
    return this.uniqueColumnsByKey(pool.filter((column) => !baseKeys.has(column.key)));
  }

  get availableColumnsToAdd(): TableColumnProvider<T>[] {
    const pool =
      this.resolvedConfig.optionalColumns ||
      this.resolvedConfig.availableColumns ||
      [];

    const activeKeys = new Set(this.activeColumns.map((column) => column.key));
    return pool.filter((column) => !activeKeys.has(column.key));
  }

  get allowColumnRemoval(): boolean {
    return this.resolvedConfig.allowColumnRemoval === true;
  }

  get categories(): TableCategoryProvider<T>[] {
    return this.resolvedConfig.categorySlice?.categories || [];
  }

  get showCategorySlice(): boolean {
    return this.categories.length > 0;
  }

  get showCategorySliceToggle(): boolean {
    return this.resolvedConfig.showCategorySliceToggle !== false;
  }

  get categorySliceTitle(): string {
    return this.resolvedConfig.categorySlice?.title || 'Filtrer';
  }

  get allCategoryLabel(): string {
    return this.resolvedConfig.categorySlice?.allLabel || 'Tous';
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
    return this.resolvedConfig.enablePagination !== false;
  }

  get isColumnDragDropEnabled(): boolean {
    return this.resolvedConfig.enableColumnDragDrop === true;
  }

  get totalRows(): number {
    return this.tableDataSource.data.length;
  }

  onAddColumn(column: TableColumnProvider<T>): void {
    this.userCustomizedColumns = true;
    this.activeColumns = [...this.activeColumns, column];
    this.refreshViewModel();

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
      if (this.activeColumns.length <= 1) {
        return;
      }

      this.userCustomizedColumns = true;
      this.activeColumns = this.activeColumns.filter((item) => item.key !== column.key);
      this.refreshViewModel();
      this.columnRemoved.emit(column);
    }
  }

  isColumnVisible(columnKey: string): boolean {
    return this.activeColumns.some((column) => column.key === columnKey);
  }

  onCategorySelected(categoryKey: string): void {
    if (this.activeCategoryKey === categoryKey) {
      return;
    }

    this.activeCategoryKey = categoryKey;
    this.refreshViewModel();
    this.paginator?.firstPage();
    this.categorySelected.emit(categoryKey);
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

  toggleCategorySlice(): void {
    this.isCategorySliceCollapsed = !this.isCategorySliceCollapsed;
  }

  onRowClick(row: any): void {
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
    return this.activeCategoryKey === categoryKey;
  }

  categoryCount(categoryKey: string): number {
    if (categoryKey === this.allCategoryKey) {
      return (this.resolvedConfig.data || []).length;
    }

    const category = this.categories.find((item) => item.key === categoryKey);
    if (!category) {
      return 0;
    }

    return (this.resolvedConfig.data || []).filter((row) => category.filter(row)).length;
  }

  asTitle(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  }

  private refreshViewModel(): void {
    this.resolvedConfig = this.buildEffectiveConfig();
    const defaultColumns = this.resolvedConfig.columns || [];

    if (!this.userCustomizedColumns || this.activeColumns.length === 0) {
      this.activeColumns = [...defaultColumns];
    } else {
      const allowedKeys = new Set([
        ...defaultColumns.map((column) => column.key),
        ...(this.resolvedConfig.availableColumns || this.resolvedConfig.optionalColumns || [])
          .map((column) => column.key),
      ]);
      this.activeColumns = this.activeColumns.filter((column) => allowedKeys.has(column.key));
    }

    this.renderedColumns = this.activeColumns.map((column) => column.key);

    const categoryRows = this.getCategoryFilteredData();
    const projectedRows = this.projectRows(categoryRows);

    this.pageSize = this.resolvePageSize();
    this.pageSizeOptions = this.resolvePageSizeOptions();
    this.tableDataSource.data = projectedRows;
    this.attachPaginator();
  }

  private buildEffectiveConfig(): TableProvider<T> {
    const config = this.config || {};
    const rows = this.resolveData();

    const columns =
      config.columns ||
      this.columnsConfig ||
      this.resolveColumnsFromCompat(rows);

    const optionalColumns =
      config.optionalColumns ||
      config.availableColumns ||
      this.availableColumnsInput ||
      [];

    return {
      ...config,
      data: rows,
      columns,
      optionalColumns,
      availableColumns: optionalColumns,
      showAddColumnButton: config.showAddColumnButton ?? true,
      allowColumnRemoval: config.allowColumnRemoval ?? false,
      showCategorySliceToggle: config.showCategorySliceToggle ?? true,
      enablePagination: config.enablePagination ?? true,
      enableColumnDragDrop: config.enableColumnDragDrop ?? false,
      pageSize: config.pageSize || 5,
      pageSizeOptions: config.pageSizeOptions || [5, 10, 20],
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
    if (!this.showCategorySlice || this.activeCategoryKey === this.allCategoryKey) {
      return data;
    }

    const selectedCategory = this.categories.find(
      (category) => category.key === this.activeCategoryKey,
    );
    if (!selectedCategory) {
      return data;
    }

    return data.filter((row) => selectedCategory.filter(row));
  }

  private projectRows(rows: T[]): any[] {
    return rows.map((row, index) => {
      const projected: any = {
        __raw: row,
        __index: index,
      };

      this.activeColumns.forEach((column) => {
        const valueProvider = column.value;
        const rawValue = valueProvider
          ? valueProvider(row, index)
          : (row as any)?.[column.key];

        projected[column.key] = this.normalizeCellValue(rawValue);
      });

      return projected;
    });
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
      this.paginator.pageSize = this.pageSize;
      this.tableDataSource.paginator = this.paginator;
    }
  }

  private humanizeKey(key: string): string {
    return key
      .replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replaceAll(/[_-]+/g, ' ')
      .replace(/^./, (value) => value.toUpperCase());
  }
}
