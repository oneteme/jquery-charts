import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  ChartProvider,
  ChartType,
  XaxisType,
  YaxisType,
} from '@oneteme/jquery-core';
import { ChartDirective } from '../directive/chart.directive';

@Component({
  standalone: true,
  imports: [ChartDirective],
  selector: 'chart',
  template: `<div
    chart-directive
    [type]="type"
    [config]="config"
    [data]="data"
    [debug]="debug"
    (customEvent)="onCustomEvent($event)"
    style="width: 100%; height: 100%;"
  ></div>`,
})
export class ChartComponent<X extends XaxisType, Y extends YaxisType> {
  @Input({ required: true }) type!: ChartType;
  @Input({ required: true }) config!: ChartProvider<X, Y>;
  @Input({ required: true }) data!: any[];
  @Input() debug: boolean = false;

  @Output() customEvent = new EventEmitter<string>();

  onCustomEvent(event: string): void {
    this.customEvent.emit(event);
  }
}
