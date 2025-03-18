import { CommonChart, Coordinate2D, XaxisType, YaxisType, ChartProvider, mergeDeep } from '@oneteme/jquery-core';
import { ICONS } from '../../assets/icons/icons';
import { ElementRef, EventEmitter, NgZone, SimpleChanges } from '@angular/core';
import Highcharts from 'highcharts';
import { asapScheduler, observeOn, Subscription } from 'rxjs';
import { fromPromise } from 'rxjs/internal/observable/innerFrom';

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
      click: function (chart, options, e) {
        event('previous');
      },
    },
    {
      icon: ICONS.next,
      title: 'Graphique suivant',
      class: 'custom-icon',
      click: function (chart, options, e) {
        event('next');
      },
    },
  ];

  if (canPivot) {
    customIcons.push({
      icon: ICONS.pivot,
      title: 'Pivot',
      class: 'custom-icon',
      click: function (chart, options, e) {
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
) {
  return {
    shouldRedraw: true,
    chart: {
      type: chartType,
      toolbar: {
        show: false,
        tools: {
          download: false,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false,
          customIcons: customIcons((arg) => {
            ngZone.run(() => customEvent.emit(arg));
          }, canPivot),
        },
      },
      events: {
        mouseMove: function () {
          let toolbar = node.nativeElement.querySelector('.apexcharts-toolbar');
          if (toolbar) toolbar.style.visibility = 'visible';
        },
        mouseLeave: function () {
          let toolbar = node.nativeElement.querySelector('.apexcharts-toolbar');
          if (toolbar) toolbar.style.visibility = 'hidden';
        },
      },
      zoom: {
        enabled: false,
      },
    },
    series: [],
    noData: {
      text: 'Aucune donnée',
    },
    xaxis: {},
    plotOptions: {},
  };
}

/**
 * Met à jour les options communes du graphique en fonction de la configuration fournie
 */
export function updateCommonOptions<X extends XaxisType, Y extends YaxisType>(
  options: any,
  config: ChartProvider<X, Y>
) {

  const existingBarHorizontal = options?.plotOptions?.bar?.horizontal;
  const updatedOptions = mergeDeep(
    options,
    {
      chart: {
        height: config.height ?? '100%',
        width: config.width ?? '100%',
        stacked: config.stacked,
        toolbar: {
          show: config.showToolbar ?? false,
        },
      },
      title: {
        text: config.title,
      },
      subtitle: {
        text: config.subtitle,
      },
      xaxis: {
        title: {
          text: config.xtitle,
        },
      },
      yaxis: {
        title: {
          text: config.ytitle,
        },
      },
    },
    config.options
  );

  const userSetHorizontal = config.options?.plotOptions?.bar?.horizontal !== undefined;

  if (existingBarHorizontal !== undefined && !userSetHorizontal) {
    if (!updatedOptions.plotOptions) updatedOptions.plotOptions = {};
    if (!updatedOptions.plotOptions.bar) updatedOptions.plotOptions.bar = {};
    updatedOptions.plotOptions.bar.horizontal = existingBarHorizontal;
  }

  return updatedOptions;
}

/**
 * Initialise un graphique ApexCharts de façon sécurisée
 */
export function initChart(
  el: ElementRef,
  ngZone: NgZone,
  options: any,
  chartInstance: any,
  subscription: Subscription,
  debug: boolean
) {
  if (debug) {
    console.log('Initialisation du graphique', { ...options });
  }

  // Exécution en dehors de la zone Angular pour de meilleures performances
  return ngZone.runOutsideAngular(() => {
    try {
      let chart = new ApexCharts(el.nativeElement, { ...options });
      chartInstance.set(chart);

      // Utilisation de fromPromise pour gérer le rendu asynchrone
      const renderSubscription = fromPromise(
        chart.render()
          .then(() => debug && console.log(new Date().getMilliseconds(), 'Rendu du graphique terminé'))
          .catch(error => {
            console.error('Erreur lors du rendu du graphique:', error);
            chartInstance.set(null);
          })
      )
      .pipe(observeOn(asapScheduler))
      .subscribe({
        next: () => debug && console.log(new Date().getMilliseconds(), 'Observable rendu terminé'),
        error: (error) => console.error('Erreur dans le flux Observable:', error)
      });

      // Ajout au gestionnaire d'abonnements
      subscription.add(renderSubscription);

      return chart;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du graphique:', error);
      return null;
    }
  });
}

/**
 * Met à jour les options du graphique de manière sécurisée
 */
export function updateChartOptions(
  chartInstance: ApexCharts | null,
  ngZone: NgZone,
  options: any,
  redrawPaths: boolean = true,
  animate: boolean = true,
  updateSyncedCharts: boolean = false
): Promise<void> {
  if (!chartInstance) return Promise.resolve();

  return ngZone.runOutsideAngular(() =>
    chartInstance.updateOptions(
      { ...options },
      redrawPaths,
      animate,
      updateSyncedCharts
    ).catch(error => {
      console.error('Erreur lors de la mise à jour des options:', error);
      return Promise.resolve();
    })
  );
}

/**
 * Fonction commune pour gérer l'hydratation des graphiques
 */
export function hydrateChart(
  changes: SimpleChanges,
  data: any[],
  chartConfig: ChartProvider<any, any>,
  options: any,
  chartInstance: any,
  ngZone: NgZone,
  updateDataFn: Function,
  destroyFn: Function,
  initFn: Function,
  updateOptionsFn: Function,
  debug: boolean
): void {
  if (debug) console.log('Hydratation du graphique', { ...changes });

  // Optimisation: regroupement des types de changements pour éviter les opérations redondantes
  const needsDataUpdate = changes['data'] || changes['config'] || changes['type'];
  const needsOptionsUpdate = Object.keys(changes).some(key => !['debug'].includes(key));

  // Mise à jour des données si nécessaire
  if (needsDataUpdate && data && chartConfig) {
    updateDataFn();
  }

  // Mise à jour spécifique pour isLoading
  if (changes['isLoading'] && chartInstance()) {
    options.noData.text = changes['isLoading'].currentValue
      ? 'Chargement des données...'
      : 'Aucune donnée';

    // Mise à jour immédiate des options de noData sans redessiner complètement
    updateChartOptions(chartInstance(), ngZone, {
      noData: options.noData
    }, false, false, false);
  }

  // Stratégie de mise à jour optimisée
  if (options.shouldRedraw) {
    if (debug) console.log('Recréation complète du graphique nécessaire', changes);
    destroyFn();
    initFn();
    delete options.shouldRedraw;
  } else if (needsOptionsUpdate) {
    if (debug) console.log('Mise à jour des options du graphique', changes);
    updateOptionsFn();
  }
}

/**
 * Fonction commune pour la destruction propre des graphiques
 */
export function destroyChart(chartInstance: any, subscription: Subscription): void {
  // Désabonnement pour éviter les fuites de mémoire
  subscription.unsubscribe();

  // Nettoyage de l'instance du graphique
  if (chartInstance()) {
    chartInstance().destroy();
    chartInstance.set(null);
  }
}
