import { Highcharts } from '../highcharts-modules';
import { ChartType } from '@oneteme/jquery-core';

// Import des configurations
import * as PolarConfig from './polar-config';
import * as RangeConfig from './range-config';
import * as ScatterConfig from './scatter-config';
import * as BubbleConfig from './bubble-config';
import * as HeatmapConfig from './heatmap-config';
import * as TreemapConfig from './treemap-config';

/** Interface pour un configurateur de type de graphique */
export interface ChartTypeConfigurator {
  /** Vérifie si ce configurateur gère le type de graphique */
  isChartType: (type: ChartType) => boolean;

  /** Configure les options de base avant le merge */
  configure?: (options: Highcharts.Options, type: ChartType) => void;

  /** Force les options critiques après le merge utilisateur */
  enforceCritical?: (options: Highcharts.Options, type: ChartType) => void;

  /** Transforme les données (avec direction: true=vers format spécial, false=vers format simple) */
  transformData?: (
    series: any[],
    targetIsSpecialFormat: boolean,
    categories?: any[]
  ) => any[] | { series: any[]; yCategories?: string[] };
}

/** Registry de tous les configurateurs de types de graphiques */
const CHART_CONFIGURATORS: ChartTypeConfigurator[] = [
  {
    isChartType: PolarConfig.isPolarChart,
    configure: PolarConfig.configurePolarChart,
    enforceCritical: PolarConfig.enforceCriticalPolarOptions,
  },
  {
    isChartType: RangeConfig.isRangeChart,
    configure: RangeConfig.configureRangeChart,
    enforceCritical: RangeConfig.enforceCriticalRangeOptions,
    transformData: RangeConfig.transformDataForRangeChart,
  },
  {
    isChartType: ScatterConfig.isScatterChart,
    configure: ScatterConfig.configureScatterChart,
    enforceCritical: ScatterConfig.enforceCriticalScatterOptions,
  },
  {
    isChartType: BubbleConfig.isBubbleChart,
    configure: BubbleConfig.configureBubbleChart,
    enforceCritical: BubbleConfig.enforceCriticalBubbleOptions,
    transformData: BubbleConfig.transformDataForBubble,
  },
  {
    isChartType: HeatmapConfig.isHeatmapChart,
    configure: HeatmapConfig.configureHeatmapChart,
    enforceCritical: HeatmapConfig.enforceCriticalHeatmapOptions,
    transformData: HeatmapConfig.transformDataForHeatmap,
  },
  {
    isChartType: TreemapConfig.isTreemapChart,
    configure: TreemapConfig.configureTreemapChart,
    enforceCritical: TreemapConfig.enforceCriticalTreemapOptions,
    transformData: TreemapConfig.transformDataForTreemap,
  },
];

/** Applique toutes les configurations de base pour le type de graphique */
export function applyChartConfigurations(
  options: Highcharts.Options,
  chartType: ChartType
): void {
  CHART_CONFIGURATORS.forEach((configurator) => {
    if (configurator.isChartType(chartType) && configurator.configure) {
      configurator.configure(options, chartType);
    }
  });
}

/** Force toutes les options critiques après le merge utilisateur */
export function enforceCriticalOptions(
  options: Highcharts.Options,
  chartType: ChartType
): void {
  CHART_CONFIGURATORS.forEach((configurator) => {
    if (configurator.isChartType(chartType) && configurator.enforceCritical) {
      configurator.enforceCritical(options, chartType);
    }
  });
}

