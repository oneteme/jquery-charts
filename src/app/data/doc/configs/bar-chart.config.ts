export const barChartConfig = {
  basic: {
    code: `import { field, values } from '@oneteme/jquery-core';

const barConfig = {
  title: "Ventes trimestrielles par produit",
  xtitle: "Produits",
  ytitle: "Ventes (k€)",
  // Hauteur du graphique en pixels
  height: 250,
  // Afficher ou non la barre d'outils de jquery-charts
  showToolbar: false,
  // Activation de l'empilement des barres
  stacked: true,
  // Tri des catégories (produits) par ordre croissant
  xorder: 'asc',
  series: [
    {
      name: "T1 2024",
      data: {
        x: field('product'),  // Extraire le nom du produit
        y: field('q1')        // Extraire les ventes du T1
      },
      color: "#008FFB"
    },
    {
      name: "T2 2024",
      data: {
        x: field('product'),  // Même axe X pour toutes les séries
        y: field('q2')        // Extraire les ventes du T2
      },
      color: "#00E396"
    },
    {
      name: "T3 2024",
      data: {
        x: field('product'),
        y: field('q3')
      },
      color: "#FEB019"
    },
    {
      name: "T4 2024",
      data: {
        x: field('product'),
        y: field('q4')
      },
      color: "#FF4560"
    }
  ],
  options: {
    // Configuration des colonnes
    plotOptions: {
      column: {
        borderRadius: 4,
        pointPadding: 0.1,
        groupPadding: 0.1
      },
      series: {
        dataLabels: {
          enabled: true,
          format: '{point.y}k'
        }
      }
    },
    xAxis: {
      title: { text: 'Produits' }
    },
    yAxis: {
      title: { text: 'Ventes (k€)' }
    },
    // Configuration de la légende
    legend: {
      align: 'center',
      verticalAlign: 'bottom'
    }
  }
};
`,
  },
};
