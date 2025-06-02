import { ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges, Directive } from '@angular/core';
import { ChartProvider, ChartView, XaxisType, YaxisType } from '@oneteme/jquery-core';
import * as Highcharts from 'highcharts';
import { ChartCustomEvent } from './utils/types';
import { createHighchartsChart, destroyChart } from './utils/chart-creation';
import { initBaseChartOptions } from './utils/chart-options';

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

  constructor(
    protected readonly el: ElementRef,
    protected readonly _zone: NgZone
  ) {
    this._options = initBaseChartOptions(
      this.type || '',
      this.isLoading,
      this.debug
    );
  }

  ngOnDestroy(): void {
    destroyChart(this.chart, this.debug);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.debug) {
      console.log('Détection de changements', changes);
    }

    this._zone.runOutsideAngular(() => {
      if (this.config && this.data) {
        this.processChanges(changes);
      }
    });
  }

  protected processChanges(changes: SimpleChanges): void {
    const needsOptionsUpdate = this.hasRelevantChanges(changes);

    // Gestion des différents types de changements
    if (changes.type) {
      this.updateChartType();
    }

    if (changes.config) {
      this.updateConfig();
    }

    if (changes.config || changes.data) {
      this.updateData();
    }

    // Application des changements au graphique
    if (this._shouldRedraw) {
      if (this.debug) {
        console.log('Recréation complète du graphique nécessaire', changes);
      }
      destroyChart(this.chart, this.debug);
      this.createChart();
      this._shouldRedraw = false;
    } else if (needsOptionsUpdate && this.chart) {
      if (this.debug) {
        console.log('Mise à jour des options du graphique', changes);
      }
      this.updateChart();
    }
  }

  // permet de filtrer le params "debug" pour ne pas mettre à jour
  protected hasRelevantChanges(changes: SimpleChanges): boolean {
    return Object.keys(changes).some((key) => !['debug'].includes(key));
  }

  // Met à jour les options du graph existant
  protected updateChart(): void {
    if (this.chart) {
      try {
        this.chart.update(this._options, true, true);
        if (this.debug) console.log('Graphique mis à jour avec succès');
      } catch (error) {
        console.error('Erreur lors de la mise à jour du graphique:', error);
        // En cas d'erreur de mise à jour, recréer le graphique
        destroyChart(this.chart, this.debug);
        this.createChart();
      }
    } else {
      this.createChart();
      if (this.debug) console.log('La mise à jour du graphique a échoué. il a été re créé complètement');
    }
  }

  // Crée un nouveau graph
  protected createChart(): void {
    const createdChart = createHighchartsChart(
      this.el,
      this._options,
      this.config,
      this.customEvent,
      this._zone,
      this.canPivot,
      this.debug
    );

    if (createdChart) {
      this.chart = createdChart;
      if (this.debug) console.log('Graphique créé avec succès');
    } else {
      console.error('Échec de la création du graphique');
    }
  }

  // implémentées dans complex et simple chart directive
  protected abstract updateChartType(): void;
  protected abstract updateConfig(): void;
  protected abstract updateData(): void;
}
