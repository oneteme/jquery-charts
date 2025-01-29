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
  ChartType,
  ChartView,
  buildChart,
  buildSingleSerieChart,
  mergeDeep,
} from '@oneteme/jquery-core';
import { customIcons } from './utils';
import ApexCharts from 'apexcharts';

@Directive({
  standalone: true,
  selector: '[pie-chart]',
})
export class PieChartDirective
  implements ChartView<string, number>, OnChanges, OnDestroy
{
  private el: ElementRef = inject(ElementRef);

  private typeMapping: { [key: ChartType]: ChartType } = {
    pie: 'pie',
    donut: 'donut',
    radial: 'radialBar',
    polar: 'polarArea',
    radar: 'radar',
  };

  private _chart: ApexCharts;
  private _chartConfig: ChartProvider<string, number> = {
    showToolbar: false,
  };
  private _options: any = {
    chart: {
      type: 'pie',
    },
    series: [],
  };

  @Input({ required: true }) type:
    | 'pie'
    | 'donut'
    | 'radialBar'
    | 'polarArea'
    | 'radar';

  @Input({ required: true }) config: ChartProvider<string, number>;

  @Input({ required: true }) data: any[];

  @Input() isLoading: boolean = false;

  @Input({ required: false }) showToolbar?: boolean; // Ajout de cette ligne

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
    mergeDeep(this._options, { chart: { type: this.typeMapping[this.type] } });
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
    var chartConfig = { ...this._chartConfig, continue: false };
    var commonChart =
      this.data.length != 1 && this.type == 'radar'
        ? buildChart(this.data, chartConfig, null)
        : buildSingleSerieChart(this.data, chartConfig, null);
    var colors = commonChart.series
      .filter((d) => d.color)
      .map((d) => <string>d.color);
    mergeDeep(this._options, {
      series:
        this.data.length != 1 && this.type == 'radar'
          ? commonChart.series
          : this.type == 'radar'
          ? [
              {
                name: 'Series 1',
                data: commonChart.series.flatMap((s) =>
                  s.data.filter((d) => d != null)
                ),
              },
            ]
          : commonChart.series.flatMap((s) => s.data.filter((d) => d != null)),
      labels: commonChart.categories || [],
      colors: colors || [],
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
