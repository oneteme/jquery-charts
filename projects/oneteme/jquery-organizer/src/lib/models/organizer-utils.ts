import { OrganizerYField } from './organizer-config.interface';

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
