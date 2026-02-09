export const funnelChartConfig = {
  basic: {
    code: `import { field } from '@oneteme/jquery-core';

const funnelConfig = {
  title: "Entonnoir de conversion",
  subtitle: "Parcours utilisateur du site web",
  // Hauteur du graphique en pixels
  height: 250,
  // Afficher ou non la barre d'outils
  showToolbar: false,
  series: [
    {
      name: "Visiteurs",
      data: {
        x: field('stage'),    // Étape du parcours
        y: field('count')     // Nombre de visiteurs à cette étape
      }
    }
  ],
  options: {
    // Configuration spécifique à l'entonnoir
    plotOptions: {
      funnel: {
        neckWidth: '30%',
        neckHeight: '25%',
        width: '80%',
        dataLabels: {
          enabled: true,
          format: '{point.name}: {point.y}'
        }
      }
    },
    // Configuration des couleurs
    colors: ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0'],
    // Configuration de la légende
    legend: {
      align: 'right',
      verticalAlign: 'middle'
    },
    tooltip: {
      pointFormat: '<b>{point.y:,.0f} visiteurs</b>'
    }
  }
};
`,
  },
};
