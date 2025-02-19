export const barChartConfig = {
  basic: {
    code: `{
  config: {
    series: [{
      data: {
        x: field('category'),   // Nom de la propriété pour l'axe X
        y: field('value')       // Nom de la propriété pour l'axe Y
      },
      name: string | (o, i) => string,  // Nom de la série
      stack: string | (o, i) => string, // Groupe pour l'empilement (stacked)
      color: string | (o, i) => string  // Couleur de la série
    }],
    height: 250,                // Hauteur du graphique
    type: 'bar' | 'column',     // Type de graphique (vertical ou horizontal)
    stacked: boolean,           // Activer l'empilement des barres
    xorder: 'asc' | 'desc',     // Tri des valeurs sur l'axe X
    continue: boolean,          // Mode continu (pas de catégories fixes)
    pivot: boolean,             // Pivoter les données (transpose)
    options: {
      dataLabels: {
        enabled: boolean       // Afficher les valeurs sur les barres
      },
      plotOptions: {
        bar: {
          horizontal: boolean, // Orientation des barres
          borderRadius: number // Arrondi des barres
        }
      }
    },
    // Propriétés communes
    title: string,
    subtitle: string,
    showToolbar: boolean,
    width: number,
    xtitle: string,           // Titre de l'axe X
    ytitle: string            // Titre de l'axe Y
  }
}`
  }
};
