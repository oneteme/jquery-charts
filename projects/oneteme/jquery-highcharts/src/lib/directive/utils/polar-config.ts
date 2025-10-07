import { Highcharts } from './highcharts-modules';

// Configuration spé pour graph polaires
export function configurePolarChart(
  options: Highcharts.Options,
  chartType: string
): void {
  if (!options.chart) {
    options.chart = {};
  }

  options.chart.polar = true;

  if (!options.xAxis) { options.xAxis = {} };
  (options.xAxis as any).tickmarkPlacement = 'on';
  (options.xAxis as any).lineWidth = 0;

  if (!options.yAxis) { options.yAxis = {} };
  (options.yAxis as any).lineWidth = 0;
  (options.yAxis as any).min = 0;

  switch (chartType) {
    case 'polar': configurePolarType(options);
      break;
    case 'radar': configureRadarType(options);
      break;
    case 'radarArea': configureRadarAreaType(options);
      break;
    case 'radialBar': configureRadialBarType(options);
      break;
  }
}

// Configuration pour le type "polar" (secteurs empilés)
function configurePolarType(options: Highcharts.Options): void {
  (options.yAxis as any).gridLineInterpolation = 'circle';

  if (!options.plotOptions) { options.plotOptions = {} }
  options.plotOptions.column = {
    stacking: 'normal',
    borderWidth: 0,
    pointPadding: 0,
    groupPadding: 0,
  };
  options.pane = { size: '85%' };

  if (!(options.plotOptions as any).series) {
    (options.plotOptions as any).series = {};
  }
  (options.plotOptions as any).series.pointPlacement = 'between';
}

// Configuration pour le type "radar" (toile d'araignée)
function configureRadarType(options: Highcharts.Options): void {
  (options.yAxis as any).gridLineInterpolation = 'polygon';
}

// Configuration pour le type "radararea" (toile d'araignée avec remplissage)
function configureRadarAreaType(options: Highcharts.Options): void {
  (options.yAxis as any).gridLineInterpolation = 'polygon';

  if (!options.plotOptions) { options.plotOptions = {} };
  options.plotOptions.area = { fillOpacity: 0.5 };
}

// Configuration pour le type "radialbar" (barres circulaires concentriques)
function configureRadialBarType(options: Highcharts.Options): void {
  if (!options.chart) { options.chart = {} }
  (options.chart as any).inverted = true;

  options.pane = {
    startAngle: 0,
    endAngle: 360,
    background: [],
  };

  if (!options.xAxis) { options.xAxis = {} };
  (options.xAxis as any).tickInterval = 1;
  (options.xAxis as any).lineWidth = 0;
  (options.xAxis as any).showLastLabel = false;

  if (!options.yAxis) { options.yAxis = {} };
  (options.yAxis as any).min = 0;
  (options.yAxis as any).lineWidth = 0;
  (options.yAxis as any).gridLineWidth = 0;
  (options.yAxis as any).reversedStacks = false;
  (options.yAxis as any).labels = { enabled: true };

  if (!options.plotOptions) { options.plotOptions = {} };
  options.plotOptions.column = {
    stacking: 'normal',
    borderWidth: 0,
    pointPadding: 0,
    groupPadding: 0.15,
    borderRadius: 0,
    pointPlacement: 'on',
  };

  if (!(options.plotOptions as any).series) { (options.plotOptions as any).series = {} }
}

// Détermine si un type de graphique est polaire
export function isPolarChart(chartType: string): boolean {
  return ['polar', 'radar', 'radarArea', 'radialBar'].includes(chartType);
}

// Force les configs critiques après merge des options utilisateur
export function enforceCriticalPolarOptions(options: Highcharts.Options, chartType: string): void {
  if (!isPolarChart(chartType)) { return }

  // Configurations critiques communes à tous les graphiques polaires
  if (!options.chart) { options.chart = {} }
  options.chart.polar = true;

  // Configurations critiques spécifiques à chaque type
  switch (chartType) {
    case 'radialBar': enforceRadialBarCriticalOptions(options);
      break;
    case 'radar':
    case 'radarArea': enforceRadarCriticalOptions(options);
      break;
    case 'polar': enforcePolarTypeCriticalOptions(options);
      break;
  }
}

// Force les options critiques pour radialBar
function enforceRadialBarCriticalOptions(options: Highcharts.Options): void {
  if (!options.chart) { options.chart = {} }
  (options.chart as any).inverted = true;

  if (!options.xAxis) { options.xAxis = {} }
  (options.xAxis as any).showLastLabel = false;
  (options.xAxis as any).gridLineWidth = 0;
  (options.xAxis as any).lineWidth = 0;

  if (!options.yAxis) { options.yAxis = {} }
  (options.yAxis as any).gridLineWidth = 0;
}

// Force les options critiques pour radar et radarArea
function enforceRadarCriticalOptions(options: Highcharts.Options): void {
  if (!options.yAxis) { options.yAxis = {} }
  (options.yAxis as any).gridLineInterpolation = 'polygon';
}

// Force les options critiques pour polar
function enforcePolarTypeCriticalOptions(options: Highcharts.Options): void {
  if (!options.yAxis) { options.yAxis = {} }
  (options.yAxis as any).gridLineInterpolation = 'circle';
}
