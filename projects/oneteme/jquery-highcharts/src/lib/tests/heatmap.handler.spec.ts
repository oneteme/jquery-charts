import { HeatmapHandler } from '../directive/utils/charts-handlers/complex-handlers/heatmap.handler';
import { makeHeatmapRawData, MONTHS, TEAMS } from './helpers';

describe('HeatmapHandler', () => {
  it('doit transformer des données optimales en séries heatmap avec catégories', () => {
    const data = makeHeatmapRawData();
    const handler = new HeatmapHandler();
    const config: any = { title: 'Performance par mois', xtitle: 'Mois', ytitle: 'Valeur' };

    const result = handler.handle(data, config, false);

    expect(result.series?.[0]?.type).toBe('heatmap');
    expect(result.xAxis?.categories).toEqual(MONTHS);
    expect(result.yAxis?.categories).toEqual(TEAMS);
    expect(result.xAxis?.type).toBe('category');
    expect(result.yAxis?.type).toBe('category');
    expect(Array.isArray(result.series?.[0]?.data)).toBeTrue();
    expect(result.series?.[0]?.data.length).toBe(MONTHS.length * TEAMS.length);
  });
});
