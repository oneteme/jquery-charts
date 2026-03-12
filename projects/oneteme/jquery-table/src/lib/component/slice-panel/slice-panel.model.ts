import { DataProvider } from '@oneteme/jquery-core';
import { Observable } from 'rxjs';

/** Une catégorie cliquable dans un slice (ex: "En cours", "Terminé"). */
export interface SliceCategory<T = any> {
  key: string;
  label: string;
  filter: (row: T) => boolean;
}

/** Un groupe de filtres affiché dans le panneau latéral. */
export interface SliceConfig<T = any> {
  title?: string;
  /** Icône Material affichée dans le titre du slice (ex: 'schedule', 'dns'). */
  icon?: string;
  multiSelect?: boolean;
  columnKey?: string;
  /**
   * Fonction de bucketing optionnelle. Si définie, mappe chaque row vers un label de tranche
   * (ex: '< 1h', '1j - 7j'). Permet de regrouper des valeurs continues en plages discrètes.
   * Prend le pas sur la valeur de la colonne pour le slicing.
   */
  bucket?: (row: T) => string;
  categories?: SliceCategory<T>[];
}

/**
 * Description minimale d'une colonne pour le panneau de slices.
 * Compatible avec TableColumnProvider (superset).
 */
export interface SliceColumnDef<T = any> {
  key: string;
  header?: string;
  icon?: string;
  value?: DataProvider<any>;
  lazy?: boolean;
  fetchFn?: () => Observable<any[]>;
}
