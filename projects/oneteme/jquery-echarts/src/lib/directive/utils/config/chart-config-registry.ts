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
import { mixedConfigurator } from './mixed-config';
import { gaugeConfigurator } from './gauge-config';
import { sankeyConfigurator } from './sankey-config';
import { boxplotConfigurator } from './boxplot-config';
import { radialBarConfigurator } from './radial-bar-config';
import { sunburstConfigurator } from './sunburst-config';
import { graphConfigurator } from './graph-config';
import { calendarConfigurator } from './calendar-config';
import { waterfallConfigurator } from './waterfall-config';

/**
 * Contrat d'un configurateur de type de graphique ECharts.
 *
 * Chaque famille de types (bar, line, pie, etc.) implémente cette interface.
 * Le registry dispatche vers le bon configurateur en fonction du `ChartType`.
 *
 * `TModel` est le modèle intermédiaire produit par `buildChartData`.
 * Par défaut c'est un `CommonChart` ; les types qui agrègent les données brutes
 * (gauge, sankey, boxplot) fournissent leur propre modèle.
 */
export interface EChartTypeConfigurator<TModel = CommonChart<any, any>> {
  /** Indique si ce configurateur gère le type donné */
  supports: (type: ChartType) => boolean;

  /**
   * Construit le modèle intermédiaire depuis les données brutes.
   * Pour les types cartésiens classiques, appelle buildChart() ou buildSingleSerieChart() depuis @oneteme/jquery-core.
   */
  buildChartData: (
    data: any[],
    config: ChartProvider<any, any>,
    type: ChartType
  ) => TModel;

  /**
   * Transforme le modèle en option ECharts spécifique au type.
   * La base (title, tooltip, legend, toolbox) est appliquée séparément par la directive.
   */
  buildOption: (
    chart: TModel,
    type: ChartType,
    config: ChartProvider<any, any>
  ) => EChartsOption;

  /** Trigger du tooltip : 'axis' pour les séries cartésiennes, 'item' pour pie/scatter */
  tooltipTrigger: 'axis' | 'item';
}

/** Liste des configurateurs enregistrés — ordre : du plus spécifique au plus général */
const CONFIGURATORS: EChartTypeConfigurator<any>[] = [
  mixedConfigurator,     // mixed types (bar+line, etc.)
  heatmapConfigurator,   // avant bar (heatmap != bar malgré ressemblance)
  treemapConfigurator,
  funnelConfigurator,
  radarConfigurator,
  radialBarConfigurator,
  gaugeConfigurator,
  sankeyConfigurator,
  graphConfigurator,
  sunburstConfigurator,
  calendarConfigurator,
  waterfallConfigurator,
  boxplotConfigurator,
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
export function resolveConfigurator(type: ChartType): EChartTypeConfigurator<any> {
  const configurator = CONFIGURATORS.find((c) => c.supports(type));
  if (!configurator) {
    throw new Error(`[jquery-echarts] Type de graphique non supporté : "${type}"`);
  }
  return configurator;
}
