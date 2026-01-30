import { ChartProvider } from '@oneteme/jquery-core';
import { Highcharts } from './highcharts-modules';

export function sanitizeChartDimensions(
  chartOptions: Highcharts.Options,
  config: ChartProvider<any, any>
): void {
  if (!chartOptions.chart) chartOptions.chart = {};

  if (typeof config.width === 'number' && !isNaN(config.width)) { chartOptions.chart.width = config.width }

  if (typeof config.height === 'number' && !isNaN(config.height)) { chartOptions.chart.height = config.height }
}
