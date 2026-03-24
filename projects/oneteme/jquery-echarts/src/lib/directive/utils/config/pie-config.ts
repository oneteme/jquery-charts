import { buildSingleSerieChart, ChartProvider, ChartType, CommonChart } from '@oneteme/jquery-core';
import { EChartsOption } from '../types';
import { EChartTypeConfigurator } from './chart-config-registry';

const PIE_TYPES: ChartType[] = ['pie', 'donut'];

function buildPieOption(
  chart: CommonChart<string, number>,
  type: ChartType,
  config: ChartProvider<any, any>
): EChartsOption {
  const isDonut = type === 'donut';

  // Aplatit toutes les séries en une liste {name, value}
  const data = chart.series.flatMap((s) =>
    s.data
      .map((val, i) => ({ name: String(chart.categories[i] ?? ''), value: val }))
      .filter((d) => d.value != null)
  );

  return {
    // Pas de grid pour les pie charts
    grid: undefined,
    xAxis: undefined,
    yAxis: undefined,
    legend: {
      show: true,
      type: 'scroll',
      orient: 'vertical',
      left: 'left',
    },
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        name: chart.series[0]?.name ?? '',
        radius: isDonut ? ['40%', '70%'] : '70%',
        center: ['50%', '50%'],
        data,
        label: { show: true, formatter: '{b}: {d}%' },
        emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' } },
      },
    ],
  };
}

export const pieConfigurator: EChartTypeConfigurator = {
  supports: (type) => PIE_TYPES.includes(type),

  buildChartData: (data, config) =>
    buildSingleSerieChart(data, { ...config, continue: false }),

  buildOption: (chart, type, config) => buildPieOption(chart as any, type, config),

  tooltipTrigger: 'item',
};
