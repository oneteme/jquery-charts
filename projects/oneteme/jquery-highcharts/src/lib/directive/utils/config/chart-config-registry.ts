import { Highcharts } from '../highcharts-modules';
import { ChartType } from '@oneteme/jquery-core';

import * as PolarConfig from './polar-config';
import * as RangeConfig from './range-config';
import * as ScatterConfig from './scatter-config';
import * as BubbleConfig from './bubble-config';
import * as HeatmapConfig from './heatmap-config';
import * as TreemapConfig from './treemap-config';
import * as SimpleChartConfig from './simple-chart-config';
import * as MapConfig from './map-config';

export interface ChartTypeConfigurator {
  isChartType: (type: ChartType) => boolean;
  configure?: (
    options: Highcharts.Options,
    type: ChartType,
    config?: any
  ) => void;
  enforceCritical?: (options: Highcharts.Options, type: ChartType) => void;
  transformData?: (
    series: any[],
    targetIsSpecialFormat: boolean,
    categories?: any[]
  ) => any[] | { series: any[]; yCategories?: string[]; categories?: string[] };
}

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
  {
    isChartType: MapConfig.isMapChart,
    configure: MapConfig.configureMapChart,
    enforceCritical: MapConfig.enforceCriticalMapOptions,
    transformData: MapConfig.transformDataForMap,
  },
  {
    isChartType: SimpleChartConfig.isSimpleChart,
    configure: SimpleChartConfig.configureSimpleChart,
    enforceCritical: SimpleChartConfig.enforceCriticalSimpleOptions,
    transformData: SimpleChartConfig.transformSimpleChartData,
  },
];

export function applyChartConfigurations(
  options: Highcharts.Options,
  chartType: ChartType,
  config?: any
): void {
  CHART_CONFIGURATORS.forEach((configurator) => {
    if (configurator.isChartType(chartType) && configurator.configure) {
      configurator.configure(options, chartType, config);
    }
  });
}

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

export function transformChartData(
  series: any[],
  currentType: ChartType,
  targetType: ChartType,
  categories?: any[]
): { series: any[]; yCategories?: string[]; categories?: string[] } {
  console.log('🔄 transformChartData appelé:', { currentType, targetType, seriesLength: series?.length, categories });
  let transformedSeries: any[] = series;
  let yCategories: string[] | undefined;
  let extractedCategories: string[] | undefined;

  if (currentType !== targetType) {
    console.log('🔄 Transformation nécessaire de', currentType, 'vers', targetType);
    const currentConfigurator = CHART_CONFIGURATORS.find((c) =>
      c.isChartType(currentType)
    );
    if (currentConfigurator?.transformData) {
      console.log('📤 Appel transformData du configurateur source:', currentType);
      const result = currentConfigurator.transformData(
        transformedSeries,
        false,
        categories
      );
      console.log('📤 Résultat transformation source:', result);
      if (Array.isArray(result)) {
        transformedSeries = result;
      } else {
        transformedSeries = result.series;
        yCategories = result.yCategories;
        extractedCategories = result.categories;
      }
    } else {
      console.log('⚠️ Pas de transformData pour le type source:', currentType);
    }
  }

  const targetConfigurator = CHART_CONFIGURATORS.find((c) =>
    c.isChartType(targetType)
  );
  if (targetConfigurator?.transformData) {
    console.log('📥 Appel transformData du configurateur cible:', targetType);
    const result = targetConfigurator.transformData(
      transformedSeries,
      true,
      extractedCategories || categories
    );
    console.log('📥 Résultat transformation cible:', result);
    if (Array.isArray(result)) {
      transformedSeries = result;
    } else {
      transformedSeries = result.series;
      yCategories = result.yCategories;
      if (!extractedCategories && result.categories) {
        extractedCategories = result.categories;
      }
    }
  } else {
    console.log('⚠️ Pas de transformData pour le type cible:', targetType);
  }

  console.log('✅ Résultat final transformChartData:', { series: transformedSeries, yCategories, categories: extractedCategories });
  return {
    series: transformedSeries,
    yCategories,
    categories: extractedCategories,
  };
}

export function needsDataConversion(
  series: any[],
  targetType: ChartType
): boolean {
  const hasRange = series.some(
    (s) =>
      s.data &&
      s.data.some(
        (p: any) =>
          (Array.isArray(p) && p.length >= 3) ||
          (p && typeof p === 'object' && ('low' in p || 'high' in p))
      )
  );

  const hasBubble = series.some(
    (s) =>
      s.data &&
      s.data.some(
        (p: any) =>
          (Array.isArray(p) && p.length >= 3) ||
          (p && typeof p === 'object' && 'z' in p)
      )
  );

  const hasHeatmap = series.some(
    (s) =>
      s.data &&
      s.data.some(
        (p: any) =>
          p && typeof p === 'object' && 'value' in p && 'x' in p && 'y' in p
      )
  );

  const hasTreemap = series.some(
    (s) =>
      s.data &&
      s.data.some(
        (p: any) => p && typeof p === 'object' && ('parent' in p || 'id' in p)
      )
  );

  const hasMap = series.some(
    (s) =>
      s.data &&
      s.data.some(
        (p: any) =>
          (Array.isArray(p) && p.length >= 2 && typeof p[0] === 'string') ||
          (p && typeof p === 'object' && ('hc-key' in p || 'code' in p))
      )
  );

  console.log('🔍 needsDataConversion check:', { 
    targetType, 
    hasRange, 
    hasBubble, 
    hasHeatmap, 
    hasTreemap, 
    hasMap,
    isMapTarget: MapConfig.isMapChart(targetType),
    sampleData: series[0]?.data?.[0]
  });

  if (hasRange && !RangeConfig.isRangeChart(targetType)) return true;
  if (hasBubble && !BubbleConfig.isBubbleChart(targetType)) return true;
  if (hasHeatmap && !HeatmapConfig.isHeatmapChart(targetType)) return true;
  if (hasTreemap && !TreemapConfig.isTreemapChart(targetType)) return true;
  if (hasMap && !MapConfig.isMapChart(targetType)) {
    console.log('✅ Conversion MAP nécessaire !');
    return true;
  }

  return false;
}

export function detectPreviousChartType(
  series: any[],
  currentType: ChartType
): ChartType {
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

  const hasHeatmap = series.some(
    (s) =>
      s.data &&
      s.data.some(
        (p: any) =>
          p && typeof p === 'object' && 'value' in p && 'x' in p && 'y' in p
      )
  );
  if (hasHeatmap) return 'heatmap';

  const hasTreemap = series.some(
    (s) =>
      s.data &&
      s.data.some(
        (p: any) => p && typeof p === 'object' && ('parent' in p || 'id' in p)
      )
  );
  if (hasTreemap) return 'treemap';

  const hasMap = series.some(
    (s) =>
      s.data &&
      s.data.some(
        (p: any) =>
          (Array.isArray(p) && p.length >= 2 && typeof p[0] === 'string') ||
          (p && typeof p === 'object' && ('hc-key' in p || 'code' in p))
      )
  );
  if (hasMap) return 'map';

  return currentType;
}
