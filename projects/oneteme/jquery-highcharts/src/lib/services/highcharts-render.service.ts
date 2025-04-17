import { ElementRef, NgZone } from '@angular/core';
import { ChartType } from '@oneteme/jquery-core';
import * as Highcharts from 'highcharts';
import { configureTypeSpecificOptions, logDebug, mapChartType } from '../utils/chart-utils';

/**
 * Service pour gérer les interactions avec l'instance Highcharts
 */
export class HighchartsRenderService {
  private chart: Highcharts.Chart | null = null;
  private readonly oneToOneFlag = true;
  private readonly debug: boolean;

  constructor(
    private readonly el: ElementRef,
    private readonly ngZone: NgZone,
    debug: boolean = false
  ) {
    this.debug = debug;
  }

  /**
   * Crée une nouvelle instance du graphique Highcharts
   */
  public createChart(chartOptions: Highcharts.Options): void {
    if (!chartOptions) {
      logDebug('Impossible de créer le graphique: options non définies', null, this.debug);
      return;
    }

    try {
      logDebug('createChart démarré', null, this.debug);
      const startTime = performance.now();

      if (!chartOptions.chart) chartOptions.chart = {};

      // S'assurer que le conteneur est disponible
      const container = this.el.nativeElement.querySelector('.chart-container');
      if (!container) {
        logDebug('Conteneur de graphique non trouvé', null, this.debug);
        return;
      }

      // Création du graphique en dehors de la zone Angular pour de meilleures performances
      this.ngZone.runOutsideAngular(() => {
        const renderStartTime = performance.now();
        this.chart = Highcharts.chart(
          container,
          chartOptions
        );
        logDebug('Rendu du graphique terminé', {
          duration: `${(performance.now() - renderStartTime).toFixed(2)}ms`
        }, this.debug);
      });

      logDebug('createChart terminé', {
        totalDuration: `${(performance.now() - startTime).toFixed(2)}ms`
      }, this.debug);
    } catch (error) {
      console.error('[HIGHCHARTS] Erreur lors de la création du graphique:', error);
    }
  }

  /**
   * Met à jour le graphique existant avec les nouvelles options
   */
  public updateChart(chartOptions: Highcharts.Options): void {
    if (!this.chart) {
      logDebug('updateChart: Le graphique n\'existe pas encore', null, this.debug);
      return;
    }

    logDebug('updateChart démarré', null, this.debug);
    const startTime = performance.now();

    this.ngZone.runOutsideAngular(() => {
      const updateStartTime = performance.now();
      this.chart.update(chartOptions, true, this.oneToOneFlag);
      logDebug('Chart.update() terminé', {
        duration: `${(performance.now() - updateStartTime).toFixed(2)}ms`
      }, this.debug);
    });

    logDebug('updateChart terminé', {
      totalDuration: `${(performance.now() - startTime).toFixed(2)}ms`
    }, this.debug);
  }

  /**
   * Met à jour le type de graphique
   */
  public updateChartType(
    chartOptions: Highcharts.Options,
    oldType: ChartType,
    newType: ChartType
  ): void {
    logDebug('updateChartType démarré', {
      ancienType: oldType,
      nouveauType: newType
    }, this.debug);
    const startTime = performance.now();

    if (chartOptions?.chart) {
      chartOptions.chart.type = mapChartType(newType);
    }

    configureTypeSpecificOptions(chartOptions, newType);

    logDebug('updateChartType terminé', {
      duration: `${(performance.now() - startTime).toFixed(2)}ms`
    }, this.debug);
  }

  /**
   * Affiche ou masque l'indicateur de chargement
   */
  public toggleLoading(show: boolean): void {
    if (!this.chart) return;

    logDebug(`toggleLoading: ${show ? 'affichage' : 'masquage'} de l'indicateur`, null, this.debug);

    if (show) {
      // Afficher l'indicateur de chargement
      this.chart.showLoading('Chargement des données...');
    } else {
      // Masquer l'indicateur de chargement
      this.chart.hideLoading();
    }
  }

  /**
   * Détruit l'instance du graphique
   */
  public destroyChart(): void {
    if (!this.chart) return;

    logDebug('Destruction du graphique', null, this.debug);
    this.chart.destroy();
    this.chart = null;
  }

  /**
   * Retourne l'instance du graphique
   */
  public getChart(): Highcharts.Chart | null {
    return this.chart;
  }
}
