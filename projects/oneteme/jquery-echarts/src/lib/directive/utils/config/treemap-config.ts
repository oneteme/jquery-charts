import { buildChart, ChartProvider, ChartType, CommonChart } from '@oneteme/jquery-core';
import { EChartsOption } from '../types';
import { EChartTypeConfigurator } from './chart-config-registry';

export interface HierarchyNode {
  name: string;
  value: number;
  children?: HierarchyNode[];
}

/**
 * Nœuds hiérarchiques partagés par treemap et sunburst.
 * Une série : nœuds feuilles, un par catégorie.
 * Plusieurs séries : un nœud parent par série, avec ses catégories en enfants.
 */
export function buildHierarchyData(chart: CommonChart<string, number>): HierarchyNode[] {
  if (chart.series.length === 1) {
    return chart.series[0].data
      .map((val, i) => ({
        name: String(chart.categories[i] ?? `Item ${i}`),
        value: val ?? 0,
      }))
      .filter((d) => d.value > 0);
  }
  return chart.series.map((s) => ({
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

function buildTreemapOption(
  chart: CommonChart<string, number>,
  type: ChartType,
  config: ChartProvider<any, any>
): EChartsOption {
  const data = buildHierarchyData(chart);

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
