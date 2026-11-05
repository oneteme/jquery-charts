import { buildChart, ChartProvider, ChartType, CommonChart } from '@oneteme/jquery-core';
import { EChartsOption } from '../types';
import { EChartTypeConfigurator } from './chart-config-registry';
import { buildHierarchyData } from './treemap-config';

const SUNBURST_TYPES: ChartType[] = ['sunburst'];

/**
 * Sunburst : même hiérarchie que le treemap (voir `buildHierarchyData`),
 * affichée en anneaux concentriques. Le centre est le niveau le plus général.
 */
function buildSunburstOption(chart: CommonChart<string, number>, config: ChartProvider<any, any>): EChartsOption {
  return {
    grid: undefined,
    xAxis: undefined,
    yAxis: undefined,
    legend: { show: false },
    series: [
      {
        type: 'sunburst',
        name: config.title ?? 'Sunburst',
        data: buildHierarchyData(chart),
        radius: ['12%', '92%'],
        label: { rotate: 'radial', formatter: '{b}' },
        emphasis: { focus: 'ancestor' },
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
      },
    ],
  };
}

export const sunburstConfigurator: EChartTypeConfigurator = {
  supports: (type) => SUNBURST_TYPES.includes(type),

  buildChartData: (data, config) =>
    buildChart(data, { ...config, continue: false }),

  buildOption: (chart, _type, config) => buildSunburstOption(chart, config),

  tooltipTrigger: 'item',
};