/** Transforme les données selon le type de graphique */
export function transformChartData(
  series: any[],
  currentType: ChartType,
  targetType: ChartType,
  categories?: any[]
): { series: any[]; yCategories?: string[] } {
  let transformedSeries: any[] = series;
  let yCategories: string[] | undefined;

  // 1. Si on change de type, d'abord revenir au format simple
  if (currentType !== targetType) {
    const currentConfigurator = CHART_CONFIGURATORS.find((c) =>
      c.isChartType(currentType)
    );
    if (currentConfigurator?.transformData) {
      const result = currentConfigurator.transformData(
        transformedSeries,
        false,
        categories
      );
      if (Array.isArray(result)) {
        transformedSeries = result;
      } else {
        transformedSeries = result.series;
        yCategories = result.yCategories;
      }
    }
  }

  // 2. Appliquer la transformation vers le type cible
  const targetConfigurator = CHART_CONFIGURATORS.find((c) =>
    c.isChartType(targetType)
  );
  if (targetConfigurator?.transformData) {
    const result = targetConfigurator.transformData(
      transformedSeries,
      true,
      categories
    );
    if (Array.isArray(result)) {
      transformedSeries = result;
    } else {
      transformedSeries = result.series;
      yCategories = result.yCategories;
    }
  }

  return { series: transformedSeries, yCategories };
}

/** Détecte si les données sont dans un format spécial qui nécessite reconversion */
export function needsDataConversion(
  series: any[],
  targetType: ChartType
): boolean {
  // Détection range
  const hasRange = series.some(
    (s) =>
      s.data &&
      s.data.some(
        (p: any) =>
          (Array.isArray(p) && p.length >= 3) ||
          (p && typeof p === 'object' && ('low' in p || 'high' in p))
      )
  );

  // Détection bubble
  const hasBubble = series.some(
    (s) =>
      s.data &&
      s.data.some(
        (p: any) =>
          (Array.isArray(p) && p.length >= 3) ||
          (p && typeof p === 'object' && 'z' in p)
      )
  );

  // Détection heatmap
  const hasHeatmap = series.some(
    (s) =>
      s.data &&
      s.data.some(
        (p: any) =>
          p && typeof p === 'object' && 'value' in p && 'x' in p && 'y' in p
      )
  );

  // Détection treemap
  const hasTreemap = series.some(
    (s) =>
      s.data &&
      s.data.some(
        (p: any) => p && typeof p === 'object' && ('parent' in p || 'id' in p)
      )
  );

  // Si les données sont dans un format spécial mais le type cible ne correspond pas, conversion nécessaire
  if (hasRange && !RangeConfig.isRangeChart(targetType)) return true;
  if (hasBubble && !BubbleConfig.isBubbleChart(targetType)) return true;
  if (hasHeatmap && !HeatmapConfig.isHeatmapChart(targetType)) return true;
  if (hasTreemap && !TreemapConfig.isTreemapChart(targetType)) return true;

  return false;
}

/** Détecte le type de graphique précédent basé sur le format des données */
export function detectPreviousChartType(
  series: any[],
  currentType: ChartType
): ChartType {
  // Détection range
  const hasRange = series.some(
    (s) =>
      s.data &&
      s.data.some(
        (p: any) =>
          (Array.isArray(p) && p.length >= 3) ||
          (p && typeof p === 'object' && ('low' in p || 'high' in p))
      )
  );
  if (hasRange) return 'columnrange';

  // Détection bubble
  const hasBubble = series.some(
    (s) =>
      s.data &&
      s.data.some(
        (p: any) =>
          (Array.isArray(p) && p.length >= 3) ||
          (p && typeof p === 'object' && 'z' in p)
      )
  );
  if (hasBubble) return 'bubble';

  // Détection heatmap
  const hasHeatmap = series.some(
    (s) =>
      s.data &&
      s.data.some(
        (p: any) =>
          p && typeof p === 'object' && 'value' in p && 'x' in p && 'y' in p
      )
  );
  if (hasHeatmap) return 'heatmap';

  // Détection treemap
  const hasTreemap = series.some(
    (s) =>
      s.data &&
      s.data.some(
        (p: any) => p && typeof p === 'object' && ('parent' in p || 'id' in p)
      )
  );
  if (hasTreemap) return 'treemap';

  // Par défaut, retourner le type actuel (pas de conversion)
  return currentType;
}
