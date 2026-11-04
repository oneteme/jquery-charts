import {
  createUnitConverter,
  defineLinearUnit,
  convertUnitValue,
  formatChartValue,
  formatDuration,
  formatUnitValue,
  selectBestScale,
  UnknownUnitError,
} from './chart-data-unit';
import { UnitConfig } from './jquery-core.model';

/** Normalises the narrow no-break spaces produced by fr-FR number formatting. */
const plain = (text: string) => text.replace(/\s/g, ' ');

describe('formatChartValue', () => {
  it('returns 0 for zero and for non-finite values', () => {
    expect(formatChartValue(0)).toBe('0');
    expect(formatChartValue(Number.NaN)).toBe('–');
    expect(formatChartValue(Number.POSITIVE_INFINITY)).toBe('–');
  });

  it('adapts decimals to the magnitude of the value', () => {
    expect(plain(formatChartValue(1234))).toBe('1 234');
    expect(plain(formatChartValue(0.5))).toBe('0,5');
    expect(plain(formatChartValue(0.001234))).toBe('0,00123');
  });

  it('caps the number of decimals at 6', () => {
    expect(plain(formatChartValue(0.0000012345))).toBe('0,000001');
  });

  it('uses the requested precision when provided', () => {
    expect(plain(formatChartValue(3.14159, 2))).toBe('3,14');
    expect(plain(formatChartValue(2, 2))).toBe('2,00');
  });
});

describe('selectBestScale', () => {
  const config: UnitConfig = {
    baseUnit: 'ms',
    scales: [
      { unit: 's', scale: 0.001 },
      { unit: 'ms', scale: 1, threshold: 1000 },
    ],
  };

  it('falls back to the base unit when no scale is configured', () => {
    const formatter = () => 'custom';
    expect(selectBestScale({ baseUnit: 'o', scales: [], formatter }, [1])).toEqual({
      scale: 1,
      unit: 'o',
      formatter,
    });
  });

  it('selects the first scale whose threshold covers the maximum absolute value', () => {
    expect(selectBestScale(config, [500]).unit).toBe('ms');
    expect(selectBestScale(config, [5000]).unit).toBe('s');
    expect(selectBestScale(config, [-5000]).unit).toBe('s');
  });

  it('ignores non-finite values when computing the maximum', () => {
    expect(selectBestScale(config, [Number.NaN, Number.POSITIVE_INFINITY, 2000]).unit).toBe('s');
  });

  it('selects the first scale for empty data', () => {
    expect(selectBestScale(config, []).unit).toBe('ms');
  });

  it('keeps the configured scale factor and formatter', () => {
    const formatter = () => 'custom';
    const selected = selectBestScale({ ...config, formatter }, [5000]);
    expect(selected.scale).toBe(0.001);
    expect(selected.formatter).toBe(formatter);
  });
});

describe('formatUnitValue', () => {
  it('formats the raw value with its unit when no scale is given', () => {
    expect(plain(formatUnitValue(1234, 'ms'))).toBe('1 234 ms');
  });

  it('applies the scale factor before formatting', () => {
    expect(plain(formatUnitValue(1500, 'ms', { scale: 0.001, unit: 's' }))).toBe('1,5 s');
  });

  it('delegates to the scale formatter when one is provided', () => {
    const scale = {
      scale: 0.001,
      unit: 's',
      formatter: (value: number, unit: string) => `${value}-${unit}`,
    };
    expect(formatUnitValue(1500, 'ms', scale)).toBe('1.5-s');
  });
});

