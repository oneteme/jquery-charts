import { ElementRef, EventEmitter, NgZone } from '@angular/core';
import { ChartProvider } from '@oneteme/jquery-core';
import * as Highcharts from 'highcharts';
import more from 'highcharts/highcharts-more';
import { ChartCustomEvent } from './types';
import { configureChartEvents, removeToolbar } from './chart-toolbar';
import { sanitizeChartDimensions } from './chart-utils';

more(Highcharts);

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
    if (!el?.nativeElement) {
      if (debug) console.log('Élément DOM non disponible pour le rendu');
      return null;
    }

    const chartOptions: Highcharts.Options = Highcharts.merge({}, options);
    sanitizeChartDimensions(chartOptions, config);

    configureChartEvents(chartOptions, {
      chart: null,
      config,
      customEvent,
      ngZone,
      canPivot,
      debug,
    });

    if (debug) console.log('Création du graphique avec options:', chartOptions);

    const chartInstance = ngZone.runOutsideAngular(() => {
      return (Highcharts as any).chart(el.nativeElement, chartOptions);
    });

    return chartInstance;
  } catch (error) {
    console.error('Erreur lors de la création du graphique:', error);
    return null;
  }
}
