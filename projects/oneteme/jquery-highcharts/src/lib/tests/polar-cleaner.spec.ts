import { cleanPolarConfigs } from '../directive/utils/chart-cleaners';

describe('cleanPolarConfigs', () => {
  it('nettoie sans supprimer labels/categories/min/max', () => {
    const options: any = {
      chart: { polar: true, inverted: true },
      pane: { innerSize: '60%' },
      xAxis: { labels: { enabled: true }, categories: ['A'], min: 0, max: 10, gridLineWidth: 1 },
      yAxis: { labels: { enabled: true }, categories: ['B'], min: 0, max: 5, gridLineInterpolation: 'circle' },
      plotOptions: { series: { pointPlacement: 'between', pointStart: 0, connectEnds: true, marker: {}, fillOpacity: 0.3 }, column: {}, line: {}, area: {} },
      legend: { enabled: true }
    };

    cleanPolarConfigs(options);

    // chart/pane nettoyés
    expect(options.chart?.polar).toBeUndefined();
    expect(options.chart?.inverted).toBeUndefined();
    expect(options.pane).toBeUndefined();

    // axes: labels/categories/min/max préservés
    expect(options.xAxis.labels.enabled).toBeTrue();
    expect(options.xAxis.categories).toEqual(['A']);
    expect(options.xAxis.min).toBe(0);
    expect(options.xAxis.max).toBe(10);
    expect(options.xAxis.gridLineWidth).toBeUndefined();
    expect(options.yAxis.categories).toEqual(['B']);
    expect(options.yAxis.gridLineInterpolation).toBeUndefined();

    // plotOptions polaires supprimés
    expect(options.plotOptions?.column).toBeUndefined();
    expect(options.plotOptions?.line).toBeUndefined();
    expect(options.plotOptions?.area).toBeUndefined();
    expect(options.plotOptions?.series?.pointPlacement).toBeUndefined();
    expect(options.plotOptions?.series?.connectEnds).toBeUndefined();
  });
});
