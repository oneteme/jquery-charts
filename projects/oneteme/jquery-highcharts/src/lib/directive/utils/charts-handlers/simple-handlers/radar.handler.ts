import { ChartProvider, XaxisType, YaxisType } from '@oneteme/jquery-core';
import { SimpleChartHandler } from './base-simple-handler.interface';
import { Highcharts } from '../../highcharts-modules';

export class RadarHandler<X extends XaxisType = XaxisType> implements SimpleChartHandler<X> {

  handle(
    commonChart: any,
    chartConfig: ChartProvider<X, YaxisType>,
    chartType: string,
    debug = false
  ): { series: any[]; xAxis: any } {
    debug && console.log(`Traitement des données radar ${chartType}:`, commonChart);

    const xAxis = {
      categories: commonChart.categories ?? []
    };

    const hasMultipleSeries = chartConfig.series?.length > 1;
    const hasNameFunction = typeof chartConfig.series?.[0]?.name === 'function';
    const shouldUseMultiSeries = (chartType === 'radar' || chartType === 'radarArea') && (hasMultipleSeries || hasNameFunction);

    debug && console.log('RadarHandler analysis:', {
      chartType,
      shouldUseMultiSeries,
      commonChartSeries: commonChart.series,
      seriesCount: commonChart.series?.length
    });

    const series = shouldUseMultiSeries
      ? this.createMultiRadarSeries(commonChart, chartConfig, chartType)
      : this.createSingleRadarSeries(commonChart, chartConfig, chartType);

    return { series, xAxis };
  }

  private createMultiRadarSeries(commonChart: any, chartConfig: any, chartType: string): any[] {
    return commonChart.series.map(
      (serie: { name: any; data: any[]; color: any }) => {
        let seriesType = 'column';
        if (chartType === 'radar') {
          seriesType = 'line';
        } else if (chartType === 'radarArea') {
          seriesType = 'area';
        }

        return {
          name: serie.name ?? chartConfig.xtitle ?? 'Série',
          data: serie.data.map((value, index) => ({
            name: commonChart.categories[index],
            y: value,
          })),
          pointPlacement: 'on',
          color: serie.color,
          type: seriesType,
        };
      }
    );
  }

  private createSingleRadarSeries(commonChart: any, chartConfig: any, chartType: string): any[] {
    let seriesType = 'column';
    if (chartType === 'radar') {
      seriesType = 'line';
    } else if (chartType === 'radarArea') {
      seriesType = 'area';
    }

    const formattedData = commonChart.categories.map(
      (category: any, i: string | number) => ({
        name: category,
        y: commonChart.series[0]?.data[i] ?? 0,
      })
    );

    const seriesColor = (Highcharts as any).getOptions().colors[0];

    return [{
      name: chartConfig.title ?? 'Valeurs',
      data: formattedData,
      type: seriesType,
      showInLegend: true,
      color: seriesColor,
    }];
  }
}
