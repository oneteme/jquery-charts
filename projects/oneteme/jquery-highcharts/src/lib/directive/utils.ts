import { ElementRef, EventEmitter, NgZone } from '@angular/core';
import { ChartProvider, CommonChart, Coordinate2D, mergeDeep, XaxisType, YaxisType } from '@oneteme/jquery-core';
import * as Highcharts from 'highcharts';
import { ICONS } from '../../assets/icons/icons';

export type ChartCustomEvent = 'previous' | 'next' | 'pivot';

export type ChartCreationOptions = {
  el: ElementRef;
  options: any;
  config: ChartProvider<any, any>;
  customEvent: EventEmitter<ChartCustomEvent>;
  ngZone: NgZone;
  canPivot?: boolean;
  isLoading?: boolean;
  debug?: boolean;
}

/**
 * Interface pour les options de la toolbar
 */
export type ToolbarOptions = {
  chart: Highcharts.Chart;
  config: ChartProvider<any, any>;
  customEvent: EventEmitter<ChartCustomEvent>;
  ngZone: NgZone;
  canPivot?: boolean;
  debug?: boolean;
}

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
 * Supprime la toolbar personnalisée d'un graphique
 */
function removeToolbar(chart: Highcharts.Chart): void {
  if (!chart.container) return;

  const toolbar = chart.container.querySelector('.highcharts-custom-toolbar');
  if (!toolbar) return;

  // Supprimer les écouteurs d'événements sur le conteneur
  const container = chart.container;
  container.removeEventListener('mousemove', handleMouseMove);
  container.removeEventListener('mouseleave', handleMouseLeave);
  toolbar.remove();
}

/**
 * Gère l'affichage de la toolbar au survol
 */
function handleMouseMove(event) {
  const toolbar = event.currentTarget.querySelector(
    '.highcharts-custom-toolbar'
  );
  if (toolbar) toolbar.style.visibility = 'visible';
}

/**
 * Masque la toolbar lorsque la souris quitte le graphique
 */
function handleMouseLeave(event) {
  const toolbar = event.currentTarget.querySelector(
    '.highcharts-custom-toolbar'
  );
  if (toolbar) toolbar.style.visibility = 'hidden';
}

/**
 * Initialise les options de base communes à tous les graphiques Highcharts
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
      type: chartType || 'line',
    },

    // Ne pas désactiver l'export par défaut, laissez l'utilisateur le configurer
    credits: { enabled: false },
    series: [],
    xAxis: {},
    plotOptions: {},
    // Configuration pour l'affichage du message "Pas de données"
    noData: {
      style: {
        fontSize: '16px',
        color: '#666',
        fontWeight: 'bold',
      },
    },
    // Configuration du loading
    loading: {
      labelStyle: {
        color: '#666',
        fontSize: '16px',
        fontWeight: 'bold',
      },
      style: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        opacity: 1,
      },
    },
  };
}

/**
 * Crée un bouton pour la toolbar personnalisée
 */
function createToolbarButton(
  icon: string,
  title: string,
  eventName: ChartCustomEvent,
  ngZone: NgZone,
  emitter: EventEmitter<ChartCustomEvent>
): HTMLButtonElement {
  const button = document.createElement('button');
  button.innerHTML = icon;
  button.className = 'custom-icon';
  button.title = title;

  button.addEventListener('click', (event) => {
    event.stopPropagation();
    event.preventDefault();
    ngZone.run(() => emitter.emit(eventName));
  });

  return button;
}

/**
 * Configure la toolbar personnalisée du graphique
 */
