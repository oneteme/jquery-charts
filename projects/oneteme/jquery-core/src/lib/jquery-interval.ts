/**
 * Interval utilities — shared across jquery-table, jquery-echarts, jquery-highcharts.
 * Part of @oneteme/jquery-core. No Angular / DOM dependencies.
 *
 * ── Manual strategies (static breakpoints) ───────────────────────────────
 *  - intervalsByBreakpoints([0.1, 0.5, 1, 5])  → n+1 open-ended intervals from n breakpoints
 *  - intervalsByCount(start, end, 5)            → 5 equal-width bounded intervals
 *
 * ── Smart strategies (data-driven, automatic breakpoints) ─────────────────
 *  - computeDataStats(data, extractor)          → descriptive stats (mean, median, quartiles…)
 *  - intervalsFromData(data, extractor, strategy, options)
 *      strategies:
 *        { type: 'quartile' }                   → Q1/Q2/Q3 → 4 balanced classes
 *        { type: 'quantile',    count: 4 }      → n-quantile → n balanced classes  (default)
 *        { type: 'equal-width', count: 5 }      → n equal-width classes from data range
 *        { type: 'mean-stddev', sigmas: [-2,-1,0,1,2] } → mean ± k·σ classes
 *        { type: 'jenks',       count: 5 }      → Fisher-Jenks natural breaks
 *
 * ── Membership helpers ────────────────────────────────────────────────────
 *  - inInterval(value, interval)                → boolean membership test
 *  - resolveInterval(value, intervals)           → find which bucket a value belongs to
 *
 * ── SliceConfig adapter ───────────────────────────────────────────────────
 *  - intervalCategories(intervals, extractor)   → { key, label, filter }[] ready for SliceConfig
 */

// ── Types ─────────────────────────────────────────────────────────────────

/** Value types supported as interval bounds. */
export type IntervalBound = number | Date;

/**
 * A single interval with optional open bounds.
 *
 * Semantics: `[min, max)` (lower inclusive, upper exclusive).
 * - `min: null`  → no lower bound (−∞), i.e. `value < max`
 * - `max: null`  → no upper bound (+∞), i.e. `value >= min`
 * - `maxInclusive: true` → upper bound becomes inclusive: `[min, max]`
 *
 * The `key` field is stable across renders and suitable as a map key
 * or as a `SliceConfig.categories[].key` in `@oneteme/jquery-table`.
 */
export interface Interval<T extends IntervalBound> {
  /** Stable unique identifier. */
  key: string;
  /** Human-readable label. */
  label: string;
  /** Lower bound (inclusive). `null` = −∞. */
  min: T | null;
  /** Upper bound. `null` = +∞. Exclusive unless `maxInclusive` is true. */
  max: T | null;
  /** When true the upper bound is inclusive. Used for the last interval of bounded ranges. */
  maxInclusive?: boolean;
}

/** Customisation options shared by interval generation functions. */
export interface IntervalOptions<T extends IntervalBound> {
  /**
   * Custom label generator.
   * `null` for `min` means open lower bound; `null` for `max` means open upper bound.
   */
  labelFn?: (min: T | null, max: T | null) => string;
  /**
   * Custom key generator.
   * `null` for `min` means open lower bound; `null` for `max` means open upper bound.
   */
  keyFn?: (min: T | null, max: T | null) => string;
}

// ── Internal helpers ──────────────────────────────────────────────────────

/** Normalises any IntervalBound to a plain number for arithmetic/comparison. */
function toNum(v: IntervalBound): number {
  return v instanceof Date ? v.getTime() : (v as number);
}

/** Default label: `< max`, `min – max`, or `≥ min`. */
function defaultLabel(min: IntervalBound | null, max: IntervalBound | null): string {
  const fmt = (v: IntervalBound) =>
    v instanceof Date ? v.toISOString() : String(v);
  if (min === null) return `< ${fmt(max!)}`;
  if (max === null) return `\u2265 ${fmt(min)}`;
  return `${fmt(min)} \u2013 ${fmt(max)}`;
}

