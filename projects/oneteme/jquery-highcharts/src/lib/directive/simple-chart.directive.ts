import { Directive, ElementRef, Input, NgZone, inject } from '@angular/core';
import { buildSingleSerieChart, buildChart, mergeDeep } from '@oneteme/jquery-core';
import { BaseChartDirective } from './base-chart.directive';
import { configureSimpleGraphOptions } from './utils/chart-options';

@Directive({
  selector: '[simple-chart]',
  standalone: true,
})
export class SimpleChartDirective extends BaseChartDirective<string, number> {
  @Input({ alias: 'type' }) override type: 'pie' | 'donut' | 'polar' | 'radar' | 'funnel' | 'pyramid' | 'radialBar' = 'pie';

  constructor() {
    super(inject(ElementRef), inject(NgZone));
  }

  protected override updateChartType(): void {
    if (this.debug) console.log('Mise à jour du type de graphique:', this.type);

    let actualType = this.type;
    if (actualType === 'donut') {
      actualType = 'pie';
      configureSimpleGraphOptions(this._options, 'donut', this.debug);
    } else if (actualType === 'pie') {
      configureSimpleGraphOptions(this._options, 'pie', this.debug);
    } else if (
      actualType === 'polar' ||
      actualType === 'radar' ||
      actualType === 'radialBar' ||
      actualType === 'funnel' ||
      actualType === 'pyramid'
    ) {
      configureSimpleGraphOptions(this._options, actualType, this.debug);
      this._shouldRedraw = true;
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
      configureSimpleGraphOptions(
        this._options,
        this.type === 'donut' ? 'donut' : 'pie',
        this.debug
      );
    } else if (
      actualType === 'polar' ||
      actualType === 'radar' ||
      actualType === 'radialBar'
    ) {
      configureSimpleGraphOptions(this._options, actualType, this.debug);
    }
  }

  protected override updateData(): void {
    if (this.debug) console.log('Mise à jour des données');

    const chartConfig = { ...this._chartConfig, continue: false };
    const commonChart =
      this.data.length != 1 && this.type == 'radar'
        ? buildChart(this.data, chartConfig, null)
        : buildSingleSerieChart(this.data, chartConfig, null);

    if (this.debug) console.log('Données traitées:', commonChart);

    if (
      this.type === 'polar' ||
      this.type === 'radar' ||
      this.type === 'radialBar'
    ) {
      // Assurer que xAxis existe et est un objet
      if (!this._options.xAxis || Array.isArray(this._options.xAxis)) {
        this._options.xAxis = {};
      }
      this._options.xAxis.categories = commonChart.categories || [];

      if (this.data.length != 1 && this.type == 'radar') {
        // Pour un graphique radar avec plusieurs séries de données
        const series = commonChart.series.map((serie) => ({
          name: serie.name || chartConfig.xtitle || 'Série',
          data: serie.data.map((value, index) => ({
            name: commonChart.categories[index],
            y: value,
          })),
          pointPlacement: 'on',
          color: serie.color,
          type: this.type === 'radar' ? 'line' : 'column',
        }));

        mergeDeep(this._options, { series });
      } else {
        // Pour les graphiques polar, radar avec une série unique, et radialBar
        const formattedData = [];

        // Formatage des données pour qu'elles affichent les catégories correctes
        for (let i = 0; i < commonChart.categories.length; i++) {
          formattedData.push({
            name: commonChart.categories[i],
            y: commonChart.series[0]?.data[i] || 0,
            color: commonChart.series[0]?.color,
          });
        }

        const series = [
          {
            name: chartConfig.title || 'Valeurs',
            data: formattedData,
            type: this.type === 'radar' ? 'line' : 'column',
            showInLegend: true,
          },
        ];

        mergeDeep(this._options, { series });
      }
    } else {
      // Pour les graphiques pie et donut
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
            name: chartConfig.title || 'Valeurs',
            data: formattedData,
            showInLegend: true,
          },
        ],
      });
    }
  }
}
