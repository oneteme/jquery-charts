import { Observable } from 'rxjs';
import { SliceConfig } from '../slice-panel/slice-panel.model';
import { UnitConfig } from '@oneteme/jquery-core';

export type FieldState = 'ready' | 'loading' | 'error';
/** Police des icônes de colonne ; `material-icons-outlined` par défaut, comme dans l'en-tête du tableau. */
export type OrganizerIconFontSet = 'material-icons-outlined' | 'material-symbols-outlined';
export interface OrganizerViewField {
  id: string;
  label: string;
  icon?: string;
  iconFontSet?: OrganizerIconFontSet;
  /** Icône SVG (markup brut), prioritaire sur `icon`. */
  iconSvg?: string;
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
  icon?: string;
  iconFontSet?: OrganizerIconFontSet;
  /** Icône SVG (markup brut), prioritaire sur `icon`. */
  iconSvg?: string;
  disabled?: boolean;
  /**
   * Sous-menu de variantes pour cet axe (ex. découpage d'une date). La première option est la valeur par défaut
   * lorsque `selectedXOption` n'est pas défini.
   */
  options?: OrganizerXOption[];
  /** Sous-menu regroupant plusieurs axes X (ex. « Statut » : Valeur, Tranche). Les entrées d'un sous-menu n'ont pas de variantes. */
  submenu?: OrganizerSubmenu;
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

/** Sous-menu regroupant plusieurs entrées de « Grouper par » ou « Filtrer par » (ex. « Statut » : Valeur, Tranche). */
export interface OrganizerSubmenu {
  id: string;
  label: string;
  icon?: string;
  iconFontSet?: OrganizerIconFontSet;
  /** Icône SVG (markup brut), prioritaire sur `icon`. */
  iconSvg?: string;
}

export interface OrganizerViewGroup {
  id: string;
  label: string;
  icon?: string;
  iconFontSet?: OrganizerIconFontSet;
  /** Icône SVG (markup brut), prioritaire sur `icon`. */
  iconSvg?: string;
  submenu?: OrganizerSubmenu;
  /** Variantes du groupement (ex. découpage d'une date). La première option est la valeur par défaut. */
  options?: OrganizerXOption[];
}

export interface OrganizerViewSlice {
  id: string;
  label: string;
  icon?: string;
  iconFontSet?: OrganizerIconFontSet;
  /** Icône SVG (markup brut), prioritaire sur `icon`. */
  iconSvg?: string;
  /** Sous-menu : les tranches d'un même sous-menu sont exclusives (une seule sélectionnée à la fois). */
  submenu?: OrganizerSubmenu;
  /** Variantes du filtre (ex. découpage d'une date). La première option est la valeur par défaut. */
  options?: OrganizerXOption[];
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

  /** Affiche l'option « Empiler » en bas du sous-menu « Grouper par ». */
  showStack?: boolean;
  /** Types de graphique pour lesquels « Empiler » a un sens ; absent = tous les types. */
  stackChartTypes?: string[];

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
  /** Variante choisie pour « Grouper par » ; absent = première option. Indépendante de `selectedXOption`. */
  selectedGroupByOption?: string;
  selectedSlices?: string[];
  /** Variante choisie par filtre (clé : id de la tranche) ; absent = première option. Indépendante des autres menus. */
  selectedSliceOptions?: Record<string, string>;
  /** Empilement des séries de « Grouper par ». Absent = empilé (comportement par défaut). */
  stacked?: boolean;
  selectedTemplate?: string;
}

export interface OrganizerButtonEvent {
  type: 'fieldToggled' | 'xSelected' | 'ySelected' | 'groupBySelected' | 'groupByOptionSelected' | 'stackToggled' | 'templateSelected' | 'sliceSelected' | 'sliceOptionSelected' | 'chartTypeSelected' | 'reset' | 'viewSwitched';
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
