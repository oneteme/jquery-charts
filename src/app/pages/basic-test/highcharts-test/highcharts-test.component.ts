import {
  Component,
  Input,
  ViewChild,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartComponent as HighchartsChartComponent } from '@oneteme/jquery-highcharts';
import { ChartProvider, ChartType } from '@oneteme/jquery-core';

@Component({
  selector: 'app-highcharts-test',
  templateUrl: './highcharts-test.component.html',
  standalone: true,
  imports: [CommonModule, HighchartsChartComponent],
})
export class HighchartsTestComponent implements OnChanges {
  @Input() chartType: ChartType = 'line';
  @Input() chartConfig: ChartProvider<string, number>;
  @Input() chartData: any[] = [];
  @Input() isLoadingChart: boolean = false;
  @Input() enablePivot: boolean = false;
  @ViewChild('chart') chart: HighchartsChartComponent<string, number>;

  ngOnChanges(changes: SimpleChanges): void {}

  reloadChart(): void {
    if (this.chart) {
    }
  }

  onCustomEvent(event: any): void {
    console.log('Custom event received:', event);
    // Ici vous pouvez gérer les événements de toolbar (previous, next, pivot, etc.)
  }
}
