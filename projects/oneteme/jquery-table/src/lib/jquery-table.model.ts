import { DataProvider, field } from '@oneteme/jquery-core';

export interface TableColumnProvider<T = any> {
  key: string;
  header: string;
  value?: DataProvider<any>;
  sortable?: boolean;
  removable?: boolean;
}

export interface TableCategoryProvider<T = any> {
  key: string;
  label: string;
  filter: (row: T) => boolean;
}

export interface TableCategorySliceProvider<T = any> {
  title?: string;
  allLabel?: string;
  categories: TableCategoryProvider<T>[];
}

export interface TableProvider<T = any> {
  columns?: TableColumnProvider<T>[];
  data?: T[];
  title?: string;
  showAddColumnButton?: boolean;
  addColumnLabel?: string;
  allowColumnRemoval?: boolean;
  availableColumns?: TableColumnProvider<T>[];
  optionalColumns?: TableColumnProvider<T>[];
  categorySlice?: TableCategorySliceProvider<T>;
  showCategorySliceToggle?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  enableColumnDragDrop?: boolean;
  maxFilterValuesPerColumn?: number;
  emptyStateLabel?: string;
  isLoading?: boolean;
  loadingStateLabel?: string;
}

export function col<T = any>(
  key: string,
  header: string,
  sortable: boolean = true,
): TableColumnProvider<T> {
  return { key, header, sortable, value: field(key) };
}
