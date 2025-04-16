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
import {
  buildChart,
  ChartProvider,
  ChartView,
  XaxisType,
} from '@oneteme/jquery-core';
import * as Highcharts from 'highcharts';
import { ChartCustomEvent, determineXAxisDataType } from './utils';

@Directive({
  standalone: true,
  selector: '[highcharts-range-chart]',
})
export class RangeChartDirective<X extends XaxisType>
  implements ChartView<X, number[]>, OnChanges, OnDestroy
{
  private readonly el: ElementRef = inject(ElementRef);
  private readonly ngZone = inject(NgZone);
  private chart: Highcharts.Chart | null = null;
  private _chartConfig: ChartProvider<X, number[]>;
  private _options: Highcharts.Options;
  private _type: 'rangeArea' | 'rangeBar' | 'rangeColumn' = 'rangeArea';
  private _canPivot: boolean = true;
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
  set canPivot(canPivot: boolean) {
    this._canPivot = canPivot;
  }

  get canPivot(): boolean {
    return this._canPivot;
  }

  @Input()
  set type(type: 'rangeArea' | 'rangeBar' | 'rangeColumn') {
    if (this._type !== type) {
      this._type = type;
      this.configureTypeSpecificOptions();
      this._shouldRedraw = true;
    }
  }

  @Input()
  set config(config: ChartProvider<X, number[]>) {
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
        '[HIGHCHARTS RANGE] Détection de changements',
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
   * Initialise les options de base communes à tous les graphiques Highcharts de type range
   */
  private initCommonChartOptions(): Highcharts.Options {
    return {
      chart: {
        type: 'arearange' as const,
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
          type: 'arearange',
          data: [],
        },
      ],
      legend: {
        enabled: true,
      },
      xAxis: {
        type: 'category' as const,
      },
      yAxis: {
        title: {
          text: '',
        },
      },
      tooltip: {
        shared: true,
        valueDecimals: 2,
      },
    };
  }

  /**
   * Met à jour les options communes du graphique en fonction de la configuration fournie
   */
  private updateCommonOptions(
    options: Highcharts.Options,
    config: ChartProvider<X, number[]>
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

    // Gestion sûre des XAxis
    if (!options.xAxis) {
      options.xAxis = { title: { text: config.xtitle || undefined } };
    } else {
      // S'assurer que xAxis est un objet et non un tableau
      const xAxis = Array.isArray(options.xAxis)
        ? options.xAxis[0]
        : options.xAxis;
      if (!xAxis.title) xAxis.title = {};
      xAxis.title.text = config.xtitle || undefined;

      // Réassigner xAxis
      options.xAxis = xAxis;
    }

    // Gestion sûre des YAxis
    if (!options.yAxis) {
      options.yAxis = { title: { text: config.ytitle || undefined } };
    } else {
      // S'assurer que yAxis est un objet et non un tableau
      const yAxis = Array.isArray(options.yAxis)
        ? options.yAxis[0]
        : options.yAxis;
      if (!yAxis.title) yAxis.title = {};
      yAxis.title.text = config.ytitle || undefined;

      // Réassigner yAxis
      options.yAxis = yAxis;
    }

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
      case 'rangeArea':
        this._options.chart.type = 'arearange';
        break;

      case 'rangeBar':
        this._options.chart.type = 'columnrange';
        // Configuration pour des barres horizontales
        this._options.chart.inverted = true;
        break;

      case 'rangeColumn':
        this._options.chart.type = 'columnrange';
        // S'assurer que les colonnes sont verticales
        this._options.chart.inverted = false;
        break;

      default:
        this._options.chart.type = 'arearange';
        break;
    }
  }

  private updateChart() {
    if (!this.data || !this._chartConfig) {
      console.warn('[HIGHCHARTS RANGE] Données ou configuration manquantes');
      return;
    }

    try {
      // Construction des données au format CommonChart
      const commonChart = buildChart(
        this.data,
        {
          ...this._chartConfig,
          continue: true,
          pivot: !this.canPivot ? false : this._chartConfig.pivot,
        },
        null
      );

      // Formater les données pour Highcharts
      if (commonChart.series.length) {
        const highchartsSeries = [];

        for (const serie of commonChart.series) {
          const formattedData = serie.data
            .map((point) => {
              if (Array.isArray(point)) {
                // Si c'est déjà un tableau [low, high]
                return point;
              } else if (typeof point === 'object' && point !== null) {
                const isCoordinateWithRangeValue =
                  'x' in point && 'y' in point && Array.isArray(point.y);

                if (isCoordinateWithRangeValue) {
                  // Format { x, y: [low, high] }
                  return [point.x, point.y[0], point.y[1]];
                } else {
                  // Autre format d'objet non pris en charge
                  console.warn(
                    '[HIGHCHARTS RANGE] Format de données non pris en charge',
                    point
                  );
                  return null;
                }
              } else {
                // Format non pris en charge
                console.warn(
                  '[HIGHCHARTS RANGE] Format de données non pris en charge',
                  point
                );
                return null;
              }
            })
            .filter(Boolean);

          highchartsSeries.push({
            name: serie.name || '',
            type: this._options.chart.type as any,
            data: formattedData,
            color: serie.color,
          });
        }

        this._options.series = highchartsSeries;
      }

      // Déterminer le type d'axe X en fonction des données
      if (commonChart.series?.length && commonChart.series[0].data?.length) {
        const firstDataPoint = commonChart.series[0].data[0];

        if (
          typeof firstDataPoint === 'object' &&
          firstDataPoint !== null &&
          'x' in firstDataPoint
        ) {
          const x = (firstDataPoint as any).x;
          const xType = determineXAxisDataType(x);

          // S'assurer que xAxis est un objet pour pouvoir définir son type
          const xAxis = Array.isArray(this._options.xAxis)
            ? this._options.xAxis[0]
            : this._options.xAxis;
          xAxis.type = (
            xType === 'numeric' ? 'linear' : xType
          ) as Highcharts.AxisTypeValue;

          // Réassigner xAxis avec le bon type
          this._options.xAxis = xAxis;
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
              '[HIGHCHARTS RANGE] Erreur lors de la création du graphique:',
              chartError
            );
          }
        }
      });

      this.debug &&
        console.log(
          new Date().getMilliseconds(),
          '[HIGHCHARTS RANGE] Graphique mis à jour avec',
          this._options
        );
    } catch (error) {
      console.error(
        '[HIGHCHARTS RANGE] Erreur lors de la mise à jour du graphique:',
        error
      );
    }
  }
}
