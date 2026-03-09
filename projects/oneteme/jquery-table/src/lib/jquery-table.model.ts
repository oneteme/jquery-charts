import { DataProvider, field } from '@oneteme/jquery-core';
import { Observable } from 'rxjs';
import { SliceConfig } from './component/slice-panel/slice-panel.model';
export { SliceConfig } from './component/slice-panel/slice-panel.model';

export interface TableColumnProvider<T = any> {
  key: string;
  header: string;
  icon?: string;
  value?: DataProvider<any>;
  sortable?: boolean;
  removable?: boolean;
  optional?: boolean;
  lazy?: boolean;
  fetchFn?: () => Observable<any[]>;
}

export interface TableProvider<T = any> {
  columns?: TableColumnProvider<T>[];
  data?: T[];
  title?: string;
  enableSearchBar?: boolean;
  enableViewButton?: boolean;
  slices?: SliceConfig<T>[];
  showSliceToggle?: boolean;
  allowColumnRemoval?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  pageSizeOptionsGroupBy?: number[];
  enableColumnDragDrop?: boolean;
  emptyStateLabel?: string;
  isLoading?: boolean;
  loadingStateLabel?: string;
  rowClass?: (row: T, index: number) => string | string[] | Record<string, boolean>;
}

export function col<T = any>( key: string, header: string, sortable: boolean = true ): TableColumnProvider<T> {
  return { key, header, sortable, value: field(key) };
}
