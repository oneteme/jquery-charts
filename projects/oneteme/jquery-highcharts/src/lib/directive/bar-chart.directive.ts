import { Directive, ElementRef, EventEmitter, inject, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { buildChart, ChartProvider, ChartView, naturalFieldComparator, XaxisType } from '@oneteme/jquery-core';
import * as Highcharts from 'highcharts';
import { ChartCustomEvent, convertToHighchartsSeries, determineXAxisDataType } from './utils';

// Extend the Highcharts.Chart interface to include our custom properties
declare module 'highcharts' {
  interface Chart {
    toolbarContainer?: Highcharts.SVGElement;
    customEvent?: {
      click: (event: ChartCustomEvent) => void;
    };
  }

  interface Options {
    customOptions?: {
      canPivot?: boolean;
      [key: string]: any;
    };
  }
}

@Directive({
  standalone: true,
  selector: '[highcharts-bar-chart]',
})
export class BarChartDirective<X extends XaxisType>
  implements ChartView<X, number>, OnChanges, OnDestroy
{
  private readonly el: ElementRef = inject(ElementRef);
  private readonly ngZone = inject(NgZone);
  private chart: Highcharts.Chart | null = null;
  private _chartConfig: ChartProvider<X, number>;
  private _options: Highcharts.Options;
  private _canPivot: boolean = true;
  private _shouldRedraw: boolean = false;

  @Input() debug: boolean = true; // Activons le debug par défaut pour voir ce qui se passe
  @Input({ required: true }) type: 'bar' | 'column' | 'funnel' | 'pyramid';
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
  set config(config: ChartProvider<X, number>) {
    this._chartConfig = config;
    this._options = this.updateCommonOptions(this._options || this.initCommonChartOptions(), config);
    this.configureTypeSpecificOptions();
  }

  constructor() {
    this._options = this.initCommonChartOptions();
    this.configureTypeSpecificOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.debug && console.log(new Date().getMilliseconds(), '[HIGHCHARTS BAR] Détection de changements dans bar-chart', changes);

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
        type: 'column' as const,
        events: {},
        zooming: {
          type: 'x',
          // On désactive explicitement le zooming avec les options correctes
          mouseWheel: false,
          pinchType: undefined
        }
      },
      title: {
        text: undefined
      },
      credits: {
        enabled: false
      },
      series: [],
      legend: {
        enabled: true
      },
      xAxis: {
        type: 'category' as const
      },
      yAxis: {
        title: {
          text: ''
        }
      },
      plotOptions: {
        series: {
          stacking: undefined
        }
      }
    };
  }

  /**
   * Met à jour les options communes du graphique en fonction de la configuration fournie
   */
  private updateCommonOptions(
    options: Highcharts.Options,
    config: ChartProvider<X, number>
  ): Highcharts.Options {

    if (!options.chart) options.chart = {};
    if (!options.plotOptions) options.plotOptions = {};
    if (!options.plotOptions.series) options.plotOptions.series = {};

    // Configurer le stacking correctement pour Highcharts
    if (config.stacked) {
      // Pour Highcharts, on doit définir le stacking sur les plotOptions du type spécifique
      if (!options.plotOptions.column) options.plotOptions.column = {};
      if (!options.plotOptions.bar) options.plotOptions.bar = {};

      // Appliquer le stacking normal à tous les types de graphiques de barres
      (options.plotOptions.column as any).stacking = 'normal';
      (options.plotOptions.bar as any).stacking = 'normal';

      // On peut aussi le définir au niveau des séries pour s'assurer qu'il est appliqué
      options.plotOptions.series.stacking = 'normal';
    } else {
      // S'assurer que stacking est désactivé si nécessaire
      if (options.plotOptions.column) (options.plotOptions.column as any).stacking = undefined;
      if (options.plotOptions.bar) (options.plotOptions.bar as any).stacking = undefined;
      options.plotOptions.series.stacking = undefined;
    }

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
      const xAxis = Array.isArray(options.xAxis) ? options.xAxis[0] : options.xAxis;
      if (!xAxis.title) xAxis.title = {};
      xAxis.title.text = config.xtitle || undefined;

      // Réassigner xAxis (maintenant qu'on est sûr qu'il a un title)
      options.xAxis = xAxis;
    }

    // Gestion sûre des YAxis
    if (!options.yAxis) {
      options.yAxis = { title: { text: config.ytitle || undefined } };
    } else {
      // S'assurer que yAxis est un objet et non un tableau
      const yAxis = Array.isArray(options.yAxis) ? options.yAxis[0] : options.yAxis;
      if (!yAxis.title) yAxis.title = {};
      yAxis.title.text = config.ytitle || undefined;

      // Réassigner yAxis (maintenant qu'on est sûr qu'il a un title)
      options.yAxis = yAxis;
    }


    // Appliquer les options personnalisées de l'utilisateur
    if (config.options) {
      // Fusion deep des options utilisateur
      for (const key in config.options) {
        if (typeof config.options[key] === 'object' && config.options[key] !== null) {
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
    if (!this._options || !this.type) {
      console.warn('[HIGHCHARTS BAR] Options ou type non définis');
      return;
    }

    // Configuration spécifique au type
    if (!this._options.chart) this._options.chart = {};
    if (!this._options.plotOptions) this._options.plotOptions = {};
    if (!this._options.plotOptions.bar) (this._options.plotOptions as any).bar = {};
    if (!this._options.plotOptions.column) (this._options.plotOptions as any).column = {};

    if (this.type === 'bar') {
      this._options.chart.type = 'bar';
      // Configurer les barres horizontales
      (this._options.plotOptions as any).bar.horizontal = true;
    } else if (this.type === 'column') {
      this._options.chart.type = 'column';
      // Configurer les barres verticales
      (this._options.plotOptions as any).bar.horizontal = false;
    } else if (this.type === 'funnel') {
      console.log('[HIGHCHARTS BAR] Configuration pour type funnel');
      // Highcharts nécessite l'importation du module funnel
      this._options.chart.type = 'funnel';
    } else if (this.type === 'pyramid') {
      console.log('[HIGHCHARTS BAR] Configuration pour type pyramid');
      // Highcharts nécessite l'importation du module funnel
      this._options.chart.type = 'pyramid';
    }
    this._shouldRedraw = true;
  }

  private updateChart() {
    if (!this.data || !this._chartConfig) {
      console.warn('[HIGHCHARTS BAR] Données ou configuration manquantes');
      return;
    }

    try {
      // Construction des données au format CommonChart
      let sortedData = [...this.data];
      if (this.type === 'funnel') {
        // Logique de tri pour funnel
      } else if (this.type === 'pyramid') {
        // Logique de tri pour pyramid
      }
      const commonChart = buildChart(sortedData, {
        ...this._chartConfig,
        pivot: !this.canPivot ? false : this._chartConfig.pivot,
      });

      this._options.series = convertToHighchartsSeries(commonChart as any);

      // Ajout des catégories
      if (commonChart.categories?.length) {
        // S'assurer que xAxis est un objet pour pouvoir ajouter des catégories
        if (!this._options.xAxis) {
          this._options.xAxis = { categories: [] };
        }

        const xAxis = Array.isArray(this._options.xAxis) ? this._options.xAxis[0] : this._options.xAxis;
        xAxis.categories = commonChart.categories.map(c => c?.toString() || '');
        xAxis.type = 'category';

        // Réassigner xAxis avec les catégories
        this._options.xAxis = xAxis;
      } else {
        console.warn('[HIGHCHARTS BAR] Pas de catégories trouvées');
      }

      if (commonChart.series?.length && commonChart.series[0].data?.length) {
        const firstDataPoint = commonChart.series[0].data[0];

        if (typeof firstDataPoint === 'object' && firstDataPoint !== null && 'x' in firstDataPoint) {
          const x = (firstDataPoint as any).x;
          const xType = determineXAxisDataType(x);

          // S'assurer que xAxis est un objet pour pouvoir définir son type
          const xAxis = Array.isArray(this._options.xAxis) ? this._options.xAxis[0] : this._options.xAxis;
          xAxis.type = (xType === 'numeric' ? 'linear' : xType) as Highcharts.AxisTypeValue;

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
        if (this.chart) {
          // Mise à jour du graphique existant
          this.chart.update(this._options, true);
        } else {
          // Création d'un nouveau graphique
          try {
            this.chart = Highcharts.chart(
              this.el.nativeElement,
              this._options
            );
          } catch (chartError) {
            console.error('[HIGHCHARTS BAR] Erreur lors de la création du graphique:', chartError);
          }
        }
      });

      this.debug && console.log(new Date().getMilliseconds(), '[HIGHCHARTS BAR] Graphique mis à jour avec', this._options);

    } catch (error) {
      console.error('[HIGHCHARTS BAR] Erreur lors de la mise à jour du graphique:', error);
    }
  }
}
