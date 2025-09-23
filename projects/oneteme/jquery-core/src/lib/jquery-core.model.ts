export declare type ChartType = 'pie' | 'donut' | 'funnel' | 'pyramid' | 'polar' | 'radar' | 'radarArea' | 'radial' | 'radialBar' | 'bar' | 'column' | 'columnpyramid' | 'line' | 'area' | 'spline' | 'areaspline' | 'scatter' | 'bubble' | 'treemap' | 'heatmap' | 'boxplot' | 'columnrange' | 'arearange' | 'areasplinerange' | 'rangeArea' | 'rangeBar' | 'rangeColumn' | string;

export function values<T>(...values: T[]): DataProvider<T> {
  return (o, idx) => {
    if (idx < values.length) {
      return values[idx];
    }
    throw new Error(`idx=${idx} out of values=[${values.join(', ')}]`);
  };
}

export function field<T>(name: string): DataProvider<T> {
  return (o) => o[name];
}

export function mapField<T>(name: string, map: Map<any, T>): DataProvider<T> {
  return (o) => map.get(o[name]);
}

export function joinFields(separator: string = '_', ...names: string[]): DataProvider<string> {
  return combineFields(joiner(separator), names);
}

export function combineFields<T>(combiner: (args: any[]) => T, names: string[]): DataProvider<T> {
  return (o) => combiner(names.map(f => o[f]).filter(nonUndefined));
}

export function joinProviders<T>(separator: string = '_', ...providers: DataProvider<T>[]): DataProvider<string> {
  return combineProviders(joiner(separator), ...providers);
}

export function combineProviders<T, R>(combiner: (args: T[]) => R, ...providers: DataProvider<T>[]): DataProvider<R> {
  return (o, i) => combiner(providers.map(p => p(o, i)).filter(nonUndefined));
}

export function joiner(separator: string = '_'): (args: any[]) => string {
  return (args) => args.join(separator);
}

export function rangeFields<T>(minName: string, maxName: string): DataProvider<T[]> {
  return (o, i) => {
    const min = (field(minName) as DataProvider<T>)(o, i);
    const max = (field(maxName) as DataProvider<T>)(o, i);
    return nonUndefined(min) && nonUndefined(max) ? [min, max] : undefined;
  };
}

export function buildSingleSerieChart<X extends XaxisType, Y extends YaxisType>(
  objects: any[],
  provider: ChartProvider<X, Y>,
  defaultValue?: Y
): CommonChart<X, Y | Coordinate2D> {
  let copy = provider;
  if (objects?.length > 1 && (provider.series?.length > 1 || typeof provider.series[0].name === 'function')) {
    copy = {
      ...provider,
      pivot: false,
      series: provider.series.map((s) => ({
        data: {
          // pivot & merge => single serie
          x: (provider.pivot // TODO change that cast
            ? combineProviders(joiner(), resolveDataProvider(s.name), s.data.x)
            : combineProviders(
                joiner(),
                s.data.x,
                resolveDataProvider(s.name)
              )) as DataProvider<X>,
          y: s.data.y,
        },
        color: s.color,
        // no unit
      })),
    };
  }
  return {
    ...buildChart(objects, copy, defaultValue),
    pivot: provider.pivot
  };
}

export function buildChart<X extends XaxisType, Y extends YaxisType>(
  objects: any[],
  provider: ChartProvider<X, Y>,
  defaultValue?: Y
): CommonChart<X, Y | Coordinate2D> {
  const mappers = provider.pivot
    ? provider.series.map((m) => ({
        name: resolveDataProvider(m.data.x),
        data: { x: resolveDataProvider(m.name, ''), y: m.data.y },
      }))
    : provider.series;

  const chart = newChart(provider);

  if (!provider.continue) {
    chart.categories = distinct(
      objects,
      mappers.map((m) => m.data.x)
    );
    if (provider.xorder) {
      chart.categories.sort(naturalComparator(provider.xorder));
    }
  }

  const series = {};
  mappers.forEach((m) => {
    const np = resolveDataProvider(m.name);
    const sp = resolveDataProvider(m.stack);
    const cp = resolveDataProvider(m.color);
    const tp = resolveDataProvider(m.type);
    const vp = resolveDataProvider(m.visible);

    objects.forEach((o, i) => {
      const name = np(o, i) || ''; // can't use undefined as a map key
      if (!series[name]) {
        // init serie
        series[name] = {
          data: provider.continue
            ? []
            : new Array(chart.categories.length).fill(defaultValue),
        };
        const stack = sp(o, i);
        const color = cp(o, i);
        const type = tp(o, i);
        const visible = vp(o, i);

        if (name) {
          series[name].name = name;
        }
        if (stack) {
          series[name].stack = stack;
        }
        if (color) {
          series[name].color = color;
        }
        if (type) {
          series[name].type = type;
        }
        if (visible !== undefined) {
          series[name].visible = visible;
        }
      }

      if (provider.continue) {
        series[name].data.push({
          x: m.data.x(o, i),
          y: requireNonUndefined(m.data.y(o, i), defaultValue),
        });
      } else {
        const key = m.data.x(o, i);
        const idx = chart.categories.indexOf(key);
        if (idx > -1) {
          // if !exist
          series[name].data[idx] = requireNonUndefined(
            m.data.y(o, i),
            defaultValue
          );
        } else {
          throw new Error(`'${key}' not part of categories : [${chart.categories.join(', ')}]`);
        }
      }
    });
  });

  chart.series = Object.values(series);

  if (provider.continue && provider.xorder) {
    chart.series.forEach((s) =>
      s.data.sort(naturalFieldComparator(provider.xorder, field('x')))
    );
  }
  return chart;
}

