import { ChartProvider, XaxisType, YaxisType } from '@oneteme/jquery-core';

export function aggregateMultiSeriesData(
  series: any[],
  categories: string[] | undefined
): any[] {
  if (!series || series.length === 0) {
    return [];
  }

  if (series.length === 1) {
    return series[0]?.data || [];
  }

  const aggregatedData = series.map((serie) => {
    if (!serie.data || serie.data.length === 0) {
      return {
        name: serie.name || 'Série',
        y: 0,
      };
    }

    const sum = serie.data.reduce((total: number, dataPoint: any) => {
      const value =
        typeof dataPoint === 'object'
          ? dataPoint.y !== undefined
            ? dataPoint.y
            : dataPoint
          : dataPoint;
      return total + (value || 0);
    }, 0);

    return {
      name: serie.name || 'Série',
      y: sum,
    };
  });

  return aggregatedData;
}

export function shouldAggregateData(
  series: any[],
  categories: string[] | undefined
): boolean {
  return !!(series && series.length > 1);
}

export function transformDataForSimpleChart<
  X extends XaxisType,
  Y extends YaxisType
>(
  chartData: { series: any[]; xAxis?: any },
  config: ChartProvider<X, Y>
): any[] {
  const { series, xAxis } = chartData;
  const categories = xAxis?.categories;

  if (shouldAggregateData(series, categories)) {
    return aggregateMultiSeriesData(series, categories);
  }

  return series[0]?.data || [];
}
