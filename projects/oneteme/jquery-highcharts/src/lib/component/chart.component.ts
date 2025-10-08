import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  ChartProvider,
  ChartType,
  XaxisType,
  YaxisType,
} from '@oneteme/jquery-core';
import { ChartDirective } from '../directive/chart.directive';
import { ChartCustomEvent } from '../directive/utils';

const STANDARD_CHARTS: ChartType[] = [
  'line',
  'area',
  'spline',
  'areaspline',
  'bar',
  'column',
  'scatter',
];
const SIMPLE_CHARTS: ChartType[] = ['pie', 'donut', 'funnel', 'pyramid'];
const POLAR_CHARTS: ChartType[] = ['polar', 'radar', 'radarArea', 'radialBar'];
const RANGE_CHARTS: ChartType[] = [
  'columnrange',
  'arearange',
  'areasplinerange',
];
const BUBBLE_CHARTS: ChartType[] = ['bubble'];
const HEATMAP_CHARTS: ChartType[] = ['heatmap'];
const TREEMAP_CHARTS: ChartType[] = ['treemap'];

const ALL_COMPATIBLE_CHARTS: ChartType[] = [
  ...STANDARD_CHARTS,
  ...SIMPLE_CHARTS,
  ...POLAR_CHARTS,
  ...RANGE_CHARTS,
  ...BUBBLE_CHARTS,
  ...HEATMAP_CHARTS,
  ...TREEMAP_CHARTS,
];

@Component({
  standalone: true,
  imports: [ChartDirective],
  selector: 'chart',
  template: `<div
    chart-directive
    [type]="_type"
    [config]="config"
    [data]="data"
    [possibleTypes]="possibleTypes"
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
    line: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: true },
    area: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: true },
    spline: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: true },
    areaspline: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: true },
    bar: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: true },
    column: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: true },
    scatter: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },

    pie: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },
    donut: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },
    funnel: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },
    pyramid: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },

    polar: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },
    radar: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },
    radarArea: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },
    radialBar: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },

    columnrange: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },
    arearange: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },
    areasplinerange: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },

    bubble: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },

    heatmap: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },

    treemap: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },
  };

  _type: ChartType;

  @Input({ alias: 'type', required: true }) set value(type: ChartType) {
    this._type = type;
  }
  @Input({ required: true }) config!: ChartProvider<X, Y>;
  @Input({ required: true }) data!: any[];
  @Input() possibleTypes?: ChartType[];
  @Input() debug: boolean = true;
  @Input() isLoading: boolean = false;
  @Input() enablePivot: boolean = false;

  @Output() customEvent = new EventEmitter<ChartCustomEvent>();

  change(event: ChartCustomEvent) {
    // Utiliser possibleTypes fourni par l'utilisateur, sinon fallback sur la config par défaut
    const charts = this.possibleTypes || this._charts[this._type]?.possibleType;
    if (!charts) return;

    const indexOf = charts.indexOf(this._type);
    if (indexOf !== -1) {
      if (event === 'previous') {
        this._type =
          indexOf === 0 ? charts[charts.length - 1] : charts[indexOf - 1];
        return;
      }
      if (event === 'next') {
        this._type =
          indexOf === charts.length - 1 ? charts[0] : charts[indexOf + 1];
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
