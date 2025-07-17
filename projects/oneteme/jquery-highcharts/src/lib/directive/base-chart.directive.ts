import { ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges, Directive } from '@angular/core';
import { ChartProvider, ChartView, XaxisType, YaxisType } from '@oneteme/jquery-core';
import * as Highcharts from 'highcharts';
import { ChartCustomEvent } from './utils/types';
import { createHighchartsChart, destroyChart } from './utils/chart-creation';
import { initBaseChartOptions } from './utils/chart-options';
import { initializeHighchartsModules } from './utils/highcharts-modules';
import { LoadingManager } from './utils/loading-manager';
import { NoDataManager } from './utils/no-data-manager';

@Directive()
export abstract class BaseChartDirective<
  X extends XaxisType,
  Y extends YaxisType
> implements ChartView<X, Y>, OnDestroy, OnChanges
{
  @Input({ required: true }) config: ChartProvider<X, Y>;
  @Input({ required: true }) data: any[];
  @Input() isLoading: boolean = false;
  @Input() debug: boolean = false;
  @Input() canPivot: boolean = true;
  @Output() customEvent: EventEmitter<ChartCustomEvent> = new EventEmitter();
  @Input({ alias: 'type' }) type: string;

  chart: Highcharts.Chart;
  protected _chartConfig: ChartProvider<X, Y> = {};
  protected _options: any = {};
  protected _shouldRedraw: boolean = true;
  protected loadingManager: LoadingManager;
  protected noDataManager: NoDataManager;

  constructor(
    protected readonly el: ElementRef,
    protected readonly _zone: NgZone
  ) {
    initializeHighchartsModules();

    this.loadingManager = new LoadingManager(this.el, {
      fadeInDuration: 200,
      fadeOutDuration: 400,
    });

    this.noDataManager = new NoDataManager(this.el, {
      fadeInDuration: 300,
      fadeOutDuration: 200,
    });

    this._options = initBaseChartOptions(this.type || '', this.debug);

    setTimeout(() => {
      if (this.isLoading && (!this.data || this.data.length === 0)) {
        this.loadingManager.show();
      }
    }, 0);
  }

  ngOnDestroy(): void {
    // nettoye tous les timeouts
    if ((this as any)._loadingTimeoutId) {
      clearTimeout((this as any)._loadingTimeoutId);
    }
    destroyChart(this.chart, this.loadingManager, this.debug);
    this.noDataManager.destroy();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.debug && console.log('Détection de changements', changes);

    if (!this.hasRelevantChanges(changes)) {
      return;
    }

    this._zone.runOutsideAngular(() => {
      if (changes.isLoading || changes.data || changes.config) {
        this.handleInitialLoading();
      }

      if (this.config && this.data !== undefined) {
        this.processChanges(changes);
      } else if (this.debug) {
        console.log('Config ou data manquants, attente...', {
          hasConfig: !!this.config,
          hasData: this.data !== undefined,
        });
      }
    });
  }

  protected handleInitialLoading(): void {
    if (this.isLoading && (!this.data || this.data.length === 0)) {
      if (!this.loadingManager.visible) {
        this.loadingManager.show();
      }
    } else if (!this.isLoading && this.loadingManager.visible) {
      this.loadingManager.hide();
    }
  }

  protected processChanges(changes: SimpleChanges): void {
    const needsOptionsUpdate = this.hasRelevantChanges(changes);

    if (changes.isLoading) {
      if (changes.isLoading.currentValue) {
        this.debug && console.log('Affichage du loading...');
        this.loadingManager.show();
        this.noDataManager.hide();

        if (this.chart?.container) {
          this.chart.container.style.opacity = '0';
        }
      } else {
        this.debug && console.log('isLoading désactivé, masquage du loading...');
        this.loadingManager.hide();

        if (this.chart?.container) {
          this.chart.container.style.opacity = '1';
        }
      }
    }

    if (changes.type && this.config) {
      this.debug && console.log('Changement de type détecté:', changes.type.previousValue, '->', changes.type.currentValue);
      this.updateChartType();
    }

    if (changes.config && this.config) this.updateConfig();

    if ((changes.config || changes.data) && this.config && this.data !== undefined) this.updateData();

    if (this._shouldRedraw) {
      if (this.debug) {
        console.log('Recréation complète du graphique nécessaire', changes);
        console.log('_shouldRedraw est true, destruction et recréation...');
      }
      destroyChart(this.chart, undefined, this.debug);
      this.chart = null;
      this.createChart();
      this._shouldRedraw = false;
    } else if (needsOptionsUpdate && this.chart) {
      this.debug && console.log('Mise à jour des options du graphique', changes);
      this.updateChart();
    } else if (needsOptionsUpdate && !this.chart && this.config) {
      this.debug && console.log('Pas de graphique existant, création nécessaire', changes);
      this.createChart();
    }

    setTimeout(() => {
      this.finalizeDataState(changes);
    }, 0);
  }

  protected finalizeDataState(changes: SimpleChanges): void {
    const hasReceivedData = changes.data && this.data !== undefined;
    const hasConfig = !!this.config;

    if (hasReceivedData && hasConfig) {
      this.debug && console.log(
        "Changement de données détecté, évaluation de l'état final..."
      );

      const hasNoData = !this.data || this.data.length === 0;
      const hasNoSeries = !this._options.series ||
        this._options.series.length === 0 ||
        (Array.isArray(this._options.series) &&
          this._options.series.every(
            (s) => !s.data || (Array.isArray(s.data) && s.data.length === 0)
          ));

      if ((hasNoData || hasNoSeries) && !this.isLoading) {
        this.debug && console.log(
          'Données vides reçues avec loading désactivé -> affichage message aucune donnée'
        );

        if (this.loadingManager.visible) {
          this.loadingManager.hide().then(() => {
            this.debug && console.log('Loading masqué, affichage du message aucune donnée');
            this.noDataManager.show();
          });
        } else this.noDataManager.show();
      } else if ((hasNoData || hasNoSeries) && this.isLoading) {
        this.debug && console.log(
          'Données vides reçues avec loading activé -> attente de la fin du loading'
        );

        if (!this.loadingManager.visible) {
          this.loadingManager.show();
        }
        this.noDataManager.hide();

        const timeoutId = setTimeout(() => {
          if (this.isLoading && (!this.data || this.data.length === 0)) {
            this.debug && console.log(
              'Timeout atteint avec loading toujours actif et pas de données -> forcer affichage message'
            );
            this.loadingManager.hide().then(() => {
              this.noDataManager.show();
            });
          }
        }, (this.config as any)?.loadingTimeout || 5000); // à modifier au besoin

        (this as any)._loadingTimeoutId = timeoutId;
      } else if (!hasNoData && !hasNoSeries) {
        this.debug && console.log('Données valides détectées -> masquer tous les messages');
        this.noDataManager.hide();

        if ((this as any)._loadingTimeoutId) {
          clearTimeout((this as any)._loadingTimeoutId);
          (this as any)._loadingTimeoutId = null;
        }
      }
    }
  }

  // filtre params "debug" pour ne pas mettre à jour
  protected hasRelevantChanges(changes: SimpleChanges): boolean {
    return Object.keys(changes).some((key) => !['debug'].includes(key));
  }

  protected updateChart(): void {
    if (!this.chart) {
      this.debug && console.log(
        'Pas de graphique existant pour la mise à jour, création...'
      );
      this.createChart();
      return;
    }

    if (
      !this.chart.options ||
      !this.chart.renderer ||
      this.chart.renderer.forExport
    ) {
      this.debug && console.log('Graphique dans un état invalide, recréation...');
      destroyChart(this.chart, undefined, this.debug);
      this.chart = null;
      this.createChart();
      return;
    }

    try {
      if (!this._options || typeof this._options !== 'object') {
        if (this.debug) console.log('Options invalides pour la mise à jour');
        return;
      }

      this.chart.update(this._options, true, true);
      if (this.debug) console.log('Graphique mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du graphique:', error);
      try {
        destroyChart(this.chart, undefined, this.debug);
      } catch (destroyError) {
        console.error(
          'Erreur lors de la destruction après échec de mise à jour:',
          destroyError
        );
      }
      this.chart = null;
      this.createChart();
    }
  }

  protected createChart(): void {
    if (!this.config) {
      this.debug && console.log('Pas de configuration disponible');
      return;
    }

    if (!this.data || this.data.length === 0) {
      this.debug && console.log('Pas de données disponibles pour createChart');
        console.log('Pas de données disponibles pour createChart');
      return;
    }

    if (
      !this._options.series ||
      this._options.series.length === 0 ||
      (Array.isArray(this._options.series) &&
        this._options.series.every(
          (s) => !s.data || (Array.isArray(s.data) && s.data.length === 0)
        ))
    ) {
      this.debug && console.log('Pas de séries valides dans les options pour createChart');
      return;
    }

    this.noDataManager.hide();

    createHighchartsChart(
      this.el,
      this._options,
      this.config,
      this.customEvent,
      this._zone,
      this.loadingManager,
      this.canPivot,
      this.debug
    ).then((createdChart) => {
      if (createdChart) {
        this.chart = createdChart;
        this.debug && console.log('Graphique créé avec succès');
      } else {
        console.error('Échec de la création du graphique');
      }
    });
  }

  // implémentées dans complex et simple chart directive
  protected abstract updateChartType(): void;
  protected abstract updateConfig(): void;
  protected abstract updateData(): void;
}
