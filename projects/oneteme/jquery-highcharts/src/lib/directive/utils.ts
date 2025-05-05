import { ElementRef, EventEmitter, NgZone } from '@angular/core';
import { ChartProvider, mergeDeep } from '@oneteme/jquery-core';
import * as Highcharts from 'highcharts';
import { ICONS } from '../../assets/icons/icons';

export type ChartCustomEvent = 'previous' | 'next' | 'pivot';

export function destroyChart(
  chart: Highcharts.Chart,
  debug: boolean = false
): void {
  if (chart) {
    try {
      // Supprimer la toolbar personnalisée avant de détruire le graphique
      if (chart.container) {
        const toolbar = chart.container.querySelector(
          '.highcharts-custom-toolbar'
        );
        if (toolbar) {
          // Supprimer les écouteurs d'événements sur le conteneur
          const container = chart.container;
          container.removeEventListener('mousemove', handleMouseMove);
          container.removeEventListener('mouseleave', handleMouseLeave);
          toolbar.remove();
        }
      }

      chart.destroy();
      if (debug) console.log('Graphique détruit avec succès');
    } catch (error) {
      console.error('Erreur lors de la destruction du graphique:', error);
    }
  }
}

// Gestionnaires d'événements pour la visibilité de la toolbar
function handleMouseMove(event) {
  const toolbar = event.currentTarget.querySelector(
    '.highcharts-custom-toolbar'
  );
  if (toolbar) toolbar.style.visibility = 'visible';
}

function handleMouseLeave(event) {
  const toolbar = event.currentTarget.querySelector(
    '.highcharts-custom-toolbar'
  );
  if (toolbar) toolbar.style.visibility = 'hidden';
}

/**
 * Initialise les options de base communes à tous les graphiques Highcharts
 * @param chartType Type de graphique (pie, column, bar, etc.)
 * @param isLoading État de chargement initial
 * @param debug Mode debug
 * @returns Options de base pour Highcharts
 */
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
    // pour supprimer la toolbar par défaut de Highcharts
    exporting: {
      enabled: false,
      buttons: {
        contextButton: {
          enabled: false,
        },
      },
    },
    credits: { enabled: false },
    series: [],
    xAxis: {},
    plotOptions: {},
  };
}

export function updateChartOptions(
  options: any,
  config: ChartProvider<any, any>,
  debug: boolean = false
): any {
  if (debug)
    console.log('Mise à jour des options du graphique avec config:', config);

  // Vérif si config n'est pas undefined
  if (!config) {
    console.warn('La configuration du graphique est undefined');
    return options;
  }

  // Options communes de base
  const baseOptions = {
    chart: {
      height: config.height ?? '100%',
      width: config.width ?? '100%',
      stacked: config.stacked,
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
      },
    },
    yAxis: {
      title: {
        text: config.ytitle,
      },
    },
  };

  // Fusionner les options de base avec les options personnalisées
  return mergeDeep({}, options, baseOptions, config.options ?? {});
}

export function setupToolbar(
  chart: Highcharts.Chart,
  config: ChartProvider<any, any>,
  customEvent: EventEmitter<ChartCustomEvent>,
  ngZone: NgZone,
  canPivot: boolean = true,
  debug: boolean = false
): void {
  if (!chart || !config.showToolbar) return;

  const container = chart.container;
  if (!container) return;

  try {
    // Supprimer toute toolbar existante
    const existingToolbar = container.querySelector(
      '.highcharts-custom-toolbar'
    );
    if (existingToolbar) {
      existingToolbar.remove();
    }

    // Créer un conteneur pour les boutons de navigation
    const toolbar = document.createElement('div');
    toolbar.className = 'highcharts-custom-toolbar';
    toolbar.style.position = 'absolute';
    toolbar.style.right = '3px';
    toolbar.style.top = '0px';
    toolbar.style.zIndex = '10';
    toolbar.style.display = 'flex';
    toolbar.style.visibility = 'hidden'; // Masqué par défaut
    toolbar.style.gap = '5px';

    // Bouton Précédent
    const prevButton = document.createElement('button');
    prevButton.innerHTML = ICONS.previous;
    prevButton.className = 'custom-icon';
    prevButton.title = 'Graphique précédent';
    prevButton.addEventListener('click', (event) => {
      // Empêcher la propagation de l'événement vers le conteneur
      event.stopPropagation();
      event.preventDefault();
      ngZone.run(() => customEvent.emit('previous'));
    });
    toolbar.appendChild(prevButton);

    // Bouton Suivant
    const nextButton = document.createElement('button');
    nextButton.innerHTML = ICONS.next;
    nextButton.className = 'custom-icon';
    nextButton.title = 'Graphique suivant';
    nextButton.addEventListener('click', (event) => {
      // Empêcher la propagation de l'événement vers le conteneur
      event.stopPropagation();
      event.preventDefault();
      ngZone.run(() => customEvent.emit('next'));
    });
    toolbar.appendChild(nextButton);

    // Bouton Pivot (si autorisé)
    if (canPivot) {
      const pivotButton = document.createElement('button');
      pivotButton.innerHTML = ICONS.pivot;
      pivotButton.className = 'custom-icon';
      pivotButton.title = 'Pivot';
      pivotButton.addEventListener('click', (event) => {
        // Empêcher la propagation de l'événement vers le conteneur
        event.stopPropagation();
        event.preventDefault();
        ngZone.run(() => customEvent.emit('pivot'));
      });
      toolbar.appendChild(pivotButton);
    }

    // Empêcher la propagation des événements de la toolbar vers le conteneur
    toolbar.addEventListener('click', (event) => {
      event.stopPropagation();
    });

    // Ajouter le toolbar au container
    container.appendChild(toolbar);

    // Ajouter les événements de visibilité (comme dans l'implémentation ApexCharts)
    container.removeEventListener('mousemove', handleMouseMove);
    container.removeEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    if (debug) console.log("Barre d'outils personnalisée configurée");
  } catch (error) {
    console.error(
      "Erreur lors de la configuration de la barre d'outils:",
      error
    );
  }
}

