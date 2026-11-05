import {
  aggregateMultiSeriesData,
  shouldAggregateData,
  transformDataForSimpleChart,
} from './data-aggregation';

describe('aggregateMultiSeriesData', () => {
  it('retourne un tableau vide si les séries sont absentes ou vides', () => {
    expect(aggregateMultiSeriesData(undefined as any, undefined)).toEqual([]);
    expect(aggregateMultiSeriesData(null as any, undefined)).toEqual([]);
    expect(aggregateMultiSeriesData([], undefined)).toEqual([]);
  });

  it('retourne les données de la série unique sans agrégation', () => {
    const data = [1, 2, 3];
    expect(aggregateMultiSeriesData([{ name: 'A', data }], undefined)).toEqual([1, 2, 3]);
  });

  it('retourne un tableau vide pour une série unique sans données', () => {
    expect(aggregateMultiSeriesData([{ name: 'A' }], undefined)).toEqual([]);
  });

  it('additionne les valeurs numériques de chaque série', () => {
    const series = [
      { name: 'A', data: [1, 2, 3] },
      { name: 'B', data: [4] },
    ];
    expect(aggregateMultiSeriesData(series, undefined)).toEqual([
      { name: 'A', y: 6 },
      { name: 'B', y: 4 },
    ]);
  });

  it('utilise le libellé "Série" lorsque le nom est absent', () => {
    const series = [{ data: [1] }, { data: [2] }];
    expect(aggregateMultiSeriesData(series, undefined)).toEqual([
      { name: 'Série', y: 1 },
      { name: 'Série', y: 2 },
    ]);
  });

  it('retourne un total à zéro pour une série sans données', () => {
    const series = [
      { name: 'A', data: [] },
      { name: 'B' },
    ];
    expect(aggregateMultiSeriesData(series, undefined)).toEqual([
      { name: 'A', y: 0 },
      { name: 'B', y: 0 },
    ]);
  });

  it('ignore les points null et undefined', () => {
    const series = [
      { name: 'A', data: [null, 5, undefined] },
      { name: 'B', data: [1] },
    ];
    expect(aggregateMultiSeriesData(series, undefined)).toEqual([
      { name: 'A', y: 5 },
      { name: 'B', y: 1 },
    ]);
  });

  it('lit la propriété y des points objets', () => {
    const series = [
      { name: 'A', data: [{ name: 'x', y: 4 }, { name: 'y', y: 6 }] },
      { name: 'B', data: [1] },
    ];
    expect(aggregateMultiSeriesData(series, undefined)).toEqual([
      { name: 'A', y: 10 },
      { name: 'B', y: 1 },
    ]);
  });

  it('traite un point objet dont y vaut null comme zéro', () => {
    const series = [
      { name: 'A', data: [{ name: 'x', y: null }, 3] },
      { name: 'B', data: [1] },
    ];
    expect(aggregateMultiSeriesData(series, undefined)).toEqual([
      { name: 'A', y: 3 },
      { name: 'B', y: 1 },
    ]);
  });

  it('additionne correctement les valeurs négatives et nulles', () => {
    const series = [
      { name: 'A', data: [-2, 0, 5] },
      { name: 'B', data: [0] },
    ];
    expect(aggregateMultiSeriesData(series, undefined)).toEqual([
      { name: 'A', y: 3 },
      { name: 'B', y: 0 },
    ]);
  });

  it('ignore la liste des catégories', () => {
    const series = [
      { name: 'A', data: [1] },
      { name: 'B', data: [2] },
    ];
    expect(aggregateMultiSeriesData(series, ['Jan', 'Fév'])).toEqual(
      aggregateMultiSeriesData(series, undefined),
    );
  });

  // Un point objet sans y est traité comme valeur brute : total + objet donne la chaîne "0[object Object]" au lieu de 0.
  it('agrège un point objet sans y en le comptant pour zéro', () => {
    const series = [
      { name: 'A', data: [{ name: 'x' }] },
      { name: 'B', data: [1] },
    ];
    expect(aggregateMultiSeriesData(series, undefined)).toEqual([
      { name: 'A', y: 0 },
      { name: 'B', y: 1 },
    ]);
  });
});

describe('shouldAggregateData', () => {
  it('retourne vrai lorsque plusieurs séries sont présentes', () => {
    expect(shouldAggregateData([{ data: [] }, { data: [] }], undefined)).toBeTrue();
  });

  it('retourne faux pour une seule série', () => {
    expect(shouldAggregateData([{ data: [1] }], undefined)).toBeFalse();
  });

  it('retourne faux pour une liste de séries vide', () => {
    expect(shouldAggregateData([], undefined)).toBeFalse();
  });

  it('retourne faux lorsque les séries sont absentes', () => {
    expect(shouldAggregateData(undefined as any, undefined)).toBeFalse();
    expect(shouldAggregateData(null as any, undefined)).toBeFalse();
  });

  it('ne dépend pas des catégories', () => {
    expect(shouldAggregateData([{ data: [] }], ['Jan', 'Fév'])).toBeFalse();
    expect(shouldAggregateData([{ data: [] }, { data: [] }], ['Jan'])).toBeTrue();
  });
});

describe('transformDataForSimpleChart', () => {
  it('agrège les données lorsque plusieurs séries sont présentes', () => {
    const chartData = {
      series: [
        { name: 'A', data: [1, 2] },
        { name: 'B', data: [3] },
      ],
    };
    expect(transformDataForSimpleChart(chartData, {} as any)).toEqual([
      { name: 'A', y: 3 },
      { name: 'B', y: 3 },
    ]);
  });

  it('retourne les données de la série unique', () => {
    const chartData = { series: [{ name: 'A', data: [7, 8] }] };
    expect(transformDataForSimpleChart(chartData, {} as any)).toEqual([7, 8]);
  });

  it('retourne un tableau vide pour une série unique sans données', () => {
    const chartData = { series: [{ name: 'A' }] };
    expect(transformDataForSimpleChart(chartData, {} as any)).toEqual([]);
  });

  it('retourne un tableau vide lorsqu\'aucune série n\'est présente', () => {
    expect(transformDataForSimpleChart({ series: [] }, {} as any)).toEqual([]);
  });

  it('ne modifie pas les données d\'une série unique', () => {
    const data = [{ name: 'x', y: 2 }];
    const chartData = { series: [{ name: 'A', data }] };
    expect(transformDataForSimpleChart(chartData, {} as any)).toBe(data);
  });
});
