import { OrganizerYField } from './organizer-config.interface';

/**
 * Descriptor d'un indicateur brut, avant groupement.
 *
 * @param id     - identifiant unique de l'indicateur (ex: 'percentile')
 * @param label  - libellé affiché (ex: 'Percentile (95%)')
 * @param group  - groupe de rattachement affiché comme entrée de menu parent (ex: 'Indicateurs')
 *                 Si omis, l'indicateur apparaît comme entrée directe.
 */
export interface OrganizerYIndicator {
  id: string;
  label: string;
  group?: string;
}

/**
 * Construit un tableau de `OrganizerYField` à partir d'une liste plate d'indicateurs.
 *
 * Les indicateurs portant le même `group` sont fusionnés en un seul `OrganizerYField`
 * dont les `aggregates` exposent les entrées enfants.
 * Les indicateurs sans `group` restent des entrées directes.
 *
 * @example
 * buildYFields([
 *   { id: 'count',      label: "Nombre d'Appel" },
 *   { id: 'percentile', label: 'Percentile (95%)', group: 'Indicateurs' },
 *   { id: 'median',     label: 'Médiane',          group: 'Indicateurs' },
 * ]);
 * // → [
 * //     { id: 'count', label: "Nombre d'Appel" },
 * //     { id: 'Indicateurs', label: 'Indicateurs', aggregates: [
 * //         { id: 'percentile', label: 'Percentile (95%)' },
 * //         { id: 'median',     label: 'Médiane' },
 * //     ]},
 * //   ]
 */
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

/**
 * Résout la clé réelle d'un indicateur à partir de l'état de l'organiseur.
 *
 * Quand un indicateur appartient à un groupe, `selectedY` contient le groupe
 * et `selectedYAggregate` contient la clé réelle. Cette fonction retourne
 * toujours la clé réelle à utiliser pour interroger l'API.
 *
 * @param selectedY          - valeur de `OrganizerState.selectedY`
 * @param selectedYAggregate - valeur de `OrganizerState.selectedYAggregate`
 */
export function resolveYKey(
  selectedY: string | undefined,
  selectedYAggregate: string | undefined
): string | undefined {
  return selectedYAggregate ?? selectedY;
}
