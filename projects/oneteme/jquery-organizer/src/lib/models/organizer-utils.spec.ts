import { OrganizerConfig, OrganizerState, OrganizerTemplate } from './organizer-config.interface';
import {
  buildYFields,
  normalizeOrganizerState,
  normalizeTemplateToState,
  resolveMatchingTemplateId,
  resolveYKey,
} from './organizer-utils';
import { TemplateManager } from '../organizer-button/template-manager.utility';

type Cfg = Pick<OrganizerConfig, 'xFields' | 'yFields' | 'groups' | 'slices' | 'templates' | 'chartTypes'>;

const config = (templates: OrganizerTemplate[] = []): Cfg => ({
  xFields: [{ id: 'day', label: 'Jour' }, { id: 'app', label: 'Application' }],
  yFields: [
    { id: 'count', label: 'Nombre' },
    { id: 'latency', label: 'Latence', aggregates: [{ id: 'avg', label: 'Moyenne' }, { id: 'max', label: 'Max' }] },
  ],
  groups: [{ id: 'status', label: 'Statut' }, { id: 'app', label: 'Application' }],
  slices: [{ id: 'ok', label: 'OK' }, { id: 'ko', label: 'KO' }],
  chartTypes: [{ id: 'bar', label: 'Barres' }, { id: 'line', label: 'Courbe' }],
  templates,
});

