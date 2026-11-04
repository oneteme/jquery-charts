import { formatDuration } from './chart-data-unit';

describe('formatDuration', () => {
  it('formats sub-second durations in milliseconds', () => {
    expect(formatDuration(0)).toBe('0 ms');
    expect(formatDuration(850)).toBe('850 ms');
    expect(formatDuration(999.4)).toBe('999 ms');
  });

  it('rounds sub-second values that would reach 1000 ms into seconds', () => {
    expect(formatDuration(999.6)).toBe('1 s');
  });

  it('formats seconds with one decimal below 10 s', () => {
    expect(formatDuration(1200)).toBe('1,2 s');
    expect(formatDuration(9990)).toBe('10 s');
  });

  it('formats whole seconds below one minute', () => {
    expect(formatDuration(42_000)).toBe('42 s');
    expect(formatDuration(59_999)).toBe('59 s');
  });

  it('formats minutes and zero-padded seconds', () => {
    expect(formatDuration(184_000)).toBe('3 min 04 s');
    expect(formatDuration(60_000)).toBe('1 min 00 s');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(8_100_000)).toBe('2 h 15 min');
    expect(formatDuration(3_600_000)).toBe('1 h 00 min');
  });

  it('formats days and hours', () => {
    expect(formatDuration(97_200_000)).toBe('1 j 3 h');
    expect(formatDuration(2 * 86_400_000)).toBe('2 j 0 h');
  });

  it('keeps the sign of negative durations', () => {
    expect(formatDuration(-1500)).toBe('-1,5 s');
  });

  it('renders non-finite values as a dash', () => {
    expect(formatDuration(Number.NaN)).toBe('–');
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe('–');
  });
});
