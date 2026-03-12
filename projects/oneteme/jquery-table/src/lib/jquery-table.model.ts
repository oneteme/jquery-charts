import { DataProvider, field } from '@oneteme/jquery-core';
import { Observable } from 'rxjs';
import { SliceConfig } from './component/slice-panel/slice-panel.model';
export { SliceConfig } from './component/slice-panel/slice-panel.model';

export interface TableColumnProvider<T = any> {
  key: string;
  header: string;
  icon?: string;
  value?: DataProvider<any>;
  /** Valeur utilisée pour le tri si différente de `value`. Utile quand `value` retourne une chaîne formatée (date, durée...). */
  sortValue?: DataProvider<any>;
  sortable?: boolean;
  removable?: boolean;
  optional?: boolean;
  width?: string;
  groupable?: boolean;
  sliceable?: boolean;
  lazy?: boolean;
  fetchFn?: () => Observable<any[]>;
}

export interface TableProvider<T = any> {
  columns?: TableColumnProvider<T>[];
  title?: string;
  enableSearchBar?: boolean;
  initialSearchQuery?: string;
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
  loadingStateLabel?: string;
  /** Tri initial appliqué au chargement. N'est pas écrasé par les changements de données. */
  defaultSort?: { active: string; direction: 'asc' | 'desc' };
  rowClass?: (row: T, index: number) => string | string[] | Record<string, boolean>;
}

export function col<T = any>( key: string, header: string, sortable: boolean = true ): TableColumnProvider<T> {
  return { key, header, sortable, value: field(key) };
}
