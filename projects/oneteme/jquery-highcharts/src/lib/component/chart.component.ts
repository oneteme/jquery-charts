import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ChartProvider, ChartType, XaxisType, YaxisType } from '@oneteme/jquery-core';
import { BarChartDirective } from '../directive/bar-chart.directive';
import { LineChartDirective } from '../directive/line-chart.directive';
import { PieChartDirective } from '../directive/pie-chart.directive';
import { RangeChartDirective } from '../directive/range-chart.directive';
import { TreemapChartDirective } from '../directive/treemap-chart.directive';

@Component({
  standalone: true,
  imports: [ CommonModule, PieChartDirective, BarChartDirective, LineChartDirective, RangeChartDirective, TreemapChartDirective ],
  selector: 'chart',
  templateUrl: './chart.component.html',
})
export class ChartComponent<X extends XaxisType, Y extends YaxisType> {
  protected _charts: {
    [key: ChartType]: { possibleType: ChartType[]; canPivot?: boolean };
  } = {
    pie: { possibleType: ['pie', 'donut', 'polar', 'radar', 'radial'] },
    donut: { possibleType: ['pie', 'donut', 'polar', 'radar', 'radial'] },
    polar: { possibleType: ['pie', 'donut', 'polar', 'radar', 'radial'] },
    radar: { possibleType: ['pie', 'donut', 'polar', 'radar', 'radial'] },
    radial: { possibleType: ['pie', 'donut', 'polar', 'radar', 'radial'] },
    line: { possibleType: ['line', 'area'] },
    area: { possibleType: ['line', 'area'] },
    bar: { possibleType: ['bar', 'column', 'heatmap', 'treemap'] },
    column: { possibleType: ['bar', 'column', 'heatmap', 'treemap'] },
    heatmap: { possibleType: ['bar', 'column', 'heatmap', 'treemap'] },
    treemap: { possibleType: ['bar', 'column', 'heatmap', 'treemap'] },
    funnel: { possibleType: ['funnel', 'pyramid'], canPivot: false },
    pyramid: { possibleType: ['funnel', 'pyramid'], canPivot: false },
    rangeArea: { possibleType: ['rangeArea', 'rangeBar', 'rangeColumn'], canPivot: false },
    rangeBar: { possibleType: ['rangeArea', 'rangeBar', 'rangeColumn'] },
    rangeColumn: { possibleType: ['rangeArea', 'rangeBar', 'rangeColumn'] },
  };

  _type: ChartType;

  @Input({ alias: 'type', required: true }) set value(type: ChartType) {
    this._type = type;
  }
  @Input({ required: true }) config: ChartProvider<X, Y>;
  @Input({ required: true }) data: any[];
  @Input() isLoading: boolean;
  @Input() debug: boolean;

  change(event: string) {
    let charts = this._charts[this._type].possibleType;
    let indexOf = charts.indexOf(this._type);
    if (indexOf != -1) {
      if (event == 'previous') {
        this._type =
          indexOf == 0 ? charts[charts.length - 1] : charts[indexOf - 1];
        return;
      }
      if (event == 'next') {
        this._type =
          indexOf == charts.length - 1 ? charts[0] : charts[indexOf + 1];
        return;
      }
    }
    if (event == 'pivot') {
      this.config = this.config.pivot
        ? { ...this.config, pivot: false }
        : { ...this.config, pivot: true };
    }
  }
}
