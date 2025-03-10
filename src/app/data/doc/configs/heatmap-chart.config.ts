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
    chart: {
      type: 'heatmap',
    },
    dataLabels: {
      enabled: true,
      formatter: function(val) {
        return val ? val.toFixed(1) + ' kWh' : '';
      }
    },
    colors: ["#008FFB"],
    plotOptions: {
      heatmap: {
        // Configuration personnalisée de l'échelle de couleurs
        colorScale: {
          ranges: [
            {
              from: 0,
              to: 10,
              color: '#D3F2FD',
              name: 'Faible'
            },
            {
              from: 10.1,
              to: 20,
              color: '#64B5F6',
              name: 'Moyen'
            },
            {
              from: 20.1,
              to: 50,
              color: '#0D47A1',
              name: 'Élevé'
            }
          ]
        }
      }
    },
    // Personnalisation des axes
    xaxis: {
      labels: {
        formatter: (val) => \`\${val}h\`
      }
    }
  }
};
`,
  },
};
