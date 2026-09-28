import { ChartProvider, ChartType } from '@oneteme/jquery-core';
import {
  applyAxisOffsets,
  applyChartConfigurations,
  applyDonutCenterLogic,
  applyRadialBarLogic,
  configureLoadingOptions,
  enforceCriticalOptions,
  FRENCH_HIGHCHARTS_LANG,
  Highcharts,
  unifyPlotOptionsForChart,
} from '../utils';

export interface PreparedHighchartsData {
  series: any[];
  xAxis?: any;
  yAxis?: any;
  tooltip?: any;
}

export interface HighchartsOptionsPipelineContext {
  chartType: ChartType;
  highchartsType: string;
  config: ChartProvider<any, any>;
  theme: Highcharts.Options | null;
  renderedOption?: Highcharts.Options | null;
  loadingLabel: string;
  noDataLabel: string;
  debug: boolean;
  preparedData?: PreparedHighchartsData;
  loadedMapData?: any;
  dataValidationError?: { message: string } | null;
  applySeriesAxes: (options: Highcharts.Options, series: any[]) => void;
  applyRuntimeEvents: (options: Highcharts.Options) => void;
}

export function buildHighchartsOptions(
  context: HighchartsOptionsPipelineContext,
): Highcharts.Options {
  if (context.renderedOption) {
    const options = Highcharts.merge(
      {
        chart: { backgroundColor: 'transparent' },
        credits: { enabled: false },
        exporting: { enabled: false },
        lang: FRENCH_HIGHCHARTS_LANG,
      },
      context.theme ?? {},
      context.renderedOption,
    ) as Highcharts.Options;
    configureLoadingOptions(options, context.loadingLabel, context.noDataLabel);
    context.applyRuntimeEvents(options);
    return options;
  }

  const preparedData = context.preparedData ?? { series: [] };
  const baseOptions: Highcharts.Options = {
    chart: {
      type: context.highchartsType,
      backgroundColor: 'transparent',
    },
    title: { text: context.config.title || '' },
    subtitle: { text: context.config.subtitle || '' },
    credits: { enabled: false },
    exporting: { enabled: false },
    lang: FRENCH_HIGHCHARTS_LANG,
    yAxis: { title: { text: null } },
    series: preparedData.series,
  };

  if (preparedData.xAxis) baseOptions.xAxis = preparedData.xAxis;
  if (preparedData.yAxis) {
    baseOptions.yAxis = Highcharts.merge({}, baseOptions.yAxis, preparedData.yAxis) as Highcharts.YAxisOptions;
  }
  if (preparedData.tooltip) baseOptions.tooltip = preparedData.tooltip;
  context.applySeriesAxes(baseOptions, preparedData.series);

  if (context.dataValidationError) {
    baseOptions.lang = { noData: context.dataValidationError.message };
    baseOptions.noData = {
      style: {
        fontWeight: 'normal',
        fontSize: '14px',
        color: '#666',
      },
    };
  }

  applyChartConfigurations(baseOptions, context.chartType, context.config);

  let finalOptions: Highcharts.Options = context.theme
    ? Highcharts.merge({}, baseOptions, context.theme) as Highcharts.Options
    : baseOptions;

  if (context.config.options) {
    const { series: userSeries, ...optionsWithoutSeries } = context.config.options;
    finalOptions = Highcharts.merge(finalOptions, optionsWithoutSeries) as Highcharts.Options;
    if (Array.isArray(userSeries) && Array.isArray(baseOptions.series)) {
      finalOptions.series = baseOptions.series.map((series, index) =>
        userSeries[index]
          ? Highcharts.merge({}, userSeries[index], series)
          : series,
      ) as Highcharts.SeriesOptionsType[];
    } else {
      finalOptions.series = baseOptions.series;
    }
  }

  applySpecialOptions(finalOptions, context);

  unifyPlotOptionsForChart(finalOptions, context.chartType, context.debug);
  enforceCriticalOptions(finalOptions, context.chartType);
  applyAxisOffsets(finalOptions);
  configureLoadingOptions(finalOptions, context.loadingLabel, context.noDataLabel);
  context.applyRuntimeEvents(finalOptions);

  return finalOptions;
}

function applySpecialOptions(
  options: Highcharts.Options,
  context: HighchartsOptionsPipelineContext,
): void {
  if (
    (context.chartType === 'donut' || context.chartType === 'pie') &&
    context.config.options?.donutCenter
  ) {
    applyDonutCenterLogic(options, context.config.options.donutCenter);
  }

  if (context.chartType === 'radialBar' && context.config.options?.radialBar) {
    applyRadialBarLogic(options, context.config.options.radialBar);
  }

  const hasCustomMap = !!(context.config.options as any)?.chart?.map;
  if (context.chartType === 'map' && context.loadedMapData && !hasCustomMap) {
    options.chart ??= {};
    (options.chart as any).map = context.loadedMapData;
    if (context.debug) console.log('GeoJSON injecté dans les options du chart');
  }
}
