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

export interface OrganizerXOption {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface OrganizerXField {
  id: string;
  label: string;
  disabled?: boolean;
  /**
   * Sous-menu de variantes pour cet axe (ex. découpage d'une date). La première option est la valeur par défaut
   * lorsque `selectedXOption` n'est pas défini.
   */
  options?: OrganizerXOption[];
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
  /** Libellé affiché pour une valeur de slice ; la clé brute reste utilisée pour le filtrage. */
  formatLabel?: (raw: string) => string;
  /** Ordre d'affichage des valeurs de slice ; par défaut, tri natif des clés. */
  compareKeys?: (a: string, b: string) => number;
}

export interface OrganizerChartType {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

export interface OrganizerTemplate {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  xField?: string;
  yField?: string;
  yAggregate?: string;
  groupBy?: string;
  selectedSlices?: string[];
}

export interface OrganizerActionsConfig {
  /** Libellé du sous-menu. Par défaut : Action ou Actions selon le nombre d'actions visibles. */
  label?: string;
  /** Affiche l'action de copie lorsque onCopyVisual est fourni. Le callback peut ouvrir une modale ou une UI personnalisée. */
  showCopy?: boolean;
  /** Affiche l'action de plein écran lorsque onToggleFullscreen est fourni. */
  showFullscreen?: boolean;
  /** Icône optionnelle affichée devant le libellé du sous-menu. */
  icon?: string;
}

export interface OrganizerConfig {
  fields?: OrganizerViewField[];
  xFields?: OrganizerXField[];
  yFields?: OrganizerYField[];
  groups?: OrganizerViewGroup[];
  slices?: OrganizerViewSlice[];
  templates?: OrganizerTemplate[];
  chartTypes?: OrganizerChartType[];

  onFetchFieldData?: (fieldId: string) => Promise<string[] | Record<string, any>[]>;
  onFetchSliceData?: (filterKey: string) => Observable<any[]> | Promise<any[]>;
  /**
   * Convertit la sélection de clés d'un slice lorsque la variante de l'axe X change (ex. jour → heure).
   * Reçoit la sélection actuelle, les clés de l'ancienne liste et celles de la nouvelle ; renvoie
   * la sélection équivalente, ou `null` si elle ne peut pas être conservée (le panneau est alors fermé).
   */
  remapSliceSelection?: (selectedKeys: string[], previousKeys: string[], nextKeys: string[]) => string[] | null;
  onSliceClick?: () => void;

  showExport?: boolean;
  onExport?: () => void;
  onExportVisual?: () => void;
  onExportData?: () => void;

  /** Affiche les commandes liées au visuel courant dans le sous-menu Actions. */
  showActions?: boolean;
  actions?: OrganizerActionsConfig;
  onCopyVisual?: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;

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
  /** Clés à réappliquer par slice (alignées sur sliceConfigs), ex. après un changement de granularité. */
  selectedKeys?: string[][];
}

export interface OrganizerState {
  viewMode?: 'chart' | 'table';

  visibleFields?: string[];

  selectedChartType?: string;

  selectedX?: string;
  /** Variante choisie dans le sous-menu de `selectedX` ; absent = première option. */
  selectedXOption?: string;
  selectedY?: string;
  selectedYAggregate?: string;

  selectedGroupBy?: string;
  selectedSlices?: string[];
  selectedTemplate?: string;
}

export interface OrganizerButtonEvent {
  type: 'fieldToggled' | 'xSelected' | 'ySelected' | 'groupBySelected' | 'templateSelected' | 'sliceSelected' | 'chartTypeSelected' | 'reset' | 'viewSwitched';
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
