import { Highcharts } from './highcharts-modules';

/**
 * Affiche l'indicateur de chargement sur le graphique
 */
export function showLoading(chart: Highcharts.Chart, text: string = 'Chargement des données...'): void {
  if (!chart) {
    return;
  }

  // Masquer le message "no-data" pendant le chargement
  if (typeof (chart as any).hideNoData === 'function') {
    (chart as any).hideNoData();
  }

  chart.showLoading(text);
}

/**
 * Masque l'indicateur de chargement
 */
export function hideLoading(chart: Highcharts.Chart): void {
  if (!chart) {
    return;
  }
  chart.hideLoading();
}

/**
 * Force l'affichage du message "Aucune donnée"
 * Le texte affiché sera celui configuré dans lang.noData
 */
export function showNoDataMessage(chart: Highcharts.Chart): void {
  if (!chart) {
    return;
  }
  
  // Utiliser l'API showNoData sans paramètre pour utiliser la configuration lang.noData
  if (typeof (chart as any).showNoData === 'function') {
    (chart as any).showNoData();
  }
}

/**
 * Masque la toolbar et le bouton d'export du graphique
 */
export function hideChartToolbar(chart: Highcharts.Chart): void {
  if (!chart?.container) {
    return;
  }

  // Masquer le bouton d'export Highcharts
  const exportButton = chart.container.querySelector('.highcharts-exporting-group');
  if (exportButton) {
    (exportButton as HTMLElement).style.display = 'none';
  }

  // Masquer la toolbar personnalisée
  const customToolbar = chart.container.querySelector('.highcharts-custom-toolbar');
  if (customToolbar) {
    (customToolbar as HTMLElement).style.display = 'none';
  }
}

/**
 * Affiche la toolbar et le bouton d'export du graphique
 */
export function showChartToolbar(chart: Highcharts.Chart): void {
  if (!chart?.container) {
    return;
  }

  // Afficher le bouton d'export Highcharts
  const exportButton = chart.container.querySelector('.highcharts-exporting-group');
  if (exportButton) {
    (exportButton as HTMLElement).style.display = '';
  }

  // Afficher la toolbar personnalisée
  const customToolbar = chart.container.querySelector('.highcharts-custom-toolbar');
  if (customToolbar) {
    (customToolbar as HTMLElement).style.display = 'flex';
  }
}

/**
 * Met à jour l'état de chargement du graphique en fonction de l'état et des données
 * Gère automatiquement l'affichage du loading, du message noData et de la toolbar
 */
export function updateChartLoadingState(
  chart: Highcharts.Chart,
  isLoading: boolean,
  hasData: boolean
): void {
  if (!chart) {
    return;
  }

  if (isLoading && !hasData) {
    // État: chargement en cours
    hideChartToolbar(chart);
    showLoading(chart, 'Chargement des données...');
  } else if (!isLoading && !hasData) {
    // État: chargement terminé sans données
    hideLoading(chart);
    hideChartToolbar(chart);
    showNoDataMessage(chart);
  } else {
    // État: données présentes
    hideLoading(chart);
    showChartToolbar(chart);
  }
}

/**
 * Configure les options de loading par défaut pour Highcharts
 */
export function configureLoadingOptions(chartOptions: Highcharts.Options): void {
  chartOptions.loading = {
    hideDuration: 100,
    showDuration: 100,
    labelStyle: {
      color: '#666',
      fontSize: '14px',
      fontWeight: 'normal'
    },
    style: {
      backgroundColor: 'transparent',
      opacity: 1
    }
  };

  // Configuration du module no-data-to-display
  (chartOptions as any).lang = {
    ...(chartOptions as any).lang,
    noData: 'Aucune donnée'
  };

  (chartOptions as any).noData = {
    style: {
      fontWeight: 'normal',
      fontSize: '14px',
      color: '#666'
    }
  };

  if (!chartOptions.chart) {
    chartOptions.chart = {};
  }
}
