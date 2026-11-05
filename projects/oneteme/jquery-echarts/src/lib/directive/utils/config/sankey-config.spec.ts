import { buildSankeyModel, sankeyConfigurator } from './sankey-config';

describe('buildSankeyModel', () => {
  const rows = [
    { s: 'A', v: 2 },
    { s: 'A', v: 3 },
    { s: 'B', v: 1 },
  ];
  const config: any = { series: [{ name: 'T', data: { xField: 's', yField: 'v' } }] };

  it('agrège les liens de même source et cible', () => {
    const model = buildSankeyModel(rows, config);
    expect(model.links).toEqual([
      { source: 'A', target: 'T', value: 5 },
      { source: 'B', target: 'T', value: 1 },
    ]);
  });

  it('construit les nœuds à partir des sources et des cibles uniques', () => {
    const model = buildSankeyModel(rows, config);
    expect(model.nodes.map((n) => n.name)).toEqual(['A', 'T', 'B']);
  });

  it('utilise le nom évalué par ligne comme cible', () => {
    const perRow: any = {
      series: [{ name: (o: any) => o.t, data: { xField: 's', yField: 'v' } }],
    };
    const data = [
      { s: 'A', v: 1, t: 'X' },
      { s: 'A', v: 1, t: 'Y' },
    ];
    const model = buildSankeyModel(data, perRow);
    expect(model.links).toEqual([
      { source: 'A', target: 'X', value: 1 },
      { source: 'A', target: 'Y', value: 1 },
    ]);
  });

  it('ignore les lignes invalides', () => {
    const dirty: any[] = [
      { s: 'A', v: null },
      { s: 'A', v: -4 },
      { s: 'A', v: 'x' },
      { s: null, v: 3 },
      { s: 'C', v: 7 },
    ];
    const model = buildSankeyModel(dirty, config);
    expect(model.links).toEqual([{ source: 'C', target: 'T', value: 7 }]);
  });

  it('ignore les boucles (source égale à la cible)', () => {
    const loop: any = {
      series: [{ name: (o: any) => o.t, data: { xField: 's', yField: 'v' } }],
    };
    const model = buildSankeyModel([{ s: 'A', v: 4, t: 'A' }, { s: 'A', v: 1, t: 'B' }], loop);
    expect(model.links).toEqual([{ source: 'A', target: 'B', value: 1 }]);
    expect(model.nodes.map((n) => n.name)).toEqual(['A', 'B']);
  });

  it('ignore les lignes sans cible', () => {
    const noTarget: any = {
      series: [{ name: (o: any) => o.t, data: { xField: 's', yField: 'v' } }],
    };
    const model = buildSankeyModel([{ s: 'A', v: 1, t: '' }], noTarget);
    expect(model.links).toEqual([]);
    expect(model.nodes).toEqual([]);
  });
});

describe('sankeyConfigurator', () => {
  const config: any = { series: [{ name: 'T', data: { xField: 's', yField: 'v' } }] };

  it('supporte uniquement sankey', () => {
    expect(sankeyConfigurator.supports('sankey')).toBeTrue();
    expect(sankeyConfigurator.supports('bar')).toBeFalse();
  });

  it('produit une série sankey avec nœuds et liens, sans légende', () => {
    const model = sankeyConfigurator.buildChartData([{ s: 'A', v: 2 }], config, 'sankey');
    const option: any = sankeyConfigurator.buildOption(model, 'sankey', config);
    expect(option.series.length).toBe(1);
    expect(option.series[0].type).toBe('sankey');
    expect(option.series[0].links).toEqual([{ source: 'A', target: 'T', value: 2 }]);
    expect(option.series[0].data.map((n: any) => n.name)).toEqual(['A', 'T']);
    expect(option.legend.show).toBeFalse();
  });
});
