import { Directive, Input } from '@angular/core';
import { buildChart, XaxisType } from '@oneteme/jquery-core';
import { ApexChartDirectiveBase } from './apex-chart.directive';
import { getType, transformSeriesVisibility } from './utils';

type RangeChartType = 'rangeArea' | 'rangeBar' | 'rangeColumn';

@Directive({
  standalone: true,
  selector: '[range-chart]',
})
export class RangeChartDirective<X extends XaxisType>
  extends ApexChartDirectiveBase<X, number[]>
{
  private _type: RangeChartType = 'rangeArea';

  @Input() set type(type: RangeChartType) {
    if (this._type === type) return;
    this._type = type;
    this.markForRedraw();
  }

  get type(): RangeChartType {
    return this._type;
  }

  constructor() {
    super('rangeArea');
  }

  protected updateType(): void {
    this._options.chart.type = this._type === 'rangeColumn' ? 'rangeBar' : this._type;
    this.configureTypeSpecificOptions();
  }

  protected configureTypeSpecificOptions(): void {
    const currentType = this._type;

    this._options.plotOptions ??= {};
    this._options.plotOptions.bar ??= {};
    this._options.plotOptions.bar.horizontal = currentType === 'rangeBar';
  }

  protected updateData(): void {
    const commonChart = buildChart(
      this.data,
      { ...this.effectiveConfig, continue: true },
      null
    );

    this._options.series = transformSeriesVisibility(commonChart.series);

    let newType = getType(commonChart);
    if (this._options.xaxis.type != newType) {
      this._options.xaxis.type = newType;
      this.markForRedraw();
    }
  }
}
