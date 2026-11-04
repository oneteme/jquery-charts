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

  // Convertit les séries en tableau [xIndex, yIndex, value] ; une cellule vide n'est pas dessinée
  const data: [number, number, number][] = [];
  chart.series.forEach((s, yi) => {
    s.data.forEach((val, xi) => {
      if (val == null) return;
      data.push([xi, yi, val]);
    });
  });

  // Utiliser reduce au lieu de Math.max(...array) pour éviter le stack overflow sur grands datasets
  const maxVal = data.reduce((acc, d) => Math.max(acc, d[2]), -Infinity);
  const minVal = data.reduce((acc, d) => Math.min(acc, d[2]), Infinity);
  const safeMax = Number.isFinite(maxVal) ? maxVal : 1;
  const safeMin = Number.isFinite(minVal) ? minVal : 0;

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
      name: Array.isArray(config.ytitle) ? config.ytitle[0] : config.ytitle,
      nameLocation: 'center',
      nameGap: 50,
    },
    visualMap: {
      min: safeMin,
      max: safeMax,
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
