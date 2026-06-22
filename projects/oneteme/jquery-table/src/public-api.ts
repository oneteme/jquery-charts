/*
 * Public API Surface of jquery-table
 */

export * from './lib/jquery-table.model';
export * from './lib/jqt-i18n.token';
export * from './lib/component/table.component';
// SlicePanel and its models are now hosted in jquery-organizer; re-exported here for backward compat
export { SliceConfig, SliceColumnDef, SliceCategory, SlicePanelComponent } from '@oneteme/jquery-organizer';
export * from './lib/directive/jqt-cell-def.directive';