/** Default key: `lt_max`, `min_max`, or `gte_min`. Dots replaced with `_` for stability. */
function defaultKey(min: IntervalBound | null, max: IntervalBound | null): string {
  const fmt = (v: IntervalBound) =>
    v instanceof Date
      ? v.getTime().toString()
      : String(v).replace(/\./g, '_');
  if (min === null) return `lt_${fmt(max!)}`;
  if (max === null) return `gte_${fmt(min)}`;
  return `${fmt(min)}_${fmt(max)}`;
}

function makeInterval<T extends IntervalBound>(
  min: T | null,
  max: T | null,
  maxInclusive: boolean,
  opts?: IntervalOptions<T>
): Interval<T> {
  const iv: Interval<T> = {
    key:   (opts?.keyFn   ?? defaultKey  )(min, max),
    label: (opts?.labelFn ?? defaultLabel)(min, max),
    min,
    max,
  };
  if (maxInclusive) {
    iv.maxInclusive = true;
  }
  return iv;
}

// ── Generation functions ──────────────────────────────────────────────────

/**
 * Generates `breakpoints.length + 1` intervals from explicit breakpoints.
 *
 * The breakpoints array is automatically sorted before processing.
 *
 * Produces:
 * - **First**:  `(−∞, breakpoints[0])`        — open lower bound
 * - **Middle**: `[breakpoints[i], breakpoints[i+1])` for each adjacent pair
 * - **Last**:   `[breakpoints[n-1], +∞)`       — open upper bound
 *
 * Use `options.labelFn` / `options.keyFn` to customise labels and keys.
 *
 * @example
 * // Duration thresholds (seconds) → 5 readable slices
 * const durationIntervals = intervalsByBreakpoints<number>(
 *   [0.1, 0.5, 1, 5],
 *   {
 *     labelFn: (min, max) => {
 *       const fmt = (s: number) => s < 1 ? `${s * 1000}ms` : `${s}s`;
 *       if (min === null) return `< ${fmt(max!)}`;
 *       if (max === null) return `> ${fmt(min)}`;
 *       return `${fmt(min)} – ${fmt(max)}`;
 *     }
 *   }
 * );
 * // → '< 100ms' | '100ms – 500ms' | '500ms – 1s' | '1s – 5s' | '> 5s'
 *
 * @example
 * // HTTP status buckets
 * intervalsByBreakpoints([200, 300, 400, 500])
 * // → '< 200' | '200 – 300' | '300 – 400' | '400 – 500' | '≥ 500'
 */
export function intervalsByBreakpoints<T extends IntervalBound>(
  breakpoints: T[],
  options?: IntervalOptions<T>
): Interval<T>[] {
  if (breakpoints.length === 0) return [];
  const sorted = [...breakpoints].sort((a, b) => toNum(a) - toNum(b));
  const result: Interval<T>[] = [];
  result.push(makeInterval<T>(null, sorted[0], false, options));
  for (let i = 0; i < sorted.length - 1; i++) {
    result.push(makeInterval<T>(sorted[i], sorted[i + 1], false, options));
  }
  result.push(makeInterval<T>(sorted[sorted.length - 1], null, false, options));
  return result;
}

/**
 * Generates `count` equal-width intervals spanning `[start, end]`.
 *
 * All intervals are fully bounded.
 * The **last** interval uses an inclusive upper bound (`maxInclusive: true`)
 * so that `value === end` is correctly captured.
 *
 * Works for both `number` and `Date` bounds — the step is computed in
 * milliseconds for dates.
 *
 * @example
 * // 5 equal numeric buckets over [0, 100]
 * intervalsByCount(0, 100, 5)
 * // → [0,20) | [20,40) | [40,60) | [60,80) | [80,100]
 *
 * @example
 * // 4 monthly date buckets
 * intervalsByCount(new Date('2024-01-01'), new Date('2024-12-31'), 4, {
 *   labelFn: (min, max) => {
 *     const fmt = (d: Date | null) => d ? d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : '?';
 *     return `${fmt(min)} – ${fmt(max)}`;
 *   }
 * })
 */
