import { SliceConfig } from '../slice-panel/slice-panel.model';
import { OrganizerConfig } from '@oneteme/jquery-core';

export interface OrganizerFieldDef {
  key: string;
  header?: string;
  icon?: string;
  optional?: boolean;
  groupable?: boolean;
  sliceable?: boolean;
}
export interface OrganizerPanelConfig<TField extends OrganizerFieldDef = OrganizerFieldDef> {
  config?: OrganizerConfig;
  fields: TField[];
  sliceConfigs: SliceConfig<any>[];
  noneLabel?: string;
  defaultGroupBy?: string | null;
}

export interface OrganizerFieldsState<TField extends OrganizerFieldDef = OrganizerFieldDef> {
  activeFields: TField[];
  userCustomized: boolean;
}

export interface OrganizerGroupByState {
  activeKey: string | null;
  userCustomized: boolean;
}

export interface OrganizerSliceByState<TField extends OrganizerFieldDef = OrganizerFieldDef> {
  activeDynamicFields: TField[];
  availableForDynamic: TField[];
  allDynamicFields: TField[];
  activeLabel: string;
}
