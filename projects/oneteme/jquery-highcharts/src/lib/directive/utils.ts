import { ElementRef, EventEmitter, NgZone } from '@angular/core';
import { ChartProvider, mergeDeep } from '@oneteme/jquery-core';
import * as Highcharts from 'highcharts';
import { ICONS } from '../../assets/icons/icons';

/**
 * Détruit proprement un graphique Highcharts
 * @param chart Instance du graphique à détruire
 * @param debug Mode debug pour afficher des logs
 */
export function destroyChart(
  chart: Highcharts.Chart,
  debug: boolean = false
): void {
  if (chart) {
    try {
      chart.destroy();
      if (debug) console.log('Graphique détruit avec succès');
    } catch (error) {
      console.error('Erreur lors de la destruction du graphique:', error);
    }
  }
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
    lang: {
      noData: loadingText,
    },
    chart: {
      type: chartType,
      animation: false, // Désactiver les animations pour éviter les problèmes de rendu
      backgroundColor: 'transparent',
      events: {},
    },
    tooltip: {
      enabled: true,
    },
    exporting: {
      enabled: false,
      buttons: {
        contextButton: {
          menuItems: [
            'downloadPNG',
            'downloadJPEG',
            'downloadPDF',
            'downloadSVG',
          ],
        },
      },
    },
    credits: { enabled: false },
    title: {
      text: undefined,
    },
    subtitle: {
      text: undefined,
    },
  };
}

/**
 * Met à jour les options communes d'un graphique
 * @param options Options actuelles
 * @param config Configuration du graphique
 * @param el Référence à l'élément DOM
 * @param debug Mode debug
 * @returns Options mises à jour
 */
export function updateChartOptions(
  options: any,
  config: ChartProvider<any, any>,
  el: ElementRef,
  debug: boolean = false
): any {
  if (debug)
    console.log('Mise à jour des options du graphique avec config:', config);

  // Vérifier que config n'est pas undefined
  if (!config) {
    console.warn('La configuration du graphique est undefined');
    return options;
  }

  // Options communes de base
  const baseOptions = {
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
    exporting: {
      enabled: config.showToolbar ?? false,
    },
  };

  // Fusionner les options de base avec les options personnalisées
  return mergeDeep({}, options, baseOptions, config.options ?? {});
}

/**
 * Configure la barre d'outils personnalisée pour les contrôles de navigation
 * @param chart Instance du graphique
 * @param config Configuration du graphique
 * @param customEvent Émetteur d'événements
 * @param ngZone Service NgZone
 * @param canPivot Possibilité de pivoter le graphique
 * @param debug Mode debug
 */
export function setupToolbar(
  chart: Highcharts.Chart,
  config: ChartProvider<any, any>,
  customEvent: EventEmitter<string>,
  ngZone: NgZone,
  canPivot: boolean = false,
  debug: boolean = false
): void {
  if (!chart || !config.showToolbar) return;

  const container = chart.container;
  if (!container) return;

  try {
    // Créer un conteneur pour les boutons de navigation
    const toolbar = document.createElement('div');
    toolbar.className = 'highcharts-custom-toolbar';
    toolbar.style.position = 'absolute';
    toolbar.style.right = '10px';
    toolbar.style.top = '10px';
    toolbar.style.zIndex = '10';

    // Bouton Précédent
    const prevButton = document.createElement('button');
    prevButton.innerHTML = ICONS.previous;
    prevButton.className = 'highcharts-custom-button';
    prevButton.title = 'Type précédent';
    prevButton.addEventListener('click', () => {
      ngZone.run(() => customEvent.emit('previous'));
    });

    // Bouton Suivant
    const nextButton = document.createElement('button');
    nextButton.innerHTML = ICONS.next;
    nextButton.className = 'highcharts-custom-button';
    nextButton.title = 'Type suivant';
    nextButton.addEventListener('click', () => {
      ngZone.run(() => customEvent.emit('next'));
    });

    // Bouton Pivot (si autorisé)
    if (canPivot) {
      const pivotButton = document.createElement('button');
      pivotButton.innerHTML = ICONS.pivot;
      pivotButton.className = 'highcharts-custom-button';
      pivotButton.title = 'Pivoter les données';
      pivotButton.addEventListener('click', () => {
        ngZone.run(() => customEvent.emit('pivot'));
      });
      toolbar.appendChild(pivotButton);
    }

    // Ajouter les boutons au toolbar
    toolbar.appendChild(prevButton);
    toolbar.appendChild(nextButton);

    // Ajouter le toolbar au container
    container.appendChild(toolbar);

    if (debug) console.log("Barre d'outils personnalisée configurée");
  } catch (error) {
    console.error(
      "Erreur lors de la configuration de la barre d'outils:",
      error
    );
  }
}

/**
 * Crée un graphique Highcharts avec gestion des dimensions
 * @param el Référence à l'élément DOM
 * @param options Options du graphique
 * @param ngZone Service NgZone
 * @param debug Mode debug
 * @returns Instance du graphique Highcharts créée
 */
export function createHighchart(
  el: ElementRef,
  options: any,
  ngZone: NgZone,
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
    chart.update({ lang: { noData: loadingText } }, false);
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
