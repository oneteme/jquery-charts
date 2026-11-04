import {
  combineFields,
  combineProviders,
  DataProvider,
  distinct,
  field,
  groupBy,
  joinFields,
  joinProviders,
  mapField,
  naturalComparator,
  naturalFieldComparator,
  rangeFields,
  values,
} from './jquery-core.model';

describe('jquery-core.model providers', () => {
  describe('values', () => {
    it('returns the value at the given index', () => {
      const provider = values('a', 'b');
      expect(provider({}, 0)).toBe('a');
      expect(provider({}, 1)).toBe('b');
    });

    it('throws when the index is out of range', () => {
      expect(() => values('a')({}, 1)).toThrowError(/idx=1 out of values=\[a\]/);
    });
  });

  describe('field', () => {
    it('reads the named property', () => {
      expect(field<number>('x')({ x: 3 }, 0)).toBe(3);
    });

    it('returns undefined for a missing property', () => {
      expect(field('x')({}, 0)).toBeUndefined();
    });
  });

  describe('mapField', () => {
    it('maps the property value through the lookup table', () => {
      const labels = new Map<string, string>([['s1', 'Succès']]);
      const provider = mapField('status', labels);
      expect(provider({ status: 's1' }, 0)).toBe('Succès');
      expect(provider({ status: 'unknown' }, 0)).toBeUndefined();
    });
  });

  describe('joinFields', () => {
    it('joins the named properties with the separator', () => {
      expect(joinFields('-', 'a', 'b')({ a: 1, b: 'x' }, 0)).toBe('1-x');
    });

    it('uses an underscore by default', () => {
      expect(joinFields(undefined, 'a', 'b')({ a: 1, b: 2 }, 0)).toBe('1_2');
    });

    it('skips undefined properties, which shifts the remaining parts', () => {
      expect(joinFields('_', 'a', 'b', 'c')({ a: 1, c: 3 }, 0)).toBe('1_3');
    });

    it('renders null values as empty segments (Array.join behaviour)', () => {
      expect(joinFields('_', 'a', 'b')({ a: null, b: 2 }, 0)).toBe('_2');
    });
  });

  describe('combineFields', () => {
    it('passes only defined property values to the combiner', () => {
      const provider = combineFields(args => args.length, ['a', 'b', 'c']);
      expect(provider({ a: 1, c: 3 }, 0)).toBe(2);
    });

    it('passes values in the declared order', () => {
      const provider = combineFields(args => args, ['b', 'a']);
      expect(provider({ a: 1, b: 2 }, 0)).toEqual([2, 1]);
    });
  });

  describe('joinProviders', () => {
    it('joins the results of the providers with the separator', () => {
      const provider = joinProviders('-', values('a', 'b'), values('c', 'd'));
      expect(provider({}, 1)).toBe('b-d');
    });
  });

  describe('combineProviders', () => {
    it('passes the results of each provider, in order, to the combiner', () => {
      const provider = combineProviders<number, number>(
        args => args.reduce((sum, value) => sum + value, 0),
        field<number>('a'),
        field<number>('b'),
      );
      expect(provider({ a: 2, b: 5 }, 0)).toBe(7);
    });

    it('skips providers that return undefined', () => {
      const provider = combineProviders<number, number>(args => args.length, field<number>('a'), field<number>('missing'));
      expect(provider({ a: 2 }, 0)).toBe(1);
    });
  });

  describe('rangeFields', () => {
    it('returns the [min, max] pair when both bounds are defined', () => {
      expect(rangeFields<number>('min', 'max')({ min: 1, max: 5 }, 0)).toEqual([1, 5]);
    });

    it('keeps a zero bound', () => {
      expect(rangeFields<number>('min', 'max')({ min: 0, max: 5 }, 0)).toEqual([0, 5]);
    });

    it('returns undefined when a bound is missing', () => {
      expect(rangeFields<number>('min', 'max')({ min: 1 }, 0)).toBeUndefined();
      expect(rangeFields<number>('min', 'max')({ max: 1 }, 0)).toBeUndefined();
    });
  });
});

describe('distinct', () => {
  it('returns the unique values produced by one provider, in first-seen order', () => {
    const rows = [{ a: 2 }, { a: 1 }, { a: 2 }];
    expect(distinct(rows, [field('a')])).toEqual([2, 1]);
  });

  it('collects values from every provider', () => {
    const rows = [{ a: 1, b: 2 }];
    expect(distinct(rows, [field('a'), field('b')])).toEqual([1, 2]);
  });

  it('passes the row index to providers', () => {
    expect(distinct([{}, {}], [(_o, i) => i])).toEqual([0, 1]);
  });

  it('returns an empty list without rows', () => {
    expect(distinct([], [field('a')])).toEqual([]);
  });
});

describe('comparators', () => {
  it('naturalComparator orders ascending and descending', () => {
    expect(naturalComparator<number>('asc')(1, 2)).toBe(-1);
    expect(naturalComparator<number>('desc')(1, 2)).toBe(1);
    expect(naturalComparator<number>('asc')(2, 2)).toBe(0);
    expect([3, 1, 2].sort(naturalComparator<number>('asc'))).toEqual([1, 2, 3]);
    expect([3, 1, 2].sort(naturalComparator<number>('desc'))).toEqual([3, 2, 1]);
  });

  it('naturalFieldComparator compares the provider values', () => {
    const rows = [{ v: 'b' }, { v: 'c' }, { v: 'a' }];
    expect(rows.sort(naturalFieldComparator('asc', field('v'))).map(r => r.v)).toEqual(['a', 'b', 'c']);
    expect(rows.sort(naturalFieldComparator('desc', field('v'))).map(r => r.v)).toEqual(['c', 'b', 'a']);
  });

  it('naturalFieldComparator falls back to the value itself without a provider', () => {
    expect([2, 3, 1].sort(naturalFieldComparator<number>('asc', undefined as unknown as DataProvider<number>)))
      .toEqual([1, 2, 3]);
  });
});

describe('groupBy', () => {
  it('groups items by the key returned by the provider, keeping order', () => {
    const rows = [{ k: 'a', n: 1 }, { k: 'b', n: 2 }, { k: 'a', n: 3 }];
    const grouped = groupBy<{ k: string; n: number }>(rows as [], (o: { k: string }) => o.k);
    expect(Object.keys(grouped)).toEqual(['a', 'b']);
    expect(grouped['a'].map(r => r.n)).toEqual([1, 3]);
    expect(grouped['b'].map(r => r.n)).toEqual([2]);
  });

  it('returns an empty object for no items', () => {
    expect(groupBy<unknown>([] as [], () => 'x')).toEqual({});
  });

  it('passes the item index to the key provider', () => {
    const grouped = groupBy<number>([10, 20, 30] as unknown as [], (_o, i) => (i % 2 === 0 ? 'even' : 'odd'));
    expect(grouped).toEqual({ even: [10, 30], odd: [20] });
  });
});
