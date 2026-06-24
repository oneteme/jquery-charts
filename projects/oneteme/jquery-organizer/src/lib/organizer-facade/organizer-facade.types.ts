import { SliceConfig } from '../slice-panel/slice-panel.model';
import { OrganizerConfig } from '@oneteme/jquery-core';

/**
 * Contrat minimal qu'un descripteur de champ doit respecter pour être utilisé
 * dans OrganizerFacade, quel que soit le renderer (table, chart, KPI...).
 *
 * TableColumnProvider satisfait ce contrat structurellement (sans extends explicite).
 */
export interface OrganizerFieldDef {
  key: string;
  header?: string;
  icon?: string;
  optional?: boolean;
  groupable?: boolean;
  sliceable?: boolean;
}

/**
 * Configuration du panneau organizer.
 * Utilisé par OrganizerFacade.update().
 *
 * Note: `config` utilise OrganizerConfig de jquery-core (enabled, enableFieldRemoval, enableFieldDragDrop).
 * Dans jquery-table, TableOrganizerConfig est mappé vers OrganizerConfig au moment de l'appel.
 */
export interface OrganizerPanelConfig<TField extends OrganizerFieldDef = OrganizerFieldDef> {
  /** Options d'activation et de comportement du panneau. */
  config?: OrganizerConfig;
  /** Tous les champs disponibles (colonnes pour une table, indicateurs pour un chart...). */
  fields: TField[];
  /** Slices statiques déclarées dans la configuration. */
  sliceConfigs: SliceConfig<any>[];
  /** Label affiché quand aucun groupe / aucune slice n'est actif. Défaut : 'Aucun'. */
  noneLabel?: string;
  /** Clé de champ utilisée comme group-by par défaut au chargement. */
  defaultGroupBy?: string | null;
}

/** État des champs visibles. */
export interface OrganizerFieldsState<TField extends OrganizerFieldDef = OrganizerFieldDef> {
  activeFields: TField[];
  userCustomized: boolean;
}

/** État du group-by. */
export interface OrganizerGroupByState {
  activeKey: string | null;
  userCustomized: boolean;
}

/** État des slices dynamiques. */
export interface OrganizerSliceByState<TField extends OrganizerFieldDef = OrganizerFieldDef> {
  activeDynamicFields: TField[];
  availableForDynamic: TField[];
  allDynamicFields: TField[];
  activeLabel: string;
}
