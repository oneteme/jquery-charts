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
  YaxisType,
  buildChart,
  mergeDeep,
} from '@oneteme/jquery-core';
import ApexCharts from 'apexcharts';
import { customIcons, getType } from './utils';

@Directive({
  standalone: true,
  selector: '[line-chart]',
})
export class LineChartDirective<X extends XaxisType, Y extends YaxisType>
  implements ChartView<X, Y>, OnChanges, OnDestroy
{
  private el: ElementRef = inject(ElementRef);

  private _chart: ApexCharts;
  private _chartConfig: ChartProvider<X, Y> = {
    showToolbar: false,
  };

  private _options: any = {
    chart: {
      type: 'line',
    },
    series: [],
  };

  @Input({ required: true }) type: 'line' | 'area';

  @Input({ required: true }) config: ChartProvider<X, Y>;

  @Input({ required: true }) data: any[];

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
    mergeDeep(this._options, { chart: { type: this.type } });
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
          stacked: this._chartConfig.stacked,
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
              var toolbar = that.el.nativeElement.querySelector(
                '.apexcharts-toolbar'
              );
              toolbar ? (toolbar.style.visibility = 'visible') : null;
            },
            mouseLeave: function (e, c, config) {
              var toolbar = that.el.nativeElement.querySelector(
                '.apexcharts-toolbar'
              );
              toolbar ? (toolbar.style.visibility = 'hidden') : null;
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
      this._chartConfig.options
    );
  }

  updateData() {
    var commonChart = buildChart(
      this.data,
      { ...this._chartConfig, continue: true },
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

  // updateOptions() {
  //     this._chart.resetSeries();
  //     if (this._options.chart.id) {
  //         ApexCharts.exec(this._options.chart.id, 'updateOptions', this._options);
  //     } else {
  //         this._chart.updateOptions(this._options, false, false);
  //     }
  // }

  render() {
    this._chart.render();
  }
}
