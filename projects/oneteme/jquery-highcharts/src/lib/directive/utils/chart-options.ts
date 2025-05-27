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
          format: '<b>{point.name}</b>: {point.y}',
        },
        // showInLegend: true,
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
      endAngle: chartType === 'radialBar' ? 270 : 360,
    },
    legend: {
      enabled: true,
      align: 'center',
      verticalAlign: 'bottom',
      layout: 'horizontal'
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
      min: 0,
      gridLineWidth: chartType === 'radialBar' ? 0 : 1,
      reversedStacks: chartType === 'radialBar' ? false : undefined,
      labels: {
        enabled: true
      }
    },
    tooltip: {
      shared: true,
      useHTML: true,
      headerFormat: '<span style="font-size: 10px">{point.key}</span><br/>',
      pointFormat: '<span style="color:{point.color}">\u25CF</span> <span style="font-weight: 700">{series.name}</span>: <b>{point.y}</b><br/>',
      valueDecimals: 2
    },
    plotOptions: {
      series: {
        pointPlacement: 'between',
        pointStart: 0,
        connectEnds: true,
        showInLegend: true,
        dataLabels: {
          enabled: true,
          formatter: function() {
            return '<b>' + this.point.name + '</b>: ' + this.y;
          }
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
  });
}

function configureFunnelOptions(options: any, chartType: 'funnel' | 'pyramid'): void {
  mergeDeep(options, {
    chart: {
      type: chartType,
    },
    legend: {
      enabled: true,
      align: 'center',
      verticalAlign: 'bottom',
      layout: 'horizontal'
    },
    // tooltip: {
    //   headerFormat: '',
    //   pointFormat: '<span style="color:{point.color}">●</span> <b>{point.name}</b>: <b>{point.y}</b><br/>' // valeur classique par défaut
    // },
    // tooltip: {
    //   useHTML: true,
    //   headerFormat: '<span style="font-size: 12px">{point.key}</span><br/>',
    //   pointFormat: '<span style="color:{point.color}">●</span> {point.name} {point.y}' // valeur classique par défaut
    // },
    plotOptions: {
      funnel: {
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: {point.y}', // valeur classique par défaut
          softConnector: true
        },
        reversed: chartType === 'pyramid',
        neckWidth: '30%',
        neckHeight: '25%',
        width: '80%',
        center: ['50%', '50%'],
        showInLegend: true
      },
      pyramid: {
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: {point.y}', // valeur classique par défaut
          softConnector: true
        },
        width: '80%',
        center: ['50%', '50%'],
        showInLegend: true
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

/**
 * Active ou désactive l'affichage en pourcentage pour les dataLabels et tooltips
 * pour les types pie, donut, funnel, pyramid
 */
export function togglePercentDisplay(options: any, showPercent: boolean) {
  const chartTypes = ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radialBar'];

  // Helper function to set format for a specific plotOption
  const setFormatForPlotOption = (plotOption: any) => {
    if (!plotOption) return;

    if (plotOption.dataLabels) {
      plotOption.dataLabels.format = showPercent
        ? '<b>{point.name}</b>: {point.percentage:.1f}%'
        : '<b>{point.name}</b>: {point.y}';
    }
  };

  // Update dataLabels format for all applicable chart types
  chartTypes.forEach(type => {
    if (options.plotOptions?.[type]) {
      options.plotOptions[type].dataLabels = options.plotOptions[type].dataLabels ?? {};
      setFormatForPlotOption(options.plotOptions[type]);
    }
  });

  // Special case for pie which is used by donut too
  if (options.plotOptions?.pie) {
    setFormatForPlotOption(options.plotOptions.pie);
  }

  // Update tooltip format if it exists
  if (options.tooltip) {
    options.tooltip.pointFormat = showPercent
      ? '<span style="color:{point.color}">●</span> <b>{point.name}</b>: <b>{point.percentage:.1f}%</b><br/>'
      : '<span style="color:{point.color}">●</span> <b>{point.name}</b>: <b>{point.y}</b><br/>';
  }
}