export function intervalsByCount<T extends IntervalBound>(
  start: T,
  end: T,
  count: number,
  options?: IntervalOptions<T>
): Interval<T>[] {
  if (count <= 0) return [];
  const startMs = toNum(start);
  const endMs   = toNum(end);
  const step    = (endMs - startMs) / count;
  const isDate  = start instanceof Date;
  const result: Interval<T>[] = [];
  for (let i = 0; i < count; i++) {
    const loMs = startMs + i * step;
    const hiMs = i === count - 1 ? endMs : startMs + (i + 1) * step;
    const min  = (isDate ? new Date(loMs) : loMs) as T;
    const max  = (isDate ? new Date(hiMs) : hiMs) as T;
    result.push(makeInterval<T>(min, max, i === count - 1, options));
  }
  return result;
}

// ── Membership helpers ────────────────────────────────────────────────────

/**
 * Returns `true` if `value` falls within `interval`.
 *
 * - Lower bound: inclusive (`value >= min`), unconstrained if `min === null`.
 * - Upper bound: exclusive (`value < max`) unless `interval.maxInclusive`,
 *   then inclusive (`value <= max`). Unconstrained if `max === null`.
 */
export function inInterval<T extends IntervalBound>(
  value: T,
  interval: Interval<T>
): boolean {
  const v  = toNum(value);
  if (interval.min !== null && v < toNum(interval.min)) return false;
  if (interval.max !== null) {
    const hi = toNum(interval.max);
    if (interval.maxInclusive ? v > hi : v >= hi) return false;
  }
  return true;
}

/**
 * Finds and returns the first interval in `intervals` that contains `value`.
 * Returns `undefined` if no interval matches.
 *
 * @example
 * const iv = resolveInterval(0.7, durationIntervals);
 * iv?.label // '500ms – 1s'
 */
export function resolveInterval<T extends IntervalBound>(
  value: T,
  intervals: Interval<T>[]
): Interval<T> | undefined {
  return intervals.find(iv => inInterval(value, iv));
}

// ── SliceConfig adapter ───────────────────────────────────────────────────

/**
 * Converts an interval array into a `{ key, label, filter }[]` array,
 * ready to use as `categories` inside a `SliceConfig` of `@oneteme/jquery-table`.
 *
 * A `nullCategory` entry can optionally be added **first** to capture rows
 * where the extracted value is `null` / `undefined`
 * (e.g., requests still in progress that have no `end` timestamp).
 *
 * @param intervals       Interval array from `intervalsByBreakpoints` or `intervalsByCount`.
 * @param valueExtractor  Extracts the value to classify from a table row.
 *                        Return `null` / `undefined` for rows that should fall in `nullCategory`.
 * @param nullCategory    Optional entry for rows with no value.
 *
 * @example
 * // Replace a hand-written SliceConfig.categories for duration slices
 * const DURATION_BREAKPOINTS = [0.1, 0.5, 1, 5]; // seconds
 * const durationLabelFn = (min: number | null, max: number | null) => {
 *   const fmt = (s: number) => s < 1 ? `${s * 1000}ms` : `${s}s`;
 *   if (min === null) return `< ${fmt(max!)}`;
 *   if (max === null) return `> ${fmt(min)}`;
 *   return `${fmt(min)} \u2013 ${fmt(max)}`;
 * };
 *
 * const categories = intervalCategories(
 *   intervalsByBreakpoints(DURATION_BREAKPOINTS, { labelFn: durationLabelFn }),
 *   (row) => row.end != null ? row.end - row.start : null,
 *   { key: 'in-progress', label: 'En cours...' }
 * );
 * // Use as: { title: 'Durée', columnKey: 'duration', hidden: true, categories }
 */
