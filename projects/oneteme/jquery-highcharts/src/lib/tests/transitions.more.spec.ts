import { HeatmapHandler } from '../directive/utils/charts-handlers/complex-handlers/heatmap.handler';
import { BubbleHandler } from '../directive/utils/charts-handlers/complex-handlers/bubble.handler';
import { StandardHandler } from '../directive/utils/charts-handlers/complex-handlers/standard.handler';
import { TreemapHandler } from '../directive/utils/charts-handlers/complex-handlers/treemap.handler';
import { BoxplotHandler } from '../directive/utils/charts-handlers/complex-handlers/boxplot.handler';
import { cleanTreemapConfigs, cleanHeatmapConfigs, cleanBoxplotConfigs, cleanScatterBubbleConfigs } from '../directive/utils/chart-cleaners';

function makeBubbleRawData(): any {
  return [
    { name: 'Bubble Series', data: [[10, 20, 30], [15, 25, 35], [20, 30, 40]] }
  ];
}

function makeCategorySeriesRawData(): any {
  return [
    { name: 'Category Series', data: [10, 20, 30, 40, 50] }
  ];
}

function makeHeatmapRawData(): any {
  return [
    [0, 0, 10], [0, 1, 15], [0, 2, 20],
    [1, 0, 25], [1, 1, 30], [1, 2, 35],
    [2, 0, 40], [2, 1, 45], [2, 2, 50]
  ];
}

function makeBoxplotRawData(): any {
  return [
    [760, 801, 848, 895, 965],
    [733, 853, 939, 980, 1080],
    [714, 762, 817, 870, 918]
  ];
}

const cfg: any = { title: 'T', xtitle: 'X', ytitle: 'Y' };

function makeCategoryProvider(): any {
  return {
    continue: false,
    series: [
      {
        data: {
          x: (o: any) => o.month || o.category || o.name,
          y: (o: any) => o.value
        },
        name: (o: any) => o.team || 'Série'
      }
    ]
  };
}

describe('Transitions supplémentaires', () => {
  it('treemap -> column: nettoyage/merge permet un standard chart valide', () => {
    const std = new StandardHandler();
    const options: any = {
      plotOptions: { treemap: { levelIsConstant: false } },
      colorAxis: { min: 0 }
    };
    cleanTreemapConfigs(options);
  const out = std.handle(makeCategorySeriesRawData(), makeCategoryProvider(), false);
    expect(Array.isArray(out.series)).toBeTrue();
  });

  it('heatmap -> bubble: cleaning heatmap puis handler bubble', () => {
    const bubble = new BubbleHandler();
    const options: any = { plotOptions: { heatmap: {} }, colorAxis: { min: 0 } };
    cleanHeatmapConfigs(options);
    const out = bubble.handle(makeBubbleRawData(), cfg, false);
    expect(out.series?.[0]?.type).toBe('bubble');
  });

  it('boxplot -> column: cleaning boxplot puis handler standard', () => {
    const std = new StandardHandler();
    const options: any = { plotOptions: { boxplot: {} } };
    cleanBoxplotConfigs(options);
  const out = std.handle(makeCategorySeriesRawData(), makeCategoryProvider(), false);
    expect(Array.isArray(out.series)).toBeTrue();
  });

  it('column -> treemap: handler treemap produit une série treemap', () => {
    const treemap = new TreemapHandler();
    const out = treemap.handle(makeCategorySeriesRawData(), cfg, false);
    expect(out.series?.[0]?.type).toBe('treemap');
  });

  it('bubble -> heatmap: nettoyer bubble puis handler heatmap', () => {
    const heatmap = new HeatmapHandler();
    const options: any = { plotOptions: { bubble: {}, scatter: {} }, tooltip: { shared: true } };
    cleanScatterBubbleConfigs(options);
    const out = heatmap.handle(makeHeatmapRawData(), cfg, false);
    expect(out.series?.[0]?.type).toBe('heatmap');
    expect(out.xAxis?.type).toBe('category');
    expect(out.yAxis?.type).toBe('category');
  });

  it('column -> boxplot: handler boxplot normalise les points', () => {
    const box = new BoxplotHandler();
    const out = box.handle(makeBoxplotRawData(), cfg, false);
    
    // Vérifier que le type de série est correct
    expect(out.series?.[0]?.type).toBe('boxplot');
    
    // Vérifier que la structure de réponse est correcte
    expect(out.series).toBeDefined();
    expect(Array.isArray(out.series)).toBeTrue();
  });
});
