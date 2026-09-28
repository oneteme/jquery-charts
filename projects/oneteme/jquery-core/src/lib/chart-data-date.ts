export type ChartDateValue = Date | string | number | null | undefined;

export type InvalidChartDatePolicy = 'throw' | 'null';

export interface ChartDateNormalizationOptions {
  /**
   * Controls what happens when a non-null value cannot be parsed as a date.
   * The default is `throw` so invalid source data is not silently transformed.
   */
  invalidDate?: InvalidChartDatePolicy;
}

export interface ChartDateFormatOptions extends ChartDateNormalizationOptions {
  /** BCP 47 locale or locale list passed to `Intl.DateTimeFormat`. */
  locale?: string | string[];
  /** IANA timezone passed to `Intl.DateTimeFormat`. Defaults to UTC. */
  timeZone?: string;
  /** Date/time presentation options passed to `Intl.DateTimeFormat`. */
  format?: Intl.DateTimeFormatOptions;
}

const DEFAULT_LOCALE = 'en-US';
const DEFAULT_TIME_ZONE = 'UTC';
const DEFAULT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};

/**
 * Normalizes supported chart date inputs to a new Date instance.
 *
 * Date values are cloned so callers cannot mutate the source object through the
 * normalized result. Timezone affects presentation, not the represented instant.
 */
export function normalizeChartDate(
  value: unknown,
  options: ChartDateNormalizationOptions = {},
): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  let date: Date;
  if (value instanceof Date) {
    date = new Date(value.valueOf());
  } else if (typeof value === 'string' || typeof value === 'number') {
    date = new Date(value);
  } else {
    return handleInvalidDate(value, options.invalidDate);
  }

  if (!Number.isFinite(date.getTime())) {
    return handleInvalidDate(value, options.invalidDate);
  }

  return date;
}

/**
 * Formats one date using an explicit locale and timezone.
 *
 * Nullish values remain null. Invalid non-null values throw by default and can
 * explicitly opt into a null result with `invalidDate: 'null'`.
 */
export function formatChartDate(
  value: unknown,
  options: ChartDateFormatOptions = {},
): string | null {
  const date = normalizeChartDate(value, options);
  if (date === null) {
    return null;
  }

  const format = options.format ?? DEFAULT_DATE_FORMAT;
  return new Intl.DateTimeFormat(options.locale ?? DEFAULT_LOCALE, {
    ...format,
    timeZone: options.timeZone ?? format.timeZone ?? DEFAULT_TIME_ZONE,
  }).format(date);
}

function handleInvalidDate(value: unknown, policy: InvalidChartDatePolicy = 'throw'): null {
  if (policy === 'null') {
    return null;
  }

  throw new RangeError(`[jquery-core] Invalid chart date: ${describeInvalidValue(value)}`);
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
