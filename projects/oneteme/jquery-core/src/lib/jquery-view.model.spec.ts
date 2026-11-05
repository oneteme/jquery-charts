import {
  applyOrganizerStateToSeries,
  groupableOrganizerFields,
  initialOrganizerState,
  organizerFieldDef,
  organizerFieldDefsFromChartSeries,
  sliceableOrganizerFields,
} from './jquery-view.model';
import { ChartProvider, SerieProvider } from './jquery-core.model';

describe('jquery-view.model', () => {
  describe('organizerFieldDef', () => {
    it('builds a field definition from an id and optional properties', () => {
      expect(organizerFieldDef('date', { label: 'Date', optional: true })).toEqual({ id: 'date', label: 'Date', optional: true });
      expect(organizerFieldDef('plain')).toEqual({ id: 'plain' });
    });
  });

  describe('groupableOrganizerFields', () => {
    it('keeps fields with a label or explicitly groupable, and drops groupable: false', () => {
      const fields = [
        organizerFieldDef('unlabelled'),
        organizerFieldDef('labelled', { label: 'Libellé' }),
        organizerFieldDef('blocked', { label: 'Bloqué', groupable: false }),
        organizerFieldDef('forced', { groupable: true }),
      ];
      expect(groupableOrganizerFields(fields).map(f => f.id)).toEqual(['labelled', 'forced']);
    });
  });

  describe('sliceableOrganizerFields', () => {
    it('keeps fields with a label or explicitly sliceable, and drops sliceable: false', () => {
      const fields = [
        organizerFieldDef('unlabelled'),
        organizerFieldDef('labelled', { label: 'Libellé' }),
        organizerFieldDef('blocked', { label: 'Bloqué', sliceable: false }),
        organizerFieldDef('forced', { sliceable: true }),
      ];
      expect(sliceableOrganizerFields(fields).map(f => f.id)).toEqual(['labelled', 'forced']);
    });
  });

  describe('initialOrganizerState', () => {
    it('selects only non-optional fields and starts without group or slices', () => {
      const state = initialOrganizerState([
        organizerFieldDef('a'),
        organizerFieldDef('b', { optional: true }),
        organizerFieldDef('c'),
      ]);
      expect(state).toEqual({ selectedFieldIds: ['a', 'c'], groupByKey: null, dynamicSliceKeys: [] });
    });

    it('returns an empty selection for no fields', () => {
      expect(initialOrganizerState([]).selectedFieldIds).toEqual([]);
    });
  });

  describe('organizerFieldDefsFromChartSeries', () => {
    it('lists only series with a static non-empty name', () => {
      const series = [
        { name: 'Sessions' },
        { name: () => 'dynamic' },
        { name: '' },
        {},
      ] as unknown as SerieProvider<any, any>[];
      expect(organizerFieldDefsFromChartSeries(series)).toEqual([{ id: 'Sessions', label: 'Sessions' }]);
    });

    it('returns an empty list when there are no series', () => {
      expect(organizerFieldDefsFromChartSeries(undefined as unknown as SerieProvider<any, any>[])).toEqual([]);
    });
  });

  describe('applyOrganizerStateToSeries', () => {
    const dynamicName = () => 'dynamic';

    it('sets visible from the selected field ids for static series names', () => {
      const provider = {
        series: [{ name: 'A' }, { name: 'B' }],
      } as unknown as ChartProvider<any, any>;
      const result = applyOrganizerStateToSeries(provider, { selectedFieldIds: ['B'] });
      expect(result.series).toEqual([
        { name: 'A', visible: false },
        { name: 'B', visible: true },
      ] as unknown as ChartProvider<any, any>['series']);
    });

    it('leaves series with dynamic names unchanged', () => {
      const dynamicSerie = { name: dynamicName };
      const provider = { series: [dynamicSerie, { name: 'A' }] } as unknown as ChartProvider<any, any>;
      const result = applyOrganizerStateToSeries(provider, { selectedFieldIds: [] });
      expect(result.series![0]).toBe(dynamicSerie as unknown as SerieProvider<any, any>);
      expect((result.series![1] as { visible?: boolean }).visible).toBeFalse();
    });

    it('does not mutate the input provider', () => {
      const original = { series: [{ name: 'A' }] } as unknown as ChartProvider<any, any>;
      applyOrganizerStateToSeries(original, { selectedFieldIds: ['A'] });
      expect((original.series![0] as { visible?: boolean }).visible).toBeUndefined();
    });

    it('returns the same provider when it has no series', () => {
      const provider = {} as ChartProvider<any, any>;
      expect(applyOrganizerStateToSeries(provider, { selectedFieldIds: [] })).toBe(provider);
    });
  });
});
