import { pivotRows, PivotRowsOptions } from './reshape';

interface Sale {
  day: string;
  team: string;
  amount: number | null;
}

describe('pivotRows', () => {
  const sales: Sale[] = [
    { day: 'mon', team: 'a', amount: 1 },
    { day: 'mon', team: 'b', amount: 2 },
    { day: 'tue', team: 'a', amount: 3 },
  ];

  const base: PivotRowsOptions<Sale> = {
    index: 'day',
    columns: 'team',
    values: ['amount'],
  };

  it('pivots rows into one row per index with one column per value and column key', () => {
    expect(pivotRows(sales, base)).toEqual([
      { day: 'mon', amount_a: 1, amount_b: 2 },
      { day: 'tue', amount_a: 3, amount_b: 0 },
    ]);
  });

  it('keeps first-seen order for indexes and columns', () => {
    const reversed = [...sales].reverse();
    const rows = pivotRows(reversed, base);
    expect(rows.map(r => r['day'])).toEqual(['tue', 'mon']);
    expect(Object.keys(rows[0])).toEqual(['day', 'amount_a', 'amount_b']);
  });

  it('includes forced column values even when no row uses them', () => {
    const rows = pivotRows(sales, { ...base, columnValues: ['a', 'b', 'c'] });
    expect(rows[0]).toEqual({ day: 'mon', amount_a: 1, amount_b: 2, amount_c: 0 });
  });

  it('creates rows for forced index values without data, placed before data-derived rows', () => {
    const rows = pivotRows(sales, { ...base, indexValues: ['wed'] });
    expect(rows.map(r => r['day'])).toEqual(['wed', 'mon', 'tue']);
    expect(rows[0]).toEqual({ day: 'wed', amount_a: 0, amount_b: 0 });
  });

  it('uses the given fill value for empty cells', () => {
    const rows = pivotRows(sales, { ...base, fill: null });
    expect(rows[1]['amount_b']).toBeNull();
  });

  it('computes the fill value per cell with a function', () => {
    const rows = pivotRows(sales, {
      ...base,
      fill: (value, index, column) => `${value}|${index}|${column}`,
    });
    expect(rows[1]['amount_b']).toBe('amount_b|tue|b');
  });

  it('aggregates with sum by default and with min, max, count', () => {
    const duplicated: Sale[] = [...sales, { day: 'mon', team: 'a', amount: 4 }];
    expect(pivotRows(duplicated, base)[0]['amount_a']).toBe(5);
    expect(pivotRows(duplicated, { ...base, aggregate: 'min' })[0]['amount_a']).toBe(1);
    expect(pivotRows(duplicated, { ...base, aggregate: 'max' })[0]['amount_a']).toBe(4);
    expect(pivotRows(duplicated, { ...base, aggregate: 'count' })[0]['amount_a']).toBe(2);
  });

  it('supports a custom aggregate function receiving values and rows', () => {
    const rows = pivotRows(sales, {
      ...base,
      aggregate: (values, matchingRows) => `${values.length}/${matchingRows.length}`,
    });
    expect(rows[0]['amount_a']).toBe('1/1');
  });

  it('returns the fill value when every value of a cell is null', () => {
    const nullable: Sale[] = [{ day: 'mon', team: 'a', amount: null }];
    expect(pivotRows(nullable, base)[0]['amount_a']).toBe(0);
    expect(pivotRows(nullable, { ...base, fill: 'n/a' })[0]['amount_a']).toBe('n/a');
  });

  it('throws when a sum receives a non-numeric value', () => {
    const invalid = [{ day: 'mon', team: 'a', amount: 'x' as unknown as number }];
    expect(() => pivotRows(invalid, base)).toThrowError(TypeError);
  });

  it('throws on an unknown aggregate name', () => {
    expect(() => pivotRows(sales, { ...base, aggregate: 'average' as 'sum' })).toThrowError(TypeError);
  });

  it('skips rows with a missing key when missingKey is skip', () => {
    const withMissing = [...sales, { day: undefined, team: 'a', amount: 9 } as unknown as Sale];
    const rows = pivotRows(withMissing, { ...base, missingKey: 'skip' });
    expect(rows.length).toBe(2);
    expect(rows[0]['amount_a']).toBe(1);
  });

  it('throws on a missing key when missingKey is error', () => {
    const withMissing = [{ day: undefined, team: 'a', amount: 9 } as unknown as Sale];
    expect(() => pivotRows(withMissing, { ...base, missingKey: 'error' })).toThrowError(TypeError);
  });

  it('groups missing keys under an empty key by default', () => {
    const withMissing = [{ day: 'mon', team: undefined, amount: 9 } as unknown as Sale];
    const rows = pivotRows(withMissing, base);
    expect(rows[0]['amount_']).toBe(9);
  });

  it('uses the separator and a custom columnName', () => {
    expect(pivotRows(sales, { ...base, separator: '.' })[0]).toEqual({ day: 'mon', 'amount.a': 1, 'amount.b': 2 });
    expect(pivotRows(sales, { ...base, columnName: (field, column) => `${column}:${field}` })[0])
      .toEqual({ day: 'mon', 'a:amount': 1, 'b:amount': 2 });
  });

  it('uses indexName as the index output name', () => {
    expect(pivotRows(sales, { ...base, indexName: 'jour' })[0]).toEqual({ jour: 'mon', amount_a: 1, amount_b: 2 });
  });

  it('requires indexName when the index is an accessor function', () => {
    expect(() => pivotRows(sales, { ...base, index: row => row.day })).toThrowError(Error);
    expect(pivotRows(sales, { ...base, index: row => row.day, indexName: 'jour' })[0]['jour']).toBe('mon');
  });

  it('supports an accessor function for columns', () => {
    const rows = pivotRows(sales, { ...base, columns: row => row.team.toUpperCase() });
    expect(rows[0]).toEqual({ day: 'mon', amount_A: 1, amount_B: 2 });
  });

  it('throws when no measure is provided', () => {
    expect(() => pivotRows(sales, { ...base, values: [] })).toThrowError(Error);
  });

  it('throws when two output names collide', () => {
    expect(() => pivotRows(sales, { ...base, columnName: () => 'same' })).toThrowError(TypeError);
  });

  it('throws when an output name is a reserved prototype key', () => {
    expect(() => pivotRows(sales, { ...base, columnName: () => '__proto__' })).toThrowError(TypeError);
    expect(() => pivotRows(sales, { ...base, indexName: 'constructor' })).toThrowError(TypeError);
  });

  it('returns an empty array for no rows and no forced index values', () => {
    expect(pivotRows([] as Sale[], base)).toEqual([]);
  });
});
