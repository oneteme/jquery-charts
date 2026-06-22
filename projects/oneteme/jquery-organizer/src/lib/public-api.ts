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

// Interfaces and Types
export {
  OrganizerConfig,
  OrganizerState,
  OrganizerSliceState,
  OrganizerEvent,
  OrganizerViewField,
  OrganizerViewGroup,
  OrganizerViewStack,
  OrganizerViewSlice,
  FieldState
