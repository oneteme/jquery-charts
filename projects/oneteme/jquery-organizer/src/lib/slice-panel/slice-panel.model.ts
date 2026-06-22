import { DataProvider } from '@oneteme/jquery-core';
import { Observable } from 'rxjs';

/** Une catégorie cliquable dans un slice (ex: "En cours", "Terminé"). */
export interface SliceCategory<T = any> {
  key: string;
  label: string;
  /**
   * Prédicat de filtrage en mémoire — optionnel.
   * Si absent, la sélection n'a aucun effet local ; le parent réagit via `(activeKeysChange)`.
   */
  filter?: (row: T) => boolean;
}

/**
 * Groupe de filtres affiché dans le panneau latéral.
 *
 * **Mode colonne** (`columnKey`) : le slice lit automatiquement les valeurs distinctes
 * de la colonne désignée pour générer les catégories.
 *
 * **Mode manuel** (`categories`) : les catégories sont définies explicitement.
 */
export interface SliceConfig<T = any> {
  title?: string;
  icon?: string;
  multiSelect?: boolean;
  columnKey?: string;
  hidden?: boolean;
  bucket?: (row: T) => string;
  categories?: SliceCategory<T>[];
}

/**
 * Description minimale d'une colonne nécessaire au panneau de slices.
 */
export interface SliceColumnDef<T = any> {
  key: string;
  header?: string;
  icon?: string;
  value?: DataProvider<any>;
  lazy?: {
    fetchFn: () => Observable<any[]>;
  };
}
