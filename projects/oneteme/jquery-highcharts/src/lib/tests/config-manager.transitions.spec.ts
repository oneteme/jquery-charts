import { ConfigurationManager } from '../directive/utils/config-manager';

function base(withParts: any = {}): any {
  return JSON.parse(JSON.stringify({
    chart: {},
    plotOptions: { series: { marker: { enabled: true } } },
    ...withParts,
  }));
}

describe('ConfigurationManager - pipeline de transitions (cleanAllSpecialConfigs + cleanForChartType)', () => {
  it('heatmap -> bubble: supprime colorAxis/plotOptions.heatmap et préserve series.marker', () => {
    const b = base({ plotOptions: { heatmap: { colsize: 24 }, series: { marker: { enabled: false } } }, colorAxis: { min: 0 } });
    const user: any = { options: { plotOptions: { series: { marker: { enabled: true } } } } };

    const out = ConfigurationManager.applyUserConfigWithTransformation(b, user, 'bubble' as any, false);

    expect((out as any).colorAxis).toBeUndefined();
    expect((out.plotOptions as any)?.heatmap).toBeUndefined();
    expect((out.plotOptions as any)?.series?.marker?.enabled).toBeTrue();
  });

  it('treemap -> column: supprime plotOptions.treemap/colorAxis et préserve plotOptions.series (marker)', () => {
    const b = base({ plotOptions: { treemap: { layoutAlgorithm: 'squarified' }, series: { marker: { enabled: true } } }, colorAxis: { min: 0 } });
    const out = ConfigurationManager.applyUserConfigWithTransformation(b, { options: {} } as any, 'column' as any, false);

    expect(out.plotOptions?.treemap).toBeUndefined();
    expect(out.colorAxis).toBeUndefined();
    // la pipeline du ConfigurationManager préserve la config utilisateur (marker)
    expect(out.plotOptions?.series?.marker?.enabled).toBeTrue();
  });

  it('boxplot -> column: supprime headerFormat/pointFormat/shared', () => {
    const b = base({ plotOptions: { boxplot: { whiskerWidth: 1 } }, tooltip: { headerFormat: 'h', pointFormat: 'p', shared: true } });
    const out = ConfigurationManager.applyUserConfigWithTransformation(b, { options: {} } as any, 'column' as any, false);

    expect(((out.plotOptions as any)?.boxplot)).toBeUndefined();
    expect(((out.tooltip as any)?.headerFormat)).toBeUndefined();
    expect(((out.tooltip as any)?.pointFormat)).toBeUndefined();
    expect(((out.tooltip as any)?.shared)).toBeUndefined();
  });

  it('radialBar: applique inverted=true et pane configuré', () => {
    const b = base();
    const out = ConfigurationManager.applyUserConfigWithTransformation(b, { options: {} } as any, 'radialBar' as any, false);

    expect((out.chart as any)?.polar).toBeTrue();
    expect((out.chart as any)?.inverted).toBeTrue();
    expect((out.pane as any)?.innerSize).toBe('20%');
  });
});
