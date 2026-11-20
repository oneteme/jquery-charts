import { OrganizerConfig, OrganizerState, OrganizerSubmenu, OrganizerTemplate, OrganizerViewGroup, OrganizerViewSlice, OrganizerXField, OrganizerYField } from './organizer-config.interface';

type OrganizerStateConfig = Pick<OrganizerConfig, 'xFields' | 'yFields' | 'groups' | 'slices' | 'templates' | 'chartTypes'>;

/** Entrée de menu : soit une entrée simple (`item`), soit un sous-menu (`submenu`) regroupant `items`. */
export interface OrganizerMenuEntry<T> {
  item?: T;
  submenu?: OrganizerSubmenu;
  items?: T[];
}

/** Regroupe les entrées partageant un même `submenu.id` sous une seule entrée, à la position de la première. */
export function buildMenuEntries<T extends { submenu?: OrganizerSubmenu }>(items: T[] | undefined): OrganizerMenuEntry<T>[] {
  const entries: OrganizerMenuEntry<T>[] = [];
  const bySubmenu = new Map<string, OrganizerMenuEntry<T>>();
  for (const item of items ?? []) {
    if (!item.submenu) {
      entries.push({ item });
      continue;
    }
    let entry = bySubmenu.get(item.submenu.id);
    if (!entry) {
      entry = { submenu: item.submenu, items: [] };
      bySubmenu.set(item.submenu.id, entry);
      entries.push(entry);
    }
    entry.items!.push(item);
  }
  return entries;
}

/** Mémorise les entrées de menu tant que la référence de la liste source ne change pas. */
export function createMenuEntriesMemo<T extends { submenu?: OrganizerSubmenu }>(): (items: T[] | undefined) => OrganizerMenuEntry<T>[] {
  let source: T[] | undefined;
  let entries: OrganizerMenuEntry<T>[] = [];
  return items => {
    if (items !== source) {
      source = items;
      entries = buildMenuEntries(items);
    }
    return entries;
  };
}

export interface OrganizerYIndicator {
  id: string;
  label: string;
  group?: string;
}

export function buildYFields(indicators: OrganizerYIndicator[]): OrganizerYField[] {
  const ordered: string[] = [];
  const map = new Map<string, OrganizerYField>();

  for (const indicator of indicators) {
    const groupKey = indicator.group;
    if (groupKey) {
      if (!map.has(groupKey)) {
        ordered.push(groupKey);
        map.set(groupKey, { id: groupKey, label: groupKey, aggregates: [] });
      }
      const parent = map.get(groupKey);
      if (parent?.aggregates) {
        parent.aggregates.push({ id: indicator.id, label: indicator.label });
      }
    } else {
      ordered.push(indicator.id);
      map.set(indicator.id, { id: indicator.id, label: indicator.label });
    }
  }

  return ordered.map(k => map.get(k)).filter((f): f is OrganizerYField => !!f);
}

export function resolveYKey(
  selectedY: string | undefined,
  selectedYAggregate: string | undefined
): string | undefined {
  return selectedYAggregate ?? selectedY;
}

export function normalizeOrganizerState(
  state: OrganizerState | undefined,
  config: OrganizerStateConfig
): OrganizerState {
  const base = state || {};
  const normalizedY = normalizeYSelection(base.selectedY, base.selectedYAggregate, config.yFields);
  const selectedX = hasOption(config.xFields, base.selectedX) ? base.selectedX : undefined;
  const selectedXOption = resolveXOption(config.xFields, selectedX, base.selectedXOption);
  const selectedChartType = hasOption(config.chartTypes, base.selectedChartType) ? base.selectedChartType : undefined;
  const selectedGroupBy = hasOption(config.groups, base.selectedGroupBy) ? base.selectedGroupBy : undefined;
  const selectedGroupByOption = resolveGroupByOption(config.groups, selectedGroupBy, base.selectedGroupByOption);
  const selectedSlices = (base.selectedSlices || []).filter(sliceId => hasOption(config.slices, sliceId));
  const selectedSliceOptions = resolveSliceOptions(config.slices, base.selectedSliceOptions);

  const normalized: OrganizerState = {
    ...base,
    selectedChartType,
    selectedX,
    selectedXOption,
    selectedY: normalizedY.selectedY,
    selectedYAggregate: normalizedY.selectedYAggregate,
    selectedGroupBy,
    selectedGroupByOption,
    selectedSlices,
    selectedSliceOptions,
  };

  return {
    ...normalized,
    selectedTemplate: resolveMatchingTemplateId(config.templates, normalized, config)
  };
}

export function normalizeTemplateToState(
  template: OrganizerTemplate,
  currentState: OrganizerState | undefined,
  config: OrganizerStateConfig
): OrganizerState {
  const base = normalizeOrganizerState(currentState, config);
  const normalizedY = normalizeYSelection(template.yField, template.yAggregate, config.yFields, base);

  const nextState: OrganizerState = {
    viewMode: base.viewMode,
    visibleFields: base.visibleFields,
    selectedChartType: base.selectedChartType,
    selectedX: hasOption(config.xFields, template.xField) ? template.xField : base.selectedX,
    selectedY: normalizedY.selectedY,
    selectedYAggregate: normalizedY.selectedYAggregate,
    selectedGroupBy: hasOption(config.groups, template.groupBy) ? template.groupBy : base.selectedGroupBy,
    selectedSlices: (template.selectedSlices || []).filter(sliceId => hasOption(config.slices, sliceId)),
  };

  const resolvedTemplateId = resolveMatchingTemplateId(config.templates, nextState, config);
  return {
    ...nextState,
    selectedTemplate: resolvedTemplateId ?? template.id
  };
}

