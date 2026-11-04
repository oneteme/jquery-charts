import { buildChart, ChartProvider, ChartType, CommonChart, XaxisType } from '@oneteme/jquery-core';
import { EChartsOption } from '../types';
import { getXAxisType } from '../chart-utils';
import { EChartTypeConfigurator } from './chart-config-registry';

/** Part de la largeur de catégorie occupée par l'ensemble des pyramides. */
const PYRAMID_GROUP_RATIO = 0.6;

/**
 * Position horizontale d'une pyramide parmi `count` séries partageant une catégorie.
 * `offset` est relatif au centre de la catégorie, `width` est la largeur de la base.
 */
export function pyramidSlot(slotWidth: number, index: number, count: number): { offset: number; width: number } {
  const total = Math.max(1, count);
  const groupWidth = slotWidth * PYRAMID_GROUP_RATIO;
  const width = groupWidth / total;
  return { offset: -groupWidth / 2 + (index + 0.5) * width, width };
}

/** Sommets d'un triangle : base de `width` à `baseY`, pointe en (`centerX`, `apexY`). */
export function computePyramidPoints(centerX: number, baseY: number, apexY: number, width: number): [number, number][] {
  const half = width / 2;
  return [
    [centerX - half, baseY],
    [centerX + half, baseY],
    [centerX, apexY],
  ];
}

/** Convertit une série en points `[indexCategorie, valeur]` en ignorant les valeurs absentes. */
export function toPyramidPoints(values: (number | null | undefined)[]): [number, number][] {
  const points: [number, number][] = [];
  values.forEach((v, i) => {
    if (v != null) points.push([i, v]);
  });
  return points;
}

function pyramidSeries(points: [number, number][], index: number, count: number, color?: string): any {
  return {
    type: 'custom',
    data: points,
    itemStyle: color ? { color } : undefined,
    renderItem: (_params: any, api: any) => {
      const catIndex = api.value(0);
      const value = api.value(1);
      const { offset, width } = pyramidSlot(api.size([1, 0])[0], index, count);
      const [centerX, baseY] = api.coord([catIndex, 0]);
      const [, apexY] = api.coord([catIndex, value]);
      return {
        type: 'polygon',
        shape: { points: computePyramidPoints(centerX + offset, baseY, apexY, width) },
        style: { fill: api.visual('color') },
      };
    },
  };
}

function buildBarOption(
  chart: CommonChart<XaxisType, number>,
  type: ChartType,
  config: ChartProvider<any, any>
): EChartsOption {
  const horizontal = type === 'bar';
  const pyramid = type === 'columnpyramid';
  const categoryAxis = { type: 'category', data: chart.categories.map(String) };

  if (pyramid) {
    // La base de la pyramide est à 0 : l'axe doit toujours inclure 0 (une série custom ne l'impose pas)
    const pyramidValueAxis = { type: 'value' as const, min: (v: { min: number }) => Math.min(0, v.min) };
    const count = chart.series.length;
    return {
      xAxis: { ...categoryAxis, type: 'category' as const },
      yAxis: pyramidValueAxis,
      series: chart.series.map((s, k) => pyramidSeries(toPyramidPoints(s.data), k, count, s.color)),
    };
  }

  const valueAxis: any = { type: 'value' };

  return {
    xAxis: horizontal ? valueAxis : categoryAxis,
    yAxis: horizontal ? categoryAxis : valueAxis,
    series: chart.series.map((s) => ({
      type: 'bar',
      name: s.name,
      data: s.data,
      stack: s.stack,
      itemStyle: s.color ? { color: s.color } : undefined,
      barMaxWidth: '60%',
    })),
  };
}

export const barConfigurator: EChartTypeConfigurator = {
  /**
   * Supporte bar, column et columnpyramid.
   * `columnpyramid` est rendu en série `custom` : un triangle par point, base à 0 et pointe à la valeur.
   * Les séries d'une même catégorie se partagent la largeur. Le cumul (`stack`) n'est pas géré.
   */
  supports: (type) => type === 'bar' || type === 'column' || type === 'columnpyramid',

  buildChartData: (data, config, type) =>
    buildChart(data, { ...config, continue: false }),

  buildOption: (chart, type, config) => buildBarOption(chart as any, type, config),

  tooltipTrigger: 'axis',
};
