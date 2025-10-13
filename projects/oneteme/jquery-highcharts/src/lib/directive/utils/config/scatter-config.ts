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

  // Forcer l'affichage des markers (essentiel pour scatter)
  if (!options.plotOptions) {
    options.plotOptions = {};
  }
  if (!(options.plotOptions as any).scatter) {
    (options.plotOptions as any).scatter = {};
  }
  
  // Configuration critique : les markers doivent être activés (TOUJOURS en dernier pour être prioritaire)
  if (!(options.plotOptions as any).scatter.marker) {
    (options.plotOptions as any).scatter.marker = {};
  }
  
  // Forcer enabled et radius APRÈS le merge pour être prioritaire
  (options.plotOptions as any).scatter.marker.enabled = true;
  
  // S'assurer qu'un radius est défini (taille par défaut Highcharts)
  if (!(options.plotOptions as any).scatter.marker.radius) {
    (options.plotOptions as any).scatter.marker.radius = 4;
  }
  
  // Pas de lignes entre les points pour scatter
  (options.plotOptions as any).scatter.lineWidth = 0;
}