export function intervalCategories<T extends IntervalBound>(
  intervals: Interval<T>[],
  valueExtractor: (row: any) => T | null | undefined,
  nullCategory?: { key: string; label: string }
): Array<{ key: string; label: string; filter: (row: any) => boolean }> {
  const result: Array<{ key: string; label: string; filter: (row: any) => boolean }> = [];
  if (nullCategory) {
    result.push({
      key:    nullCategory.key,
      label:  nullCategory.label,
      filter: (row: any) => valueExtractor(row) == null,
    });
  }
  intervals.forEach(iv => {
    result.push({
      key:    iv.key,
      label:  iv.label,
      filter: (row: any) => {
        const v = valueExtractor(row);
        return v != null && inInterval(v as T, iv);
      },
    });
  });
  return result;
}

// ── Smart interval generation (data-driven) ───────────────────────────────

// ── Statistics ────────────────────────────────────────────────────────────

/**
 * Descriptive statistics computed from a dataset.
 * Returned by `computeDataStats()`.
 */
export interface DataStats {
  /** Number of non-null values used for the computation. */
  count: number;
  min: number;
  max: number;
  mean: number;
  /** Median (50th percentile). Alias for `q2`. */
  median: number;
  /** Population standard deviation. */
  stdDev: number;
  /** First quartile (25th percentile). */
  q1: number;
  /** Second quartile — median (50th percentile). */
  q2: number;
  /** Third quartile (75th percentile). */
  q3: number;
  /** Inter-quartile range: Q3 − Q1. */
  iqr: number;
  /**
   * Returns the p-th percentile (0 ≤ p ≤ 100).
   * Uses linear interpolation between adjacent sorted values.
   */
  percentile(p: number): number;
}

// ── Strategy types ────────────────────────────────────────────────────────

/**
 * Quartile strategy — uses Q1, Q2, Q3 as breakpoints.
 * Produces 4 intervals with roughly equal numbers of values in each.
 * Equivalent to `{ type: 'quantile', count: 4 }`.
 */
export interface QuartileStrategy {
  type: 'quartile';
}

/**
 * Quantile strategy — n equal-frequency intervals.
 * Breakpoints are chosen so each interval contains roughly the same number of data points.
 *
 * @default count 4
 */
export interface QuantileStrategy {
  type: 'quantile';
  /** Number of intervals. Default: 4 */
  count?: number;
}

/**
 * Mean ± k·σ strategy — breakpoints derived from the mean and standard deviation.
 * Best suited for approximately normal (Gaussian) distributions.
 *
 * Each entry in `sigmas` produces a breakpoint at `mean + sigma * stdDev`.
 * Values are automatically sorted and deduplicated.
 *
 * @example
 * { type: 'mean-stddev', sigmas: [-2, -1, 0, 1, 2] }
 * // breakpoints: μ-2σ, μ-σ, μ, μ+σ, μ+2σ → 6 intervals
 *
 * @example
 * { type: 'mean-stddev', sigmas: [0, 1, 2] }
 * // → 4 intervals: below mean | mean→+1σ | +1σ→+2σ | above +2σ
 *
 * @default sigmas [-2, -1, 0, 1, 2]
 */
export interface MeanStdDevStrategy {
  type: 'mean-stddev';
  /**
   * Sigma multipliers. Each produces a breakpoint at `mean + sigma * stdDev`.
   * Default: `[-2, -1, 0, 1, 2]` (6 intervals centred on the mean).
   */
  sigmas?: number[];
}

/**
 * Equal-width strategy — divides the data range [min, max] into n equal-width intervals.
 * Unlike `quantile`, no account is taken of the data distribution.
 *
 * @default count 5
 */
export interface EqualWidthStrategy {
  type: 'equal-width';
  /** Number of intervals. Default: 5 */
  count?: number;
}

/**
 * Jenks natural breaks strategy — Fisher-Jenks algorithm.
 * Minimises within-class variance and maximises between-class variance,
 * producing the most "natural" grouping of the data (best for clustered or multi-modal data).
 *
 * **Complexity**: O(n² · k). Datasets larger than `maxSamples` are
 * uniformly downsampled before the algorithm runs.
 *
 * @default count 5
 * @default maxSamples 1000
 */
