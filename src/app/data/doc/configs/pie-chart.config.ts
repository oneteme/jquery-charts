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
    // Configuration des étiquettes de données
    dataLabels: {
      enabled: true,
      formatter: function(val, opts) {
        return opts.w.globals.labels[opts.seriesIndex] + ': ' + val.toFixed(1) + '%';
      }
    },
    // Calcul automatique en pourcentage
    plotOptions: {
      pie: {
        expandOnClick: true,       // Agrandir la section en cliquant
        donut: {
          size: '0%',              // 0% pour pie, >0% pour donut
          labels: {
            show: false            // Afficher des informations au centre (donut)
          }
        }
      }
    },
    // Configuration des labels
    labels: {
      show: true
    },
    // Configuration de la légende
    legend: {
      position: 'bottom',
      formatter: function(val, opts) {
        // Ajouter le montant à la légende
        const value = opts.w.globals.series[opts.seriesIndex];
        return val + ': ' + value.toLocaleString() + ' €';
      }
    ]
  }
};`,
  },
};
