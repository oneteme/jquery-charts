import { Component, EventEmitter, Input, Output } from '@angular/core';import { Component, EventEmitter, Input, Output } from '@angular/core';import { Component, EventEmitter, Input, Output } from '@angular/core';import { Component, EventEmitter, Input, Output } from '@angular/core';

import { ChartProvider, ChartType, XaxisType, YaxisType } from '@oneteme/jquery-core';

import { ChartDirective } from '../directive/chart.directive';import { ChartProvider, ChartType, XaxisType, YaxisType } from '@oneteme/jquery-core';



@Component({import { ChartDirective } from '../directive/chart.directive';import { ChartProvider, ChartType, XaxisType, YaxisType } from '@oneteme/jquery-core';import { ChartProvider, ChartType, XaxisType, YaxisType } from '@oneteme/jquery-core';

  standalone: true,

  imports: [ChartDirective],

  selector: 'chart',

  template: `<div chart-directive [type]="type" [config]="config" [data]="data" [possibleType]="possibleType" [debug]="debug" (customEvent)="onCustomEvent($event)" style="height: 100%; width: 100%;"></div>`@Component({import { ChartDirective } from '../directive/chart.directive';import { ChartDirective } from '../directive/chart.directive';

})

export class ChartComponent<X extends XaxisType, Y extends YaxisType> {  standalone: true,

  @Input({ required: true }) type!: ChartType;

  @Input({ required: true }) config!: ChartProvider<X, Y>;  imports: [ChartDirective],

  @Input({ required: true }) data!: any[];

  @Input() possibleType?: ChartType[];  selector: 'chart',

  @Input() debug: boolean = false;

  @Output() customEvent = new EventEmitter<string>();  template: `@Component({@Component({



  onCustomEvent(event: string): void {    <div

    if (event === 'previous' || event === 'next') {

      this.switchChartType(event);      chart-directive  standalone: true,  standalone: true,

    }

    this.customEvent.emit(event);      [type]="type"

  }

      [config]="config"  imports: [ChartDirective],  imports: [ChartDirective],

  private switchChartType(direction: 'previous' | 'next'): void {

    const availableTypes = this.possibleType || this.getDefaultTypes();      [data]="data"

    const currentIndex = availableTypes.indexOf(this.type);

          [possibleType]="possibleType"  selector: 'chart',  selector: 'chart',

    if (currentIndex === -1) return;

          [debug]="debug"

    let newIndex: number;

    if (direction === 'next') {      (customEvent)="onCustomEvent($event)"  template: `  template: `

      newIndex = currentIndex === availableTypes.length - 1 ? 0 : currentIndex + 1;

    } else {      style="height: 100%; width: 100%;">

      newIndex = currentIndex === 0 ? availableTypes.length - 1 : currentIndex - 1;

    }    </div>    <div     <div



    this.type = availableTypes[newIndex];  `

  }

})      chart-directive      chart-directive

  private getDefaultTypes(): ChartType[] {

    return ['pie', 'donut', 'bar', 'column', 'line', 'area', 'spline'];export class ChartComponent<X extends XaxisType, Y extends YaxisType> {

  }

}  @Input({ required: true }) type!: ChartType;      [type]="type"      [type]="type"

  @Input({ required: true }) config!: ChartProvider<X, Y>;

  @Input({ required: true }) data!: any[];      [config]="config"      [config]="config"

  @Input() possibleType?: ChartType[];

  @Input() debug: boolean = false;      [data]="data"      [data]="data"

  @Output() customEvent = new EventEmitter<string>();

      [possibleType]="possibleType"      [possibleType]="possibleType"

  onCustomEvent(event: string): void {

    if (event === 'previous' || event === 'next') {      [debug]="debug"      [debug]="debug"

      this.switchChartType(event);

    }      (customEvent)="onCustomEvent($event)"      (customEvent)="onCustomEvent($event)"

    this.customEvent.emit(event);

  }      style="height: 100%; width: 100%;">      style="height: 100%; width: 100%;">



  private switchChartType(direction: 'previous' | 'next'): void {    </div>    </div>

    const availableTypes = this.possibleType || this.getDefaultTypes();

    const currentIndex = availableTypes.indexOf(this.type);  `  `



    if (currentIndex === -1) return;})})



    let newIndex: number;export class ChartComponent<X extends XaxisType, Y extends YaxisType> {export class ChartComponent<X extends XaxisType, Y extends YaxisType> {

    if (direction === 'next') {

      newIndex = currentIndex === availableTypes.length - 1 ? 0 : currentIndex + 1;  @Input({ required: true }) type!: ChartType;  @Input({ required: true }) type!: ChartType;

    } else {

      newIndex = currentIndex === 0 ? availableTypes.length - 1 : currentIndex - 1;  @Input({ required: true }) config!: ChartProvider<X, Y>;  @Input({ required: true }) config!: ChartProvider<X, Y>;

    }

      @Input({ required: true }) data!: any[];  @Input({ required: true }) data!: any[];

    this.type = availableTypes[newIndex];

  }  @Input() possibleType?: ChartType[];  @Input() possibleType?: ChartType[];



  private getDefaultTypes(): ChartType[] {  @Input() debug: boolean = false;  @Input() debug: boolean = false;

    return ['pie', 'donut', 'bar', 'column', 'line', 'area', 'spline'];

  }  @Output() customEvent = new EventEmitter<string>();  @Output() customEvent = new EventEmitter<string>();

}


  onCustomEvent(event: string): void {  onCustomEvent(event: string): void {

    if (event === 'previous' || event === 'next') {    if (event === 'previous' || event === 'next') {

      this.switchChartType(event);      this.switchChartType(event);

    }    }

    this.customEvent.emit(event);    this.customEvent.emit(event);

  }  }



  private switchChartType(direction: 'previous' | 'next'): void {  private switchChartType(direction: 'previous' | 'next'): void {

    const availableTypes = this.possibleType || this.getDefaultTypes();    const availableTypes = this.possibleType || this.getDefaultTypes();

    const currentIndex = availableTypes.indexOf(this.type);    const currentIndex = availableTypes.indexOf(this.type);



    if (currentIndex === -1) return;    if (currentIndex === -1) return;



    let newIndex: number;    let newIndex: number;

    if (direction === 'next') {    if (direction === 'next') {

      newIndex = currentIndex === availableTypes.length - 1 ? 0 : currentIndex + 1;      newIndex = currentIndex === availableTypes.length - 1 ? 0 : currentIndex + 1;

    } else {    } else {

      newIndex = currentIndex === 0 ? availableTypes.length - 1 : currentIndex - 1;      newIndex = currentIndex === 0 ? availableTypes.length - 1 : currentIndex - 1;

    }    }



    this.type = availableTypes[newIndex];    this.type = availableTypes[newIndex];

  }  }



  private getDefaultTypes(): ChartType[] {  private getDefaultTypes(): ChartType[] {

    return ['pie', 'donut', 'bar', 'column', 'line', 'area', 'spline'];    return ['pie', 'donut', 'bar', 'column', 'line', 'area', 'spline'];

  }  }

}}
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
    boxplot: { possibleType: ChartComponent.BOXPLOT_CHART_TYPES, canPivot: false },
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

  private static readonly COMPLEX_CHART_TYPES = new Set(['bar', 'column', 'columnpyramid', 'line', 'area', 'spline', 'areaspline', 'columnrange', 'arearange', 'areasplinerange', 'scatter', 'bubble', 'heatmap', 'treemap', 'boxplot']);

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
