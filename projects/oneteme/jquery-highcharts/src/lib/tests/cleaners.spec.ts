import { ChartCleaner } from '../directive/utils/chart-cleaners';

describe('ChartCleaner', () => {
  it('cleanAllSpecialConfigs: doit être non destructif pour axes (catégories/labels)', () => {
    const options: any = {
      xAxis: { type: 'category', categories: ['A','B'], labels: { enabled: true } },
      yAxis: { type: 'category', categories: ['C','D'], labels: { enabled: true } },
      plotOptions: { heatmap: { colsize: 1 } },
      colorAxis: { min: 0, max: 10 }
    };

    ChartCleaner.cleanAllSpecialConfigs(options);

    expect(options.xAxis?.categories).toEqual(['A','B']);
    expect(options.yAxis?.categories).toEqual(['C','D']);
    expect(options.xAxis?.labels?.enabled).toBeTrue();
    expect(options.yAxis?.labels?.enabled).toBeTrue();
  });
});
