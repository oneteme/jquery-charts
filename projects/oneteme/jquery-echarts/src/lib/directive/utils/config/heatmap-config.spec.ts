import { heatmapConfigurator } from './heatmap-config';

const chart = (series: { name: string; data: (number | null)[] }[], categories: string[]): any => ({
  categories,
  series,
});

describe('heatmapConfigurator', () => {
  it('supporte uniquement heatmap', () => {
    expect(heatmapConfigurator.supports('heatmap')).toBeTrue();
    expect(heatmapConfigurator.supports('bar')).toBeFalse();
  });

  it('produit un triplet [x, y, valeur] par cellule', () => {
    const option: any = heatmapConfigurator.buildOption(
      chart([{ name: 'S1', data: [1, 2] }, { name: 'S2', data: [3, 4] }], ['A', 'B']),
      'heatmap',
      {} as any
    );
    expect(option.series[0].data).toEqual([[0, 0, 1], [1, 0, 2], [0, 1, 3], [1, 1, 4]]);
    expect(option.xAxis.data).toEqual(['A', 'B']);
    expect(option.yAxis.data).toEqual(['S1', 'S2']);
  });

  it('calcule les bornes de visualMap à partir des valeurs', () => {
    const option: any = heatmapConfigurator.buildOption(
      chart([{ name: 'S1', data: [1, 5, 3] }], ['A', 'B', 'C']),
      'heatmap',
      {} as any
    );
    expect(option.visualMap.min).toBe(1);
    expect(option.visualMap.max).toBe(5);
  });

  it('gère un grand jeu de données sans erreur de pile', () => {
    const size = 200000;
    const data = Array.from({ length: size }, (_, i) => i);
    const categories = Array.from({ length: size }, (_, i) => `c${i}`);
    expect(() =>
      heatmapConfigurator.buildOption(chart([{ name: 'S', data }], categories), 'heatmap', {} as any)
    ).not.toThrow();
  });

  it('une cellule vide ne doit pas devenir une valeur 0', () => {
    const option: any = heatmapConfigurator.buildOption(
      chart([{ name: 'S1', data: [null, 2] }], ['A', 'B']),
      'heatmap',
      {} as any
    );
    expect(option.series[0].data.find((d: number[]) => d[0] === 0)).toBeUndefined();
    expect(option.visualMap.min).toBe(2);
  });
});
