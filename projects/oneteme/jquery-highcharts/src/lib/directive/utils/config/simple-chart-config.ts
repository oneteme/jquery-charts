import { Highcharts } from '../highcharts-modules';
import { simpleToStandard, standardToSimple, isSimpleChartFormat } from './simple-chart-transforms';

export function isSimpleChart(chartType: string): boolean {
  return ['pie', 'donut', 'funnel', 'pyramid', 'semi-circle'].includes(
    chartType
  );
}

export function transformSimpleChartData(
  series: any[],
  targetIsSimple: boolean,
  categories?: any[]
): any[] | { series: any[]; categories?: string[] } {
  if (!series || series.length === 0) return series;

  if (targetIsSimple) {
    return standardToSimple(series, categories);
  } else {
    if (isSimpleChartFormat(series)) {
      return simpleToStandard(series);
    }
    return series;
  }
}

export function configureSimpleChart(
  options: Highcharts.Options,
  chartType: string
): void {
  if (!isSimpleChart(chartType)) return;

  if (!options.plotOptions) {
    options.plotOptions = {};
  }

  const commonConfig = {
    dataLabels: {
      enabled: true,
      format: '{point.name}: {point.percentage:.1f}%',
    },
    showInLegend: true,
  };

  if (chartType === 'pie' || chartType === 'donut') {
    (options.plotOptions as any).pie = {
      ...(options.plotOptions as any).pie,
      ...commonConfig,
      innerSize: chartType === 'donut' ? '50%' : '0%',
    };
  } else if (chartType === 'funnel') {
    (options.plotOptions as any).funnel = {
      ...(options.plotOptions as any).funnel,
      ...commonConfig,
      neckWidth: '30%',
      neckHeight: '25%',
    };
  } else if (chartType === 'pyramid') {
    (options.plotOptions as any).pyramid = {
      ...(options.plotOptions as any).pyramid,
      ...commonConfig,
    };
  }
}

export function enforceCriticalSimpleOptions(
  options: Highcharts.Options,
  chartType: string
): void {
  if (!isSimpleChart(chartType)) return;
}
