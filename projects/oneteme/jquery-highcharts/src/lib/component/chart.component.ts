import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ChartProvider, ChartType, XaxisType, YaxisType } from '@oneteme/jquery-core';
import { ComplexChartDirective } from '../directive/complex-chart.directive';
import { SimpleChartDirective } from '../directive/simple-chart.directive';
import { LoadingConfig } from '../directive/utils';

@Component({
  standalone: true,
  imports: [ CommonModule, ComplexChartDirective, SimpleChartDirective ],
  selector: 'chart',
  templateUrl: './chart.component.html',
})
export class ChartComponent<X extends XaxisType, Y extends YaxisType> {
  private static readonly ALL_CHART_TYPES: ChartType[] = [
    'pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radarArea', 'radialBar', 'bar', 'column', 'columnpyramid', 'line', 'area', 'spline', 'areaspline', 'scatter', 'bubble', 'treemap', 'heatmap'
  ];

  private static readonly RANGE_CHART_TYPES: ChartType[] = ['columnrange', 'arearange', 'areasplinerange'];

  protected _charts: {
    [key: ChartType]: { possibleType: ChartType[]; canPivot?: boolean };
  } = {
    pie: { possibleType: ChartComponent.ALL_CHART_TYPES, canPivot: false },
    donut: { possibleType: ChartComponent.ALL_CHART_TYPES, canPivot: false },
    polar: { possibleType: ChartComponent.ALL_CHART_TYPES, canPivot: false },
    radar: { possibleType: ChartComponent.ALL_CHART_TYPES, canPivot: false },
    radarArea: { possibleType: ChartComponent.ALL_CHART_TYPES, canPivot: false },
    funnel: { possibleType: ChartComponent.ALL_CHART_TYPES, canPivot: false },
    pyramid: { possibleType: ChartComponent.ALL_CHART_TYPES, canPivot: false },
    radialBar: { possibleType: ChartComponent.ALL_CHART_TYPES, canPivot: false },
    bar: { possibleType: ChartComponent.ALL_CHART_TYPES, canPivot: false },
    column: { possibleType: ChartComponent.ALL_CHART_TYPES, canPivot: false },
    columnpyramid: { possibleType: ChartComponent.ALL_CHART_TYPES, canPivot: false },
    line: { possibleType: ChartComponent.ALL_CHART_TYPES, canPivot: false },
    area: { possibleType: ChartComponent.ALL_CHART_TYPES, canPivot: false },
    spline: { possibleType: ChartComponent.ALL_CHART_TYPES, canPivot: false },
    areaspline: { possibleType: ChartComponent.ALL_CHART_TYPES, canPivot: false },
    columnrange: { possibleType: ChartComponent.RANGE_CHART_TYPES, canPivot: false },
    arearange: { possibleType: ChartComponent.RANGE_CHART_TYPES, canPivot: false },
    areasplinerange: { possibleType: ChartComponent.RANGE_CHART_TYPES, canPivot: false },
    scatter: { possibleType: ChartComponent.ALL_CHART_TYPES, canPivot: false },
    bubble: { possibleType: ChartComponent.ALL_CHART_TYPES, canPivot: false },
    heatmap: { possibleType: ChartComponent.ALL_CHART_TYPES, canPivot: false },
    treemap: { possibleType: ChartComponent.ALL_CHART_TYPES, canPivot: false },
    // map: { possibleType: ['map'], canPivot: false },
  };

  _type: ChartType;
  _possibleType?: ChartType[];

  @Input({ alias: 'type', required: true }) set value(type: ChartType) {
    this._type = type;
    this.validateTypeWithPossibleTypes();
  }
  @Input({ required: true }) config: ChartProvider<X, Y>;
  @Input({ required: true }) data: any[];
  @Input() loadingConfig: LoadingConfig = {};
  @Input() debug: boolean;
  @Input() set possibleType(types: ChartType[] | undefined) {
    this._possibleType = types;
    this.validateTypeWithPossibleTypes();
  }
  @Output() customEvent: EventEmitter<string> = new EventEmitter();

  get type(): string {
    return this._type;
  }

  private static readonly SIMPLE_CHART_TYPES = new Set(['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radarArea', 'radialBar']);

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

  private validateTypeWithPossibleTypes(): void {
    if (this._type && this._possibleType && this._possibleType.length > 0) {
      if (!this._possibleType.includes(this._type)) {
        const errorMessage = `Le type de graphique "${this._type}" n'est pas inclus dans la liste des types possibles [${this._possibleType.join(', ')}]. ` +
          `Veuillez inclure "${this._type}" dans la propriété [possibleType] ou changer le type initial.`;

        console.error('ChartComponent - Erreur de validation:', errorMessage);
        throw new Error(errorMessage);
      }
    }
  }

  change(event: string): void {
    const charts = this._possibleType || this._charts[this._type]?.possibleType;

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