export function resolveMatchingTemplateId(
  templates: OrganizerTemplate[] | undefined,
  state: OrganizerState | undefined,
  config: OrganizerStateConfig
): string | undefined {
  if (!templates?.length) return undefined;

  const normalizedState = normalizeStateWithoutTemplate(state, config);
  return templates.find(template => {
    const templateState = normalizeStateWithoutTemplate(
      normalizeTemplateToComparableState(template, normalizedState, config),
      config
    );
    return sameOrganizerState(templateState, normalizedState);
  })?.id;
}

function normalizeStateCore(
  selectedX: string | undefined,
  selectedY: string | undefined,
  selectedYAggregate: string | undefined,
  selectedGroupBy: string | undefined,
  selectedSlices: string[] | undefined,
  config: Pick<OrganizerConfig, 'xFields' | 'yFields' | 'groups' | 'slices'>,
  originalState?: OrganizerState
): OrganizerState {
  const normalizedY = normalizeYSelection(selectedY, selectedYAggregate, config.yFields, originalState);
  return {
    selectedX: hasOption(config.xFields, selectedX) ? selectedX : undefined,
    selectedY: normalizedY.selectedY,
    selectedYAggregate: normalizedY.selectedYAggregate,
    selectedGroupBy: hasOption(config.groups, selectedGroupBy) ? selectedGroupBy : undefined,
    selectedSlices: (selectedSlices || []).filter(sliceId => hasOption(config.slices, sliceId)),
  };
}

function normalizeTemplateToComparableState(
  template: OrganizerTemplate,
  baseState: OrganizerState,
  config: OrganizerStateConfig
): OrganizerState {
  return normalizeStateCore(
    template.xField,
    template.yField,
    template.yAggregate,
    template.groupBy,
    template.selectedSlices,
    config,
    baseState
  );
}

function normalizeStateWithoutTemplate(
  state: OrganizerState | undefined,
  config: OrganizerStateConfig
): OrganizerState {
  const base = state || {};
  return normalizeStateCore(
    base.selectedX,
    base.selectedY,
    base.selectedYAggregate,
    base.selectedGroupBy,
    base.selectedSlices,
    config,
    base
  );
}

function normalizeYSelection(
  selectedY: string | undefined,
  selectedYAggregate: string | undefined,
  yFields: OrganizerYField[] | undefined,
  fallbackState?: OrganizerState
): Pick<OrganizerState, 'selectedY' | 'selectedYAggregate'> {
  if (!selectedY) {
    return {
      selectedY: fallbackState?.selectedY,
      selectedYAggregate: fallbackState?.selectedYAggregate,
    };
  }

  const directField = yFields?.find(field => field.id === selectedY);
  if (directField) {
    if (!directField.aggregates?.length) {
      return { selectedY: directField.id, selectedYAggregate: undefined };
    }

    const matchedAggregate = selectedYAggregate
      ? directField.aggregates.find(aggregate => aggregate.id === selectedYAggregate)
      : undefined;
    const fallbackAggregate = fallbackState?.selectedY === directField.id
      ? directField.aggregates.find(aggregate => aggregate.id === fallbackState.selectedYAggregate)
      : undefined;
    const resolvedAggregate = matchedAggregate ?? fallbackAggregate ?? directField.aggregates[0];

    return {
      selectedY: directField.id,
      selectedYAggregate: resolvedAggregate?.id,
    };
  }

  const aggregateParent = yFields?.find(field => field.aggregates?.some(aggregate => aggregate.id === selectedY));
  if (aggregateParent) {
    return {
      selectedY: aggregateParent.id,
      selectedYAggregate: selectedY,
    };
  }

  return {
    selectedY: fallbackState?.selectedY,
    selectedYAggregate: fallbackState?.selectedYAggregate,
  };
}

function sameOrganizerState(left: OrganizerState, right: OrganizerState): boolean {
  return left.selectedX === right.selectedX
    && left.selectedY === right.selectedY
    && left.selectedYAggregate === right.selectedYAggregate
    && left.selectedGroupBy === right.selectedGroupBy
    && sameSlices(left.selectedSlices || [], right.selectedSlices || []);
}

export function sameSlices(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].sort((a, b) => a.localeCompare(b));
  const sortedRight = [...right].sort((a, b) => a.localeCompare(b));
  return sortedLeft.every((value, index) => value === sortedRight[index]);
}

function hasOption(items: Array<{ id: string }> | undefined, id: string | undefined): boolean {
  return !!id && !!items?.some(item => item.id === id);
}

function resolveXOption(
  xFields: OrganizerXField[] | undefined,
  selectedX: string | undefined,
  selectedXOption: string | undefined
): string | undefined {
  const options = xFields?.find(field => field.id === selectedX)?.options;
  return hasOption(options, selectedXOption) ? selectedXOption : undefined;
}

function resolveGroupByOption(
  groups: OrganizerViewGroup[] | undefined,
  selectedGroupBy: string | undefined,
  selectedGroupByOption: string | undefined
): string | undefined {
  const options = groups?.find(group => group.id === selectedGroupBy)?.options;
  return hasOption(options, selectedGroupByOption) ? selectedGroupByOption : undefined;
}

/** Conserve l'option choisie de chaque filtre, indépendamment de sa sélection, tant qu'elle reste valide. */
function resolveSliceOptions(
  slices: OrganizerViewSlice[] | undefined,
  selectedSliceOptions: Record<string, string> | undefined
): Record<string, string> | undefined {
  const resolved: Record<string, string> = {};
  for (const slice of slices ?? []) {
    const option = selectedSliceOptions?.[slice.id];
    if (hasOption(slice.options, option)) {
      resolved[slice.id] = option!;
    }
  }
  return Object.keys(resolved).length ? resolved : undefined;
}
