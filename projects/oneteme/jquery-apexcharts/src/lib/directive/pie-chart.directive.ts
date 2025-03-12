import { Directive, ElementRef, EventEmitter, inject, Input, NgZone, OnChanges, OnDestroy, Output, signal, SimpleChanges } from '@angular/core';
import { buildChart, buildSingleSerieChart, ChartProvider, ChartView } from '@oneteme/jquery-core';
import ApexCharts from 'apexcharts';
import { asapScheduler, Subscription } from 'rxjs';
import { ChartCustomEvent, initCommonChartOptions, updateCommonOptions, initChart, updateChartOptions, hydrateChart, destroyChart } from './utils';

@Directive({
  standalone: true,
  selector: '[pie-chart]',
})
export class PieChartDirective
  implements ChartView<string, number>, OnChanges, OnDestroy
{
  private el: ElementRef = inject(ElementRef);
  private ngZone = inject(NgZone);
  private readonly chartInstance = signal<ApexCharts | null>(null);
  private _chartConfig: ChartProvider<string, number>;
  private _options: any;
  private subscription = new Subscription();
  private _type: 'pie' | 'donut' | 'polar' | 'radar' | 'radial' = 'pie';

  @Input() debug: boolean;
  @Input({ required: true }) data: any[];
  @Output() customEvent: EventEmitter<ChartCustomEvent> = new EventEmitter();
  @Input()
  set isLoading(isLoading: boolean) {
    this._options.noData.text = isLoading
      ? 'Chargement des données...'
      : 'Aucune donnée';
  }
  @Input()
  set type(type: 'pie' | 'donut' | 'polar' | 'radar' | 'radial') {
    this._type = type;
    if (this._options.chart.type !== type) {
      this._options.chart.type = type;
      this.configureTypeSpecificOptions();
      this._options.shouldRedraw = true;
    }
  }
  @Input()
  set config(config: ChartProvider<string, number>) {
    this._chartConfig = config;
    this._options = updateCommonOptions(this._options, config);
  }

  constructor() {
    this._options = initCommonChartOptions(this.el, this.customEvent, this.ngZone, 'pie');
  }

  init() {
    initChart(this.el, this.ngZone, this._options, this.chartInstance, this.subscription, this.debug);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.debug) {
      console.log(new Date().getMilliseconds(), 'Détection de changements', changes);
    }

    if (changes['type']) {
      this.updateType();
    }

    this.ngZone.runOutsideAngular(() => {
      asapScheduler.schedule(() => this.hydrate(changes));
    });
  }

  ngOnDestroy() {
    destroyChart(this.chartInstance, this.subscription);
  }

  private hydrate(changes: SimpleChanges): void {
    hydrateChart(
      changes,
      this.data,
      this._chartConfig,
      this._options,
      this.chartInstance,
      this.ngZone,
      () => this.updateData(),
      () => this.ngOnDestroy(),
      () => this.init(),
      () => updateChartOptions(this.chartInstance(), this.ngZone, this._options),
      this.debug
    );

    if (changes['isLoading']) {
      this.updateLoading();
    }
  }

  private updateType() {
    this.configureTypeSpecificOptions();
    this._options.shouldRedraw = true;
  }

  private configureTypeSpecificOptions() {
    const currentType = this._type;

    if (currentType === 'pie') {
      this._options.chart.type = 'pie';
    }
    else if (currentType === 'donut') {
      this._options.chart.type = 'donut';
    }
    else if (currentType === 'radial') {
      this._options.chart.type = 'radialBar';
    }
    else if (currentType === 'polar') {
      this._options.chart.type = 'polarArea';
    }
    else if (currentType === 'radar') {
      this._options.chart.type = 'radar';
    }
  }

  private updateData() {
    const chartConfig = { ...this._chartConfig, continue: false };

    const commonChart =
      this.data.length != 1 && this._type == 'radar'
        ? buildChart(this.data, chartConfig, null)
        : buildSingleSerieChart(this.data, chartConfig, null);

    if (this.data.length != 1 && this._type == 'radar') {
      this._options.series = commonChart.series;
    } else if (this._type == 'radar') {
      this._options.series = [
        {
          name: 'Series 1',
          data: commonChart.series.flatMap((s) =>
            s.data.filter((d) => d != null)
          ),
        },
      ];
    } else {
      this._options.series = commonChart.series.flatMap((s) =>
        s.data.filter((d) => d != null)
      );
    }
    this._options.labels = commonChart.categories || [];
  }

  private updateLoading() {
    this._options.noData.text = this.isLoading
      ? 'Chargement des données...'
      : 'Aucune donnée';

    if (this.chartInstance()) {
      updateChartOptions(this.chartInstance(), this.ngZone, this._options, false, false, false);
    }
  }
}
