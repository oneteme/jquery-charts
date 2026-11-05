import { flattenEntries, flattenEntriesByField, flattenEntriesByFn, getField, groupByField, groupByKey, sumByKey } from './stream';

interface Row {
  team: string;
  value: number;
}

describe('stream helpers', () => {
  const rows: Row[] = [
    { team: 'a', value: 1 },
    { team: 'b', value: 2 },
    { team: 'a', value: 3 },
  ];

  describe('groupByKey', () => {
    it('groups rows by key while preserving their order', () => {
      expect(groupByKey(rows, row => row.team)).toEqual({
        a: [rows[0], rows[2]],
        b: [rows[1]],
      });
    });

    it('returns an empty object for an empty array', () => {
      expect(groupByKey([] as Row[], row => row.team)).toEqual({});
    });

    it('does not mutate the input array', () => {
      const copy = rows.map(row => ({ ...row }));
      groupByKey(rows, row => row.team);
      expect(rows).toEqual(copy);
    });
  });

  describe('groupByField', () => {
    it('groups rows by the value of the given field', () => {
      const grouped = groupByField(rows, 'team');
      expect(Object.keys(grouped)).toEqual(['a', 'b']);
      expect(grouped['a'].length).toBe(2);
    });
  });

  describe('sumByKey', () => {
    it('sums the values of each key', () => {
      expect(sumByKey(rows, row => row.team, row => row.value)).toEqual({ a: 4, b: 2 });
    });

    it('returns an empty object for an empty array', () => {
      expect(sumByKey([] as Row[], row => row.team, row => row.value)).toEqual({});
    });
  });

  describe('getField', () => {
    it('returns a accessor for the given property', () => {
      expect(getField<Row, string>('team')(rows[1])).toBe('b');
    });
  });

  describe('flattenEntries helpers', () => {
    const map = { a: 1, b: 2 };

    it('maps each entry with the mapper', () => {
      expect(flattenEntries(map, (key, value) => `${key}=${value}`)).toEqual(['a=1', 'b=2']);
    });

    it('builds objects from entries with flattenEntriesByField', () => {
      expect(flattenEntriesByField(map, 'key', 'value')).toEqual([
        { key: 'a', value: 1 },
        { key: 'b', value: 2 },
      ]);
    });

    it('builds objects from entries with flattenEntriesByFn', () => {
      expect(flattenEntriesByFn(map, key => `k_${key}`, (_key, value) => `v_${value}`)).toEqual([
        { k_a: 'a', v_1: 1 },
        { k_b: 'b', v_2: 2 },
      ]);
    });
  });
});
