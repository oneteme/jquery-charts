import { mergeDeep } from '@oneteme/jquery-core';
import { Highcharts } from './highcharts-modules';

const COMMON_POLAR_CONFIG = {
  pane: { innerSize: '0%', endAngle: 360 },
  xAxis: { tickmarkPlacement: 'on', lineWidth: 0, gridLineWidth: 1 },
  yAxis: { lineWidth: 0, gridLineWidth: 1 },
  plotOptions: {
    series: {
      pointPlacement: 'between',
      pointStart: 0,
      connectEnds: true,
      showInLegend: true,
    },
  },
  legend: false,
};

const COMMON_PIE_PLOT_OPTIONS = {
  allowPointSelect: true,
  cursor: 'pointer',
  dataLabels: { enabled: false },
};

const CHART_TYPE_CONFIGS = {
  pie: {
    plotOptions: {
      pie: {
        ...COMMON_PIE_PLOT_OPTIONS,
        innerSize: 0,
      },
    },
  },
  donut: {
    plotOptions: {
      pie: {
        ...COMMON_PIE_PLOT_OPTIONS,
        innerSize: '50%',
      },
    },
  },
  polar: {
    chart: { polar: true, type: 'column' },
    ...COMMON_POLAR_CONFIG,
    yAxis: {
      ...COMMON_POLAR_CONFIG.yAxis,
      gridLineInterpolation: 'circle',
    },
    plotOptions: {
      ...COMMON_POLAR_CONFIG.plotOptions,
      column: {
        borderWidth: 0,
        pointPadding: 0,
        stacking: 'normal',
        groupPadding: 0,
        borderRadius: '50%',
      },
    },
  },
  radar: {
    chart: { polar: true, type: 'line' },
    ...COMMON_POLAR_CONFIG,
    yAxis: {
      ...COMMON_POLAR_CONFIG.yAxis,
      gridLineInterpolation: 'polygon',
    },
    plotOptions: {
      ...COMMON_POLAR_CONFIG.plotOptions,
      series: {
        ...COMMON_POLAR_CONFIG.plotOptions.series,
        marker: { enabled: true },
      },
    },
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
        groupPadding: 0,
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
  treemap: {
    plotOptions: {
      treemap: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: { enabled: true, format: '{point.name}<br/>{point.value}' },
        levelIsConstant: false,
        levels: [
          {
            level: 1,
            dataLabels: { enabled: true },
            borderWidth: 3,
          },
        ],
      },
    },
    colorAxis: {
      minColor: '#FFFFFF',
      maxColor: Highcharts.getOptions().colors[0],
    },
  },
  heatmap: {
    plotOptions: {
      heatmap: {
        dataLabels: { enabled: true, color: '#000000' },
        cursor: 'pointer',
      },
    },
    colorAxis: {
      min: 0,
      minColor: '#FFFFFF',
      maxColor: Highcharts.getOptions().colors[0],
    },
  },
} as const;

export function initBaseChartOptions(
  chartType: string,
  debug: boolean = false
): any {
  debug && console.log('Initialisation des options de base pour', chartType);

  return {
    shouldRedraw: true,
    chart: { type: chartType },
    credits: { enabled: false },
    series: [],
    xAxis: {},
    plotOptions: {},
  };
}

function safeConfigMerge(
  options: any,
  config: any,
  debug: boolean = false
): void {
  try {
    mergeDeep(options, config);
  } catch (error) {
    debug && console.error('Erreur lors du merge des configurations:', error);
  }
}

export function configureSimpleGraphOptions(
  options: any,
  chartType: keyof typeof CHART_TYPE_CONFIGS,
  debug: boolean = false
): void {
  debug && console.log(`Configuration des options pour ${chartType}`);

  const config = CHART_TYPE_CONFIGS[chartType];
  if (!config) {
    debug && console.warn(`Configuration non trouvée pour le type: ${chartType}`);
    return;
  }

  // Nettoyer toutes les configurations précédentes pour éviter les conflits
  cleanPolarConfigs(options);
  cleanPieConfigs(options);
  cleanFunnelConfigs(options);

  if (chartType === 'pie' || chartType === 'donut') {
    options.plotOptions ??= {};
    options.plotOptions.pie = {
      ...COMMON_PIE_PLOT_OPTIONS,
      innerSize: chartType === 'donut' ? '50%' : 0,
    };

    debug && console.log(
      `Options pie configurées pour ${chartType}:`,
      options.plotOptions.pie
    );
  } else {
    // Appliquer la nouvelle configuration pour tous les autres types
    safeConfigMerge(options, config, debug);
  }

  debug && console.log(
    `Options finales après configuration ${chartType}:`,
    options.plotOptions
  );
}

/**
 * Vérifie si un type de graphique est polaire
 */
function isPolarType(chartType: string): boolean {
  return ['polar', 'radar', 'radialBar'].includes(chartType);
}

/**
 * Nettoie les configurations spécifiques aux graphiques polaires
 */
function cleanPolarConfigs(options: any): void {
  if (options.chart) {
    delete options.chart.polar;
    delete options.chart.inverted;
  }
  
  if (options.pane) {
    delete options.pane;
  }
  
  if (options.xAxis) {
    delete options.xAxis.tickmarkPlacement;
    delete options.xAxis.lineWidth;
    delete options.xAxis.gridLineWidth;
    delete options.xAxis.labels;
  }
  
  if (options.yAxis) {
    delete options.yAxis.lineWidth;
    delete options.yAxis.gridLineWidth;
    delete options.yAxis.gridLineInterpolation;
    delete options.yAxis.reversedStacks;
  }
  
  if (options.plotOptions) {
    delete options.plotOptions.column;
    delete options.plotOptions.line;
    // Nettoyer aussi les configurations des graphiques complexes
    delete options.plotOptions.treemap;
    delete options.plotOptions.heatmap;
    if (options.plotOptions.series) {
      delete options.plotOptions.series.pointPlacement;
      delete options.plotOptions.series.pointStart;
      delete options.plotOptions.series.connectEnds;
      delete options.plotOptions.series.marker;
    }
  }
  
  // Nettoyer les colorAxis des graphiques complexes
  if (options.colorAxis) {
    delete options.colorAxis;
  }
}/**
 * Nettoie les configurations spécifiques aux graphiques pie/donut
 */
function cleanPieConfigs(options: any): void {
  if (options.plotOptions) {
    delete options.plotOptions.pie;
  }
}

/**
 * Nettoie les configurations spécifiques aux graphiques funnel/pyramid
 */
function cleanFunnelConfigs(options: any): void {
  if (options.plotOptions) {
    delete options.plotOptions.funnel;
    delete options.plotOptions.pyramid;
  }
}

export function configureComplexGraphOptions(
  options: any,
  chartType: 'treemap' | 'heatmap',
  debug: boolean = false
): void {
  if (debug)
    console.log(`Configuration des options complexes pour ${chartType}`);

  // Nettoyer les configurations des autres types avant d'appliquer la nouvelle
  cleanPolarConfigs(options);
  cleanPieConfigs(options);
  cleanFunnelConfigs(options);

  const config = CHART_TYPE_CONFIGS[chartType];
  if (config) {
    mergeDeep(options, config);
    debug && console.log(
      `Options finales après configuration ${chartType}:`,
      JSON.stringify(options.plotOptions)
    );
  } else if (debug) {
    console.warn(`Configuration non trouvée pour le type: ${chartType}`);
  }
}
