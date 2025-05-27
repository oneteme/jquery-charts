import { Directive, inject, ElementRef, NgZone, Input } from '@angular/core';
import { XaxisType, YaxisType, buildChart, mergeDeep } from '@oneteme/jquery-core';
import { BaseChartDirective } from './base-chart.directive';
import { initBaseOptions } from './utils';
import * as Highcharts from 'highcharts';
import HighchartsMap from 'highcharts/modules/map';
import Exporting from 'highcharts/modules/exporting';
import NoDataToDisplay from 'highcharts/modules/no-data-to-display';
import Annotations from 'highcharts/modules/annotations';
import Accessibility from 'highcharts/modules/accessibility';

// Initialisation des modules Highcharts
HighchartsMap(Highcharts);
Exporting(Highcharts);
NoDataToDisplay(Highcharts);
Annotations(Highcharts);
Accessibility(Highcharts);

@Directive({
  selector: '[map-chart]',
  standalone: true,
})
export class MapChartDirective<X extends XaxisType> extends BaseChartDirective<X, YaxisType> {
  @Input({ alias: 'type' }) override type: 'map' = 'map';

  constructor() {
    super(inject(ElementRef), inject(NgZone));
  }

  protected override updateChartType(): void {
    if (this.debug) console.log('Mise à jour du type de carte géographique');

    this._options = initBaseOptions('map', this.isLoading, this.debug);

    // Configuration spécifique pour les cartes
    mergeDeep(this._options, {
      chart: {
        type: 'map',
      },
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

    // Fusionner les options de configuration utilisateur
    mergeDeep(
      this._options,
      {
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
