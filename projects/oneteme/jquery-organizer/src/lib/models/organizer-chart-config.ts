import { OrganizerChartItem, OrganizerChartSection } from './organizer-chart-adapter';

export interface OrganizerChartConfig {
  groups?: OrganizerChartSection;
  indicators?: OrganizerChartSection;
  filters?: OrganizerChartSection;
  templates?: any[]; // TODO: typer correctement les templates
}

export enum SyntheticItemKeys {
  EMPTY = '__empty__',
  SYNTHETIC_MARKER = '__synthetic__'
}

export enum SlicePanelI18nKeys {
  EXPAND_FILTER = 'expandFilterTitle',
  COLLAPSE_FILTER = 'collapseFilterTitle',
  FILTER_PANEL_TITLE_SINGLE = 'filterPanelTitleSingle',
  FILTER_PANEL_TITLE_PLURAL = 'filterPanelTitlePlural',
  FILTER_BLOCK_DEFAULT_TITLE = 'filterBlockDefaultTitle',
  FILTER_EMPTY_STATE = 'filterEmptyState'
}

export enum OrganizerButtonEventType {
  FIELD_TOGGLED = 'fieldToggled',
  X_SELECTED = 'xSelected',
  Y_SELECTED = 'ySelected',
  GROUP_BY_SELECTED = 'groupBySelected',
  TEMPLATE_SELECTED = 'templateSelected',
  SLICE_SELECTED = 'sliceSelected',
  VIEW_SWITCHED = 'viewSwitched'
}

export function getGroupItems(config: OrganizerChartConfig | null | undefined): OrganizerChartItem[] {
  return config?.groups?.items ?? [];
}

export function getIndicatorItems(config: OrganizerChartConfig | null | undefined): OrganizerChartItem[] {
  return config?.indicators?.items ?? [];
}

export function getFilterItems(config: OrganizerChartConfig | null | undefined): OrganizerChartItem[] {
  return config?.filters?.items ?? [];
}

export function getStackItems(indicator: OrganizerChartItem | undefined): OrganizerChartItem[] {
  return indicator?.extra?.stacks?.items ?? [];
}
