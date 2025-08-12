import { ChartProvider, XaxisType, YaxisType } from '@oneteme/jquery-core';
import { ChartHandler } from './base-handler.interface';

export class ScatterHandler<X extends XaxisType = XaxisType>
  implements ChartHandler<X>
{
  handle(
    data: any[],
    chartConfig: ChartProvider<X, YaxisType>,
    debug = false
  ): any {
    try {
      debug && console.log('Traitement des données scatter:', data);

      const serieNames = [...new Set(data.map((item) => item.team))].filter(
        Boolean
      );
      const hasMultipleSeries = serieNames.length > 1;

      debug &&
        console.log(
          'Séries détectées:',
          serieNames,
          'Multiple:',
          hasMultipleSeries
        );

      let series: any[] = [];

      if (hasMultipleSeries) {
        serieNames.forEach((serieName) => {
          const serieData = data.filter((item) => item.team === serieName);
          const scatterPoints = serieData.map((item: any, index: number) => {
            const xLabel =
              item.month || item.category || item.name || `Point ${index + 1}`;

            let yValue = 0;
            if (typeof item.value === 'number') {
              yValue = item.value;
            } else if (typeof item.y === 'number') {
              yValue = item.y;
            }

            return {
              name: `${xLabel} - ${serieName}`,
              y: yValue,
              custom: {
                month: xLabel,
              },
            };
          });

          series.push({
            type: 'scatter',
            name: serieName,
            data: scatterPoints,
          });
        });

        const xCategories = [
          ...new Set(
            data.map((item) => item.month || item.category || item.name)
          ),
        ];

        return {
          xAxis: {
            categories: xCategories,
            title: { text: chartConfig.xtitle || 'Catégories' },
          },
          yAxis: {
            type: 'linear',
            title: { text: chartConfig.ytitle || 'Valeurs' },
          },
          series,
          shouldRedraw: series.length > 0,
        };
      } else {
        const scatterPoints = data.map((item: any, index: number) => {
          const xLabel =
            item.month || item.category || item.name || `Point ${index + 1}`;

          let yValue = 0;
          if (typeof item.value === 'number') {
            yValue = item.value;
          } else if (typeof item.y === 'number') {
            yValue = item.y;
          }

          return {
            name: xLabel,
            x: index,
            y: yValue,
          };
        });

        series = [
          {
            type: 'scatter',
            name: 'Points',
            data: scatterPoints,
          },
        ];

        const xCategories = data.map(
          (item, idx) => item.month || item.category || item.name || `Point ${idx + 1}`
        );
        return {
          xAxis: {
            categories: xCategories,
            title: { text: chartConfig.xtitle || 'Catégories' },
          },
          yAxis: {
            title: { text: chartConfig.ytitle || 'Valeurs' },
          },
          series,
          shouldRedraw: series.length > 0,
        };
      }
    } catch (error) {
      console.error('Erreur lors du traitement des données scatter:', error);
      return { series: [] };
    }
  }
}
