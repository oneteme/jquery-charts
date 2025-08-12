import { ConfigurationManager } from '../directive/utils/config-manager';
import { cleanPolarConfigs } from '../directive/utils/chart-cleaners';

function baseOptions(): any {
  return { chart: {}, plotOptions: { series: { marker: { enabled: true }, fillOpacity: 0.3, pointPlacement: 'between' } }, xAxis: {}, yAxis: {} };
}

describe('Variantes polaires: persistance et nettoyage', () => {
  it('chaîne polar -> radar -> radarArea -> radialBar conserve chart.polar=true et propriétés series', () => {
    let opts = baseOptions();

    opts = ConfigurationManager.applyUserConfigWithTransformation(opts, { options: { plotOptions: { series: { marker: { enabled: true } } } } } as any, 'polar', false);
    expect((opts.chart as any).polar).toBeTrue();

    opts = ConfigurationManager.applyUserConfigWithTransformation(opts, { options: { } } as any, 'radar', false);
    expect((opts.chart as any).polar).toBeTrue();

    opts = ConfigurationManager.applyUserConfigWithTransformation(opts, { options: { } } as any, 'radarArea', false);
    expect((opts.chart as any).polar).toBeTrue();

    opts = ConfigurationManager.applyUserConfigWithTransformation(opts, { options: { } } as any, 'radialBar', false);
    expect((opts.chart as any).polar).toBeTrue();

    // Les propriétés utilisateur doivent être remergeables ensuite
    const userApply = { options: { plotOptions: { series: { marker: { enabled: false }, fillOpacity: 0.5 } } } } as any;
    const after = ConfigurationManager.applyUserConfigWithTransformation(opts, userApply, 'radar', false);
  expect(after.plotOptions?.series?.marker?.enabled).toBeFalse();
  expect(((after.plotOptions as any)?.series as any)?.fillOpacity).toBe(0.5);
  });

  it('cleanPolarConfigs: ne doit pas supprimer catégories/labels/min/max des axes', () => {
    const options: any = {
      chart: { polar: true },
      xAxis: { categories: ['A','B'], labels: { enabled: true }, min: 0, max: 5 },
      yAxis: { categories: ['S1','S2'], labels: { enabled: false }, min: 0, max: 100 },
      plotOptions: { series: { marker: { enabled: true }, fillOpacity: 0.4 } }
    };

    cleanPolarConfigs(options);

    expect(options.xAxis.categories).toEqual(['A','B']);
    expect(options.xAxis.labels.enabled).toBeTrue();
    expect(options.xAxis.min).toBe(0);
    expect(options.xAxis.max).toBe(5);

    expect(options.yAxis.categories).toEqual(['S1','S2']);
    expect(options.yAxis.labels.enabled).toBeFalse();
    expect(options.yAxis.min).toBe(0);
    expect(options.yAxis.max).toBe(100);
  });
});
