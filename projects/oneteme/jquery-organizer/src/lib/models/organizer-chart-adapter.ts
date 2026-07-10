import { OrganizerButtonEvent, OrganizerConfig, OrganizerState, OrganizerUnifiedState, OrganizerViewSlice, OrganizerXField } from './organizer-config.interface';
import { buildYFields, normalizeOrganizerState, resolveMatchingTemplateId, resolveYKey } from './organizer-utils';
import { UnitConfig } from '@oneteme/jquery-core';
import { OrganizerChartConfig, getGroupItems, getIndicatorItems, getFilterItems, getStackItems } from './organizer-chart-config';

export { OrganizerChartConfig, getGroupItems, getIndicatorItems, getFilterItems, getStackItems } from './organizer-chart-config';

export interface OrganizerChartItem {
  key: string;
  selected: boolean;
  menu: { label: string };
  unit?: string | UnitConfig;
  jquery?: {
    value: (s?: string) => string;
    buildAlias: (s?: string) => string;
    buildName?: (item: any, value?: string) => string;
    buildColor?: (value?: string) => string;
  };
  group?: string;
  extra?: {
    stacks?: { optional: boolean; items: OrganizerChartItem[] };
    [key: string]: any;
  };
}

export interface OrganizerChartSection {
  optional: boolean;
  items: OrganizerChartItem[];
}

export interface OrganizerChartBridgeOptions {
  onFetchSliceData?: OrganizerConfig['onFetchSliceData'];
  onExportVisual?: () => void;
  onExportData?: () => void;
  switchView?: OrganizerConfig['switchView'];
}

export interface OrganizerChartBinding {
  config: OrganizerConfig;
  state: OrganizerState;
}

export interface OrganizerChartEventResult {
  binding: OrganizerChartBinding;
  shouldRefetch: boolean;
}

export function chartConfigToOrganizer(
  chartConfig: OrganizerChartConfig | null | undefined,
  options: OrganizerChartBridgeOptions = {}
): OrganizerConfig {
  if (!chartConfig) {
    console.debug('[OrganizerChartAdapter] Empty chart config, returning empty organizer config');
    return {};
  }

  console.debug('[OrganizerChartAdapter] Converting chart config to organizer', {
    hasGroups: !!chartConfig.groups,
    indicatorCount: chartConfig.indicators?.items?.length ?? 0,
    filterCount: chartConfig.filters?.items?.length ?? 0
  });

  const { onFetchSliceData, onExportVisual, onExportData, switchView } = options;
  const indicators = getIndicatorItems(chartConfig);
  const activeIndicator = indicators.find(i => i.selected);

  const baseXFields: OrganizerXField[] = getGroupItems(chartConfig)
    .filter(g => !_isSynthetic(g))
    .map(g => ({ id: g.key, label: g.menu.label || g.key }));

  const yFields = buildYFields(
    indicators.map(i => ({ id: i.key, label: i.menu.label || i.key, group: i.group }))
  );

  const stackFields = getStackItems(activeIndicator)
    .filter((s: OrganizerChartItem) => !_isSynthetic(s))
    .map((s: OrganizerChartItem) => ({ id: s.key, label: s.menu.label || s.key }));

  const seenKeys = new Set<string>();
  const mergedGroupFields = [...baseXFields, ...stackFields].filter(f => {
    if (seenKeys.has(f.id)) return false;
    seenKeys.add(f.id);
    return true;
  });

  return {
    xFields: mergedGroupFields,
    yFields,
    groups: mergedGroupFields,
    slices: getFilterItems(chartConfig).map(f => ({ id: f.key, label: f.menu.label || f.key }) as OrganizerViewSlice),
    templates: chartConfig.templates,
    showReset: false,
    onFetchSliceData,
    showExport: !!(onExportVisual || onExportData),
    onExportVisual,
    onExportData,
    switchView,
  };
}

