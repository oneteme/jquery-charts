import { ChartProvider, ChartType, computeDataStats } from '@oneteme/jquery-core';
import { EChartsOption } from '../types';
import { EChartTypeConfigurator } from './chart-config-registry';
import { categoriesOf, groupByName, readRawPoints, toNumber } from './raw-series';

const BOXPLOT_TYPES: ChartType[] = ['boxplot'];
const WHISKER_FACTOR = 1.5;

/** [min (moustache basse), Q1, médiane, Q3, max (moustache haute)] — ordre attendu par ECharts. */
export type BoxValues = [number, number, number, number, number];

export interface BoxplotBox {
  box: BoxValues | null;
  outliers: number[];
}

/**
 * Calcule la boîte d'un échantillon avec les moustaches de Tukey :
 * les moustaches s'arrêtent à la plus proche valeur comprise dans [Q1 - 1.5·IQR, Q3 + 1.5·IQR],
 * les valeurs au-delà sont retournées comme valeurs aberrantes.
 */
export function computeBoxplotBox(values: number[]): BoxplotBox {
  const stats = computeDataStats(values, (v: number) => v);
  if (!stats) {
    return { box: null, outliers: [] };
  }
  const lowerFence = stats.q1 - WHISKER_FACTOR * stats.iqr;
  const upperFence = stats.q3 + WHISKER_FACTOR * stats.iqr;
  const inside = values.filter((v) => v >= lowerFence && v <= upperFence);
  const outliers = values.filter((v) => v < lowerFence || v > upperFence);
  const [low, high] = inside.length ? extent(inside) : [stats.q1, stats.q3];
  return {
    box: [low, stats.q1, stats.median, stats.q3, high],
    outliers,
  };
}

/** Bornes min/max en une boucle : évite `Math.min(...array)`, qui dépasse la pile d'appels sur de grands tableaux. */
function extent(values: number[]): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return [min, max];
}

export interface BoxplotSerie {
  name: string;
  color?: string;
  boxes: (BoxValues | null)[];
  outliers: [number, number][];
}

export interface BoxplotModel {
  categories: any[];
  series: BoxplotSerie[];
}

/**
 * Une boîte par (série × catégorie) calculée sur toutes les lignes brutes de la catégorie.
 * Les catégories sans valeur reçoivent `null` (rendu absent). Les séries sont regroupées par nom, comme `buildChart`.
 */
export function buildBoxplotModel(data: any[], config: ChartProvider<any, any>): BoxplotModel {
  const points = readRawPoints(data, config);
  const categories = categoriesOf(points, config.xorder);

  const series = groupByName(points).map((group): BoxplotSerie => {
    const samples = new Map<any, number[]>();
    group.points.forEach((p) => {
      const value = toNumber(p.y);
      if (value === undefined) return;
      const bucket = samples.get(p.x);
      if (bucket) bucket.push(value);
      else samples.set(p.x, [value]);
    });

    const boxes: (BoxValues | null)[] = [];
    const outliers: [number, number][] = [];
    categories.forEach((category, idx) => {
      const values = samples.get(category);
      if (!values?.length) {
        boxes.push(null);
        return;
      }
      const result = computeBoxplotBox(values);
      boxes.push(result.box);
      result.outliers.forEach((v) => outliers.push([idx, v]));
    });

    return { name: group.name, color: group.color, boxes, outliers };
  });

  return { categories, series };
}

function buildBoxplotOption(chart: BoxplotModel): EChartsOption {
  return {
    legend: { data: chart.series.map((s) => s.name) },
    xAxis: { type: 'category', data: chart.categories.map(String) },
    yAxis: { type: 'value', scale: true },
    series: chart.series.flatMap((s): any[] => [
      {
        type: 'boxplot',
        name: s.name,
        data: s.boxes,
        itemStyle: s.color ? { color: s.color, borderColor: s.color } : undefined,
      },
      {
        type: 'scatter',
        name: `${s.name} (valeurs aberrantes)`,
        data: s.outliers,
        symbolSize: 6,
        itemStyle: s.color ? { color: s.color } : undefined,
        tooltip: {
          trigger: 'item',
          formatter: (p: any) => `${p.seriesName}<br/>${p.value[1]}`,
        },
      },
    ]),
  };
}

export const boxplotConfigurator: EChartTypeConfigurator<BoxplotModel> = {
  supports: (type) => BOXPLOT_TYPES.includes(type),

  buildChartData: (data, config) => buildBoxplotModel(data, config),

  buildOption: (chart) => buildBoxplotOption(chart),

  tooltipTrigger: 'item',
};
