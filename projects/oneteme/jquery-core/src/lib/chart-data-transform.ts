import { ChartDateFormatOptions, formatChartDate } from './chart-data-date';
import { ChartNumberFormatOptions, formatChartNumber } from './chart-data-number';
import { ChartUnitConverter } from './chart-data-unit';

export type ReplaceChartDataFields<T extends object, K extends keyof T, V> =
  Omit<T, K> & { [P in K]: V };

/**
 * Applies an immutable transformation to selected direct fields of chart rows.
 * Rows are shallow-cloned and the input array is never modified.
 */
export function mapChartDataFields<
  T extends object,
  K extends keyof T & string,
  V,
>(
  data: readonly T[],
  fields: readonly K[],
  transform: (value: T[K], field: K, row: T, index: number) => V,
): Array<ReplaceChartDataFields<T, K, V>> {
  validateUniqueFields(fields);

  return data.map((row, index) => {
    const transformed = { ...row } as Record<string, unknown>;
    for (const field of fields) {
      transformed[field] = transform(row[field], field, row, index);
    }
    return transformed as ReplaceChartDataFields<T, K, V>;
  });
}

/**
 * Formats selected date fields while preserving nullish values.
 */
export function formatChartDataDates<
  T extends object,
  K extends keyof T & string,
>(
  data: readonly T[],
  fields: readonly K[],
  options: ChartDateFormatOptions = {},
): Array<ReplaceChartDataFields<T, K, string | null>> {
  return mapChartDataFields(data, fields, value => formatChartDate(value, options));
}

/**
 * Formats selected numeric fields while preserving nullish values.
 */
export function formatChartDataValues<
  T extends object,
  K extends keyof T & string,
>(
  data: readonly T[],
  fields: readonly K[],
  options: ChartNumberFormatOptions = {},
): Array<ReplaceChartDataFields<T, K, string | null>> {
  return mapChartDataFields(data, fields, value => formatChartNumber(value, options));
}

/**
 * Converts selected numeric fields using a registered unit converter.
 * Nullish values remain null; all other values must be finite numbers.
 */
export function convertChartDataValues<
  T extends object,
  K extends keyof T & string,
  Unit extends string,
>(
  data: readonly T[],
  fields: readonly K[],
  converter: ChartUnitConverter<Unit>,
  from: Unit,
  to: Unit,
): Array<ReplaceChartDataFields<T, K, number | null>> {
  return mapChartDataFields(data, fields, value => {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new TypeError(`[jquery-core] Chart unit conversion requires finite numbers: ${String(value)}`);
    }
    return converter.convert(value, from, to);
  });
}

function validateUniqueFields<K extends string>(fields: readonly K[]): void {
  const seen = new Set<string>();
  for (const field of fields) {
    if (seen.has(field)) {
      throw new TypeError(`[jquery-core] Chart data field is listed more than once: "${field}".`);
    }
    seen.add(field);
  }
}
