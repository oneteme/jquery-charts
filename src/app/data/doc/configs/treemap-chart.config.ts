export const treemapChartConfig = {
  basic: {
    code: `import { field } from '@oneteme/jquery-core';

const treemapConfig = {
  title: "Répartition des ventes par région et catégorie",
  // Hauteur du graphique en pixels
  height: 250,
  // Afficher ou non la barre d'outils
  showToolbar: false,
  series: [
    {
      data: {
        x: field('product'),     // Nom du produit
        y: field('sales'),       // Valeur des ventes
        z: field('region')       // Région pour le groupement
      }
    }
  ],
  options: {
    // Configuration des couleurs et groupes
    colors: ['#3B93A5', '#F7B844', '#ADD8C7', '#EC3C65', '#CDD7B6'],
    plotOptions: {
      treemap: {
        layoutAlgorithm: 'squarified',
        allowTraversingTree: true,
        dataLabels: {
          enabled: true,
          format: '{point.name}<br>{point.value}'
        }
      }
    },
    tooltip: {
      pointFormat: '<b>{point.value}</b>'
    }
  }
};`,
  },
};
