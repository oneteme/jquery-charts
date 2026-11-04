import { ChartProvider, ChartType } from '@oneteme/jquery-core';
import { EChartsOption } from '../types';
import { EChartTypeConfigurator } from './chart-config-registry';
import { categoriesOf, groupByName, readRawPoints, toNumber } from './raw-series';

const GAUGE_TYPES: ChartType[] = ['gauge'];
const DEFAULT_MIN = 0;
const DEFAULT_MAX = 100;

export interface GaugeItem {
  name: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  color?: string;
}

export interface GaugeModel {
  items: GaugeItem[];
}

export interface GaugeLayout {
  centers: [string, string][];
  radius: string;
}

/**
 * Disposition en grille quasi carrée. Le rayon est exprimé en pourcentage :
 * ECharts le rapporte à la plus petite dimension du conteneur, donc c'est une approximation
 * qui peut nécessiter d'ajuster `options.series[i].radius` pour des cas particuliers.
 */
export function computeGaugeLayout(count: number): GaugeLayout {
  if (count <= 0) {
    return { centers: [], radius: '0%' };
  }
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const cellWidth = 100 / cols;
  const cellHeight = 100 / rows;
  const centers = Array.from({ length: count }, (_, k): [string, string] => [
    `${(((k % cols) + 0.5) * cellWidth).toFixed(2)}%`,
    `${((Math.floor(k / cols) + 0.5) * cellHeight).toFixed(2)}%`,
  ]);
  return { centers, radius: `${Math.round(Math.min(cellWidth, cellHeight) * 0.8)}%` };
}

function buildGaugeOption(chart: GaugeModel): EChartsOption {
  const layout = computeGaugeLayout(chart.items.length);
  return {
    // Pas de grille ni d'axes pour un gauge
    grid: undefined,
    xAxis: undefined,
    yAxis: undefined,
    legend: { show: false },
    series: chart.items.map((item, k) => ({
      type: 'gauge',
      center: layout.centers[k],
      radius: layout.radius,
      min: item.min,
      max: item.max,
      progress: { show: true, width: 10 },
      axisLine: { lineStyle: { width: 10 } },
      pointer: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      title: { show: true, offsetCenter: [0, '70%'], fontSize: 12 },
      detail: {
        valueAnimation: true,
        offsetCenter: [0, '30%'],
        fontSize: 16,
        formatter: item.unit ? `{value} ${item.unit}` : '{value}',
      },
      itemStyle: item.color ? { color: item.color } : undefined,
      data: [{ value: item.value, name: item.name }],
    })),
  };
}

export const gaugeConfigurator: EChartTypeConfigurator<GaugeModel> = {
  supports: (type) => GAUGE_TYPES.includes(type),

  /**
   * Une jauge par (série × catégorie). La valeur est la dernière Y de la catégorie,
   * comme `buildChart`. Min/max par série via `min` / `max` (défaut 0 → 100).
   */
  buildChartData: (data, config: ChartProvider<any, any>) => {
    const points = readRawPoints(data, config);
    const categories = categoriesOf(points, config.xorder);
    const groups = groupByName(points);
    const items: GaugeItem[] = [];

    groups.forEach((group) => {
      const lastValue = new Map<any, number>();
      group.points.forEach((p) => {
        const value = toNumber(p.y);
        if (value !== undefined) lastValue.set(p.x, value);
      });

      categories.forEach((category) => {
        const value = lastValue.get(category);
        if (value === undefined) return;
        const label = groups.length > 1 && group.name ? `${category} (${group.name})` : String(category);
        items.push({
          name: label,
          value,
          min: group.min ?? DEFAULT_MIN,
          max: group.max ?? DEFAULT_MAX,
          unit: group.unit,
          color: group.color,
        });
      });
    });

    return { items };
  },

  buildOption: (chart) => buildGaugeOption(chart),

  tooltipTrigger: 'item',
};
