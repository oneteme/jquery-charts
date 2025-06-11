import { mergeDeep } from '@oneteme/jquery-core';
import { Highcharts } from './highcharts-modules';

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
            borderWidth: 3
          }
        ]
      }
    },
    colorAxis: {
      minColor: '#FFFFFF',
      maxColor: Highcharts.getOptions().colors[0]
    }
  },
  heatmap: {
    plotOptions: {
      heatmap: {
        dataLabels: { enabled: true, color: '#000000' },
        cursor: 'pointer'
      }
    },
    colorAxis: {
      min: 0,
      minColor: '#FFFFFF',
      maxColor: Highcharts.getOptions().colors[0]
    }
  },
} as const;

export function initBaseChartOptions(
  chartType: string,
  debug: boolean = false
): any {
  if (debug) console.log('Initialisation des options de base pour', chartType);

  return {
    shouldRedraw: true,
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
  if (debug) console.log(`Configuration des options pour ${chartType}`, 'options avant:', JSON.stringify(options.plotOptions?.pie));

  const config = CHART_TYPE_CONFIGS[chartType];
  if (config) {
    // Pour pie/donut, forcer complètement la réinitialisation
    if (chartType === 'pie' || chartType === 'donut') {
      options.plotOptions ??= {};

      // Réinitialisation complète et forcée des options pie
      options.plotOptions.pie = {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: { enabled: false },
        innerSize: chartType === 'donut' ? '50%' : 0,
      };

      if (debug) console.log(`Options pie forcées pour ${chartType}:`, JSON.stringify(options.plotOptions.pie));
    } else {
      // Pour les autres types, appliquer la configuration normale
      mergeDeep(options, config);
    }

    if (debug) console.log(`Options finales après configuration ${chartType}:`, JSON.stringify(options.plotOptions));
  } else if (debug) {
    console.warn(`Configuration non trouvée pour le type: ${chartType}`);
  }
}

export function configureComplexGraphOptions(
  options: any,
  chartType: 'treemap' | 'heatmap',
  debug: boolean = false
): void {
  if (debug) console.log(`Configuration des options complexes pour ${chartType}`);

  const config = CHART_TYPE_CONFIGS[chartType];
  if (config) {
    mergeDeep(options, config);
    if (debug) console.log(`Options finales après configuration ${chartType}:`, JSON.stringify(options.plotOptions));
  } else if (debug) {
    console.warn(`Configuration non trouvée pour le type: ${chartType}`);
  }
}
