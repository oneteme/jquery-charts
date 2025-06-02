import { mergeDeep } from '@oneteme/jquery-core';

// Configuration par type de graphique pour éviter la duplication
const CHART_TYPE_CONFIGS = {
  pie: {
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: { enabled: false },
        innerSize: 0,
      },
    },
  },
  donut: {
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: { enabled: false },
        innerSize: '50%',
      },
    },
  },
  polar: {
    chart: { polar: true, type: 'column' },
    pane: { innerSize: '0%', endAngle: 360 },
    xAxis: { tickmarkPlacement: 'on', lineWidth: 0, gridLineWidth: 1 },
    yAxis: { gridLineInterpolation: 'circle', lineWidth: 0, gridLineWidth: 1 },
    plotOptions: {
      series: {
        pointPlacement: 'between',
        pointStart: 0,
        connectEnds: true,
        showInLegend: true,
      },
      column: {
        stacking: 'normal',
        borderWidth: 0,
        pointPadding: 0,
        groupPadding: 0.15,
        borderRadius: '50%',
      },
    },
    legend: false,
  },
  radar: {
    chart: { polar: true, type: 'line' },
    pane: { innerSize: '0%', endAngle: 360 },
    xAxis: { tickmarkPlacement: 'on', lineWidth: 0, gridLineWidth: 1 },
    yAxis: { gridLineInterpolation: 'polygon', lineWidth: 0, gridLineWidth: 1 },
    plotOptions: {
      series: {
        pointPlacement: 'between',
        pointStart: 0,
        connectEnds: true,
        showInLegend: true,
        marker: { enabled: true },
      },
    },
    legend: false,
  },
  radialBar: {
    chart: { polar: true, type: 'column', inverted: true },
    pane: { innerSize: '20%', endAngle: 270 },
    xAxis: {
      tickmarkPlacement: 'on',
      lineWidth: 0,
      gridLineWidth: 0,
      labels: { enabled: false },
    },
    yAxis: {
      gridLineInterpolation: 'circle',
      lineWidth: 0,
      gridLineWidth: 0,
      reversedStacks: false,
    },
    plotOptions: {
      series: {
        pointPlacement: 'between',
        pointStart: 0,
        connectEnds: true,
        showInLegend: true,
      },
      column: {
        stacking: 'normal',
        borderWidth: 0,
        pointPadding: 0,
        groupPadding: 0.15,
        borderRadius: '50%',
      },
    },
    legend: false,
  },
  funnel: {
    plotOptions: {
      funnel: { dataLabels: { enabled: false }, reversed: false },
    },
  },
  pyramid: {
    plotOptions: {
      funnel: { dataLabels: { enabled: false }, reversed: true },
      pyramid: { dataLabels: { enabled: false } },
    },
  },
} as const;

export function initBaseChartOptions(
  chartType: string,
  isLoading: boolean = false,
  debug: boolean = false
): any {
  const loadingText = isLoading ? 'Chargement des données...' : 'Aucune donnée';
  if (debug) console.log('Initialisation des options de base pour', chartType);

  return {
    shouldRedraw: true,
    lang: { noData: loadingText },
    chart: { type: chartType },
    credits: { enabled: false },
    series: [],
    xAxis: {},
    plotOptions: {},
  };
}

export function configureSimpleGraphOptions(
  options: any,
  chartType: keyof typeof CHART_TYPE_CONFIGS,
  debug: boolean = false
): void {
  if (debug) console.log(`Configuration des options pour ${chartType}`);

  const config = CHART_TYPE_CONFIGS[chartType];
  if (config) {
    mergeDeep(options, config);
  } else if (debug) {
    console.warn(`Configuration non trouvée pour le type: ${chartType}`);
  }
}
