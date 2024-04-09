import { Directive, ElementRef, EventEmitter, Input, NgZone, OnDestroy, Output, SimpleChanges, inject } from "@angular/core";
import { ChartProvider, ChartView, XaxisType, CommonSerie, distinct, Coordinate2D, buildChart, CommonChart, naturalFieldComparator, mergeDeep } from "@oneteme/jquery-core";
import ApexCharts from "apexcharts";

@Directive({
  selector: '[bar-chart]'
})
export class BarChartDirective<X extends XaxisType> implements ChartView<X, number>, OnDestroy {
  private el: ElementRef = inject(ElementRef);

  private _chart: ApexCharts;
  private _chartConfig: ChartProvider<X, number> = {};
  private _options: any = {
    chart: {
      type: 'bar'
    },
    series: []
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
              class: 'custom-icon',
              click: function (chart, options, e) {
                that.customEvent.emit("previous");
              }
            },
            {
              icon: '<img src="/assets/icons/arrow_forward_ios.svg" width="15">',
              title: 'Graphique suivant',
              class: 'custom-icon',
              click: function (chart, options, e) {
                that.customEvent.emit("next");
              }
            },
            {
              icon: '<img src="/assets/icons/pivot_table_chart.svg" width="15">',
              title: 'Pivot',
              class: 'custom-icon',
              click: function (chart, options, e) {
                that.customEvent.emit("pivot");
              }
            }]
          }
        },
        events: {
          mouseMove: function (e, c, config) { that.el.nativeElement.querySelector('.apexcharts-toolbar').style.visibility = "visible" },
          mouseLeave: function (e, c, config) { that.el.nativeElement.querySelector('.apexcharts-toolbar').style.visibility = "hidden" }
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
      this.data = [...this.data.sort(naturalFieldComparator('asc', this._chartConfig.series[0].data.y))];
    } else if (this.type == 'pyramid') {
      this.data = [...this.data.sort(naturalFieldComparator('desc', this._chartConfig.series[0].data.y))];
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
    mergeDeep(this._options, { series: commonChart.series.map(s => ({ data: s.data, name: s.name, color: s.color, group: s.stack })), xaxis: { type: type, categories: commonChart.categories || [] } });
    console.log('commonBarChart', commonChart)
  }

  updateLoading() {
    mergeDeep(this._options, {
      noData: {
        text: this.isLoading ? 'Loading...' : 'Aucune donnée'
      }
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