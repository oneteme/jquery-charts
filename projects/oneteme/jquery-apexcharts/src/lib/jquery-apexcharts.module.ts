import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreemapChartDirective } from './directive/treemap-chart.directive';
import { BarChartDirective } from './directive/bar-chart.directive';
import { ChartComponent } from './component/chart.component';
import { LineChartDirective } from './directive/line-chart.directive';
import { PieChartDirective } from './directive/pie-chart.directive';
import { HeatmapChartDirective } from './directive/heatmap-chart.directive';
import { RangeareaChartDirective } from './directive/rangearea-chart.directive';

@NgModule({
  declarations: [
    BarChartDirective,
    LineChartDirective,
    PieChartDirective,
    TreemapChartDirective,
    HeatmapChartDirective,
    RangeareaChartDirective,
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
    HeatmapChartDirective,
    RangeareaChartDirective,
    ChartComponent
  ]
})
export class JqueryApexchartsModule { }
