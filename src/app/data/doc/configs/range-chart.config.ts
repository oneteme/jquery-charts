export const rangeChartConfig = {
  basic: {
    code: `import { field, rangeFields } from '@oneteme/jquery-core';

const rangeConfig = {
  title: "Variation des températures mensuelles",
  xtitle: "Mois",
  ytitle: "Température (°C)",
  // Hauteur du graphique en pixels
  height: 250,
  // Afficher ou non la barre d'outils
  showToolbar: false,
  series: [
    {
      name: "Températures 2024",
      data: {
        x: field('month'),
        // Utilisation de rangeFields pour extraire min et max
        y: rangeFields('min_temp', 'max_temp')
      },
      color: "#008FFB"
    }
  ],
  options: {
    plotOptions: {
      columnrange: {
        dataLabels: {
          enabled: true,
          format: '{point.low}°C - {point.high}°C'
        }
      },
      arearange: {
        dataLabels: {
          enabled: false
        }
      }
    },
    // Options des axes
    xAxis: {
      type: 'category'
    },
    yAxis: {
      tickAmount: 5
    },
    tooltip: {
      pointFormat: '<b>{point.low}°C - {point.high}°C</b>'
    }
  }
};
`,
  },
};
