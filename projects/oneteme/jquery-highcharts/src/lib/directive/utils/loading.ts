import { Highcharts } from './highcharts-modules';

// Affiche l'indicateur de chargement sur le graphique
export function showLoading(chart: Highcharts.Chart, text: string = 'Chargement des données...'): void {
  if (!chart) return;
  chart.showLoading(text);
}

// Masque l'indicateur de chargement
export function hideLoading(chart: Highcharts.Chart): void {
  if (!chart) return;
  chart.hideLoading();
}

// Configure les options de loading par défaut pour Highcharts
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
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      opacity: 1
    }
  };
}
