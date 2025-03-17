import { Directive, ElementRef, EventEmitter, inject, Input, NgZone, OnChanges, OnDestroy, Output, signal, SimpleChanges } from '@angular/core';
import { buildChart, ChartProvider, ChartView, XaxisType, YaxisType } from '@oneteme/jquery-core';
import ApexCharts from 'apexcharts';
import { asapScheduler, Subscription } from 'rxjs';
import { ChartCustomEvent, getType, initCommonChartOptions, updateCommonOptions, initChart, updateChartOptions, hydrateChart, destroyChart } from './utils';

@Directive({
  standalone: true,
  selector: '[line-chart]',
})
export class LineChartDirective<X extends XaxisType, Y extends YaxisType>
  implements ChartView<X, Y>, OnChanges, OnDestroy
{
  private readonly el: ElementRef = inject(ElementRef);
  private readonly ngZone = inject(NgZone);
  private readonly chartInstance = signal<ApexCharts | null>(null);
  private _chartConfig: ChartProvider<X, Y>;
  private _options: any;

  // Abonnement global pour éviter les fuites de mémoire
  private readonly subscription = new Subscription();

  @Input() debug: boolean;
  @Input({ required: true }) data: any[];
  @Output() customEvent: EventEmitter<ChartCustomEvent> = new EventEmitter();

  /**
   * Setter pour l'état de chargement
   */
  @Input()
  set isLoading(isLoading: boolean) {
    this._options.noData.text = isLoading
      ? 'Chargement des données...'
      : 'Aucune donnée';
  }

  /**
   * Setter pour la gestion du type
   */
  @Input()
  set type(type: 'line' | 'area') {
    if (this._options.chart.type !== type) {
      this._options.chart.type = type;
      this._options.shouldRedraw = true;
    }
  }

  /**
   * Setter pour la configuration du graphique
   */
  @Input()
  set config(config: ChartProvider<X, Y>) {
    this._chartConfig = config;
    this._options = updateCommonOptions(this._options, config);

    // Vérifier si sparkline est activé pour masquer l'axe Y
    if (config.options?.chart?.sparkline?.enabled) {
      if (!this._options.yaxis) this._options.yaxis = {};
      this._options.yaxis.show = false;
      this._options.yaxis.showAlways = false;
      if (!this._options.yaxis.labels) this._options.yaxis.labels = {};
      this._options.yaxis.labels.show = false;
    }
  }

  constructor() {
    this._options = initCommonChartOptions(this.el, this.customEvent, this.ngZone, 'line');
  }

  /**
   * Initialise le graphique ApexCharts
   */
  init() {
    initChart(this.el, this.ngZone, this._options, this.chartInstance, this.subscription, this.debug);
  }

  /**
   * Gestion des changements de propriétés d'entrée
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (this.debug) {
      console.log(new Date().getMilliseconds(), 'Détection de changements', changes);
    }

    // Exécution en dehors de la zone Angular pour éviter les détections de changement inutiles
    this.ngZone.runOutsideAngular(() => {
      asapScheduler.schedule(() => this.hydrate(changes));
    });
  }

  /**
   * Nettoyage lors de la destruction du composant
   */
  ngOnDestroy() {
    destroyChart(this.chartInstance, this.subscription);
  }

  /**
   * Méthode centrale qui gère l'actualisation du graphique en fonction des changements
   * Optimisée pour minimiser les rendus inutiles
   */
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
  }

  /**
   * Met à jour les données du graphique
   */
  private updateData() {
    let commonChart = buildChart(
      this.data,
      { ...this._chartConfig, continue: true },
      null
    );
    this._options.series = commonChart.series;

    // Détection de changement de type d'axe X qui nécessite une recréation
    let newType = getType(commonChart);
    if (this._options.xaxis.type != newType) {
      this._options.xaxis.type = newType;
      this._options.shouldRedraw = true;
    }
  }
}
