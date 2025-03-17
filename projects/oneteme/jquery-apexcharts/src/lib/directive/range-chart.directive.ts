import { Directive, ElementRef, EventEmitter, inject, Input, NgZone, OnChanges, OnDestroy, Output, signal, SimpleChanges } from '@angular/core';
import { buildChart, ChartProvider, ChartView, XaxisType } from '@oneteme/jquery-core';
import ApexCharts from 'apexcharts';
import { asapScheduler, Subscription } from 'rxjs';
import { ChartCustomEvent, getType, initCommonChartOptions, updateCommonOptions, initChart, updateChartOptions, hydrateChart, destroyChart } from './utils';

@Directive({
  standalone: true,
  selector: '[range-chart]',
})
export class RangeChartDirective<X extends XaxisType>
  implements ChartView<X, number[]>, OnChanges, OnDestroy
{
  private readonly el: ElementRef = inject(ElementRef);
  private readonly ngZone = inject(NgZone);
  private readonly chartInstance = signal<ApexCharts | null>(null);
  private readonly subscription = new Subscription();
  private _chartConfig: ChartProvider<X, number[]>;
  private _options: any;
  private _type: 'rangeArea' | 'rangeBar' | 'rangeColumn' = 'rangeArea';
  private _canPivot: boolean = true;

  @Input() debug: boolean;
  @Input({ required: true }) data: any[];
  @Output() customEvent: EventEmitter<ChartCustomEvent> = new EventEmitter();
  @Input() set isLoading(isLoading: boolean) {
    this._options.noData.text = isLoading
      ? 'Chargement des données...'
      : 'Aucune donnée';
  }
  @Input() set canPivot(canPivot: boolean) {
    this._canPivot = canPivot;
  }
  get canPivot(): boolean {
    return this._canPivot;
  }
  @Input() set type(type: 'rangeArea' | 'rangeBar' | 'rangeColumn') {
    this._type = type;
    if (this._options.chart.type !== type) {
      this._options.chart.type = type;
      this.configureTypeSpecificOptions();
      this._options.shouldRedraw = true;
    }
  }
  @Input() set config(config: ChartProvider<X, number[]>) {
    this._chartConfig = config;
    this._options = updateCommonOptions(this._options, config);
  }

  constructor() {
    this._options = initCommonChartOptions(
      this.el,
      this.customEvent,
      this.ngZone,
      'rangeArea'
    );
  }

  init() {
    initChart(
      this.el,
      this.ngZone,
      this._options,
      this.chartInstance,
      this.subscription,
      this.debug
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.debug) {
      console.log(
        new Date().getMilliseconds(),
        'Détection de changements',
        changes
      );
    }
    if (changes['type']) this.updateType();
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
      () =>
        updateChartOptions(this.chartInstance(), this.ngZone, this._options),
      this.debug
    );
  }

  private updateType() {
    this.configureTypeSpecificOptions();
    this._options.shouldRedraw = true;
  }

  private configureTypeSpecificOptions() {
    const currentType = this._type;

    if (currentType === 'rangeBar') {
      if (!this._options.plotOptions) this._options.plotOptions = {};
      if (!this._options.plotOptions.bar) this._options.plotOptions.bar = {};
      this._options.plotOptions.bar.horizontal = true;
    } else if (currentType === 'rangeColumn') {
      this._options.chart.type = 'rangeBar';
      if (!this._options.plotOptions) this._options.plotOptions = {};
      if (!this._options.plotOptions.bar) this._options.plotOptions.bar = {};
      this._options.plotOptions.bar.horizontal = false;
    }
  }

  private updateData() {
    let commonChart = buildChart(
      this.data,
      {
        ...this._chartConfig,
        continue: true,
        pivot: !this.canPivot ? false : this._chartConfig.pivot,
      },
      null
    );

    this._options.series = commonChart.series;

    let newType = getType(commonChart);
    if (this._options.xaxis.type != newType) {
      this._options.xaxis.type = newType;
      this._options.shouldRedraw = true;
    }
  }
}
