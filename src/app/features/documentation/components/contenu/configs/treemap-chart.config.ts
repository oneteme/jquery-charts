export const treemapChartConfig = {
  basic: {
    code: `{
  config: {
    series: [{
      data: {
        x: field('name'),     // Nom de la propriété pour les labels
        y: field('value'),    // Nom de la propriété pour les valeurs
        z: field('group')     // Nom de la propriété pour le groupement (optionnel)
      },
      name: string | (o, i) => string
    }],
    height: 250,
    options: {
      plotOptions: {
        treemap: {
          distributed: boolean,  // Distribution uniforme des couleurs
          enableShades: boolean // Activer les nuances de couleurs
        }
      },
      dataLabels: {
        enabled: boolean,      // Afficher les labels
        format: string        // Format des labels
      }
    },
    // Propriétés communes
    title: string,
    subtitle: string,
    showToolbar: boolean,
    width: number
  }
}
/* Note: distributed et enableShades ne peuvent pas être utilisés ensemble */`,
  },
};
