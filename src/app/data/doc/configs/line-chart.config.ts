export const lineChartConfig = {
  basic: {
    code: `import { field } from '@oneteme/jquery-core';

const lineConfig = {
  title: "Évolution des performances sur 12 mois",
  xtitle: "Mois",
  ytitle: "Performance (points)",
  // Activation du mode continu pour les dates
  continue: true,
  // Tri des valeurs X par ordre croissant
  xorder: 'asc',
  // Hauteur du graphique en pixels
  height: 250,
  // Afficher ou non la barre d'outils
  showToolbar: false,
  series: [
    {
      name: "Équipe A",
      data: {
        x: field('date'),     // Date sur l'axe X
        y: field('team_a')    // Valeurs de l'équipe A
      },
      // Type spécifique (ligne)
      type: 'line',
      // Couleur de la série
      color: "#008FFB"
    },
    {
      name: "Équipe B",
      data: {
        x: field('date'),
        y: field('team_b')
      },
      type: 'area',         // Type area pour cette série
      color: "#00E396"
    }
  ],
  options: {
    chart: {
      dropShadow: {
        enabled: true,
        color: '#000',
        top: 18,
        left: 7,
        blur: 10,
        opacity: 0.2
      }
    },
    // Configuration des marqueurs (points)
    markers: {
      size: 5,
      colors: undefined,
      strokeWidth: 2,
      hover: {
        size: 7
      }
    },
    // Configuration des lignes
    stroke: {
      curve: 'smooth',     // Type de courbe: 'smooth', 'straight', 'stepline'
      width: [3, 2],       // Largeur des lignes pour chaque série
      dashArray: [0, 5]    // Ligne pointillée pour la 2ème série
    },
    // Remplissage pour les graphiques de type 'area'
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: "vertical",
        shadeIntensity: 0.1,
        inverseColors: false,
        opacityFrom: 0.7,
        opacityTo: 0.2,
      }
    },
    // Configuration des étiquettes de données
    dataLabels: {
      enabled: false
    },
    // Configuration des axes
    xaxis: {
      type: 'datetime',    // Type d'axe X pour les données temporelles
      labels: {
        format: 'MMM yyyy'  // Format d'affichage des dates
      }
    },
    yaxis: {
      min: 0,              // Valeur minimale de l'axe Y
      max: 100,            // Valeur maximale de l'axe Y
      tickAmount: 5        // Nombre approximatif de graduations
    },
    // Configuration des infobulles
    tooltip: {
      x: {
        format: 'dd MMM yyyy'  // Format de la date dans l'infobulle
      }
    },
    // Configuration de la légende
    legend: {
      position: 'top',
      horizontalAlign: 'right'
    }
  },
};
`
  }
};