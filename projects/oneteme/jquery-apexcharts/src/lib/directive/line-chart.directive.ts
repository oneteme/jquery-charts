import { Directive, ElementRef, EventEmitter, inject, Input, NgZone, OnChanges, OnDestroy, Output, signal, SimpleChanges } from '@angular/core';
import { buildChart, ChartProvider, ChartView, XaxisType, YaxisType } from '@oneteme/jquery-core';
import ApexCharts from 'apexcharts';
import { asapScheduler, observeOn, Subscription } from 'rxjs';
import { ChartCustomEvent, getType, initCommonChartOptions, updateCommonOptions, destroyChart } from './utils';
import { fromPromise } from 'rxjs/internal/observable/innerFrom';

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
      if (this.debug) {
        console.log('Initialisation du graphique', { ...this._options });
      }
  
      this.ngZone.runOutsideAngular(() => {
        try {
          let chart = new ApexCharts(this.el.nativeElement, { ...this._options });
          this.chartInstance.set(chart);
          const renderSubscription = fromPromise(
            chart
              .render()
              .then(
                () =>
                  this.debug &&
                  console.log(
                    new Date().getMilliseconds(),
                    'Rendu du graphique terminé'
                  )
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
                console.log(
                  new Date().getMilliseconds(),
                  'Observable rendu terminé'
                ),
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
    if (this.debug) console.log('Hydratation du graphique', { ...changes });

    // Optimisation: regroupement des types de changements pour éviter les opérations redondantes
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
      }, 250);
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
