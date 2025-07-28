import { ElementRef, EventEmitter, NgZone } from '@angular/core';
import { ChartProvider } from '@oneteme/jquery-core';
import { Highcharts } from './highcharts-modules';

export type ChartCustomEvent = 'previous' | 'next' | 'pivot' | 'togglePercent';

export interface ChartCreationOptions {
  el: ElementRef;
  options: Highcharts.Options;
  config: ChartProvider<any, any>;
  customEvent: EventEmitter<ChartCustomEvent>;
  ngZone: NgZone;
  canPivot?: boolean;
  isLoading?: boolean;
  debug?: boolean;
}

export interface ToolbarOptions {
  chart: Highcharts.Chart;
  config: ChartProvider<any, any>;
  customEvent: EventEmitter<ChartCustomEvent>;
  ngZone: NgZone;
  canPivot?: boolean;
  debug?: boolean;
}

export function isTreemapData(data: any[]): boolean {
  return data.every(
    (item) =>
      item &&
      typeof item.value === 'number' &&
      item.value > 0 &&
      (item.name || item.category || item.month)
  );
}

export function isHeatmapData(data: any[]): boolean {
  return data.every(
    (item) =>
      item &&
      typeof item.value === 'number' &&
      (item.month || item.category || item.name) &&
      (item.team || item.series)
  );
}
