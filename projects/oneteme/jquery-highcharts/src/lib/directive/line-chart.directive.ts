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
  YaxisType,
} from '@oneteme/jquery-core';
import * as Highcharts from 'highcharts';
import {
  ChartCustomEvent,
  convertToHighchartsSeries,
  determineXAxisDataType,
} from './utils';

@Directive({
  standalone: true,
  selector: '[highcharts-line-chart]',
})
export class LineChartDirective<X extends XaxisType, Y extends YaxisType>
  implements ChartView<X, Y>, OnChanges, OnDestroy
{
  private readonly el: ElementRef = inject(ElementRef);
  private readonly ngZone = inject(NgZone);
  private chart: Highcharts.Chart | null = null;
  private _chartConfig: ChartProvider<X, Y>;
  private _options: Highcharts.Options;
  private _shouldRedraw: boolean = false;

  @Input() debug: boolean = false;
  @Input({ required: true }) type: 'line' | 'area';
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
  set config(config: ChartProvider<X, Y>) {
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
        '[HIGHCHARTS LINE] Détection de changements',
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
   * Initialise les options de base communes à tous les graphiques Highcharts
   */
  private initCommonChartOptions(): Highcharts.Options {
    return {
      chart: {
        type: 'line' as const,
        events: {},
        zooming: {
          type: 'x',
          mouseWheel: false,
          pinchType: undefined,
        },
      },
      title: {
        text: undefined,
      },
      credits: {
        enabled: false,
      },
      series: [],
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
      plotOptions: {
        series: {
          marker: {
            enabled: true,
          },
        },
      },
    };
  }

  /**
   * Met à jour les options communes du graphique en fonction de la configuration fournie
   */
  private updateCommonOptions(
    options: Highcharts.Options,
    config: ChartProvider<X, Y>
  ): Highcharts.Options {
    if (!options.chart) options.chart = {};
    if (!options.plotOptions) options.plotOptions = {};
    if (!options.plotOptions.series) options.plotOptions.series = {};

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

    // Support des sparklines
    if (config.options?.chart?.sparkline?.enabled) {
      // Configurer les sparklines (graphique très minimaliste)
      options.chart.height = 50; // Hauteur réduite
      if (!options.xAxis) options.xAxis = {};
      const xAxis = Array.isArray(options.xAxis)
        ? options.xAxis[0]
        : options.xAxis;
      xAxis.visible = false;
      options.xAxis = xAxis;

      if (!options.yAxis) options.yAxis = {};
      const yAxis = Array.isArray(options.yAxis)
        ? options.yAxis[0]
        : options.yAxis;
      yAxis.visible = false;
      options.yAxis = yAxis;

      if (!options.legend) options.legend = {};
      options.legend.enabled = false;

      if (!options.plotOptions.series) options.plotOptions.series = {};
      options.plotOptions.series.marker = { enabled: false };
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

    if (!this.type) {
      return;
    }

    if (!this._options.chart) this._options.chart = {};
    if (!this._options.plotOptions) this._options.plotOptions = {};
    if (!this._options.plotOptions.series)
      this._options.plotOptions.series = {};

    // Configuration spécifique au type
    if (this.type === 'line') {
      this._options.chart.type = 'line';
    } else if (this.type === 'area') {
      this._options.chart.type = 'area';
    }
  }

  private updateChart() {
    if (!this.data || !this._chartConfig) {
      console.warn('[HIGHCHARTS LINE] Données ou configuration manquantes');
      return;
    }

    try {
      // Construction des données au format CommonChart
      const commonChart = buildChart(this.data, {
        ...this._chartConfig,
        continue: true,
      });

      // Conversion au format Highcharts
      this._options.series = convertToHighchartsSeries(commonChart as any);

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
              '[HIGHCHARTS LINE] Erreur lors de la création du graphique:',
              chartError
            );
          }
        }
      });

      this.debug &&
        console.log(
          new Date().getMilliseconds(),
          '[HIGHCHARTS LINE] Graphique mis à jour avec',
          this._options
        );
    } catch (error) {
      console.error(
        '[HIGHCHARTS LINE] Erreur lors de la mise à jour du graphique:',
        error
      );
    }
  }
}
