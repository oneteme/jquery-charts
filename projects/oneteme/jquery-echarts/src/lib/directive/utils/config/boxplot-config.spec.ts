import { buildBoxplotModel, boxplotConfigurator, computeBoxplotBox } from './boxplot-config';

describe('computeBoxplotBox', () => {
  it('retourne null sans valeur', () => {
    expect(computeBoxplotBox([])).toEqual({ box: null, outliers: [] });
  });

  it('gère une valeur unique sans valeur aberrante', () => {
    expect(computeBoxplotBox([7])).toEqual({ box: [7, 7, 7, 7, 7], outliers: [] });
  });

  it('calcule les quartiles et la médiane sur un échantillon simple', () => {
    const { box, outliers } = computeBoxplotBox([1, 2, 3, 4, 5]);
    expect(box).toEqual([1, 2, 3, 4, 5]);
    expect(outliers).toEqual([]);
  });

  it('détecte une valeur haute aberrante (Tukey 1.5 IQR) et l\'exclut des moustaches', () => {
    const { box, outliers } = computeBoxplotBox([1, 2, 3, 4, 5, 100]);
    expect(outliers).toEqual([100]);
    const [low, q1, median, q3, high] = box as number[];
    expect(low).toBe(1);
    expect(high).toBe(5);
    expect(median).toBeCloseTo(3.5, 6);
    expect(q1).toBeCloseTo(2.25, 6);
    expect(q3).toBeCloseTo(4.75, 6);
  });

  it('détecte une valeur basse aberrante', () => {
    const { box, outliers } = computeBoxplotBox([-100, 1, 2, 3, 4, 5]);
    expect(outliers).toEqual([-100]);
    expect((box as number[])[0]).toBe(1);
  });

  it('ne doit pas lever de RangeError sur un très grand tableau (boucle au lieu du spread de Math.min/max)', () => {
    const values = Array.from({ length: 200000 }, (_, i) => i % 1000);
    expect(() => computeBoxplotBox(values)).not.toThrow();
  });
});

describe('buildBoxplotModel', () => {
  const config: any = { series: [{ name: 'S', data: { xField: 'c', yField: 'v' } }] };

  it('calcule une boîte par catégorie et null pour une catégorie vide', () => {
    const rows = [
      { c: 'A', v: 1 },
      { c: 'A', v: 2 },
      { c: 'A', v: 3 },
      { c: 'C', v: 9 },
    ];
    const model = buildBoxplotModel(rows, config);
    expect(model.categories).toEqual(['A', 'C']);
    expect(model.series.length).toBe(1);
    expect(model.series[0].boxes[0]).toEqual([1, 1.5, 2, 2.5, 3]);
    expect(model.series[0].boxes[1]).toEqual([9, 9, 9, 9, 9]);
  });

  it('enregistre les valeurs aberrantes avec l\'index de catégorie', () => {
    const rows = [
      { c: 'A', v: 1 },
      { c: 'A', v: 2 },
      { c: 'A', v: 3 },
      { c: 'A', v: 4 },
      { c: 'A', v: 5 },
      { c: 'A', v: 100 },
      { c: 'B', v: 1 },
    ];
    const model = buildBoxplotModel(rows, config);
    expect(model.series[0].outliers).toEqual([[0, 100]]);
  });

  it('ignore les valeurs non numériques', () => {
    const rows: any[] = [
      { c: 'A', v: 'x' },
      { c: 'A', v: 4 },
    ];
    const model = buildBoxplotModel(rows, config);
    expect(model.series[0].boxes[0]).toEqual([4, 4, 4, 4, 4]);
  });
});

describe('boxplotConfigurator', () => {
  const config: any = { series: [{ name: 'S', data: { xField: 'c', yField: 'v' } }] };

  it('supporte uniquement boxplot', () => {
    expect(boxplotConfigurator.supports('boxplot')).toBeTrue();
    expect(boxplotConfigurator.supports('scatter')).toBeFalse();
  });

  it('produit une série boxplot et une série scatter pour les aberrantes', () => {
    const rows = [{ c: 'A', v: 1 }, { c: 'A', v: 2 }];
    const model = boxplotConfigurator.buildChartData(rows, config, 'boxplot');
    const option: any = boxplotConfigurator.buildOption(model, 'boxplot', config);
    expect(option.series.map((s: any) => s.type)).toEqual(['boxplot', 'scatter']);
    expect(option.series[1].name).toBe('S (valeurs aberrantes)');
    expect(option.xAxis.data).toEqual(['A']);
    expect(option.legend.data).toEqual(['S']);
  });
});