describe('defineLinearUnit', () => {
  it('converts to and from the base unit using the factor', () => {
    const kilometre = defineLinearUnit('km', { factor: 1000 });
    expect(kilometre.toBase(2)).toBe(2000);
    expect(kilometre.fromBase(2000)).toBe(2);
  });

  it('applies the offset before scaling for affine units', () => {
    const celsius = defineLinearUnit('C', { factor: 1, offset: -273.15 });
    expect(celsius.toBase(0)).toBeCloseTo(273.15, 10);
    expect(celsius.fromBase(273.15)).toBeCloseTo(0, 10);
  });

  it('rejects empty unit names', () => {
    expect(() => defineLinearUnit('  ', { factor: 1 })).toThrowError(TypeError);
  });

  it('rejects zero, negative-zero, and non-finite factors', () => {
    expect(() => defineLinearUnit('x', { factor: 0 })).toThrowError(RangeError);
    expect(() => defineLinearUnit('x', { factor: Number.NaN })).toThrowError(RangeError);
    expect(() => defineLinearUnit('x', { factor: Number.POSITIVE_INFINITY })).toThrowError(RangeError);
  });

  it('rejects non-finite offsets', () => {
    expect(() => defineLinearUnit('x', { factor: 1, offset: Number.NaN })).toThrowError(RangeError);
  });
});

describe('createUnitConverter', () => {
  const length = createUnitConverter([
    defineLinearUnit('m', { factor: 1 }),
    defineLinearUnit('km', { factor: 1000 }),
  ]);
  const unregistered = 'foo' as 'm';

  it('exposes the registered units in definition order', () => {
    expect(length.units).toEqual(['m', 'km']);
    expect(Object.isFrozen(length.units)).toBeTrue();
  });

  it('converts between registered units', () => {
    expect(length.convert(2, 'km', 'm')).toBeCloseTo(2000, 10);
    expect(length.convert(1500, 'm', 'km')).toBeCloseTo(1.5, 10);
    expect(length.convert(5, 'm', 'm')).toBe(5);
  });

  it('converts affine units through the base unit', () => {
    const temperature = createUnitConverter([
      defineLinearUnit('K', { factor: 1 }),
      defineLinearUnit('C', { factor: 1, offset: -273.15 }),
      defineLinearUnit('F', { factor: 5 / 9, offset: -459.67 }),
    ]);
    expect(temperature.convert(100, 'C', 'F')).toBeCloseTo(212, 6);
    expect(temperature.convert(32, 'F', 'C')).toBeCloseTo(0, 6);
    expect(temperature.convert(0, 'C', 'K')).toBeCloseTo(273.15, 6);
  });

  it('throws UnknownUnitError for unregistered source or target units', () => {
    expect(() => length.convert(1, unregistered, 'm')).toThrowError(UnknownUnitError);
    expect(() => length.convert(1, 'm', unregistered)).toThrowError(UnknownUnitError);
    try {
      length.convert(1, 'm', unregistered);
    } catch (error) {
      expect((error as UnknownUnitError).unit).toBe('foo');
      expect((error as UnknownUnitError).name).toBe('UnknownUnitError');
    }
  });

  it('rejects non-finite values', () => {
    expect(() => length.convert(Number.NaN, 'm', 'km')).toThrowError(TypeError);
    expect(() => length.convert(Number.POSITIVE_INFINITY, 'm', 'km')).toThrowError(TypeError);
  });

  it('rejects an empty definition list', () => {
    expect(() => createUnitConverter([])).toThrowError(TypeError);
  });

  it('rejects a unit registered twice', () => {
    expect(() => createUnitConverter([
      defineLinearUnit('m', { factor: 1 }),
      defineLinearUnit('m', { factor: 2 }),
    ])).toThrowError(TypeError);
  });

  it('rejects a definition without conversion functions', () => {
    const invalid = { unit: 'm', toBase: undefined, fromBase: (v: number) => v } as unknown as Parameters<typeof createUnitConverter>[0][number];
    expect(() => createUnitConverter([invalid])).toThrowError(TypeError);
  });

  it('delegates convertUnitValue to the converter', () => {
    expect(convertUnitValue(3, 'km', 'm', length)).toBeCloseTo(3000, 10);
  });
});

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
