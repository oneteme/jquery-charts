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
  legend: true,
};

const COMMON_PIE_PLOT_OPTIONS = {
  allowPointSelect: true,
  cursor: 'pointer',
  dataLabels: { enabled: false },
  tooltip: {
    headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
    pointFormat: '<span style="color:{point.color}">\u25CF</span> {point.name}: <b>{point.percentage:.1f}%</b> ({point.y})<br/>'
  }
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
    tooltip: {
      headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
      pointFormat: '<span style="color:{point.color}">\u25CF</span> {point.name}: <b>{point.y}</b><br/>'
    },
    legend: { enabled: false },
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
    tooltip: {
      headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
      pointFormat: '<span style="color:{point.color}">\u25CF</span> {point.name}: <b>{point.y}</b><br/>'
    },
    legend: { enabled: true },
  },
  radarArea: {
    chart: { polar: true, type: 'area' },
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
        fillOpacity: 0.5,
      },
      area: {
        fillOpacity: 0.5,
        marker: { enabled: true },
      },
    },
    tooltip: {
      headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
      pointFormat: '<span style="color:{point.color}">\u25CF</span> {point.name}: <b>{point.y}</b><br/>'
    },
    legend: { enabled: true },
  },
  radialBar: {
    chart: { polar: true, type: 'column', inverted: true },
    pane: { innerSize: '20%', endAngle: 360 },
    xAxis: {
      tickmarkPlacement: 'on',
      lineWidth: 0,
      gridLineWidth: 0,
      labels: { enabled: false },
      categories: []
    },
    yAxis: {
      gridLineInterpolation: 'circle',
      lineWidth: 0,
      gridLineWidth: 0,
      reversedStacks: false,
      min: 0
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
    legend: { enabled: false },
  },
  funnel: {
    chart: {
      events: {
        load: function() {
          const chart = this as Highcharts.Chart & { _animationTimers?: number[] };
          const series = chart.series[0];
          if (series?.points) {
            if (!chart._animationTimers) {
              chart._animationTimers = [];
            }

            series.points.forEach((point) => {
              if (point.graphic) {
                point.graphic.attr({
                  opacity: 0,
                  translateY: -20
                });
              }
            });
            series.points.forEach((point, index) => {
              if (point.graphic) {
                const timerId = setTimeout(() => {
                  if (point?.graphic?.animate && typeof point.graphic.animate === 'function') {
                    point.graphic.animate({
                      opacity: 1,
                      translateY: 0
                    }, {
                      duration: 300,
                      easing: 'easeOutBounce'
                    });
                  }
                }, index * 15) as unknown as number;
                if (chart._animationTimers) {
                  chart._animationTimers.push(timerId);
                }
              }
            });
          }
        }
      }
    },
    plotOptions: {
      funnel: { 
        dataLabels: { enabled: false }, 
        reversed: false,
        tooltip: {
          headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
          pointFormat: '<span style="color:{point.color}">\u25CF</span>{point.name}: <b>{point.percentage:.1f}%</b> ({point.y})<br/>'
        }
      },
    },
  },
  pyramid: {
    chart: {
      events: {
        load: function() {
          const chart = this as Highcharts.Chart & { _animationTimers?: number[] };
          const series = chart.series[0];
          if (series?.points) {
            if (!chart._animationTimers) {
              chart._animationTimers = [];
            }

            series.points.forEach((point) => {
              if (point.graphic) {
                point.graphic.attr({
                  opacity: 0,
                  translateY: -20
                });
              }
            });
            series.points.forEach((point, index) => {
              if (point.graphic) {
                const timerId = setTimeout(() => {
                  if (point?.graphic?.animate && typeof point.graphic.animate === 'function') {
                    point.graphic.animate({
                      opacity: 1,
                      translateY: 0
                    }, {
                      duration: 500,
                      easing: 'easeOutBounce'
                    });
                  }
                }, index * 20) as unknown as number;

                if (chart._animationTimers) {
                  chart._animationTimers.push(timerId);
                }
              }
            });
          }
        }
      }
    },
    plotOptions: {
      funnel: { 
        dataLabels: { enabled: false }, 
        reversed: true,
        tooltip: {
          headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
          pointFormat: '<span style="color:{point.color}">\u25CF</span>{point.name}: <b>{point.percentage:.1f}%</b> ({point.y})<br/>'
        }
      },
      pyramid: { 
        dataLabels: { enabled: false },
        tooltip: {
          headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
          pointFormat: '<span style="color:{point.color}">\u25CF</span>{point.name}: <b>{point.percentage:.1f}%</b> ({point.y})<br/>'
        }
      },
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
        tooltip: {
          headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
          pointFormat: '<span style="color:{point.color}">\u25CF</span> <b>{point.name}</b>: {point.value}<br/>'
        }
      },
    },
    colorAxis: {
      minColor: '#FFFFFF',
      maxColor: Highcharts.getOptions().colors[0],
    },
  },
  heatmap: {
    chart: {
      events: {
        load: function() {
          const chart = this as Highcharts.Chart & { _animationTimers?: number[] };
          const series = chart.series[0];
          
          chart.update({
            tooltip: {
              formatter: function() {
                const xCategory = this.series.chart.xAxis[0].categories[this.point.x];
                const yCategory = this.series.chart.yAxis[0].categories[this.point.y];
                return `<span style="font-size:11px">${this.series.name}</span><br>${xCategory} - ${yCategory}<br/>Valeur: <b>${this.point.value}</b>`;
              }
            }
          });
          
          if (series?.points) {
            if (!chart._animationTimers) {
              chart._animationTimers = [];
            }

            series.points.forEach((point) => {
              if (point.graphic) {
                point.graphic.attr({
                  opacity: 0,
                  scaleX: 0.3,
                  scaleY: 0.3
                });
              }
            });
            series.points.forEach((point, index) => {
              if (point.graphic) {
                const timerId = setTimeout(() => {
                  if (point?.graphic?.animate && typeof point.graphic.animate === 'function') {
                    point.graphic.animate({
                      opacity: 1,
                      scaleX: 1,
                      scaleY: 1
                    }, {
                      duration: 400,
                      easing: 'easeOutQuad'
                    });
                  }
                }, index * 25) as unknown as number;

                if (chart._animationTimers) {
                  chart._animationTimers.push(timerId);
                }
              }
            });
          }
        }
      }
    },
    plotOptions: {
      heatmap: {
        dataLabels: { enabled: true, color: '#000000' },
        cursor: 'pointer',
        tooltip: {
          headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
          pointFormat: '<b>Position ({point.x}, {point.y})</b><br/>Valeur: <b>{point.value}</b>'
        }
      },
    },
    colorAxis: {
      min: 0,
      minColor: '#FFFFFF',
      maxColor: Highcharts.getOptions().colors[0],
    },
  },
  scatter: {
    plotOptions: {
      scatter: {
        marker: {
          radius: 5,
          states: {
            hover: {
              enabled: true,
              lineColor: 'rgb(100,100,100)'
            }
          }
        },
        dataLabels: {
          enabled: false
        },
        tooltip: {
          headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
          pointFormat: '<span style="color:{point.color}">\u25CF</span> <b>{point.custom.month}</b>: {point.y}<br/>'
        }
      }
    },
    tooltip: {
      shared: false
    }
  },
  bubble: {
    plotOptions: {
      bubble: {
        minSize: 8,
        maxSize: 25,
        stickyTracking: false,
        findNearestPointBy: 'xy',
        dataLabels: {
          enabled: false
        },
        states: {
          hover: {
            enabled: true,
            halo: {
              size: 5,
              opacity: 0.25
            }
          }
        },
        tooltip: {
          headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
          pointFormat: '<span style="color:{point.color}">\u25CF</span> <b>{point.custom.month}</b>: {point.y}<br/>'
        }
      }
    },
    tooltip: {
      followPointer: false,
      shared: false
    }
  },
} as const;

