import type { GroupSyncMode } from './chart-capabilities.model';

export declare type ChartType = 'pie' | 'donut' | 'funnel' | 'pyramid' | 'polar' | 'radar' | 'radarArea' | 'radial' | 'radialBar' | 'bar' | 'column' | 'columnpyramid' | 'line' | 'area' | 'spline' | 'areaspline' | 'scatter' | 'bubble' | 'treemap' | 'heatmap' | 'boxplot' | 'columnrange' | 'arearange' | 'areasplinerange' | 'rangeArea' | 'rangeBar' | 'rangeColumn' | 'mixed' | 'map' | string;

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
  const resolvedProvider = resolveChartProvider(provider);
  const resolvedSeries = resolvedProvider.series ?? [];
  let copy = resolvedProvider;
  if (objects?.length > 1 && (resolvedSeries.length > 1 || typeof resolvedSeries[0]?.name === 'function')) {
    copy = {
      ...resolvedProvider,
      pivot: false,
      series: resolvedSeries.map((s) => ({
        data: {
          // pivot & merge => single serie
          x: (resolvedProvider.pivot // TODO change that cast
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
  const resolvedProvider = resolveChartProvider(provider);
  const resolvedSeries = resolvedProvider.series ?? [];
  const mappers = resolvedProvider.pivot
    ? resolvedSeries.map((m) => ({
        name: resolveDataProvider(m.data.x),
        data: { x: resolveDataProvider(m.name, ''), y: m.data.y },
      }))
    : resolvedSeries;

  const chart: CommonChart<X, Y> = newChart(resolvedProvider as ChartProvider<X, Y>);

  if (!resolvedProvider.continue) {
    chart.categories = distinct(
      objects,
      mappers.map((m) => m.data.x)
    );
    if (provider.xorder) {
      chart.categories.sort(naturalComparator(provider.xorder));
    }
  }

  const chartSeries: Record<string, any> = {};
  mappers.forEach((m) => {
    const np = resolveDataProvider(m.name);
    const sp = resolveDataProvider(m.stack);
    const cp = resolveDataProvider(m.color);
    const tp = resolveDataProvider(m.type);
    const vp = resolveDataProvider(m.visible);
    const yap = resolveDataProvider(m.yAxisIndex);
    const unit = m.unit;

    objects.forEach((o, i) => {
      const name = np(o, i) || ''; // can't use undefined as a map key
      if (!chartSeries[name]) {
        // init serie
        chartSeries[name] = {
          data: resolvedProvider.continue
            ? []
            : new Array(chart.categories.length).fill(defaultValue),
        };
        const stack = sp(o, i);
        const color = cp(o, i);
        const type = tp(o, i);
        const visible = vp(o, i);
        const yAxisIndex = yap(o, i);

        if (name) {
          chartSeries[name].name = name;
        }
        if (stack) {
          chartSeries[name].stack = stack;
        }
        if (color) {
          chartSeries[name].color = color;
        }
        if (type) {
          chartSeries[name].type = type;
        }
        if (visible !== undefined) {
          chartSeries[name].visible = visible;
        }
        if (unit) {
          chartSeries[name].unit = unit;
        }
        if ((m as any).showUnitOnAxis !== undefined) {
          chartSeries[name].showUnitOnAxis = (m as any).showUnitOnAxis;
        }
        if (yAxisIndex !== undefined) {
          chartSeries[name].yAxisIndex = yAxisIndex;
        }
        const yAxisConfig = (m as any).yAxisConfig;
        if (yAxisConfig) {
          chartSeries[name].yAxisConfig = yAxisConfig;
        }
        const noDataStyle = (m as any).noDataStyle;
        if (noDataStyle) {
          chartSeries[name].noDataStyle = noDataStyle;
        }
      }

      if (resolvedProvider.continue) {
        chartSeries[name].data.push({
          x: m.data.x(o, i),
          y: requireNonUndefined(m.data.y(o, i), defaultValue),
          _o: o,
        });
      } else {
        const key = m.data.x(o, i);
        const idx = chart.categories.indexOf(key);
        if (idx > -1) {
          // if !exist
          chartSeries[name].data[idx] = requireNonUndefined(
            m.data.y(o, i),
            defaultValue
          );
        } else {
          throw new Error(`'${key}' not part of categories : [${chart.categories.join(', ')}]`);
        }
      }
    });
  });

  chart.series = Object.values(chartSeries);

  if (resolvedProvider.continue && resolvedProvider.xorder) {
    chart.series.forEach((s) =>
      s.data.sort(naturalFieldComparator(resolvedProvider.xorder, field('x')))
    );
  }
  return chart;
}

function resolveChartProvider<X extends XaxisType, Y extends YaxisType>(
  provider: ChartProvider<X, Y>
): ResolvedChartProvider<X, Y> {
  return {
    ...provider,
    series: provider.series?.map(series => ({
      ...series,
      data: resolveCoordinateProvider(series.data)
    }))
  } as ResolvedChartProvider<X, Y>;
}

function resolveCoordinateProvider<X extends XaxisType, Y extends YaxisType>(
  coordinate: CoordinateProvider<X, Y>
): FunctionCoordinateProvider<X, Y> {
  if (isFieldCoordinateProvider(coordinate)) {
    return {
      x: field<X>(coordinate.xField),
      y: field<Y>(coordinate.yField)
    };
  }

  const functionCoordinate = coordinate as FunctionCoordinateProvider<X, Y>;
  if (functionCoordinate && typeof functionCoordinate.x === 'function' && typeof functionCoordinate.y === 'function') {
    return functionCoordinate;
  }

  throw new Error('Configuration de coordonnees invalide : utilisez { x, y } avec des fonctions ou { xField, yField } avec des cles non vides.');
}

function isFieldCoordinateProvider<X extends XaxisType, Y extends YaxisType>(
  coordinate: CoordinateProvider<X, Y>
): coordinate is FieldCoordinateProvider {
  if (!coordinate || typeof coordinate !== 'object' || !('xField' in coordinate || 'yField' in coordinate)) {
    return false;
  }

  const fieldCoordinate = coordinate as Partial<FieldCoordinateProvider>;
  if (typeof fieldCoordinate.xField !== 'string' || !fieldCoordinate.xField.trim() || typeof fieldCoordinate.yField !== 'string' || !fieldCoordinate.yField.trim()) {
    throw new Error('Configuration de coordonnees invalide : xField et yField doivent etre des chaines non vides.');
  }

  return true;
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

// Config dynamique de Y avec auto-scaling intelligent.
// Détecte automatiquement le meilleur format (µs, ms, s, etc.) basé sur l'ordre de grandeur des données.
export interface UnitConfig {
  baseUnit: string;        // Unité source des données ('s', 'o', etc.)
  scales: ScaleConfig[];   // Formats disponibles, choisis selon le maximum des valeurs
  precision?: number;      // Fixe les décimales (si non spécifié, utilise _smartFormatY adaptatif)
  formatter?: (v: number, selectedUnit: string) => string; // Formatage personnalisé
}

// Définit un format d'affichage avec sa plage d'applicabilité.
export interface ScaleConfig {
  unit: string;            // Unité affichée ('µs', 'ms', 's', 'k', 'M', etc.)
  scale: number;           // Facteur de conversion (1000 pour s→ms, 0.001 pour unités→k)
  threshold?: number;      // Format utilisé si le maximum absolu des valeurs <= threshold
}

export interface ChartProvider<X extends XaxisType, Y extends YaxisType> {
  title?: string;
  subtitle?: string;
  xtitle?: string;
  ytitle?: string | string[]; // single axis or multiple axes
  width?: number;
  height?: number;
  stacked?: boolean; // barChart only
  pivot?: boolean; // transpose data
  continue?: boolean; // categories | [x,y]
  xorder?: Sort;
  series?: SerieProvider<X, Y>[];
  options?: any;
  showToolbar?: boolean;
  group?: string; // groupe de synchronisation inter-graphiques
  groupSync?: GroupSyncMode; // ce qui est synchronisé dans le groupe
  mapEndpoint?: string; // Endpoint pour GeoJSON
  mapParam?: string; // Param URL à lire pour la subdiv
  mapDefaultValue?: string; // Subdiv défaut si param absent
  mapColor?: 'blue' | 'green' | 'purple' | 'orange' | 'grey' | string; // couleur pour les maps
  mapJoinBy?: [string, string]; // JoinBy par défaut pour les maps (ex: ['code', 'code'])
  yUnit?: string | UnitConfig; // unité du Y : string simple ou config dynamique avec scales
}

export interface SerieProvider<X extends XaxisType, Y extends YaxisType> {
  data: CoordinateProvider<X, Y>; // | [X,Y]
  name?: string | DataProvider<string>;
  stack?: string | DataProvider<string>; // first time at init
  color?: string | DataProvider<string>; // first time at init
  type?: string | DataProvider<string>; // first time at init
  visible?: boolean | DataProvider<boolean>; // pour masquer/afficher une série
  unit?: string;
  showUnitOnAxis?: boolean; // affiche l'unité sur les graduations de l'axe Y (true par défaut)
  yAxisIndex?: number; // Pour les dual/multi-axis : 0 (défaut), 1, 2, etc.
  yAxisConfig?: Record<string, any>; // Options personnalisées pour cet axe Y (ex: splitNumber)
}

export declare type Coordinate2D = { x: XaxisType; y: YaxisType };

export declare type XaxisType = number | string | Date;

export declare type YaxisType = number | number[]; // 2D

export declare type FunctionCoordinateProvider<X, Y> = {
  x: DataProvider<X>;
  y: DataProvider<Y>;
};

/** Coordonnees serialisables : adaptees au stockage JSON et aux configurations transmises par API. */
export declare type FieldCoordinateProvider = {
  xField: string;
  yField: string;
};

export declare type CoordinateProvider<X, Y> = FunctionCoordinateProvider<X, Y> | FieldCoordinateProvider;

type ResolvedChartProvider<X extends XaxisType, Y extends YaxisType> = Omit<ChartProvider<X, Y>, 'series'> & {
  series?: Array<Omit<SerieProvider<X, Y>, 'data'> & {data: FunctionCoordinateProvider<X, Y>}>;
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
  ytitle?: string | string[];
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
  unit?: string;
  visible?: boolean;
  type?: string;
  yAxisIndex?: number; // Pour les dual/multi-axis : 0 (défaut), 1, 2, etc.
  showUnitOnAxis?: boolean;
  yAxisConfig?: Record<string, any>; // Options personnalisées pour cet axe Y (ex: splitNumber)
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
