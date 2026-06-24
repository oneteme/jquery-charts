/**
 * Public API for jquery-organizer
 *
 * Exports component, module, and interfaces for external consumption
 */

// Component
export { OrganizerButtonComponent } from './organizer-button/organizer-button.component';
export { OrganizerButtonModule } from './organizer-button/organizer-button.module';

// Slice Panel
export { SlicePanelComponent } from './slice-panel/slice-panel.component';
export { SliceConfig, SliceColumnDef, SliceCategory } from './slice-panel/slice-panel.model';

// OrganizerFacade — état et logique partagés (table, chart, KPI)
export { OrganizerFacade, humanizeKey } from './organizer-facade/organizer-facade';
export {
  OrganizerFieldDef,
  OrganizerPanelConfig,
  OrganizerFieldsState,
  OrganizerGroupByState,
  OrganizerSliceByState,
} from './organizer-facade/organizer-facade.types';

// GroupByManager — gestion collapse/expand/pagination des groupes
export { GroupByManager } from './group-by-manager/group-by-manager';

// LazyFieldManager — chargement différé de champs/colonnes
export {
  LazyFieldManager,
  LazyFieldDef,
  LazyFieldCallbacks,
  LAZY_FIELD_LOADING_VALUE,
  LAZY_FIELD_ERROR_VALUE,
} from './lazy-field-manager/lazy-field-manager';

// Interfaces and Types
export {
  OrganizerConfig,
  OrganizerState,
  OrganizerSliceState,
  OrganizerButtonEvent,
  OrganizerViewField,
  OrganizerViewGroup,
  OrganizerViewStack,
  OrganizerViewSlice,
  FieldState
