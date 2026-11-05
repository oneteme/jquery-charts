import { buildWaterfallSteps, waterfallConfigurator } from './waterfall-config';

describe('buildWaterfallSteps', () => {
  it('cumule les variations à partir de zéro', () => {
    const steps = buildWaterfallSteps(['Ouverture', 'Achats', 'Ventes'], [10, -4, 6]);
    expect(steps.map((s) => [s.name, s.start, s.end, s.delta])).toEqual([
      ['Ouverture', 0, 10, 10],
      ['Achats', 10, 6, -4],
      ['Ventes', 6, 12, 6],
    ]);
  });

  it('traite une valeur absente comme une variation nulle', () => {
    const steps = buildWaterfallSteps(['A', 'B'], [5, null]);
    expect(steps[1]).toEqual({ name: 'B', delta: 0, start: 5, end: 5 });
  });

  it('gère un cumul qui passe sous zéro', () => {
    const steps = buildWaterfallSteps(['A', 'B'], [-3, -5]);
    expect(steps.map((s) => [s.start, s.end])).toEqual([
      [0, -3],
      [-3, -8],
    ]);
  });
});

describe('waterfallConfigurator', () => {
  const config: any = { series: [{ name: 'Variation', data: { xField: 'c', yField: 'v' } }] };
  const rows = [{ c: 'Ouverture', v: 10 }, { c: 'Achats', v: -4 }, { c: 'Ventes', v: 6 }];

  it('supporte uniquement waterfall', () => {
    expect(waterfallConfigurator.supports('waterfall')).toBeTrue();
    expect(waterfallConfigurator.supports('bar')).toBeFalse();
  });

  it('produit une série custom avec [index, bas, haut, variation] par étape', () => {
    const model = waterfallConfigurator.buildChartData(rows, config, 'waterfall');
    const option: any = waterfallConfigurator.buildOption(model, 'waterfall', config);
    expect(option.xAxis.data).toEqual(['Ouverture', 'Achats', 'Ventes']);
    expect(option.series.length).toBe(1);
    expect(option.series[0].type).toBe('custom');
    expect(option.series[0].data.map((d: any) => d.value)).toEqual([
      [0, 0, 10, 10],
      [1, 6, 10, -4],
      [2, 6, 12, 6],
    ]);
    expect(option.legend.show).toBeFalse();
  });
});
