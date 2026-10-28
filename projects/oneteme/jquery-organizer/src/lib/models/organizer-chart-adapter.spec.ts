import {
  applyOrganizerEventToChart,
  buildOrganizerChartBinding,
  chartConfigToOrganizer,
  chartConfigToState,
  chartConfigToUnifiedState,
  handleOrganizerChartEvent,
  OrganizerChartItem,
  resolveYUnit,
} from './organizer-chart-adapter';
import { OrganizerChartConfig, getGroupItems, getIndicatorItems, getStackItems } from './organizer-chart-config';
import { OrganizerButtonEvent } from './organizer-config.interface';

const item = (key: string, label: string, extra: Partial<OrganizerChartItem> = {}): OrganizerChartItem => ({
  key, selected: false, menu: { label }, ...extra,
});

function makeChart(): OrganizerChartConfig {
  return {
    groups: {
      optional: false,
      items: [item('day', 'Jour', { selected: true }), item('app', 'Application')],
    },
    indicators: {
      optional: false,
      items: [
        item('count', 'Nombre', {
          selected: true,
          unit: 'req',
          extra: { stacks: { optional: true, items: [item('status', 'Statut'), item('method', 'Méthode')] } },
        }),
        item('avg', 'Moyenne', { group: 'latency', unit: 'ms', extra: { stacks: { optional: true, items: [item('status', 'Statut')] } } }),
        item('max', 'Max', { group: 'latency', unit: 'ms' }),
      ],
    },
    filters: {
      optional: true,
      items: [item('ok', 'OK'), item('ko', 'KO', { selected: true })],
    },
    templates: [{ id: 't-app', label: 'Par application', xField: 'app', yField: 'count' }],
  };
}

const event = (type: OrganizerButtonEvent['type'], state: OrganizerButtonEvent['state']): OrganizerButtonEvent => ({ type, state, source: 'user' });
const selected = (items: OrganizerChartItem[]) => items.filter(i => i.selected).map(i => i.key);

