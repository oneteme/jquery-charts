/**
 * Public API for @oneteme/jquery-organizer
 *
 * This is the main entry point for the jquery-organizer library.
 * All exports from here are considered stable public API.
 */

// Components
export * from './lib/organizer-button/organizer-button.component';
export * from './lib/organizer-button/organizer-button.module';
export * from './lib/slice-panel/slice-panel.component';
export * from './lib/slice-panel/slice-panel.model';

// Models and Interfaces
export * from './lib/models/organizer-config.interface';
export * from './lib/models/organizer-menu.model';

// Utilitaires — helpers pour construire les configs (buildYFields, resolveYKey…)
export { buildYFields, resolveYKey, OrganizerYIndicator } from './lib/models/organizer-utils';

// Chart adapter — bridge générique ChartConfig ↔ OrganizerConfig
export {
  chartConfigToOrganizer,
  chartConfigToState,
  chartConfigToUnifiedState,
  applyOrganizerEventToChart,
  OrganizerChartItem,
  OrganizerChartSection,
  OrganizerChartConfig,
  OrganizerChartBridgeOptions,
} from './lib/models/organizer-chart-adapter';

// OrganizerFacade — état et logique partagés (table, chart, KPI)
export { OrganizerFacade, humanizeKey } from './lib/organizer-facade/organizer-facade';
export {
  OrganizerFieldDef,
  OrganizerPanelConfig,
  OrganizerFieldsState,
  OrganizerGroupByState,
  OrganizerSliceByState,
} from './lib/organizer-facade/organizer-facade.types';

// GroupByManager — gestion collapse/expand/pagination des groupes
export { GroupByManager } from './lib/group-by-manager/group-by-manager';

// LazyFieldManager — chargement différé de champs/colonnes
export {
  LazyFieldManager,
  LazyFieldDef,
  LazyFieldCallbacks,
  LAZY_FIELD_LOADING_VALUE,
  LAZY_FIELD_ERROR_VALUE,
} from './lib/lazy-field-manager/lazy-field-manager';
