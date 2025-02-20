export const infoGlobalGraphTypes = {
  basic: {
    code: `{
  config: {
    // Configuration des séries de données
    series: [{
      data: {
        x: field('category'),   // Propriété pour l'axe X
        y: field('value')       // Propriété pour l'axe Y
      },
      name: string | (o, i) => string,  // Nom de la série (fixe ou dynamique)
      color: string | (o, i) => string, // Couleur de la série (fixe ou dynamique)
      type: string                      // Type spécifique pour cette série
    }],

    // Dimensions
    height: number,             // Hauteur du graphique (obligatoire)
    width: number,             // Largeur du graphique (optionnel)

    // Titres et labels
    title: string,             // Titre principal
    subtitle: string,          // Sous-titre
    xtitle: string,           // Titre de l'axe X
    ytitle: string,           // Titre de l'axe Y

    // Options de données
    pivot: boolean,           // Pivoter les données
    continue: boolean,        // Mode continu (pas de catégories fixes)
    xorder: 'asc' | 'desc',  // Tri des valeurs sur l'axe X
    stacked: boolean,        // Activer l'empilement (pour bar/column)

    // Interface utilisateur
    showToolbar: boolean,    // Afficher la barre d'outils avec les boutons de navigation

    // Configuration générale
    options: {
      chart: {
        toolbar: {
          show: boolean      // Afficher la barre d'outils ApexCharts
        }
      },
      dataLabels: {
        enabled: boolean,    // Afficher les valeurs sur le graphique
        formatter: (val) => string  // Formater les valeurs affichées
      },
      legend: {
        show: boolean,      // Afficher la légende
        position: 'top' | 'right' | 'bottom' | 'left'  // Position de la légende
      },
      tooltip: {
        enabled: boolean,   // Activer les tooltips
        shared: boolean,    // Tooltip pour toutes les séries
        followCursor: boolean  // Suivre le curseur
      },
      grid: {
        show: boolean,     // Afficher la grille
        borderColor: string,  // Couleur des bordures
        padding: {
          top: number,
          right: number,
          bottom: number,
          left: number
        }
      }
    }
  }
}`
  }
};
