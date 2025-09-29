import { Component, Input, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartComponent as ApexChartComponent } from '@oneteme/jquery-apexcharts';
import { ChartProvider, ChartType } from '@oneteme/jquery-core';

@Component({
  selector: 'app-apexcharts-chart-test',
  templateUrl: './apexcharts-chart-test.component.html',
  standalone: true,
  imports: [ CommonModule, ApexChartComponent ],
})
export class ApexChartTestComponent implements OnChanges {
  @Input() chartType: ChartType = 'line';
  @Input() chartConfig: ChartProvider<string, number>;
  @Input() chartData: any[] = [];
  @ViewChild('chart') chart: ApexChartComponent<string, number>;

  ngOnChanges(changes: SimpleChanges): void { }
  reloadChart(): void { if (this.chart) { } }
};
