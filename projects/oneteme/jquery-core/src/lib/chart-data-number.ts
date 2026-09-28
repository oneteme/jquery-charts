export type ChartNumericValue = number | bigint | string | null | undefined;

export type InvalidChartNumberPolicy = 'throw' | 'null';

export interface ChartNumberFormatOptions {
  /** BCP 47 locale or locale list passed to `Intl.NumberFormat`. */
  locale?: string | string[];
  /**
   * Maximum number of fraction digits. This is intentionally named `precision`
   * for chart callers while preserving the native Intl rounding semantics.
   */
  precision?: number;
  /** Additional native `Intl.NumberFormat` options. */
  format?: Intl.NumberFormatOptions;
  /**
   * Controls what happens when a non-null value is not a finite number.
   * The default is `throw` so invalid source data is not silently transformed.
   */
  invalidNumber?: InvalidChartNumberPolicy;
}

const DEFAULT_LOCALE = 'en-US';

/**
 * Formats one numeric chart value without relying on browser APIs.
 *
 * Numeric strings are accepted when they contain a finite number. Nullish
 * values remain null, while empty, non-numeric and non-finite values throw by
 * default.
 */
export function formatChartNumber(
  value: unknown,
  options: ChartNumberFormatOptions = {},
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const numericValue = toChartNumber(value, options.invalidNumber);
  if (numericValue === null) {
    return null;
  }

  const format: Intl.NumberFormatOptions = {
    ...options.format,
  };
  if (options.precision !== undefined) {
    validatePrecision(options.precision);
    format.maximumFractionDigits = options.precision;
  }

  return new Intl.NumberFormat(options.locale ?? DEFAULT_LOCALE, format).format(numericValue);
}

function toChartNumber(
  value: unknown,
  policy: InvalidChartNumberPolicy = 'throw',
): number | bigint | null {
  if (typeof value === 'bigint') {
    return value;
  }

  let numericValue: number;
  if (typeof value === 'number') {
    numericValue = value;
  } else if (typeof value === 'string' && value.trim() !== '') {
    numericValue = Number(value);
  } else {
    numericValue = Number.NaN;
  }

  if (typeof numericValue === 'number' && Number.isFinite(numericValue)) {
    return numericValue;
  }

  if (policy === 'null') {
    return null;
  }

  throw new TypeError(`[jquery-core] Invalid chart number: ${describeInvalidValue(value)}`);
}

function validatePrecision(precision: number): void {
  if (!Number.isInteger(precision) || precision < 0 || precision > 100) {
    throw new RangeError('[jquery-core] Number precision must be an integer between 0 and 100.');
  }
}

function describeInvalidValue(value: unknown): string {
  if (typeof value === 'object' && value !== null) {
    try {
      return JSON.stringify(value) ?? '<unserializable object>';
    } catch {
      return '<unserializable object>';
    }
  }
  switch (typeof value) {
    case 'string':
      return value;
    case 'number':
    case 'boolean':
    case 'bigint':
      return value.toString();
    case 'symbol':
      return value.description ? `Symbol(${value.description})` : 'Symbol()';
    case 'undefined':
      return 'undefined';
    default:
      return '<unserializable value>';
  }
}
