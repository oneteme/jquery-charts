import { MapChartData } from '../../core/models/chart.model';
import { ChartProvider, field } from '@oneteme/jquery-core';

export const mapChartConfig: ChartProvider<string, number> = {
  title: 'Population par région française',
  subtitle: 'Données démographiques 2025',
  series: [
    {
      data: {
        x: field('name'),
        y: field('value'),
      },
    },
  ],
  options: {
    chart: {
      map: 'custom/france-regions'
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
      title: {
        text: 'Population'
      }
    },
    tooltip: {
      pointFormat: '{point.name}: <b>{point.value:,.0f}</b> habitants'
    }
  },
  showToolbar: true,
};

export const mapChartData: MapChartData = {
  config: mapChartConfig,
  data: [
    { name: 'Île-de-France', code: '11', value: 12000000 },
    { name: 'Provence-Alpes-Côte d\'Azur', code: '93', value: 5100000 },
    { name: 'Auvergne-Rhône-Alpes', code: '84', value: 8100000 },
    { name: 'Occitanie', code: '76', value: 5900000 },
    { name: 'Nouvelle-Aquitaine', code: '75', value: 6000000 },
    { name: 'Hauts-de-France', code: '32', value: 5900000 },
    { name: 'Grand Est', code: '44', value: 5500000 },
    { name: 'Pays de la Loire', code: '52', value: 3800000 },
    { name: 'Bretagne', code: '53', value: 3300000 },
    { name: 'Normandie', code: '28', value: 3300000 },
    { name: 'Bourgogne-Franche-Comté', code: '27', value: 2800000 },
    { name: 'Centre-Val de Loire', code: '24', value: 2600000 },
    { name: 'Corse', code: '94', value: 340000 }
  ],
};
