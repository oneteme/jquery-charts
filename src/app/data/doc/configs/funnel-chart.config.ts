export const funnelChartConfig = {
  basic: {
    code: `import { field } from '@oneteme/jquery-core';

const funnelConfig = {
  title: "Entonnoir de conversion",
  subtitle: "Parcours utilisateur du site web",
  // Hauteur du graphique en pixels
  height: 250,
  // Afficher ou non la barre d'outils
  showToolbar: false,
  series: [
    {
      name: "Visiteurs",
      data: {
        x: field('stage'),    // Étape du parcours
        y: field('count')     // Nombre de visiteurs à cette étape
      }
    }
  ],
  options: {
    // Configuration des étiquettes de données
    dataLabels: {
      enabled: true,
      formatter: (val, opt) => {
        // Affiche le nom de l'étape et la valeur
        return \`\${opt.w.globals.labels[opt.dataPointIndex]}: \${val}\`;
      },
      dropShadow: {
        enabled: true
      }
    },
    // Configuration spécifique à l'entonnoir
    plotOptions: {
      funnel: {
        // Largeur du goulot (en pourcentage)
        neckWidth: '30%',
        // Hauteur du goulot (en pourcentage)
        neckHeight: '25%',
        // Orientation du graphique
        height: '90%',
        // Rapport d'aspect du graphique
        width: '80%',
        // Espacement entre les sections
        gap: 2
      }
    },
    // Configuration des couleurs
    colors: ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0'],
    // Configuration de la légende
    legend: {
      show: true,
      position: 'right'
    },
    // Animations
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 800,
      animateGradually: {
        enabled: true,
        delay: 150
      }
    },
    tooltip: {
      // Format personnalisé pour l'infobulle
      y: {
        formatter: (value) => \`\${value.toLocaleString()} visiteurs\`
      }
    }
  }
};
`,
  },
};
