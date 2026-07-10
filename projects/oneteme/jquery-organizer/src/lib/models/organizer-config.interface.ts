import { Observable } from 'rxjs';
import { SliceConfig } from '../slice-panel/slice-panel.model';
import { UnitConfig } from '@oneteme/jquery-core';

export type FieldState = 'ready' | 'loading' | 'error';
export interface OrganizerViewField {
  id: string;
  label: string;
  icon?: string;
  visible?: boolean;
  state?: FieldState;
}

export interface OrganizerXField {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface OrganizerYAggregate {
  id: string;
  label: string;
}

export interface OrganizerYField {
  id: string;
  label: string;
  aggregates?: OrganizerYAggregate[];
  disabled?: boolean;
}

export interface OrganizerViewGroup {
  id: string;
  label: string;
  icon?: string;
}

export interface OrganizerViewSlice {
  id: string;
  label: string;
  icon?: string;
}

export interface OrganizerTemplate {
  id: string;
  label: string;
  icon?: string;
  xField?: string;
  yField?: string;
  yAggregate?: string;
  groupBy?: string;
  selectedSlices?: string[];
}

export interface OrganizerConfig {
  fields?: OrganizerViewField[];
  xFields?: OrganizerXField[];
  yFields?: OrganizerYField[];
  groups?: OrganizerViewGroup[];
  slices?: OrganizerViewSlice[];
  templates?: OrganizerTemplate[];

  onFetchFieldData?: (fieldId: string) => Promise<string[] | Record<string, any>[]>;
  onFetchSliceData?: (filterKey: string) => Observable<any[]> | Promise<any[]>;
  onSliceClick?: () => void;

  showExport?: boolean;
  onExport?: () => void;
  onExportVisual?: () => void;
  onExportData?: () => void;

  showPreferences?: boolean;
  hasSavedPreferences?: boolean;
  onPreferencesEdit?: () => void;
  onPreferencesSave?: () => void;
  onPreferencesClear?: () => void;

  showReset?: boolean;
  menuPosition?: 'above' | 'below';
  menuClass?: string;
  buttonLabel?: string;
  buttonIcon?: string;
  showButtonIcon?: boolean;

  switchView?: {
    currentView: 'chart' | 'table';
    onSwitch: (newView: 'chart' | 'table') => void;
  };
}

export interface OrganizerSliceState {
  sliceConfigs: SliceConfig<any>[];
  tasks: any[];
  filterApplied?: boolean;
}

export interface OrganizerState {
  viewMode?: 'chart' | 'table';

  visibleFields?: string[];

  selectedX?: string;
  selectedY?: string;
  selectedYAggregate?: string;

  selectedGroupBy?: string;
  selectedSlices?: string[];
  selectedTemplate?: string;
}

export interface OrganizerButtonEvent {
  type: 'fieldToggled' | 'xSelected' | 'ySelected' | 'groupBySelected' | 'templateSelected' | 'sliceSelected' | 'reset' | 'viewSwitched';
  state: OrganizerState;
  source?: 'user' | 'api';
  resolvedYUnit?: string | UnitConfig;
}

export interface OrganizerUnifiedState {
  viewMode: 'chart' | 'table';
  dimension?: string;
  metric?: string;
  metricAggregate?: string;
  breakdown?: string;
  filters?: string[];
}
