import { CommonChart, Coordinate2D, XaxisType, YaxisType, ChartProvider, mergeDeep } from '@oneteme/jquery-core';
import { ICONS } from '../../assets/icons/icons';
import { ElementRef, EventEmitter, NgZone, SimpleChanges } from '@angular/core';
import * as Highcharts from 'highcharts';

export type ChartCustomEvent = 'previous' | 'next' | 'pivot';

/**
 * Crée les boutons personnalisés pour la barre d'outils
 */
export function customIcons(
  event: (arg: ChartCustomEvent) => void,
  canPivot: boolean
): any[] {
  let customIcons = [
    {
      icon: ICONS.previous,
      title: 'Graphique précédent',
      class: 'custom-icon',
      click: function (chart) {
        event('previous');
      },
    },
    {
      icon: ICONS.next,
      title: 'Graphique suivant',
      class: 'custom-icon',
      click: function (chart) {
        event('next');
      },
    },
  ];

  if (canPivot) {
    customIcons.push({
      icon: ICONS.pivot,
      title: 'Pivot',
      class: 'custom-icon',
      click: function (chart) {
        event('pivot');
      },
    });
  }
  return customIcons;
}

export function determineXAxisDataType(value: any): string {
  if (value instanceof Date) {
    return 'datetime';
  } else if (typeof value === 'number') {
    return 'numeric';
  } else {
    return 'category';
  }
}

/**
 * Détermine le type d'axe X en fonction des données
 */
export function getType<
  X extends XaxisType,
  Y extends YaxisType | Coordinate2D
>(commonChart: CommonChart<X, Y>): string {
  if (commonChart.series.length && commonChart.series[0].data.length) {
    if (commonChart.continue) {
      const x = (<CommonChart<X, Coordinate2D>>commonChart).series[0].data[0].x;
      return determineXAxisDataType(x);
    } else {
      const categ = commonChart.categories[0];
      return determineXAxisDataType(categ);
    }
  }
  return 'datetime';
}

/**
 * Initialise les options de base communes à tous les graphiques
 */
export function initCommonChartOptions(
  node: ElementRef,
  customEvent: EventEmitter<ChartCustomEvent>,
  ngZone: NgZone,
  chartType: string,
  canPivot: boolean = true
): Highcharts.Options {
  return {
    chart: {
      type: chartType as any,
      events: {
        load: function() {
          // Ajouter des boutons personnalisés lors du chargement du graphique
          if (this.renderer && customEvent) {
            // Implémentation des boutons personnalisés
          }
        }
      }
    },
    title: {
      text: undefined
    },
    series: [],
    lang: {
      noData: 'Aucune donnée'
    },
    xAxis: {
      type: 'category'
    },
    yAxis: {
      title: {
        text: undefined
      }
    },
    plotOptions: {},
    credits: {
      enabled: false
    }
  };
}

/**
 * Met à jour les options communes du graphique en fonction de la configuration fournie
 */
export function updateCommonOptions<X extends XaxisType, Y extends YaxisType>(
  options: Highcharts.Options,
  config: ChartProvider<X, Y>
): Highcharts.Options {
  const updatedOptions = mergeDeep(
    options,
    {
      chart: {
        height: config.height ?? '100%',
        width: config.width ?? '100%',
      },
      title: {
        text: config.title,
      },
      subtitle: {
        text: config.subtitle,
      },
      xAxis: {
        title: {
          text: config.xtitle,
        }
      },
      yAxis: {
        title: {
          text: config.ytitle,
        }
      },
    },
    config.options
  );

  // Gérer les options spécifiques comme stacked pour les barres
  if (config.stacked && updatedOptions.plotOptions) {
    if (!updatedOptions.plotOptions.series) {
      updatedOptions.plotOptions.series = {};
    }
    if (!updatedOptions.plotOptions.column) {
      updatedOptions.plotOptions.column = {};
    }
    if (!updatedOptions.plotOptions.bar) {
      updatedOptions.plotOptions.bar = {};
    }

    updatedOptions.plotOptions.series.stacking = 'normal';
    updatedOptions.plotOptions.column.stacking = 'normal';
    updatedOptions.plotOptions.bar.stacking = 'normal';
  }

  return updatedOptions;
}

/**
 * Initialise un graphique Highcharts
 */
export function initChart(
  el: ElementRef,
  ngZone: NgZone,
  options: Highcharts.Options,
  chartInstance: any,
  highchartsInstance: typeof Highcharts,
  debug: boolean
): Highcharts.Chart {
  if (debug) {
    console.log('Initialisation du graphique Highcharts', { ...options });
  }

  return ngZone.runOutsideAngular(() => {
    try {
      const chart = highchartsInstance.chart(el.nativeElement, options);
      chartInstance.set(chart);
      return chart;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du graphique Highcharts:', error);
      return null;
    }
  });
}

/**
 * Met à jour les options du graphique de manière sécurisée
 */
export function updateChartOptions(
  chartInstance: Highcharts.Chart | null,
  ngZone: NgZone,
  options: Highcharts.Options,
  redraw: boolean = true,
  oneToOne: boolean = false
): void {
  if (!chartInstance) return;

  ngZone.runOutsideAngular(() => {
    try {
      chartInstance.update(options, redraw, oneToOne);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des options du graphique:', error);
    }
  });
}

/**
 * Fonction commune pour gérer l'hydratation des graphiques
 */
export function hydrateChart(
  changes: SimpleChanges,
  data: any[],
  chartConfig: ChartProvider<any, any>,
  options: Highcharts.Options,
  chartInstance: any,
  ngZone: NgZone,
  highchartsInstance: typeof Highcharts,
  updateDataFn: Function,
  destroyFn: Function,
  initFn: Function,
  debug: boolean
): void {
  if (debug) console.log('Hydratation du graphique Highcharts', { ...changes });

  // Gestion des mises à jour
  const needsDataUpdate = changes['data']?.currentValue ||
                         changes['config']?.currentValue ||
                         changes['type']?.currentValue;

  if (needsDataUpdate && data && chartConfig) {
    updateDataFn();
  }

  // Gestion de l'état de chargement
  if (changes['isLoading']) {
    const loadingState = changes['isLoading'].currentValue;
    if (chartInstance()) {
      if (loadingState) {
        chartInstance().showLoading('Chargement des données...');
      } else {
        chartInstance().hideLoading();
      }
    }
  }

  // Recréation du graphique si besoin
  if (options['shouldRedraw']) {
    if (debug) console.log('Recréation complète du graphique Highcharts nécessaire', changes);
    destroyFn();
    initFn();
    delete options['shouldRedraw'];
  }
}

/**
 * Fonction commune pour la destruction propre des graphiques
 */
export function destroyChart(chartInstance: any): void {
  if (chartInstance()) {
    chartInstance().destroy();
    chartInstance.set(null);
  }
}

/**
 * Convertit les données CommonChart en format Highcharts
 */
export function convertToHighchartsFormat<X extends XaxisType, Y extends YaxisType>(
  commonChart: CommonChart<X, Y | Coordinate2D>,
  chartType: string
): any[] {
  if (!commonChart.series || commonChart.series.length === 0) {
    return [];
  }

  return commonChart.series.map(series => {
    const seriesData = commonChart.continue
      ? series.data.map((point: any) => {
          return { x: point.x, y: point.y };
        })
      : series.data;

    return {
      name: series.name || '',
      data: seriesData,
      color: series.color,
      stack: series.stack,
      type: chartType
    };
  });
}
