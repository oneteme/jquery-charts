import { buildChart, ChartProvider, ChartType, CommonChart, Coordinate2D, XaxisType } from '@oneteme/jquery-core';
import { EChartsOption } from '../types';
import { EChartTypeConfigurator } from './chart-config-registry';

const SCATTER_TYPES: ChartType[] = ['scatter', 'bubble'];

function buildScatterOption(
  chart: CommonChart<XaxisType, Coordinate2D>,
  type: ChartType,
  config: ChartProvider<any, any>
): EChartsOption {
  const isBubble = type === 'bubble';

  return {
    xAxis: { type: 'value', name: config.xtitle, nameLocation: 'center', nameGap: 30 },
    yAxis: { type: 'value', name: config.ytitle, nameLocation: 'center', nameGap: 40 },
    series: chart.series.map((s) => ({
      type: 'scatter',
      name: s.name,
      data: s.data.map((d: any) =>
        isBubble ? [d.x, d.y, d.z ?? 1] : [d.x, d.y]
      ),
      // Pour les bulles : taille proportionnelle à z
      symbolSize: isBubble
        ? (val: number[]) => Math.max(5, Math.sqrt(Math.abs(val[2] ?? 1)) * 5)
        : 10,
      itemStyle: s.color ? { color: s.color } : undefined,
    })),
  };
}

export const scatterConfigurator: EChartTypeConfigurator = {
  supports: (type) => SCATTER_TYPES.includes(type),

  buildChartData: (data, config) =>
    buildChart(data, { ...config, continue: true }),

  buildOption: (chart, type, config) => buildScatterOption(chart as any, type, config),

  tooltipTrigger: 'item',
};
