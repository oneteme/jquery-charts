export const heatmapChartConfig = {
  basic: {
    code: `{
  config: {
    series: [{
      data: {
        x: field('xAxis'),    // Nom de la propriété pour l'axe X
        y: field('yAxis'),    // Nom de la propriété pour l'axe Y
        z: field('value')     // Nom de la propriété pour l'intensité
      },
      name: string | (o, i) => string
    }],
    height: 250,
    options: {
      plotOptions: {
        heatmap: {
          colorScale: {
            ranges: [{         // Définition des plages de couleurs
              from: number,
              to: number,
              color: string
            }],
            min: number,      // Valeur minimale
            max: number      // Valeur maximale
          },
          radius: number     // Rayon des cellules
        }
      },
      dataLabels: {
        enabled: boolean    // Afficher les valeurs
      }
    },
    // Propriétés communes
    title: string,
    subtitle: string,
    showToolbar: boolean,
    width: number,
    xtitle: string,        // Titre de l'axe X
    ytitle: string        // Titre de l'axe Y
  }
}`,
  },
};
