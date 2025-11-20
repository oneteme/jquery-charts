import { ChartProvider } from '@oneteme/jquery-core';
import { Highcharts } from './highcharts-modules';

export function sanitizeChartDimensions(
  chartOptions: Highcharts.Options,
  config: ChartProvider<any, any>,
  element: HTMLElement,
  debug: boolean = false
): void {
  if (!chartOptions.chart) chartOptions.chart = {};

  if (typeof config.width === 'number' && !isNaN(config.width)) {
    chartOptions.chart.width = config.width;
  } else if (!chartOptions.chart.width) {
    const containerWidth = element.offsetWidth || element.clientWidth;
    if (containerWidth > 0) {
      chartOptions.chart.width = containerWidth;
      debug && console.log('Largeur forcée depuis conteneur:', containerWidth);
    }
  }

  if (typeof config.height === 'number' && !isNaN(config.height)) {
    chartOptions.chart.height = config.height;
  } else if (!chartOptions.chart.height || chartOptions.chart.height === '100%') {
    const containerHeight = element.offsetHeight || element.clientHeight;
    if (containerHeight > 0) {
      chartOptions.chart.height = containerHeight;
      debug && console.log('Hauteur forcée depuis conteneur:', containerHeight);
    }
  }
}
