import { ChartDataCollection, MapChartData } from '../../core/models/chart.model';
import { ChartProvider, field } from '@oneteme/jquery-core';

export const mapChartConfig: ChartProvider<string, number> = {
  title: 'Répartition des clients actifs',
  subtitle: 'France métropolitaine - 2025',
  series: [
    {
      data: {
        x: field('name'),
        y: field('value'),
      },
    },
  ],
  height: 420,
  mapEndpoint: 'assets/france-geojson',
  mapDefaultValue: 'fr-region',
  mapJoinBy: ['code', 'code'],
  options: {
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
      title: {
        text: 'Clients actifs'
      }
    },
    tooltip: {
      pointFormat: '{point.name}: <b>{point.value:,.0f}</b> clients'
    }
  },
  showToolbar: true,
};

export const MAP_CHART_DATA: ChartDataCollection<MapChartData> = {
  mapExample: {
    config: mapChartConfig,
    data: [
    { name: 'Île-de-France', code: '11', value: 420000 },
    { name: 'Provence-Alpes-Côte d\'Azur', code: '93', value: 165000 },
    { name: 'Auvergne-Rhône-Alpes', code: '84', value: 210000 },
    { name: 'Occitanie', code: '76', value: 152000 },
    { name: 'Nouvelle-Aquitaine', code: '75', value: 148000 },
    { name: 'Hauts-de-France', code: '32', value: 141000 },
    { name: 'Grand Est', code: '44', value: 133000 },
    { name: 'Pays de la Loire', code: '52', value: 98000 },
    { name: 'Bretagne', code: '53', value: 87000 },
    { name: 'Normandie', code: '28', value: 82000 },
    { name: 'Bourgogne-Franche-Comté', code: '27', value: 69000 },
    { name: 'Centre-Val de Loire', code: '24', value: 64000 },
    { name: 'Corse', code: '94', value: 12000 }
    ],
  },
};

export const mapChartData: MapChartData = MAP_CHART_DATA.mapExample;
