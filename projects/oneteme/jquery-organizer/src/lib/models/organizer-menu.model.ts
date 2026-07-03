export type MenuSection = 'fields' | 'champs' | 'groups' | 'slices' | 'templates' | 'custom';

export const DEFAULT_MENU_LABELS: { [key in MenuSection]: string } = {
  'fields': 'Champs',
  'champs': 'Champs',
  'groups': 'Grouper par',
  'slices': 'Filtrer par',
  'templates': 'Template',
  'custom': 'Options'
};

export const DEFAULT_MENU_ICONS: { [key in MenuSection]: string } = {
  'fields': 'visibility',
  'champs': 'bar_chart',
  'groups': 'category',
  'slices': 'filter_list',
  'templates': 'dashboard_customize',
  'custom': 'settings'
};
