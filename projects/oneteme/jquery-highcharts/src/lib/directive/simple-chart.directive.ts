import { Directive, ElementRef, Input, NgZone, inject } from '@angular/core';
import { buildChart, buildSingleSerieChart, mergeDeep } from '@oneteme/jquery-core';
import { BaseChartDirective } from './base-chart.directive';
import { configureCircleGraphOptions } from './utils/chart-options';

import * as Highcharts from 'highcharts';
import more from 'highcharts/highcharts-more';
import NoDataToDisplay from 'highcharts/modules/no-data-to-display';
import Annotations from 'highcharts/modules/annotations';
import Accessibility from 'highcharts/modules/accessibility';
import Exporting from 'highcharts/modules/exporting';
import ExportDataModule from 'highcharts/modules/export-data';
import Funnel from 'highcharts/modules/funnel';

more(Highcharts);
NoDataToDisplay(Highcharts);
Annotations(Highcharts);
Accessibility(Highcharts);
Exporting(Highcharts);
ExportDataModule(Highcharts);
Funnel(Highcharts);

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
    | 'radialBar' = 'pie';

  constructor() {
    super(inject(ElementRef), inject(NgZone));
  }

  protected override updateChartType(): void {
    if (this.debug) console.log('Mise à jour du type de graphique:', this.type);

    let actualType = this.type;
    if (actualType === 'donut') {
      actualType = 'pie';
      configureCircleGraphOptions(this._options, 'donut', this.debug);
    } else if (actualType === 'pie') {
      configureCircleGraphOptions(this._options, 'pie', this.debug);
    } else if (actualType === 'polar' || actualType === 'radar' || actualType === 'radialBar') {
      configureCircleGraphOptions(this._options, actualType, this.debug);
      this._shouldRedraw = true;
      return;
    }

    if (this._options.chart?.type !== actualType) {
      mergeDeep(this._options, {
        chart: { type: actualType },
      });
      this._shouldRedraw = true;
    }
  }

  protected override updateConfig(): void {
    if (this.debug) console.log('Mise à jour de la configuration');

    this._chartConfig = this.config;

    let actualType = this.type;
    if (actualType === 'donut') {
      actualType = 'pie';
    }

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

    if (actualType === 'pie') {
      configureCircleGraphOptions(
        this._options,
        this.type === 'donut' ? 'donut' : 'pie',
        this.debug
      );
    } else if (actualType === 'polar' || actualType === 'radar' || actualType === 'radialBar') {
      configureCircleGraphOptions(this._options, actualType, this.debug);
    }
  }

  protected override updateData(): void {
    if (this.debug) console.log('Mise à jour des données');

    const chartConfig = { ...this._chartConfig, continue: false };
    // const commonChart = buildSingleSerieChart(this.data, chartConfig, null);
    const commonChart =
          this.data.length != 1 && this.type == 'radar'
            ? buildChart(this.data, chartConfig, null)
            : buildSingleSerieChart(this.data, chartConfig, null);

    if (this.debug) console.log('Données traitées:', commonChart);

    if (this.type === 'polar' || this.type === 'radar' || this.type === 'radialBar') {
      this._options.xAxis = this._options.xAxis ?? {};
      this._options.xAxis.categories = commonChart.categories || [];

      const series = commonChart.series.map((serie) => ({
        name: serie.name || chartConfig.xtitle || 'Valeur',
        data: serie.data,
        color: serie.color,
        type: this.type,
      }));

      mergeDeep(this._options, { series });
    } else {
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
