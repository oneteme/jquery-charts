export const lineGraphTypes = {
  basic: {
    code: `{
  config: {
    series: [{
      data: {
        x: field('date'),      // Nom de la propriété pour l'axe X (souvent temporel)
        y: field('value')      // Nom de la propriété pour l'axe Y
      },
      name: string | (o, i) => string,  // Nom de la série
      type: 'line' | 'area',   // Type spécifique (ligne simple ou zone remplie)
      color: string,           // Couleur de la série
      curve: 'smooth' | 'straight' | 'stepline' // Style de la ligne
    }],
    height: 250,               // Hauteur du graphique
    options: {
      dataLabels: {
        enabled: boolean       // Afficher les valeurs sur les points
      },
      markers: {
        size: number,         // Taille des points
        shape: 'circle' | 'square' // Forme des points
      },
      stroke: {
        width: number        // Épaisseur de la ligne
      },
      fill: {
        opacity: number      // Opacité du remplissage (pour area)
      }
    },
    // Propriétés communes
    title: string,
    subtitle: string,
    showToolbar: boolean,
    width: number,
    xtitle: string,          // Titre de l'axe X
    ytitle: string          // Titre de l'axe Y
  }
}
/* Note: Le type 'area' est incompatible avec curve: 'stepline' */`
  }
};