export interface JenksStrategy {
  type: 'jenks';
  /** Number of natural-break classes. Default: 5 */
  count?: number;
  /**
   * Maximum number of data points fed to the algorithm.
   * Larger datasets are uniformly downsampled for performance.
   * Default: 1000.
   */
  maxSamples?: number;
}

/**
 * Union of all data-driven interval strategies accepted by `intervalsFromData`.
 *
 * | Strategy      | Breakpoints based on           | Best for                              |
 * |--------------|--------------------------------|---------------------------------------|
 * | `quartile`    | Q1, Q2, Q3                     | Quick balanced 4-class view           |
 * | `quantile`    | n-quantile percentiles         | Balanced n-class view                 |
 * | `equal-width` | Linear range min→max           | Uniform / continuous distributions    |
 * | `mean-stddev` | mean ± k·σ                     | Near-normal distributions             |
 * | `jenks`       | Fisher-Jenks natural breaks    | Clustered / multi-modal data          |
 */
export type IntervalStrategy =
  | QuartileStrategy
  | QuantileStrategy
  | MeanStdDevStrategy
  | EqualWidthStrategy
  | JenksStrategy;

// ── Internal: extraction + statistics ────────────────────────────────────

/** Extracts non-null numeric values from a dataset, sorted ascending. */
function extractSortedNums<T extends IntervalBound>(
  data: any[],
  valueExtractor: (item: any) => T | null | undefined
): number[] {
  const nums: number[] = [];
  for (const item of data) {
    const v = valueExtractor(item);
    if (v != null) nums.push(toNum(v));
  }
  return nums.sort((a, b) => a - b);
}

/** Builds a `DataStats` from a sorted numeric array. */
function buildStats(sorted: number[]): DataStats {
  const n      = sorted.length;
  const min    = sorted[0];
  const max    = sorted[n - 1];
  const mean   = sorted.reduce((s, v) => s + v, 0) / n;
  const variance = sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);

  const percentile = (p: number): number => {
    if (p <= 0) return min;
    if (p >= 100) return max;
    const idx = (p / 100) * (n - 1);
    const lo  = Math.floor(idx);
    const hi  = Math.ceil(idx);
    return lo === hi ? sorted[lo] : sorted[lo] + (idx - lo) * (sorted[hi] - sorted[lo]);
  };

  const q1 = percentile(25);
  const q2 = percentile(50);
  const q3 = percentile(75);

  return { count: n, min, max, mean, median: q2, stdDev, q1, q2, q3, iqr: q3 - q1, percentile };
}

// ── Internal: Fisher-Jenks algorithm ─────────────────────────────────────

/**
 * Computes k−1 natural-break points using the exact Fisher-Jenks DP algorithm.
 * Input `sorted` must already be sorted ascending.
 * Returns breakpoints as the first value of each class starting from class 2.
 */
