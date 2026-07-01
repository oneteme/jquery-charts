/**
 * Organizer-specific models and constants
 * This file exports commonly used types for the organizer library
 */

/**
 * Sections disponibles dans le menu principal de l'organizer.
 * - fields   : mode table — toggle visibilité colonnes
 * - champs   : mode chart — sous-menu X + Y
 * - groups   : Grouper par (catégoriels)
 * - slices   : Filtrer par
 * - templates: Templates prédéfinis
 * - custom   : Section personnalisée
 */
export type MenuSection = 'fields' | 'champs' | 'groups' | 'slices' | 'templates' | 'custom';

export const DEFAULT_MENU_LABELS: { [key in MenuSection]: string } = {
  'fields':    'Champs',
  'champs':    'Champs',
  'groups':    'Grouper par',
  'slices':    'Filtrer par',
  'templates': 'Template',
  'custom':    'Options'
};

export const DEFAULT_MENU_ICONS: { [key in MenuSection]: string } = {
  'fields':    'visibility',
  'champs':    'bar_chart',
  'groups':    'category',
  'slices':    'filter_list',
  'templates': 'dashboard_customize',
  'custom':    'settings'
};
