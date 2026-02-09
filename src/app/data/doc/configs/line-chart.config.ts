export const lineChartConfig = {
  basic: {
    code: `import { field } from '@oneteme/jquery-core';

const lineConfig = {
  title: "Évolution des performances sur 12 mois",
  xtitle: "Mois",
  ytitle: "Performance (points)",
  // Activation du mode continu pour les dates
  continue: true,
  // Tri des valeurs X par ordre croissant
  xorder: 'asc',
  // Hauteur du graphique en pixels
  height: 250,
  // Afficher ou non la barre d'outils
  showToolbar: false,
  series: [
    {
      name: "Équipe A",
      data: {
        x: field('date'),     // Date sur l'axe X
        y: field('team_a')    // Valeurs de l'équipe A
      },
      // Type spécifique (ligne)
      type: 'line',
      // Couleur de la série
      color: "#008FFB"
    },
    {
      name: "Équipe B",
      data: {
        x: field('date'),
        y: field('team_b')
      },
      type: 'area',         // Type area pour cette série
      color: "#00E396"
    }
  ],
  options: {
    chart: {
      zoomType: 'x'
    },
    // Configuration des séries
    plotOptions: {
      series: {
        marker: { enabled: true, radius: 4 },
        lineWidth: 2
      }
    },
    // Configuration des axes
    xAxis: {
      type: 'datetime',
      labels: {
        format: '{value:%b %Y}'
      }
    },
    yAxis: {
      min: 0,
      max: 100,
      tickAmount: 5
    },
    // Configuration des infobulles
    tooltip: {
      xDateFormat: '%d %b %Y'
    },
    // Configuration de la légende
    legend: {
      align: 'right',
      verticalAlign: 'top'
    }
  },
};
`
  }
};