function jenksBreaks(sorted: number[], k: number, maxSamples: number): number[] {
  const n = sorted.length;
  if (k <= 1 || n <= 1) return [];
  if (k >= n) {
    // Trivial: more classes than points — one point per class
    return sorted.slice(1, k);
  }

  // Downsample for performance
  let data = sorted;
  if (n > maxSamples) {
    const step = (n - 1) / (maxSamples - 1);
    data = Array.from({ length: maxSamples }, (_, i) => sorted[Math.round(i * step)]);
  }
  const m = data.length;

  // Prefix sums for O(1) within-class SSD: sum of squared deviations for data[i..j]
  const prefSum   = new Float64Array(m + 1);
  const prefSumSq = new Float64Array(m + 1);
  for (let i = 0; i < m; i++) {
    prefSum[i + 1]   = prefSum[i]   + data[i];
    prefSumSq[i + 1] = prefSumSq[i] + data[i] * data[i];
  }
  const ssd = (i: number, j: number): number => {
    const cnt = j - i + 1;
    const s   = prefSum[j + 1]   - prefSum[i];
    const sq  = prefSumSq[j + 1] - prefSumSq[i];
    return sq - (s * s) / cnt;
  };

  // DP: dp[c][i] = minimum total SSD using exactly c classes on data[0..i]
  //     sp[c][i] = start index of the last class for dp[c][i]
  const INF = Number.MAX_VALUE;
  const dp: Float64Array[] = Array.from({ length: k + 1 }, () => new Float64Array(m).fill(INF));
  const sp: Uint32Array[]  = Array.from({ length: k + 1 }, () => new Uint32Array(m));

  // Base case: 1 class covers all data from 0 to i
  for (let i = 0; i < m; i++) {
    dp[1][i] = ssd(0, i);
    sp[1][i] = 0;
  }

  // Fill DP for classes 2..k
  for (let c = 2; c <= k; c++) {
    for (let i = c - 1; i < m; i++) {
      for (let j = c - 2; j < i; j++) {
        const cost = dp[c - 1][j] + ssd(j + 1, i);
        if (cost < dp[c][i]) {
          dp[c][i] = cost;
          sp[c][i] = j + 1;
        }
      }
    }
  }

  // Backtrack: recover the start index of each class
  const breaks: number[] = [];
  let right = m - 1;
  for (let c = k; c >= 2; c--) {
    const start = sp[c][right];
    breaks.unshift(data[start]); // first value of this class = breakpoint
    right = start - 1;
  }
  return breaks;
}

// ── Internal: strategy dispatch ───────────────────────────────────────────

function computeBreakpointsFromStrategy(
  sorted: number[],
  stats: DataStats,
  strategy: IntervalStrategy
): number[] {
  switch (strategy.type) {
    case 'quartile':
      return [stats.q1, stats.q2, stats.q3];

    case 'quantile': {
      const count = strategy.count ?? 4;
      return Array.from({ length: count - 1 }, (_, i) =>
        stats.percentile(((i + 1) / count) * 100)
      );
    }

    case 'mean-stddev': {
      const sigmas = strategy.sigmas ?? [-2, -1, 0, 1, 2];
      return sigmas
        .slice()
        .sort((a, b) => a - b)
        .map(s => stats.mean + s * stats.stdDev);
    }

    case 'equal-width': {
      const count = strategy.count ?? 5;
      const step  = (stats.max - stats.min) / count;
      return Array.from({ length: count - 1 }, (_, i) => stats.min + (i + 1) * step);
    }

    case 'jenks': {
      const count      = strategy.count      ?? 5;
      const maxSamples = strategy.maxSamples ?? 1000;
      return jenksBreaks(sorted, count, maxSamples);
    }

    default:
      return [];
  }
}

// ── Public: smart interval API ────────────────────────────────────────────

/**
 * Computes descriptive statistics for the values extracted from a dataset.
 *
 * Returns `null` when all extracted values are `null` / `undefined`.
 *
 * The returned `percentile(p)` function uses linear interpolation between
 * adjacent sorted values (same method as most statistical tools).
 *
 * @example
 * const stats = computeDataStats(requests, r => r.end != null ? r.end - r.start : null);
 * console.log(`mean: ${stats!.mean.toFixed(3)}s, σ: ${stats!.stdDev.toFixed(3)}s`);
 * console.log(`Q1: ${stats!.q1}  median: ${stats!.median}  Q3: ${stats!.q3}`);
 */
export function computeDataStats<T extends IntervalBound>(
  data: any[],
  valueExtractor: (item: any) => T | null | undefined
): DataStats | null {
  const sorted = extractSortedNums(data, valueExtractor);
  return sorted.length === 0 ? null : buildStats(sorted);
}

