import { DataProvider } from '@oneteme/jquery-core';
import { Observable } from 'rxjs';
import { OrganizerConfig, SliceConfig } from '@oneteme/jquery-organizer';
export { SliceConfig } from '@oneteme/jquery-organizer';

/** Propriétés communes à toutes les colonnes ; voir `TableColumnProvider`. */
export interface TableColumnBase<T = any> {
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
  /** Active le tri ; `true` par défaut. */
  sortable?: boolean;
  removable?: boolean;
  width?: string;
  /** Rend la colonne disponible dans Group by ; `true` par défaut si `header` est défini. */
  groupable?: boolean;
  /** Rend la colonne disponible comme Slice by dynamique ; `true` par défaut si `header` est défini. */
  sliceable?: boolean;
}

/**
 * Colonne du tableau.
 *
 * - `optional: true` : masquée par défaut, ajoutable depuis le menu View.
 * - `lazy: true` : absente de la requête de base, demandée à sa première activation (Organizer, Group by, Slice by).
 *   Une colonne lazy est forcément optionnelle : `optional: true` est implicite et `optional: false` est refusé
 *   (la colonne serait demandée dès le premier rendu, soit une requête de plus pour rien).
 *   Le chargement passe par `TableProvider.lazyLoader`, ou par l'événement `lazyColumnsRequested` si l'application
 *   préfère relancer elle-même sa requête. La cellule affiche un skeleton jusqu'à la réception des lignes complètes ;
 *   la colonne supporte ensuite tri, recherche, Group by et Slice by.
 */
export type TableColumnMode =
  | { lazy?: undefined; optional?: boolean }
  | { lazy: true; optional?: true };

export type TableColumnProvider<T = any> = TableColumnBase<T> & TableColumnMode;

/**
 * Charge les colonnes `lazy` : reçoit les clés des colonnes lazy demandées jusqu'ici (cumul) et retourne les lignes complètes,
 * qui remplacent `data` ; la requête est celle de l'application, la table ne connaît pas la source.
 */
export type TableLazyLoader<T = any> = (lazyColumns: string[]) => Observable<T[]>;

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
  showFirstLastButtons?: boolean;
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

/** Options publiques du bouton Organizer intégré à la toolbar. */
export interface TableOrganizerConfig {
  /** Libellé optionnel affiché à côté de l'icône. */
  buttonLabel?: OrganizerConfig['buttonLabel'];
  /** Icône Material affichée dans le bouton. */
  buttonIcon?: OrganizerConfig['buttonIcon'];
  /** Masque l'icône lorsque le bouton utilise un libellé seul. */
  showButtonIcon?: OrganizerConfig['showButtonIcon'];
  /** Masque les valeurs récapitulatives dans les sous-menus. */
  hideMenuValues?: boolean;
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
  overrides?: Partial<TableColumnBase<T>> & TableColumnMode,
): TableColumnProvider<T> {
  return { key, header, ...overrides };
}

/** Configuration de l’export CSV déclenché depuis la toolbar. */
export interface TableExportConfig<T = any> {
  /** Affiche le bouton Export dans la toolbar. Par défaut : `true`. */
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
  /** Active la fonctionnalité. Par défaut : `true`. */
  enabled?: boolean;
  /**
   * Identifiant unique du tableau, utilisé comme clé localStorage.
   * Doit être stable entre les rechargements de page.
   * Si absent, un identifiant est dérivé automatiquement des clés de colonnes.
   * Exemple : `'user-table'`, `'invoice-list'`.
   */
  tableId?: string;
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
  /** Filtres actifs du slice panel, indexés par clé de colonne stable. */
  sliceFilters?: Record<string, string[]>;
}
export interface TableProvider<T = any> {
  columns?: TableColumnProvider<T>[];
  title?: string;
  showActions?: boolean;
  onCopyVisual?: () => void;
  onToggleFullscreen?: () => void;
  slices?: SliceConfig<T>[];
  /** État initial du panneau de slices. Une préférence sauvegardée reste prioritaire. */
  slicePanelCollapsed?: boolean;
  /** Affiche le bouton toggle pour replier/déplier le panneau de slices. Par défaut : `true`. */
  enableSliceToggle?: boolean;
  /**
   * Permet de vider search bar depuis config
   * Changez cette valeur (ex: route courante, compteur, timestamp) pour déclencher un reset.
   */
  clearSearchInput?: string | number | boolean | null;
  search?: TableSearchConfig;
  pagination?: TablePaginationConfig;
  view?: TableViewConfig;
  organizer?: TableOrganizerConfig;
  labels?: TableLabelsConfig;
  /** Tri initial appliqué au chargement. N'est pas écrasé par les changements de données. */
  defaultSort?: { active: string; direction: 'asc' | 'desc' };
  /** Clé de colonne à utiliser comme group-by par défaut au chargement. N'est pas écrasé par les changements de données ni par un reset explicite de l'utilisateur. */
  defaultGroupBy?: string | null;
  rowClass?: (row: T, index: number) => string | string[] | Record<string, boolean>;
  /** Callback déclenché quand l'utilisateur clique sur une ligne. Alternative au `(rowSelected)` Output. */
  onRowSelected?: (row: T, event: MouseEvent | null) => void;
  /** Configuration de l'export CSV. */
  export?: TableExportConfig<T>;
  /**
   * Chargeur des colonnes `lazy` : appelé à l'activation d'une colonne lazy (et après chaque nouveau `data` si des colonnes
   * ont déjà été demandées). Sans chargeur, la table émet seulement `lazyColumnsRequested`.
   */
  lazyLoader?: TableLazyLoader<T>;
  /** Configuration de la fonctionnalité Préférences (édition + persistance localStorage). */
  preferences?: TablePreferencesConfig;
}


