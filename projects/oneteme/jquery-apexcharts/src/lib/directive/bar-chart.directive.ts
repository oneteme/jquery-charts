import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
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
  naturalFieldComparator,
  mergeDeep,
} from '@oneteme/jquery-core';
import ApexCharts from 'apexcharts';
import { customIcons, getType } from './utils';

@Directive({
  standalone: true,
  selector: '[bar-chart]',
})
export class BarChartDirective<X extends XaxisType>
  implements ChartView<X, number>, OnDestroy
{
  private el: ElementRef = inject(ElementRef);

  private _chart: ApexCharts;
  private _chartConfig: ChartProvider<X, number> = {
    showToolbar: false,
  };
  private _options: any = {
    chart: {
      type: 'bar',
    },
    series: [],
  };

  @Input({ alias: 'type', required: true }) type:
    | 'bar'
    | 'column'
    | 'funnel'
    | 'pyramid';

  @Input({ alias: 'config', required: true }) config: ChartProvider<X, number>;

  @Input({ required: true }) data: any[];

  @Input() canPivot: boolean = true;

  @Input() isLoading: boolean = false;

  @Output() customEvent: EventEmitter<'previous' | 'next' | 'pivot'> =
    new EventEmitter();

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
                this.canPivot
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
      this.type == 'bar'
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
    var data = [...this.data];
    if (this.type == 'funnel') {
      data = data.sort(
        naturalFieldComparator('asc', this._chartConfig.series[0].data.y)
      );
    } else if (this.type == 'pyramid') {
      data = data.sort(
        naturalFieldComparator('desc', this._chartConfig.series[0].data.y)
      );
    }
    var commonChart = buildChart(data, {
      ...this._chartConfig,
      pivot: !this.canPivot ? false : this._chartConfig.pivot,
    });
    mergeDeep(this._options, {
      series: commonChart.series.map((s) => ({
        data: s.data,
        name: s.name,
        color: s.color,
        group: s.stack,
      })),
      xaxis: {
        type: getType(commonChart),
        categories: commonChart.categories || [],
      },
    });
  }

  updateLoading() {
    mergeDeep(this._options, {
      noData: {
        text: this.isLoading ? 'Loading...' : 'Aucune donnée',
      },
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.type && this.config && this.data) {
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

  ngOnDestroy(): void {
    if (this._chart) {
      this._chart.destroy();
    }
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
  //   this._chart.resetSeries();
  //   if (this._options.chart.id) {
  //     ApexCharts.exec(this._options.chart.id, 'updateOptions', this._options);
  //   } else {
  //     this._chart.updateOptions(this._options, false, false);
  //   }
  // }

  render() {
    this._chart.render();
  }
}
