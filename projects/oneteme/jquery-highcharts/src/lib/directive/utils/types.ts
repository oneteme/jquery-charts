import { ElementRef, EventEmitter, NgZone } from '@angular/core';
import { ChartProvider } from '@oneteme/jquery-core';
import * as Highcharts from 'highcharts';

export type ChartCustomEvent = 'previous' | 'next' | 'pivot' | 'togglePercent';

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

export type ToolbarOptions = {
  chart: Highcharts.Chart;
  config: ChartProvider<any, any>;
  customEvent: EventEmitter<ChartCustomEvent>;
  ngZone: NgZone;
  canPivot?: boolean;
  debug?: boolean;
}

/**
 * Interface pour les résultats d'analyse des données
 */
export interface DataAnalysisResult {
  isAlreadyPercentage: boolean;
  hasDecimalValues: boolean;
  maxValue: number;
  minValue: number;
  averageValue: number;
  totalValue: number;
  dataCount: number;
  suggestedFormat: 'percentage' | 'decimal' | 'integer';
}

/**
 * Configuration pour l'affichage en pourcentage
 */
export interface PercentageDisplayConfig {
  showPercent: boolean;
  forceConversion?: boolean; // Force la conversion même si les données semblent déjà être en %
  decimalPlaces?: number; // Nombre de décimales pour l'affichage
  autoDetect?: boolean; // Détection automatique si les données sont déjà en %
  debug?: boolean;
}
