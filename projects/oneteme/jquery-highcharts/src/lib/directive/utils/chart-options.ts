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
        stacking: 'normal',
        borderWidth: 0,
        pointPadding: 0,
        groupPadding: 0.15,
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
    safeConfigMerge(options, config, debug);
  }
  debug && console.log(
    `Options finales après configuration ${chartType}:`,
    options.plotOptions
  );
}

export function configureComplexGraphOptions(
  options: any,
  chartType: 'treemap' | 'heatmap',
  debug: boolean = false
): void {
  if (debug)
    console.log(`Configuration des options complexes pour ${chartType}`);

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
