import { ChartProvider, ChartType } from '@oneteme/jquery-core';
import { EChartsOption } from '../types';
import { EChartTypeConfigurator } from './chart-config-registry';
import { buildSankeyModel, SankeyModel } from './sankey-config';

const GRAPH_TYPES: ChartType[] = ['graph'];

const MIN_NODE_SIZE = 16;
const MAX_NODE_SIZE = 48;
const MIN_LINK_WIDTH = 1;
const MAX_LINK_WIDTH = 10;

/** Taille proportionnelle au flux total (entrant + sortant) de chaque nœud. */
function scaleNodes(model: SankeyModel): { name: string; symbolSize: number }[] {
  const flows = new Map<string, number>();
  model.links.forEach((l) => {
    flows.set(l.source, (flows.get(l.source) ?? 0) + l.value);
    flows.set(l.target, (flows.get(l.target) ?? 0) + l.value);
  });
  const maxFlow = [...flows.values()].reduce((acc, v) => Math.max(acc, v), 0);
  return model.nodes.map((n) => {
    const ratio = maxFlow > 0 ? (flows.get(n.name) ?? 0) / maxFlow : 0;
    return { name: n.name, symbolSize: MIN_NODE_SIZE + (MAX_NODE_SIZE - MIN_NODE_SIZE) * ratio };
  });
}

function buildGraphOption(model: SankeyModel): EChartsOption {
  const maxValue = model.links.reduce((acc, l) => Math.max(acc, l.value), 0);
  const links = model.links.map((l) => ({
    source: l.source,
    target: l.target,
    value: l.value,
    lineStyle: {
      width: maxValue > 0
        ? MIN_LINK_WIDTH + (MAX_LINK_WIDTH - MIN_LINK_WIDTH) * (l.value / maxValue)
        : MIN_LINK_WIDTH,
    },
  }));

  return {
    grid: undefined,
    xAxis: undefined,
    yAxis: undefined,
    legend: { show: false },
    series: [
      {
        type: 'graph',
        layout: 'force',
        roam: true,
        draggable: true,
        data: scaleNodes(model),
        links,
        force: { repulsion: 220, edgeLength: [60, 160], gravity: 0.1 },
        label: { show: true, position: 'right', fontSize: 12 },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 8],
        edgeLabel: { show: true, formatter: '{c}', fontSize: 11 },
        emphasis: { focus: 'adjacency' },
      },
    ],
  };
}

/**
 * Graphe de flux : même mapping que `sankey` (source = X, cible = `name` évalué par ligne,
 * valeur = Y), mais en disposition force. Les liens identiques sont additionnés et les boucles ignorées.
 */
export const graphConfigurator: EChartTypeConfigurator<SankeyModel> = {
  supports: (type) => GRAPH_TYPES.includes(type),

  buildChartData: (data, config: ChartProvider<any, any>) => buildSankeyModel(data, config),

  buildOption: (model) => buildGraphOption(model),

  tooltipTrigger: 'item',
};
