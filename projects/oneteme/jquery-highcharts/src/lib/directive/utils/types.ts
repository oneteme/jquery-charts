import { ElementRef, EventEmitter, NgZone } from '@angular/core';
import { ChartProvider } from '@oneteme/jquery-core';
import * as Highcharts from 'highcharts';

/**
 * Type pour les événements personnalisés du graphique
 */
export type ChartCustomEvent = 'previous' | 'next' | 'pivot';

/**
 * Options pour la création d'un graphique
 */
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