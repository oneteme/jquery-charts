import { buildChart, ChartProvider, ChartType, CommonChart } from '@oneteme/jquery-core';
import { EChartsOption } from '../types';
import { barConfigurator } from './bar-config';
import { lineConfigurator } from './line-config';
import { pieConfigurator } from './pie-config';
import { scatterConfigurator } from './scatter-config';
import { heatmapConfigurator } from './heatmap-config';
import { treemapConfigurator } from './treemap-config';
import { funnelConfigurator } from './funnel-config';
import { radarConfigurator } from './radar-config';
import { rangeConfigurator } from './range-config';

/**
 * Contrat d'un configurateur de type de graphique ECharts.
 *
 * Chaque famille de types (bar, line, pie, etc.) implémente cette interface.
 * Le registry dispatche vers le bon configurateur en fonction du `ChartType`.
 */
export interface EChartTypeConfigurator {
  /** Indique si ce configurateur gère le type donné */
  supports: (type: ChartType) => boolean;

  /**
   * Construit le CommonChart depuis les données brutes.
   * Doit appeler buildChart() ou buildSingleSerieChart() depuis @oneteme/jquery-core.
   */
  buildChartData: (
    data: any[],
    config: ChartProvider<any, any>,
    type: ChartType
  ) => CommonChart<any, any>;

  /**
   * Transforme le CommonChart en option ECharts spécifique au type.
   * La base (title, tooltip, legend, toolbox) est appliquée séparément par la directive.
   */
  buildOption: (
    chart: CommonChart<any, any>,
    type: ChartType,
    config: ChartProvider<any, any>
  ) => EChartsOption;

  /** Trigger du tooltip : 'axis' pour les séries cartésiennes, 'item' pour pie/scatter */
  tooltipTrigger: 'axis' | 'item';
}

/** Liste des configurateurs enregistrés — ordre : du plus spécifique au plus général */
const CONFIGURATORS: EChartTypeConfigurator[] = [
  heatmapConfigurator,   // avant bar (heatmap != bar malgré ressemblance)
  treemapConfigurator,
  funnelConfigurator,
  radarConfigurator,
  scatterConfigurator,
  rangeConfigurator,
  pieConfigurator,
  lineConfigurator,
  barConfigurator,       // fallback large (bar / column / columnpyramid)
];

/**
 * Résout le configurateur pour un ChartType donné.
 * Lance une erreur si aucun configurateur ne supporte le type.
 */
export function resolveConfigurator(type: ChartType): EChartTypeConfigurator {
  const configurator = CONFIGURATORS.find((c) => c.supports(type));
  if (!configurator) {
    throw new Error(`[jquery-echarts] Type de graphique non supporté : "${type}"`);
  }
  return configurator;
}
