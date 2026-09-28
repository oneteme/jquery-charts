import { Directive, Input } from '@angular/core';
import { buildChart, buildSingleSerieChart } from '@oneteme/jquery-core';
import { ApexChartDirectiveBase } from './apex-chart.directive';

type PieChartType = 'pie' | 'donut' | 'polar' | 'radar' | 'radial';

@Directive({
  standalone: true,
  selector: '[pie-chart]',
})
export class PieChartDirective
  extends ApexChartDirectiveBase<string, number>
{
  private _type: PieChartType = 'pie';

  @Input()
  set isLoading(isLoading: boolean) {
    super.isLoading = isLoading;
  }

  @Input()
  set type(type: PieChartType) {
    if (this._type === type) return;
    this._type = type;
    this.markForRedraw();
  }

  get type(): PieChartType {
    return this._type;
  }

  constructor() {
    super('pie');
  }

  protected updateType(): void {
    this.configureTypeSpecificOptions();
  }

  protected configureTypeSpecificOptions(): void {
    if (this._type === 'radial') {
      this._options.chart.type = 'radialBar';
    } else if (this._type === 'polar') {
      this._options.chart.type = 'polarArea';
    } else {
      this._options.chart.type = this._type;
    }
  }

  protected updateData(): void {
    const chartConfig = { ...this.effectiveConfig, continue: false };

    const commonChart =
      this.data.length != 1 && this._type == 'radar'
        ? buildChart(this.data, chartConfig, null)
        : buildSingleSerieChart(this.data, chartConfig, null);

    if (this.data.length != 1 && this._type == 'radar') {
      this._options.series = commonChart.series;
    } else if (this._type == 'radar') {
      this._options.series = [
        {
          name: 'Series 1',
          data: commonChart.series.flatMap((s) =>
            s.data.filter((d) => d != null)
          ),
        },
      ];
    } else {
      this._options.series = commonChart.series.flatMap((s) =>
        s.data.filter((d) => d != null)
      );
    }
    this._options.labels = commonChart.categories || [];
  }
}
