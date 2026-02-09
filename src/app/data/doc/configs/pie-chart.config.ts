export const pieChartConfig = {
  basic: {
    code: `import { field, mapField } from '@oneteme/jquery-core';

const pieConfig = {
  title: "Répartition du budget par département",
  // Hauteur du graphique en pixels
  height: 250,
  // Afficher ou non la barre d'outils
  showToolbar: false,
  series: [
    {
      data: {
        x: field('department'),  // Nom du département pour les labels
        y: field('budget')       // Budget pour les valeurs
      },
      // Utilisation d'un mapField pour attribuer des couleurs spécifiques
      color: mapField('department', new Map([
        ['Marketing', '#008FFB'],
        ['R&D', '#00E396'],
        ['Production', '#FEB019'],
        ['RH', '#FF4560'],
        ['Finance', '#775DD0']
      ]))
    }
  ],
  options: {
    colors: ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0'],
    // Configuration des étiquettes et interactions
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: true,
          format: '{point.name}: {point.percentage:.1f}%'
        },
        showInLegend: true
      }
    },
    // Configuration de l'infobulle
    tooltip: {
      pointFormat: '<b>{point.y:,.0f} €</b>'
    },
    // Configuration de la légende
    legend: {
      align: 'center',
      verticalAlign: 'bottom'
    }
  }
};`,
  },
};
