export const funnelChartConfig = {
  basic: {
    code: `{
  config: {
    series: [{
      data: {
        x: field('stage'),    // Nom de la propriété pour les étapes
        y: field('value')     // Nom de la propriété pour les valeurs
      },
      name: string | (o, i) => string
    }],
    height: 250,
    options: {
      plotOptions: {
        funnel: {
          neckWidth: string,  // Largeur du goulot (en %)
          neckHeight: string  // Hauteur du goulot (en %)
        }
      },
      dataLabels: {
        enabled: boolean,     // Afficher les labels
        position: 'inside' | 'outside'
      }
    },
    // Propriétés communes
    title: string,
    subtitle: string,
    showToolbar: boolean,
    width: number
  }
}`
  }
};
