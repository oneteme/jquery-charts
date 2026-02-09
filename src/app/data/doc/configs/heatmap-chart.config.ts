export const heatmapChartConfig = {
  basic: {
    code: `import { field } from '@oneteme/jquery-core';

const heatmapConfig = {
  title: "Consommation énergétique par jour et heure",
  xtitle: "Heures",
  ytitle: "Jours",
  // Hauteur du graphique en pixels
  height: 250,
  // Afficher ou non la barre d'outils
  showToolbar: false,
  series: [
    {
      data: {
        x: field('hour'),      // Heure de la journée (0-23)
        y: field('day'),       // Jour de la semaine (Lun-Dim)
        z: field('consumption') // Intensité/valeur à représenter
      }
    }
  ],
  options: {
    plotOptions: {
      heatmap: {
        borderWidth: 1,
        dataLabels: {
          enabled: true,
          format: '{point.value:.1f} kWh'
        }
      }
    },
    colorAxis: {
      stops: [
        [0, '#D3F2FD'],
        [0.5, '#64B5F6'],
        [1, '#0D47A1']
      ]
    },
    // Personnalisation des axes
    xAxis: {
      labels: {
        formatter: function () {
          return this.value + 'h';
        }
      }
    }
  }
};
`,
  },
};
