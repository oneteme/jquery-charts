import { EventEmitter, NgZone } from '@angular/core';
import * as Highcharts from 'highcharts';
import { ICONS } from '../../../assets/icons/icons';
import { ChartCustomEvent, ToolbarOptions } from './types';

export function removeToolbar(chart: Highcharts.Chart): void {
  if (!chart.container) return;

  const toolbar = chart.container.querySelector('.highcharts-custom-toolbar');
  if (!toolbar) return;

  const container = chart.container;
  container.removeEventListener('mousemove', handleMouseMove);
  container.removeEventListener('mouseleave', handleMouseLeave);
  toolbar.remove();
}

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

export function setupToolbar(options: ToolbarOptions): void {
  const { chart, config, customEvent, ngZone, canPivot = true, debug = false } = options;

  if (!chart || !config.showToolbar) return;
  if (!chart.container) return;

  try {
    removeToolbar(chart);
    const container = chart.container;

    const toolbar = document.createElement('div');
    toolbar.className = 'highcharts-custom-toolbar';
    toolbar.style.position = 'absolute';

    const hasExportButton = chart.options.exporting?.enabled === true;

    toolbar.style.right = hasExportButton ? '2.9em' : '3px';
    toolbar.style.top = hasExportButton ? '1.1em' : '0px';
    toolbar.style.color = hasExportButton ? '#555555' : '#000';
    toolbar.style.zIndex = '10';
    toolbar.style.display = 'flex';
    toolbar.style.visibility = 'hidden'; // Masqué par défaut
    toolbar.style.gap = '11px';

    toolbar.appendChild(createToolbarButton(ICONS.percent, 'Afficher les valeurs en pourcentages', 'togglePercent', ngZone, customEvent));
    toolbar.appendChild(createToolbarButton(ICONS.previous, 'Graphique précédent', 'previous', ngZone, customEvent));
    toolbar.appendChild(createToolbarButton(ICONS.next, 'Graphique suivant', 'next', ngZone, customEvent));

    if (canPivot) {
      toolbar.appendChild(createToolbarButton(ICONS.pivot, 'Pivot', 'pivot', ngZone, customEvent));
    }

    toolbar.addEventListener('click', (event) => {
      event.stopPropagation();
    });
    container.appendChild(toolbar);
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

export function configureChartEvents(
  chartOptions: Highcharts.Options,
  toolbarOptions: ToolbarOptions
): void {
  const originalRenderCallback = chartOptions.chart?.events?.render;
  chartOptions.chart.events = chartOptions.chart.events || {};

  chartOptions.chart.events.render = function (this: Highcharts.Chart) {
    if (typeof originalRenderCallback === 'function') {
      originalRenderCallback.call(this);
    }

    toolbarOptions.chart = this;

    toolbarOptions.ngZone.runOutsideAngular(() => {
      setupToolbar(toolbarOptions);
    });
  };
}
