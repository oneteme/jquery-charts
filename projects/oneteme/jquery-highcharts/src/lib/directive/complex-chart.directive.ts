import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import {
  ChartProvider,
  ChartView,
  XaxisType,
  YaxisType,
  buildChart,
  mergeDeep,
} from '@oneteme/jquery-core';

import * as Highcharts from 'highcharts';
import more from 'highcharts/highcharts-more';
import Exporting from 'highcharts/modules/exporting';
import NoDataToDisplay from 'highcharts/modules/no-data-to-display';
import Annotations from 'highcharts/modules/annotations';
import Accessibility from 'highcharts/modules/accessibility';
import Treemap from 'highcharts/modules/treemap';
import Heatmap from 'highcharts/modules/heatmap';
import {
  createHighchart,
  destroyChart,
  initBaseOptions,
  updateChartOptions,
  updateLoading,
  ChartCustomEvent,
} from './utils';

// Initialisation des modules Highcharts
more(Highcharts);
NoDataToDisplay(Highcharts);
Annotations(Highcharts);
Accessibility(Highcharts);
Treemap(Highcharts);
Heatmap(Highcharts);
Exporting(Highcharts);

@Directive({
  selector: '[complex-chart]',
  standalone: true,
})
export class ComplexChartDirective<X extends XaxisType>
  implements ChartView<X, YaxisType>, OnChanges, OnDestroy
{
  private readonly el: ElementRef = inject(ElementRef);
  private readonly ngZone = inject(NgZone);

  @Input({ required: true }) config: ChartProvider<X, YaxisType> = {};
  @Input({ required: true }) data: any[];
  @Input() isLoading: boolean = false;
  @Input() debug: boolean = false;
  @Input() canPivot: boolean = true;
  @Output() customEvent: EventEmitter<ChartCustomEvent> = new EventEmitter();
  @Input({ alias: 'type' }) type:
    | 'bar'
    | 'column'
    | 'columnpyramid'
    | 'line'
    | 'area'
    | 'spline'
    | 'areaspline'
    | 'columnrange'
    | 'arearange'
    | 'areasplinerange'
    | 'scatter'
    | 'bubble'
    | 'heatmap'
    | 'treemap' = 'bar';

  chart: Highcharts.Chart;
  private _chartConfig: ChartProvider<X, YaxisType> = {};
  private _options: any = {};
  private _shouldRedraw: boolean = true;

  constructor() {
    // Initialiser les options de base
    this._options = initBaseOptions(
      this.el,
      this.customEvent,
      this.ngZone,
      this.type,
      this.canPivot,
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

    this.ngZone.runOutsideAngular(() => {
      if (this.config && this.data) {
        const needsOptionsUpdate = Object.keys(changes).some(
          (key) => !['debug'].includes(key)
        );

        if (changes.type) {
          this.updateChartType();
        }

        if (changes.isLoading) {
          updateLoading(this._options, this.chart, this.isLoading, this.debug);
        }

        if (changes.config) {
          this.updateConfig();
        }

        if (changes.config || changes.data) {
          this.updateData();
        }

        if (this._shouldRedraw) {
          if (this.debug)
            console.log('Recréation complète du graphique nécessaire', changes);
          destroyChart(this.chart, this.debug);
          this.createChart();
          this._shouldRedraw = false;
        } else if (needsOptionsUpdate && this.chart) {
          if (this.debug)
            console.log('Mise à jour des options du graphique', changes);
          this.updateChart();
        }
      }
    });
  }

  /**
   * Met à jour le type de graphique
   */
  updateChartType() {
    if (this.debug) console.log('Mise à jour du type de graphique:', this.type);

    const newChartType = this.type;
    if (this._options.chart?.type !== newChartType) {
      mergeDeep(this._options, {
        chart: { type: newChartType },
      });
      this._shouldRedraw = true;
    }
  }

  /**
   * Met à jour la configuration du graphique
   */
  updateConfig() {
    if (this.debug) console.log('Mise à jour de la configuration');

    this._chartConfig = this.config;

    // Mettre à jour les options avec les données de configuration
    this._options = updateChartOptions(
      this._options,
      this._chartConfig,
      this.el,
      this.debug
    );

    // Mettre à jour le type de graphique
    this._options.chart.type = this.type;

    // Options spécifiques aux graphiques complexes
    mergeDeep(this._options, {
      plotOptions: {
        series: {
          stacking: this._chartConfig.stacked ? 'normal' : undefined,
        },
      },
      tooltip: {
        shared: true,
      },
    });
  }

  /**
   * Met à jour les données du graphique en utilisant jquery-core
   */
  updateData() {
    if (this.debug) console.log('Mise à jour des données');

    try {
      // Utiliser le framework jQuery-core pour traiter les données
      const chartConfig = { ...this._chartConfig, continue: false };
      const commonChart = buildChart(this.data, chartConfig, null);

      if (this.debug) console.log('Données traitées:', commonChart);

      // Mise à jour des options avec les nouvelles données
      if (commonChart?.categories) {
        mergeDeep(this._options, {
          xAxis: {
            categories: commonChart.categories,
          },
          series: commonChart.series || [],
        });
      } else {
        console.warn(
          'Aucune catégorie ou données de série trouvée dans commonChart'
        );
      }
    } catch (error) {
      console.error('Erreur lors du traitement des données:', error);
    }
  }

  /**
   * Met à jour le graphique existant avec les nouvelles options
   */
  updateChart() {
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
    }
  }

  /**
   * Crée un nouveau graphique Highcharts
   */
  createChart() {
    // Créer le graphique avec la fonction utilitaire
    const createdChart = createHighchart(
      this.el,
      this._options,
      this.config, // Passer la config pour la toolbar
      this.customEvent, // pour la toolbar
      this.ngZone,
      this.canPivot, // pour la toolbar
      this.debug
    );

    if (createdChart) {
      this.chart = createdChart;
      if (this.debug) console.log('Graphique créé avec succès');
    } else {
      console.error('Échec de la création du graphique');
      // Si la création échoue, on peut réessayer après un court délai
      // this.ngZone.runOutsideAngular(() => {
      //   setTimeout(() => {
      //     if (!this.chart) this.createChart();
      //   }, 100);
      // });
    }
  }
}
