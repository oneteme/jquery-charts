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
  /**
   * Valeur utilisée pour la recherche plein-texte.
   * À définir quand la colonne utilise un `jqt-cell-def` template personnalisé et qu'aucun `value` provider n'est déclaré.
   * Si absent, la recherche utilise `value` en priorité, puis la valeur brute de la ligne.
   * Exemple : `searchValue: (row) => durationPipe.transform((today - row.start) / 1000)`
   */
  searchValue?: DataProvider<string>;
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
  /** Restreint la recherche texte aux colonnes dont la `key` est dans ce tableau. Si absent, toutes les colonnes sont cherchées. */
  searchColumns?: string[];
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

/**
 * Raccourci pour déclarer une colonne de base.
 *
 * ```ts
 * columns: [
 *   col('name', 'Nom'),
 *   col('status', 'Statut', { sortable: false }),
 * ]
 * ```
 */
export function col<T = any>(
  key: string,
  header: string,
  overrides?: Partial<TableColumnProvider<T>>,
): TableColumnProvider<T> {
  return { key, header, ...overrides };
}

/** Configuration de l’export CSV déclenché depuis la toolbar. */
export interface TableExportConfig<T = any> {
  /** Affiche le bouton Export dans la toolbar. Par défaut : `false`. */
  enabled?: boolean;
  /** Nom du fichier généré. Par défaut : `'export.csv'`. */
  filename?: string;
  /**
   * Transforme chaque ligne avant export.
   * Si absent, les valeurs affichées (après `normalizeCellValue`) sont utilisées.
   * Seules les colonnes visibles sont exportées.
   */
  transform?: (row: T) => Record<string, string>;
}
/**
 * Configuration de la fonctionnalité Préférences.
 *
 * Ajoute un menu "Préférences" dans View qui permet :
 * - Le **mode édition** (redimensionner / réordonner les colonnes à la souris)
 * - L'**enregistrement** de la configuration courante dans le localStorage
 * - L'**effacement** de la configuration sauvegardée
 *
 * Chaque tableau est identifié par `tableId` (clé localStorage unique).
 */
export interface TablePreferencesConfig {
  /** Active la fonctionnalité. Par défaut : `false`. */
  enabled?: boolean;
  /**
   * Identifiant unique du tableau, utilisé comme clé localStorage.
   * Doit être stable entre les rechargements de page.
   * Exemple : `'user-table'`, `'invoice-list'`.
   */
  tableId: string;
}

/** Snapshot de configuration persisté dans le localStorage. */
export interface SavedTableConfig {
  /** Valeur de la searchbar. */
  search?: string;
  /** Clé de la colonne utilisée pour le group by. `null` = aucun. */
  groupBy?: string | null;
  /** Ordre des clés de colonnes (position). */
  columnOrder?: string[];
  /** Clés des colonnes visibles. */
  visibleColumns?: string[];
  /** Largeurs de colonnes en pixels, indexées par clé. */
  columnWidths?: Record<string, number>;
  /** Panneau slice replié ou non. */
  slicePanelCollapsed?: boolean;
  /** Clés des slices statiques cachées par l'utilisateur (via toggle dans le menu View). */
  hiddenSliceKeys?: string[];
  /** Clés des colonnes utilisées comme slices dynamiques. */
  dynamicSliceKeys?: string[];
  /** Filtres actifs du slice panel : map sliceIndex → tableau de clés actives. */
  sliceFilters?: Record<number, string[]>;
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
  /** Callback déclenché quand l'utilisateur clique sur une ligne. Alternative au `(rowSelected)` Output. */
  onRowSelected?: (row: T, event: MouseEvent | null) => void;
  /** Configuration de l'export CSV. */
  export?: TableExportConfig<T>;
  /** Configuration de la fonctionnalité Préférences (édition + persistance localStorage). */
  preferences?: TablePreferencesConfig;
}


