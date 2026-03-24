import { buildChart, ChartProvider, ChartType, CommonChart, XaxisType } from '@oneteme/jquery-core';
import { EChartsOption } from '../types';
import { EChartTypeConfigurator } from './chart-config-registry';

const RADAR_TYPES: ChartType[] = ['radar', 'radarArea'];

function buildRadarOption(
  chart: CommonChart<XaxisType, number>,
  type: ChartType,
  config: ChartProvider<any, any>
): EChartsOption {
  const indicator = chart.categories.map((cat) => ({ name: String(cat) }));
  const hasArea = type === 'radarArea';

  return {
    grid: undefined,
    xAxis: undefined,
    yAxis: undefined,
    radar: {
      indicator,
      shape: 'polygon',
    },
    legend: { show: true, type: 'scroll', bottom: 0 },
    series: [
      {
        type: 'radar',
        data: chart.series.map((s) => ({
          name: s.name,
          value: s.data,
          areaStyle: hasArea ? { opacity: 0.3 } : undefined,
          itemStyle: s.color ? { color: s.color } : undefined,
          lineStyle: s.color ? { color: s.color } : undefined,
        })),
      },
    ],
  };
}

export const radarConfigurator: EChartTypeConfigurator = {
  supports: (type) => RADAR_TYPES.includes(type),

  buildChartData: (data, config) =>
    buildChart(data, { ...config, continue: false }),

  buildOption: (chart, type, config) => buildRadarOption(chart as any, type, config),

  tooltipTrigger: 'item',
};
