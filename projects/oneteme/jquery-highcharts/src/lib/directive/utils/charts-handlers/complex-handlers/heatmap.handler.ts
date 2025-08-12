import { ChartProvider, XaxisType, YaxisType } from '@oneteme/jquery-core';
import { ChartHandler } from './base-handler.interface';
import { validateSpecialChartData } from '../../chart-utils';

export class HeatmapHandler<X extends XaxisType = XaxisType>
  implements ChartHandler<X>
{
  handle(
    data: any[],
    chartConfig: ChartProvider<X, YaxisType>,
    debug = false
  ): any {
    try {
      debug && console.log('Traitement des données heatmap:', data);

      if (!validateSpecialChartData(data, 'heatmap')) {
        debug &&
          console.log(
            'Données non optimales pour heatmap, adaptation en cours...'
          );

        const xCategories = data.map(
          (item, index) =>
            item.category || item.month || item.name || `Item ${index + 1}`
        );

        const heatmapPoints: number[][] = data.map(
          (item: any, index: number) => [
            index,
            0,
            typeof item.value === 'number' ? item.value : item.y || 0,
          ]
        );

        debug &&
          console.log('Données heatmap adaptées:', {
            categories: xCategories,
            data: heatmapPoints,
          });

        return {
          xAxis: {
            type: 'category',
            categories: xCategories,
            labels: { enabled: true },
            title: { text: chartConfig.xtitle },
          },
          yAxis: {
            type: 'category',
            categories: ['Valeurs'],
            labels: { enabled: true },
            title: { text: chartConfig.ytitle },
          },
          series: [
            {
              type: 'heatmap',
              name: chartConfig.title ?? 'Données',
              data: heatmapPoints,
              dataLabels: {
                enabled: true,
                color: '#000000',
              },
            },
          ],
          shouldRedraw: true,
        };
      } else {
        const xCategories = Array.from(
          new Set(data.map((item) => item.month ?? item.category ?? item.name))
        );
        const yCategories = Array.from(
          new Set(data.map((item) => item.team ?? 'Série'))
        );

        const xIndexMap = new Map(xCategories.map((cat, idx) => [cat, idx]));
        const yIndexMap = new Map(yCategories.map((ser, idx) => [ser, idx]));

        const heatmapPoints: number[][] = [];

        data.forEach((item: any) => {
          const categoryKey = item.month ?? item.category ?? item.name;
          const serieKey = item.team ?? 'Série';

          const x = xIndexMap.get(categoryKey);
          const y = yIndexMap.get(serieKey);
          const value =
            typeof item.value === 'number' ? item.value : item.y || 0;

          if (x !== undefined && y !== undefined) {
            heatmapPoints.push([x, y, value]);
          }
        });

        debug &&
          console.log('Données heatmap optimales:', {
            x: xCategories,
            y: yCategories,
            data: heatmapPoints,
          });

        return {
          xAxis: {
            type: 'category',
            categories: xCategories,
            labels: { enabled: true },
            title: { text: chartConfig.xtitle },
          },
          yAxis: {
            type: 'category',
            categories: yCategories,
            labels: { enabled: true },
            title: { text: chartConfig.ytitle },
          },
          series: [
            {
              type: 'heatmap',
              name: chartConfig.title ?? 'Données',
              data: heatmapPoints,
              dataLabels: {
                enabled: true,
                color: '#000000',
              },
            },
          ],
          shouldRedraw: true,
        };
      }
    } catch (error) {
      console.error('Erreur lors du traitement des données heatmap:', error);
      return { series: [] };
    }
  }
}
