import { Directive, ElementRef, Input, NgZone, inject } from '@angular/core';
import { buildSingleSerieChart, mergeDeep } from '@oneteme/jquery-core';
import { BaseChartDirective } from './base-chart.directive';
import { configurePieOptions, configurePolarRadarOptions } from './utils';

import * as Highcharts from 'highcharts';
import more from 'highcharts/highcharts-more';
import NoDataToDisplay from 'highcharts/modules/no-data-to-display';
import Annotations from 'highcharts/modules/annotations';
import Accessibility from 'highcharts/modules/accessibility';
import Exporting from 'highcharts/modules/exporting';
import ExportDataModule from 'highcharts/modules/export-data';
import Funnel from 'highcharts/modules/funnel';

// Initialisation des modules Highcharts
more(Highcharts);
NoDataToDisplay(Highcharts);
Annotations(Highcharts);
Accessibility(Highcharts);
Exporting(Highcharts);
ExportDataModule(Highcharts);
Funnel(Highcharts);

// Directive pour graph simple = données simples (pie, donut, polar, radar, funnel, pyramid)
@Directive({
  selector: '[simple-chart]',
  standalone: true,
})
export class SimpleChartDirective extends BaseChartDirective<string, number> {
  @Input({ alias: 'type' }) override type:
    | 'pie'
    | 'donut'
    | 'polar'
    | 'radar'
    | 'funnel'
    | 'pyramid'
    | 'pictorial' = 'pie';

  constructor() {
    super(inject(ElementRef), inject(NgZone));
  }

  /**
   * Met à jour le type de graphique
   */
  protected override updateChartType(): void {
    if (this.debug) console.log('Mise à jour du type de graphique:', this.type);

    // Ajustement pour le type donut (qui est en fait un pie avec innerSize dans Highcharts)
    let actualType = this.type;
    if (actualType === 'donut') {
      actualType = 'pie';
      configurePieOptions(this._options, 'donut', this.debug);
    } else if (actualType === 'pie') {
      configurePieOptions(this._options, 'pie', this.debug);
    } else if (actualType === 'polar' || actualType === 'radar') {
      // Pour les graphiques polar et radar, on utilise notre fonction de configuration spécifique
      configurePolarRadarOptions(this._options, actualType, this.debug);
      this._shouldRedraw = true;
      return; // Les options de type ont été entièrement configurées
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
  protected override updateConfig(): void {
    if (this.debug) console.log('Mise à jour de la configuration');

    this._chartConfig = this.config;

    // Ajustement pour le type donut
    let actualType = this.type;
    if (actualType === 'donut') {
      actualType = 'pie';
    }

    // Mettre à jour les options avec les données de configuration
    // For simple charts, we only need specific configurations
    this._options = mergeDeep(
      {},
      this._options,
      {
        chart: {
          type: actualType,
          height: this._chartConfig.height ?? '100%',
          width: this._chartConfig.width ?? '100%',
        },
        title: {
          text: this._chartConfig.title,
        },
        subtitle: {
          text: this._chartConfig.subtitle,
        },
        plotOptions: {
          series: {
            dataLabels: {
              enabled: true,
            },
          },
        },
      },
      this._chartConfig.options ?? {}
    );

    // Configurer les options spécifiques au type
    if (actualType === 'pie') {
      configurePieOptions(
        this._options,
        this.type === 'donut' ? 'donut' : 'pie',
        this.debug
      );
    } else if (actualType === 'polar' || actualType === 'radar') {
      configurePolarRadarOptions(this._options, actualType, this.debug);
    }
  }

  protected override updateData(): void {
    if (this.debug) console.log('Mise à jour des données');

    const chartConfig = { ...this._chartConfig, continue: false };
    const commonChart = buildSingleSerieChart(this.data, chartConfig, null);

    if (this.debug) console.log('Données traitées:', commonChart);

    if (this.type === 'polar' || this.type === 'radar') {
      // Format spécifique pour les graphiques polar et radar
      this._options.xAxis = this._options.xAxis ?? {};
      this._options.xAxis.categories = commonChart.categories || [];

      // Determine the appropriate chart type based on this.type
      let seriesType: string;
      if (this.type === 'radar') {
        seriesType = 'line';
      } else if (this.type === 'polar') {
        seriesType = 'column';
      } else if (this.type === 'area') {
        seriesType = 'area';
      } else {
        seriesType = this._options.chart.type;
      }

      const series = commonChart.series.map((serie) => ({
        name: serie.name || chartConfig.xtitle || 'Valeur',
        data: serie.data,
        color: serie.color,
        type: seriesType,
      }));

      mergeDeep(this._options, { series });
    } else {
      // Format pour les graphiques pie, donut, funnel, pyramid, etc.
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

      mergeDeep(this._options, {
        series: [
          {
            name: chartConfig.xtitle || 'Valeur',
            data: formattedData,
          },
        ],
      });
    }
  }
}
