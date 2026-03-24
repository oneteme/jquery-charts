import { buildChart, ChartProvider, ChartType, CommonChart } from '@oneteme/jquery-core';
import { EChartsOption } from '../types';
import { EChartTypeConfigurator } from './chart-config-registry';

function buildTreemapOption(
  chart: CommonChart<string, number>,
  type: ChartType,
  config: ChartProvider<any, any>
): EChartsOption {
  // Construit les nœuds feuilles depuis la première série
  // Si plusieurs séries, chaque série devient un nœud parent
  let data: any[];

  if (chart.series.length === 1) {
    data = chart.series[0].data
      .map((val, i) => ({
        name: String(chart.categories[i] ?? `Item ${i}`),
        value: val ?? 0,
      }))
      .filter((d) => d.value > 0);
  } else {
    data = chart.series.map((s) => ({
      name: s.name ?? 'Groupe',
      value: s.data.reduce<number>((sum, v) => sum + (v ?? 0), 0),
      children: s.data
        .map((val, i) => ({
          name: String(chart.categories[i] ?? `Item ${i}`),
          value: val ?? 0,
        }))
        .filter((d) => d.value > 0),
    }));
  }

  return {
    grid: undefined,
    xAxis: undefined,
    yAxis: undefined,
    series: [
      {
        type: 'treemap',
        name: config.title ?? 'Treemap',
        data,
        leafDepth: chart.series.length > 1 ? 2 : 1,
        label: { show: true, formatter: '{b}\n{c}' },
        upperLabel: { show: true, height: 30 },
        itemStyle: { borderColor: '#fff', borderWidth: 2, gapWidth: 2 },
      },
    ],
  };
}

export const treemapConfigurator: EChartTypeConfigurator = {
  supports: (type) => type === 'treemap',

  buildChartData: (data, config) =>
    buildChart(data, { ...config, continue: false }),

  buildOption: (chart, type, config) => buildTreemapOption(chart as any, type, config),

  tooltipTrigger: 'item',
};
