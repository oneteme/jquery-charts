import { EventEmitter, NgZone } from '@angular/core';
import * as Highcharts from 'highcharts';
import { ICONS } from '../../../assets/icons/icons';
import { ChartCustomEvent, ToolbarOptions } from './types';

/**
 * Supprime la toolbar personnalisée d'un graphique
 */
export function removeToolbar(chart: Highcharts.Chart): void {
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

/**
 * Configure les événements du graphique pour ajouter la toolbar après le rendu
 */
export function configureChartEvents(
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