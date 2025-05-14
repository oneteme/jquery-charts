import { ElementRef, EventEmitter, NgZone } from '@angular/core';
import { ChartProvider } from '@oneteme/jquery-core';
import * as Highcharts from 'highcharts';

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

export type ToolbarOptions = {
  chart: Highcharts.Chart;
  config: ChartProvider<any, any>;
  customEvent: EventEmitter<ChartCustomEvent>;
  ngZone: NgZone;
  canPivot?: boolean;
  debug?: boolean;
}
