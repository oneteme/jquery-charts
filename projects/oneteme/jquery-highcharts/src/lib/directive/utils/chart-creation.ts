import { ElementRef, EventEmitter, NgZone } from '@angular/core';
import { ChartProvider } from '@oneteme/jquery-core';
import * as Highcharts from 'highcharts';
import more from 'highcharts/highcharts-more';
import { ChartCustomEvent } from './types';
import { configureChartEvents, removeToolbar } from './chart-toolbar';
import { setChartLoadingState } from './chart-loading';

// Initialisation des modules Highcharts
more(Highcharts);

/**
 * Détruit proprement un graphique Highcharts
 */
export function destroyChart(
  chart: Highcharts.Chart,
  debug: boolean = false
): void {
  if (!chart) return;

  try {
    removeToolbar(chart);
    chart.destroy();
    if (debug) console.log('Graphique détruit avec succès');
  } catch (error) {
    console.error('Erreur lors de la destruction du graphique:', error);
  }
}

/**
 * Détermine les dimensions du graphique en fonction de la configuration
 */
function determineDimensions(
  el: ElementRef,
  config: ChartProvider<any, any>,
  debug: boolean = false
): { width: number; height: number } {
  // Si des dimensions sont spécifiées dans la configuration, les utiliser
  let configWidth: number | undefined = undefined;
  if (config.width) {
    configWidth =
      typeof config.width === 'number'
        ? config.width
        : parseInt(String(config.width), 10);
  }

  let configHeight: number | undefined = undefined;
  if (config.height) {
    configHeight =
      typeof config.height === 'number'
        ? config.height
        : parseInt(String(config.height), 10);
  }

  // Obtenir les dimensions du parent si possible
  let parentWidth = undefined;
  let parentHeight = undefined;

  if (el?.nativeElement?.parentElement) {
    const parent = el.nativeElement.parentElement;
    parentWidth = parent.clientWidth ?? parent.offsetWidth;
    parentHeight = parent.clientHeight ?? parent.offsetHeight;
  }

  let finalWidth: number, finalHeight: number;
  if (
    (!isNaN(configWidth) && configWidth > 0) ||
    (!isNaN(configHeight) && configHeight > 0)
  ) {
    finalWidth = configWidth;
    finalHeight = configHeight;
  } else if (
    (parentWidth && parentWidth > 0) ||
    (parentHeight && parentHeight > 0)
  ) {
    finalHeight = configHeight ?? parentHeight;
    finalWidth = configHeight ?? parentWidth;
  } else {
    finalWidth = null;
    finalHeight = null;
  }

  if (debug) {
    console.log(
      `Dimensions du parent: ${parentWidth ?? 'non disponible'}x${
        parentHeight ?? 'non disponible'
      }`
    );
    console.log(
      `Dimensions configurées: ${configWidth ?? 'non spécifié'}x${
        configHeight ?? 'non spécifié'
      }`
    );
    console.log(
      `Dimensions finales du graphique: ${finalWidth}x${finalHeight}`
    );
  }

  return { width: finalWidth, height: finalHeight };
}

/**
 * Crée une instance de graphique Highcharts
 */
export function createHighchart(
  el: ElementRef,
  options: any,
  config: ChartProvider<any, any>,
  customEvent: EventEmitter<ChartCustomEvent>,
  ngZone: NgZone,
  canPivot: boolean = true,
  isLoading: boolean = false,
  debug: boolean = false
): Highcharts.Chart {
  try {
    if (!el?.nativeElement) {
      if (debug) console.log('Élément DOM non disponible pour le rendu');
      return null;
    }

    // Clone options pour éviter de modifier l'original
    const chartOptions: Highcharts.Options = Highcharts.merge({}, options);
    chartOptions.chart = chartOptions.chart || {};

    // Déterminer les dimensions
    const { width, height } = determineDimensions(el, config, debug);

    // N'appliquer les dimensions que si elles sont spécifiées
    if (width !== undefined) chartOptions.chart.width = width;
    if (height !== undefined) chartOptions.chart.height = height;

    // Si aucune dimension n'est spécifiée, utiliser 100%
    if (width === undefined && height === undefined) {
      chartOptions.chart.height = '100%';
      chartOptions.chart.width = '100%';
    }

    if (debug)
      console.log(
        `Dimensions du graphique: ${chartOptions.chart.width || 'auto'}x${
          chartOptions.chart.height || 'auto'
        }`
      );

    // Configurer les événements du graphique pour la toolbar
    configureChartEvents(chartOptions, {
      chart: null, // Sera défini après création
      config,
      customEvent,
      ngZone,
      canPivot,
      debug,
    });

    if (debug) console.log('Création du graphique avec options:', chartOptions);

    // Créer l'instance du graphique
    const chartInstance = ngZone.runOutsideAngular(() => {
      return (Highcharts as any).chart(el.nativeElement, chartOptions);
    });

    // Appliquer l'état de chargement si nécessaire
    if (isLoading) {
      setChartLoadingState(
        chartInstance,
        true,
        'Chargement des données...',
        debug
      );
    }

    return chartInstance;
  } catch (error) {
    console.error('Erreur lors de la création du graphique:', error);
    return null;
  }
}

