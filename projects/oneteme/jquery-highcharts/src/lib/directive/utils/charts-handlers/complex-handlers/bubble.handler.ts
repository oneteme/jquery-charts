import { ChartProvider, XaxisType, YaxisType } from '@oneteme/jquery-core';
import { ChartHandler } from './base-handler.interface';

export class BubbleHandler<X extends XaxisType = XaxisType>
  implements ChartHandler<X>
{
  handle(
    data: any[],
    chartConfig: ChartProvider<X, YaxisType>,
    debug = false
  ): any {
    try {
      debug && console.log('Traitement des données bubble:', data);

      const serieNames = [...new Set(data.map((item) => item.team))].filter(
        Boolean
      );
      const hasMultipleSeries = serieNames.length > 1;

      debug &&
        console.log(
          'Séries détectées pour bubble:',
          serieNames,
          'Multiple:',
          hasMultipleSeries
        );

      const allValues = data.map((item) => Math.abs(item.value || item.y || 0));
      const minValue = Math.min(...allValues);
      const maxValue = Math.max(...allValues);
      const valueRange = maxValue - minValue || 1;

      const hasCustomSizes = data.some(
        (item) => item.z !== undefined || item.size !== undefined
      );

      let series: any[] = [];

      if (hasMultipleSeries) {
        serieNames.forEach((serieName) => {
          const serieData = data.filter((item) => item.team === serieName);
          const bubblePoints = serieData.map((item: any, index: number) => {
            const xLabel =
              item.month || item.category || item.name || `Point ${index + 1}`;

            let yValue = 0;
            if (typeof item.value === 'number') {
              yValue = item.value;
            } else if (typeof item.y === 'number') {
              yValue = item.y;
            }

            let zValue = item.z || item.size;
            if (zValue === undefined) {
              if (hasCustomSizes) {
                const normalizedValue =
                  (Math.abs(yValue) - minValue) / valueRange || 0;
                zValue = Math.max(10, Math.min(50, 10 + normalizedValue * 40));
              } else {
                zValue = 15;
              }
            }

            return {
              name: `${xLabel}`,
              y: yValue,
              z: Math.round(zValue * 100) / 100,
              custom: {
                month: xLabel,
                serie: serieName,
                value: yValue,
                size: hasCustomSizes ? Math.round(zValue * 100) / 100 : null,
              },
            };
          });

          series.push({
            type: 'bubble',
            name: serieName,
            data: bubblePoints,
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
            title: { text: chartConfig.ytitle || 'Valeurs' },
          },
          series,
          shouldRedraw: series.length > 0,
        };
      } else {
        const bubblePoints = data.map((item: any, index: number) => {
          const xLabel =
            item.month || item.category || item.name || `Point ${index + 1}`;

          let yValue = 0;
          if (typeof item.value === 'number') {
            yValue = item.value;
          } else if (typeof item.y === 'number') {
            yValue = item.y;
          }

          let zValue = item.z || item.size;
          if (zValue === undefined) {
            const normalizedValue =
              (Math.abs(yValue) - minValue) / valueRange || 0;
            zValue = Math.max(10, Math.min(50, 10 + normalizedValue * 40));
          }

          return {
            name: xLabel,
            y: yValue,
            z: Math.round(zValue * 100) / 100,
            custom: {
              month: xLabel,
              value: yValue,
              size: Math.round(zValue * 100) / 100,
            },
          };
        });

        series = [
          {
            type: 'bubble',
            name: 'Données',
            data: bubblePoints,
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
      console.error('Erreur lors du traitement des données bubble:', error);
      return { series: [] };
    }
  }
}
