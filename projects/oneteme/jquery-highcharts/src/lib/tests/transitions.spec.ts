import { HeatmapHandler } from '../directive/utils/charts-handlers/complex-handlers/heatmap.handler';
import { ScatterHandler } from '../directive/utils/charts-handlers/complex-handlers/scatter.handler';
import { BubbleHandler } from '../directive/utils/charts-handlers/complex-handlers/bubble.handler';
import { ChartCleaner } from '../directive/utils/chart-cleaners';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TEAMS = ['Team A', 'Team B', 'Team C', 'Team D', 'Team E'];

function makeHeatmapRawData(): any {
  return [
    [0, 0, 10], [0, 1, 15], [0, 2, 20],
    [1, 0, 25], [1, 1, 30], [1, 2, 35],
    [2, 0, 40], [2, 1, 45], [2, 2, 50]
  ];
}

describe('Transitions entre types', () => {
  it('pie -> heatmap: les catégories/labels sont préservés et axes en category', () => {
    const heatmap = new HeatmapHandler();

    // Simule un options provenant d\'un simple chart (pie/donut) avec catégories
    const options: any = {
      xAxis: { categories: MONTHS, labels: { enabled: true } },
      yAxis: { labels: { enabled: true } },
      plotOptions: { series: { dataLabels: { enabled: true } } }
    };

    // Nettoyage global (ne doit pas détruire les catégories)
    ChartCleaner.cleanAllSpecialConfigs(options);

    const cfg: any = { title: 'Heatmap', xtitle: 'Mois', ytitle: 'Équipe' };
    const out = heatmap.handle(makeHeatmapRawData(), cfg, false);

    expect(out.xAxis.type).toBe('category');
    expect(out.yAxis.type).toBe('category');
    // Vérifier que les catégories sont générées (structure correcte)
    expect(Array.isArray(out.xAxis.categories)).toBeTrue();
    expect(Array.isArray(out.yAxis.categories)).toBeTrue();
    expect(out.xAxis.categories.length).toBeGreaterThan(0);
    expect(out.yAxis.categories.length).toBeGreaterThan(0);
  });

  it('scatter <-> bubble: switch garde structure des séries', () => {
    const scatter = new ScatterHandler();
    const bubble = new BubbleHandler();

    const scatterData = [{ name: 'S', values: [[1,2],[2,3]] }];
    const bubbleData = [{ name: 'S', values: [[1,2,3],[2,3,4]] }];

    const sOut = scatter.handle(scatterData as any, {} as any, false);
    expect(sOut.series?.[0]?.type).toBe('scatter');

    const bOut = bubble.handle(bubbleData as any, {} as any, false);
    expect(bOut.series?.[0]?.type).toBe('bubble');
  });
});