export function initBaseChartOptions(
  chartType: string,
  debug: boolean = false
): any {
  debug && console.log('Initialisation des options de base pour', chartType);

  return {
    shouldRedraw: true,
    chart: { 
      type: chartType,
      backgroundColor: null
    },
    credits: { enabled: false },
    exporting: { 
      enabled: false, 
      buttons: { 
        contextButton: { 
          enabled: false 
        } 
      } 
    },
    lang: {
      noData: 'Aucune donnée à afficher'
    },
    noData: {
      style: {
        fontWeight: 'bold',
        fontSize: '15px',
        color: '#666666'
      }
    },
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

export function getBaseSimpleGraphOptions(
  chartType: keyof typeof CHART_TYPE_CONFIGS,
  debug: boolean = false
): any {
  debug && console.log(`Récupération de la config de base pour ${chartType}`);

  const config = CHART_TYPE_CONFIGS[chartType];
  if (!config) {
    debug && console.warn(`Configuration non trouvée pour le type: ${chartType}`);
    return {};
  }

  let baseOptions: any = {};

  baseOptions = JSON.parse(JSON.stringify(config));

  debug && console.log(`Config de base complète pour ${chartType}:`, baseOptions);

  return baseOptions;
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

  // Nettoyage complet des configurations précédentes
  cleanAllConfigs(options);

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

export function cleanAllConfigs(options: any, preserveUserConfig: boolean = false): void {
  let userPlotOptions: any = null;
  if (preserveUserConfig && options.plotOptions?.series) {
    userPlotOptions = JSON.parse(JSON.stringify(options.plotOptions.series));
  }

  cleanPolarConfigs(options);
  cleanPieConfigs(options);
  cleanAnimatedConfigs(options);
  cleanScatterBubbleConfigs(options);

  if (userPlotOptions && preserveUserConfig) {
    if (!options.plotOptions) options.plotOptions = {};
    if (!options.plotOptions.series) options.plotOptions.series = {};
    Object.assign(options.plotOptions.series, userPlotOptions);
  }
}

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
    delete options.xAxis.gridLineInterpolation;
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
    delete options.plotOptions.area;
    delete options.plotOptions.treemap;
    delete options.plotOptions.heatmap;
    if (options.plotOptions.series) {
      delete options.plotOptions.series.pointPlacement;
      delete options.plotOptions.series.pointStart;
      delete options.plotOptions.series.connectEnds;
      delete options.plotOptions.series.marker;
      delete options.plotOptions.series.fillOpacity;
    }
  }

  if (options.colorAxis) {
    delete options.colorAxis;
  }

  if (options.legend) {
    delete options.legend.enabled;
  }
}

function cleanPieConfigs(options: any): void {
  if (options.plotOptions) {
    delete options.plotOptions.pie;
    if (options.plotOptions.series) {
      delete options.plotOptions.series.innerSize;
      delete options.plotOptions.series.borderRadius;
      delete options.plotOptions.series.startAngle;
      delete options.plotOptions.series.endAngle;
      delete options.plotOptions.series.center;
      delete options.plotOptions.series.size;
      delete options.plotOptions.series.slicedOffset;
      delete options.plotOptions.series.allowPointSelect;
      delete options.plotOptions.series.cursor;
      delete options.plotOptions.series.dataLabels;
    }
  }
}

function cleanAnimatedConfigs(options: any): void {
  if (options.plotOptions) {
    delete options.plotOptions.funnel;
    delete options.plotOptions.pyramid;
    delete options.plotOptions.heatmap;
  }
  if (options.chart?.events) {
    delete options.chart.events;
  }
}

function cleanScatterBubbleConfigs(options: any): void {
  if (options.plotOptions) {
    delete options.plotOptions.scatter;
    delete options.plotOptions.bubble;
  }
  
  if (options.tooltip) {
    delete options.tooltip.headerFormat;
    delete options.tooltip.pointFormat;
    delete options.tooltip.shared;
    delete options.tooltip.followPointer;
  }
}

export function configureComplexGraphOptions(
  options: any,
  chartType: 'treemap' | 'heatmap' | 'scatter' | 'bubble',
  debug: boolean = false
): void {
  if (debug)
    console.log(`Configuration des options complexes pour ${chartType}`);

  cleanAllConfigs(options);

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
