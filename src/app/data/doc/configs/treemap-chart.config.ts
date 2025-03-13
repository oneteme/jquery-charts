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
        distributed: false,     // Distribution uniforme des couleurs
        enableShades: true,     // Activer les nuances par groupe
        useFillColorAsStroke: false, // Bordure différente du remplissage
        // Paramètres visuels
        colorScale: {
          ranges: [
            {
              from: 0,
              to: 100,
              color: '#CD363A'
            },
            {
              from: 100,
              to: 500,
              color: '#52B12C'
            }
          ]
        }
      }
    },
    // Configuration des étiquettes de données
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
      },
      formatter: function(text, op) {
        return [text, op.value];
      },
      offsetY: -4
    },
    // Animation
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 800,
      animateGradually: {
        enabled: true,
        delay: 150
      }
    }
  }
};`,
  },
};
