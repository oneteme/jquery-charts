import { Directive, ElementRef, Input, NgZone, inject } from '@angular/core';
import { XaxisType, YaxisType, buildChart, mergeDeep } from '@oneteme/jquery-core';
import { BaseChartDirective } from './base-chart.directive';
import { getType } from './utils';

import * as Highcharts from 'highcharts';
import more from 'highcharts/highcharts-more';
import Exporting from 'highcharts/modules/exporting';
import NoDataToDisplay from 'highcharts/modules/no-data-to-display';
import Annotations from 'highcharts/modules/annotations';
import Accessibility from 'highcharts/modules/accessibility';
import Treemap from 'highcharts/modules/treemap';
import Heatmap from 'highcharts/modules/heatmap';

// Initialisation des modules Highcharts
more(Highcharts);
Exporting(Highcharts);
NoDataToDisplay(Highcharts);
Annotations(Highcharts);
Accessibility(Highcharts);
Treemap(Highcharts);
Heatmap(Highcharts);

// Directive pour graph complex = données complexes (bar, column, line, area, spline, etc.)
@Directive({
  selector: '[complex-chart]',
  standalone: true,
})
export class ComplexChartDirective<
  X extends XaxisType
> extends BaseChartDirective<X, YaxisType> {
  @Input({ alias: 'type' }) override type:
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

  constructor() {
    super(inject(ElementRef), inject(NgZone));
  }

  // MAJ du type
  protected override updateChartType(): void {
    if (this.debug) console.log('Mise à jour du type de graphique:', this.type);

    if (this._options.chart?.type !== this.type) {
      mergeDeep(this._options, {
        chart: { type: this.type },
      });
      this._shouldRedraw = true;
    }
  }

  // MAJ de la config
  protected override updateConfig(): void {
    if (this.debug) console.log('Mise à jour de la configuration');

    this._chartConfig = this.config;

    // Mettre à jour les options avec les données de configuration
    this._options = mergeDeep(
      {},
      this._options,
      {
        chart: {
          type: this.type,
          height: this._chartConfig.height ?? '100%',
          width: this._chartConfig.width ?? '100%',
          stacked: this._chartConfig.stacked,
        },
        title: {
          text: this._chartConfig.title,
        },
        subtitle: {
          text: this._chartConfig.subtitle,
        },
        xAxis: {
          title: {
            text: this._chartConfig.xtitle,
          },
        },
        yAxis: {
          title: {
            text: this._chartConfig.ytitle,
          },
        },
        // Options spécifiques aux graphiques complexes
        plotOptions: {
          series: {
            stacking: this._chartConfig.stacked ? 'normal' : undefined,
          },
        },
        tooltip: {
          shared: true,
        },
      },
      this._chartConfig.options ?? {}
    );
  }

  /**
   * Met à jour les données du graphique en utilisant jquery-core
   */
  protected override updateData(): void {
    if (this.debug) console.log('Mise à jour des données');

    try {
      const chartConfig = { ...this._chartConfig, continue: false };
      const commonChart = buildChart(this.data, chartConfig, null);

      if (this.debug) console.log('Données traitées:', commonChart);

      // Déterminer le type d'axe X en fonction des données
      const xAxisType = getType(commonChart);

      if (this.debug) console.log("Type d'axe X détecté:", xAxisType);

      // Mise à jour des options avec les nouvelles données
      if (commonChart?.categories) {
        mergeDeep(this._options, {
          xAxis: {
            categories: commonChart.categories,
            type: xAxisType, // Utiliser le type détecté automatiquement
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
}
