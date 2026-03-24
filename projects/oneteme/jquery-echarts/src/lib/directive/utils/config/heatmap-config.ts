import { buildChart, ChartProvider, ChartType, CommonChart, XaxisType } from '@oneteme/jquery-core';
import { EChartsOption } from '../types';
import { EChartTypeConfigurator } from './chart-config-registry';

function buildHeatmapOption(
  chart: CommonChart<XaxisType, number>,
  type: ChartType,
  config: ChartProvider<any, any>
): EChartsOption {
  const xCategories = chart.categories.map(String);
  const yCategories = chart.series.map((s) => s.name ?? '');

  // Convertit les séries en tableau [xIndex, yIndex, value]
  const data: [number, number, number][] = [];
  chart.series.forEach((s, yi) => {
    s.data.forEach((val, xi) => {
      data.push([xi, yi, val ?? 0]);
    });
  });

  const maxVal = data.length ? Math.max(...data.map((d) => d[2])) : 1;
  const minVal = data.length ? Math.min(...data.map((d) => d[2])) : 0;

  return {
    grid: { left: '3%', right: '10%', bottom: '20%', containLabel: true },
    xAxis: {
      type: 'category',
      data: xCategories,
      splitArea: { show: true },
      name: config.xtitle,
      nameLocation: 'center',
      nameGap: 30,
    },
    yAxis: {
      type: 'category',
      data: yCategories,
      splitArea: { show: true },
      name: config.ytitle,
      nameLocation: 'center',
      nameGap: 50,
    },
    visualMap: {
      min: minVal,
      max: maxVal,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '2%',
    },
    series: [
      {
        type: 'heatmap',
        data,
        label: { show: true },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } },
      },
    ],
  };
}

export const heatmapConfigurator: EChartTypeConfigurator = {
  supports: (type) => type === 'heatmap',

  buildChartData: (data, config) =>
    buildChart(data, { ...config, continue: false }),

  buildOption: (chart, type, config) => buildHeatmapOption(chart as any, type, config),

  tooltipTrigger: 'item',
};
