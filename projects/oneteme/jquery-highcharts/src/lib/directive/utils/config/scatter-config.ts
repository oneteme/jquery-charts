import { Highcharts } from '../highcharts-modules';

/** Détermine si un type de graphique est scatter */
export function isScatterChart(chartType: string): boolean {
  return chartType === 'scatter';
}

/** Configure les options par défaut pour les graphiques scatter */
export function configureScatterChart(
  options: Highcharts.Options,
  chartType: string
): void {
  if (!isScatterChart(chartType)) {
    return;
  }
}

/** Force les configurations critiques pour scatter après le merge */
export function enforceCriticalScatterOptions(
  options: Highcharts.Options,
  chartType: string
): void {
  if (!isScatterChart(chartType)) {
    return;
  }
}
