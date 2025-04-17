import { ChartType, XaxisType, YaxisType } from '@oneteme/jquery-core';
import * as Highcharts from 'highcharts';

/**
 * Mappe les types de graphiques ChartType vers les types Highcharts
 */
export function mapChartType(chartType: ChartType): string {
  const typeMapping = {
    pie: 'pie',
    donut: 'pie', // Highcharts utilise pie avec innerSize
    polar: 'column', // Sera transformé en polarArea
    radar: 'line', // Sera transformé en radar
    radial: 'column', // Sera transformé en radialBar
    line: 'line',
    area: 'area',
    spline: 'spline',
    areaspline: 'areaspline',
    bar: 'bar',
    column: 'column',
    heatmap: 'heatmap',
    treemap: 'treemap',
    funnel: 'funnel',
    pyramid: 'funnel', // Sera inversé
    rangeArea: 'arearange',
    rangeBar: 'columnrange',
    rangeColumn: 'columnrange',
  };

  return typeMapping[chartType] ?? 'line';
}

/**
 * Vérifie si un type de graphique est de type simple
 */
export function isSimpleChartType(type: ChartType): boolean {
  return [
    'pie',
    'donut',
    'funnel',
    'pyramid',
    'polar',
    'radar',
    'radial',
  ].includes(type);
}

/**
 * Détermine si les données doivent être traitées comme continues
 */
export function isDataContinuous(type: ChartType): boolean {
  return ['line', 'area', 'spline', 'areaspline'].includes(type);
}

/**
 * Configure les options de base pour un graphique Highcharts
 */
export function getBaseOptions<X extends XaxisType, Y extends YaxisType>(
  chartType: ChartType,
  config: any
): Highcharts.Options {
  // Initialiser la configuration si elle n'existe pas
  config ??= { series: [] };

  return {
    chart: {
      type: mapChartType(chartType),
    },
    title: {
      text: config.title ?? undefined,
    },
    subtitle: {
      text: config.subtitle ?? undefined,
    },
    credits: {
      enabled: false,
    },
    accessibility: {
      enabled: false,
    },
    exporting: {
      enabled: config.showToolbar ?? false,
    },
    plotOptions: {
      series: {
        stacking: config.stacked
          ? ('normal' as Highcharts.OptionsStackingValue)
          : undefined,
        dataLabels: {
          enabled: false,
        },
        events: {},
      },
    },
    xAxis: {
      title: {
        text: config.xtitle ?? undefined,
      },
      type: 'category' as Highcharts.AxisTypeValue,
    },
    yAxis: {
      title: {
        text: config.ytitle ?? undefined,
      },
    },
    series: [],
    // Configuration des textes
    lang: {
      noData: 'Aucune donnée à afficher',
    },
    // Configuration de l'indicateur de chargement
    loading: {
      labelStyle: {
        color: '#666',
        fontSize: '16px',
      },
      style: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
      },
    },
    // Configuration du message "pas de données"
    noData: {
      style: {
        fontWeight: 'bold',
        fontSize: '16px',
        color: '#666',
      },
    },
  };
}

/**
 * Configure les options spécifiques au type de graphique
 */
export function configureTypeSpecificOptions(
  chartOptions: Highcharts.Options,
  chartType: ChartType
): void {
  if (!chartOptions?.chart) return;

  // Réinitialiser certaines options qui pourraient persister
  if (chartOptions.chart.polar) chartOptions.chart.polar = false;
  if (chartOptions.chart.inverted) chartOptions.chart.inverted = false;
  if (chartOptions.pane) delete chartOptions.pane;

  // Configurer les options spécifiques au type
  switch (chartType) {
    case 'donut':
      if (!chartOptions.plotOptions) chartOptions.plotOptions = {};
      if (!chartOptions.plotOptions.pie) chartOptions.plotOptions.pie = {};
      chartOptions.plotOptions.pie.innerSize = '50%';
      break;

    case 'polar':
      chartOptions.chart.polar = true;
      break;

    case 'radar':
      chartOptions.chart.polar = true;
      chartOptions.pane = {
        size: '80%',
        startAngle: 0,
        endAngle: 360,
      };
      break;

    case 'bar':
      if (!chartOptions.plotOptions) chartOptions.plotOptions = {};
      if (!chartOptions.plotOptions.bar) chartOptions.plotOptions.bar = {};
      // Barres horizontales
      chartOptions.chart.inverted = true;
      break;

    case 'pyramid':
      if (!chartOptions.plotOptions) chartOptions.plotOptions = {};
      if (!chartOptions.plotOptions.funnel)
        chartOptions.plotOptions.funnel = {};
      chartOptions.plotOptions.funnel.reversed = true;
      break;

    case 'rangeBar':
    case 'rangeColumn':
      // Configuration spécifique pour les graphiques de type range
      if (!chartOptions.plotOptions) chartOptions.plotOptions = {};
      if (!chartOptions.plotOptions.columnrange)
        chartOptions.plotOptions.columnrange = {};
      chartOptions.chart.inverted = chartType === 'rangeBar';
      break;

    case 'spline':
    case 'areaspline':
      // Configuration spécifique pour les graphiques de type spline
      if (!chartOptions.plotOptions) chartOptions.plotOptions = {};
      if (!chartOptions.plotOptions.spline)
        chartOptions.plotOptions.spline = {};
      if (!chartOptions.plotOptions.areaspline)
        chartOptions.plotOptions.areaspline = {};
      break;
  }
}

/**
 * Logger pour déboguer avec timestamp
 */
export function logDebug(
  message: string,
  data?: any,
  debug: boolean = false
): void {
  if (!debug) return;

  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[HIGHCHARTS][${timestamp}] ${message}`, data);
  } else {
    console.log(`[HIGHCHARTS][${timestamp}] ${message}`);
  }
}
