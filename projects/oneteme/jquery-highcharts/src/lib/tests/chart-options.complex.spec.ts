import { configureComplexGraphOptions } from '../directive/utils/chart-options';

describe('configureComplexGraphOptions', () => {
  it('heatmap: impose axes category et labels, sans clobber catégories existantes', () => {
    const options: any = {
      xAxis: { categories: ['A','B'], labels: { enabled: true } },
      yAxis: { categories: ['C','D'], labels: { enabled: true } },
      plotOptions: {}
    };

    configureComplexGraphOptions(options, 'heatmap', false);

    expect(options.xAxis.type).toBe('category');
    expect(options.yAxis.type).toBe('category');
    expect(options.xAxis.labels?.enabled).toBeTrue();
    expect(options.yAxis.labels?.enabled).toBeTrue();
    expect(options.xAxis.categories).toEqual(['A','B']);
    expect(options.yAxis.categories).toEqual(['C','D']);

    // appel idempotent
    configureComplexGraphOptions(options, 'heatmap', false);
    expect(options.xAxis.categories).toEqual(['A','B']);
    expect(options.yAxis.categories).toEqual(['C','D']);
  });

  it('scatter: merge la config scatter sans erreurs', () => {
    const options: any = { plotOptions: {} };
    configureComplexGraphOptions(options, 'scatter', false);
    expect(options.plotOptions?.scatter).toBeTruthy();
  });

  it('bubble: merge la config bubble sans erreurs', () => {
    const options: any = { plotOptions: {} };
    configureComplexGraphOptions(options, 'bubble', false);
    expect(options.plotOptions?.bubble).toBeTruthy();
  });
});
