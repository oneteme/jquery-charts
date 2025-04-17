import { Directive, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges, inject, OnInit } from '@angular/core';
import { ChartProvider, ChartView, buildSingleSerieChart, mergeDeep } from '@oneteme/jquery-core';

import NoDataToDisplay from 'highcharts/modules/no-data-to-display';
import Annotations from 'highcharts/modules/annotations';
import Accessibility from 'highcharts/modules/accessibility';
import Funnel from 'highcharts/modules/funnel';
import Exporting from 'highcharts/modules/exporting';
import { createHighchart, destroyChart, initBaseOptions, updateChartOptions, updateLoading, setupToolbar, configurePieOptions } from './utils';
import * as Highcharts from 'highcharts';

// Initialisation des modules Highcharts
NoDataToDisplay(Highcharts);
Annotations(Highcharts);
Accessibility(Highcharts);
Funnel(Highcharts);
Exporting(Highcharts);

@Directive({
  selector: '[simple-chart]',
  standalone: true,
})
export class SimpleChartDirective
  implements ChartView<string, number>, OnChanges, OnDestroy, OnInit
{
  private readonly el: ElementRef = inject(ElementRef);
  private readonly ngZone = inject(NgZone);

  @Input({ required: true }) config: ChartProvider<string, number>;
  @Input({ required: true }) data: any[];
  @Input() isLoading: boolean = false;
  @Input() debug: boolean = false;
  @Output() customEvent: EventEmitter<string> = new EventEmitter();
  @Input({ alias: 'type' }) type: 'pie' | 'donut' | 'pyramid' | 'funnel' =
    'pie';

  chart: Highcharts.Chart;
  private _chartConfig: ChartProvider<string, number> = {};
  private _options: any = {};
  private _shouldRedraw: boolean = true;

  constructor() {
    // Initialiser les options de base
    this._options = initBaseOptions('pie', this.isLoading, this.debug);
  }

  ngOnInit(): void {
    // S'assurer que l'élément est proprement initialisé avant toute création de graphique
    setTimeout(() => {
      this.updateConfig();
      this.createChart();
    }, 0);
  }

  ngOnDestroy(): void {
    destroyChart(this.chart, this.debug);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.debug) {
      console.log('Détection de changements', JSON.parse(JSON.stringify(changes)));
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

    // Ajustement pour le type donut (qui est en fait un pie avec innerSize dans Highcharts)
    let actualType = this.type;
    if (actualType === 'donut') {
      actualType = 'pie';
      configurePieOptions(this._options, 'donut', this.debug);
    } else if (actualType === 'pie') {
      configurePieOptions(this._options, 'pie', this.debug);
    }

    if (this._options.chart?.type !== actualType) {
      mergeDeep(this._options, {
        chart: { type: actualType },
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

    // Ajustement pour le type donut
    let actualType = this.type;
    if (actualType === 'donut') {
      actualType = 'pie';
    }

    // Mettre à jour les options avec les données de configuration
    this._options = updateChartOptions(
      this._options,
      this._chartConfig,
      this.el,
      this.debug
    );

    // Configurer les options spécifiques au type
    if (actualType === 'pie') {
      configurePieOptions(
        this._options,
        this.type === 'donut' ? 'donut' : 'pie',
        this.debug
      );
    }

    // Mettre à jour le type de graphique
    this._options.chart.type = actualType;
    this._options.chart.events = {
      load: () => {
        setupToolbar(
          this.chart,
          this._chartConfig,
          this.customEvent,
          this.ngZone,
          false,
          this.debug
        );
      },
    };
  }

  /**
   * Met à jour les données du graphique en utilisant jquery-core
   */
  updateData() {
    if (this.debug) console.log('Mise à jour des données');

    // Utiliser le framework jQuery-core pour traiter les données
    const chartConfig = { ...this._chartConfig, continue: false };
    const commonChart = buildSingleSerieChart(this.data, chartConfig, null);

    if (this.debug) console.log('Données traitées:', commonChart);

    // Formater les données pour les graphiques simples (pie, donut, funnel, pyramid)
    const formattedData = commonChart.series
      .flatMap((s) => s.data.filter((d) => d != null))
      .map((data, index) => {
        const serieValue: any = {
          name: commonChart.categories[index],
          y: data,
        };

        if (commonChart.series[0]?.color) {
          serieValue.color = commonChart.series[0].color;
        }

        return serieValue;
      });

    if (this.debug) console.log('Données formatées:', formattedData);

    // Mise à jour des options avec les nouvelles données
    mergeDeep(this._options, {
      series: [
        {
          name: chartConfig.ytitle || 'Valeur',
          data: formattedData,
          colorByPoint: true, // Chaque point aura sa propre couleur
        },
      ],
    });
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
      this.ngZone,
      this.debug
    );

    if (createdChart) {
      this.chart = createdChart;
      if (this.debug) console.log('Graphique créé avec succès');
    } else {
      // Si la création a échoué, réessayer après un court délai
      setTimeout(() => this.createChart(), 50);
    }
  }
}
