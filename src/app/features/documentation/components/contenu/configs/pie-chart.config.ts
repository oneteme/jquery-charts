export const pieChartConfig = {
  basic: {
    code: `{
  config: {
    series: [{
      data: {
        x: field('name'),     // Nom de la propriété pour les labels
        y: field('value')     // Nom de la propriété pour les valeurs
      },
      name: string | (o, i) => string,  // Nom de la série (fixe ou dynamique)
      color: string | (o, i) => string  // Couleur de la série (fixe ou dynamique)
    }],
    height: 250,              // Hauteur du graphique en pixels
    type: 'pie' | 'donut' | 'polar' | 'radar' | 'radialBar', // Type spécifique
    options: {
      dataLabels: {
        enabled: true,        // Afficher les valeurs sur le graphique
        formatter: (val) => string  // Formater les valeurs affichées
      },
      labels: true,           // Afficher les labels
      legend: {
        show: true,          // Afficher la légende
        position: 'bottom'   // Position de la légende (bottom, right, top, left)
      }
    },
    title: string,           // Titre du graphique
    subtitle: string,        // Sous-titre du graphique
    showToolbar: boolean,    // Afficher la barre d'outils
    width: number           // Largeur du graphique (optionnel)
  }
}`
  }
};
