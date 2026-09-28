import { Directive, Input } from '@angular/core';
import { buildChart, XaxisType, YaxisType } from '@oneteme/jquery-core';
import { ApexChartDirectiveBase } from './apex-chart.directive';
import { getType, transformSeriesVisibility } from './utils';

@Directive({
  standalone: true,
  selector: '[line-chart]',
})
export class LineChartDirective<X extends XaxisType, Y extends YaxisType>
  extends ApexChartDirectiveBase<X, Y>
{
  private _type: 'line' | 'area' = 'line';

  @Input()
  set type(type: 'line' | 'area') {
    if (this._type === type) return;
    this._type = type;
    this.markForRedraw();
  }

  constructor() {
    super('line');
  }

  protected updateType(): void {
    this._options.chart.type = this._type;
  }

  protected configureTypeSpecificOptions(): void {
    if (this._chartConfig?.options?.chart?.sparkline?.enabled) {
      this._options.yaxis ??= {};
      this._options.yaxis.show = false;
      this._options.yaxis.showAlways = false;
      this._options.yaxis.labels ??= {};
      this._options.yaxis.labels.show = false;
    }
  }

  protected updateData(): void {
    let commonChart = buildChart(
      this.data,
      { ...this.effectiveConfig, continue: true },
      null
    );

    this._options.series = transformSeriesVisibility(commonChart.series);

    const renderedXAxis = (this.renderedOption as {
      xaxis?: { type?: string; categories?: unknown[] };
    } | undefined)?.xaxis;
    const newType = renderedXAxis?.type
      ?? (Array.isArray(renderedXAxis?.categories) ? 'category' : getType(commonChart));
    if (this._options.xaxis.type != newType) {
      this._options.xaxis.type = newType;
      this._options.shouldRedraw = true;
    }
  }
}
