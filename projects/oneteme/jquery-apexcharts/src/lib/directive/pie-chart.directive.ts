import { Directive, ElementRef, EventEmitter, inject, Input, NgZone, OnChanges, OnDestroy, Output, signal, SimpleChanges } from '@angular/core';
import { buildChart, buildSingleSerieChart, ChartProvider, ChartView } from '@oneteme/jquery-core';
import ApexCharts from 'apexcharts';
import { asapScheduler, observeOn } from 'rxjs';
import { ChartCustomEvent, initCommonChartOptions, updateCommonOptions, destroyChart } from './utils';
import { fromPromise } from 'rxjs/internal/observable/innerFrom';

@Directive({
  standalone: true,
  selector: '[pie-chart]',
})
export class PieChartDirective
  implements ChartView<string, number>, OnChanges, OnDestroy
{
  private readonly el: ElementRef = inject(ElementRef);
  private readonly ngZone = inject(NgZone);
  private readonly chartInstance = signal<ApexCharts | null>(null);
  private _chartConfig: ChartProvider<string, number>;
  private _options: any;
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
    if (this.debug) {
      console.log('Initialisation du graphique', { ...this._options });
    }

    this.ngZone.runOutsideAngular(() => {
      try {
        let chart = new ApexCharts(this.el.nativeElement, { ...this._options });
        this.chartInstance.set(chart);
        fromPromise(
          chart.render()
            .then(() => this.debug && console.log(new Date().getMilliseconds(), 'Rendu du graphique terminé'))
            .catch(error => {
              console.error('Erreur lors du rendu du graphique:', error);
              this.chartInstance.set(null);
            })
        )
        .pipe(observeOn(asapScheduler))
        .subscribe({
          next: () => this.debug && console.log(new Date().getMilliseconds(), 'Observable rendu terminé'),
          error: (error) => console.error('Erreur dans le flux Observable:', error)
        });
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du graphique:', error);
      }
    });
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
    destroyChart(this.chartInstance);
  }

  private hydrate(changes: SimpleChanges): void {
    if (this.debug) console.log('Hydratation du graphique', { ...changes });

    const needsDataUpdate = changes['data'] || changes['config'] || changes['type'];
    const needsOptionsUpdate = Object.keys(changes).some(key => !['debug'].includes(key));

    if (needsDataUpdate && this.data && this._chartConfig) {
      this.updateData();
    }

    if (changes['isLoading'] && this.chartInstance()) {
      this._options.noData.text = changes['isLoading'].currentValue
        ? 'Chargement des données...'
        : 'Aucune donnée';

      this.updateChartOptions({
        noData: this._options.noData
      }, false, false, false);
    }

    if (this._options.shouldRedraw) {
      if (this.debug) console.log('Recréation complète du graphique nécessaire', changes);
      this.ngOnDestroy();
      this.init();
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
}
