import { ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges, Directive } from '@angular/core';
import { ChartProvider, ChartView, XaxisType, YaxisType } from '@oneteme/jquery-core';
import * as Highcharts from 'highcharts';
import { ChartCustomEvent } from './utils/types';
import { createHighchartsChart, destroyChart } from './utils/chart-creation';
import { initBaseChartOptions } from './utils/chart-options';
import { initializeHighchartsModules } from './utils/highcharts-modules';
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

  constructor(
    protected readonly el: ElementRef,
    protected readonly _zone: NgZone
  ) {
    initializeHighchartsModules();

    this.loadingManager = new LoadingManager(this.el, this.loadingConfig);

    this._options = initBaseChartOptions(this.type || '', this.debug);
  }

  ngOnDestroy(): void {
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

    // Mise à jour de la config du loading si elle a changé
    if (changes.loadingConfig && this.loadingManager) {
      this.loadingManager.updateConfig(this.loadingConfig);
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
      this.updateData();
      needsUpdate = true;
      this.debug && console.log('Données mises à jour');
    }

    if (changes.type && this.config) {
      this.updateChartType();
      needsUpdate = true;
      this.debug && console.log('Type mis à jour');
    }

    // Planifier la vérification d'état après que tous les changements soient appliqués
    this.scheduleStateCheck(needsUpdate);
  }

  private determineTargetState(): 'loading' | 'noData' | 'chart' {
    if (!this._hasInitializedConfig || !this._isDataLoaded) {
      return 'loading';
    }

    const isDataEmpty = !this.data || this.data.length === 0;
    if (isDataEmpty || this.hasEmptySeries()) {
      return 'noData';
    }

    return 'chart';
  }

  private applyState(state: 'loading' | 'noData' | 'chart', needsUpdate: boolean = false): void {
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
    if (this.stateChangeTimeout) {
      clearTimeout(this.stateChangeTimeout);
    }
    this.stateChangeTimeout = window.setTimeout(() => {
      const targetState = this.determineTargetState();
      this.applyState(targetState, needsUpdate);
    }, 0);
  }

  private showLoadingState(): void {
    this.loadingManager.show();
    if (this.chart) {
      destroyChart(this.chart, undefined, this.debug);
      this.chart = null;
    }
  }

  private showNoDataState(): void {
    this.loadingManager.hide();
    this.loadingManager.showNoData();
    if (this.chart) {
      destroyChart(this.chart, undefined, this.debug);
      this.chart = null;
    }
  }

  private showChartState(needsUpdate: boolean): void {
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
      if (!series || !Array.isArray(series) || series.length === 0) {
        return true;
      }

      return series.every(s => {
        if (!s || typeof s !== 'object') return true;
        const data = s.data;
        return !data || !Array.isArray(data) || data.length === 0 ||
               data.every(point => point === null || point === undefined);
      });
    } catch (error) {
      this.debug && console.warn('Erreur lors de la vérification des séries:', error);
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

    if (!this.chart.options || !this.chart.renderer || this.chart.renderer.forExport) {
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
        console.error('Erreur lors de la destruction après échec de mise à jour:', destroyError);
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
      return;
    }

    if (this.hasEmptySeries()) {
      this.debug && console.log('Pas de séries valides dans les options pour createChart');
      return;
    }

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
        // Réévaluer l'état après création réussie
        this.scheduleStateCheck();
      } else {
        console.error('Échec de la création du graphique');
        // Réévaluer l'état en cas d'échec
        this.scheduleStateCheck();
      }
    });
  }

  // implémentées dans complex et simple chart directive
  protected abstract updateChartType(): void;
  protected abstract updateConfig(): void;
  protected abstract updateData(): void;
}
