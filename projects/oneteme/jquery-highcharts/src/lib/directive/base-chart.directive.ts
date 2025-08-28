import { ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges, Directive } from '@angular/core';
import { ChartProvider, ChartView, XaxisType, YaxisType } from '@oneteme/jquery-core';
import { Highcharts } from './utils/highcharts-modules';
import { ChartCustomEvent } from './utils/types';
import { createHighchartsChart, destroyChart } from './utils/chart-creation';
import { initBaseChartOptions } from './utils/chart-options';
import { LoadingManager, LoadingConfig } from './utils/loading-manager';

@Directive()
export abstract class BaseChartDirective<
  X extends XaxisType,
  Y extends YaxisType
> implements ChartView<X, Y>, OnDestroy, OnChanges
{
  @Input({ required: true }) config: ChartProvider<X, Y>;
  @Input({ required: true }) data: any[];
  @Input() debug: boolean = false;
  @Input() canPivot: boolean = true;
  @Input() loadingConfig: LoadingConfig = {};
  @Output() customEvent: EventEmitter<ChartCustomEvent> = new EventEmitter();
  @Input({ alias: 'type' }) type: string;

  chart: Highcharts.Chart;
  protected _chartConfig: ChartProvider<X, Y> = {};
  protected _options: any = {};
  protected _shouldRedraw: boolean = true;
  protected loadingManager: LoadingManager;
  private _isDataLoaded: boolean = false;
  private _hasInitializedConfig: boolean = false;
  private stateChangeTimeout: number | undefined;
  private lastStateApplied: 'loading' | 'noData' | 'chart' | null = null;
  private _lastSeriesCheck: { series: any[]; result: boolean } | null = null;
  private isDestroyed: boolean = false;
  private _isTypeChanging: boolean = false;

  constructor(
    protected readonly el: ElementRef,
    protected readonly _zone: NgZone
  ) {
    this.loadingManager = new LoadingManager(this.el, {});

    this._options = initBaseChartOptions(this.type || '', this.debug);
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    if (this.stateChangeTimeout) {
      clearTimeout(this.stateChangeTimeout);
    }
    destroyChart(this.chart, this.loadingManager, this.debug);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.debug && console.log('Détection de changements', changes);

    if (!this.hasRelevantChanges(changes)) {
      return;
    }

    if (changes.loadingConfig || !this.loadingManager) {
      if (this.loadingManager) {
        this.loadingManager.updateConfig(this.loadingConfig);
      } else {
        this.loadingManager = new LoadingManager(this.el, this.loadingConfig);
      }
    }

    this._zone.runOutsideAngular(() => {
      this.processChanges(changes);
    });
  }

  protected processChanges(changes: SimpleChanges): void {
    let needsUpdate = false;

    if (changes.config && this.config) {
      this._hasInitializedConfig = true;
      this.updateConfig();
      needsUpdate = true;
      this.debug && console.log('Configuration mise à jour');
    }

    if (changes.data && this.data !== undefined) {
      this._isDataLoaded = true;
      this._lastSeriesCheck = null;
      this.updateData();
      needsUpdate = true;
      this.debug && console.log('Données mises à jour');
    }

    if (changes.type && this.config) {
      this._isTypeChanging = true;
      this._lastSeriesCheck = null;
      this.updateChartType();
      needsUpdate = true;
      this.debug && console.log('Type mis à jour');
    }
    this.scheduleStateCheck(needsUpdate);
  }

  private determineTargetState(): 'loading' | 'noData' | 'chart' {
    if (!this._hasInitializedConfig || !this._isDataLoaded) {
      return 'loading';
    }

    if (this._isTypeChanging) {
      const isDataEmpty = !this.data || this.data.length === 0;
      const hasEmptySeriesResult = this.hasEmptySeries();

      if (isDataEmpty || hasEmptySeriesResult) {
        this.debug &&
          console.log(
            'Changement de type en cours avec données invalides, affichage du loading'
          );
        return 'loading';
      } else {
        this.debug &&
          console.log(
            'Changement de type en cours mais données valides, permettre la création du chart'
          );
      }
    }

    const isDataEmpty = !this.data || this.data.length === 0;
    if (isDataEmpty || this.hasEmptySeries()) {
      return 'noData';
    }

    return 'chart';
  }

  private applyState(
    state: 'loading' | 'noData' | 'chart',
    needsUpdate: boolean = false
  ): void {
    // Permet d'viter les appels répétés inutiles
    if (this.lastStateApplied === state && !needsUpdate) {
      this.debug && console.log(`État ${state} déjà appliqué, ignore`);
      return;
    }

    this.debug && console.log(`État appliqué: ${state}`);
    this.lastStateApplied = state;

    switch (state) {
      case 'loading':
        this.showLoadingState();
        break;
      case 'noData':
        this.showNoDataState();
        break;
      case 'chart':
        this.showChartState(needsUpdate);
        break;
    }
  }

  private scheduleStateCheck(needsUpdate: boolean = false): void {
    if (this.isDestroyed) {
      return;
    }

    if (this.stateChangeTimeout) {
      clearTimeout(this.stateChangeTimeout);
    }
    this.stateChangeTimeout = window.setTimeout(() => {
      if (this.isDestroyed) {
        return;
      }

      try {
        const targetState = this.determineTargetState();
        this.applyState(targetState, needsUpdate);
      } catch (error) {
        console.error("Erreur lors de la vérification d'état:", error);
        if (!this.isDestroyed) {
          this.showLoadingState();
        }
      }
    }, 0);
  }

  private showLoadingState(): void {
    if (this.isDestroyed) return;

    this.loadingManager.show();
    if (this.chart) {
      destroyChart(this.chart, undefined, this.debug);
      this.chart = null;
    }
  }

  private showNoDataState(): void {
    if (this.isDestroyed) return;

    this.loadingManager.hide();
    this.loadingManager.showNoData();
    if (this.chart) {
      destroyChart(this.chart, undefined, this.debug);
      this.chart = null;
    }
  }

  private showChartState(needsUpdate: boolean): void {
    if (this.isDestroyed) return;

    this.loadingManager.hide();
    this.loadingManager.hideNoData();

    if (this._shouldRedraw) {
      if (this.chart) {
        destroyChart(this.chart, undefined, this.debug);
        this.chart = null;
      }
      this.createChart();
      this._shouldRedraw = false;
    } else if (needsUpdate && this.chart) {
      this.updateChart();
    } else if (!this.chart) {
      this.createChart();
    }
  }

  private hasEmptySeries(): boolean {
    try {
      const series = this._options?.series;

      if (this._lastSeriesCheck && this._lastSeriesCheck.series === series) {
        return this._lastSeriesCheck.result;
      }

      if (!series || !Array.isArray(series) || series.length === 0) {
        const result = true;
        this._lastSeriesCheck = { series, result };
        return result;
      }

      const result = series.every((s) => {
        if (!s || typeof s !== 'object') return true;
        const data = s.data;
        return (
          !data ||
          !Array.isArray(data) ||
          data.length === 0 ||
          data.every((point) => point === null || point === undefined)
        );
      });

      this._lastSeriesCheck = { series, result };
      return result;
    } catch (error) {
      this.debug &&
        console.warn('Erreur lors de la vérification des séries:', error);
      return true;
    }
  }

  protected hasRelevantChanges(changes: SimpleChanges): boolean {
    return Object.keys(changes).some((key) => !['debug'].includes(key));
  }

  protected updateChart(): void {
    if (!this.chart) {
      this.createChart();
      return;
    }

    if (
      !this.chart.options ||
      !this.chart.renderer ||
      this.chart.renderer.forExport
    ) {
      this.debug &&
        console.log('Graphique dans un état invalide, recréation...');
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
    if (this.isDestroyed) return;

    const currentConfig = this.config;
    const currentData = this.data;
    const currentOptions = { ...this._options };

    if (!currentConfig) {
      this.debug && console.log('Pas de configuration disponible');
      return;
    }

    if (!currentData || currentData.length === 0) {
      this.debug && console.log('Pas de données disponibles pour createChart');
      return;
    }

    if (this.hasEmptySeries()) {
      this.debug &&
        console.log('Pas de séries valides dans les options pour createChart');
      return;
    }

    createHighchartsChart(
      this.el,
      currentOptions,
      currentConfig,
      this.customEvent,
      this._zone,
      this.loadingManager,
      this.canPivot,
      this.debug
    )
      .then((createdChart) => {
        if (this.isDestroyed) {
          if (createdChart) {
            destroyChart(createdChart, undefined, this.debug);
          }
          return;
        }

        if (currentConfig === this.config && currentData === this.data) {
          if (createdChart) {
            this.chart = createdChart;
            this._isTypeChanging = false;
            this.debug &&
              console.log(
                'Graphique créé avec succès, flag _isTypeChanging réinitialisé'
              );
          } else {
            console.error('Échec de la création du graphique');
            this._isTypeChanging = false;
          }
        } else {
          this.debug &&
            console.log(
              'Données changées pendant la création, nettoyage et re-planification'
            );
          if (createdChart) {
            destroyChart(createdChart, undefined, this.debug);
          }
          this.scheduleStateCheck();
        }
      })
      .catch((error) => {
        if (!this.isDestroyed) {
          console.error('Erreur lors de la création du graphique:', error);
          this._isTypeChanging = false;
          this.scheduleStateCheck();
        }
      });
  }

  // implémentées dans complex et simple chart directive
  protected abstract updateChartType(): void;
  protected abstract updateConfig(): void;
  protected abstract updateData(): void;
}
