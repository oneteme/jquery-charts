import { ChartProvider, XaxisType, YaxisType } from '@oneteme/jquery-core';
import { SimpleChartHandler } from './base-simple-handler.interface';
import { generateDistinctColors } from '../../chart-utils';

export class PolarHandler<X extends XaxisType = XaxisType> implements SimpleChartHandler<X> {

  handle(
    commonChart: any,
    chartConfig: ChartProvider<X, YaxisType>,
    chartType: string,
    debug = false
  ): { series: any[]; xAxis: any } {
    debug && console.log(`Traitement des données polaires ${chartType}:`, commonChart);

    const xAxis = {
      categories: commonChart.categories ?? []
    };

    const series = this.createSinglePolarSeries(commonChart, chartConfig, chartType);

    return { series, xAxis };
  }

  private createSinglePolarSeries(commonChart: any, chartConfig: any, chartType: string): any[] {
    let seriesType = 'column';

    const colors = generateDistinctColors(commonChart.categories.length);

    const formattedData = commonChart.categories.map(
      (category: any, i: string | number) => ({
        name: category,
        y: commonChart.series[0]?.data[i] ?? 0,
        color: colors[i],
      })
    );

    return [{
      name: chartConfig.title ?? 'Valeurs',
      data: formattedData,
      type: seriesType,
      showInLegend: true,
    }];
  }
}
