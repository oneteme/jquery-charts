import { DataProvider } from '@oneteme/jquery-core';
import { Observable } from 'rxjs';

/** Une catégorie cliquable dans un slice (ex: "En cours", "Terminé"). */
export interface SliceCategory<T = any> {
  key: string;
  label: string;
  filter?: (row: T) => boolean;
}

export interface SliceConfig<T = any> {
  title?: string;
  icon?: string;
  multiSelect?: boolean;
  columnKey?: string;
  hidden?: boolean;
  bucket?: (row: T) => string;
  categories?: SliceCategory<T>[];
}

export interface SliceColumnDef<T = any> {
  key: string;
  header?: string;
  icon?: string;
  value?: DataProvider<any>;
  lazy?: {
    fetchFn: () => Observable<any[]>;
  };
}
