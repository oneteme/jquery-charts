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

/** Server-side bucket granularities returned as raw grouping keys (all in UTC). */
export type ChartPeriodGranularity = 'hour' | 'monthDay' | 'yearWeek' | 'yearMonth' | 'year';

export interface ChartPeriodFormatOptions {
  /** BCP 47 locale or locale list passed to `Intl.DateTimeFormat`. Defaults to `fr-FR`. */
  locale?: string | string[];
}

const DEFAULT_PERIOD_LOCALE = 'fr-FR';
const PERIOD_REFERENCE_YEAR = 2000;

const PERIOD_PATTERNS: Record<ChartPeriodGranularity, RegExp> = {
  hour: /^(\d{1,2})$/,
  monthDay: /^(\d{2})-(\d{2})$/,
  yearWeek: /^(\d{4})-W(\d{2})$/,
  yearMonth: /^(\d{4})-(\d{2})$/,
  year: /^(\d{4})$/,
};

/**
 * Formats a raw period bucket returned by the server (e.g. `"13"`, `"11-03"`,
 * `"2026-W30"`, `"2026-11"`, `"2026"`) as a readable label, e.g. `13:00`,
 * `3 nov.`, `S30 2026`, `nov. 2026`, `2026`.
 *
 * Buckets are UTC wall-clock values, so they are displayed as-is without any
 * timezone conversion. Unparseable input is returned unchanged.
 */
export function formatPeriodLabel(
  raw: string | number,
  granularity: ChartPeriodGranularity,
  options: ChartPeriodFormatOptions = {},
): string {
  const text = String(raw);
  const parts = parsePeriodParts(text, granularity);
  if (!parts) {
    return text;
  }

  const locale = options.locale ?? DEFAULT_PERIOD_LOCALE;
  const [first, second] = parts;
  switch (granularity) {
    case 'hour':
      return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
        .format(new Date(Date.UTC(PERIOD_REFERENCE_YEAR, 0, 1, first)));
    case 'monthDay':
      return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' })
        .format(new Date(Date.UTC(PERIOD_REFERENCE_YEAR, first - 1, second)));
    case 'yearWeek':
      return `S${String(second).padStart(2, '0')} ${first}`;
    case 'yearMonth':
      return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric', timeZone: 'UTC' })
        .format(new Date(Date.UTC(first, second - 1, 1)));
    case 'year':
      return String(first);
  }
}

/**
 * Sorts raw period buckets chronologically. Server strings sort lexicographically
 * (`"9"` after `"17"`), so this compares the parsed values instead.
 *
 * `monthDay` buckets carry no year. When `from` is provided, they are ordered
 * starting from that date, so ranges crossing New Year stay in order
 * (e.g. `11-30`, `12-01`, `01-02`). Unparseable values are placed last.
 */
export function sortPeriodLabels<T extends string | number>(
  raws: readonly T[],
  granularity: ChartPeriodGranularity,
  from?: Date,
): T[] {
  return [...raws].sort((left, right) => comparePeriodLabels(left, right, granularity, from));
}

/**
 * Comparator counterpart of {@link sortPeriodLabels}, usable directly as a `sort` callback
 * (e.g. for slice values). Same ordering rules, including the `from` anchor for `monthDay`.
 */
export function comparePeriodLabels(
  left: string | number,
  right: string | number,
  granularity: ChartPeriodGranularity,
  from?: Date,
): number {
  const fromTime = from ? Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()) : undefined;
  const leftKey = periodSortKey(String(left), granularity, fromTime);
  const rightKey = periodSortKey(String(right), granularity, fromTime);
  if (leftKey === rightKey) {
    return 0;
  }
  return leftKey < rightKey ? -1 : 1;
}

function parsePeriodParts(text: string, granularity: ChartPeriodGranularity): number[] | null {
  const match = PERIOD_PATTERNS[granularity].exec(text);
  if (!match) {
    return null;
  }

  const values = match.slice(1).map(Number);
  const [first, second] = values;
  switch (granularity) {
    case 'hour':
      return first <= 23 ? values : null;
    case 'monthDay':
      return first >= 1 && first <= 12 && second >= 1 && second <= 31 ? values : null;
    case 'yearWeek':
      return second >= 1 && second <= 53 ? values : null;
    case 'yearMonth':
      return second >= 1 && second <= 12 ? values : null;
    case 'year':
      return values;
  }
}

function periodSortKey(text: string, granularity: ChartPeriodGranularity, fromTime: number | undefined): number {
  const parts = parsePeriodParts(text, granularity);
  if (!parts) {
    return Number.POSITIVE_INFINITY;
  }

  const [first, second] = parts;
  switch (granularity) {
    case 'hour':
      return first;
    case 'monthDay': {
      if (fromTime === undefined) {
        return first * 100 + second;
      }
      const fromYear = new Date(fromTime).getUTCFullYear();
      const candidate = Date.UTC(fromYear, first - 1, second);
      return candidate < fromTime ? Date.UTC(fromYear + 1, first - 1, second) : candidate;
    }
    case 'yearWeek':
      return first * 100 + second;
    case 'yearMonth':
      return first * 100 + second;
    case 'year':
      return first;
  }
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
