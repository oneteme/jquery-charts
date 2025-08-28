import { HeatmapHandler } from '../directive/utils/charts-handlers/complex-handlers/heatmap.handler';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TEAMS = ['Team A', 'Team B', 'Team C', 'Team D', 'Team E'];

function makeHeatmapRawData(): any {
  return [
    [0, 0, 10], [0, 1, 15], [0, 2, 20],
    [1, 0, 25], [1, 1, 30], [1, 2, 35],
    [2, 0, 40], [2, 1, 45], [2, 2, 50]
  ];
}

describe('HeatmapHandler', () => {
  it('doit transformer des données optimales en séries heatmap avec catégories', () => {
    const data = makeHeatmapRawData();
    const handler = new HeatmapHandler();
    const config: any = { title: 'Performance par mois', xtitle: 'Mois', ytitle: 'Valeur' };

    const result = handler.handle(data, config, false);

    expect(result.series?.[0]?.type).toBe('heatmap');
    expect(result.xAxis?.type).toBe('category');
    expect(result.yAxis?.type).toBe('category');
    expect(Array.isArray(result.series?.[0]?.data)).toBeTrue();
    expect(result.series?.[0]?.data.length).toBe(9); // 9 data points as defined in makeHeatmapRawData
    
    // Vérifier que les catégories sont bien générées (peu importe leur contenu exact)
    expect(Array.isArray(result.xAxis?.categories)).toBeTrue();
    expect(Array.isArray(result.yAxis?.categories)).toBeTrue();
  });
});
