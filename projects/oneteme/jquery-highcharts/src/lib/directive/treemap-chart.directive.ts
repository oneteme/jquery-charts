import {
  Directive,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { buildChart, ChartProvider, ChartView } from '@oneteme/jquery-core';
import * as Highcharts from 'highcharts';
import { ChartCustomEvent } from './utils';

@Directive({
  standalone: true,
  selector: '[highcharts-treemap-chart]',
})
export class TreemapChartDirective
  implements ChartView<string, number>, OnChanges, OnDestroy
{
  private readonly el: ElementRef = inject(ElementRef);
  private readonly ngZone = inject(NgZone);
  private chart: Highcharts.Chart | null = null;
  private _chartConfig: ChartProvider<string, number>;
  private _options: Highcharts.Options;
  private _type: 'treemap' | 'heatmap' = 'treemap';
  private _shouldRedraw: boolean = false;

  @Input() debug: boolean = false;
  @Input({ required: true }) data: any[];
  @Output() customEvent: EventEmitter<ChartCustomEvent> = new EventEmitter();

  @Input()
  set isLoading(isLoading: boolean) {
    if (this.chart) {
      if (isLoading) {
        this.chart.showLoading('Chargement des données...');
      } else {
        this.chart.hideLoading();
      }
    }
  }

  @Input()
  set type(type: 'treemap' | 'heatmap') {
    if (this._type !== type) {
      this._type = type;
      this.configureTypeSpecificOptions();
      this._shouldRedraw = true;
    }
  }

  @Input()
  set config(config: ChartProvider<string, number>) {
    this._chartConfig = config;
    this._options = this.updateCommonOptions(
      this._options || this.initCommonChartOptions(),
      config
    );
    this.configureTypeSpecificOptions();
  }

  constructor() {
    this._options = this.initCommonChartOptions();
    this.configureTypeSpecificOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.debug &&
      console.log(
        new Date().getMilliseconds(),
        '[HIGHCHARTS TREEMAP] Détection de changements',
        changes
      );

    if (changes['type']) {
      this.configureTypeSpecificOptions();
      this._shouldRedraw = true;
    }

    if (changes['data'] || changes['config'] || changes['type']) {
      this.updateChart();
    }
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  /**
   * Initialise les options de base communes aux graphiques Highcharts treemap et heatmap
   */
  private initCommonChartOptions(): Highcharts.Options {
    return {
      chart: {
        type: 'treemap' as const,
        events: {},
      },
      title: {
        text: undefined,
      },
      credits: {
        enabled: false,
      },
      series: [
        {
          type: 'treemap',
          data: [],
        },
      ],
      legend: {
        enabled: true,
      },
      colorAxis: {
        minColor: '#FFFFFF',
        maxColor: '#1976D2',
      },
      tooltip: {
        headerFormat: '<b>{point.key}</b><br/>',
        pointFormat: '{point.name}: {point.value}',
      },
    };
  }

  /**
   * Met à jour les options communes du graphique en fonction de la configuration fournie
   */
  private updateCommonOptions(
    options: Highcharts.Options,
    config: ChartProvider<string, number>
  ): Highcharts.Options {
    if (!options.chart) options.chart = {};

    // Définir les dimensions
    options.chart.height = config.height || undefined;
    options.chart.width = config.width || null;

    // Définir les titres
    if (!options.title) options.title = {};
    options.title.text = config.title || undefined;

    if (!options.subtitle) options.subtitle = {};
    options.subtitle.text = config.subtitle || undefined;

    // Appliquer les options personnalisées de l'utilisateur
    if (config.options) {
      // Fusion deep des options utilisateur
      for (const key in config.options) {
        if (
          typeof config.options[key] === 'object' &&
          config.options[key] !== null
        ) {
          if (!options[key] || typeof options[key] !== 'object') {
            options[key] = {};
          }

          Object.assign(options[key], config.options[key]);
        } else {
          options[key] = config.options[key];
        }
      }
    }

    return options;
  }

  private configureTypeSpecificOptions() {
    if (!this._options) {
      this._options = this.initCommonChartOptions();
    }

    if (!this._options.chart) this._options.chart = {};
    if (!this._options.plotOptions) this._options.plotOptions = {};

    // Configuration spécifique au type
    switch (this._type) {
      case 'treemap':
        this._options.chart.type = 'treemap';
        if (!this._options.plotOptions.treemap)
          this._options.plotOptions.treemap = {};
        (this._options.plotOptions.treemap as any).layoutAlgorithm =
          'squarified';
        (this._options.plotOptions.treemap as any).dataLabels = {
          enabled: true,
          format: '{point.name}: {point.value}',
        };
        break;

      case 'heatmap':
        this._options.chart.type = 'heatmap';
        if (!this._options.xAxis) this._options.xAxis = {};
        if (!this._options.yAxis) this._options.yAxis = {};

        // Configuration spécifique à la heatmap
        const xAxis = Array.isArray(this._options.xAxis)
          ? this._options.xAxis[0]
          : this._options.xAxis;
        xAxis.opposite = true;

        const yAxis = Array.isArray(this._options.yAxis)
          ? this._options.yAxis[0]
          : this._options.yAxis;
        yAxis.opposite = true;

        this._options.xAxis = xAxis;
        this._options.yAxis = yAxis;

        if (!this._options.plotOptions.heatmap)
          this._options.plotOptions.heatmap = {};
        (this._options.plotOptions.heatmap as any).dataLabels = {
          enabled: true,
          format: '{point.value}',
        };
        break;

      default:
        this._options.chart.type = 'treemap';
        break;
    }
  }

  private updateChart() {
    if (!this.data || !this._chartConfig) {
      console.warn('[HIGHCHARTS TREEMAP] Données ou configuration manquantes');
      return;
    }

    try {
      // Construction des données au format CommonChart
      const commonChart = buildChart(
        this.data,
        {
          ...this._chartConfig,
          continue: true,
        },
        null
      );

      // Formater les données selon le type de graphique
      if (this._type === 'treemap') {
        // Pour treemap, nous avons besoin de données au format:
        // [{name: string, value: number}, ...]
        if (commonChart.series.length) {
          const treemapData = [];

          for (const serie of commonChart.series) {
            for (let i = 0; i < serie.data.length; i++) {
              const point = serie.data[i];
              const value =
                typeof point === 'object' && point !== null && 'y' in point
                  ? point.y
                  : point;

              const name =
                typeof point === 'object' && point !== null && 'x' in point
                  ? point.x?.toString()
                  : `Point ${i}`;

              treemapData.push({
                name,
                value,
                color: serie.color,
              });
            }
          }

          this._options.series = [
            {
              type: 'treemap',
              data: treemapData,
              name: commonChart.series[0].name || 'Treemap',
            },
          ];
        }
      } else if (this._type === 'heatmap') {
        // Pour heatmap, nous avons besoin de données au format:
        // [[x, y, value], ...]
        if (commonChart.series.length) {
          const heatmapData = [];
          const xCategories = new Set<string>();
          const yCategories = new Set<string>();

          for (const serie of commonChart.series) {
            // Pour chaque point, extraire les valeurs x, y et value
            for (const point of serie.data) {
              let x, y, value;

              if (typeof point === 'object' && point !== null) {
                if ('x' in point && 'y' in point) {
                  // Format {x, y}
                  x = point.x?.toString() || '';
                  value = point.y;
                  y = serie.name || '';
                }
              } else {
                // Format simple
                value = point;
                x = `Point ${heatmapData.length}`;
                y = serie.name || '';
              }

              if (x !== undefined && y !== undefined && value !== undefined) {
                xCategories.add(x);
                yCategories.add(y);
                heatmapData.push([x, y, value]);
              }
            }
          }

          // Configurer les catégories pour les axes
          const xAxis = Array.isArray(this._options.xAxis)
            ? this._options.xAxis[0]
            : this._options.xAxis;
          xAxis.categories = Array.from(xCategories);

          const yAxis = Array.isArray(this._options.yAxis)
            ? this._options.yAxis[0]
            : this._options.yAxis;
          yAxis.categories = Array.from(yCategories);

          this._options.xAxis = xAxis;
          this._options.yAxis = yAxis;

          this._options.series = [
            {
              type: 'heatmap',
              data: heatmapData,
              name: 'Heatmap',
            },
          ];
        }
      }

      // Définir les dimensions explicites pour éviter les erreurs NaN
      if (!this._options.chart) this._options.chart = {};
      const containerWidth = this.el.nativeElement.offsetWidth || undefined;
      const containerHeight = this.el.nativeElement.offsetHeight || undefined;
      this._options.chart.width = containerWidth;
      this._options.chart.height = containerHeight;

      // Création ou mise à jour du graphique
      this.ngZone.runOutsideAngular(() => {
        if (this.chart && !this._shouldRedraw) {
          // Mise à jour du graphique existant
          this.chart.update(this._options, true);
        } else {
          // Destruction du graphique existant si nécessaire
          if (this.chart) {
            this.chart.destroy();
          }

          // Création d'un nouveau graphique
          try {
            this.chart = Highcharts.chart(this.el.nativeElement, this._options);
            this._shouldRedraw = false;
          } catch (chartError) {
            console.error(
              '[HIGHCHARTS TREEMAP] Erreur lors de la création du graphique:',
              chartError
            );
          }
        }
      });

      this.debug &&
        console.log(
          new Date().getMilliseconds(),
          '[HIGHCHARTS TREEMAP] Graphique mis à jour avec',
          this._options
        );
    } catch (error) {
      console.error(
        '[HIGHCHARTS TREEMAP] Erreur lors de la mise à jour du graphique:',
        error
      );
    }
  }
}
