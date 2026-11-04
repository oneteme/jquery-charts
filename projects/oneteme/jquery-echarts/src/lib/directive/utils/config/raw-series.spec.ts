import { readRawPoints, categoriesOf, groupByName, toNumber, RawPoint } from './raw-series';

const config = (...names: string[]): any => ({
  series: names.map((name) => ({ name, data: { xField: 'c', yField: 'v' } })),
});

describe('toNumber', () => {
  it('accepte les nombres finis, y compris zéro et négatifs', () => {
    expect(toNumber(0)).toBe(0);
    expect(toNumber(-3.5)).toBe(-3.5);
  });

  it('rejette null, undefined, NaN et Infinity', () => {
    expect(toNumber(null)).toBeUndefined();
    expect(toNumber(undefined)).toBeUndefined();
    expect(toNumber(Number.NaN)).toBeUndefined();
    expect(toNumber(Number.POSITIVE_INFINITY)).toBeUndefined();
  });

  it('convertit une chaîne numérique comme buildChart le fait pour bar et line', () => {
    expect(toNumber('12')).toBe(12);
    expect(toNumber(' -3.5 ')).toBe(-3.5);
  });

  it('rejette une chaîne vide ou blanche (Number(\'\') vaudrait 0)', () => {
    expect(toNumber('')).toBeUndefined();
    expect(toNumber('   ')).toBeUndefined();
  });

  it('rejette une chaîne non numérique', () => {
    expect(toNumber('abc')).toBeUndefined();
  });
});

describe('readRawPoints', () => {
  const rows = [
    { c: 'A', v: 1 },
    { c: null, v: 2 },
    { c: 'B', v: 3 },
  ];

  it('produit un point par ligne et par série', () => {
    const points = readRawPoints(rows, config('S1', 'S2'));
    expect(points.length).toBe(6);
    expect(points.filter((p) => p.name === 'S2').length).toBe(3);
  });

  it('lit x, y et le nom de série pour chaque ligne', () => {
    const [first] = readRawPoints(rows, config('S1'));
    expect(first.x).toBe('A');
    expect(first.y).toBe(1);
    expect(first.name).toBe('S1');
  });
});

describe('categoriesOf', () => {
  it('ignore les catégories null et undefined', () => {
    const points = readRawPoints(
      [{ c: 'A', v: 1 }, { c: null, v: 2 }, { c: undefined, v: 3 }],
      config('S')
    );
    expect(categoriesOf(points)).toEqual(['A']);
  });

  it('retourne chaque catégorie une seule fois', () => {
    const points = readRawPoints(
      [{ c: 'A', v: 1 }, { c: 'A', v: 2 }, { c: 'B', v: 3 }],
      config('S')
    );
    expect(categoriesOf(points)).toEqual(['A', 'B']);
  });
});

describe('groupByName', () => {
  it('regroupe les points par nom en conservant l\'ordre d\'apparition', () => {
    const points = [
      { name: 'S2', x: 'A', y: 1, o: {}, i: 0 },
      { name: 'S1', x: 'A', y: 2, o: {}, i: 1 },
      { name: 'S2', x: 'B', y: 3, o: {}, i: 2 },
    ] as RawPoint[];
    const groups = groupByName(points);

    expect(groups.map((g) => g.name)).toEqual(['S2', 'S1']);
    expect(groups[0].points.length).toBe(2);
  });
});
