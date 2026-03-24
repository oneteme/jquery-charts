import { buildSingleSerieChart, ChartProvider, ChartType, CommonChart } from '@oneteme/jquery-core';
import { EChartsOption } from '../types';
import { EChartTypeConfigurator } from './chart-config-registry';

const FUNNEL_TYPES: ChartType[] = ['funnel', 'pyramid'];

function buildFunnelOption(
  chart: CommonChart<string, number>,
  type: ChartType,
  config: ChartProvider<any, any>
): EChartsOption {
  const isPyramid = type === 'pyramid';

  const pairs = chart.series[0]?.data.map((val, i) => ({
    name: String(chart.categories[i] ?? ''),
    value: val ?? 0,
  })) ?? [];

  // Funnel : décroissant (plus grand en haut) — Pyramid : croissant (plus petit en haut)
  const sorted = isPyramid
    ? [...pairs].sort((a, b) => a.value - b.value)
    : [...pairs].sort((a, b) => b.value - a.value);

  return {
    grid: undefined,
    xAxis: undefined,
    yAxis: undefined,
    legend: { show: true, type: 'scroll', bottom: 0 },
    series: [
      {
        type: 'funnel',
        name: config.title ?? '',
        sort: isPyramid ? 'ascending' : 'descending',
        left: '10%',
        width: '80%',
        label: { show: true, position: 'inside' },
        emphasis: { label: { fontSize: 20 } },
        data: sorted,
      },
    ],
  };
}

export const funnelConfigurator: EChartTypeConfigurator = {
  supports: (type) => FUNNEL_TYPES.includes(type),

  buildChartData: (data, config) =>
    buildSingleSerieChart(data, { ...config, continue: false }),

  buildOption: (chart, type, config) => buildFunnelOption(chart as any, type, config),

  tooltipTrigger: 'item',
};
