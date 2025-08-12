import { HeatmapHandler } from '../directive/utils/charts-handlers/complex-handlers/heatmap.handler';
import { ScatterHandler } from '../directive/utils/charts-handlers/complex-handlers/scatter.handler';
import { BubbleHandler } from '../directive/utils/charts-handlers/complex-handlers/bubble.handler';
import { ChartCleaner } from '../directive/utils/chart-cleaners';
import { makeHeatmapRawData, MONTHS, TEAMS } from './helpers';

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
    expect(out.xAxis.categories).toEqual(MONTHS);
    expect(out.yAxis.categories).toEqual(TEAMS);
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
