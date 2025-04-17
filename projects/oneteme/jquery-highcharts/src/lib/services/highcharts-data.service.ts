import { ChartProvider, ChartType, CommonChart, Coordinate2D, XaxisType, YaxisType, buildChart, buildSingleSerieChart, mergeDeep } from '@oneteme/jquery-core';
import * as Highcharts from 'highcharts';
import { isDataContinuous, isSimpleChartType, logDebug } from '../utils/chart-utils';

/**
 * Service pour gérer les données des graphiques Highcharts
 */
export class HighchartsDataService<X extends XaxisType, Y extends YaxisType> {
  private commonChart: CommonChart<X, Y | Coordinate2D>;
  private readonly debug: boolean = false;

  constructor(debug: boolean = false) {
    this.debug = debug;
  }

  /**
   * Met à jour les données du graphique
   * @returns boolean indiquant si des données sont disponibles
   */
  public updateData(
    data: any[],
    config: ChartProvider<X, Y>,
    chartType: ChartType,
    chartOptions: Highcharts.Options
  ): boolean {
    if (!data || !config) {
      logDebug(
        'Impossible de mettre à jour les données: données ou configuration manquantes',
        null,
        this.debug
      );
      return false;
    }

    try {
      logDebug(
        'updateData démarré',
        {
          dataLength: data.length,
          chartType: chartType,
        },
        this.debug
      );
      const startTime = performance.now();

      // S'assurer que config.series est défini avec au moins un élément
      if (
        !config.series ||
        !Array.isArray(config.series) ||
        config.series.length === 0
      ) {
        logDebug(
          "Configuration des séries manquante, création d'une série par défaut",
          null,
          this.debug
        );
        // Afficher un warning et créer une série par défaut
        console.warn('[HIGHCHARTS] Configuration des séries manquante. Utilisation d\'une configuration par défaut.');
      }

      // Déterminer si nous utilisons un graphique simple ou complexe
      let buildChartStartTime = performance.now();
      if (isSimpleChartType(chartType)) {
        // Pour les graphiques simples
        logDebug("Construction d'un graphique simple", null, this.debug);
        this.commonChart = buildSingleSerieChart(
          data,
          { ...config, continue: false },
          null
        );
      } else {
        // Pour les graphiques complexes
        logDebug("Construction d'un graphique complexe", null, this.debug);
        this.commonChart = buildChart(
          data,
          { ...config, continue: isDataContinuous(chartType) },
          null
        );
      }
      logDebug(
        'Construction du chart terminée',
        {
          duration: `${(performance.now() - buildChartStartTime).toFixed(2)}ms`,
        },
        this.debug
      );

      if (!chartOptions) {
        throw new Error('Options de graphique non définies');
      }

      // Mise à jour des séries dans les options Highcharts
      const seriesStartTime = performance.now();
      this.updateSeriesData(chartOptions, config, chartType);
      logDebug(
        'Mise à jour des séries terminée',
        {
          duration: `${(performance.now() - seriesStartTime).toFixed(2)}ms`,
          seriesCount: this.commonChart.series.length,
        },
        this.debug
      );

      logDebug(
        'updateData terminé',
        {
          totalDuration: `${(performance.now() - startTime).toFixed(2)}ms`,
        },
        this.debug
      );

      // Retourner true si des données sont disponibles
      return data && data.length > 0;
    } catch (error) {
      console.error(
        '[HIGHCHARTS] Erreur lors de la mise à jour des données:',
        error
      );
      return false;
    }
  }

  /**
   * Met à jour les séries de données dans les options du graphique
   */
  private updateSeriesData(
    chartOptions: Highcharts.Options,
    config: ChartProvider<X, Y>,
    chartType: ChartType
  ): void {
    if (!this.commonChart || !chartOptions) return;

    try {
      logDebug('updateSeriesData démarré', null, this.debug);
      const startTime = performance.now();

      if (isSimpleChartType(chartType)) {
        // Format pour les graphiques simples comme pie, donut
        logDebug(
          'Traitement des séries pour graphique simple',
          null,
          this.debug
        );
        const seriesDataStartTime = performance.now();

        const seriesData =
          this.commonChart.series[0]?.data.map((point, index) => {
            const category = this.commonChart.categories?.[index] || '';
            return {
              name: String(category),
              y: typeof point === 'number' ? point : null,
            };
          }) || [];

        chartOptions.series = [
          {
            name: this.commonChart.series[0]?.name || config.ytitle || 'Valeur',
            data: seriesData,
            color: this.commonChart.series[0]?.color,
          },
        ] as any;

        logDebug(
          'Séries pour graphique simple créées',
          {
            duration: `${(performance.now() - seriesDataStartTime).toFixed(
              2
            )}ms`,
            pointCount: seriesData.length,
          },
          this.debug
        );
      } else {
        // Format pour les graphiques complexes
        logDebug(
          'Traitement des séries pour graphique complexe',
          null,
          this.debug
        );
        const seriesStartTime = performance.now();

        const series = this.commonChart.series.map((series) => {
          let seriesData: (Y | { x: any; y: any; })[];

          if (isDataContinuous(chartType)) {
            // Pour les graphiques continus (x, y)
            seriesData = series.data.map((point) => {
              if (
                typeof point === 'object' &&
                point !== null &&
                'x' in point &&
                'y' in point
              ) {
                return { x: (point as any).x, y: (point as any).y };
              }
              return point;
            });
          } else {
            // Pour les graphiques avec catégories
            seriesData = series.data;
          }

          return {
            name: series.name || '',
            data: seriesData,
            color: series.color,
            stack: series.stack,
          };
        });

        chartOptions.series = series as any;

        logDebug(
          'Séries pour graphique complexe créées',
          {
            duration: `${(performance.now() - seriesStartTime).toFixed(2)}ms`,
            seriesCount: series.length,
          },
          this.debug
        );

        // Ajouter les catégories pour les graphiques non-continus
        if (
          !isDataContinuous(chartType) &&
          this.commonChart.categories?.length
        ) {
          const categoriesStartTime = performance.now();

          if (!chartOptions.xAxis) {
            chartOptions.xAxis = {};
          }

          if (Array.isArray(chartOptions.xAxis)) {
            chartOptions.xAxis[0].categories = this.commonChart.categories.map(
              (category) => String(category)
            );
          } else {
            chartOptions.xAxis.categories = this.commonChart.categories.map(
              (category) => String(category)
            );
          }

          logDebug(
            'Catégories mises à jour',
            {
              duration: `${(performance.now() - categoriesStartTime).toFixed(
                2
              )}ms`,
              categoryCount: this.commonChart.categories.length,
            },
            this.debug
          );
        }
      }

      // Fusionner avec les options personnalisées de l'utilisateur
      if (config.options) {
        const mergeStartTime = performance.now();
        Object.assign(chartOptions, mergeDeep(chartOptions, config.options));
        logDebug(
          'Options personnalisées fusionnées',
          {
            duration: `${(performance.now() - mergeStartTime).toFixed(2)}ms`,
          },
          this.debug
        );
      }

      logDebug(
        'updateSeriesData terminé',
        {
          totalDuration: `${(performance.now() - startTime).toFixed(2)}ms`,
        },
        this.debug
      );
    } catch (error) {
      console.error(
        '[HIGHCHARTS] Erreur lors de la mise à jour des séries:',
        error
      );
    }
  }
}
