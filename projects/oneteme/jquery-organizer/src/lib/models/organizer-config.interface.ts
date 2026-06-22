import { ViewEvent } from '@oneteme/jquery-core';
import { Observable } from 'rxjs';
import { SliceConfig } from '../slice-panel/slice-panel.model';

/**
 * FieldState enum - Represents the state of a field in the organizer menu
 *
 * - 'ready': Data is available, field is clickable and active
 * - 'loading': Data is being fetched, spinner should be displayed
 * - 'error': Fetch failed, error state should be displayed
 *
 * undefined: Field is declared but not fetched (grayed out, inert)
 */
export type FieldState = 'ready' | 'loading' | 'error';

/**
 * OrganizerViewField - Field definition within OrganizerConfig
 *
 * This is the organizer-specific field model.
 * Separate from jquery-core's ViewField to avoid tight coupling.
 */
export interface OrganizerViewField {
  id: string;
  label: string;
  visible?: boolean;
  state?: FieldState;
  /** Optional: indicator type for this field */
  indicator?: 'count' | 'sum' | 'min' | 'max' | 'avg' | string;
  /** Optional: nested sub-fields (for stacks, hierarchies) */
  subFields?: OrganizerViewField[];
}

/**
 * OrganizerViewGroup - Group by option
 */
export interface OrganizerViewGroup {
  id: string;
  label: string;
}

/**
 * OrganizerViewStack - Stack/category option
 */
export interface OrganizerViewStack {
  id: string;
  label: string;
}

/**
 * OrganizerViewSlice - Slice/filter option
 */
export interface OrganizerViewSlice {
  id: string;
  label: string;
}

/**
 * OrganizerConfig - Configuration for OrganizerButtonComponent
 *
 * This interface defines how the Organizer Button should behave and what options to expose.
 * It remains agnostic to any specific renderer or context (table, chart, KPI, etc.)
 *
 * Note: This is separate from jquery-core's ViewConfig.
 * OrganizerConfig is the UI component config, ViewConfig is the core business logic config.
 */
export interface OrganizerConfig {
  /**
   * Menu sections and their items
   * All possible options that should appear in the menu
   */
  fields?: OrganizerViewField[];
  indicators?: OrganizerViewField[];
  groups?: OrganizerViewGroup[];
  stacks?: OrganizerViewStack[];
  slices?: OrganizerViewSlice[];

  /**
   * Optional callback to fetch available values/data for a field
   * Used when field values are not initially loaded (lazy-loading pattern)
   *
   * Called when user clicks on a field that needs data fetch.
   * Should return field values/options to display.
   *
   * Example: User clicks "Phone Details" → callback fetches distinct phone values from API
   *
   * Returns: Promise resolving to string[] or Record<string, any>[]
   * - string[]: Simple list of values (e.g., ['status1', 'status2'])
   * - Record[]: Objects with label/value or other structure
   */
  onFetchFieldData?: (fieldId: string) => Promise<string[] | Record<string, any>[]>;

  /**
   * Optional callback to fetch slice/filter data when user selects a filter.
   * Called with the selected filterKey (OrganizerViewSlice.id).
   * OrganizerButtonComponent will call this, then emit sliceStateChange with the result.
   *
   * Returns: Observable or Promise of raw data rows
   */
  onFetchSliceData?: (filterKey: string) => Observable<any[]> | Promise<any[]>;

  /**
   * Optional callback when user clicks on "Slice/Filter" option
   * Parent is responsible for opening slice panel or filter dialog
   */
  onSliceClick?: () => void;

  // ── Export
  showExport?: boolean;
  onExport?: () => void;

  // ── Préférences
  showPreferences?: boolean;
  hasSavedPreferences?: boolean;
  onPreferencesEdit?: () => void;
  onPreferencesSave?: () => void;
  onPreferencesClear?: () => void;

  /**
   * Should the "Reset" button be visible?
   * Default: true
   */
  showReset?: boolean;

  /**
   * Menu position relative to button
   * Default: 'below'
   */
  menuPosition?: 'above' | 'below';

  /**
   * Optional CSS class to apply to menu
   */
  menuClass?: string;

  /**
   * Optional custom button label
   * Default: 'View'
   */
  buttonLabel?: string;

  /**
   * Optional icon name (Material icon)
   * Default: 'tune'
   */
  buttonIcon?: string;

  /**
   * Whether to show button icon
   * Default: true
   */
  showButtonIcon?: boolean;
}

/**
 * SliceState - State emitted by OrganizerButtonComponent when slice data is ready
 * Contains the data needed to render a slice-panel alongside the chart.
 * null = no active filter (panel should be hidden).
 */
export interface OrganizerSliceState {
  /** SliceConfig to pass to <slice-panel [sliceConfigs]> */
  sliceConfigs: SliceConfig<any>[];
  /** Raw data rows to pass to <slice-panel [data]> */
  tasks: any[];
}

/**
 * OrganizerState - Current state of the organizer selections
 *
 * Parallel to jquery-core's ViewState but UI-focused
 */
export interface OrganizerState {
  visibleFields?: string[];
  selectedIndicator?: string;
  selectedGroup?: string;
  selectedStacks?: string[];
  selectedSlices?: string[];
}

/**
 * OrganizerEvent - Minimal event interface for view changes
 *
 * Emitted when user interacts with the organizer menu.
 * Parent should listen and update both OrganizerState and jquery-core's ViewState.
 */
export interface OrganizerEvent {
  type: 'fieldToggled' | 'indicatorSelected' | 'groupSelected' | 'stackSelected' | 'sliceSelected' | 'reset';
  state: OrganizerState;
  source?: 'user' | 'api';
}