/**
 * Generates intervals whose breakpoints are **automatically derived from the data**
 * using a configurable statistical strategy.
 *
 * This is the "smart" counterpart to the manual `intervalsByBreakpoints()`.
 * Use it when you don't have fixed thresholds and want the intervals to reflect
 * the actual distribution of the data.
 *
 * The **default strategy** is `{ type: 'quantile', count: 4 }` (4 balanced classes).
 *
 * ## Available strategies
 *
 * | Strategy      | Default params                | Description                                    |
 * |--------------|-------------------------------|------------------------------------------------|
 * | `quartile`    | —                             | Q1/Q2/Q3 → 4 balanced classes                 |
 * | `quantile`    | `count: 4`                    | n-quantile → n balanced classes                |
 * | `equal-width` | `count: 5`                    | Linear range min→max → n equal-width classes   |
 * | `mean-stddev` | `sigmas: [-2,-1,0,1,2]`       | Breakpoints at mean ± k·σ                      |
 * | `jenks`       | `count: 5, maxSamples: 1000`  | Fisher-Jenks natural breaks                    |
 *
 * All breakpoints outside the actual data range `(min, max)` are discarded,
 * and duplicates are removed, so the result always contains meaningful intervals.
 *
 * Works with both `number` and `Date` values.
 *
 * @param data           Source dataset.
 * @param valueExtractor Extracts the value to classify from each item. Return `null` to exclude.
 * @param strategy       Which algorithm to use and its parameters.
 * @param options        Optional `labelFn` / `keyFn` to customise interval labels and keys.
 *
 * @returns `Interval<T>[]` — same format as `intervalsByBreakpoints()`, ready for
 *          `inInterval()`, `resolveInterval()`, and `intervalCategories()`.
 *
 * @example
 * // 4 balanced quartile buckets from actual request durations
 * const intervals = intervalsFromData(
 *   requests,
 *   r => r.end != null ? r.end - r.start : null
 * );
 *
 * @example
 * // 5 Jenks natural-break classes
 * const intervals = intervalsFromData(
 *   requests,
 *   r => r.end != null ? r.end - r.start : null,
 *   { type: 'jenks', count: 5 }
 * );
 *
 * @example
 * // 6 symmetric mean±2σ buckets with a custom label
 * const intervals = intervalsFromData(
 *   requests,
 *   r => r.duration,
 *   { type: 'mean-stddev', sigmas: [-2, -1, 0, 1, 2] },
 *   {
 *     labelFn: (min, max) => {
 *       const fmt = (v: number | null) => v == null ? '∞' : `${v.toFixed(2)}s`;
 *       if (min === null) return `< ${fmt(max)}`;
 *       if (max === null) return `≥ ${fmt(min)}`;
 *       return `${fmt(min)} – ${fmt(max)}`;
 *     }
 *   }
 * );
 *
 * @example
 * // Use directly in intervalCategories to build a SliceConfig.categories
 * const categories = intervalCategories(
 *   intervalsFromData(requests, r => r.end != null ? r.end - r.start : null),
 *   r => r.end != null ? r.end - r.start : null,
 *   { key: 'in-progress', label: 'En cours...' }
 * );
 */
export function intervalsFromData<T extends IntervalBound>(
  data: any[],
  valueExtractor: (item: any) => T | null | undefined,
  strategy: IntervalStrategy = { type: 'quantile', count: 4 },
  options?: IntervalOptions<T>
): Interval<T>[] {
  const sorted = extractSortedNums(data, valueExtractor);
  if (sorted.length === 0) return [];

  const stats  = buildStats(sorted);
  const isDate = data.some(item => { const v = valueExtractor(item); return v instanceof Date; });

  const rawBreaks = computeBreakpointsFromStrategy(sorted, stats, strategy);

  // Deduplicate, sort, and discard values outside the actual data range
  const breakNums = [...new Set(rawBreaks)]
    .sort((a, b) => a - b)
    .filter(b => b > stats.min && b < stats.max);

  if (breakNums.length === 0) {
    // Degenerate case: all values identical or strategy produced nothing useful
    const v = (isDate ? new Date(stats.min) : stats.min) as T;
    return [makeInterval<T>(v, v, true, options)];
  }

  const breakpoints = breakNums.map(n => (isDate ? new Date(n) : n) as T);
  return intervalsByBreakpoints(breakpoints, options);
}