export function createHighchart(
  el: ElementRef,
  options: any,
  config: ChartProvider<any, any>,
  customEvent: EventEmitter<ChartCustomEvent>,
  ngZone: NgZone,
  canPivot: boolean = true,
  debug: boolean = false
): Highcharts.Chart {
  try {
    // Vérifier que l'élément DOM est disponible
    if (!el?.nativeElement) {
      if (debug) console.log('Élément DOM non disponible pour le rendu');
      return null;
    }

    // Cloner les options pour éviter de modifier l'original
    const chartOptions: Highcharts.Options = Highcharts.merge({}, options);

    // Forcer des dimensions explicites
    chartOptions.chart = chartOptions.chart || {};

    // Définir explicitement la taille du conteneur avant de créer le graphique
    const containerHeight = config.height ? parseInt(String(config.height)) : undefined;
    const containerWidth = config.width ? parseInt(String(config.width)) : undefined;

    if (debug) console.log(`Dimensions du conteneur: ${containerWidth}x${containerHeight}. la config : ${JSON.stringify(config)}`);

    // Définir explicitement la taille dans les options
    chartOptions.chart.width = containerWidth;
    chartOptions.chart.height = containerHeight;

    // Ajouter un événement pour configurer la toolbar après le rendu du graphique
    const originalRenderCallback = chartOptions.chart.events?.render;
    chartOptions.chart.events = chartOptions.chart.events || {};
    chartOptions.chart.events.render = function (this: Highcharts.Chart) {
      // Appeler le callback d'origine s'il existe
      if (typeof originalRenderCallback === 'function') {
        originalRenderCallback.call(this);
      }

      // Configurer la toolbar personnalisée
      ngZone.runOutsideAngular(() => {
        setupToolbar(this, config, customEvent, ngZone, canPivot, debug);
      });
    };

    if (debug) console.log('Création du graphique avec options:', chartOptions);

    return ngZone.runOutsideAngular(() => {
      // Créer le graphique avec des dimensions explicites
      const chartInstance = (Highcharts as any).chart(
        el.nativeElement,
        chartOptions
      );
      return chartInstance;
    });
  } catch (error) {
    console.error('Erreur lors de la création du graphique:', error);
    return null;
  }
}

/**
 * Met à jour l'état de chargement du graphique
 * @param options Options actuelles du graphique
 * @param chart Instance du graphique (optionnel)
 * @param isLoading Nouvel état de chargement
 * @param debug Mode debug
 */
export function updateLoading(
  options: any,
  chart: Highcharts.Chart | null,
  isLoading: boolean,
  debug: boolean = false
): void {
  const loadingText = isLoading ? 'Chargement des données...' : 'Aucune donnée';

  if (debug) console.log('Mise à jour du statut de chargement:', loadingText);

  mergeDeep(options, {
    lang: { noData: loadingText },
  });

  if (chart) {
    chart.update({ lang: { noData: loadingText } }, false, false, true);
  }
}

/**
 * Configure les options spécifiques au type de graphique pie/donut
 * @param options Options actuelles
 * @param type Type de graphique (pie ou donut)
 * @param debug Mode debug
 */
export function configurePieOptions(
  options: any,
  type: 'pie' | 'donut',
  debug: boolean = false
): void {
  if (debug) console.log('Configuration des options spécifiques pour', type);

  // Configuration spécifique pour le donut
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
        innerSize: type === 'donut' ? '50%' : 0,
      },
    },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>',
    },
  });
}
