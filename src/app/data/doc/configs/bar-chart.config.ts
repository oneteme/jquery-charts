export const barChartConfig = {
  basic: {
    code: `import { field, values } from '@oneteme/jquery-core';

const barConfig = {
  title: "Ventes trimestrielles par produit",
  xtitle: "Produits",
  ytitle: "Ventes (k€)",
  // Type de graphique (bar = horizontal, column = vertical)
  type: 'column',
  // Hauteur du graphique en pixels
  height: 250,
  // Afficher ou non la barre d'outils
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
    // Configuration des étiquettes de données
    dataLabels: {
      enabled: true,      // Afficher les valeurs sur les barres
      formatter: (val) => \`\${val}k\` // Ajouter 'k' aux valeurs
    },
    // Configuration des barres
    plotOptions: {
      bar: {
        horizontal: false,    // Barres verticales (column)
        borderRadius: 4,      // Arrondi des barres
        columnWidth: '70%'    // Largeur des colonnes
      }
    },
    // Configuration de la légende
    legend: {
      position: 'bottom'
    }
  }
};
`,
  },
};
