import { mergeDeep } from '@oneteme/jquery-core';

export function initBaseOptions(
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
    // Ne pas désactiver l'export par défaut, laissez l'utilisateur le configurer
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
          enabled: true,
          format: '<b>{point.name}</b>: {point.percentage:.1f} %',
        },
        showInLegend: true,
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
      size: '80%',
      innerSize: chartType === 'radialBar' ? '20%' : '0%',
      endAngle: chartType === 'radialBar' ? 270 : 360, // juste pour l'exemple mais pas oublier de commenter
    },
    xAxis: {
      tickmarkPlacement: 'on',
      lineWidth: 0,
      gridLineWidth: chartType === 'radialBar' ? 0 : 1,
      labels: {
        enabled: chartType !== 'radialBar',
      }
    },
    yAxis: {
      gridLineInterpolation: chartType === 'radar' ? 'polygon' : 'circle',
      lineWidth: 0,
      min: 0,
      gridLineWidth: chartType === 'radialBar' ? 0 : 1,
      labels: {
        enabled: chartType === 'radialBar',
      }
    },
    tooltip: {
      shared: true,
    },
    plotOptions: {
      series: {
        pointStart: 0,
        connectEnds: true,
      },
      column: {
        stacking: 'normal',
        pointPadding: 0,
        groupPadding: 0,
        borderRadius: '50%'
      },
    },
  });
}

export function configureCircleGraphOptions(
  options: any,
  chartType: 'pie' | 'donut' |'polar' | 'radar' | 'radialBar',
  debug: boolean = false
): void {
  if (debug) console.log(`Configuration des options pour ${chartType}`);

  if (chartType === 'pie' || chartType === 'donut') {
    configurePieOptions(options, chartType);
  } else {
    configurePolarOptions(options, chartType as 'polar' | 'radar' | 'radialBar');
  }
}
