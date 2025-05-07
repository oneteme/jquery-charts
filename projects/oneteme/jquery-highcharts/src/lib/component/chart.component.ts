import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ChartProvider, ChartType, XaxisType, YaxisType } from '@oneteme/jquery-core';
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
    [key: ChartType]: { possibleType: ChartType[]; canPivot?: boolean };
  } = {
    pie: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'pictorial'] },
    donut: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'pictorial'] },
    polar: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'pictorial'], canPivot: false },
    radar: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'pictorial'], canPivot: false },
    funnel: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'pictorial'], canPivot: false },
    pyramid: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'pictorial'], canPivot: false },
    pictorial: { possibleType: ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'pictorial'], canPivot: false },
    bar: { possibleType: ['bar', 'column', 'columnpyramid'] },
    column: { possibleType: ['bar', 'column', 'columnpyramid'] },
    columnpyramid: { possibleType: ['bar', 'column', 'columnpyramid'] },
    line: { possibleType: ['line', 'area', 'spline', 'areaspline'] },
    area: { possibleType: ['line', 'area', 'spline', 'areaspline'] },
    spline: { possibleType: ['line', 'area', 'spline', 'areaspline'] },
    areaspline: { possibleType: ['line', 'area', 'spline', 'areaspline'] },
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
    scatter: { possibleType: ['scatter', 'bubble'] },
    bubble: { possibleType: ['scatter', 'bubble'] },
    radialBar: { possibleType: ['radialBar'] },
    gauge: { possibleType: ['gauge'] },
    variablepie: { possibleType: ['variablepie'] },
    heatmap: { possibleType: ['heatmap'] },
    treemap: { possibleType: ['treemap'] },
    lollipop: { possibleType: ['lollipop'] },
  };

  _type: ChartType;

  @Input({ alias: 'type', required: true }) set value(type: ChartType) {
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
   * Vérifie si le type de graphique actuel permet le pivotage
   * Par défaut, tous les types sont pivotables sauf si canPivot est explicitement défini à false
   */
  get canPivot(): boolean {
    return this._charts[this._type]?.canPivot !== false;
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

    if (event === 'pivot' && this.canPivot) {
      this.config = this.config.pivot
        ? { ...this.config, pivot: false }
        : { ...this.config, pivot: true };
      this.customEvent.emit('dataPivoted');
    }
  }
}
