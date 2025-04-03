import { Directive, ElementRef, EventEmitter, inject, Input, NgZone, OnChanges, OnDestroy, Output, signal, SimpleChanges } from '@angular/core';
import { buildChart, ChartProvider, ChartView, naturalFieldComparator, XaxisType } from '@oneteme/jquery-core';
import ApexCharts from 'apexcharts';
import { asapScheduler, observeOn, Subscription } from 'rxjs';
import { ChartCustomEvent, getType, initCommonChartOptions, updateCommonOptions, destroyChart } from './utils';
import { fromPromise } from 'rxjs/internal/observable/innerFrom';

@Directive({
  standalone: true,
  selector: '[bar-chart]',
})
export class BarChartDirective<X extends XaxisType>
  implements ChartView<X, number>, OnChanges, OnDestroy
{
  private readonly el: ElementRef = inject(ElementRef);
  private readonly ngZone = inject(NgZone);
  private readonly chartInstance = signal<ApexCharts | null>(null);
  private readonly subscription = new Subscription();
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

  @Output() readonly chartReady: EventEmitter<{ chartObj: ApexCharts }> = new EventEmitter<{ chartObj: ApexCharts }>();

  constructor() {
    this._options = initCommonChartOptions(this.el, this.customEvent, this.ngZone, 'bar');
  }

  init() {
    if (this.debug) {
      console.log('Initialisation du graphique { ...this._options }', { ...this._options });
      console.log('Initialisation du graphique this._options', this._options);
    }

    this.ngZone.runOutsideAngular(() => {
      try {
        let chart = new ApexCharts(this.el.nativeElement, { ...this._options });
        this.chartInstance.set(chart);
        const renderSubscription = fromPromise(
          chart
            .render()
            .then(
              () => this.debug && console.log(new Date().getMilliseconds(), 'Rendu du graphique terminé')
            )
            .catch((error) => {
              console.error('Erreur lors du rendu du graphique:', error);
              this.chartInstance.set(null);
            })
        )
          .pipe(observeOn(asapScheduler))
          .subscribe({
            next: () =>
              this.debug &&
              console.log(new Date().getMilliseconds(), 'Observable rendu terminé'),
            error: (error) =>
              console.error('Erreur dans le flux Observable:', error),
          });

        // Ajout au gestionnaire d'abonnements
        this.subscription.add(renderSubscription);
      } catch (error) {
        console.error("Erreur lors de l'initialisation du graphique:", error);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.debug)
      console.log(new Date().getMilliseconds(), 'Détection de changements', changes);
    if (changes['type']) this.updateType();
    this.ngZone.runOutsideAngular(() => {
      asapScheduler.schedule(() => this.hydrate(changes));
    });
  }

  ngOnDestroy() {
    destroyChart(this.chartInstance, this.subscription);
  }

  private hydrate(changes: SimpleChanges): void {
    if (this.debug) console.log('Hydratation du graphique', { ...changes });
    const needsDataUpdate = changes['data'] || changes['config'] || changes['type'];
    const needsOptionsUpdate = Object.keys(changes).some(key => !['debug'].includes(key));

    // Mise à jour des données si nécessaire
    if (needsDataUpdate && this.data && this._chartConfig) {
      this.updateData();
    }

    // Mise à jour spécifique pour isLoading
    if (changes['isLoading'] && this.chartInstance()) {
      this._options.noData.text = changes['isLoading'].currentValue
        ? 'Chargement des données...'
        : 'Aucune donnée';

      // Mise à jour immédiate des options de noData sans redessiner complètement
      this.updateChartOptions({
        noData: this._options.noData
      }, false, false, false);
    }

    // Stratégie de mise à jour optimisée
    if (this._options.shouldRedraw) {
      if (this.debug) console.log('Recréation complète du graphique nécessaire', changes);
      setTimeout(() => {
        this.ngOnDestroy();
        this.init();
      }, 200);
      delete this._options.shouldRedraw;
    } else if (needsOptionsUpdate) {
      if (this.debug) console.log('Mise à jour des options du graphique', changes);
      this.updateChartOptions();
    }
  }

  private updateChartOptions(
    specificOptions?: any,
    redrawPaths: boolean = true,
    animate: boolean = true,
    updateSyncedCharts: boolean = false
  ): Promise<void> {
    const chartInstance = this.chartInstance();
    if (!chartInstance) return Promise.resolve();

    const options = specificOptions || this._options;

    return this.ngZone.runOutsideAngular(() =>
      chartInstance.updateOptions(
        { ...options },
        redrawPaths,
        animate,
        updateSyncedCharts
      ).catch(error => {
        console.error('Erreur lors de la mise à jour des options:', error);
        return Promise.resolve();
      })
    );
  }

  private updateType() {
    this._options.chart.type = 'bar';
    this.configureTypeSpecificOptions();
    this._options.shouldRedraw = true;
  }

  private configureTypeSpecificOptions() {
    if (!this._options.plotOptions) this._options.plotOptions = {};
    if (!this._options.plotOptions.bar) this._options.plotOptions.bar = {};

    if (this._options.plotOptions.bar.horizontal === undefined) {
      if (this.type === 'bar') {
        this._options.plotOptions.bar.horizontal = true;
      } else if (this.type === 'column') {
        this._options.plotOptions.bar.horizontal = false;
      }
    }

    if (this.type === 'funnel' || this.type === 'pyramid') {
      this._options.plotOptions.bar.isFunnel = true;
      this._options.plotOptions.bar.horizontal = true;
    }
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
}
