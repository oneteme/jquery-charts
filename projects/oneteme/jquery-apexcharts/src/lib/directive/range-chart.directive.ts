import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import {
  ChartProvider,
  ChartView,
  XaxisType,
  buildChart,
  mergeDeep,
} from '@oneteme/jquery-core';
import { customIcons, getType } from './utils';

import ApexCharts from 'apexcharts';

@Directive({
  standalone: true,
  selector: '[range-chart]',
})
export class RangeChartDirective<X extends XaxisType>
  implements ChartView<X, number[]>, OnChanges, OnDestroy
{
  private el: ElementRef = inject(ElementRef);

  private _chart: ApexCharts;
  private _chartConfig: ChartProvider<X, number[]> = {
    showToolbar: false,
  };

  private _options: any = {
    chart: {
      type: 'rangeArea',
    },
    series: [],
  };

  @Input({ required: true }) type: 'rangeArea' | 'rangeBar' | 'rangeColumn';

  @Input({ required: true }) config: ChartProvider<X, number[]>;

  @Input({ required: true }) data: any[];

  @Input() canPivot: boolean = true;

  @Input() isLoading: boolean = false;

  @Input({ required: false }) showToolbar?: boolean;

  @Output() customEvent: EventEmitter<'previous' | 'next' | 'pivot'> =
    new EventEmitter();

  ngOnDestroy(): void {
    if (this._chart) {
      this._chart.destroy();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.type && this.config && this.data) {
      if (changes.type) {
        this.updateType();
      }
      if (changes.isLoading) {
        this.updateLoading();
      }
      if (changes.config) {
        this.updateConfig();
      }
      if (changes.config || changes.data) {
        this.updateData();
      }
      this.updateChart();
    }
  }

  updateType() {
    mergeDeep(this._options, {
      chart: { type: this.type == 'rangeColumn' ? 'rangeBar' : this.type },
    });
  }

  updateConfig() {
    let that = this;
    this._chartConfig = this.config;
    mergeDeep(
      this._options,
      {
        chart: {
          height: this._chartConfig.height ?? '100%',
          width: this._chartConfig.width ?? '100%',
          toolbar: {
            show: this._chartConfig.showToolbar ?? false,
              tools: {
              download: false,
              selection: false,
              zoom: false,
              zoomin: false,
              zoomout: false,
              pan: false,
              reset: false,
              customIcons: customIcons(
                (arg) => that.customEvent.emit(arg),
                true
              ),
            },
          },
          events: {
            mouseMove: function (e, c, config) {
              that.el.nativeElement.querySelector(
                '.apexcharts-toolbar'
              ).style.visibility = 'visible';
            },
            mouseLeave: function (e, c, config) {
              that.el.nativeElement.querySelector(
                '.apexcharts-toolbar'
              ).style.visibility = 'hidden';
            },
          },
        },
        title: {
          text: this._chartConfig.title,
        },
        subtitle: {
          text: this._chartConfig.subtitle,
        },
        xaxis: {
          title: {
            text: this._chartConfig.xtitle,
          },
        },
        yaxis: {
          title: {
            text: this._chartConfig.ytitle,
          },
        },
      },
      this.type == 'rangeBar'
        ? {
            plotOptions: {
              bar: {
                horizontal: true,
              },
            },
          }
        : {},
      this._chartConfig.options
    );
  }

  updateData() {
    var commonChart = buildChart(
      this.data,
      {
        ...this._chartConfig,
        continue: true,
        pivot: !this.canPivot ? false : this._chartConfig.pivot,
      },
      null
    );
    mergeDeep(this._options, {
      series: commonChart.series,
      xaxis: { type: getType(commonChart) },
    });
  }

  updateLoading() {
    mergeDeep(this._options, {
      noData: {
        text: this.isLoading ? 'Loading...' : 'Aucune donnée',
      },
    });
  }

  updateChart() {
    if (this._chart) {
      this._chart.destroy();
    }
    this.createChart();
    this.render();
  }

  createChart() {
    this._chart = new ApexCharts(this.el.nativeElement, this._options);
  }

  render() {
    this._chart.render();
  }
}