describe('organizer-utils', () => {

  describe('buildYFields', () => {
    it('regroupe les indicateurs par groupe en conservant l\'ordre de première apparition', () => {
      const fields = buildYFields([
        { id: 'count', label: 'Nombre' },
        { id: 'avg', label: 'Moyenne', group: 'latency' },
        { id: 'size', label: 'Taille' },
        { id: 'max', label: 'Max', group: 'latency' },
        { id: 'p95', label: 'P95', group: 'percentile' },
      ]);

      expect(fields.map(f => f.id)).toEqual(['count', 'latency', 'size', 'percentile']);
      expect(fields[1].aggregates).toEqual([{ id: 'avg', label: 'Moyenne' }, { id: 'max', label: 'Max' }]);
      expect(fields[0].aggregates).toBeUndefined();
    });

    it('retourne une liste vide sans indicateur', () => {
      expect(buildYFields([])).toEqual([]);
    });
  });

  describe('resolveYKey', () => {
    it('privilégie l\'agrégat, sinon le champ Y', () => {
      expect(resolveYKey('latency', 'avg')).toBe('avg');
      expect(resolveYKey('count', undefined)).toBe('count');
      expect(resolveYKey(undefined, undefined)).toBeUndefined();
    });
  });

  describe('normalizeOrganizerState', () => {
    it('retire les sélections absentes de la config', () => {
      const state = normalizeOrganizerState({
        selectedX: 'unknown', selectedGroupBy: 'nope', selectedChartType: 'pie', selectedSlices: ['ok', 'ghost'],
      }, config());

      expect(state.selectedX).toBeUndefined();
      expect(state.selectedGroupBy).toBeUndefined();
      expect(state.selectedChartType).toBeUndefined();
      expect(state.selectedSlices).toEqual(['ok']);
    });

    it('conserve les sélections valides et les champs non gérés (viewMode, visibleFields)', () => {
      const state = normalizeOrganizerState({
        viewMode: 'table', visibleFields: ['a'], selectedX: 'day', selectedGroupBy: 'status', selectedChartType: 'line',
      }, config());

      expect(state.viewMode).toBe('table');
      expect(state.visibleFields).toEqual(['a']);
      expect(state.selectedX).toBe('day');
      expect(state.selectedGroupBy).toBe('status');
      expect(state.selectedChartType).toBe('line');
    });

    it('accepte un état absent', () => {
      const state = normalizeOrganizerState(undefined, config());
      expect(state.selectedSlices).toEqual([]);
      expect(state.selectedX).toBeUndefined();
    });

    it('un champ Y avec agrégats reçoit le premier agrégat par défaut', () => {
      const state = normalizeOrganizerState({ selectedY: 'latency' }, config());
      expect(state.selectedY).toBe('latency');
      expect(state.selectedYAggregate).toBe('avg');
    });

    it('un agrégat valide est conservé, un agrégat inconnu retombe sur le premier', () => {
      expect(normalizeOrganizerState({ selectedY: 'latency', selectedYAggregate: 'max' }, config()).selectedYAggregate).toBe('max');
      expect(normalizeOrganizerState({ selectedY: 'latency', selectedYAggregate: 'zzz' }, config()).selectedYAggregate).toBe('avg');
    });

    it('un identifiant d\'agrégat passé comme Y est remonté vers son champ parent', () => {
      const state = normalizeOrganizerState({ selectedY: 'max' }, config());
      expect(state.selectedY).toBe('latency');
      expect(state.selectedYAggregate).toBe('max');
    });

    it('un champ Y sans agrégat efface l\'agrégat', () => {
      const state = normalizeOrganizerState({ selectedY: 'count', selectedYAggregate: 'avg' }, config());
      expect(state.selectedY).toBe('count');
      expect(state.selectedYAggregate).toBeUndefined();
    });

    it('un Y inconnu est ignoré', () => {
      const state = normalizeOrganizerState({ selectedY: 'ghost' }, config());
      expect(state.selectedY).toBeUndefined();
    });

    it('résout le modèle correspondant à l\'état', () => {
      const templates: OrganizerTemplate[] = [
        { id: 'perf', label: 'Perf', xField: 'day', yField: 'latency', yAggregate: 'avg' },
        { id: 'errors', label: 'Erreurs', xField: 'app', yField: 'count', selectedSlices: ['ko'] },
      ];
      const state = normalizeOrganizerState(
        { selectedX: 'app', selectedY: 'count', selectedSlices: ['ko'] },
        config(templates),
      );
      expect(state.selectedTemplate).toBe('errors');

      const none = normalizeOrganizerState({ selectedX: 'app', selectedY: 'count' }, config(templates));
      expect(none.selectedTemplate).toBeUndefined();
    });
  });

  describe('resolveMatchingTemplateId', () => {
    it('ignore l\'ordre des slices', () => {
      const templates: OrganizerTemplate[] = [{ id: 't', label: 'T', xField: 'day', selectedSlices: ['ok', 'ko'] }];
      const state: OrganizerState = { selectedX: 'day', selectedSlices: ['ko', 'ok'] };
      expect(resolveMatchingTemplateId(templates, state, config(templates))).toBe('t');
    });

    it('retourne undefined sans modèle', () => {
      expect(resolveMatchingTemplateId(undefined, {}, config())).toBeUndefined();
      expect(resolveMatchingTemplateId([], {}, config())).toBeUndefined();
    });

    it('retourne le premier modèle correspondant', () => {
      const templates: OrganizerTemplate[] = [
        { id: 'first', label: '1', xField: 'day' },
        { id: 'second', label: '2', xField: 'day' },
      ];
      expect(resolveMatchingTemplateId(templates, { selectedX: 'day' }, config(templates))).toBe('first');
    });
  });

  describe('normalizeTemplateToState / TemplateManager', () => {
    const template: OrganizerTemplate = {
      id: 'perf', label: 'Perf', xField: 'app', yField: 'latency', yAggregate: 'max', groupBy: 'status', selectedSlices: ['ko', 'ghost'],
    };

    it('applique les champs du modèle sur l\'état courant et marque le modèle', () => {
      const current: OrganizerState = { viewMode: 'chart', visibleFields: ['f'], selectedChartType: 'line', selectedX: 'day' };
      const state = normalizeTemplateToState(template, current, config([template]));

      expect(state.selectedX).toBe('app');
      expect(state.selectedY).toBe('latency');
      expect(state.selectedYAggregate).toBe('max');
      expect(state.selectedGroupBy).toBe('status');
      expect(state.selectedSlices).toEqual(['ko']);
      expect(state.selectedChartType).toBe('line');
      expect(state.viewMode).toBe('chart');
      expect(state.visibleFields).toEqual(['f']);
      expect(state.selectedTemplate).toBe('perf');
    });

    it('conserve la sélection courante pour les champs que le modèle ne définit pas ou qui sont invalides', () => {
      const partial: OrganizerTemplate = { id: 'p', label: 'P', xField: 'ghost' };
      const state = normalizeTemplateToState(partial, { selectedX: 'day', selectedGroupBy: 'status' }, config([partial]));
      expect(state.selectedX).toBe('day');
      expect(state.selectedGroupBy).toBe('status');
    });

    it('TemplateManager délègue à normalizeTemplateToState', () => {
      const cfg = config([template]);
      expect(TemplateManager.applyTemplate(template, undefined, cfg)).toEqual(normalizeTemplateToState(template, undefined, cfg));
    });
  });
});
