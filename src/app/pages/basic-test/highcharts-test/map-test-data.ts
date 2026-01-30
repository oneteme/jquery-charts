import { ChartProvider, field } from '@oneteme/jquery-core';

// config pour tester maps
export const mapChartConfig: ChartProvider<string, number> = {
  // title: 'Population par région française',
  // subtitle: 'Données de test 2025',

  // config pour chargement auto du geojson
  mapEndpoint: './assets/france-geojson/',
  mapParam: 'subdiv',
  mapDefaultValue: 'fr-region',
  mapColor: 'green',

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
        // joinBy déjà défini par défaut ['code', 'code'] si rien de mis

        dataLabels: {
          enabled: true,
          format: '{point.properties.name}',
        },
      },
    ],

    // mapNavigation: {
    //   enabled: true,
    //   buttonOptions: {
    //     verticalAlign: 'bottom',
    //   },
    // },

    tooltip: {
      pointFormat:
        '{point.properties.name}: <b>{point.value:,.0f}</b> habitants',
    },
  },

  showToolbar: true,
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
];

/**
 * Données de test pour les départements français (échantillon)
 * Les codes correspondent aux codes INSEE des départements
 *
 * Pour tester : http://localhost:4201/basic-test?subdiv=fr-departement
 */
export const mapDepartementData = [
  // Île-de-France
  { code: '75', value: 2165423 }, // Paris
  { code: '77', value: 1403997 }, // Seine-et-Marne
  { code: '78', value: 1431808 }, // Yvelines
  { code: '91', value: 1296641 }, // Essonne
  { code: '92', value: 1609306 }, // Hauts-de-Seine
  { code: '93', value: 1623475 }, // Seine-Saint-Denis
  { code: '94', value: 1387926 }, // Val-de-Marne
  { code: '95', value: 1241229 }, // Val-d'Oise

  // Hauts-de-France
  { code: '02', value: 531345 }, // Aisne
  { code: '59', value: 2604361 }, // Nord
  { code: '60', value: 829419 }, // Oise
  { code: '62', value: 1471941 }, // Pas-de-Calais
  { code: '80', value: 571211 }, // Somme

  // Provence-Alpes-Côte d'Azur
  { code: '04', value: 164308 }, // Alpes-de-Haute-Provence
  { code: '05', value: 141284 }, // Hautes-Alpes
  { code: '06', value: 1083310 }, // Alpes-Maritimes
  { code: '13', value: 2043110 }, // Bouches-du-Rhône
  { code: '83', value: 1068625 }, // Var
  { code: '84', value: 561469 }, // Vaucluse

  // Auvergne-Rhône-Alpes
  { code: '01', value: 645681 }, // Ain
  { code: '03', value: 337988 }, // Allier
  { code: '07', value: 326606 }, // Ardèche
  { code: '15', value: 145143 }, // Cantal
  { code: '26', value: 516762 }, // Drôme
  { code: '38', value: 1270062 }, // Isère
  { code: '42', value: 765634 }, // Loire
  { code: '43', value: 227283 }, // Haute-Loire
  { code: '63', value: 662152 }, // Puy-de-Dôme
  { code: '69', value: 1873997 }, // Rhône
  { code: '73', value: 436434 }, // Savoie
  { code: '74', value: 820721 }, // Haute-Savoie

  // Nouvelle-Aquitaine
  { code: '16', value: 352335 }, // Charente
  { code: '17', value: 651358 }, // Charente-Maritime
  { code: '19', value: 241464 }, // Corrèze
  { code: '23', value: 116617 }, // Creuse
  { code: '24', value: 415168 }, // Dordogne
  { code: '33', value: 1601845 }, // Gironde
  { code: '40', value: 413935 }, // Landes
  { code: '47', value: 336854 }, // Lot-et-Garonne
  { code: '64', value: 682621 }, // Pyrénées-Atlantiques
  { code: '79', value: 374351 }, // Deux-Sèvres
  { code: '86', value: 438281 }, // Vienne
  { code: '87', value: 376058 }, // Haute-Vienne

  // Occitanie
  { code: '09', value: 153153 }, // Ariège
  { code: '11', value: 374070 }, // Aude
  { code: '12', value: 279206 }, // Aveyron
  { code: '30', value: 748437 }, // Gard
  { code: '31', value: 1400039 }, // Haute-Garonne
  { code: '32', value: 191091 }, // Gers
  { code: '34', value: 1175623 }, // Hérault
  { code: '46', value: 174754 }, // Lot
  { code: '48', value: 76601 }, // Lozère
  { code: '65', value: 229228 }, // Hautes-Pyrénées
  { code: '66', value: 479979 }, // Pyrénées-Orientales
  { code: '81', value: 387890 }, // Tarn
  { code: '82', value: 258349 }, // Tarn-et-Garonne
];
