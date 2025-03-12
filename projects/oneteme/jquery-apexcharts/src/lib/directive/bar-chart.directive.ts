import { Directive, ElementRef, EventEmitter, inject, Input, NgZone, OnChanges, OnDestroy, Output, signal, SimpleChanges } from '@angular/core';
import { buildChart, ChartProvider, ChartView, naturalFieldComparator, XaxisType } from '@oneteme/jquery-core';
import ApexCharts from 'apexcharts';
import { asapScheduler, Subscription } from 'rxjs';
import { ChartCustomEvent, getType, initCommonChartOptions, updateCommonOptions, initChart, updateChartOptions, hydrateChart, destroyChart } from './utils';

@Directive({
  standalone: true,
  selector: '[bar-chart]',
})
export class BarChartDirective<X extends XaxisType>
  implements ChartView<X, number>, OnChanges, OnDestroy
{
  private el: ElementRef = inject(ElementRef);
  private ngZone = inject(NgZone);
  private readonly chartInstance = signal<ApexCharts | null>(null);
  private subscription = new Subscription();
  private _chartConfig: ChartProvider<X, number>;
  private _options: any;
  private _canPivot: boolean = true;
  // private _type: 'bar' | 'column' | 'funnel' | 'pyramid' = 'bar';

  @Input() debug: boolean;
  @Input({ required: true }) type: 'bar' | 'column' | 'funnel' | 'pyramid';
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
  @Input() set config(config: ChartProvider<X, number>) {
    this._chartConfig = config;
    this._options = updateCommonOptions(this._options, config);
    this.configureTypeSpecificOptions();
  }

  constructor() {
    this._options = initCommonChartOptions(
      this.el,
      this.customEvent,
      this.ngZone,
      'bar'
    );
  }

  init() {
    initChart(this.el, this.ngZone, this._options, this.chartInstance, this.subscription, this.debug);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.debug) console.log(new Date().getMilliseconds(), 'Détection de changements', changes);
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
      () => updateChartOptions(this.chartInstance(), this.ngZone, this._options), this.debug
    );

    if (changes['isLoading']) {
      this.updateLoading();
    }
  }

  private updateType() {
    this._options.chart.type = 'bar';
    this.configureTypeSpecificOptions();
    this._options.shouldRedraw = true;
  }

  private configureTypeSpecificOptions() {
    if (this.type === 'bar') {
      if (!this._options.plotOptions) this._options.plotOptions = {};
      if (!this._options.plotOptions.bar) this._options.plotOptions.bar = {};
      this._options.plotOptions.bar.horizontal = true;
    }
    else if (this.type === 'column') {
      if (!this._options.plotOptions) this._options.plotOptions = {};
      if (!this._options.plotOptions.bar) this._options.plotOptions.bar = {};
      this._options.plotOptions.bar.horizontal = false;
    }
    // Configuration spécifique pour funnel / pyramid ? ajouter ici
  }


  private updateData() {
    let sortedData = [...this.data];
    if (this.type == 'funnel') {
      sortedData = sortedData.sort(
        naturalFieldComparator('asc', this._chartConfig.series[0].data.y)
      );
    } else if (this.type == 'pyramid') {
      sortedData = sortedData.sort(
        naturalFieldComparator('desc', this._chartConfig.series[0].data.y)
      );
    }

    // Construction du graphique avec les données
    const commonChart = buildChart(sortedData, {
      ...this._chartConfig,
      pivot: !this.canPivot ? false : this._chartConfig.pivot,
    });

    this._options.series = commonChart.series.length
      ? commonChart.series.map((s) => ({
          data: s.data,
          name: s.name,
          color: s.color,
          group: s.stack,
        }))
      : [{ data: [] }];

    const newType = getType(commonChart);
    if (this._options.xaxis.type !== newType) {
      this._options.xaxis.type = newType;
      this._options.shouldRedraw = true;
    }

    this._options.xaxis.categories = commonChart.categories || [];
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
