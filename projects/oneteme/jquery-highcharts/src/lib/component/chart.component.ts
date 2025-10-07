import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  ChartProvider,
  ChartType,
  XaxisType,
  YaxisType,
} from '@oneteme/jquery-core';
import { ChartDirective } from '../directive/chart.directive';
import { ChartCustomEvent } from '../directive/utils';

@Component({
  standalone: true,
  imports: [ChartDirective],
  selector: 'chart',
  template: `<div
    chart-directive
    [type]="_type"
    [config]="config"
    [data]="data"
    [debug]="debug"
    [canPivot]="enablePivot && _charts[_type]?.canPivot !== false"
    [isLoading]="isLoading"
    (customEvent)="change($event)"
    style="width: 100%; height: 100%;"
  ></div>`,
})
export class ChartComponent<X extends XaxisType, Y extends YaxisType> {
  protected _charts: {
    [key: ChartType]: { possibleType: ChartType[]; canPivot?: boolean };
  } = {
    pie: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radarArea', 'radialBar', 'line', 'area', 'spline', 'areaspline', 'bar', 'column'], canPivot: false },
    donut: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radarArea', 'radialBar', 'line', 'area', 'spline', 'areaspline', 'bar', 'column'], canPivot: false },
    line: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radarArea', 'radialBar', 'line', 'area', 'spline', 'areaspline', 'bar', 'column'], canPivot: false },
    area: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radarArea', 'radialBar', 'line', 'area', 'spline', 'areaspline', 'bar', 'column'], canPivot: false },
    spline: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radarArea', 'radialBar', 'line', 'area', 'spline', 'areaspline', 'bar', 'column'], canPivot: false },
    areaspline: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radarArea', 'radialBar', 'line', 'area', 'spline', 'areaspline', 'bar', 'column'], canPivot: false },
    bar: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radarArea', 'radialBar', 'line', 'area', 'spline', 'areaspline', 'bar', 'column'], canPivot: false },
    column: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radarArea', 'radialBar', 'line', 'area', 'spline', 'areaspline', 'bar', 'column'], canPivot: false },
    funnel: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radarArea', 'radialBar', 'line', 'area', 'spline', 'areaspline', 'bar', 'column'], canPivot: false },
    pyramid: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radarArea', 'radialBar', 'line', 'area', 'spline', 'areaspline', 'bar', 'column'], canPivot: false },
    // scatter: { possibleType: ['scatter', 'bubble'], canPivot: false },
    // bubble: { possibleType: ['scatter', 'bubble'], canPivot: false },

    // Graphiques polaires
    polar: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radarArea', 'radialBar', 'line', 'area', 'spline', 'areaspline', 'bar', 'column'], canPivot: false },
    radar: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radarArea', 'radialBar', 'line', 'area', 'spline', 'areaspline', 'bar', 'column'], canPivot: false },
    radarArea: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radarArea', 'radialBar', 'line', 'area', 'spline', 'areaspline', 'bar', 'column'], canPivot: false },
    radialBar: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radarArea', 'radialBar', 'line', 'area', 'spline', 'areaspline', 'bar', 'column'], canPivot: false },
  };

  _type: ChartType;

  @Input({ alias: 'type', required: true }) set value(type: ChartType) {
    this._type = type;
  }
  @Input({ required: true }) config!: ChartProvider<X, Y>;
  @Input({ required: true }) data!: any[];
  @Input() debug: boolean = true;
  @Input() isLoading: boolean = false;
  @Input() enablePivot: boolean = false;

  @Output() customEvent = new EventEmitter<ChartCustomEvent>();

  change(event: ChartCustomEvent) {
    const charts = this._charts[this._type]?.possibleType;
    if (!charts) return;

    const indexOf = charts.indexOf(this._type);
    if (indexOf !== -1) {
      if (event === 'previous') {
        this._type = indexOf === 0 ? charts[charts.length - 1] : charts[indexOf - 1];
        return;
      }
      if (event === 'next') {
        this._type = indexOf === charts.length - 1 ? charts[0] : charts[indexOf + 1];
        return;
      }
    }
    if (event === 'pivot') {
      this.config = this.config.pivot
        ? { ...this.config, pivot: false }
        : { ...this.config, pivot: true };
    }

    // Émettre l'événement vers le parent
    this.customEvent.emit(event);
  }
}
