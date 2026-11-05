import { graphConfigurator } from './graph-config';

describe('graphConfigurator', () => {
  const config: any = { series: [{ name: 'T', data: { xField: 's', yField: 'v' } }] };
  const rows = [
    { s: 'A', v: 2 },
    { s: 'A', v: 3 },
    { s: 'B', v: 1 },
  ];

  it('supporte uniquement graph', () => {
    expect(graphConfigurator.supports('graph')).toBeTrue();
    expect(graphConfigurator.supports('sankey')).toBeFalse();
  });

  it('produit une série graph en disposition force, sans légende', () => {
    const model = graphConfigurator.buildChartData(rows, config, 'graph');
    const option: any = graphConfigurator.buildOption(model, 'graph', config);
    expect(option.series.length).toBe(1);
    expect(option.series[0].type).toBe('graph');
    expect(option.series[0].layout).toBe('force');
    expect(option.legend.show).toBeFalse();
  });

  it('agrège les liens et dimensionne les nœuds selon le flux total', () => {
    const model = graphConfigurator.buildChartData(rows, config, 'graph');
    const option: any = graphConfigurator.buildOption(model, 'graph', config);
    expect(option.series[0].links.map((l: any) => [l.source, l.target, l.value])).toEqual([
      ['A', 'T', 5],
      ['B', 'T', 1],
    ]);
    const sizes = Object.fromEntries(option.series[0].data.map((n: any) => [n.name, n.symbolSize]));
    // flux : T = 6 (maximum), A = 5, B = 1
    expect(sizes['T']).toBe(48);
    expect(sizes['A']).toBeCloseTo(16 + (32 * 5) / 6, 5);
    expect(sizes['B']).toBeCloseTo(16 + (32 * 1) / 6, 5);
  });

  it('scale la largeur des liens entre 1 et 10 selon la valeur', () => {
    const model = graphConfigurator.buildChartData(rows, config, 'graph');
    const option: any = graphConfigurator.buildOption(model, 'graph', config);
    const [strong, weak] = option.series[0].links;
    expect(strong.lineStyle.width).toBe(10);
    expect(weak.lineStyle.width).toBeCloseTo(1 + (9 * 1) / 5, 5);
  });
});
