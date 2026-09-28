import {
  detectPreviousChartType,
  needsDataConversion,
  replaceCodesWithNames,
  transformChartData,
  transformDataForSimpleChart,
  validateChartData,
} from '../utils';
import { buildChart, ChartProvider, ChartType } from '@oneteme/jquery-core';

export interface PreparedHighchartsData {
  series: any[];
  xAxis?: any;
  yAxis?: any;
  tooltip?: any;
}

export interface HighchartsDataPipelineContext {
  data: any[];
  config: ChartProvider<any, any>;
  type: ChartType;
  mapCodeToName: Map<string, string>;
  debug: boolean;
}

export interface HighchartsDataPipelineResult {
  data: PreparedHighchartsData;
  validationError: { title: string; message: string } | null;
}

export function resolveHighchartsPointValue(value: any): any {
  if (typeof value !== 'object' || value === null) return value;
  if ('y' in value) return value.y;
  if ('value' in value) return value.value;
  return value;
}

export function prepareHighchartsData(
  context: HighchartsDataPipelineContext,
): HighchartsDataPipelineResult {
  if (isSimpleChart(context.type)) {
    const data = prepareSimpleChartData(context);
    const validation = validateChartData(data.series, context.type);
    return {
      data,
      validationError: validation.isValid || validation.isNoData
        ? null
        : {
            title: validation.errorTitle || 'Erreur',
            message: validation.errorMessage || 'Données incompatibles',
          },
    };
  }

  return prepareComplexChartData(context);
}

function prepareSimpleChartData(context: HighchartsDataPipelineContext): PreparedHighchartsData {
  const tempSeries = [{ data: context.data }];
  let dataToUse = context.data;

  if (needsDataConversion(tempSeries, context.type)) {
    const previousType = detectPreviousChartType(tempSeries, context.type);
    const result = transformChartData(tempSeries, previousType, context.type);
    if (result.series?.[0]?.data) {
      if (result.categories && context.mapCodeToName.size > 0) {
        const categories = replaceCodesWithNames(result.categories, context.mapCodeToName);
        dataToUse = result.series[0].data.map((value: any, index: number) => ({
          name: categories[index] || `Item ${index + 1}`,
          y: resolveHighchartsPointValue(value),
        }));
        context.debug && console.log('[Simple Chart - Map Transform] Données avec noms:', dataToUse.slice(0, 3));
      } else {
        dataToUse = result.series[0].data;
      }
    }
  }

  const chartConfig = { ...context.config, continue: false };
  const firstPoint = dataToUse[0];
  const isNamedValuePoint = typeof firstPoint === 'object'
    && firstPoint !== null
    && 'name' in firstPoint
    && ('y' in firstPoint || 'value' in firstPoint);
  if (dataToUse !== context.data && isNamedValuePoint) {
    return {
      series: [{ name: context.config.title || 'Données', data: dataToUse }],
    };
  }

  const complexChart = buildChart(dataToUse, chartConfig, null);
  if (complexChart.series?.length > 1) {
    const aggregatedData = transformDataForSimpleChart(
      { series: complexChart.series, xAxis: { categories: complexChart.categories } },
      context.config,
    );
    context.debug && console.log('[Simple Chart - Multi] Données agrégées:', aggregatedData);
    return {
      series: [{ name: context.config.title || 'Total', data: aggregatedData }],
    };
  }

  const categories = complexChart.categories || [];
  const serieData = complexChart.series[0]?.data || [];
  const formattedData = serieData.map((value: any, index: number) => {
    if (typeof value === 'object' && value !== null) {
      return {
        name: categories[value.x] || categories[index] || `Item ${index + 1}`,
        y: value.y !== undefined ? value.y : value,
      };
    }
    return { name: categories[index] || `Item ${index + 1}`, y: value };
  });

  context.debug && console.log('[Simple Chart - Single] Données:', {
    categories,
    serieData,
    formattedData,
  });

  return {
    series: [{ name: complexChart.title || 'Données', data: formattedData }],
  };
}

function prepareComplexChartData(
  context: HighchartsDataPipelineContext,
): HighchartsDataPipelineResult {
  const chartConfig = { ...context.config, continue: false };
  const commonChart = buildChart(context.data, chartConfig, null);
  let categories = commonChart.categories || [];
  let series = commonChart.series || [];
  let yCategories: string[] | undefined;
  const validation = validateChartData(series, context.type);

  if (!validation.isValid) {
    return {
      data: {
        series: [],
        xAxis: { categories: [], title: { text: context.config.xtitle || '' } },
      },
      validationError: validation.isNoData
        ? null
        : {
            title: validation.errorTitle || 'Erreur',
            message: validation.errorMessage || 'Données incompatibles',
          },
    };
  }

  const result = transformChartData(
    series,
    needsDataConversion(series, context.type)
      ? detectPreviousChartType(series, context.type)
      : context.type,
    context.type,
    categories,
  );
  series = result.series;
  yCategories = result.yCategories;
  if (result.categories?.length) categories = result.categories as any;

  series = series.map((serie: any, index: number) => {
    const provider = context.config.series?.[index];
    return {
      ...serie,
      type: serie.type
        ?? (typeof provider?.type === 'string' ? provider.type : undefined)
        ?? (context.type === 'mixed' ? 'line' : undefined),
      showUnitOnAxis: serie.showUnitOnAxis ?? provider?.showUnitOnAxis,
      yAxisIndex: serie.yAxisIndex ?? provider?.yAxisIndex,
      yAxisConfig: serie.yAxisConfig ?? provider?.yAxisConfig,
    };
  });

  return {
    data: {
      series,
      xAxis: { categories, title: { text: context.config.xtitle || '' } },
      yAxis: yCategories
        ? { categories: yCategories, title: { text: context.config.ytitle || '' } }
        : undefined,
    },
    validationError: null,
  };
}

function isSimpleChart(type: ChartType): boolean {
  return ['pie', 'donut', 'funnel', 'pyramid'].includes(type);
}
