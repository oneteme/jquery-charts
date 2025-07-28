import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ChartProvider, ChartType, XaxisType, YaxisType } from '@oneteme/jquery-core';
import { ComplexChartDirective } from '../directive/complex-chart.directive';
import { SimpleChartDirective } from '../directive/simple-chart.directive';
import { LoadingConfig } from '../directive/utils';
// import { MapChartDirective } from '../directive/map-chart.directive';

@Component({
  standalone: true,
  imports: [ CommonModule, ComplexChartDirective, SimpleChartDirective,
    //  MapChartDirective
   ],
  selector: 'h-chart',
  templateUrl: './chart.component.html',
})
export class ChartComponent<X extends XaxisType, Y extends YaxisType> {
  protected _charts: {
    [key: ChartType]: { possibleType: ChartType[]; canPivot?: boolean };
  } = {
    pie: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radialBar', 'bar', 'column', 'columnpyramid', 'line', 'area', 'spline', 'areaspline', 'scatter', 'bubble', 'treemap', 'heatmap'], canPivot: false },
    donut: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radialBar', 'bar', 'column', 'columnpyramid', 'line', 'area', 'spline', 'areaspline', 'scatter', 'bubble', 'treemap', 'heatmap'], canPivot: false },
    polar: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radialBar', 'bar', 'column', 'columnpyramid', 'line', 'area', 'spline', 'areaspline', 'scatter', 'bubble', 'treemap', 'heatmap'], canPivot: false },
    radar: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radialBar', 'bar', 'column', 'columnpyramid', 'line', 'area', 'spline', 'areaspline', 'scatter', 'bubble', 'treemap', 'heatmap'], canPivot: false },
    funnel: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radialBar', 'bar', 'column', 'columnpyramid', 'line', 'area', 'spline', 'areaspline', 'scatter', 'bubble', 'treemap', 'heatmap'], canPivot: false },
    pyramid: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radialBar', 'bar', 'column', 'columnpyramid', 'line', 'area', 'spline', 'areaspline', 'scatter', 'bubble', 'treemap', 'heatmap'], canPivot: false },
    radialBar: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radialBar', 'bar', 'column', 'columnpyramid', 'line', 'area', 'spline', 'areaspline', 'scatter', 'bubble', 'treemap', 'heatmap'], canPivot: false },
    bar: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radialBar', 'bar', 'column', 'columnpyramid', 'line', 'area', 'spline', 'areaspline', 'scatter', 'bubble', 'treemap', 'heatmap'], canPivot: false },
    column: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radialBar', 'bar', 'column', 'columnpyramid', 'line', 'area', 'spline', 'areaspline', 'scatter', 'bubble', 'treemap', 'heatmap'], canPivot: false },
    columnpyramid: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radialBar', 'bar', 'column', 'columnpyramid', 'line', 'area', 'spline', 'areaspline', 'scatter', 'bubble', 'treemap', 'heatmap'], canPivot: false },
    line: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radialBar', 'bar', 'column', 'columnpyramid', 'line', 'area', 'spline', 'areaspline', 'scatter', 'bubble', 'treemap', 'heatmap'], canPivot: false },
    area: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radialBar', 'bar', 'column', 'columnpyramid', 'line', 'area', 'spline', 'areaspline', 'scatter', 'bubble', 'treemap', 'heatmap'], canPivot: false },
    spline: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radialBar', 'bar', 'column', 'columnpyramid', 'line', 'area', 'spline', 'areaspline', 'scatter', 'bubble', 'treemap', 'heatmap'], canPivot: false },
    areaspline: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radialBar', 'bar', 'column', 'columnpyramid', 'line', 'area', 'spline', 'areaspline', 'scatter', 'bubble', 'treemap', 'heatmap'], canPivot: false },
    columnrange: { possibleType: ['columnrange', 'arearange', 'areasplinerange'], canPivot: false },
    arearange: { possibleType: ['columnrange', 'arearange', 'areasplinerange'], canPivot: false },
    areasplinerange: { possibleType: ['columnrange', 'arearange', 'areasplinerange'], canPivot: false },
    scatter: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radialBar', 'bar', 'column', 'columnpyramid', 'line', 'area', 'spline', 'areaspline', 'scatter', 'bubble', 'treemap', 'heatmap'], canPivot: false },
    bubble: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radialBar', 'bar', 'column', 'columnpyramid', 'line', 'area', 'spline', 'areaspline', 'scatter', 'bubble', 'treemap', 'heatmap'], canPivot: false },
    heatmap: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radialBar', 'bar', 'column', 'columnpyramid', 'line', 'area', 'spline', 'areaspline', 'scatter', 'bubble', 'treemap', 'heatmap'], canPivot: false },
    treemap: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radialBar', 'bar', 'column', 'columnpyramid', 'line', 'area', 'spline', 'areaspline', 'scatter', 'bubble', 'treemap', 'heatmap'], canPivot: false },
    // map: { possibleType: ['map'], canPivot: false },
  };

  _type: ChartType;

  @Input({ alias: 'type', required: true }) set value(type: ChartType) {
    this._type = type;
  }
  @Input({ required: true }) config: ChartProvider<X, Y>;
  @Input({ required: true }) data: any[];
  @Input() loadingConfig: LoadingConfig = {};
  @Input() debug: boolean;
  @Output() customEvent: EventEmitter<string> = new EventEmitter();

  get type(): string {
    return this._type;
  }

  private static readonly SIMPLE_CHART_TYPES = new Set(['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radialBar']);

  private static readonly COMPLEX_CHART_TYPES = new Set(['bar', 'column', 'columnpyramid', 'line', 'area', 'spline', 'areaspline', 'columnrange', 'arearange', 'areasplinerange', 'scatter', 'bubble', 'heatmap', 'treemap']);

  get canPivot(): boolean {
    return this._charts[this._type]?.canPivot !== false;
  }

  get isSimpleChart(): boolean {
    return ChartComponent.SIMPLE_CHART_TYPES.has(this._type);
  }

  get isComplexChart(): boolean {
    return ChartComponent.COMPLEX_CHART_TYPES.has(this._type);
  }

  get isMapChart(): boolean {
    return this._type === 'map';
  }

  change(event: string): void {
    const charts = this._charts[this._type]?.possibleType;

    if (charts && charts.length > 0) {
      const indexOf = charts.indexOf(this._type);
      if (indexOf !== -1) {
        if (event === 'previous') {
          this._type =
            indexOf === 0 ? charts[charts.length - 1] : charts[indexOf - 1];
          this.customEvent.emit('typeChanged');
          return;
        }
        if (event === 'next') {
          this._type =
            indexOf === charts.length - 1 ? charts[0] : charts[indexOf + 1];
          this.customEvent.emit('typeChanged');
          return;
        }
      }
    }

    if (event === 'pivot' && this.canPivot) {
      this.config = this.config.pivot
        ? { ...this.config, pivot: false }
        : { ...this.config, pivot: true };
      this.customEvent.emit('dataPivoted');
    }
  }
}
