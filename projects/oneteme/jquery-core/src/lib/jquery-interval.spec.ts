import {
  EqualWidthStrategy,
  Interval,
  IntervalStrategy,
  JenksStrategy,
  MeanStdDevStrategy,
  QuantileStrategy,
  QuartileStrategy,
  computeDataStats,
  inInterval,
  intervalCategories,
  intervalsByBreakpoints,
  intervalsByCount,
  intervalsFromData,
  resolveInterval,
} from './jquery-interval';

const EN_DASH = '\u2013';
const GTE = '\u2265';

type Row = { v: number | null };

const rowsOf = (values: Array<number | null>): Row[] => values.map(v => ({ v }));
const valueOf = (row: Row): number | null => row.v;

const ONE_TO_TEN = rowsOf([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

function bounds(intervals: Interval<number>[]): Array<[number | null, number | null]> {
  return intervals.map(iv => [iv.min, iv.max]);
}

function expectBounds(
  intervals: Interval<number>[],
  expected: Array<[number | null, number | null]>
): void {
  expect(intervals.length).toBe(expected.length);
  intervals.forEach((iv, i) => {
    const [min, max] = expected[i];
    if (min === null) {
      expect(iv.min).toBeNull();
    } else {
      expect(iv.min).toBeCloseTo(min, 4);
    }
    if (max === null) {
      expect(iv.max).toBeNull();
    } else {
      expect(iv.max).toBeCloseTo(max, 4);
    }
  });
}

function bounded(min: number | null, max: number | null, maxInclusive = false): Interval<number> {
  const iv: Interval<number> = { key: 'k', label: 'l', min, max };
  if (maxInclusive) {
    iv.maxInclusive = true;
  }
  return iv;
}

function expectContiguous(intervals: Interval<number>[]): void {
  for (let i = 0; i < intervals.length - 1; i++) {
    expect(intervals[i].max).toBe(intervals[i + 1].min);
  }
}

describe('jquery-interval', () => {

  describe('intervalsByBreakpoints', () => {
    it('returns an empty array when there are no breakpoints', () => {
      expect(intervalsByBreakpoints([])).toEqual([]);
    });

    it('produces two open-ended intervals from a single breakpoint', () => {
      const ivs = intervalsByBreakpoints([5]);
      expect(ivs.length).toBe(2);
      expect(ivs[0].min).toBeNull();
      expect(ivs[0].max).toBe(5);
      expect(ivs[1].min).toBe(5);
      expect(ivs[1].max).toBeNull();
      expect(ivs.map(iv => iv.key)).toEqual(['lt_5', 'gte_5']);
      expect(ivs.map(iv => iv.label)).toEqual([`< 5`, `${GTE} 5`]);
    });

    it('produces n+1 intervals from n breakpoints with open ends', () => {
      const ivs = intervalsByBreakpoints([0.1, 0.5, 1, 5]);
      expect(ivs.length).toBe(5);
      expectBounds(ivs, [[null, 0.1], [0.1, 0.5], [0.5, 1], [1, 5], [5, null]]);
    });

    it('builds default keys with dots replaced by underscores', () => {
      const ivs = intervalsByBreakpoints([0.1, 0.5, 1, 5]);
      expect(ivs.map(iv => iv.key)).toEqual(['lt_0_1', '0_1_0_5', '0_5_1', '1_5', 'gte_5']);
    });

    it('builds default labels with en dash and greater-or-equal sign', () => {
      const ivs = intervalsByBreakpoints([0.1, 0.5, 1, 5]);
      expect(ivs.map(iv => iv.label)).toEqual([
        `< 0.1`,
        `0.1 ${EN_DASH} 0.5`,
        `0.5 ${EN_DASH} 1`,
        `1 ${EN_DASH} 5`,
        `${GTE} 5`,
      ]);
    });

    it('handles negative and fractional breakpoints in keys', () => {
      const ivs = intervalsByBreakpoints([-1.5, 2]);
      expect(ivs.map(iv => iv.key)).toEqual(['lt_-1_5', '-1_5_2', 'gte_2']);
    });

    it('sorts breakpoints without mutating the input array', () => {
      const input = [5, 0.1, 1];
      const ivs = intervalsByBreakpoints(input);
      expectBounds(ivs, [[null, 0.1], [0.1, 1], [1, 5], [5, null]]);
      expect(input).toEqual([5, 0.1, 1]);
    });

    it('produces contiguous intervals ordered ascending', () => {
      const ivs = intervalsByBreakpoints([30, 10, 20]);
      expectContiguous(ivs);
      expect(ivs.map(iv => iv.min)).toEqual([null, 10, 20, 30]);
    });

    it('does not set maxInclusive on any interval', () => {
      const ivs = intervalsByBreakpoints([1, 2]);
      ivs.forEach(iv => expect(iv.maxInclusive).toBeUndefined());
    });

    it('keeps an empty interval for duplicated breakpoints', () => {
      const ivs = intervalsByBreakpoints([1, 1]);
      expect(ivs.length).toBe(3);
      expectBounds(ivs, [[null, 1], [1, 1], [1, null]]);
    });

    it('supports Date breakpoints with ISO labels and timestamp keys', () => {
      const ivs = intervalsByBreakpoints([new Date(2000), new Date(1000)]);
      expect(ivs.length).toBe(3);
      expect(ivs[0].max instanceof Date).toBeTrue();
      expect((ivs[0].max as Date).getTime()).toBe(1000);
      expect((ivs[1].min as Date).getTime()).toBe(1000);
      expect((ivs[1].max as Date).getTime()).toBe(2000);
      expect((ivs[2].min as Date).getTime()).toBe(2000);
      expect(ivs.map(iv => iv.key)).toEqual(['lt_1000', '1000_2000', 'gte_2000']);
      expect(ivs[0].label).toBe(`< ${new Date(1000).toISOString()}`);
    });

    it('uses custom labelFn and keyFn for every interval, passing null for open bounds', () => {
      const ivs = intervalsByBreakpoints([0.1, 0.5], {
        labelFn: (min, max) => `${min ?? '-inf'}|${max ?? '+inf'}`,
        keyFn: (min, max) => `${min ?? 'a'}-${max ?? 'b'}`,
      });
      expect(ivs.map(iv => iv.label)).toEqual(['-inf|0.1', '0.1|0.5', '0.5|+inf']);
      expect(ivs.map(iv => iv.key)).toEqual(['a-0.1', '0.1-0.5', '0.5-b']);
    });
  });

  describe('intervalsByCount', () => {
    it('returns an empty array when count is zero or negative', () => {
      expect(intervalsByCount(0, 100, 0)).toEqual([]);
      expect(intervalsByCount(0, 100, -3)).toEqual([]);
    });

    it('produces equal-width bounded intervals over [start, end]', () => {
      const ivs = intervalsByCount(0, 100, 5);
      expect(ivs.length).toBe(5);
      expectBounds(ivs, [[0, 20], [20, 40], [40, 60], [60, 80], [80, 100]]);
      expectContiguous(ivs);
    });

    it('marks only the last interval as maxInclusive', () => {
      const ivs = intervalsByCount(0, 100, 5);
      ivs.slice(0, -1).forEach(iv => expect(iv.maxInclusive).toBeUndefined());
      expect(ivs[ivs.length - 1].maxInclusive).toBeTrue();
    });

    it('builds keys and labels from bounds', () => {
      const ivs = intervalsByCount(0, 100, 5);
      expect(ivs.map(iv => iv.key)).toEqual(['0_20', '20_40', '40_60', '60_80', '80_100']);
      expect(ivs.map(iv => iv.label)).toEqual([
        `0 ${EN_DASH} 20`,
        `20 ${EN_DASH} 40`,
        `40 ${EN_DASH} 60`,
        `60 ${EN_DASH} 80`,
        `80 ${EN_DASH} 100`,
      ]);
    });

    it('supports fractional steps', () => {
      const ivs = intervalsByCount(0, 1, 3);
      expect(ivs.length).toBe(3);
      expect(ivs[0].min).toBe(0);
      expect(ivs[0].max as number).toBeCloseTo(1 / 3, 10);
      expect(ivs[1].min as number).toBeCloseTo(1 / 3, 10);
      expect(ivs[1].max as number).toBeCloseTo(2 / 3, 10);
      expect(ivs[2].min as number).toBeCloseTo(2 / 3, 10);
      expect(ivs[2].max).toBe(1);
    });

    it('returns a single inclusive interval when count is one', () => {
      const ivs = intervalsByCount(0, 10, 1);
      expect(ivs.length).toBe(1);
      expect(ivs[0].min).toBe(0);
      expect(ivs[0].max).toBe(10);
      expect(ivs[0].maxInclusive).toBeTrue();
      expect(resolveInterval(10, ivs)).toBe(ivs[0]);
    });

    it('supports Date bounds with Date instances as min and max', () => {
      const ivs = intervalsByCount(new Date(0), new Date(4000), 4);
      expect(ivs.every(iv => iv.min instanceof Date && iv.max instanceof Date)).toBeTrue();
      expect(ivs.map(iv => [(iv.min as Date).getTime(), (iv.max as Date).getTime()])).toEqual([
        [0, 1000],
        [1000, 2000],
        [2000, 3000],
        [3000, 4000],
      ]);
      expect(ivs.map(iv => iv.key)).toEqual(['0_1000', '1000_2000', '2000_3000', '3000_4000']);
      expect(ivs[0].label).toBe(
        `${new Date(0).toISOString()} ${EN_DASH} ${new Date(1000).toISOString()}`
      );
      expect(ivs[3].maxInclusive).toBeTrue();
    });

    it('applies custom labelFn and keyFn', () => {
      const ivs = intervalsByCount(0, 10, 2, {
        labelFn: (min, max) => `${min}->${max}`,
        keyFn: (min, max) => `k${min}${max}`,
      });
      expect(ivs.map(iv => iv.label)).toEqual(['0->5', '5->10']);
      expect(ivs.map(iv => iv.key)).toEqual(['k05', 'k510']);
    });
  });

  describe('inInterval', () => {
    it('includes the lower bound and excludes the upper bound', () => {
      const iv = bounded(0, 10);
      expect(inInterval(0, iv)).toBeTrue();
      expect(inInterval(9.99, iv)).toBeTrue();
      expect(inInterval(10, iv)).toBeFalse();
      expect(inInterval(-0.01, iv)).toBeFalse();
    });

    it('includes the upper bound when maxInclusive is set', () => {
      const iv = bounded(0, 10, true);
      expect(inInterval(10, iv)).toBeTrue();
      expect(inInterval(10.01, iv)).toBeFalse();
      expect(inInterval(0, iv)).toBeTrue();
    });

    it('accepts any value below max when min is null', () => {
      const iv = bounded(null, 10);
      expect(inInterval(-1e12, iv)).toBeTrue();
      expect(inInterval(9.9, iv)).toBeTrue();
      expect(inInterval(10, iv)).toBeFalse();
    });

    it('accepts any value above min when max is null', () => {
      const iv = bounded(10, null);
      expect(inInterval(10, iv)).toBeTrue();
      expect(inInterval(1e12, iv)).toBeTrue();
      expect(inInterval(9.99, iv)).toBeFalse();
    });

    it('accepts any value when both bounds are null', () => {
      const iv = bounded(null, null);
      expect(inInterval(-1e12, iv)).toBeTrue();
      expect(inInterval(0, iv)).toBeTrue();
      expect(inInterval(1e12, iv)).toBeTrue();
    });

    it('compares Date values by timestamp', () => {
      const iv: Interval<Date> = {
        key: 'd',
        label: 'd',
        min: new Date(0),
        max: new Date(1000),
      };
      expect(inInterval(new Date(0), iv)).toBeTrue();
      expect(inInterval(new Date(999), iv)).toBeTrue();
      expect(inInterval(new Date(1000), iv)).toBeFalse();
      expect(inInterval(new Date(-1), iv)).toBeFalse();
    });

    it('returns false for NaN', () => {
      expect(inInterval(NaN, bounded(0, 10))).toBeFalse();
      expect(inInterval(NaN, bounded(null, 10))).toBeFalse();
    });

    it('returns false for null and undefined, even on unbounded intervals', () => {
      expect(inInterval(null, bounded(null, null))).toBeFalse();
      expect(inInterval(null, bounded(null, 10))).toBeFalse();
      expect(inInterval(null, bounded(0, 10))).toBeFalse();
      expect(inInterval(undefined, bounded(null, 10))).toBeFalse();
      expect(inInterval(undefined, bounded(0, null))).toBeFalse();
    });
  });

  describe('resolveInterval', () => {
    it('returns the interval containing the value', () => {
      const ivs = intervalsByCount(0, 100, 5);
      expect(resolveInterval(0, ivs)?.key).toBe('0_20');
      expect(resolveInterval(20, ivs)?.key).toBe('20_40');
      expect(resolveInterval(55, ivs)?.label).toBe(`40 ${EN_DASH} 60`);
      expect(resolveInterval(100, ivs)?.key).toBe('80_100');
    });

    it('returns undefined when no interval matches', () => {
      const ivs = intervalsByCount(0, 100, 5);
      expect(resolveInterval(-0.1, ivs)).toBeUndefined();
      expect(resolveInterval(100.5, ivs)).toBeUndefined();
    });

    it('returns undefined for an empty interval list', () => {
      expect(resolveInterval(1, [])).toBeUndefined();
    });

    it('returns the first matching interval when several overlap', () => {
      const ivs: Interval<number>[] = [
        { key: 'a', label: 'a', min: 0, max: 10 },
        { key: 'b', label: 'b', min: 5, max: 20 },
      ];
      expect(resolveInterval(7, ivs)?.key).toBe('a');
      expect(resolveInterval(15, ivs)?.key).toBe('b');
    });

    it('resolves a value equal to a duplicated breakpoint to the interval after it', () => {
      const ivs = intervalsByBreakpoints([1, 1]);
      expect(resolveInterval(1, ivs)?.key).toBe('gte_1');
    });

    it('resolves Date values against Date intervals', () => {
      const ivs = intervalsByCount(new Date(0), new Date(3000), 3);
      expect(resolveInterval(new Date(1500), ivs)?.key).toBe('1000_2000');
      expect(resolveInterval(new Date(3000), ivs)?.key).toBe('2000_3000');
      expect(resolveInterval(new Date(3001), ivs)).toBeUndefined();
    });
  });

  describe('intervalCategories', () => {
    const extractor = (row: any) => row.end;
    const ivs = intervalsByBreakpoints([100, 1000]);

    it('maps each interval to a key, label and filter without a null category', () => {
      const categories = intervalCategories(ivs, extractor);
      expect(categories.length).toBe(3);
      expect(categories.map(c => c.key)).toEqual(['lt_100', '100_1000', 'gte_1000']);
      expect(categories.map(c => c.label)).toEqual(ivs.map(iv => iv.label));
    });

    it('prepends the null category when provided', () => {
      const categories = intervalCategories(ivs, extractor, { key: 'in-progress', label: 'En cours...' });
      expect(categories.length).toBe(4);
      expect(categories[0].key).toBe('in-progress');
      expect(categories[0].label).toBe('En cours...');
      expect(categories.slice(1).map(c => c.key)).toEqual(['lt_100', '100_1000', 'gte_1000']);
    });

    it('matches rows with null or undefined value only against the null category', () => {
      const categories = intervalCategories(ivs, extractor, { key: 'in-progress', label: 'En cours...' });
      const matchingKeys = (row: any) => categories.filter(c => c.filter(row)).map(c => c.key);
      expect(matchingKeys({ end: null })).toEqual(['in-progress']);
      expect(matchingKeys({})).toEqual(['in-progress']);
    });

    it('treats zero as a value and not as null', () => {
      const categories = intervalCategories(ivs, extractor, { key: 'in-progress', label: 'En cours...' });
      const matchingKeys = (row: any) => categories.filter(c => c.filter(row)).map(c => c.key);
      expect(matchingKeys({ end: 0 })).toEqual(['lt_100']);
    });

    it('assigns each non-null row to exactly one interval category', () => {
      const categories = intervalCategories(ivs, extractor);
      const matchingKeys = (row: any) => categories.filter(c => c.filter(row)).map(c => c.key);
      expect(matchingKeys({ end: 50 })).toEqual(['lt_100']);
      expect(matchingKeys({ end: 100 })).toEqual(['100_1000']);
      expect(matchingKeys({ end: 999 })).toEqual(['100_1000']);
      expect(matchingKeys({ end: 1000 })).toEqual(['gte_1000']);
      expect(matchingKeys({ end: null })).toEqual([]);
    });

    it('filters Date values through their intervals', () => {
      const dateIvs = intervalsByCount(new Date(0), new Date(3000), 3);
      const categories = intervalCategories(
        dateIvs,
        (row: { at: Date | null }) => row.at
      );
      const matchingKeys = (row: any) => categories.filter(c => c.filter(row)).map(c => c.key);
      expect(matchingKeys({ at: new Date(0) })).toEqual(['0_1000']);
      expect(matchingKeys({ at: new Date(1500) })).toEqual(['1000_2000']);
      expect(matchingKeys({ at: new Date(3000) })).toEqual(['2000_3000']);
    });
  });

  describe('computeDataStats', () => {
    it('returns null for an empty dataset', () => {
      expect(computeDataStats([], valueOf)).toBeNull();
    });

    it('returns null when every extracted value is null or undefined', () => {
      expect(computeDataStats(rowsOf([null, null]), valueOf)).toBeNull();
      expect(computeDataStats([{}, { v: undefined }], (r: any) => r.v)).toBeNull();
    });

    it('computes descriptive statistics over 1 to 10', () => {
      const stats = computeDataStats(ONE_TO_TEN, valueOf)!;
      expect(stats.count).toBe(10);
      expect(stats.min).toBe(1);
      expect(stats.max).toBe(10);
      expect(stats.mean).toBeCloseTo(5.5, 10);
      expect(stats.median).toBeCloseTo(5.5, 10);
      expect(stats.q2).toBeCloseTo(5.5, 10);
      expect(stats.stdDev).toBeCloseTo(Math.sqrt(8.25), 10);
      expect(stats.q1).toBeCloseTo(3.25, 10);
      expect(stats.q3).toBeCloseTo(7.75, 10);
      expect(stats.iqr).toBeCloseTo(4.5, 10);
    });

    it('ignores null and undefined values in the count', () => {
      const stats = computeDataStats(rowsOf([null, 1, 2, null, 3]), valueOf)!;
      expect(stats.count).toBe(3);
      expect(stats.min).toBe(1);
      expect(stats.max).toBe(3);
      expect(stats.mean).toBeCloseTo(2, 10);
    });

    it('keeps zero as a valid value', () => {
      const stats = computeDataStats(rowsOf([0, 0, 4]), valueOf)!;
      expect(stats.count).toBe(3);
      expect(stats.min).toBe(0);
    });

    it('returns degenerate statistics for a single value', () => {
      const stats = computeDataStats(rowsOf([7]), valueOf)!;
      expect(stats.count).toBe(1);
      expect(stats.min).toBe(7);
      expect(stats.max).toBe(7);
      expect(stats.mean).toBe(7);
      expect(stats.median).toBe(7);
      expect(stats.stdDev).toBe(0);
      expect(stats.q1).toBe(7);
      expect(stats.q3).toBe(7);
      expect(stats.iqr).toBe(0);
      expect(stats.percentile(33)).toBe(7);
    });

    it('computes statistics on unsorted input without mutating it', () => {
      const data = rowsOf([3, 1, 2]);
      const stats = computeDataStats(data, valueOf)!;
      expect(stats.min).toBe(1);
      expect(stats.max).toBe(3);
      expect(stats.median).toBe(2);
      expect(data.map(r => r.v)).toEqual([3, 1, 2]);
    });

    it('computes population standard deviation', () => {
      const stats = computeDataStats(rowsOf([2, 4, 4, 4, 5, 5, 7, 9]), valueOf)!;
      expect(stats.mean).toBe(5);
      expect(stats.stdDev).toBeCloseTo(2, 10);
    });

    it('exposes percentile with linear interpolation and clamped bounds', () => {
      const stats = computeDataStats(ONE_TO_TEN, valueOf)!;
      expect(stats.percentile(0)).toBe(1);
      expect(stats.percentile(100)).toBe(10);
      expect(stats.percentile(-5)).toBe(1);
      expect(stats.percentile(150)).toBe(10);
      expect(stats.percentile(50)).toBeCloseTo(5.5, 10);
      expect(stats.percentile(10)).toBeCloseTo(1.9, 10);
      expect(stats.percentile(90)).toBeCloseTo(9.1, 10);
    });

    it('returns statistics in milliseconds for Date values', () => {
      const data = [{ d: new Date(1000) }, { d: new Date(3000) }, { d: null }];
      const stats = computeDataStats(data, (r: { d: Date | null }) => r.d)!;
      expect(stats.count).toBe(2);
      expect(stats.min).toBe(1000);
      expect(stats.max).toBe(3000);
      expect(stats.mean).toBe(2000);
      expect(stats.median).toBe(2000);
      expect(stats.stdDev).toBe(1000);
    });

    it('ignores NaN values', () => {
      const stats = computeDataStats(rowsOf([1, NaN, 3]), valueOf)!;
      expect(stats.count).toBe(2);
      expect(stats.mean).toBeCloseTo(2, 10);
      expect(stats.min).toBe(1);
      expect(stats.max).toBe(3);
    });
  });

  describe('IntervalStrategy', () => {
    it('exposes each strategy as a member of the IntervalStrategy union', () => {
      const quartile: QuartileStrategy = { type: 'quartile' };
      const quantile: QuantileStrategy = { type: 'quantile', count: 3 };
      const meanStdDev: MeanStdDevStrategy = { type: 'mean-stddev', sigmas: [0] };
      const equalWidth: EqualWidthStrategy = { type: 'equal-width', count: 2 };
      const jenks: JenksStrategy = { type: 'jenks', count: 2, maxSamples: 100 };
      const all: IntervalStrategy[] = [quartile, quantile, meanStdDev, equalWidth, jenks];
      expect(all.map(s => s.type)).toEqual(['quartile', 'quantile', 'mean-stddev', 'equal-width', 'jenks']);
    });

    it('is accepted by intervalsFromData for every strategy type', () => {
      const strategies: IntervalStrategy[] = [
        { type: 'quartile' },
        { type: 'quantile' },
        { type: 'mean-stddev' },
        { type: 'equal-width' },
        { type: 'jenks' },
      ];
      strategies.forEach(strategy => {
        const ivs = intervalsFromData(ONE_TO_TEN, valueOf, strategy);
        expect(ivs.length).toBeGreaterThan(1);
        expectContiguous(ivs);
      });
    });
  });

  describe('intervalsFromData', () => {
    it('returns an empty array for an empty dataset', () => {
      expect(intervalsFromData([], valueOf)).toEqual([]);
    });

    it('returns an empty array when every extracted value is null', () => {
      expect(intervalsFromData(rowsOf([null, null]), valueOf)).toEqual([]);
    });

    it('uses the quantile strategy with 4 classes by default', () => {
      const ivs = intervalsFromData(ONE_TO_TEN, valueOf);
      expect(bounds(ivs)).toEqual(bounds(intervalsFromData(ONE_TO_TEN, valueOf, { type: 'quantile', count: 4 })));
      expectBounds(ivs, [[null, 3.25], [3.25, 5.5], [5.5, 7.75], [7.75, null]]);
    });

    it('ignores null values when building breakpoints', () => {
      const withNulls = rowsOf([null, 1, 2, null, 3, 4, 5, 6, 7, 8, 9, 10, null]);
      expect(bounds(intervalsFromData(withNulls, valueOf))).toEqual(
        bounds(intervalsFromData(ONE_TO_TEN, valueOf))
      );
    });

    it('does not mutate the input dataset', () => {
      const data = rowsOf([3, 1, 2, 10, 7]);
      intervalsFromData(data, valueOf, { type: 'jenks', count: 2 });
      expect(data.map(r => r.v)).toEqual([3, 1, 2, 10, 7]);
    });

    it('produces unique keys for the generated intervals', () => {
      const ivs = intervalsFromData(ONE_TO_TEN, valueOf, { type: 'quantile', count: 5 });
      expect(new Set(ivs.map(iv => iv.key)).size).toBe(ivs.length);
    });

    it('covers the whole data range without gaps or overlaps for every strategy', () => {
      const strategies: IntervalStrategy[] = [
        { type: 'quartile' },
        { type: 'quantile', count: 5 },
        { type: 'mean-stddev' },
        { type: 'equal-width', count: 5 },
        { type: 'jenks', count: 5 },
      ];
      strategies.forEach(strategy => {
        const ivs = intervalsFromData(ONE_TO_TEN, valueOf, strategy);
        expectContiguous(ivs);
        ONE_TO_TEN.forEach(row => {
          const matches = ivs.filter(iv => inInterval(row.v!, iv));
          expect(matches.length).toBe(1);
        });
      });
    });

    it('applies custom labelFn and keyFn to the generated intervals', () => {
      const ivs = intervalsFromData(
        ONE_TO_TEN,
        valueOf,
        { type: 'quantile', count: 2 },
        {
          labelFn: (min, max) => `${min ?? '-inf'}:${max ?? '+inf'}`,
          keyFn: (min, max) => `key-${min ?? 'a'}-${max ?? 'b'}`,
        }
      );
      expect(ivs.map(iv => iv.label)).toEqual(['-inf:5.5', '5.5:+inf']);
      expect(ivs.map(iv => iv.key)).toEqual(['key-a-5.5', 'key-5.5-b']);
    });

    describe('quartile', () => {
      it('uses Q1, Q2 and Q3 as breakpoints', () => {
        const ivs = intervalsFromData(rowsOf([1, 2, 3, 4, 5, 6, 7, 8]), valueOf, { type: 'quartile' });
        expectBounds(ivs, [[null, 2.75], [2.75, 4.5], [4.5, 6.25], [6.25, null]]);
      });

      it('matches the quantile strategy with 4 classes', () => {
        expect(bounds(intervalsFromData(ONE_TO_TEN, valueOf, { type: 'quartile' }))).toEqual(
          bounds(intervalsFromData(ONE_TO_TEN, valueOf, { type: 'quantile', count: 4 }))
        );
      });
    });

    describe('quantile', () => {
      it('splits at the median for count 2', () => {
        const ivs = intervalsFromData(ONE_TO_TEN, valueOf, { type: 'quantile', count: 2 });
        expectBounds(ivs, [[null, 5.5], [5.5, null]]);
      });

      it('creates count - 1 breakpoints for count 5', () => {
        const ivs = intervalsFromData(ONE_TO_TEN, valueOf, { type: 'quantile', count: 5 });
        expectBounds(ivs, [[null, 2.8], [2.8, 4.6], [4.6, 6.4], [6.4, 8.2], [8.2, null]]);
      });

      it('creates balanced classes with equal numbers of values', () => {
        const data = rowsOf(Array.from({ length: 100 }, (_, i) => i + 1));
        const ivs = intervalsFromData(data, valueOf, { type: 'quantile', count: 4 });
        expect(ivs.length).toBe(4);
        const counts = ivs.map(iv => data.filter(r => inInterval(r.v!, iv)).length);
        expect(counts).toEqual([25, 25, 25, 25]);
      });

      it('creates count - 1 breakpoints for count 3', () => {
        const ivs = intervalsFromData(ONE_TO_TEN, valueOf, { type: 'quantile', count: 3 });
        expect(ivs.length).toBe(3);
        expectContiguous(ivs);
      });

      it('works with Date values and produces Date bounds', () => {
        const data = [
          { d: new Date(0) },
          { d: new Date(1000) },
          { d: new Date(2000) },
          { d: new Date(3000) },
        ];
        const ivs = intervalsFromData(data, (r: { d: Date }) => r.d, { type: 'quantile', count: 2 });
        expect(ivs.length).toBe(2);
        expect(ivs[0].min).toBeNull();
        expect(ivs[0].max instanceof Date).toBeTrue();
        expect((ivs[0].max as Date).getTime()).toBe(1500);
        expect((ivs[1].min as Date).getTime()).toBe(1500);
        expect(ivs[1].max).toBeNull();
        expect(ivs.map(iv => iv.key)).toEqual(['lt_1500', 'gte_1500']);
      });
    });

    describe('equal-width', () => {
      const spread = rowsOf([0, 10, 30, 50, 70, 90, 100]);

      it('divides the data range into count equal-width classes', () => {
        const ivs = intervalsFromData(spread, valueOf, { type: 'equal-width', count: 5 });
        expectBounds(ivs, [[null, 20], [20, 40], [40, 60], [60, 80], [80, null]]);
      });

      it('defaults to 5 classes', () => {
        expect(bounds(intervalsFromData(spread, valueOf, { type: 'equal-width' }))).toEqual(
          bounds(intervalsFromData(spread, valueOf, { type: 'equal-width', count: 5 }))
        );
      });

      it('creates count - 1 breakpoints for a small count', () => {
        const ivs = intervalsFromData(rowsOf([0, 10, 20, 30, 40]), valueOf, { type: 'equal-width', count: 2 });
        expectBounds(ivs, [[null, 20], [20, null]]);
      });
    });

    describe('mean-stddev', () => {
      it('places breakpoints at mean ± k·σ and discards those outside the data range', () => {
        const ivs = intervalsFromData(ONE_TO_TEN, valueOf, { type: 'mean-stddev', sigmas: [-2, -1, 0, 1, 2] });
        const sigma = Math.sqrt(8.25);
        expectBounds(ivs, [
          [null, 5.5 - sigma],
          [5.5 - sigma, 5.5],
          [5.5, 5.5 + sigma],
          [5.5 + sigma, null],
        ]);
      });

      it('defaults to sigmas [-2, -1, 0, 1, 2]', () => {
        expect(bounds(intervalsFromData(ONE_TO_TEN, valueOf, { type: 'mean-stddev' }))).toEqual(
          bounds(intervalsFromData(ONE_TO_TEN, valueOf, { type: 'mean-stddev', sigmas: [-2, -1, 0, 1, 2] }))
        );
      });

      it('sorts sigmas and removes duplicated breakpoints', () => {
        expect(bounds(intervalsFromData(ONE_TO_TEN, valueOf, { type: 'mean-stddev', sigmas: [0, 0, 0] }))).toEqual([
          [null, 5.5],
          [5.5, null],
        ]);
        const unsorted = intervalsFromData(ONE_TO_TEN, valueOf, { type: 'mean-stddev', sigmas: [1, -1] });
        const sorted = intervalsFromData(ONE_TO_TEN, valueOf, { type: 'mean-stddev', sigmas: [-1, 1] });
        expect(bounds(unsorted)).toEqual(bounds(sorted));
        expect(unsorted.length).toBe(3);
      });

      it('falls back to a single inclusive interval when the standard deviation is zero', () => {
        const ivs = intervalsFromData(rowsOf([4, 4, 4]), valueOf, { type: 'mean-stddev' });
        expect(ivs.length).toBe(1);
        expect(ivs[0].min).toBe(4);
        expect(ivs[0].max).toBe(4);
        expect(ivs[0].maxInclusive).toBeTrue();
      });
    });

    describe('jenks', () => {
      it('finds the natural break between two clusters', () => {
        const ivs = intervalsFromData(rowsOf([1, 2, 3, 10, 11, 12]), valueOf, { type: 'jenks', count: 2 });
        expectBounds(ivs, [[null, 10], [10, null]]);
      });

      it('finds one natural break per cluster for three clusters', () => {
        const data = rowsOf([1, 2, 3, 10, 11, 12, 20, 21, 22]);
        const ivs = intervalsFromData(data, valueOf, { type: 'jenks', count: 3 });
        expectBounds(ivs, [[null, 10], [10, 20], [20, null]]);
      });

      it('defaults to 5 classes', () => {
        const data = rowsOf(Array.from({ length: 20 }, (_, i) => i + 1));
        expect(bounds(intervalsFromData(data, valueOf, { type: 'jenks' }))).toEqual(
          bounds(intervalsFromData(data, valueOf, { type: 'jenks', count: 5 }))
        );
        expect(intervalsFromData(data, valueOf, { type: 'jenks' }).length).toBe(5);
      });

      it('downsamples large datasets to maxSamples before computing breaks', () => {
        const data = rowsOf(Array.from({ length: 2000 }, (_, i) => i + 1));
        const ivs = intervalsFromData(data, valueOf, { type: 'jenks', count: 2, maxSamples: 100 });
        expect(ivs.length).toBe(2);
        const brk = ivs[0].max as number;
        expect(brk).toBeGreaterThan(900);
        expect(brk).toBeLessThan(1100);
      });
    });

    describe('degenerate cases', () => {
      it('returns a single inclusive interval when all values are identical', () => {
        const ivs = intervalsFromData(rowsOf([5, null, 5, 5]), valueOf);
        expect(ivs.length).toBe(1);
        expect(ivs[0].min).toBe(5);
        expect(ivs[0].max).toBe(5);
        expect(ivs[0].maxInclusive).toBeTrue();
        expect(resolveInterval(5, ivs)).toBe(ivs[0]);
      });

      it('returns a single inclusive Date interval when all dates are identical', () => {
        const data = [{ d: new Date(42) }, { d: new Date(42) }];
        const ivs = intervalsFromData(data, (r: { d: Date }) => r.d);
        expect(ivs.length).toBe(1);
        expect(ivs[0].min instanceof Date).toBeTrue();
        expect((ivs[0].min as Date).getTime()).toBe(42);
        expect((ivs[0].max as Date).getTime()).toBe(42);
        expect(ivs[0].maxInclusive).toBeTrue();
      });

      it('covers every value of the dataset when the strategy produces no breakpoints with quantile count 1', () => {
        const data = rowsOf([1, 2, 3, 4, 5]);
        const ivs = intervalsFromData(data, valueOf, { type: 'quantile', count: 1 });
        data.forEach(row => expect(resolveInterval(row.v!, ivs)).toBeDefined());
      });

      it('covers every value of the dataset when the strategy produces no breakpoints with equal-width count 1', () => {
        const data = rowsOf([1, 2, 3, 4, 5]);
        const ivs = intervalsFromData(data, valueOf, { type: 'equal-width', count: 1 });
        data.forEach(row => expect(resolveInterval(row.v!, ivs)).toBeDefined());
      });

      it('covers every value of the dataset when jenks is asked for a single class', () => {
        const data = rowsOf([1, 2, 3, 4, 5]);
        const ivs = intervalsFromData(data, valueOf, { type: 'jenks', count: 1 });
        data.forEach(row => expect(resolveInterval(row.v!, ivs)).toBeDefined());
      });
    });
  });
});
