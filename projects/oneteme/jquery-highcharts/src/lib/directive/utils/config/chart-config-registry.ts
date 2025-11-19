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
  configure?: (options: Highcharts.Options, type: ChartType) => void;
  enforceCritical?: (options: Highcharts.Options, type: ChartType) => void;
  transformData?: (
    series: any[],
    targetIsSpecialFormat: boolean,
    categories?: any[]
  ) => any[] | { series: any[]; yCategories?: string[] };
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
  chartType: ChartType
): void {
  CHART_CONFIGURATORS.forEach((configurator) => {
    if (configurator.isChartType(chartType) && configurator.configure) {
      configurator.configure(options, chartType);
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
): { series: any[]; yCategories?: string[] } {
  let transformedSeries: any[] = series;
  let yCategories: string[] | undefined;

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

  if (hasRange && !RangeConfig.isRangeChart(targetType)) return true;
  if (hasBubble && !BubbleConfig.isBubbleChart(targetType)) return true;
  if (hasHeatmap && !HeatmapConfig.isHeatmapChart(targetType)) return true;
  if (hasTreemap && !TreemapConfig.isTreemapChart(targetType)) return true;
  if (hasMap && !MapConfig.isMapChart(targetType)) return true;

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
