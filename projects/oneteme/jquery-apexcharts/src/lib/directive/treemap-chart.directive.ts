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
  buildChart,
  mergeDeep,
} from '@oneteme/jquery-core';
import { customIcons, getType } from './utils';

import ApexCharts from 'apexcharts';

@Directive({
  standalone: true,
  selector: '[treemap-chart]',
})
export class TreemapChartDirective
  implements ChartView<string, number>, OnChanges, OnDestroy
{
  private el: ElementRef = inject(ElementRef);

  private _chart: ApexCharts;
  private _chartConfig: ChartProvider<string, number> = {
    showToolbar: false,
  };
  private _options: any = {
    chart: {
      type: 'treemap',
    },
    series: [],
  };

  @Input({ required: true }) type: 'treemap' | 'heatmap';

  @Input({ required: true }) config: ChartProvider<string, number>;

  @Input({ required: true }) data: any[];

  @Input() isLoading: boolean = false;

  @Output() customEvent: EventEmitter<'previous' | 'next' | 'pivot'> =
    new EventEmitter();

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

  ngOnDestroy(): void {
    if (this._chart) {
      this._chart.destroy();
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

  render() {
    this._chart.render();
  }
}
