import { ConfigurationManager } from '../directive/utils/config-manager';

function base(): any {
  return { chart: {}, plotOptions: { series: { marker: { enabled: true }, innerSize: '40%' } }, tooltip: { shared: true } };
}

describe('ConfigurationManager - enchaînements complets', () => {
  it('pie -> heatmap -> bubble -> column: nettoyages successifs et persistance des options utilisateur (series)', () => {
    let opts = base();

    // Étape 1: pie (simple) — innerSize doit aller dans plotOptions.pie.innerSize
    opts = ConfigurationManager.applyUserConfigWithTransformation(opts, { options: { plotOptions: { series: { innerSize: '60%' } } } } as any, 'pie' as any, false);
  expect((opts.plotOptions as any)?.pie?.innerSize).toBe('60%');
  // configureSimpleGraphOptions nettoie après smartClean sans preservation => marker non garanti ici

    // Étape 2: heatmap (complexe) — supprimer pie/colorAxis et conserver series
    opts = ConfigurationManager.applyUserConfigWithTransformation(opts, { options: { plotOptions: { series: { marker: { enabled: false } } } } } as any, 'heatmap' as any, false);
    expect((opts.plotOptions as any)?.pie).toBeUndefined();
    expect((opts as any).colorAxis).toBeUndefined();
    expect(((opts.plotOptions as any)?.series as any)?.marker?.enabled).toBeFalse();

    // Étape 3: bubble — supprimer heatmap/colorAxis/tooltip.shared et conserver series
    opts = ConfigurationManager.applyUserConfigWithTransformation(opts, { options: { tooltip: { shared: true }, plotOptions: { series: { marker: { enabled: true } } } } } as any, 'bubble' as any, false);
  expect((opts.plotOptions as any)?.heatmap).toBeUndefined();
  expect((opts as any).colorAxis).toBeUndefined();
  // user config réintroduit tooltip.shared
  expect(((opts.tooltip as any)?.shared)).toBeTrue();
  expect(((opts.plotOptions as any)?.series as any)?.marker?.enabled).toBeTrue();

    // Étape 4: column (basique) — scatter/bubble spécifiques supprimés mais series utilisateur remerge
    opts = ConfigurationManager.applyUserConfigWithTransformation(opts, { options: { plotOptions: { series: { marker: { enabled: true } } } } } as any, 'column' as any, false);
    expect((opts.plotOptions as any)?.scatter).toBeUndefined();
    expect((opts.plotOptions as any)?.bubble).toBeUndefined();
    expect(((opts.plotOptions as any)?.series as any)?.marker?.enabled).toBeTrue();
  });

  it('column -> radar -> radialBar -> column: chart.polar activé et pane géré (chart est préservé en clean)', () => {
    let opts: any = { chart: {}, plotOptions: { series: { marker: { enabled: true } } } };

    // column de départ
    opts = ConfigurationManager.applyUserConfigWithTransformation(opts, { options: {} } as any, 'column' as any, false);
    expect((opts.chart as any)?.polar).toBeUndefined();

    // radar (simple/polar)
    opts = ConfigurationManager.applyUserConfigWithTransformation(opts, { options: {} } as any, 'radar' as any, false);
    expect((opts.chart as any)?.polar).toBeTrue();
    expect((opts.pane as any)).toBeDefined();

    // radialBar
    opts = ConfigurationManager.applyUserConfigWithTransformation(opts, { options: {} } as any, 'radialBar' as any, false);
    expect((opts.chart as any)?.polar).toBeTrue();
    expect((opts.chart as any)?.inverted).toBeTrue();
    expect((opts.pane as any)?.innerSize).toBe('20%');

  // retour column: basic-cleaner supprime pane, mais smartClean réapplique chart préservé
    opts = ConfigurationManager.applyUserConfigWithTransformation(opts, { options: {} } as any, 'column' as any, false);
  expect((opts.chart as any)?.polar).toBeTrue();
  expect((opts.chart as any)?.inverted).toBeTrue();
  expect((opts.pane as any)).toBeUndefined();
  });
});
