import { ConfigurationManager } from '../directive/utils/config-manager';

function base(): any {
  return { chart: {}, plotOptions: { series: { marker: { enabled: true }, innerSize: '40%' } }, tooltip: { shared: true } };
}

describe('ConfigurationManager - enchaînements complets', () => {
  it('pie -> heatmap -> bubble -> column: nettoyages successifs et persistance des options utilisateur (series)', () => {
    let opts = base();

    opts = ConfigurationManager.applyUserConfigWithTransformation(opts, { options: { plotOptions: { series: { innerSize: '60%' } } } } as any, 'pie' as any, false);
    expect(opts.plotOptions?.pie?.innerSize).toBe('60%');
    opts = ConfigurationManager.applyUserConfigWithTransformation(opts, { options: { plotOptions: { series: { marker: { enabled: false } } } } } as any, 'heatmap' as any, false);
    expect(opts.plotOptions?.pie).toBeUndefined();
    expect(opts.colorAxis).toBeUndefined();
    expect(opts.plotOptions?.series?.marker?.enabled).toBeFalse();

    opts = ConfigurationManager.applyUserConfigWithTransformation(opts, { options: { tooltip: { shared: true }, plotOptions: { series: { marker: { enabled: true } } } } } as any, 'bubble' as any, false);
    expect(opts.plotOptions?.heatmap).toBeUndefined();
    expect(opts.colorAxis).toBeUndefined();
    // user config réintroduit tooltip.shared
    expect(opts.tooltip?.shared).toBeTrue();
    expect(opts.plotOptions?.series?.marker?.enabled).toBeTrue();

    opts = ConfigurationManager.applyUserConfigWithTransformation(opts, { options: { plotOptions: { series: { marker: { enabled: true } } } } } as any, 'column' as any, false);
    expect(opts.plotOptions?.scatter).toBeUndefined();
    expect(opts.plotOptions?.bubble).toBeUndefined();
    expect(opts.plotOptions?.series?.marker?.enabled).toBeTrue();
  });

  it('column -> radar -> radialBar -> column: chart.polar activé et pane géré (chart est préservé en clean)', () => {
    let opts: any = { chart: {}, plotOptions: { series: { marker: { enabled: true } } } };

    opts = ConfigurationManager.applyUserConfigWithTransformation(opts, { options: {} } as any, 'column' as any, false);
    expect(opts.chart?.polar).toBeUndefined();

    opts = ConfigurationManager.applyUserConfigWithTransformation(opts, { options: {} } as any, 'radar' as any, false);
    expect(opts.chart?.polar).toBeTrue();
    expect(opts.pane).toBeDefined();

    opts = ConfigurationManager.applyUserConfigWithTransformation(opts, { options: {} } as any, 'radialBar' as any, false);
    expect(opts.chart?.polar).toBeTrue();
    expect(opts.chart?.inverted).toBeTrue();
    expect(opts.pane?.innerSize).toBe('20%');

    opts = ConfigurationManager.applyUserConfigWithTransformation(opts, { options: {} } as any, 'column' as any, false);
    expect(opts.chart?.polar).toBeTrue();
    expect(opts.chart?.inverted).toBeTrue();
    expect(opts.pane).toBeUndefined();
  });
});