function newChart<X extends XaxisType, Y extends YaxisType>(
  provider: ChartProvider<X, Y>
): CommonChart<X, Y> {
  return Object.entries(provider)
    .filter((e) => ['series'].indexOf(e[0]) < 0)
    .reduce(
      (acc, e) => {
        acc[e[0]] = e[1];
        return acc;
      },
      { series: [] }
    );
}

function resolveDataProvider<T>(
  provider?: T | DataProvider<T>,
  defaultValue?: T
): DataProvider<T> {
  if (provider === undefined || provider === null) {
    return () => defaultValue;
  }
  if (typeof provider === 'function') {
    return provider as DataProvider<T>;
  }
  return () => provider;
}

export function distinct<T>(objects: any[], providers: DataProvider<T>[]): T[] { // T == XaxisType
  const categs = new Set<T>();
  providers.forEach((p) => objects.forEach((o, i) => categs.add(p(o, i))));
  return [...categs];
}

function nonUndefined(o: any): boolean {
  return !isUndefined(o);
}

function requireNonUndefined<T>(o: T, elseValue: T): T {
  return isUndefined(o) ? elseValue : o;
}

function isUndefined(o: any): boolean {
  return o === undefined;
}


export interface ChartProvider<X extends XaxisType, Y extends YaxisType> {
  title?: string;
  subtitle?: string;
  xtitle?: string;
  ytitle?: string; // multiple  {key: val}
  width?: number;
  height?: number;
  stacked?: boolean; // barChart only
  pivot?: boolean; // transpose data
  continue?: boolean; // categories | [x,y]
  xorder?: Sort;
  series?: SerieProvider<X, Y>[];
  options?: any;
  showToolbar?: boolean;
}

export interface SerieProvider<X extends XaxisType, Y extends YaxisType> {
  data: CoordinateProvider<X, Y>; // | [X,Y]
  name?: string | DataProvider<string>;
  stack?: string | DataProvider<string>; // first time at init
  color?: string | DataProvider<string>; // first time at init
  type?: string | DataProvider<string>; // first time at init
  visible?: boolean | DataProvider<boolean>; // pour masquer/afficher une série
  unit?: string;
}

export declare type Coordinate2D = { x: XaxisType; y: YaxisType };

export declare type XaxisType = number | string | Date;

export declare type YaxisType = number | number[]; // 2D

export declare type CoordinateProvider<X, Y> = {
  x: DataProvider<X>;
  y: DataProvider<Y>;
};

export declare type DataProvider<T> = (o: any, idx: number) => T;

export declare type Sort = 'asc' | 'desc';

export interface CommonChart<
  X extends XaxisType,
  Y extends YaxisType | Coordinate2D
> {
  series: CommonSerie<Y>[];
  categories?: X[];
  title?: string;
  subtitle?: string;
  xtitle?: string;
  ytitle?: string;
  width?: number;
  height?: number;
  pivot?: boolean; // transpose data
  continue?: boolean; // categories | [x,y]
  stacked?: boolean;
  xorder?: Sort;
  options?: any;
  showToolbar?: boolean;
}

export interface CommonSerie<Y extends YaxisType | Coordinate2D> {
  data: Y[];
  name?: string;
  stack?: string;
  color?: string;
  visible?: boolean;
  // type
}

export function naturalFieldComparator<T>(
  sens: Sort,
  provider: DataProvider<T>
): (o1: any, o2: any) => number {
  if (provider) {
    const v = sens === 'asc' ? 1 : -1;
    return (o1, o2) => {
      const a = provider(o1, undefined);
      const b = provider(o2, undefined);
      return a > b ? v : a < b ? -v : 0;
    };
  }
  return naturalComparator(sens);
}

export function naturalComparator<T>(sens: Sort): (o1: T, o2: T) => number {
  const v = sens === 'asc' ? 1 : -1;
  return (a: T, b: T) => (a > b ? v : a < b ? -v : 0);
}

export function groupByFiled<T>(arr: [], name: string): { [key: string]: T[] } {
  return groupBy(arr, field(name));
}

export function groupBy<T>(
  arr: [],
  fn: DataProvider<string>
): { [key: string]: T[] } {
  return arr.reduce((acc, o, idx) => {
    const key = fn(o, idx);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(o);
    return acc;
  }, {});
}

export interface ChartView<X extends XaxisType, Y extends YaxisType> {
  config: ChartProvider<X, Y>;
  data: any[];
  isLoading?: boolean;
  canPivot?: boolean;
  debug?: boolean;
}
