import { ChartProvider, field } from '@oneteme/jquery-core';

// Config pour tester maps
export const mapChartConfig: ChartProvider<string, number> = {
  // title: 'Population par région française',
  // subtitle: 'Données de test 2025',

  // Configuration pour le chargement automatique du GeoJSON
  mapEndpoint: './assets/france-geojson/',
  mapParam: 'subdiv',
  mapDefaultValue: 'fr-region',

  series: [
    {
      data: {
        x: field('code'),
        y: field('value'),
      },
    },
  ],

  options: {
    series: [
      {
        name: 'Population',
        joinBy: ['code', 'code'], // [clé dans le GeoJSON, clé dans les données]
        dataLabels: {
          enabled: true,
          format: '{point.properties.name}',
        },
      },
    ],

    colorAxis: {
      min: 0,
      minColor: '#E6F3FF',
      maxColor: '#0066CC',
    },

    mapNavigation: {
      enabled: true,
      buttonOptions: {
        verticalAlign: 'bottom',
      },
    },

    tooltip: {
      pointFormat:
        '{point.properties.name}: <b>{point.value:,.0f}</b> habitants',
    },

    legend: {
      enabled: false
      // title: {
      //   text: 'Population (millions)',
      // },
    },

    mapView: {
      projection: {
        name: 'LambertConformalConic',
      },
    },
  },

  // showToolbar: true,
};

/**
 * Données de test pour les régions françaises
 * Les codes correspondent aux codes INSEE des régions
 */
export const mapChartData = [
  { code: '11', value: 12262544 }, // Île-de-France
  { code: '24', value: 2559073 }, // Centre-Val de Loire
  { code: '27', value: 2783039 }, // Bourgogne-Franche-Comté
  { code: '28', value: 3303500 }, // Normandie
  { code: '32', value: 5962662 }, // Hauts-de-France
  { code: '44', value: 5511747 }, // Grand Est
  { code: '52', value: 3801797 }, // Pays de la Loire
  { code: '53', value: 3340379 }, // Bretagne
  { code: '75', value: 6033952 }, // Nouvelle-Aquitaine
  { code: '76', value: 5924858 }, // Occitanie
  { code: '84', value: 8078652 }, // Auvergne-Rhône-Alpes
  { code: '93', value: 5081101 }, // Provence-Alpes-Côte d'Azur
  { code: '94', value: 343701 }, // Corse
];