export function setupToolbar(options: ToolbarOptions): void {
  const {
    chart,
    config,
    customEvent,
    ngZone,
    canPivot = true,
    debug = false,
  } = options;

  if (!chart || !config.showToolbar) return;
  if (!chart.container) return;

  try {
    // Supprimer toute toolbar existante
    removeToolbar(chart);
    const container = chart.container;

    // Créer un conteneur pour les boutons de navigation
    const toolbar = document.createElement('div');
    toolbar.className = 'highcharts-custom-toolbar';
    toolbar.style.position = 'absolute';

    // Vérifier si le bouton d'export de Highcharts est visible
    const hasExportButton = chart.options.exporting?.enabled === true;

    // Ajuster la position en fonction de la présence du bouton d'export
    toolbar.style.right = hasExportButton ? '2.9em' : '3px';
    toolbar.style.top = hasExportButton ? '1.1em' : '0px';
    toolbar.style.color = hasExportButton ? '#555555' : '#000';
    toolbar.style.zIndex = '10';
    toolbar.style.display = 'flex';
    toolbar.style.visibility = 'hidden'; // Masqué par défaut
    toolbar.style.gap = '11px';

    // Ajouter les boutons de navigation
    toolbar.appendChild(
      createToolbarButton(
        ICONS.previous,
        'Graphique précédent',
        'previous',
        ngZone,
        customEvent
      )
    );

    toolbar.appendChild(
      createToolbarButton(
        ICONS.next,
        'Graphique suivant',
        'next',
        ngZone,
        customEvent
      )
    );

    if (canPivot) {
      toolbar.appendChild(
        createToolbarButton(ICONS.pivot, 'Pivot', 'pivot', ngZone, customEvent)
      );
    }

    // Empêcher la propagation des événements de la toolbar vers le conteneur
    toolbar.addEventListener('click', (event) => {
      event.stopPropagation();
    });

    // Ajouter la toolbar au container
    container.appendChild(toolbar);

    // Ajouter les événements de visibilité
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

// Détermine les dimensions du graphique en fonction de la configuration
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

/**
 * Configure les événements du graphique pour ajouter la toolbar après le rendu
 */
function configureChartEvents(
  chartOptions: Highcharts.Options,
  toolbarOptions: ToolbarOptions
): void {
  const originalRenderCallback = chartOptions.chart?.events?.render;
  chartOptions.chart.events = chartOptions.chart.events || {};

  chartOptions.chart.events.render = function (this: Highcharts.Chart) {
    // Appeler le callback d'origine s'il existe
    if (typeof originalRenderCallback === 'function') {
      originalRenderCallback.call(this);
    }

    // Mettre à jour l'instance du graphique dans les options de la toolbar
    toolbarOptions.chart = this;

    // Configurer la toolbar personnalisée
    toolbarOptions.ngZone.runOutsideAngular(() => {
      setupToolbar(toolbarOptions);
    });
  };
}

/**
 * Met à jour l'état de chargement d'un graphique
 */
export function setChartLoadingState(
  chart: Highcharts.Chart | null,
  isLoading: boolean,
  loadingText: string = 'Chargement des données...',
  debug: boolean = false
): void {
  if (!chart) {
    if (debug)
      console.warn(
        'Aucune instance de graphique fournie pour la mise à jour du chargement.'
      );
    return;
  }

  if (debug)
    console.log(
      `Mise à jour de l'état de chargement: ${
        isLoading ? 'Chargement en cours' : 'Chargement terminé'
      }`
    );

  if (isLoading) {
    // Configurer et afficher l'indicateur de chargement
    chart.showLoading(loadingText);

    // S'assurer que le message est correctement stylisé
    const loadingEl = chart.container?.querySelector('.highcharts-loading');
    if (loadingEl) {
      loadingEl.setAttribute('style', 'opacity: 1; visibility: visible');
    }

    const loadingTextEl = chart.container?.querySelector(
      '.highcharts-loading-inner'
    );
    if (loadingTextEl) {
      loadingTextEl.setAttribute(
        'style',
        'font-size: 16px; font-weight: bold; color: #666'
      );
    }
  } else {
    // Masquer l'indicateur de chargement
    chart.hideLoading();

    // Vérifier si le graphique a des données
    const hasSeries = chart.series.length > 0;
    const hasData =
      hasSeries &&
      chart.series.some(
        (series) => series.visible && series.points && series.points.length > 0
      );

    if (!hasData) {
      // Mettre à jour le message "pas de données"
      chart.update(
        {
          lang: { noData: 'Aucune donnée disponible' },
        },
        false,
        false,
        false
      );
    }
  }
}

/**
 * Met à jour l'état de chargement du graphique et ses options
 */
export function updateLoading(
  options: any,
  chart: Highcharts.Chart | null,
  isLoading: boolean,
  debug: boolean = false
): void {
  const loadingText = isLoading ? 'Chargement des données...' : 'Aucune donnée';

  if (debug) console.log('Mise à jour du statut de chargement:', loadingText);

  // Mettre à jour les options
  mergeDeep(options, {
    lang: { noData: loadingText },
  });

  // Si un graphique est fourni, utiliser la fonction centralisée
  if (chart) {
    setChartLoadingState(chart, isLoading, loadingText, debug);
  }
}

/**
 * Configure les options spécifiques au type de graphique pie/donut
 */
export function configurePieOptions(
  options: any,
  type: 'pie' | 'donut',
  debug: boolean = false
): void {
  if (debug) console.log('Configuration des options spécifiques pour', type);

  // Configuration spécifique pour le pie/donut
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
    // tooltip: {
    //   pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>',
    // },
  });
}

/**
 * Configure les options spécifiques pour les graphiques de type polar et radar
 */
export function configureCircleGraphOptions(
  options: any,
  chartType: 'pie' | 'donut' |'polar' | 'radar' | 'radialBar',
  debug: boolean = false
): void {
  if (debug) console.log(`Configuration des options pour ${chartType}`);

  // Configuration de base pour les graphiques polaires et radar
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

/**
 * Détermine le type de données pour l'axe X
 */
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
