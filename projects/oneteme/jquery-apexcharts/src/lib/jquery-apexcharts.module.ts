import { NgModule } from '@angular/core';
import { BarChartDirective } from './directive/bar-chart.directive';
import { CommonModule } from '@angular/common';
import { LineChartDirective } from './directive/line-chart.directive';
import { PieChartDirective } from './directive/pie-chart.directive';
import { ChartComponent } from './component/chart.component';

@NgModule({
  declarations: [
    BarChartDirective,
    LineChartDirective,
    PieChartDirective,
    ChartComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    BarChartDirective,
    LineChartDirective,
    PieChartDirective,
    ChartComponent
  ]
})
export class JqueryApexchartsModule { }
