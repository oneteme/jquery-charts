import { ChartProvider, XaxisType, YaxisType, buildChart } from '@oneteme/jquery-core';
import { ChartHandler } from './base-handler.interface';
import { getType } from '../../chart-utils';

export class StandardHandler<X extends XaxisType = XaxisType>
  implements ChartHandler<X>
{
  handle(
    data: any[],
    chartConfig: ChartProvider<X, YaxisType>,
    debug = false
  ): any {
    const chartConfigCopy = { ...chartConfig, continue: false };
    const commonChart = buildChart(data, chartConfigCopy, null);

    debug &&
      console.log('Données traitées pour graphique standard:', commonChart);

    const xAxisType = getType(commonChart);
    debug && console.log("Type d'axe X détecté:", xAxisType);

    if (commonChart?.categories && commonChart?.series) {
      const validSeries = Array.isArray(commonChart.series)
        ? commonChart.series.map((serie: any) => ({
            ...serie,
            visible: serie.visible !== undefined ? serie.visible : true,
          }))
        : [];
      const validCategories = Array.isArray(commonChart.categories)
        ? commonChart.categories
        : [];

      return {
        xAxis: {
          categories: validCategories,
          type: xAxisType,
        },
        series: validSeries,
        shouldRedraw: validSeries.length > 0,
      };
    } else {
      debug &&
        console.log('Données temporairement vides, attente des vraies données');
      return {
        xAxis: { categories: [] },
        series: [],
      };
    }
  }
}
