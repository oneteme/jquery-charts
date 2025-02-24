export const rangeGraphTypes = {
  basic: {
    code: `{
  config: {
    series: [{
      data: {
        x: field('date'),     // Nom de la propriété pour l'axe X
        y: [field('min'), field('max')] // Propriétés pour les valeurs min/max
      },
      name: string | (o, i) => string,
      type: 'rangeArea' | 'rangeBar', // Type de graphique range
      color: string
    }],
    height: 250,
    options: {
      plotOptions: {
        bar: {
          horizontal: boolean  // Pour rangeBar uniquement
        }
      },
      fill: {
        opacity: number      // Opacité du remplissage
      }
    },
    // Propriétés communes
    title: string,
    subtitle: string,
    showToolbar: boolean,
    width: number,
    xtitle: string,
    ytitle: string
  }
}
/* Note: horizontal n'est disponible que pour le type rangeBar */`,
  },
};
