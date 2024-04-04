import { Directive, ElementRef, EventEmitter, Input, NgZone, OnDestroy, Output, SimpleChanges, inject } from "@angular/core";
import { ChartProvider, ChartView, XaxisType, mergeDeep, CommonSerie, distinct, Coordinate2D, buildChart, CommonChart } from "@oneteme/jquery-core";
import ApexCharts from "apexcharts";

@Directive({
  selector: '[bar-chart]'
})
export class BarChartDirective<X extends XaxisType> implements ChartView<X, number>, OnDestroy {
  private el: ElementRef = inject(ElementRef);
  private ngZone: NgZone = inject(NgZone);

  private _chart: ApexCharts;
  private _chartConfig: ChartProvider<X, number> = {};
  private _options: any = {
    chart: {
      type: 'bar',
      animations: {
        enabled: false
      }
    },
    series: [],
    markers: {
      size: 0
    }
  };

  @Input({ alias: 'type', required: true }) type: 'bar' | 'funnel' | 'pyramid';

  @Input({ alias: 'config', required: true }) config: ChartProvider<X, number>;

  @Input({ required: true }) data: any[];

  @Input() isLoading: boolean = false;

  @Output() customEvent: EventEmitter<'previous' | 'next' | 'pivot'> = new EventEmitter();

  updateConfig() {
    let that = this;
    this._chartConfig = this.config;

    mergeDeep(this._options, {
      chart: {
        height: this._chartConfig.height ?? '100%',
        width: this._chartConfig.width ?? '100%',
        stacked: this._chartConfig.stacked,
        toolbar: {
          show: true,
          tools: {
            download: false,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false,
            customIcons: [{
              icon: '<img src="/assets/icons/arrow_back_ios.svg" width="15">',
              title: 'Graphique précédent',
              click: function (chart, options, e) {
                that.customEvent.emit("previous");
              }
            },
            {
              icon: '<img src="/assets/icons/arrow_forward_ios.svg" width="15">',
              title: 'Graphique suivant',
              click: function (chart, options, e) {
                that.customEvent.emit("next");
              }
            },
            {
              icon: '<img src="/assets/icons/pivot_table_chart.svg" width="15">',
              title: 'Graphique suivant',
              click: function (chart, options, e) {
                that.customEvent.emit("pivot");
              }
            }]
          }
        }
      },
      title: {
        text: this._chartConfig.title
      },
      subtitle: {
        text: this._chartConfig.subtitle
      },
      xaxis: {
        title: {
          text: this._chartConfig.xtitle
        }
      },
      yaxis: {
        title: {
          text: this._chartConfig.ytitle
        }
      }
    }, this._chartConfig.options);
  }

  updateData() {
    if (this.type == 'funnel') {
      this._chartConfig.xorder = 'asc';
    } else if (this.type == 'pyramid') {
      this._chartConfig.xorder = 'desc';
    }
    var commonChart = buildChart(this.data, this._chartConfig);
    let type: 'category' | 'datetime' | 'numeric' = 'datetime';
    if (commonChart.continue) {
      var x = (<CommonChart<X, Coordinate2D>>commonChart).series[0].data[0].x;
      type = x instanceof Date ? 'datetime' : typeof x == 'number' ? 'numeric' : 'category';
    } else {
      var categ = commonChart.categories[0];
      type = categ instanceof Date ? 'datetime' : typeof categ == 'number' ? 'numeric' : 'category';
    }
    console.log("commonChart", commonChart)
    mergeDeep(this._options, { series: this._chartConfig.stacked ? commonChart.series.map(s => ({ data: s.data, name: s.name, group: s.stack, color: s.color })) : commonChart.series, xaxis: { type: type, categories: commonChart.categories || [] } });
  }

  updateLoading() {
    mergeDeep(this._options, {
      noData: {
        text: this.isLoading ? 'Loading...' : 'Aucune donnée'
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.isLoading) {
      this.updateLoading();
    }
    if (changes.type && changes.config && changes.data) {
      if (changes.type.previousValue != changes.type.currentValue) {
        this.updateConfig();
      }
      if (changes.data.previousValue != changes.data.currentValue) {
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
      this.updateOptions();
    } else {
      this.createChart();
      this.render();
    }
  }

  createChart() {
    this._chart = new ApexCharts(this.el.nativeElement, this._options);
  }

  updateOptions() {
    this._chart.resetSeries();
    if (this._options.chart.id) {
      ApexCharts.exec(this._options.chart.id, 'updateOptions', this._options);
    } else {
      this._chart.updateOptions(this._options, false, false);
    }
  }

  render() {
    this._chart.render();
  }
}