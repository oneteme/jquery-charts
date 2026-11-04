import { gaugeConfigurator, computeGaugeLayout } from './gauge-config';

describe('computeGaugeLayout', () => {
  it('ne produit aucun centre sans élément', () => {
    expect(computeGaugeLayout(0).centers).toEqual([]);
  });

  it('centre une jauge unique', () => {
    const layout = computeGaugeLayout(1);
    expect(layout.centers).toEqual([['50.00%', '50.00%']]);
    expect(layout.radius).toBe('80%');
  });

  it('dispose 4 jauges sur une grille 2x2', () => {
    const layout = computeGaugeLayout(4);
    expect(layout.centers).toEqual([
      ['25.00%', '25.00%'],
      ['75.00%', '25.00%'],
      ['25.00%', '75.00%'],
      ['75.00%', '75.00%'],
    ]);
    expect(layout.radius).toBe('40%');
  });

  it('garde tous les centres dans le conteneur', () => {
    for (let count = 1; count <= 12; count++) {
      const { centers } = computeGaugeLayout(count);
      expect(centers.length).toBe(count);
      centers.forEach(([x, y]) => {
        expect(parseFloat(x)).toBeGreaterThan(0);
        expect(parseFloat(x)).toBeLessThan(100);
        expect(parseFloat(y)).toBeGreaterThan(0);
        expect(parseFloat(y)).toBeLessThan(100);
      });
    }
  });
});

describe('gaugeConfigurator', () => {
  const rows = [
    { cat: 'A', val: 10 },
    { cat: 'B', val: 40 },
    { cat: 'B', val: 60 },
  ];
  const config: any = { series: [{ name: 'S', data: { xField: 'cat', yField: 'val' }, unit: '%' }] };

  it('supporte uniquement gauge', () => {
    expect(gaugeConfigurator.supports('gauge')).toBeTrue();
    expect(gaugeConfigurator.supports('pie')).toBeFalse();
  });

  it('garde la dernière valeur de chaque catégorie, comme buildChart', () => {
    const model = gaugeConfigurator.buildChartData(rows, config, 'gauge');
    expect(model.items.map((i) => [i.name, i.value])).toEqual([
      ['A', 10],
      ['B', 60],
    ]);
  });

  it('applique la plage 0-100 par défaut et l\'unité', () => {
    const model = gaugeConfigurator.buildChartData(rows, config, 'gauge');
    expect(model.items[0].min).toBe(0);
    expect(model.items[0].max).toBe(100);
    expect(model.items[0].unit).toBe('%');
  });

  it('respecte min/max définis sur la série', () => {
    const custom: any = { series: [{ name: 'S', data: { xField: 'cat', yField: 'val' }, min: 20, max: 200 }] };
    const model = gaugeConfigurator.buildChartData(rows, custom, 'gauge');
    expect(model.items[0].min).toBe(20);
    expect(model.items[0].max).toBe(200);
  });

  it('ignore les valeurs non numériques', () => {
    const dirty: any[] = [
      { cat: 'A', val: 'abc' },
      { cat: 'B', val: null },
      { cat: 'C', val: 5 },
    ];
    const model = gaugeConfigurator.buildChartData(dirty, config, 'gauge');
    expect(model.items.map((i) => i.name)).toEqual(['C']);
  });

  it('une valeur invalide sur une ligne ultérieure ne doit pas effacer la dernière valeur valide', () => {
    const later: any[] = [
      { cat: 'A', val: 10 },
      { cat: 'A', val: null },
    ];
    const model = gaugeConfigurator.buildChartData(later, config, 'gauge');
    expect(model.items.map((i) => [i.name, i.value])).toEqual([['A', 10]]);
  });

  it('préfixe le nom de la série quand il y a plusieurs séries', () => {
    const multi: any = {
      series: [
        { name: 'S1', data: { xField: 'cat', yField: 'val' } },
        { name: 'S2', data: { xField: 'cat', yField: 'val' } },
      ],
    };
    const model = gaugeConfigurator.buildChartData(rows, multi, 'gauge');
    expect(model.items.map((i) => i.name)).toEqual(['A (S1)', 'B (S1)', 'A (S2)', 'B (S2)']);
  });

  it('construit une série gauge par élément avec le suffixe d\'unité', () => {
    const model = gaugeConfigurator.buildChartData(rows, config, 'gauge');
    const option: any = gaugeConfigurator.buildOption(model, 'gauge', config);
    expect(option.series.length).toBe(2);
    expect(option.series[0].type).toBe('gauge');
    expect(option.series[0].detail.formatter).toBe('{value} %');
    expect(option.series[0].data).toEqual([{ value: 10, name: 'A' }]);
    expect(option.grid).toBeUndefined();
    expect(option.xAxis).toBeUndefined();
  });
});
