import { Observable } from 'rxjs';
import { SliceConfig } from '../slice-panel/slice-panel.model';

// ─────────────────────────────────────────────────────────────
// Shared
// ─────────────────────────────────────────────────────────────

/** État de chargement d'un champ en lazy-loading */
export type FieldState = 'ready' | 'loading' | 'error';

// ─────────────────────────────────────────────────────────────
// Mode TABLE : toggle visibilité colonnes
// ─────────────────────────────────────────────────────────────

/** Champ de table : toggle visibilité */
export interface OrganizerViewField {
  id: string;
  label: string;
  icon?: string;
  visible?: boolean;
  state?: FieldState;
}

// ─────────────────────────────────────────────────────────────
// Mode CHART : axes X et Y
// ─────────────────────────────────────────────────────────────

/** Axe X — champ catégoriel/temporel, single-select */
export interface OrganizerXField {
  id: string;
  label: string;
  disabled?: boolean;
}

/** Agrégat applicable à un champ Y numérique (ex: Max, Min, Moyenne, P50…) */
export interface OrganizerYAggregate {
  id: string;
  label: string;
}

/**
 * Axe Y — métrique mesurée.
 * - Si `aggregates` défini → ouvre un sous-menu d'agrégats (Durée, Latence…)
 * - Sinon → sélection directe (Count, ou métrique déjà calculée côté API)
 */
export interface OrganizerYField {
  id: string;
  label: string;
  aggregates?: OrganizerYAggregate[];
  disabled?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Grouper par / Filtrer par
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// Template prédéfini
// ─────────────────────────────────────────────────────────────

/**
 * Template prédéfini par le dev : applique X + Y + groupBy en une action.
 * Évite à l'utilisateur final de reconfigurer manuellement.
 */
export interface OrganizerTemplate {
  id: string;
  label: string;
  icon?: string;
  xField?: string;
  yField?: string;
  yAggregate?: string;
  groupBy?: string;
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
  // ── Mode TABLE : toggle visibilité colonnes
  fields?: OrganizerViewField[];

  // ── Mode CHART : axes X et Y
  xFields?: OrganizerXField[];
  yFields?: OrganizerYField[];

  // ── Grouper par (catégoriels, commun table + chart)
  groups?: OrganizerViewGroup[];

  // ── Filtrer par
  slices?: OrganizerViewSlice[];

  // ── Templates prédéfinis (chart uniquement)
  templates?: OrganizerTemplate[];

  // ── Callbacks
  /** Lazy-loading : données d'un champ sur demande */
  onFetchFieldData?: (fieldId: string) => Promise<string[] | Record<string, any>[]>;
  /** Lazy-loading : données d'un filtre slice sur demande */
  onFetchSliceData?: (filterKey: string) => Observable<any[]> | Promise<any[]>;
  /** Callback optionnel au clic sur "Filtrer par" */
  onSliceClick?: () => void;

  // ── Export
  showExport?: boolean;
  /** Export direct (mode table) — si défini seul, bouton sans sous-menu */
  onExport?: () => void;
  /** Export du visuel du graphique (PNG/SVG) — active le sous-menu d'export */
  onExportVisual?: () => void;
  /** Export des données sous-jacentes (CSV/Excel) — active le sous-menu d'export */
  onExportData?: () => void;

  // ── Préférences
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

/**
 * SliceState - State emitted by OrganizerButtonComponent when slice data is ready
 * Contains the data needed to render a slice-panel alongside the chart.
 * null = no active filter (panel should be hidden).
 */
export interface OrganizerSliceState {
  sliceConfigs: SliceConfig<any>[];
  tasks: any[];
}

/** État courant de l'organizer (sélections de l'utilisateur) */
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

/** Événement émis par OrganizerButtonComponent lors d'une interaction */
export interface OrganizerButtonEvent {
  type: 'fieldToggled' | 'xSelected' | 'ySelected' | 'groupBySelected' | 'templateSelected' | 'sliceSelected' | 'reset' | 'viewSwitched';
  state: OrganizerState;
  source?: 'user' | 'api';
}

/**
 * État unifié valide pour les deux modes chart et table.
 * - `dimension`  → axe X en chart, colonne de regroupement en table
 * - `metric`     → indicateur Y en chart, colonne numérique en table
 * - `breakdown`  → stack/groupBy en chart, groupBy en table
 */
export interface OrganizerUnifiedState {
  viewMode: 'chart' | 'table';
  dimension?: string;
  metric?: string;
  metricAggregate?: string;
  breakdown?: string;
  filters?: string[];
}
