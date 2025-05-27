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
      map: 'custom'
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
    { name: 'Île-de-France', code: 'IDF', value: 12000000 },
    { name: 'Provence-Alpes-Côte d\'Azur', code: 'PACA', value: 5100000 },
    { name: 'Auvergne-Rhône-Alpes', code: 'ARA', value: 8100000 },
    { name: 'Occitanie', code: 'OCC', value: 5900000 },
    { name: 'Nouvelle-Aquitaine', code: 'NAQ', value: 6000000 },
    { name: 'Hauts-de-France', code: 'HDF', value: 5900000 },
    { name: 'Grand Est', code: 'GE', value: 5500000 },
    { name: 'Pays de la Loire', code: 'PDL', value: 3800000 },
    { name: 'Bretagne', code: 'BRE', value: 3300000 },
    { name: 'Normandie', code: 'NOR', value: 3300000 },
    { name: 'Bourgogne-Franche-Comté', code: 'BFC', value: 2800000 },
    { name: 'Centre-Val de Loire', code: 'CVL', value: 2600000 },
    { name: 'Corse', code: 'COR', value: 340000 }
  ],
};
