import { Directive, inject, ElementRef, NgZone, Input } from '@angular/core';
import { XaxisType, YaxisType, buildChart, mergeDeep } from '@oneteme/jquery-core';
import { BaseChartDirective } from './base-chart.directive';

@Directive({
  selector: '[map-chart]',
  standalone: true,
})
export class MapChartDirective<X extends XaxisType> extends BaseChartDirective<X, YaxisType> {
  @Input({ alias: 'type' }) override type = 'map' as const;

  constructor() {
    super(inject(ElementRef), inject(NgZone));
  }

  protected override updateChartType(): void {
    if (this.debug) console.log('Mise à jour du type de carte géographique');

    // Configuration spécifique pour les cartes
    mergeDeep(this._options, {
      mapNavigation: {
        enabled: true,
        buttonOptions: {
          verticalAlign: 'bottom'
        }
      },
      colorAxis: {
        min: 0,
        minColor: '#E6EFFF',
        maxColor: '#004CCC'
      },
      legend: {
        enabled: true
      },
      tooltip: {
        enabled: true
      }
    });
  }

  protected override updateConfig(): void {
    if (this.debug) console.log('Mise à jour de la configuration de la carte');

    this._chartConfig = this.config;

    mergeDeep(
      this._options,
      {
        chart: {
          height: this._chartConfig.height ?? '100%',
          width: this._chartConfig.width ?? '100%',
        },
        title: { text: this._chartConfig.title },
        subtitle: { text: this._chartConfig.subtitle },
        exporting: {
          enabled: this._chartConfig.showToolbar ?? true,
          buttons: {
            contextButton: {
              enabled: this._chartConfig.showToolbar ?? true,
            },
          },
        },
      },
      this._chartConfig.options ?? {}
    );
  }

  protected override updateData(): void {
    if (this.debug) console.log('Mise à jour des données de la carte');

    try {
      // Utilisation de buildChart pour traiter les données selon la configuration
      const chartConfig = { ...this._chartConfig, continue: false };
      const commonChart = buildChart(this.data, chartConfig, null);

      if (this.debug) console.log('Données traitées pour la carte:', commonChart);

      // Transformation des données pour Highcharts Maps
      const mapData = this.data.map((item: any, index: number) => ({
        name: item.name ?? `Région ${index + 1}`,
        value: item.value ?? 0,
        code: item.code ?? `CODE_${index}`,
        // L'utilisateur peut fournir des données géographiques via les options
        ...item
      }));

      mergeDeep(this._options, {
        series: [{
          type: 'map',
          name: commonChart.series?.[0]?.name ?? 'Données',
          data: mapData,
          dataLabels: {
            enabled: true,
            format: '{point.name}'
          },
          states: {
            hover: {
              color: '#BADA55'
            }
          }
        }]
      });

      if (this.debug) console.log('Configuration finale de la carte:', this._options);
    } catch (error) {
      console.error('Erreur lors du traitement des données de carte:', error);
    }
  }
}
