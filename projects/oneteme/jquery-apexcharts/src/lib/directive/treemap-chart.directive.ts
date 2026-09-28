import { Directive, Input } from '@angular/core';
import { buildChart } from '@oneteme/jquery-core';
import { ApexChartDirectiveBase } from './apex-chart.directive';
import { getType } from './utils';

@Directive({
  standalone: true,
  selector: '[treemap-chart]',
})
export class TreemapChartDirective
  extends ApexChartDirectiveBase<string, number>
{
  private _type: 'treemap' | 'heatmap' = 'treemap';

  @Input()
  set type(type: 'treemap' | 'heatmap') {
    if (this._type === type) return;
    this._type = type;
    this.markForRedraw();
  }

  get type(): 'treemap' | 'heatmap' {
    return this._type;
  }

  constructor() {
    super('treemap');
  }

  protected updateType(): void {
    this.configureTypeSpecificOptions();
  }

  protected configureTypeSpecificOptions(): void {
    this._options.chart.type = this._type;
  }

  protected updateData(): void {
    const commonChart = buildChart(
      this.data,
      { ...this.effectiveConfig, continue: true },
      null
    );

    this._options.series = commonChart.series;

    const newType = getType(commonChart);
    if (this._options.xaxis.type != newType) {
      this._options.xaxis.type = newType;
      this.markForRedraw();
    }
  }
}
