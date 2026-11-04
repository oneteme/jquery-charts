import { ChartProvider, ChartType } from '@oneteme/jquery-core';
import { EChartsOption } from '../types';
import { EChartTypeConfigurator } from './chart-config-registry';
import { readRawPoints, toNumber } from './raw-series';

const SANKEY_TYPES: ChartType[] = ['sankey'];

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyModel {
  nodes: { name: string }[];
  links: SankeyLink[];
}

/**
 * Mapping des données :
 *  - source = X de la série
 *  - valeur = Y de la série
 *  - cible  = `name` de la série, évalué par ligne (une constante donne une cible unique)
 * Les liens identiques (même source et cible) sont additionnés. Les lignes sans cible,
 * sans source, avec une valeur absente/négative ou dont la source est égale à la cible sont ignorées.
 */
export function buildSankeyModel(data: any[], config: ChartProvider<any, any>): SankeyModel {
  const links = new Map<string, SankeyLink>();
  const nodeNames = new Set<string>();

  readRawPoints(data, config).forEach((p) => {
    const value = toNumber(p.y);
    if (value === undefined || value < 0 || p.x === undefined || p.x === null || !p.name) return;
    const source = String(p.x);
    const target = p.name;
    if (source === target) return;
    const key = JSON.stringify([source, target]);
    const existing = links.get(key);
    if (existing) {
      existing.value += value;
    } else {
      links.set(key, { source, target, value });
    }
    nodeNames.add(source);
    nodeNames.add(target);
  });

  return {
    nodes: [...nodeNames].map((name) => ({ name })),
    links: [...links.values()],
  };
}

function buildSankeyOption(chart: SankeyModel): EChartsOption {
  return {
    grid: undefined,
    xAxis: undefined,
    yAxis: undefined,
    legend: { show: false },
    series: [
      {
        type: 'sankey',
        data: chart.nodes,
        links: chart.links,
        emphasis: { focus: 'adjacency' },
        nodeAlign: 'justify',
        lineStyle: { color: 'gradient', curveness: 0.5 },
        label: { fontSize: 12 },
      },
    ],
  };
}

export const sankeyConfigurator: EChartTypeConfigurator<SankeyModel> = {
  supports: (type) => SANKEY_TYPES.includes(type),

  buildChartData: (data, config) => buildSankeyModel(data, config),

  buildOption: (chart) => buildSankeyOption(chart),

  tooltipTrigger: 'item',
};
