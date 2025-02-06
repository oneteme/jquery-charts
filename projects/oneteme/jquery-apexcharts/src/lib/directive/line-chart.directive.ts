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
import {buildChart, ChartProvider, ChartView, mergeDeep, XaxisType, YaxisType} from "@oneteme/jquery-core";
import ApexCharts from "apexcharts";
import {customIcons, getType} from "./utils";
import {asapScheduler} from "rxjs";

@Directive({
  standalone: true,
  selector: '[line-chart]'
})
export class LineChartDirective<X extends XaxisType, Y extends YaxisType> implements ChartView<X, Y>, OnChanges, OnDestroy {
  private el: ElementRef = inject(ElementRef);
  private ngZone = inject(NgZone);

  private readonly chartInstance = signal<ApexCharts | null>(null);

  private _chartConfig: ChartProvider<X, Y> = {};

  private _options: any = {
    chart: {
      type: 'line'
    },
    series: [],
    noData: {
      text: 'Aucune donnée'
    }
  };

  @Input({ required: true }) type: 'line' | 'area';
  @Input({ required: true }) config: ChartProvider<X, Y>;
  @Input({ required: true }) data: any[];
  @Input() isLoading: boolean = false;
  @Output() customEvent: EventEmitter<'previous' | 'next' | 'pivot'> = new EventEmitter();

  ngOnChanges(changes: SimpleChanges): void {
    this.ngZone.runOutsideAngular(() => {
      asapScheduler.schedule(() => this.hydrate(changes));
    });
  }

  ngOnDestroy() {
    this.destroy();
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
            customIcons: customIcons(arg => { that.ngZone.run(() => that.customEvent.emit(arg)) }, true)
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
      }
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
    mergeDeep(this._options, { chart: { type: this.type } });
  }

  private updateData() {
    var commonChart = buildChart(this.data, {...this._chartConfig, continue: true}, null);
    mergeDeep(this._options, { series: commonChart.series, xaxis: { type: getType(commonChart) } });
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
