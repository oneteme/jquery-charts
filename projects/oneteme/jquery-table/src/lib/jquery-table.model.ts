import { DataProvider } from '@oneteme/jquery-core';
import { Observable } from 'rxjs';
import { SliceConfig } from './component/slice-panel/slice-panel.model';
export { SliceConfig } from './component/slice-panel/slice-panel.model';

export interface TableColumnProvider<T = any> {
  key: string;
  /** Libellé affiché dans l'en-tête de colonne. Optionnel si la colonne utilise un template custom. */
  header?: string;
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
  /** Chargement différé : la présence de cet objet active le mode lazy. */
  lazy?: {
    /** Fonction appelée pour charger les valeurs de la colonne. Retourne un tableau dans le même ordre que les lignes. */
    fetchFn: () => Observable<any[]>;
  };
}

/** Configuration de la barre de recherche. */
export interface TableSearchConfig {
  enabled?: boolean;
  /** Valeur initiale au chargement. */
  initialQuery?: string;
}

/** Configuration de la pagination. */
export interface TablePaginationConfig {
  enabled?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  /** Options de taille de page spécifiques au mode Group by. Si absent, utilise `pageSizeOptions`. */
  pageSizeOptionsGroupBy?: number[];
}

/** Configuration du menu View (Champs / Group by / Slice by). */
export interface TableViewConfig {
  /** Active le bouton View. Par défaut : `false`. */
  enabled?: boolean;
  /** Autorise le masquage/affichage des colonnes de base via View > Champs. Par défaut : `true`. */
  enableColumnRemoval?: boolean;
  /** Active le drag & drop pour réordonner les colonnes. Par défaut : `false`. */
  enableColumnDragDrop?: boolean;
}

/** Labels d'état du tableau. */
export interface TableLabelsConfig {
  /** Affiché quand le tableau est vide. Par défaut : `'Aucune donnée'`. */
  empty?: string;
  /** Affiché pendant le chargement. Par défaut : `'Chargement des données...'`. */
  loading?: string;
}

export interface TableProvider<T = any> {
  columns?: TableColumnProvider<T>[];
  title?: string;
  slices?: SliceConfig<T>[];
  /** Affiche le bouton toggle pour replier/déplier le panneau de slices. Par défaut : `true`. */
  enableSliceToggle?: boolean;
  search?: TableSearchConfig;
  pagination?: TablePaginationConfig;
  view?: TableViewConfig;
  labels?: TableLabelsConfig;
  /** Tri initial appliqué au chargement. N'est pas écrasé par les changements de données. */
  defaultSort?: { active: string; direction: 'asc' | 'desc' };
  rowClass?: (row: T, index: number) => string | string[] | Record<string, boolean>;
  onRowSelected?: (row: T, event: MouseEvent | null) => void;
}


