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

    it('applique le formatage de slice résolu par clé de filtre', () => {
      const formatLabel = (raw: string) => `[${raw}]`;
      const compareKeys = (a: string, b: string) => a.localeCompare(b);
      const organizer = chartConfigToOrganizer(makeChart(), {
        resolveSliceDisplay: key => key === 'ok' ? { formatLabel, compareKeys } : undefined
      });
      const ok = organizer.slices?.find(s => s.id === 'ok');
      const ko = organizer.slices?.find(s => s.id === 'ko');
      expect(ok?.formatLabel).toBe(formatLabel);
      expect(ok?.compareKeys).toBe(compareKeys);
      expect(ko?.formatLabel).toBeUndefined();
      expect(ko?.label).toBe('KO');
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

    describe('libellés d\'un empilement issu d\'un groupe', () => {
      const withGroupJquery = (chart: OrganizerChartConfig): OrganizerChartConfig => {
        getGroupItems(chart).find(g => g.key === 'app')!.jquery = { value: () => 'app', buildAlias: () => 'app' };
        return chart;
      };
      const groupByApp = event('groupBySelected', { selectedX: 'day', selectedY: 'count', selectedGroupBy: 'app' });
      const stackLabel = (chart: OrganizerChartConfig, value: string): string =>
        getStackItems(getIndicatorItems(chart)[0]).find(s => s.key === 'app')!.jquery!.buildName!(undefined, value);

      it('applique le formateur résolu pour la clé du groupe (ex. date → libellé de période)', () => {
        const chart = withGroupJquery(makeChart());
        handleOrganizerChartEvent(groupByApp, chart, undefined, {
          resolveSliceDisplay: key => key === 'app' ? { formatLabel: raw => `[${raw}]` } : undefined,
        });
        expect(stackLabel(chart, '11-03')).toBe('[11-03]');
      });

      it('garde la valeur brute sans formateur pour la clé', () => {
        const chart = withGroupJquery(makeChart());
        applyOrganizerEventToChart(groupByApp, chart, { resolveSliceDisplay: () => undefined });
        expect(stackLabel(chart, '11-03')).toBe('11-03');
      });

      it('résout le formateur au rendu : suit un changement de granularité sans réappliquer l\'événement', () => {
        let granularity = 'jour';
        const chart = withGroupJquery(makeChart());
        applyOrganizerEventToChart(groupByApp, chart, {
          resolveSliceDisplay: () => ({ formatLabel: raw => `${granularity}:${raw}` }),
        });
        expect(stackLabel(chart, '11-03')).toBe('jour:11-03');
        granularity = 'heure';
        expect(stackLabel(chart, '11-03')).toBe('heure:11-03');
      });
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

    it('xSelected avec une nouvelle selectedXOption reconstruit la config (libellés des tranches recalculés)', () => {
      let granularity = 'hour';
      const opts = { resolveSliceDisplay: (key: string) => key === 'ko' ? { formatLabel: (raw: string) => `${granularity}:${raw}` } : undefined };
      const chart = makeChart();
      const current = buildOrganizerChartBinding(chart, opts);
      granularity = 'dateHour';
      const result = handleOrganizerChartEvent(
        event('xSelected', { selectedX: 'day', selectedY: 'count', selectedXOption: 'dateHour' }), chart, current, opts,
      );
      expect(result.binding.config).not.toBe(current.config);
      expect(result.binding.config.slices?.find(s => s.id === 'ko')?.formatLabel?.('11-03 13')).toBe('dateHour:11-03 13');
    });
  });

  describe('options de l\'axe X', () => {
    const dayOptions = [{ id: 'auto', label: 'Automatique' }, { id: 'date', label: 'Jour' }];
    const opts = { resolveXOptions: (groupKey: string) => (groupKey === 'day' ? dayOptions : undefined) };

    it('chartConfigToOrganizer ajoute options uniquement aux X qui en ont', () => {
      const xFields = chartConfigToOrganizer(makeChart(), opts).xFields ?? [];
      expect(xFields.find(f => f.id === 'day')).toEqual({ id: 'day', label: 'Jour', options: dayOptions });
      expect(xFields.find(f => f.id === 'app')).toEqual({ id: 'app', label: 'Application' });
      expect(xFields.filter(f => 'options' in f).map(f => f.id)).toEqual(['day']);
    });

    it('chartConfigToOrganizer sans resolveXOptions ne produit aucune option', () => {
      const config = chartConfigToOrganizer(makeChart());
      expect(config.xFields?.every(f => !('options' in f))).toBeTrue();
    });

    it('ySelected conserve selectedXOption s\'il appartient aux options du X', () => {
      const chart = makeChart();
      const result = handleOrganizerChartEvent(
        event('ySelected', { selectedX: 'day', selectedY: 'latency', selectedYAggregate: 'max', selectedXOption: 'date' }),
        chart, undefined, opts,
      );
      expect(result.binding.state.selectedXOption).toBe('date');
    });

    it('ySelected écarte un selectedXOption inconnu', () => {
      const chart = makeChart();
      const result = handleOrganizerChartEvent(
        event('ySelected', { selectedX: 'day', selectedY: 'count', selectedXOption: 'ghost' }),
        chart, undefined, opts,
      );
      expect(result.binding.state.selectedXOption).toBeUndefined();
    });

    it('templateSelected réinitialise selectedXOption', () => {
      const chart = makeChart();
      const result = handleOrganizerChartEvent(
        event('templateSelected', { selectedX: 'app', selectedY: 'count', selectedTemplate: 't-app', selectedXOption: 'date' }),
        chart, undefined, opts,
      );
      expect(result.binding.state.selectedXOption).toBeUndefined();
    });

    it('xSelected transmet selectedXOption dans le binding', () => {
      const chart = makeChart();
      const current = buildOrganizerChartBinding(chart, opts);
      const result = handleOrganizerChartEvent(
        event('xSelected', { selectedX: 'day', selectedY: 'count', selectedXOption: 'date' }),
        chart, current, opts,
      );
      expect(result.shouldRefetch).toBeTrue();
      expect(result.binding.state.selectedXOption).toBe('date');
    });
  });

  describe('remappage des tranches', () => {
    it('xSelected avec tranches conservées ne recharge pas le graphique (le remappage s\'en charge)', () => {
      const chart = makeChart();
      const current = buildOrganizerChartBinding(chart);
      const kept = handleOrganizerChartEvent(
        event('xSelected', { selectedX: 'day', selectedY: 'count', selectedXOption: 'date', selectedSlices: ['ok'] }), chart, current,
      );
      expect(kept.shouldRefetch).toBeFalse();
    });

    it('xSelected sans tranche sélectionnée recharge toujours le graphique', () => {
      const chart = makeChart();
      const current = buildOrganizerChartBinding(chart);
      const result = handleOrganizerChartEvent(
        event('xSelected', { selectedX: 'day', selectedY: 'count', selectedXOption: 'date', selectedSlices: [] }), chart, current,
      );
      expect(result.shouldRefetch).toBeTrue();
    });

    it('remapSliceSelection est transmis à la config organizer uniquement s\'il est fourni', () => {
      const remapSliceSelection = jasmine.createSpy('remapSliceSelection');
      expect(chartConfigToOrganizer(makeChart(), { remapSliceSelection }).remapSliceSelection).toBe(remapSliceSelection);
      expect('remapSliceSelection' in chartConfigToOrganizer(makeChart())).toBeFalse();
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
