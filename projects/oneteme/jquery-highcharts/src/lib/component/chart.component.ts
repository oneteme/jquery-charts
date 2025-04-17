import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ChartProvider, XaxisType, YaxisType } from '@oneteme/jquery-core';
import { ComplexChartDirective } from '../directive/complex-chart.directive';
import { SimpleChartDirective } from '../directive/simple-chart.directive';

@Component({
  standalone: true,
  imports: [CommonModule, ComplexChartDirective, SimpleChartDirective],
  selector: 'highcharts',
  templateUrl: './chart.component.html',
})
export class ChartComponent<X extends XaxisType, Y extends YaxisType> {
  protected _charts: {
    [key: string]: { possibleType: string[]; canPivot?: boolean };
  } = {
    pie: { possibleType: ['pie', 'donut'] },
    donut: { possibleType: ['pie', 'donut'] },
    line: { possibleType: ['line', 'area', 'spline', 'areaspline'] },
    area: { possibleType: ['line', 'area', 'spline', 'areaspline'] },
    spline: { possibleType: ['line', 'area', 'spline', 'areaspline'] },
    areaspline: { possibleType: ['line', 'area', 'spline', 'areaspline'] },
    bar: { possibleType: ['bar', 'column', 'columnpyramid'] },
    column: { possibleType: ['bar', 'column', 'columnpyramid'] },
    columnpyramid: { possibleType: ['bar', 'column', 'columnpyramid'] },
    funnel: { possibleType: ['funnel', 'pyramid'], canPivot: false },
    pyramid: { possibleType: ['funnel', 'pyramid'], canPivot: false },
    columnrange: {
      possibleType: ['columnrange', 'arearange', 'areasplinerange'],
      canPivot: false,
    },
    arearange: {
      possibleType: ['columnrange', 'arearange', 'areasplinerange'],
      canPivot: false,
    },
    areasplinerange: {
      possibleType: ['columnrange', 'arearange', 'areasplinerange'],
      canPivot: false,
    },
  };

  _type: string;

  @Input({ alias: 'type', required: true }) set value(type: string) {
    this._type = type;
  }
  @Input({ required: true }) config: ChartProvider<X, Y>;
  @Input({ required: true }) data: any[];
  @Input() isLoading: boolean;
  @Input() debug: boolean;
  @Output() customEvent: EventEmitter<string> = new EventEmitter();

  get type(): string {
    return this._type;
  }

  /**
   * Change le type de graphique ou effectue une rotation des données
   * @param event Événement personnalisé (previous, next, pivot)
   */
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

    if (event === 'pivot' && this._charts[this._type]?.canPivot !== false) {
      this.config = this.config.pivot
        ? { ...this.config, pivot: false }
        : { ...this.config, pivot: true };
      this.customEvent.emit('dataPivoted');
    }
  }
}
