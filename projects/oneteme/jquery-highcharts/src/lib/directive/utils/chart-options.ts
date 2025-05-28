import { mergeDeep } from '@oneteme/jquery-core';

export function initBaseChartOptions(
  chartType: string,
  isLoading: boolean = false,
  debug: boolean = false
): any {
  const loadingText = isLoading ? 'Chargement des données...' : 'Aucune donnée';
  if (debug) console.log('Initialisation des options de base pour', chartType);

  return {
    shouldRedraw: true,
    lang: {
      noData: loadingText,
    },
    chart: {
      type: chartType,
    },
    // Ne pas désactiver l'export par défaut, laissez l'utilisateur le configurer s'il le souhaite
    credits: { enabled: false },
    series: [],
    xAxis: {},
    plotOptions: {},
  };
}

function configurePieOptions(options: any, chartType: 'pie' | 'donut'): void {
  mergeDeep(options, {
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: false
        },
        innerSize: chartType === 'donut' ? '50%' : 0,
      },
    },
  });
}

function configurePolarOptions(options: any, chartType: 'polar' | 'radar' | 'radialBar'): void {
  mergeDeep(options, {
    chart: {
      polar: true,
      type: chartType === 'radar' ? 'line' : 'column',
      inverted: chartType === 'radialBar',
    },
    pane: {
      innerSize: chartType === 'radialBar' ? '20%' : '0%',
      endAngle: chartType === 'radialBar' ? 270 : 360,
    },
    xAxis: {
      tickmarkPlacement: 'on',
      lineWidth: 0,
      gridLineWidth: chartType === 'radialBar' ? 0 : 1,
      labels: {
        enabled: chartType !== 'radialBar'
      }
    },
    yAxis: {
      gridLineInterpolation: chartType === 'radar' ? 'polygon' : 'circle',
      lineWidth: 0,
      gridLineWidth: chartType === 'radialBar' ? 0 : 1,
      reversedStacks: chartType === 'radialBar' ? false : undefined,
      labels: {
        enabled: true
      }
    },
    plotOptions: {
      series: {
        pointPlacement: 'between',
        pointStart: 0,
        connectEnds: true,
        showInLegend: true,
        dataLabels: {
          enabled: false,
        },
        marker: {
          enabled: true
        }
      },
      column: {
        stacking: 'normal',
        borderWidth: 0,
        pointPadding: 0,
        groupPadding: 0.15,
        borderRadius: '50%'
      },
    },
    legend: false
  });
}

function configureFunnelOptions(options: any, chartType: 'funnel' | 'pyramid'): void {
  mergeDeep(options, {
    plotOptions: {
      funnel: {
        dataLabels: {
          enabled: false
        },
        reversed: chartType === 'pyramid',
      },
      pyramid: {
        dataLabels: {
          enabled: false
        }
      }
    }
  });
}

export function configureSimpleGraphOptions(
  options: any,
  chartType: 'pie' | 'donut' | 'polar' | 'radar' | 'radialBar' | 'funnel' | 'pyramid',
  debug: boolean = false
): void {
  if (debug) console.log(`Configuration des options pour ${chartType}`);
  if (chartType === 'pie' || chartType === 'donut') {
    configurePieOptions(options, chartType);
  } else if (chartType === 'funnel' || chartType === 'pyramid') {
    configureFunnelOptions(options, chartType);
  } else {
    configurePolarOptions(options, chartType);
  }
}

function configureMapOptions(options: any, chartType: 'map'): void {
  mergeDeep(options, {
    plotOptions: {
    },
  });
}
