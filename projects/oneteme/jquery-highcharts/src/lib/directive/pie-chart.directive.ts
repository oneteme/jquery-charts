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
  buildSingleSerieChart,
  ChartProvider,
  ChartView,
} from '@oneteme/jquery-core';
import * as Highcharts from 'highcharts';
import { ChartCustomEvent, convertToHighchartsSeries } from './utils';

@Directive({
  standalone: true,
  selector: '[highcharts-pie-chart]',
})
export class PieChartDirective
  implements ChartView<string, number>, OnChanges, OnDestroy
{
  private readonly el: ElementRef = inject(ElementRef);
  private readonly ngZone = inject(NgZone);
  private chart: Highcharts.Chart | null = null;
  private _chartConfig: ChartProvider<string, number>;
  private _options: Highcharts.Options;
  private _type: 'pie' | 'donut' | 'polar' | 'radar' | 'radial' = 'pie';
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
  set type(type: 'pie' | 'donut' | 'polar' | 'radar' | 'radial') {
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
        '[HIGHCHARTS PIE] Détection de changements',
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
   * Initialise les options de base communes à tous les graphiques Highcharts de type pie
   */
  private initCommonChartOptions(): Highcharts.Options {
    return {
      chart: {
        type: 'pie' as const,
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
          type: 'pie',
          data: [],
        },
      ],
      legend: {
        enabled: true,
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b>: {point.percentage:.1f} %',
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
    config: ChartProvider<string, number>
  ): Highcharts.Options {
    this.initializeOptionsStructure(options);
    this.setDimensions(options, config);
    this.setTitles(options, config);
    this.applyCustomOptions(options, config);

    return options;
  }

  /**
   * Initialise la structure des options si nécessaire
   */
  private initializeOptionsStructure(options: Highcharts.Options): void {
    if (!options.chart) options.chart = {};
    if (!options.plotOptions) options.plotOptions = {};
    if (!options.plotOptions.pie) options.plotOptions.pie = {};
  }

  /**
   * Définit les dimensions du graphique
   */
  private setDimensions(options: Highcharts.Options, config: ChartProvider<string, number>): void {
    options.chart.height = config.height || undefined;
    options.chart.width = config.width || null;
  }

  /**
   * Définit les titres du graphique
   */
  private setTitles(options: Highcharts.Options, config: ChartProvider<string, number>): void {
    if (!options.title) options.title = {};
    options.title.text = config.title || undefined;

    if (!options.subtitle) options.subtitle = {};
    options.subtitle.text = config.subtitle || undefined;
  }

  /**
   * Applique les options personnalisées de l'utilisateur
   */
  private applyCustomOptions(options: Highcharts.Options, config: ChartProvider<string, number>): void {
    if (!config.options) return;

    // Fusion deep des options utilisateur
    for (const key in config.options) {
      this.applyOptionValue(options, key, config.options[key]);
    }
  }

  /**
   * Applique une valeur d'option spécifique
   */
  private applyOptionValue(options: Highcharts.Options, key: string, value: any): void {
    if (typeof value === 'object' && value !== null) {
      if (!options[key] || typeof options[key] !== 'object') {
        options[key] = {};
      }
      Object.assign(options[key], value);
    } else {
      options[key] = value;
    }
  }

  private configureTypeSpecificOptions() {
    if (!this._options) {
      this._options = this.initCommonChartOptions();
    }

    if (!this._options.chart) this._options.chart = {};
    if (!this._options.plotOptions) this._options.plotOptions = {};
    if (!this._options.plotOptions.pie) this._options.plotOptions.pie = {};

    // Configuration spécifique au type
    switch (this._type) {
      case 'pie':
        this._options.chart.type = 'pie';
        break;

      case 'donut':
        this._options.chart.type = 'pie';
        // Configuration pour créer un donut (pie avec un trou au centre)
        (this._options.plotOptions.pie as any).innerSize = '50%';
        break;

      case 'polar':
        // Pour Highcharts, le polar est un module différent
        this._options.chart.polar = true;
        this._options.chart.type = 'column'; // ou 'line' selon la préférence
        break;

      case 'radar':
        // Pour Highcharts, le radar est un type spécifique (module supplémentaire)
        this._options.chart.polar = true;
        this._options.chart.type = 'line';
        break;

      default:
        this._options.chart.type = 'pie';
        break;
    }
  }

  private updateChart() {
    if (!this.data || !this._chartConfig) {
      console.warn('[HIGHCHARTS PIE] Données ou configuration manquantes');
      return;
    }

    try {
      // Construction des données au format CommonChart
      const commonChart = this.buildCommonChart();

      // Adapter les données selon le type de graphique
      this.updateSeriesData(commonChart);

      // Définir les dimensions du graphique
      this.setChartDimensions();

      // Création ou mise à jour du graphique
      this.renderChart();

      this.debug &&
        console.log(
          new Date().getMilliseconds(),
          '[HIGHCHARTS PIE] Graphique mis à jour avec',
          this._options
        );
    } catch (error) {
      console.error(
        '[HIGHCHARTS PIE] Erreur lors de la mise à jour du graphique:',
        error
      );
    }
  }

  private buildCommonChart() {
    const chartConfig = { ...this._chartConfig, continue: false };
    return this.data.length != 1 && this._type == 'radar'
      ? buildChart(this.data, chartConfig, null)
      : buildSingleSerieChart(this.data, chartConfig, null);
  }

  private updateSeriesData(commonChart) {
    if (this._type === 'pie' || this._type === 'donut') {
      this.updatePieSeriesData(commonChart);
    } else {
      this.updateNonPieSeriesData(commonChart);
    }
  }

  private updatePieSeriesData(commonChart) {
    const pieData = this.createPieData(commonChart);
    this.setPieSeriesData(pieData);
  }

  private createPieData(commonChart) {
    const pieData = [];
    
    if (commonChart.categories?.length) {
      for (let i = 0; i < commonChart.categories.length; i++) {
        const category = commonChart.categories[i];
        let value = 0;

        if (commonChart.series.length > 0) {
          const dataPoint = commonChart.series[0].data[i];
          value = typeof dataPoint === 'object' && dataPoint !== null
            ? dataPoint.y
            : dataPoint || 0;
        }

        pieData.push({
          name: category?.toString() || '',
          y: value,
        });
      }
    }
    
    return pieData;
  }

  private setPieSeriesData(pieData) {
    if (!this._options.series) {
      this._options.series = [
        {
          type: 'pie',
          data: pieData,
        },
      ];
      return;
    }
    
    if (!Array.isArray(this._options.series)) {
      return;
    }
    
    if (this._options.series.length === 0) {
      this._options.series.push({
        type: 'pie',
        data: pieData,
      });
    } else {
      (this._options.series[0] as Highcharts.SeriesPieOptions).data = pieData;
    }
  }

  private updateNonPieSeriesData(commonChart) {
    this._options.series = convertToHighchartsSeries(commonChart);

    if (this._type === 'radar' || this._type === 'polar' || this._type === 'radial') {
      this.configureRadarPolarAxes(commonChart);
    }
  }

  private configureRadarPolarAxes(commonChart) {
    this.configureXAxis(commonChart);
    this.configureYAxis();
  }

  private configureXAxis(commonChart) {
    if (!this._options.xAxis) this._options.xAxis = {};

    const xAxis = Array.isArray(this._options.xAxis)
      ? this._options.xAxis[0]
      : this._options.xAxis;
    xAxis.categories =
      commonChart.categories?.map((c) => c?.toString() || '') || [];
    xAxis.tickmarkPlacement = 'on';
    xAxis.lineWidth = 0;

    this._options.xAxis = xAxis;
  }

  private configureYAxis() {
    if (!this._options.yAxis) this._options.yAxis = {};
    const yAxis = Array.isArray(this._options.yAxis)
      ? this._options.yAxis[0]
      : this._options.yAxis;
    yAxis.gridLineInterpolation = 'polygon';
    yAxis.lineWidth = 0;
    yAxis.min = 0;

    this._options.yAxis = yAxis;
  }

  private setChartDimensions() {
    if (!this._options.chart) this._options.chart = {};
    const containerWidth = this.el.nativeElement.offsetWidth || undefined;
    const containerHeight = this.el.nativeElement.offsetHeight || undefined;
    this._options.chart.width = containerWidth;
    this._options.chart.height = containerHeight;
  }

  private renderChart() {
    this.ngZone.runOutsideAngular(() => {
      if (this.chart && !this._shouldRedraw) {
        this.chart.update(this._options, true);
      } else {
        this.recreateChart();
      }
    });
  }

  private recreateChart() {
    if (this.chart) {
      this.chart.destroy();
    }

    try {
      this.chart = Highcharts.chart(this.el.nativeElement, this._options);
      this._shouldRedraw = false;
    } catch (chartError) {
      console.error(
        '[HIGHCHARTS PIE] Erreur lors de la création du graphique:',
        chartError
      );
    }
  }
}
