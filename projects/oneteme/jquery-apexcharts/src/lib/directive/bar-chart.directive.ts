import { Directive, Input } from '@angular/core';
import {
  buildChart,
  DataProvider,
  field,
  naturalFieldComparator,
  XaxisType,
} from '@oneteme/jquery-core';
import { ApexChartDirectiveBase } from './apex-chart.directive';
import { getType, transformSeriesVisibility } from './utils';

type BarChartType = 'bar' | 'column' | 'funnel' | 'pyramid';

@Directive({
  standalone: true,
  selector: '[bar-chart]',
})
export class BarChartDirective<X extends XaxisType>
  extends ApexChartDirectiveBase<X, number>
{
  private _type: BarChartType = 'bar';

  @Input({ required: true })
  set type(type: BarChartType) {
    if (this._type === type) return;
    this._type = type;
    this.markForRedraw();
  }

  get type(): BarChartType {
    return this._type;
  }

  constructor() {
    super('bar');
  }

  protected updateType(): void {
    this._options.chart.type = 'bar';
    this.configureTypeSpecificOptions();
  }

  protected configureTypeSpecificOptions(): void {
    this._options.plotOptions ??= {};
    this._options.plotOptions.bar ??= {};
    this._options.plotOptions.bar.horizontal =
      this._type === 'bar' || this._type === 'funnel' || this._type === 'pyramid';
    this._options.plotOptions.bar.isFunnel =
      this._type === 'funnel' || this._type === 'pyramid';
  }

  protected updateData(): void {
    let sortedData = [...this.data];
    const primaryYProvider = this.getPrimaryYProvider();
    if (this._type === 'funnel') {
      sortedData = sortedData.sort(
        naturalFieldComparator('asc', primaryYProvider)
      );
    } else if (this._type === 'pyramid') {
      sortedData = sortedData.sort(
        naturalFieldComparator('desc', primaryYProvider)
      );
    }

    const commonChart = buildChart(sortedData, this.effectiveConfig);

    const seriesWithVisibility = transformSeriesVisibility(commonChart.series);

    this._options.series = seriesWithVisibility.length
      ? seriesWithVisibility.map((s: any) => ({
          data: s.data,
          name: s.name,
          color: s.color,
          group: s.stack,
          hidden: s.hidden,
        }))
      : [{ data: [] }];

    const newType = getType(commonChart);
    if (this._options.xaxis.type !== newType) {
      this._options.xaxis.type = newType;
      this.markForRedraw();
    }

    this._options.xaxis.categories = commonChart.categories || [];
  }

  private getPrimaryYProvider(): DataProvider<number> {
    const coordinate = this._chartConfig.series?.[0]?.data;
    if (!coordinate) return () => undefined as unknown as number;
    return 'yField' in coordinate ? field<number>(coordinate.yField) : coordinate.y;
  }
}
