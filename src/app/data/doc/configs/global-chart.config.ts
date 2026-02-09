export const globalChartConfig = {
  basic: {
    code: `import { field } from '@oneteme/jquery-core';

{
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
    width: number,              // Largeur du graphique (optionnel)

    // Titres et labels
    title: string,              // Titre principal
    subtitle: string,           // Sous-titre
    xtitle: string,             // Titre de l'axe X
    ytitle: string,             // Titre de l'axe Y

    // Options de données
    pivot: boolean,             // Pivoter les données
    continue: boolean,          // Mode continu (pas de catégories fixes)
    xorder: 'asc' | 'desc',     // Tri des valeurs sur l'axe X
    stacked: boolean,           // Empilement (bar/column)

    // Interface utilisateur
    showToolbar: boolean,       // Barre d'outils custom (prev/next/pivot)

    // Cartographie (Highcharts Maps)
    mapEndpoint: string,        // URL GeoJSON ou endpoint
    mapParam: string,           // Paramètre d'URL pour la subdivision
    mapDefaultValue: string,    // Valeur par défaut si param absent
    mapJoinBy: [string, string],// JoinBy pour le mapping des données
    mapColor: string,           // Palette/couleur principale

    // Configuration Highcharts
    options: {
      chart: {
        backgroundColor: string,
        spacing: [number, number, number, number]
      },
      colors: string[],
      legend: {
        enabled: boolean,
        align: 'left' | 'center' | 'right',
        verticalAlign: 'top' | 'middle' | 'bottom'
      },
      tooltip: {
        shared: boolean,
        valueSuffix: string
      },
      xAxis: {
        title: { text: string },
        labels: { rotation: number }
      },
      yAxis: {
        title: { text: string },
        min: number
      },
      plotOptions: {
        series: {
          dataLabels: {
            enabled: boolean,
            format: string
          }
        },
        column: {
          stacking: 'normal' | 'percent'
        }
      },
      // Extensions jquery-highcharts
      donutCenter: {
        enabled: boolean,
        title: string
      },
      radialBar: {
        track: { enabled: boolean, color: string },
        centerValue: { enabled: boolean, fontSize: string, fontWeight: string }
      }
    }
  }
}`
  }
};
