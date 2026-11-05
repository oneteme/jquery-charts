import { buildChart, ChartProvider, ChartType, CommonChart } from '@oneteme/jquery-core';
import { EChartsOption } from '../types';
import { formatTooltipValue } from '../chart-utils';
import { EChartTypeConfigurator } from './chart-config-registry';
import { toNumber } from './raw-series';

const WATERFALL_TYPES: ChartType[] = ['waterfall'];

const INCREASE_COLOR = '#2e9e6a';
const DECREASE_COLOR = '#d4543c';
const BAR_WIDTH_RATIO = 0.6;

export interface WaterfallStep {
  name: string;
  delta: number;
  /** Total cumulé avant l'étape */
  start: number;
  /** Total cumulé après l'étape */
  end: number;
}

/**
 * Calcule le total cumulé à chaque étape. Une valeur absente compte pour 0.
 * Le cumul peut passer sous zéro : chaque barre est définie par son début et sa fin.
 */
export function buildWaterfallSteps(categories: string[], deltas: (number | null | undefined)[]): WaterfallStep[] {
  let running = 0;
  return categories.map((name, i) => {
    const delta = toNumber(deltas[i]) ?? 0;
    const start = running;
    running += delta;
    return { name, delta, start, end: running };
  });
}

function formatDelta(delta: number): string {
  return `${delta > 0 ? '+' : ''}${formatTooltipValue(delta)}`;
}

function renderWaterfallItem(_params: any, api: any): any {
  const index = api.value(0);
  const low = api.value(1);
  const high = api.value(2);
  const delta = api.value(3);
  const top = api.coord([index, high]);
  const bottom = api.coord([index, low]);
  const width = api.size([1, 0])[0] * BAR_WIDTH_RATIO;
  return {
    type: 'rect',
    shape: {
      x: top[0] - width / 2,
      y: top[1],
      width,
      height: Math.max(bottom[1] - top[1], 1),
    },
    style: { fill: delta >= 0 ? INCREASE_COLOR : DECREASE_COLOR },
  };
}

function buildWaterfallOption(chart: CommonChart<any, any>): EChartsOption {
  const categories = (chart.categories ?? []).map(String);
  const steps = buildWaterfallSteps(categories, chart.series[0]?.data ?? []);

  return {
    xAxis: { type: 'category', data: categories, axisLabel: { interval: 0 } },
    yAxis: { type: 'value' },
    legend: { show: false },
    series: [
      {
        type: 'custom',
        name: chart.series[0]?.name ?? 'Variation',
        renderItem: renderWaterfallItem,
        data: steps.map((s, i) => ({
          name: s.name,
          value: [i, Math.min(s.start, s.end), Math.max(s.start, s.end), s.delta],
        })),
        label: {
          show: true,
          position: 'top',
          formatter: (p: any) => formatDelta(p.value[3]),
        },
        tooltip: {
          formatter: (p: any) => `${p.name}<br/>${formatDelta(p.value[3])}`,
        },
      },
    ],
  } as EChartsOption;
}

/**
 * Cascade : chaque catégorie est une étape, la valeur est sa variation.
 * Hausse en vert, baisse en rouge. Seule la première série est utilisée.
 */
export const waterfallConfigurator: EChartTypeConfigurator = {
  supports: (type) => WATERFALL_TYPES.includes(type),

  buildChartData: (data, config: ChartProvider<any, any>) =>
    buildChart(data, { ...config, continue: false }),

  buildOption: (chart) => buildWaterfallOption(chart),

  tooltipTrigger: 'item',
};
