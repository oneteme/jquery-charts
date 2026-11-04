import {
  ChartProvider,
  CoordinateProvider,
  DataProvider,
  FunctionCoordinateProvider,
  Sort,
  field,
  naturalComparator,
} from '@oneteme/jquery-core';

/**
 * Ligne brute d'une série, sans agrégation.
 * Contrairement à `buildChart` (qui écrase la valeur quand plusieurs lignes partagent une catégorie),
 * les configurateurs qui ont besoin de toutes les valeurs (boxplot, gauge, sankey) lisent ces points.
 */
export interface RawPoint {
  x: any;
  y: any;
  name: string;
  color?: string;
  unit?: string;
  min?: number;
  max?: number;
  o: any;
  i: number;
}

/** Points regroupés par nom de série, même clé que `buildChart`. */
export interface RawGroup {
  name: string;
  color?: string;
  unit?: string;
  min?: number;
  max?: number;
  points: RawPoint[];
}

function toProvider<T>(p: T | DataProvider<T> | undefined): DataProvider<T | undefined> {
  if (typeof p === 'function') {
    return p as DataProvider<T | undefined>;
  }
  return () => p;
}

function resolveCoordinate(coordinate: CoordinateProvider<any, any>): FunctionCoordinateProvider<any, any> {
  if (coordinate && typeof coordinate === 'object' && 'xField' in coordinate) {
    return { x: field(coordinate.xField), y: field(coordinate.yField) };
  }
  const fn = coordinate as FunctionCoordinateProvider<any, any>;
  if (fn && typeof fn.x === 'function' && typeof fn.y === 'function') {
    return fn;
  }
  throw new Error('Configuration de coordonnees invalide : utilisez { x, y } avec des fonctions ou { xField, yField }.');
}

/** Lit toutes les lignes de chaque série de la config, dans l'ordre série puis ligne. */
export function readRawPoints(objects: any[], config: ChartProvider<any, any>): RawPoint[] {
  return (config.series ?? []).flatMap((s) => {
    const coordinate = resolveCoordinate(s.data);
    const nameProvider = toProvider(s.name);
    const colorProvider = toProvider(s.color);
    const unit = s.unit;
    const min = (s as any).min as number | undefined;
    const max = (s as any).max as number | undefined;
    return objects.map((o, i): RawPoint => ({
      x: coordinate.x(o, i),
      y: coordinate.y(o, i),
      name: String(nameProvider(o, i) ?? ''),
      color: colorProvider(o, i) as string | undefined,
      unit,
      min,
      max,
      o,
      i,
    }));
  });
}

/** Catégories distinctes (ignore null/undefined), triées si `xorder` est défini. */
export function categoriesOf(points: RawPoint[], xorder?: Sort): any[] {
  const categories = [...new Set(points.map((p) => p.x))].filter((x) => x !== undefined && x !== null);
  if (xorder) {
    categories.sort(naturalComparator(xorder));
  }
  return categories;
}

export function groupByName(points: RawPoint[]): RawGroup[] {
  const groups = new Map<string, RawGroup>();
  points.forEach((p) => {
    let group = groups.get(p.name);
    if (!group) {
      group = { name: p.name, color: p.color, unit: p.unit, min: p.min, max: p.max, points: [] };
      groups.set(p.name, group);
    }
    group.points.push(p);
  });
  return [...groups.values()];
}

export function toNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
