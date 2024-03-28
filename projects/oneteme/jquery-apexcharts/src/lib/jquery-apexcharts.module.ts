import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreemapChartDirective } from './directive/treemap-chart.directive';
import { BarChartDirective } from './directive/bar-chart.directive';
import { ChartComponent } from './component/chart.component';

@NgModule({
  declarations: [
    BarChartDirective,
    TreemapChartDirective,
    ChartComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    BarChartDirective,
    TreemapChartDirective,
    ChartComponent
  ]
})
export class JqueryApexchartsModule { }
