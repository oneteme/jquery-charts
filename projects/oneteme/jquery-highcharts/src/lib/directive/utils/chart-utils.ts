import { ChartProvider, CommonChart, Coordinate2D, XaxisType, YaxisType } from '@oneteme/jquery-core';

export function determineXAxisDataType(value: any): string {
  if (value instanceof Date) {
    return 'datetime';
  } else if (typeof value === 'number') {
    return 'numeric';
  } else {
    return 'category';
  }
}

export function getType<
  X extends XaxisType,
  Y extends YaxisType | Coordinate2D
>(commonChart: CommonChart<X, Y>): string {
  if (commonChart.series.length && commonChart.series[0].data.length) {
    if (commonChart.continue) {
      const x = (<CommonChart<X, Coordinate2D>>commonChart).series[0].data[0].x;
      return determineXAxisDataType(x);
    } else {
      const categ = commonChart.categories[0];
      return determineXAxisDataType(categ);
    }
  }
  return 'datetime';
}

export function sanitizeChartDimensions(
  chartOptions: Highcharts.Options,
  config: ChartProvider<any, any>
) {
  if (!chartOptions.chart) chartOptions.chart = {};
  if (typeof config.width === 'number' && !isNaN(config.width)) {
    chartOptions.chart.width = config.width;
  } else if (
    chartOptions.chart.width &&
    typeof chartOptions.chart.width !== 'number'
  ) {
    delete chartOptions.chart.width;
  }
  if (typeof config.height === 'number' && !isNaN(config.height)) {
    chartOptions.chart.height = config.height;
  } else if (
    chartOptions.chart.height &&
    typeof chartOptions.chart.height !== 'number'
  ) {
    delete chartOptions.chart.height;
  }
}

export function validateSpecialChartData(data: any[], chartType: string): boolean {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return false;
  }

  switch (chartType) {
    case 'treemap':
      return data.every(item =>
        item &&
        typeof item === 'object' &&
        typeof item.value === 'number' &&
        !isNaN(item.value) &&
        item.value > 0 &&
        (item.name || item.category || item.month)
      );

    case 'heatmap':
      return data.every(item =>
        item &&
        typeof item === 'object' &&
        typeof item.value === 'number' &&
        !isNaN(item.value) &&
        (item.month || item.category || item.name) &&
        (item.team || item.series)
      );

    default:
      return true;
  }
}
