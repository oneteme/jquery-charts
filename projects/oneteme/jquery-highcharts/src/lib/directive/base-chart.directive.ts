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

  constructor(
    protected readonly el: ElementRef,
    protected readonly _zone: NgZone
  ) {
    initializeHighchartsModules();

    this.loadingManager = new LoadingManager(this.el, this.loadingConfig);

    this._options = initBaseChartOptions(this.type || '', this.debug);
  }
  isLoading: boolean;

  ngOnDestroy(): void {
    destroyChart(this.chart, this.loadingManager, this.debug);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.debug && console.log('Détection de changements', changes);

    if (!this.hasRelevantChanges(changes)) {
      return;
    }

    // Mise à jour de la config du loading si elle a changé
    if (changes.loadingConfig) {
      this.loadingManager = new LoadingManager(this.el, this.loadingConfig);
    }

    this._zone.runOutsideAngular(() => {
      this.processChanges(changes);
    });
  }

  protected processChanges(changes: SimpleChanges): void {
    let needsUpdate = false;
    const hasConfig = !!this.config;
    const hasData = this.data !== undefined;
    const isDataEmpty = !this.data || this.data.length === 0;

    if (changes.config && hasConfig) {
      this._hasInitializedConfig = true;
      this.updateConfig();
      needsUpdate = true;
      this.debug && console.log('Configuration mise à jour');
    }

    if (changes.data && hasData) {
      this._isDataLoaded = true;
      this.updateData();
      needsUpdate = true;
      this.debug && console.log('Données mises à jour');
    }

    if (changes.type && hasConfig) {
      this.updateChartType();
      needsUpdate = true;
      this.debug && console.log('Type mis à jour');
    }

    // Gestion automatique des états
    if (!this._hasInitializedConfig || !this._isDataLoaded) {
      this.debug && console.log('État: Loading (attente config/données)');
      this.showLoadingState();
    } else if (isDataEmpty || this.hasEmptySeries()) {
      this.debug && console.log('État: Aucune donnée');
      this.showNoDataState();
    } else {
      this.debug && console.log('État: Affichage du graphique');
      this.showChartState(needsUpdate);
    }
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
    return !this._options.series ||
      this._options.series.length === 0 ||
      (Array.isArray(this._options.series) &&
        this._options.series.every(
          (s) => !s.data || (Array.isArray(s.data) && s.data.length === 0)
        ));
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
