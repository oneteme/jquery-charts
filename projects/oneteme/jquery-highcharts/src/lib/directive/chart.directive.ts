import { Directive, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { ChartProvider, ChartType, XaxisType, YaxisType, buildChart } from '@oneteme/jquery-core';
import { Highcharts, sanitizeChartDimensions, ChartCustomEvent, setupToolbar, updateChartLoadingState, configureLoadingOptions, transformDataForSimpleChart, unifyPlotOptionsForChart, applyChartConfigurations, enforceCriticalOptions, transformChartData, needsDataConversion, detectPreviousChartType, validateChartData, showValidationError, hideValidationError } from './utils';

@Directive({
  selector: '[chart-directive]',
  standalone: true,
})
export class ChartDirective<X extends XaxisType, Y extends YaxisType>
  implements OnChanges, OnDestroy
{
  @Input({ required: true }) type!: ChartType;
  @Input({ required: true }) config!: ChartProvider<X, Y>;
  @Input({ required: true }) data!: any[];
  @Input() possibleTypes?: ChartType[];
  @Input() debug: boolean = false;
  @Input() canPivot: boolean = false;
  @Output() customEvent = new EventEmitter<ChartCustomEvent>();

  private chart: Highcharts.Chart | null = null;
  private _isLoading: boolean = false;
  private dataValidationError: { title: string; message: string } | null = null;

  @Input()
  set isLoading(isLoading: boolean) {
    if (this._isLoading === isLoading) return;
    this._isLoading = isLoading;
    this.updateLoadingState();
  }

  get isLoading(): boolean { return this._isLoading }

  constructor(private elementRef: ElementRef) {}

  private updateLoadingState(): void {
    if (!this.chart) return;
    const hasData = Array.isArray(this.data) && this.data.length > 0;
    updateChartLoadingState(
      this.chart,
      this._isLoading,
      hasData,
      !!this.dataValidationError
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] || changes['data'] || changes['type']) {
      this.updateChart();
    }
    if (changes['isLoading'] && !changes['isLoading'].firstChange) {
      this.updateLoadingState();
    }
  }

  ngOnDestroy(): void { this.destroyChart() }

  private updateChart(): void {
    if (!this.config || !this.data) {
      this.debug && console.log('Configuration ou données manquantes');
      return;
    }
    this.destroyChart();
    this.createChart();
  }

  private createChart(): void {
    try {
      const element = this.elementRef.nativeElement;
      if (!element) {
        this.debug && console.log('Element not available');
        return;
      }

      const options = this.buildChartOptions();
      sanitizeChartDimensions(options, this.config, element, this.debug);

      this.chart = Highcharts.chart(element, options);

      // Si nous avons une erreur de validation, afficher le message d'erreur
      if (this.dataValidationError) {
        showValidationError(this.chart, this.dataValidationError.message);
      } else {
        // Masquer le message d'erreur pour les graphiques valides
        hideValidationError(this.chart);
      }

      if (this.config.showToolbar && this.chart) {
        setupToolbar({
          chart: this.chart,
          config: this.config,
          customEvent: this.customEvent,
          canPivot: this.canPivot,
          debug: this.debug,
        });
      }

      const hasData = this.data && this.data.length > 0;
      updateChartLoadingState(
        this.chart,
        this._isLoading,
        hasData,
        !!this.dataValidationError
      );

      this.debug && console.log('Graphique créé:', this.type);
    } catch (error) {
      console.error('Erreur lors de la création du graphique:', error);
    }
  }

  private buildChartOptions(): Highcharts.Options {
    const chartData = this.processData();

    const baseOptions: Highcharts.Options = {
      chart: {
        type: this.getHighchartsType(),
        height: this.config.height || undefined,
        width: this.config.width || undefined,
        backgroundColor: 'transparent',
      },
      title: { text: this.config.title || '' },
      subtitle: { text: this.config.subtitle || '' },
      credits: { enabled: false },
      exporting: { enabled: false },
      series: chartData.series,
      xAxis: chartData.xAxis,
      yAxis: chartData.yAxis || {
        title: { text: this.config.ytitle || '' },
      },
    };

    // Définir le message d'erreur uniquement s'il y a une erreur de validation
    if (this.dataValidationError) {
      baseOptions.lang = {
        noData: this.dataValidationError.message,
      };
      baseOptions.noData = {
        style: {
          fontWeight: 'normal',
          fontSize: '14px',
          color: '#666',
        },
      };
    }

    // Appliquer toutes les configurations spé au type de graph (via registry)
    applyChartConfigurations(baseOptions, this.type);

    // donut ? config spé
    if (this.type === 'donut') {
      baseOptions.plotOptions = {
        pie: {
          innerSize: '40%',
          dataLabels: { enabled: false },
          showInLegend: true,
        },
      };
    }

    // Options spé pour graph pie
    if (this.type === 'pie') {
      baseOptions.plotOptions = {
        pie: {
          dataLabels: { enabled: false },
          showInLegend: true,
        },
      };
    }

    // Merge avec les options perso
    let finalOptions = baseOptions;
    if (this.config.options) {
      finalOptions = Highcharts.merge(baseOptions, this.config.options);
    }

    // Unifier les plotOptions.series pour les graphiques simples (AVANT les options critiques)
    unifyPlotOptionsForChart(finalOptions, this.type, this.debug);

    // Force toutes les configurations critiques après le merge et l'unification (via registry)
    enforceCriticalOptions(finalOptions, this.type);

    // Configurer les options de loading
    configureLoadingOptions(finalOptions);

    return finalOptions;
  }

  private processData(): { series: any[]; xAxis?: any; yAxis?: any } {
    // Réinitialiser l'erreur de validation au début du traitement
    this.dataValidationError = null;

    if (this.isSimpleChart()) {
      return this.processSimpleChart();
    } else {
      return this.processComplexChart();
    }
  }

  private processSimpleChart(): { series: any[] } {
    const chartConfig = { ...this.config, continue: false };

    // D'abord essayer de construire un graph complexe pour détecter le multi-séries
    const complexChart = buildChart(this.data, chartConfig, null);

    // Si plusieurs séries, agréger les données (chaque série = une part du graph simple)
    if (complexChart.series && complexChart.series.length > 1) {
      const aggregatedData = transformDataForSimpleChart(
        {
          series: complexChart.series,
          xAxis: { categories: complexChart.categories },
        },
        this.config
      );
      this.debug &&
        console.log('[Simple Chart - Multi] Données agrégées:', aggregatedData);

      return {
        series: [
          {
            name: this.config.title || 'Total',
            data: aggregatedData,
          },
        ],
      };
    }

    const categories = complexChart.categories || [];
    const serieData = complexChart.series[0]?.data || [];

    const formattedData = serieData.map((value: any, index: number) => {
      // Si la valeur est déjà un objet avec x et y
      if (typeof value === 'object' && value !== null) {
        return {
          name: categories[value.x] || categories[index] || `Item ${index + 1}`,
          y: value.y !== undefined ? value.y : value,
        };
      }
      // Sinon, c'est juste une valeur numérique
      return {
        name: categories[index] || `Item ${index + 1}`,
        y: value,
      };
    });
    this.debug &&
      console.log('[Simple Chart - Single] Données:', {
        categories,
        serieData,
        formattedData,
      });

    return {
      series: [
        {
          name: complexChart.title || 'Données',
          data: formattedData,
        },
      ],
    };
  }

  private processComplexChart(): { series: any[]; xAxis: any; yAxis?: any } {
    const chartConfig = { ...this.config, continue: false };
    const commonChart = buildChart(this.data, chartConfig, null);
    const categories = commonChart.categories || [];

    // Transformer les données selon le type de graphique (via registry intelligent)
    let series = commonChart.series || [];
    let yCategories: string[] | undefined;

    // Valider que les données sont compatibles avec le type de graphique
    const validation = validateChartData(series, this.type);

    if (!validation.isValid) {
      // Si c'est juste qu'il n'y a pas de données (pas une incompatibilité)
      if (validation.isNoData) {
        // Ne pas stocker d'erreur de validation, juste retourner des séries vides
        // Le système de loading gérera l'affichage de "Aucune donnée"
        this.dataValidationError = null;
      } else {
        // Erreur de compatibilité : stocker l'erreur pour l'afficher
        this.dataValidationError = {
          title: validation.errorTitle || 'Erreur',
          message: validation.errorMessage || 'Données incompatibles',
        };
      }

      // Retourner un état qui déclenchera l'affichage du message approprié
      return {
        series: [],
        xAxis: {
          categories: [],
          title: { text: this.config.xtitle || '' },
        },
      };
    }

    // Réinitialiser l'erreur si les données sont valides
    this.dataValidationError = null; // Si les données sont dans un format spécial non compatible avec le type cible, reconvertir
    if (needsDataConversion(series, this.type)) {
      // Le registry va automatiquement détecter le format source et le convertir
      const previousType = detectPreviousChartType(series, this.type);
      const result = transformChartData(
        series,
        previousType,
        this.type,
        categories
      );
      series = result.series;
      yCategories = result.yCategories;
    } else {
      // Appliquer la transformation vers le type cible
      const result = transformChartData(
        series,
        this.type,
        this.type,
        categories
      );
      series = result.series;
      yCategories = result.yCategories;
    }

    return {
      series: series,
      xAxis: {
        categories: categories,
        title: { text: this.config.xtitle || '' },
      },
      yAxis: yCategories
        ? {
            categories: yCategories,
            title: { text: this.config.ytitle || '' },
          }
        : undefined,
    };
  }

  private isSimpleChart(): boolean {
    return ['pie', 'donut', 'funnel', 'pyramid'].includes(this.type);
  }

  private getHighchartsType(): string {
    const typeMapping: { [key: string]: string } = {
      donut: 'pie',
      columnpyramid: 'column',
      polar: 'column',
      radar: 'line',
      radarArea: 'area',
      radialBar: 'column',
    };
    return typeMapping[this.type] || this.type;
  }

  private destroyChart(): void {
    if (this.chart) {
      try {
        this.chart.destroy();
        this.debug && console.log('Graphique détruit');
      } catch (error) {
        console.error('Erreur lors de la destruction:', error);
      } finally {
        this.chart = null;
      }
    }
  }
}
