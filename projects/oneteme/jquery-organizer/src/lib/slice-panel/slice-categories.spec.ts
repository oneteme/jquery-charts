import { buildCategoriesFromRows } from './slice-categories';

describe('buildCategoriesFromRows', () => {
  const read = (row: any) => row?.s;

  it('construit les catégories triées avec leurs effectifs et « Vide » en dernier', () => {
    const rows = [{ s: 'b' }, { s: 'a' }, { s: 'b' }, { s: null }, { s: '' }, {}];

    expect(buildCategoriesFromRows(rows, read).map(c => [c.key, c.label, c.count]))
      .toEqual([['a', 'a', 1], ['b', 'b', 2], ['__empty__', 'Vide', 3]]);
  });

  it('les filtres des catégories ne retiennent que les lignes de leur valeur', () => {
    const [a, , empty] = buildCategoriesFromRows([{ s: 'a' }, { s: 'b' }, { s: null }], read);

    expect([{ s: 'a' }, { s: 'b' }, { s: null }, {}].map(r => a.filter!(r))).toEqual([true, false, false, false]);
    expect([{ s: 'a' }, { s: null }, { s: '' }, {}].map(r => empty.filter!(r))).toEqual([false, true, true, true]);
  });

  it('utilise le lecteur de valeur fourni (ex. colonne calculée)', () => {
    const categories = buildCategoriesFromRows([{ n: 1 }, { n: 2 }, { n: 3 }], row => row.n % 2 ? 'impair' : 'pair');

    expect(categories.map(c => [c.key, c.count])).toEqual([['impair', 2], ['pair', 1]]);
    expect(categories[0].filter!({ n: 5 })).toBeTrue();
  });

  it('ne crée pas de catégorie « Vide » sans valeur vide, ni de catégorie sans lignes', () => {
    expect(buildCategoriesFromRows([{ s: 1 }], read).map(c => c.key)).toEqual(['1']);
    expect(buildCategoriesFromRows([], read)).toEqual([]);
    expect(buildCategoriesFromRows(undefined, read)).toEqual([]);
  });
});
