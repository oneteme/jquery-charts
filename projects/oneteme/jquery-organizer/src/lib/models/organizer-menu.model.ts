/**
 * Organizer-specific models and constants
 * This file exports commonly used types for the organizer library
 */

export type MenuSection =
  | 'fields'
  | 'indicators'
  | 'groups'
  | 'stacks'
  | 'slices'
  | 'custom';

export interface MenuItemConfig {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  selected?: boolean;
  children?: MenuItemConfig[];
  section?: MenuSection;
}

export interface OrganizerMenuState {
  openSections: MenuSection[];
  selectedItems: { [section: string]: string | string[] };
  loadingFieldId?: string;
}

/**
 * Default menu sections to display (in order)
 * Can be overridden per context
 */
export const DEFAULT_MENU_SECTIONS: MenuSection[] = [
  'fields',
  'indicators',
  'groups',
  'stacks',
  'slices'
];

/**
 * Default menu labels (can be customized)
 */
export const DEFAULT_MENU_LABELS: { [key in MenuSection]: string } = {
  'fields': 'Champs',
  'indicators': 'Indicateur',
  'groups': 'Grouper par',
  'stacks': 'Catégories',
  'slices': 'Filtres',
  'custom': 'Options'
};

/**
 * Icons for menu sections (Material icons)
 */
export const DEFAULT_MENU_ICONS: { [key in MenuSection]: string } = {
  'fields': 'visibility',
  'indicators': 'functions',
  'groups': 'category',
  'stacks': 'layers',
  'slices': 'filter_list',
  'custom': 'settings'
};
