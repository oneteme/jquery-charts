import { ElementRef, EventEmitter, NgZone } from '@angular/core';
import { ChartProvider } from '@oneteme/jquery-core';
import { Highcharts } from './highcharts-modules';
import { ChartCustomEvent } from './types';
import { sanitizeChartDimensions } from './chart-utils';
import { LoadingManager } from './loading-manager';

export function destroyChart(
  chart: Highcharts.Chart,
  loadingManager?: LoadingManager,
  debug: boolean = false
): void {
  if (!chart) return;

  try {
    if (loadingManager) loadingManager.destroy();

    if (chart.container) {
      const noDataMessage = chart.container.querySelector('.highcharts-no-data-message, .highcharts-no-data-overlay');
      if (noDataMessage) {
        noDataMessage.remove();
      }
    }

    if (chart && typeof chart.destroy === 'function') {
      if (chart.renderer && !chart.renderer.forExport) {
        chart.destroy();
        debug && console.log('Graphique détruit avec succès');
      } else if (debug) {
        console.log('Graphique déjà détruit ou en cours d\'export');
      }
    } else if (debug) {
      console.log('Graphique invalide, pas de destruction nécessaire');
    }
  } catch (error) {
    debug && console.error('Erreur lors de la destruction du graphique:', error);

    try {
      if (chart.container?.parentNode) {
        chart.container.innerHTML = '';
      }
    } catch (cleanupError) {
      if (debug) console.error('Erreur lors du nettoyage manuel:', cleanupError);
    }
  }
}

export function createHighchartsChart(
  el: ElementRef,
  options: any,
  config: ChartProvider<any, any>,
  customEvent: EventEmitter<ChartCustomEvent>,
  ngZone: NgZone,
  loadingManager: LoadingManager,
  canPivot: boolean = true,
  debug: boolean = false
): Promise<Highcharts.Chart | null> {
  return new Promise((resolve) => {
    try {
      if (!el?.nativeElement) {
        debug && console.log('Élément DOM non disponible pour le rendu');
        resolve(null);
        return;
      }

      const chartOptions: Highcharts.Options = Highcharts.merge({}, options);
      sanitizeChartDimensions(chartOptions, config);

      debug && console.log('Création du graphique avec options:', chartOptions);

      ngZone.runOutsideAngular(() => {
        const chartInstance = (Highcharts as any).chart(
          el.nativeElement,
          chartOptions,
          function (chart: Highcharts.Chart) {
            debug && console.log('Graphique rendu avec succès');
            resolve(chart);
          }
        );
      });
    } catch (error) {
      console.error('Erreur lors de la création du graphique:', error);
      resolve(null);
    }
  });
}
