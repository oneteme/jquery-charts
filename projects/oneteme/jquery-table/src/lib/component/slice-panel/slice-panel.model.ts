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
  multiSelect?: boolean;
  /** Si renseigné, les catégories sont générées automatiquement depuis les valeurs distinctes de cette clé. */
  columnKey?: string;
  categories?: SliceCategory<T>[];
}

/**
 * Description minimale d'une colonne pour le panneau de slices.
 * Compatible avec TableColumnProvider (superset).
 */
export interface SliceColumnDef<T = any> {
  key: string;
  header?: string;
  lazy?: boolean;
  fetchFn?: () => Observable<any[]>;
}
