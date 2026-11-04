import { comparePeriodLabels, formatPeriodLabel, sortPeriodLabels } from './chart-data-date';

describe('formatPeriodLabel', () => {
  it('formats hour buckets as HH:mm', () => {
    expect(formatPeriodLabel('13', 'hour')).toBe('13:00');
    expect(formatPeriodLabel('9', 'hour')).toBe('09:00');
    expect(formatPeriodLabel(0, 'hour')).toBe('00:00');
  });

  it('formats monthDay buckets as a French day and short month', () => {
    expect(formatPeriodLabel('11-03', 'monthDay')).toBe('3 nov.');
    expect(formatPeriodLabel('12-25', 'monthDay')).toBe('25 déc.');
  });

  it('formats yearWeek buckets as S<week> <year>', () => {
    expect(formatPeriodLabel('2026-W30', 'yearWeek')).toBe('S30 2026');
    expect(formatPeriodLabel('2026-W02', 'yearWeek')).toBe('S02 2026');
  });

  it('formats yearMonth buckets as a French short month and year', () => {
    expect(formatPeriodLabel('2026-11', 'yearMonth')).toBe('nov. 2026');
  });

  it('returns year buckets unchanged', () => {
    expect(formatPeriodLabel('2026', 'year')).toBe('2026');
  });

  it('honours an explicit locale', () => {
    expect(formatPeriodLabel('11-03', 'monthDay', { locale: 'en-US' })).toBe('Nov 3');
  });

  it('returns unparseable or out-of-range values unchanged', () => {
    expect(formatPeriodLabel('abc', 'hour')).toBe('abc');
    expect(formatPeriodLabel('24', 'hour')).toBe('24');
    expect(formatPeriodLabel('13-45', 'monthDay')).toBe('13-45');
    expect(formatPeriodLabel('2026-13', 'yearMonth')).toBe('2026-13');
  });
});

describe('sortPeriodLabels', () => {
  it('sorts hours numerically instead of lexicographically', () => {
    expect(sortPeriodLabels(['17', '9', '10'], 'hour')).toEqual(['9', '10', '17']);
  });

  it('sorts yearWeek and yearMonth chronologically across years', () => {
    expect(sortPeriodLabels(['2027-W01', '2026-W52'], 'yearWeek')).toEqual(['2026-W52', '2027-W01']);
    expect(sortPeriodLabels(['2027-01', '2026-11'], 'yearMonth')).toEqual(['2026-11', '2027-01']);
  });

  it('keeps monthDay buckets in order when a range crosses New Year', () => {
    const from = new Date(Date.UTC(2026, 10, 28));
    expect(sortPeriodLabels(['01-02', '11-30', '12-01'], 'monthDay', from)).toEqual(['11-30', '12-01', '01-02']);
  });

  it('places unparseable values last without dropping them', () => {
    expect(sortPeriodLabels(['x', '2', '1'], 'hour')).toEqual(['1', '2', 'x']);
  });

  it('does not mutate the input array', () => {
    const input = ['3', '1'];
    sortPeriodLabels(input, 'hour');
    expect(input).toEqual(['3', '1']);
  });
});

describe('comparePeriodLabels', () => {
  it('works as a sort callback with the same ordering as sortPeriodLabels', () => {
    const from = new Date(Date.UTC(2026, 10, 28));
    const values = ['01-02', '11-30', '12-01'];
    expect([...values].sort((a, b) => comparePeriodLabels(a, b, 'monthDay', from))).toEqual(sortPeriodLabels(values, 'monthDay', from));
  });

  it('returns 0 for equal and unparseable values', () => {
    expect(comparePeriodLabels('x', 'y', 'hour')).toBe(0);
    expect(comparePeriodLabels('9', '9', 'hour')).toBe(0);
  });

  it('returns a negative value when the left label comes first', () => {
    expect(comparePeriodLabels('9', '17', 'hour')).toBeLessThan(0);
    expect(comparePeriodLabels('17', '9', 'hour')).toBeGreaterThan(0);
  });
});
