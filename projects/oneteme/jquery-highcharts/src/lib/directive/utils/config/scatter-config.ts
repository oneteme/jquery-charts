import { Highcharts } from '../highcharts-modules';

export function isScatterChart(chartType: string): boolean {
  return chartType === 'scatter';
}

export function configureScatterChart(
  options: Highcharts.Options,
  chartType: string
): void {
  if (!isScatterChart(chartType)) return;
}

export function enforceCriticalScatterOptions(
  options: Highcharts.Options,
  chartType: string
): void {
  if (!isScatterChart(chartType)) return;
  if (!options.plotOptions) {
    options.plotOptions = {};
  }
  if (!(options.plotOptions as any).scatter) {
    (options.plotOptions as any).scatter = {};
  }
  if (!(options.plotOptions as any).scatter.marker) {
    (options.plotOptions as any).scatter.marker = {};
  }
  (options.plotOptions as any).scatter.marker.enabled = true;
  if (!(options.plotOptions as any).scatter.marker.radius) {
    (options.plotOptions as any).scatter.marker.radius = 4;
  }
  (options.plotOptions as any).scatter.lineWidth = 0;
}
