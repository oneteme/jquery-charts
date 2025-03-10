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
    // Configuration pour le remplissage de la zone entre min et max
    fill: {
      opacity: 0.4,
      type: 'solid'
    },
    // Marqueurs aux points max/min
    markers: {
      size: 4,
      strokeWidth: 2,
      hover: {
        size: 7
      }
    },
    // Options des axes
    xaxis: {
      type: 'category'
    },
    yaxis: {
      decimalsInFloat: 1,
      tickAmount: 5
    }
  }
};
`,
  },
};