describe('organizer-chart-adapter', () => {
  it('n\'écrit rien dans la console', () => {
    const debug = spyOn(console, 'debug');
    const chart = makeChart();
    chartConfigToOrganizer(chart);
    chartConfigToState(chart);
    handleOrganizerChartEvent(event('xSelected', { selectedX: 'app', selectedY: 'count' }), chart, undefined);
    expect(debug).not.toHaveBeenCalled();
  });

  describe('chartConfigToOrganizer', () => {
    it('retourne une config vide sans graphique', () => {
      expect(chartConfigToOrganizer(null)).toEqual({});
      expect(chartConfigToOrganizer(undefined)).toEqual({});
    });

    it('construit X, Y (avec agrégats), groupes, slices et modèles', () => {
      const organizer = chartConfigToOrganizer(makeChart());

      expect(organizer.xFields?.map(f => f.id)).toEqual(['day', 'app', 'status', 'method']);
      expect(organizer.groups).toEqual(organizer.xFields);
      expect(organizer.yFields?.map(f => f.id)).toEqual(['count', 'latency']);
      expect(organizer.yFields?.[1].aggregates?.map(a => a.id)).toEqual(['avg', 'max']);
      expect(organizer.slices?.map(s => s.id)).toEqual(['ok', 'ko']);
      expect(organizer.templates?.[0].id).toBe('t-app');
      expect(organizer.showReset).toBeFalse();
    });

    it('n\'ajoute les empilements que de l\'indicateur sélectionné, sans doublon avec les groupes', () => {
      const chart = makeChart();
      chart.groups!.items.push(item('status', 'Statut (groupe)'));
      const ids = chartConfigToOrganizer(chart).xFields!.map(f => f.id);
      expect(ids.filter(id => id === 'status').length).toBe(1);
    });

    it('active l\'export seulement si un export est fourni', () => {
      expect(chartConfigToOrganizer(makeChart()).showExport).toBeFalse();
      const onExportData = () => undefined;
      const organizer = chartConfigToOrganizer(makeChart(), { onExportData });
      expect(organizer.showExport).toBeTrue();
      expect(organizer.onExportData).toBe(onExportData);
    });
  });

  describe('chartConfigToState', () => {
    it('reflète les éléments sélectionnés', () => {
      const state = chartConfigToState(makeChart());
      expect(state.selectedX).toBe('day');
      expect(state.selectedY).toBe('count');
      expect(state.selectedYAggregate).toBeUndefined();
      expect(state.selectedGroupBy).toBeUndefined();
      expect(state.selectedSlices).toEqual(['ko']);
    });

    it('reflète un indicateur issu d\'un groupe d\'agrégats et un empilement actif', () => {
      const chart = makeChart();
      getIndicatorItems(chart).forEach(i => i.selected = i.key === 'avg');
      getStackItems(getIndicatorItems(chart)[1])[0].selected = true;

      const state = chartConfigToState(chart);
      expect(state.selectedY).toBe('latency');
      expect(state.selectedYAggregate).toBe('avg');
      expect(state.selectedGroupBy).toBe('status');
    });

    it('retourne un état vide sans graphique', () => {
      expect(chartConfigToState(null)).toEqual({});
    });

    it('buildOrganizerChartBinding et chartConfigToUnifiedState sont cohérents', () => {
      const chart = makeChart();
      const binding = buildOrganizerChartBinding(chart);
      expect(binding.state).toEqual(chartConfigToState(chart));
      expect(chartConfigToUnifiedState(chart, 'table')).toEqual({
        viewMode: 'table', dimension: 'day', metric: 'count', metricAggregate: undefined, breakdown: undefined, filters: ['ko'],
      });
    });
  });

  describe('applyOrganizerEventToChart', () => {
    it('applique X, Y, empilement et slices', () => {
      const chart = makeChart();
      const e = event('ySelected', { selectedX: 'app', selectedY: 'latency', selectedYAggregate: 'avg', selectedGroupBy: 'status', selectedSlices: ['ok'] });
      applyOrganizerEventToChart(e, chart);

      expect(selected(getGroupItems(chart))).toEqual(['app']);
      expect(selected(getIndicatorItems(chart))).toEqual(['avg']);
      expect(selected(getStackItems(getIndicatorItems(chart)[1]))).toEqual(['status']);
      expect(selected(chart.filters!.items)).toEqual(['ok']);
      expect(e.resolvedYUnit).toBe('ms');
    });

    it('changer d\'indicateur désélectionne les empilements puis applique celui demandé', () => {
      const chart = makeChart();
      getStackItems(getIndicatorItems(chart)[0])[0].selected = true;
      applyOrganizerEventToChart(event('ySelected', { selectedX: 'day', selectedY: 'avg', selectedYAggregate: undefined }), chart);
      expect(selected(getStackItems(getIndicatorItems(chart)[0]))).toEqual([]);
    });

    it('un empilement choisi comme X devient un groupe synthétique sélectionné', () => {
      const chart = makeChart();
      applyOrganizerEventToChart(event('xSelected', { selectedX: 'status', selectedY: 'count' }), chart);

      expect(selected(getGroupItems(chart))).toEqual(['status']);
      expect(getGroupItems(chart).length).toBe(3);
    });

    it('un groupe choisi comme empilement devient un empilement synthétique', () => {
      const chart = makeChart();
      applyOrganizerEventToChart(event('groupBySelected', { selectedX: 'day', selectedY: 'count', selectedGroupBy: 'app' }), chart);

      const stacks = getStackItems(getIndicatorItems(chart)[0]);
      expect(selected(stacks)).toEqual(['app']);
      expect(stacks.length).toBe(3);
    });

    it('n\'accumule pas d\'éléments synthétiques quand le même événement est appliqué plusieurs fois', () => {
      const chart = makeChart();
      const e = () => event('groupBySelected', { selectedX: 'status', selectedY: 'count', selectedGroupBy: 'app' });
      applyOrganizerEventToChart(e(), chart);
      applyOrganizerEventToChart(e(), chart);
      applyOrganizerEventToChart(e(), chart);

      expect(getGroupItems(chart).length).toBe(3);
      expect(getStackItems(getIndicatorItems(chart)[0]).length).toBe(3);
    });

    it('retire les éléments synthétiques devenus inutiles quand on revient à une sélection native', () => {
      const chart = makeChart();
      applyOrganizerEventToChart(event('xSelected', { selectedX: 'status', selectedY: 'count' }), chart);
      applyOrganizerEventToChart(event('xSelected', { selectedX: 'day', selectedY: 'count' }), chart);

      expect(getGroupItems(chart).map(g => g.key)).toEqual(['day', 'app']);
      expect(selected(getGroupItems(chart))).toEqual(['day']);
    });

    it('ignore l\'empilement identique à X', () => {
      const chart = makeChart();
      applyOrganizerEventToChart(event('groupBySelected', { selectedX: 'app', selectedY: 'count', selectedGroupBy: 'app' }), chart);
      expect(selected(getStackItems(getIndicatorItems(chart)[0]))).toEqual([]);
    });

    it('ne fait rien sans graphique', () => {
      expect(() => applyOrganizerEventToChart(event('reset', {}), undefined)).not.toThrow();
    });
  });

  describe('handleOrganizerChartEvent', () => {
    it('viewSwitched : reconstruit la config sans recharger les données', () => {
      const chart = makeChart();
      const result = handleOrganizerChartEvent(event('viewSwitched', { viewMode: 'table' }), chart, undefined);
      expect(result.shouldRefetch).toBeFalse();
      expect(result.binding.state.viewMode).toBe('table');
      expect(result.binding.config.xFields?.length).toBeGreaterThan(0);
    });

    it('ySelected et templateSelected : reconstruit le binding et recharge', () => {
      const chart = makeChart();
      const result = handleOrganizerChartEvent(
        event('ySelected', { selectedX: 'day', selectedY: 'latency', selectedYAggregate: 'max' }), chart, undefined,
      );
      expect(result.shouldRefetch).toBeTrue();
      expect(result.binding.state.selectedY).toBe('latency');
      expect(result.binding.state.selectedYAggregate).toBe('max');
    });

    it('sliceSelected : ne recharge pas ; les autres événements rechargent', () => {
      const chart = makeChart();
      const current = buildOrganizerChartBinding(chart);
      expect(handleOrganizerChartEvent(event('sliceSelected', { selectedX: 'day', selectedY: 'count', selectedSlices: ['ok'] }), chart, current).shouldRefetch).toBeFalse();
      expect(handleOrganizerChartEvent(event('xSelected', { selectedX: 'app', selectedY: 'count' }), chart, current).shouldRefetch).toBeTrue();
      expect(handleOrganizerChartEvent(event('groupBySelected', { selectedX: 'day', selectedY: 'count', selectedGroupBy: 'status' }), chart, current).shouldRefetch).toBeTrue();
    });

    it('réutilise la config courante du binding pour les événements simples', () => {
      const chart = makeChart();
      const current = buildOrganizerChartBinding(chart);
      const result = handleOrganizerChartEvent(event('xSelected', { selectedX: 'app', selectedY: 'count' }), chart, current);
      expect(result.binding.config).toBe(current.config);
    });
  });

  describe('resolveYUnit', () => {
    it('retourne l\'unité de l\'indicateur ou de l\'agrégat', () => {
      const chart = makeChart();
      expect(resolveYUnit(chart, 'count', undefined)).toBe('req');
      expect(resolveYUnit(chart, 'latency', 'max')).toBe('ms');
    });

    it('retourne undefined sans Y, sans graphique ou pour un indicateur inconnu', () => {
      const chart = makeChart();
      expect(resolveYUnit(chart, undefined, undefined)).toBeUndefined();
      expect(resolveYUnit(null, 'count', undefined)).toBeUndefined();
      expect(resolveYUnit(chart, 'ghost', undefined)).toBeUndefined();
    });
  });
});