export function chartConfigToState(chartConfig: OrganizerChartConfig | null | undefined): OrganizerState {
  if (!chartConfig) {
    console.debug('[OrganizerChartAdapter] Empty chart config for state conversion');
    return {};
  }

  const indicators = getIndicatorItems(chartConfig);
  const activeIndicator = indicators.find(i => i.selected);
  const activeStack = getStackItems(activeIndicator).find((s: OrganizerChartItem) => s.selected);
  const activeGroup = getGroupItems(chartConfig).find(g => g.selected);
  const activeSlices = getFilterItems(chartConfig).filter(f => f.selected);
  const indicatorGroup = activeIndicator?.group;

  console.debug('[OrganizerChartAdapter] Current chart state', {
    activeGroup: activeGroup?.key,
    activeIndicator: activeIndicator?.key,
    activeStack: activeStack?.key,
    sliceCount: activeSlices.length
  });

  const state = {
    selectedX: activeGroup?.key,
    selectedY: indicatorGroup ?? activeIndicator?.key,
    selectedYAggregate: indicatorGroup ? activeIndicator?.key : undefined,
    selectedGroupBy: activeStack?.key,
    selectedSlices: activeSlices.map(f => f.key),
  };
  const organizerConfig = chartConfigToOrganizer(chartConfig);
  return normalizeOrganizerState(state, organizerConfig);
}

export function buildOrganizerChartBinding(
  chartConfig: OrganizerChartConfig | null | undefined,
  options: OrganizerChartBridgeOptions = {}
): OrganizerChartBinding {
  return {
    config: chartConfigToOrganizer(chartConfig, options),
    state: chartConfigToState(chartConfig)
  };
}

export function chartConfigToUnifiedState(
  chartConfig: OrganizerChartConfig | null | undefined,
  viewMode: 'chart' | 'table' = 'chart'
): OrganizerUnifiedState {
  const state = chartConfigToState(chartConfig);
  return {
    viewMode,
    dimension: state.selectedX,
    metric: resolveYKey(state.selectedY, state.selectedYAggregate),
    metricAggregate: state.selectedYAggregate,
    breakdown: state.selectedGroupBy,
    filters: state.selectedSlices,
  };
}

export function applyOrganizerEventToChart(
  event: OrganizerButtonEvent,
  chartConfig: OrganizerChartConfig | null | undefined
): void {
  if (!chartConfig) {
    console.debug('[OrganizerChartAdapter] Cannot apply event to empty chart config');
    return;
  }

  console.debug('[OrganizerChartAdapter] Applying organizer event', { eventType: event.type, state: event.state });

  const state = event.state;
  _cleanSynthetics(chartConfig);
  if (state.selectedX !== undefined) _applyXSelection(state.selectedX, chartConfig);
  if (state.selectedY !== undefined) _applyYSelection(state.selectedY, state.selectedYAggregate, chartConfig);
  const effectiveGroupBy = state.selectedGroupBy !== state.selectedX ? state.selectedGroupBy : undefined;
  _applyGroupBySelection(effectiveGroupBy, chartConfig);
  if (state.selectedSlices !== undefined) _applySliceSelection(state.selectedSlices, chartConfig);
  event.resolvedYUnit = resolveYUnit(chartConfig, event.state.selectedY, event.state.selectedYAggregate);
}

export function handleOrganizerChartEvent(
  event: OrganizerButtonEvent,
  chartConfig: OrganizerChartConfig | null | undefined,
  currentBinding: OrganizerChartBinding | undefined,
  options: OrganizerChartBridgeOptions = {}
): OrganizerChartEventResult {
  console.debug('[OrganizerChartAdapter] Handling organizer event', { eventType: event.type });

  if (event.type === 'viewSwitched') {
    return {
      binding: {
        config: chartConfigToOrganizer(chartConfig, options),
        state: { ...event.state }
      },
      shouldRefetch: false
    };
  }

  applyOrganizerEventToChart(event, chartConfig);

  if (event.type === 'ySelected' || event.type === 'templateSelected') {
    return {
      binding: buildOrganizerChartBinding(chartConfig, options),
      shouldRefetch: true
    };
  }

  return {
    binding: {
      config: currentBinding?.config ?? chartConfigToOrganizer(chartConfig, options),
      state: event.state
    },
    shouldRefetch: event.type !== 'sliceSelected'
  };
}

export function resolveYUnit(
  chartConfig: OrganizerChartConfig | null | undefined,
  selectedY: string | undefined,
  selectedYAggregate: string | undefined
): string | UnitConfig | undefined {
  if (!chartConfig || !selectedY) return undefined;
  const actualKey = resolveYKey(selectedY, selectedYAggregate);
  return getIndicatorItems(chartConfig).find(i => i.key === actualKey)?.unit;
}

