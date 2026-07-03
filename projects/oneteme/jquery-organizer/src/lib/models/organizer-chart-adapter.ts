import { OrganizerButtonEvent, OrganizerConfig, OrganizerState, OrganizerUnifiedState, OrganizerViewSlice, OrganizerXField } from './organizer-config.interface';
import { buildYFields, resolveYKey } from './organizer-utils';
import { UnitConfig } from '@oneteme/jquery-core';

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

export interface OrganizerChartConfig {
  groups: OrganizerChartSection;
  indicators: OrganizerChartSection;
  filters?: OrganizerChartSection;
}

export interface OrganizerChartBridgeOptions {
  onFetchSliceData?: OrganizerConfig['onFetchSliceData'];
  onExportVisual?: () => void;
  onExportData?: () => void;
  switchView?: OrganizerConfig['switchView'];
}

export function chartConfigToOrganizer(
  chartConfig: any,
  options: OrganizerChartBridgeOptions = {}
): OrganizerConfig {
  if (!chartConfig) return {};
  const { onFetchSliceData, onExportVisual, onExportData, switchView } = options;
  const activeIndicator = chartConfig.indicators?.items?.find(i => i.selected);

  const baseXFields: OrganizerXField[] = (chartConfig.groups?.items || [])
    .filter(g => !_isSynthetic(g))
    .map(g => ({ id: g.key, label: g.menu.label || g.key }));

  const yFields = buildYFields(
    (chartConfig.indicators?.items || []).map(i => ({ id: i.key, label: i.menu.label || i.key, group: i.group }))
  );

  const stackFields = (activeIndicator?.extra?.stacks?.items || [])
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
    slices: (chartConfig.filters?.items || []).map(f => ({ id: f.key, label: f.menu.label || f.key }) as OrganizerViewSlice),
    showReset: false,
    onFetchSliceData,
    showExport: !!(onExportVisual || onExportData),
    onExportVisual,
    onExportData,
    switchView,
  };
}

export function chartConfigToState(chartConfig: any): OrganizerState {
  if (!chartConfig) return {};
  const activeIndicator = chartConfig.indicators?.items?.find(i => i.selected);
  const activeStack = (activeIndicator?.extra?.stacks?.items || []).find((s: OrganizerChartItem) => s.selected);
  const activeGroup = chartConfig.groups?.items?.find(g => g.selected);
  const activeSlices = (chartConfig.filters?.items || []).filter(f => f.selected);
  const indicatorGroup = activeIndicator?.group;
  return {
    selectedX: activeGroup?.key,
    selectedY: indicatorGroup ?? activeIndicator?.key,
    selectedYAggregate: indicatorGroup ? activeIndicator?.key : undefined,
    selectedGroupBy: activeStack?.key,
    selectedSlices: activeSlices.map(f => f.key),
  };
}

export function chartConfigToUnifiedState(
  chartConfig: any,
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
  chartConfig: any
): void {
  if (!chartConfig) return;
  const state = event.state;
  _cleanSynthetics(chartConfig);
  if (state.selectedX !== undefined) _applyXSelection(state.selectedX, chartConfig);
  if (state.selectedY !== undefined) _applyYSelection(state.selectedY, state.selectedYAggregate, chartConfig);
  const effectiveGroupBy = state.selectedGroupBy !== state.selectedX ? state.selectedGroupBy : undefined;
  _applyGroupBySelection(effectiveGroupBy, chartConfig);
  if (state.selectedSlices !== undefined) _applySliceSelection(state.selectedSlices, chartConfig);
  event.resolvedYUnit = resolveYUnit(chartConfig, event.state.selectedY, event.state.selectedYAggregate);
}

export function resolveYUnit(
  chartConfig: any,
  selectedY: string | undefined,
  selectedYAggregate: string | undefined
): string | UnitConfig | undefined {
  if (!chartConfig || !selectedY) return undefined;
  const actualKey = resolveYKey(selectedY, selectedYAggregate);
  return chartConfig.indicators?.items?.find(i => i.key === actualKey)?.unit;
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
  chartConfig.groups.items = chartConfig.groups.items.filter(g => !_isSynthetic(g));
  chartConfig.indicators.items.forEach(ind => {
    if (ind.extra?.stacks?.items) {
      ind.extra.stacks.items = ind.extra.stacks.items.filter((s: OrganizerChartItem) => !_isSynthetic(s));
    }
  });
}

function _applyXSelection(selectedX: string, chartConfig: OrganizerChartConfig): void {
  const isGroupItem = chartConfig.groups.items.some(g => g.key === selectedX);
  if (isGroupItem) {
    chartConfig.groups.items.forEach(g => { g.selected = g.key === selectedX; });
    return;
  }
  const allStacks: OrganizerChartItem[] = chartConfig.indicators.items.flatMap(i => i.extra?.stacks?.items ?? []);
  const stackItem = allStacks.find(s => s.key === selectedX);
  if (stackItem) {
    chartConfig.groups.items.forEach(g => { g.selected = false; });
    chartConfig.groups.items.push(_makeSynthetic({
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
  chartConfig.indicators.items.forEach(i => { i.selected = i.key === actualKey; });
  chartConfig.indicators.items.forEach(i => {
    i.extra?.stacks?.items?.forEach((s: OrganizerChartItem) => { s.selected = false; });
  });
}

function _applyGroupBySelection(effectiveGroupBy: string | undefined, chartConfig: OrganizerChartConfig): void {
  const activeIndicator = chartConfig.indicators.items.find(i => i.selected);
  const stackItems: OrganizerChartItem[] = activeIndicator?.extra?.stacks?.items ?? [];
  if (effectiveGroupBy === undefined) {
    stackItems.forEach(s => { s.selected = false; });
    return;
  }
  const isStackItem = stackItems.some(s => s.key === effectiveGroupBy);
  if (isStackItem) {
    stackItems.forEach(s => { s.selected = s.key === effectiveGroupBy; });
    return;
  }
  const groupItem = chartConfig.groups.items.find(g => g.key === effectiveGroupBy);
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
  chartConfig.filters?.items?.forEach(f => { f.selected = selectedSlices.includes(f.key); });
}
