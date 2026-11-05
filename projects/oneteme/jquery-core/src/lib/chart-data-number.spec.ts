import { formatChartNumber } from './chart-data-number';

describe('formatChartNumber', () => {
  it('returns null for nullish values', () => {
    expect(formatChartNumber(null)).toBeNull();
    expect(formatChartNumber(undefined)).toBeNull();
  });

  it('uses fr-FR grouping by default', () => {
    expect(formatChartNumber(1234.5)?.replace(/\s/g, ' ')).toBe('1 234,5');
  });

  it('formats with the requested locale', () => {
    expect(formatChartNumber(1234.5, { locale: 'fr-FR' })).toBe(new Intl.NumberFormat('fr-FR').format(1234.5));
  });

  it('accepts finite numeric strings', () => {
    expect(formatChartNumber('42')).toBe('42');
    expect(formatChartNumber(' 3.5 ', { locale: 'en-US' })).toBe('3.5');
  });

  it('formats bigint values', () => {
    expect(formatChartNumber(10n)).toBe('10');
  });

  it('limits fraction digits with precision', () => {
    expect(formatChartNumber(1.23456, { precision: 2, locale: 'en-US' })).toBe('1.23');
    expect(formatChartNumber(1.5, { precision: 2, locale: 'en-US' })).toBe('1.5');
    expect(formatChartNumber(2, { precision: 0 })).toBe('2');
  });

  it('passes native Intl options through', () => {
    expect(formatChartNumber(0.5, { format: { style: 'percent' }, locale: 'en-US' })).toBe('50%');
  });

  it('throws on non-numeric or non-finite values by default', () => {
    expect(() => formatChartNumber('abc')).toThrowError(TypeError);
    expect(() => formatChartNumber('')).toThrowError(TypeError);
    expect(() => formatChartNumber('   ')).toThrowError(TypeError);
    expect(() => formatChartNumber(NaN)).toThrowError(TypeError);
    expect(() => formatChartNumber(Infinity)).toThrowError(TypeError);
    expect(() => formatChartNumber({})).toThrowError(TypeError);
  });

  it('returns null for invalid values when invalidNumber is null', () => {
    expect(formatChartNumber('abc', { invalidNumber: 'null' })).toBeNull();
    expect(formatChartNumber(NaN, { invalidNumber: 'null' })).toBeNull();
  });

  it('rejects precision values outside 0..100 integers', () => {
    expect(() => formatChartNumber(1, { precision: -1 })).toThrowError(RangeError);
    expect(() => formatChartNumber(1, { precision: 1.5 })).toThrowError(RangeError);
    expect(() => formatChartNumber(1, { precision: 101 })).toThrowError(RangeError);
  });
});
