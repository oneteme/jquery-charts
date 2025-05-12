import * as Highcharts from 'highcharts';
import { mergeDeep } from '@oneteme/jquery-core';

/**
 * Met à jour l'état de chargement d'un graphique
 */
export function setChartLoadingState(
  chart: Highcharts.Chart | null,
  isLoading: boolean,
  loadingText: string = 'Chargement des données...',
  debug: boolean = false
): void {
  if (!chart) {
    if (debug)
      console.warn(
        'Aucune instance de graphique fournie pour la mise à jour du chargement.'
      );
    return;
  }

  if (debug)
    console.log(
      `Mise à jour de l'état de chargement: ${
        isLoading ? 'Chargement en cours' : 'Chargement terminé'
      }`
    );

  if (isLoading) {
    // Configurer et afficher l'indicateur de chargement
    chart.showLoading(loadingText);

    // S'assurer que le message est correctement stylisé
    const loadingEl = chart.container?.querySelector('.highcharts-loading');
    if (loadingEl) {
      loadingEl.setAttribute('style', 'opacity: 1; visibility: visible');
    }

    const loadingTextEl = chart.container?.querySelector(
      '.highcharts-loading-inner'
    );
    if (loadingTextEl) {
      loadingTextEl.setAttribute(
        'style',
        'font-size: 16px; font-weight: bold; color: #666'
      );
    }
  } else {
    // Masquer l'indicateur de chargement
    chart.hideLoading();

    // Vérifier si le graphique a des données
    const hasSeries = chart.series.length > 0;
    const hasData =
      hasSeries &&
      chart.series.some(
        (series) => series.visible && series.points && series.points.length > 0
      );

    if (!hasData) {
      // Mettre à jour le message "pas de données"
      chart.update(
        {
          lang: { noData: 'Aucune donnée disponible' },
        },
        false,
        false,
        false
      );
    }
  }
}

/**
 * Met à jour l'état de chargement du graphique et ses options
 */
export function updateLoading(
  options: any,
  chart: Highcharts.Chart | null,
  isLoading: boolean,
  debug: boolean = false
): void {
  const loadingText = isLoading ? 'Chargement des données...' : 'Aucune donnée';

  if (debug) console.log('Mise à jour du statut de chargement:', loadingText);

  // Mettre à jour les options
  mergeDeep(options, {
    lang: { noData: loadingText },
  });

  // Si un graphique est fourni, utiliser la fonction centralisée
  if (chart) {
    setChartLoadingState(chart, isLoading, loadingText, debug);
  }
}