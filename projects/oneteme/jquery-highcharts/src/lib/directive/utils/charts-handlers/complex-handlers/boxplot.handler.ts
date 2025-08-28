import { ChartProvider, XaxisType, YaxisType, buildChart } from '@oneteme/jquery-core';
import { ChartHandler } from './base-handler.interface';

export class BoxplotHandler<X extends XaxisType = XaxisType>
  implements ChartHandler<X>
{
  handle(
    data: any[],
    chartConfig: ChartProvider<X, YaxisType>,
    debug = false
  ): any {
    try {
      if (!data || !Array.isArray(data) || data.length === 0) {
        return { series: [] };
      }

      debug && console.log('Données boxplot reçues:', data);

      if (chartConfig?.series && chartConfig.series.length > 0) {
        const chartConfigCopy = { ...chartConfig, continue: false };
        const commonChart = buildChart(data, chartConfigCopy, null);

        if (commonChart?.series && commonChart.series.length > 0) {
          const boxplotSeries = commonChart.series.map(
            (serie: any, index: number) => ({
              type: 'boxplot',
              name: serie.name || `Series ${index + 1}`,
              data: this.convertToBoxplotFormat(data, commonChart.categories),
            })
          );

          const options = {
            chart: {
              type: 'boxplot',
            },
            xAxis: {
              categories: commonChart.categories,
              title: { text: chartConfig.xtitle || 'Catégories' },
            },
            yAxis: {
              title: { text: chartConfig.ytitle || 'Valeurs' },
            },
            tooltip: {
              shared: false,
              headerFormat: '<b>{series.name}</b><br>',
              pointFormat:
                'Maximum: <b>{point.high}</b><br>Q3: <b>{point.q3}</b><br>Médiane: <b>{point.median}</b><br>Q1: <b>{point.q1}</b><br>Minimum: <b>{point.low}</b>',
            },
            series: boxplotSeries,
          };

          debug &&
            console.log(
              'Données boxplot transformées avec buildChart:',
              boxplotSeries
            );
          return options;
        }
      }

      const transformedSeries = data.map((series, seriesIndex) => {
        const boxplotSeries: any = {
          type: 'boxplot',
          name: series?.name || `Series ${seriesIndex + 1}`,
          data: [],
        };

        if (series?.data && Array.isArray(series.data)) {
          boxplotSeries.data = this.transformBoxplotData(series.data);
        }

        return boxplotSeries;
      });

      const options = {
        chart: {
          type: 'boxplot',
        },
        xAxis: {
          title: { text: chartConfig.xtitle || 'Catégories' },
        },
        yAxis: {
          title: { text: chartConfig.ytitle || 'Valeurs' },
        },
        tooltip: {
          shared: false,
          headerFormat: '<b>{series.name}</b><br>',
          pointFormat:
            'Maximum: <b>{point.high}</b><br>Q3: <b>{point.q3}</b><br>Médiane: <b>{point.median}</b><br>Q1: <b>{point.q1}</b><br>Minimum: <b>{point.low}</b>',
        },
        series: transformedSeries,
      };

      debug &&
        console.log(
          'Données boxplot transformées (fallback):',
          transformedSeries
        );
      return options;
    } catch (error) {
      console.error('Erreur lors du traitement des données boxplot:', error);
      return { series: [] };
    }
  }

  private convertToBoxplotFormat(data: any[], categories: any[]): any[] {
    return data.map((item, index) => {
      if (item && typeof item === 'object') {
        if (
          item.low !== undefined &&
          item.q1 !== undefined &&
          item.median !== undefined &&
          item.q3 !== undefined &&
          item.high !== undefined
        ) {
          return [index, item.low, item.q1, item.median, item.q3, item.high];
        }

        if (Array.isArray(item) && item.length >= 5) {
          return item;
        }

        if (item.value !== undefined || item.y !== undefined) {
          const value = item.value || item.y;
          return [
            index,
            value * 0.8,
            value * 0.9,
            value,
            value * 1.1,
            value * 1.2,
          ];
        }
      }
      return [index, 0, 0, 0, 0, 0];
    });
  }

  private transformBoxplotData(data: any[]): any[] {
    return data.map((item: any, index: number) => {
      if (Array.isArray(item) && item.length >= 5) {
        return item;
      }

      if (
        item &&
        typeof item === 'object' &&
        item.low !== undefined &&
        item.q1 !== undefined &&
        item.median !== undefined &&
        item.q3 !== undefined &&
        item.high !== undefined
      ) {
        return [
          item.x !== undefined ? item.x : index,
          item.low,
          item.q1,
          item.median,
          item.q3,
          item.high,
        ];
      }

      if (
        item &&
        typeof item === 'object' &&
        (item.value !== undefined || item.y !== undefined)
      ) {
        const value = item.value || item.y;
        return [
          item.x !== undefined ? item.x : index,
          value * 0.8,
          value * 0.9,
          value,
          value * 1.1,
          value * 1.2,
        ];
      }
      return item;
    });
  }
}
