import { InjectionToken } from '@angular/core';

/**
 * Labels de l'interface utilisateur de jquery-table.
 *
 * Fournir ce token au niveau du module ou du composant racine pour localiser
 * ou personnaliser tous les textes de la bibliothèque en un seul endroit :
 *
 * ```ts
 * providers: [
 *   { provide: JQT_I18N, useValue: { searchPlaceholder: 'Search…', emptyState: 'No data' } }
 * ]
 * ```
 *
 * Tous les champs sont optionnels : seul ce que vous fournissez écrase les
 * valeurs par défaut françaises.
 */
export interface JqtI18n {
  /** Placeholder de la barre de recherche. */
  searchPlaceholder: string;
  /** Titre du bouton pour déplier le panneau de filtres. */
  expandFilterTitle: string;
  /** Titre du bouton pour replier le panneau de filtres. */
  collapseFilterTitle: string;
  /** Label du sous-menu "Champs" dans View. */
  viewMenuFields: string;
  /** Label du sous-menu "Group by" dans View. */
  viewMenuGroupBy: string;
  /** Label du sous-menu "Slice by" dans View. */
  viewMenuSliceBy: string;
  /** Label affiché quand aucune option n'est sélectionnée (groupe, slice). */
  viewNoneSelected: string;
  /** Bouton "Retirer le groupe" dans la barre de groupe. */
  groupRemove: string;
  /** Label "Trier :" dans la barre de groupe. */
  groupSortLabel: string;
  /** Tooltip tri ascendant. */
  groupSortAsc: string;
  /** Tooltip tri descendant. */
  groupSortDesc: string;
  /** Label "Lignes par groupe" dans le sélecteur de taille de groupe. */
  groupRowsPerGroup: string;
  /** Option "Toutes" (afficher toutes les lignes sans pagination de groupe). */
  groupShowAll: string;
  /** Message quand le groupe dépasse le nombre maximal autorisé. Reçoit le nombre de groupes. */
  groupTooMany: (count: number) => string;
  /** Label du bouton de réessai pour une colonne lazy en erreur. */
  lazyRetry: string;
  /** Tooltip du bouton de réessai. */
  lazyErrorTitle: string;
  /** Tooltip de l'icône d'erreur dans le menu View > Champs. */
  lazyErrorMenuTitle: string;
  /** Valeur affichée dans une cellule vide (null / undefined / ''). */
  cellEmpty: string;
  /** Message quand le tableau est vide. */
  emptyState: string;
  /** Message pendant le chargement (`[isLoading]="true"`). */
  loadingState: string;
  /** Titre du panneau de filtres latéral. Reçoit le nombre de blocs de filtres actifs. */
  filterPanelTitle: (count: number) => string;
  /** Titre par défaut d'un bloc de filtre sans `title` configuré. */
  filterBlockDefaultTitle: string;
  /** Message dans un bloc de filtre sans catégories correspondantes. */
  filterEmptyState: string;
  /** Label du bouton d'export CSV. */
  exportButtonLabel: string;
  /** Label du menu Préférences dans View. */
  preferencesMenuLabel: string;
  /** Sous-item : activer le mode édition. */
  preferencesEdit: string;
  /** Sous-item : enregistrer la config. */
  preferencesSave: string;
  /** Sous-item : effacer la config. */
  preferencesClear: string;
  /** Message de confirmation après enregistrement. */
  preferencesSavedMessage: string;
  /** Message de confirmation après effacement. */
  preferencesClearedMessage: string;
  /** Tooltip du bouton de validation du mode édition. */
  preferencesConfirmEdit: string;
}

/** Valeurs par défaut (français). Toutes les propriétés sont garanties non nulles. */
export const JQT_I18N_DEFAULTS: JqtI18n = {
  searchPlaceholder: 'Rechercher...',
  expandFilterTitle: 'Déplier le filtre',
  collapseFilterTitle: 'Replier le filtre',
  viewMenuFields: 'Champs',
  viewMenuGroupBy: 'Grouper par',
  viewMenuSliceBy: 'Filtrer par',
  viewNoneSelected: 'Aucun',
  groupRemove: 'Retirer le groupe',
  groupSortLabel: 'Trier :',
  groupSortAsc: 'A → Z',
  groupSortDesc: 'Z → A',
  groupRowsPerGroup: 'Lignes par groupe :',
  groupShowAll: 'Toutes',
  groupTooMany: (count) => `⚠ Trop de groupes (${count}) — affinez les données ou choisissez une autre colonne`,
  lazyRetry: 'Réessayer',
  lazyErrorTitle: 'Erreur de chargement — cliquer pour réessayer',
  lazyErrorMenuTitle: 'Erreur de chargement',
  cellEmpty: 'N/A',
  emptyState: 'Aucune donnée',
  loadingState: 'Chargement des données...',
  filterPanelTitle: (count) => count > 1 ? 'Filtres' : 'Filtre',
  filterBlockDefaultTitle: 'Filtrer',
  filterEmptyState: 'Aucune donnée',
  exportButtonLabel: 'Exporter',
  preferencesMenuLabel: 'Préférences',
  preferencesEdit: 'Mode édition',
  preferencesSave: 'Enregistrer la configuration',
  preferencesClear: 'Effacer la configuration',
  preferencesSavedMessage: 'Configuration enregistrée. Vous pouvez la réinitialiser à tout moment via Préférences → Effacer.',
  preferencesClearedMessage: 'Configuration réinitialisée.',
  preferencesConfirmEdit: 'Valider les modifications',
};

/**
 * Token d'injection pour surcharger tout ou partie des labels de jquery-table.
 * Accepte un `Partial<JqtI18n>` — seules les clés fournies écrasent les défauts.
 */
export const JQT_I18N = new InjectionToken<Partial<JqtI18n>>('JQT_I18N');
