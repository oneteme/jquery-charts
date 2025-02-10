import {
  Directive,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  signal,
  SimpleChanges
} from "@angular/core";
import {buildChart, buildSingleSerieChart, ChartProvider, ChartType, ChartView, mergeDeep} from "@oneteme/jquery-core";
import {customIcons} from "./utils";
import ApexCharts from "apexcharts";
import {asapScheduler} from "rxjs";

@Directive({
  standalone: true,
  selector: '[pie-chart]'
})
export class PieChartDirective implements ChartView<string, number>, OnChanges, OnDestroy {
  private el: ElementRef = inject(ElementRef);
  private ngZone = inject(NgZone);

  private readonly chartInstance = signal<ApexCharts | null>(null);

  private readonly typeMapping: {[key: string]: ChartType} = {
    'pie': 'pie',
    'donut': 'donut',
    'radial': 'radialBar',
    'polar': 'polarArea',
    'radar': 'radar'
  }

  private _chartConfig: ChartProvider<string, number> = {showToolbar: false};
  private _options: any = {
    chart: {
      type: 'pie'
    },
    series: [],
    noData: {
      text: 'Aucune donnée'
    }
  };

  @Input({ required: true }) type: "pie" | "donut" | "radialBar" | "polarArea" | "radar";
  @Input({ required: true }) config: ChartProvider<string, number>;
  @Input({ required: true }) data: any[];
  @Input() isLoading: boolean = false;
  @Output() customEvent: EventEmitter<'previous' | 'next' | 'pivot'> = new EventEmitter();

  ngOnDestroy() {
    this.destroy();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.ngZone.runOutsideAngular(() => {
      asapScheduler.schedule(() => this.hydrate(changes));
    });
  }

  private hydrate(changes: SimpleChanges): void {
    const shouldUpdateSeries =
      Object.keys(changes).filter((c) => c !== "data" && c!== "isLoading").length === 0;
    if (shouldUpdateSeries) {
      this.updateLoading();
      this.updateData();
      this.updateOptions(this._options, true, true, false);
      return;
    }

    this.createElement();
  }

  private createElement() {
    this.updateConfig();
    this.updateType();
    this.updateLoading();
    this.updateData();

    if(this.chartInstance() != null) {
      this.updateOptions(this._options, true, true, false);
    } else {
      this.destroy();

      const chartInstance = this.ngZone.runOutsideAngular(
        () => new ApexCharts(this.el.nativeElement, this._options)
      );
      this.chartInstance.set(chartInstance);
      this.render();
    }
  }

  private render() {
    return this.ngZone.runOutsideAngular(() => this.chartInstance()?.render());
  }

  private destroy() {
    this.chartInstance()?.destroy();
    this.chartInstance.set(null);
  }

  private updateConfig() {
    let that = this;
    this._chartConfig = this.config;
    mergeDeep(this._options, {
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
            customIcons: customIcons(arg => { that.ngZone.run(() => that.customEvent.emit(arg))}, true)
          }
        },
        events: {
          mouseMove: function (e, c, config) {
            var toolbar = that.el.nativeElement.querySelector('.apexcharts-toolbar');
            toolbar ? toolbar.style.visibility = "visible" : null;
          },
          mouseLeave: function (e, c, config) {
            var toolbar = that.el.nativeElement.querySelector('.apexcharts-toolbar');
            toolbar ? toolbar.style.visibility = "hidden" : null;
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
      },

    }, this._chartConfig.options);
  }

  private updateLoading() {
    mergeDeep(this._options, {
      noData: {
        text: this.isLoading ? 'Loading...' : 'Aucune donnée'
      }
    });
  }

  private updateType() {
    mergeDeep(this._options, { chart: { type: this.typeMapping[this.type] } })
  }

  private updateData() {
    var chartConfig = { ...this._chartConfig, continue: false };
    var commonChart = this.data.length != 1 && this.type == 'radar' ? buildChart(this.data, chartConfig, null) : buildSingleSerieChart(this.data, chartConfig, null);
    var colors = commonChart.series.filter(d => d.color).map(d => <string>d.color);
    mergeDeep(this._options, { series: this.data.length != 1 && this.type == 'radar' ? commonChart.series : this.type == 'radar' ? [{ name: 'Series 1', data: commonChart.series.flatMap(s => s.data.filter(d => d != null))}] : commonChart.series.flatMap(s => s.data.filter(d => d != null)), labels: commonChart.categories || [], colors: colors || [] });
  }

  private updateOptions(
    options: any,
    redrawPaths?: boolean,
    animate?: boolean,
    updateSyncedCharts?: boolean
  ) {
    return this.ngZone.runOutsideAngular(() =>
      this.chartInstance()?.updateOptions(
        options,
        redrawPaths,
        animate,
        updateSyncedCharts
      )
    );
  }
}
