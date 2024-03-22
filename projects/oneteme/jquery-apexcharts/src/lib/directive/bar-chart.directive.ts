import { Directive, ElementRef, Input, NgZone, OnDestroy, inject } from "@angular/core";
import { ChartConfig, ChartView, DataSet, mergeDeep } from "@oneteme/jquery-core";
import ApexCharts from "apexcharts";

@Directive({
  selector: '[bar-chart]'
})
export class BarChartDirective implements ChartView, OnDestroy {
  private el: ElementRef = inject(ElementRef);
  private ngZone: NgZone = inject(NgZone);

  private _chart: ApexCharts;
  private _chartConfig: ChartConfig = {};
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

  private _isDataLoaded: boolean;

  @Input() set type(value: 'bar') {
    if (value) {
      mergeDeep(this._options, {
        chart: { type: value }
      });
      this.updateChart(this._isDataLoaded);
    }
  }

  @Input() set config(object: ChartConfig) {
    if (object) {
      this._chartConfig = object;
      mergeDeep(this._options, {
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
      this.updateChart(this._isDataLoaded);
    }
  }

  @Input() set data(objects: any[]) {
    this._isDataLoaded = false;
    let series: any[] = [];
    let categories: string[] = [];
    let type: 'category' | 'datetime' | 'numeric' = 'datetime';
    if (objects && objects.length) {
      let category = this._chartConfig.category;
      let mappers = this._chartConfig.mappers;

      let dataSet = new DataSet(objects, category?.mapper);

      categories = dataSet.labels;
      type = category.type === 'date' ? 'datetime' :
        category.type === 'string' ? 'category' : 'numeric';

      series = dataSet.data(mappers, 0).map(d => {
        return { name: d.mapper.group ? d.name + '_' + d.mapper.group : d.name, color: d.mapper.color, group: d.mapper.group, data: d.data };
      });
      console.log("dataset", dataSet, categories, series);
      this._isDataLoaded = true;
    }
    mergeDeep(this._options, { series: series, xaxis: { type: type, categories: categories } });
    this.updateChart();
  }

  @Input() set isLoading(val: boolean) {
    mergeDeep(this._options, {
      noData: {
        text: val ? 'Loading...' : 'Aucune donnée'
      }
    });

    this.updateChart();
  }

  ngOnDestroy(): void {
    if (this._chart) {
      this._chart.destroy();
    }
  }

  updateChart(refresh: boolean = true) {
    if (this._chart) {
      if (refresh) {
        this.updateOptions();
      }
    } else {
      this.createChart();
      this.render();
    }
  }

  createChart() {
    this.ngZone.runOutsideAngular(() => this._chart = new ApexCharts(this.el.nativeElement, this._options));
  }

  updateOptions() {
    this._chart.resetSeries();
    if (this._options.chart.id) {
      this.ngZone.runOutsideAngular(() => ApexCharts.exec(this._options.chart.id, 'updateOptions', this._options));
    } else {
      this.ngZone.runOutsideAngular(() => this._chart.updateOptions(this._options, false, false));
    }
  }

  render() {
    this.ngZone.runOutsideAngular(() => this._chart.render());
  }
}