const _syntheticItems = new WeakSet<OrganizerChartItem>();

function _makeSynthetic(item: OrganizerChartItem): OrganizerChartItem {
  _syntheticItems.add(item);
  return item;
}

function _isSynthetic(item: OrganizerChartItem): boolean {
  return _syntheticItems.has(item);
}

function _cleanSynthetics(chartConfig: OrganizerChartConfig): void {
  if (chartConfig.groups?.items) {
    chartConfig.groups.items = chartConfig.groups.items.filter(g => !_isSynthetic(g));
  }
  if (chartConfig.indicators?.items) {
    chartConfig.indicators.items.forEach(ind => {
      if (ind.extra?.stacks?.items) {
        ind.extra.stacks.items = ind.extra.stacks.items.filter((s: OrganizerChartItem) => !_isSynthetic(s));
      }
    });
  }
}

function _applyXSelection(selectedX: string, chartConfig: OrganizerChartConfig): void {
  const groupItems = getGroupItems(chartConfig);
  const isGroupItem = groupItems.some(g => g.key === selectedX);
  if (isGroupItem) {
    groupItems.forEach(g => { g.selected = g.key === selectedX; });
    return;
  }
  const indicators = getIndicatorItems(chartConfig);
  const allStacks: OrganizerChartItem[] = indicators.flatMap(i => getStackItems(i));
  const stackItem = allStacks.find(s => s.key === selectedX);
  if (stackItem) {
    groupItems.forEach(g => { g.selected = false; });
    groupItems.push(_makeSynthetic({
      key: stackItem.key,
      selected: true,
      menu: stackItem.menu,
      jquery: stackItem.jquery
        ? { value: () => stackItem.jquery!.value(), buildAlias: () => stackItem.jquery!.buildAlias() }
        : undefined,
    }));
  }
}

function _applyYSelection(selectedY: string, selectedYAggregate: string | undefined, chartConfig: OrganizerChartConfig): void {
  const actualKey = resolveYKey(selectedY, selectedYAggregate);
  const indicators = getIndicatorItems(chartConfig);
  indicators.forEach(i => { i.selected = i.key === actualKey; });
  indicators.forEach(i => {
    getStackItems(i).forEach((s: OrganizerChartItem) => { s.selected = false; });
  });
}

function _applyGroupBySelection(effectiveGroupBy: string | undefined, chartConfig: OrganizerChartConfig): void {
  const activeIndicator = getIndicatorItems(chartConfig).find(i => i.selected);
  const stackItems: OrganizerChartItem[] = getStackItems(activeIndicator);
  if (effectiveGroupBy === undefined) {
    stackItems.forEach(s => { s.selected = false; });
    return;
  }
  const isStackItem = stackItems.some(s => s.key === effectiveGroupBy);
  if (isStackItem) {
    stackItems.forEach(s => { s.selected = s.key === effectiveGroupBy; });
    return;
  }
  const groupItem = getGroupItems(chartConfig).find(g => g.key === effectiveGroupBy);
  if (groupItem && activeIndicator) {
    stackItems.forEach(s => { s.selected = false; });
    if (!activeIndicator.extra) {
      activeIndicator.extra = { stacks: { optional: true, items: [] } };
    } else if (!activeIndicator.extra.stacks) {
      activeIndicator.extra.stacks = { optional: true, items: [] };
    }
    activeIndicator.extra.stacks.items.push(_makeSynthetic({
      key: groupItem.key,
      selected: true,
      menu: groupItem.menu,
      jquery: groupItem.jquery ? {
        value: () => groupItem.jquery!.value(),
        buildAlias: () => groupItem.jquery!.buildAlias(),
        buildName: (_item: any, value: string) => String(value),
      } : undefined,
    }));
  } else {
    stackItems.forEach(s => { s.selected = false; });
  }
}

function _applySliceSelection(selectedSlices: string[], chartConfig: OrganizerChartConfig): void {
  getFilterItems(chartConfig).forEach(f => { f.selected = selectedSlices.includes(f.key); });
}

