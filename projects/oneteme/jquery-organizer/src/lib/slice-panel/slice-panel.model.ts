import { DataProvider } from '@oneteme/jquery-core';

export interface SliceCategory<T = any> {
  key: string;
  label: string;
  filter?: (row: T) => boolean;
  /** Effectif précalculé (rempli par le panneau pour les catégories dérivées d'une colonne). */
  count?: number;
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
  /** Colonne absente de la requête de base : ses valeurs sont dans les lignes une fois chargée (`lazyStatus`). */
  lazy?: true;
}
