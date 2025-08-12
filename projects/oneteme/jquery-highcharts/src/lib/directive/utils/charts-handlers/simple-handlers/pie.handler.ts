import { ChartProvider, XaxisType, YaxisType } from '@oneteme/jquery-core';
import { SimpleChartHandler } from './base-simple-handler.interface';
import { generateDistinctColors } from '../../chart-utils';

export class PieHandler<X extends XaxisType = XaxisType> implements SimpleChartHandler<X> {
  
  handle(
    commonChart: any,
    chartConfig: ChartProvider<X, YaxisType>,
    chartType: string,
    debug = false
  ): { series: any[] } {
    try {
      debug && console.log(`Traitement des données ${chartType}:`, commonChart);

      if (!commonChart?.series || !Array.isArray(commonChart.series)) {
        return { series: [] };
      }

      const flatData = commonChart.series
        .flatMap((s: { data: any[] }) =>
          Array.isArray(s.data) ? s.data.filter((d: null) => d != null) : []
        );

      const colors = generateDistinctColors(flatData.length);

      const formattedData = flatData.map((data: any, index: string | number) => ({
        name: commonChart?.categories?.[index] ?? `Item ${index}`,
        y: typeof data === 'number' ? data : 0,
        color: colors[index],
      }));

      debug && console.log('Données formatées pour pie:', formattedData);

      return {
        series: [
          {
            name: chartConfig.title ?? 'Valeurs',
            data: formattedData,
            showInLegend: true,
          },
        ],
      };
    } catch (error) {
      console.error(`Erreur lors du formatage des données ${chartType}:`, error);
      return { series: [] };
    }
  }
}
