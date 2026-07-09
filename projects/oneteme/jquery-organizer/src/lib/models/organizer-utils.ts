import { OrganizerConfig, OrganizerState, OrganizerTemplate, OrganizerYField } from './organizer-config.interface';

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
  config: Pick<OrganizerConfig, 'xFields' | 'yFields' | 'groups' | 'slices' | 'templates'>
): OrganizerState {
  const base = state || {};
  const normalizedY = normalizeYSelection(base.selectedY, base.selectedYAggregate, config.yFields);
  const selectedX = hasOption(config.xFields, base.selectedX) ? base.selectedX : undefined;
  const selectedGroupBy = hasOption(config.groups, base.selectedGroupBy) ? base.selectedGroupBy : undefined;
  const selectedSlices = (base.selectedSlices || []).filter(sliceId => hasOption(config.slices, sliceId));

  const normalized: OrganizerState = {
    ...base,
    selectedX,
    selectedY: normalizedY.selectedY,
    selectedYAggregate: normalizedY.selectedYAggregate,
    selectedGroupBy,
    selectedSlices,
  };

  return {
    ...normalized,
    selectedTemplate: resolveMatchingTemplateId(config.templates, normalized, config)
  };
}

export function normalizeTemplateToState(
  template: OrganizerTemplate,
  currentState: OrganizerState | undefined,
  config: Pick<OrganizerConfig, 'xFields' | 'yFields' | 'groups' | 'slices' | 'templates'>
): OrganizerState {
  const base = normalizeOrganizerState(currentState, config);
  const normalizedY = normalizeYSelection(template.yField, template.yAggregate, config.yFields, base);

  const nextState: OrganizerState = {
    viewMode: base.viewMode,
    visibleFields: base.visibleFields,
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
  config: Pick<OrganizerConfig, 'xFields' | 'yFields' | 'groups' | 'slices' | 'templates'>
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

function normalizeTemplateToComparableState(
  template: OrganizerTemplate,
  baseState: OrganizerState,
  config: Pick<OrganizerConfig, 'xFields' | 'yFields' | 'groups' | 'slices' | 'templates'>
): OrganizerState {
  const normalizedY = normalizeYSelection(template.yField, template.yAggregate, config.yFields, baseState);
  return {
    ...baseState,
    selectedX: hasOption(config.xFields, template.xField) ? template.xField : baseState.selectedX,
    selectedY: normalizedY.selectedY,
    selectedYAggregate: normalizedY.selectedYAggregate,
    selectedGroupBy: hasOption(config.groups, template.groupBy) ? template.groupBy : baseState.selectedGroupBy,
    selectedSlices: template.selectedSlices
      ? template.selectedSlices.filter(sliceId => hasOption(config.slices, sliceId))
      : (baseState.selectedSlices || []),
    selectedTemplate: undefined,
  };
}

function normalizeStateWithoutTemplate(
  state: OrganizerState | undefined,
  config: Pick<OrganizerConfig, 'xFields' | 'yFields' | 'groups' | 'slices' | 'templates'>
): OrganizerState {
  const base = state || {};
  const normalizedY = normalizeYSelection(base.selectedY, base.selectedYAggregate, config.yFields);
  return {
    ...base,
    selectedX: hasOption(config.xFields, base.selectedX) ? base.selectedX : undefined,
    selectedY: normalizedY.selectedY,
    selectedYAggregate: normalizedY.selectedYAggregate,
    selectedGroupBy: hasOption(config.groups, base.selectedGroupBy) ? base.selectedGroupBy : undefined,
    selectedSlices: (base.selectedSlices || []).filter(sliceId => hasOption(config.slices, sliceId)),
    selectedTemplate: undefined,
  };
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

function sameSlices(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].sort((a, b) => a.localeCompare(b));
  const sortedRight = [...right].sort((a, b) => a.localeCompare(b));
  return sortedLeft.every((value, index) => value === sortedRight[index]);
}

function hasOption(items: Array<{ id: string }> | undefined, id: string | undefined): boolean {
  return !!id && !!items?.some(item => item.id === id);
}
