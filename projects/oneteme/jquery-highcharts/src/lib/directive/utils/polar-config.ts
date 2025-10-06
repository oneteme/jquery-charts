import { Highcharts } from './highcharts-modules';

/**
 * Configuration spécifique pour les graphiques polaires
 */
export function configurePolarChart(
  options: Highcharts.Options,
  chartType: string
): void {
  if (!options.chart) {
    options.chart = {};
  }

  // Activer le mode polaire
  options.chart.polar = true;

  // Configuration commune de l'axe X pour tous les graphiques polaires
  if (!options.xAxis) {
    options.xAxis = {};
  }
  (options.xAxis as any).tickmarkPlacement = 'on';
  (options.xAxis as any).lineWidth = 0;

  // Configuration de l'axe Y
  if (!options.yAxis) {
    options.yAxis = {};
  }
  (options.yAxis as any).lineWidth = 0;
  (options.yAxis as any).min = 0;

  // Configuration spécifique selon le type de graphique
  switch (chartType) {
    case 'polar':
      configurePolarType(options);
      break;
    case 'radar':
      configureRadarType(options);
      break;
    case 'radarArea':
      configureRadarAreaType(options);
      break;
    case 'radialBar':
      configureRadialBarType(options);
      break;
  }
}

/**
 * Configuration pour le type "polar" (secteurs empilés)
 */
function configurePolarType(options: Highcharts.Options): void {
  // Grille circulaire pour polar
  (options.yAxis as any).gridLineInterpolation = 'circle';

  // Empiler les colonnes pour créer des secteurs
  if (!options.plotOptions) {
    options.plotOptions = {};
  }
  options.plotOptions.column = {
    stacking: 'normal',
    borderWidth: 0,
    pointPadding: 0,
    groupPadding: 0,
  };

  // Configuration du pane
  options.pane = {
    size: '85%',
  };
}

/**
 * Configuration pour le type "radar" (toile d'araignée)
 */
function configureRadarType(options: Highcharts.Options): void {
  // Grille polygonale pour radar
  (options.yAxis as any).gridLineInterpolation = 'polygon';
}

/**
 * Configuration pour le type "radararea" (toile d'araignée avec remplissage)
 */
function configureRadarAreaType(options: Highcharts.Options): void {
  // Grille polygonale pour radar area
  (options.yAxis as any).gridLineInterpolation = 'polygon';

  if (!options.plotOptions) {
    options.plotOptions = {};
  }
  options.plotOptions.area = {
    fillOpacity: 0.5,
  };
}

/**
 * Configuration pour le type "radialbar" (barres circulaires concentriques)
 */
function configureRadialBarType(options: Highcharts.Options): void {
  // Grille circulaire pour radialbar
  (options.yAxis as any).gridLineInterpolation = 'circle';

  // Configuration du pane (zone circulaire)
  options.pane = {
    size: '85%',
  };

  // Configuration spécifique des colonnes pour radialbar
  if (!options.plotOptions) {
    options.plotOptions = {};
  }

  options.plotOptions.column = {
    pointPadding: 0,
    groupPadding: 0.15,
    borderWidth: 1,
    stacking: undefined, // Pas de stacking pour radialBar, les barres doivent être côte à côte
  };

  // Placement des points sur les graduations
  (options.plotOptions as any).series = {
    pointPlacement: 'on',
  };
}

/**
 * Détermine si un type de graphique est polaire
 */
export function isPolarChart(chartType: string): boolean {
  return ['polar', 'radar', 'radarArea', 'radialBar'].includes(chartType);
}
