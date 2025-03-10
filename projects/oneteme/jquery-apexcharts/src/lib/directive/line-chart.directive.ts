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
import {asapScheduler, Subscription} from "rxjs";

@Directive({
  standalone: true,
  selector: '[line-chart]'
})
export class LineChartDirective<X extends XaxisType, Y extends YaxisType> implements ChartView<X, Y>, OnChanges, OnDestroy {
  private ngZone = inject(NgZone);

  private readonly chartInstance = signal<ApexCharts | null>(null);
  private _chartConfig: ChartProvider<X, Y>;
  private _options: any;

  @Input() debug: boolean;
  @Input({required: true}) data: any[];
  // @Input() isLoading: boolean = false;
  @Output() customEvent: EventEmitter<'previous' | 'next' | 'pivot'> = new EventEmitter();

  constructor(private el: ElementRef) {
    this._options = initOptions(this.el, this.customEvent);
  }

  init() {
      if(this.debug) {
        console.log("ngOnInit", this._options);
      }
      let chart = new ApexCharts(this.el.nativeElement, this._options);
      chart.render().then(() => {
        if(this.debug) console.log('redner ok !')
      });
      this.chartInstance.set(chart);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.ngZone.runOutsideAngular(() => {
      asapScheduler.schedule(() => this.hydrate(changes));
    });
  }

  ngOnDestroy() {
    this.chartInstance()?.destroy();
    this.chartInstance.set(null);
  }

  private hydrate(changes: SimpleChanges): void {
    if(this.debug) console.log("hydrate", changes);
    if(changes['data'] || changes['config']) {
      if(this.debug) console.log("hydrate data or config changes", changes);
      if(this.data && this._chartConfig){
        if(this.debug) console.log("hydrate data or config not null", this.data, this._chartConfig);
        this.updateData();
      }
    }
    if(this._options.shouldRedraw){
      if(this.debug) console.log("hydrate shouldRedraw", changes);
      this.ngOnDestroy();
      this.init();
      delete this._options.shouldRedraw;
    }
    else {
      if(this.debug) console.log("hydrate updateOptions", changes);
      this.updateOptions(true, true, false); //redraw
    }
  }

  //input data + chartConfig
  private updateData() {
    let commonChart = buildChart(this.data, {...this._chartConfig, continue: true}, null);
    this._options.series = commonChart.series;
    let newType = getType(commonChart);
    if(this._options.xaxis.type != newType){ // bug chart shit : todo complete ..
      this._options.xaxis.type = newType;
      this._options.shouldRedraw = true;
    }
  }

  @Input()
  set isLoading(isLoading: boolean) {
    this._options.noData.text = isLoading ? 'Chargement des données...' : 'Aucune donnée';
  }

  @Input()
  set type(type: string) {
    this._options.chart.type = type;
  }

  @Input()
  set config(config: ChartProvider<X, Y>) {
    this._chartConfig = config;
    this._options = updateOptions(this._options, config);
  }

  private updateOptions(
    redrawPaths?: boolean,
    animate?: boolean,
    updateSyncedCharts?: boolean
  ) {
    //if _options.series & _options.xaxis.type & this.config
    return this.ngZone.runOutsideAngular(() =>
      this.chartInstance()?.updateOptions(
        this._options,
        redrawPaths,
        animate,
        updateSyncedCharts
      )
    );
  }
}

function initOptions(node: ElementRef, customEvent: EventEmitter<'previous' | 'next' | 'pivot'>){
  return {
    shouldRedraw: true,
    chart: {
      type: 'line',
      toolbar: {
        tools: {
          download: false,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false,
          customIcons: customIcons(arg => { customEvent.emit(arg) }, true)
        }
      },
      events: {
        mouseMove: function() {
          let toolbar = node.nativeElement.querySelector('.apexcharts-toolbar');
          if(toolbar) toolbar.style.visibility = "visible";
        },
        mouseLeave: function() {
          let toolbar = node.nativeElement.querySelector('.apexcharts-toolbar');
          if(toolbar) toolbar.style.visibility = "hidden";
        }
      }
    },
    xaxis: { }, // set type
    series: [],
    noData: {
      text: 'Aucune donnée'
    }
  };
}

function updateOptions<X extends XaxisType, Y extends YaxisType>(options: any, config : ChartProvider<X, Y>) {

  return mergeDeep(options, {
    chart: {
      height: config.height ?? '100%',
      width: config.width ?? '100%',
      stacked: config.stacked,
      toolbar: {
        show: config.showToolbar ?? false,
      }
    },
    title: {
      text: config.title
    },
    subtitle: {
      text: config.subtitle
    },
    xaxis: {
      title: {
        text: config.xtitle
      }
    },
    yaxis: {
      title: {
        text: config.ytitle
      }
    }
  }, config.options);
}
