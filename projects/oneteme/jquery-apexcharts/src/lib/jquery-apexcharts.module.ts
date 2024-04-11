import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreemapChartDirective } from './directive/treemap-chart.directive';
import { BarChartDirective } from './directive/bar-chart.directive';
import { ChartComponent } from './component/chart.component';
import { LineChartDirective } from './directive/line-chart.directive';
import { PieChartDirective } from './directive/pie-chart.directive';
import { TestChartDirective } from './directive/test-chart.directive';
import { RangeChartDirective } from './directive/range-chart.directive';
import ApexCharts from "apexcharts";

declare global {
  interface Window {
    ApexCharts: any;
  }
}

window.ApexCharts = ApexCharts;

@NgModule({
  declarations: [
    BarChartDirective,
    LineChartDirective,
    PieChartDirective,
    TreemapChartDirective,
    TestChartDirective,
    RangeChartDirective,
    ChartComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    BarChartDirective,
    LineChartDirective,
    PieChartDirective,
    TreemapChartDirective,
    TestChartDirective,
    RangeChartDirective,
    ChartComponent
  ]
})
export class JqueryApexchartsModule { }
