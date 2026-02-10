import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  AfterViewInit,
  Output,
  SimpleChanges,
  HostBinding,
} from '@angular/core';
import {
  ChartProvider,
  ChartType,
  XaxisType,
  YaxisType,
  buildChart,
} from '@oneteme/jquery-core';
import {
  Highcharts,
  sanitizeChartDimensions,
  ChartCustomEvent,
  setupToolbar,
  updateChartLoadingState,
  configureLoadingOptions,
  transformDataForSimpleChart,
  unifyPlotOptionsForChart,
  applyChartConfigurations,
  enforceCriticalOptions,
  transformChartData,
  needsDataConversion,
  detectPreviousChartType,
  validateChartData,
  showValidationError,
  hideValidationError,
  buildMapUrl,
  loadGeoJSON,
  extractCodeToNameMapping,
  replaceCodesWithNames,
  createMapTooltipFormatter,
  createSimpleMapTooltipFormatter,
  DEFAULT_MAP_JOINBY,
  buildMapSeries,
  applyAxisOffsets,
  applyDonutCenterLogic,
  applyRadialBarLogic,
} from './utils';

@Directive({
  selector: '[chart-directive]',
  standalone: true,
})
export class ChartDirective<X extends XaxisType, Y extends YaxisType>
  implements OnChanges, OnDestroy, AfterViewInit
{
  @Input({ required: true }) type!: ChartType;
  @Input({ required: true }) config!: ChartProvider<X, Y>;
  @Input({ required: true }) data!: any[];
  @Input() possibleTypes?: ChartType[];
  @Input() debug: boolean = false;
  @Input() canPivot: boolean = false;
  @Output() customEvent = new EventEmitter<ChartCustomEvent>();

  @HostBinding('style.width') width = '100%';
  @HostBinding('style.height') height = '100%';
  @HostBinding('style.display') display = 'block';
  @HostBinding('style.overflow') overflow = 'hidden';

  private chart: Highcharts.Chart | null = null;
  private _isLoading: boolean = false;
  private dataValidationError: { title: string; message: string } | null = null;
  private loadedMapData: any = null;
  private mapCodeToName: Map<string, string> = new Map();
  private resizeObserver: ResizeObserver | null = null;

  @Input()
  set isLoading(isLoading: boolean) {
    if (this._isLoading === isLoading) return;
    this._isLoading = isLoading;
    this.updateLoadingState();
  }

  get isLoading(): boolean {
    return this._isLoading;
  }

  constructor(private elementRef: ElementRef) {}

  private updateLoadingState(): void {
    if (!this.chart) return;
    const hasData = Array.isArray(this.data) && this.data.length > 0;
    updateChartLoadingState(
      this.chart,
      this._isLoading,
      hasData,
      !!this.dataValidationError,
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

  ngOnDestroy(): void {
    this.destroyChart();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  ngAfterViewInit(): void {
    if (this.elementRef.nativeElement) {
      this.resizeObserver = new ResizeObserver((entries) => {
        if (this.chart && entries[0]) {
          const { width, height } = entries[0].contentRect;
          if (width > 0 && height > 0) {
            this.chart.setSize(width, height, false);
          }
        }
      });
      this.resizeObserver.observe(this.elementRef.nativeElement);
    }
  }

  private updateChart(): void {
    if (!this.config || !this.data) {
      this.debug && console.log('Configuration ou données manquantes');
      return;
    }

    const hasData = Array.isArray(this.data) && this.data.length > 0;
    if (this.type === 'map' && this._isLoading && !hasData) {
      this.debug && console.log('[chart] map isLoading sans données');
      if (this.chart) {
        updateChartLoadingState(this.chart, true, false, false);
        return;
      }
      this.createLoadingChart();
      return;
    }

    this.destroyChart();

    if (this.type === 'map' && !this.config.mapEndpoint) {
      this.loadedMapData = null;
      this.mapCodeToName = new Map();
    }

    if (this.type === 'map' && this.config.mapEndpoint) {
      this.createMapChartAsync();
    } else {
      this.createChart();
    }
  }

  private async createMapChartAsync(): Promise<void> {
    try {
      const mapUrl = buildMapUrl(
        this.config.mapEndpoint!,
        this.config.mapParam,
        this.config.mapDefaultValue,
      );

      this.loadedMapData = await loadGeoJSON(mapUrl);
      this.mapCodeToName = extractCodeToNameMapping(this.loadedMapData);

      this.createChart();
    } catch (error) {
      console.error('Erreur lors du chargement de la carte:', error);
      this.dataValidationError = {
        title: 'Erreur de chargement',
        message: 'Impossible de charger la carte géographique',
      };
      this.createChart(); // créer le chart meme si error pour l'afficher
    }
  }

  private createLoadingChart(): void {
    try {
      const element = this.elementRef.nativeElement;
      if (!element) return;

      const options: Highcharts.Options = {
        chart: {
          backgroundColor: 'transparent',
        },
        title: { text: '' },
        credits: { enabled: false },
        exporting: { enabled: false },
        series: [],
      };

      configureLoadingOptions(options);

      this.chart = Highcharts.chart(element, options);

      if (this.chart) {
        const { width, height } = element.getBoundingClientRect();
        if (width > 0 && height > 0) {
          this.chart.setSize(width, height, false);
        }
      }

      updateChartLoadingState(this.chart, true, false, false);

      this.debug && console.log('[chart] Loading chart créé pour map');
    } catch (error) {
      console.error('Erreur lors de la création du loading chart:', error);
    }
  }

  private async createChart(): Promise<void> {
    try {
      const element = this.elementRef.nativeElement;
      if (!element) {
        this.debug && console.log('Element not available');
        return;
      }

      const options = await this.buildChartOptions();
      sanitizeChartDimensions(options, this.config);

      if (this.type === 'map') {
        this.chart = (Highcharts as any).mapChart(element, options);
      } else {
        this.chart = Highcharts.chart(element, options);
      }

      // Force un premier redimensionnement si nécessaire
      if (this.chart) {
        const { width, height } = element.getBoundingClientRect();
        if (width > 0 && height > 0) {
          this.chart.setSize(width, height, false);
        }
      }

      if (this.dataValidationError) {
        showValidationError(this.chart, this.dataValidationError.message);
      } else {
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
        !!this.dataValidationError,
      );

      this.debug && console.log('Graphique créé:', this.type);
    } catch (error) {
      console.error('Erreur lors de la création du graphique:', error);
    }
  }

  private async buildChartOptions(): Promise<Highcharts.Options> {
    // Pour les maps, pas utiliser processData() car transforme les données en tableaux
    // Les maps ont besoin des données au format objet {code, value}
    let chartData: { series: any[]; xAxis?: any; yAxis?: any; tooltip?: any };

    if (this.type === 'map') {
      // Pour les maps, construire les séries en préservant le format objet
      const userSeriesOptions = this.config.options?.series || [];
      const defaultJoinBy = this.config.mapJoinBy || DEFAULT_MAP_JOINBY;

      chartData = {
        series: buildMapSeries(
          this.data,
          this.config.series,
          userSeriesOptions,
          defaultJoinBy,
        ),
      };
    } else {
      const tempSeries = [{ data: this.data }];
      if (needsDataConversion(tempSeries, this.type)) {
        const previousType = detectPreviousChartType(tempSeries, this.type);
        if (
          previousType === 'map' &&
          this.mapCodeToName.size === 0 &&
          this.config.mapEndpoint
        ) {
          const mapUrl = buildMapUrl(
            this.config.mapEndpoint,
            this.config.mapParam,
            this.config.mapDefaultValue,
          );
          try {
            this.loadedMapData = await loadGeoJSON(mapUrl);
            this.mapCodeToName = extractCodeToNameMapping(this.loadedMapData);
          } catch (error) {
            console.error(
              'Erreur lors du chargement du mapping GeoJSON:',
              error,
            );
          }
        }
        const result = transformChartData(
          tempSeries,
          previousType,
          this.type,
          undefined,
        );
        const finalCategories =
          result.categories && this.mapCodeToName.size > 0
            ? replaceCodesWithNames(result.categories, this.mapCodeToName)
            : result.categories;

        if (this.isSimpleChart() && finalCategories && result.series[0]?.data) {
          const formattedData = result.series[0].data.map(
            (value: any, index: number) => ({
              name: finalCategories[index] || `Item ${index + 1}`,
              y: typeof value === 'number' ? value : value.y || value,
            }),
          );

          chartData = {
            series: [
              {
                name: this.config.title || 'Données',
                data: formattedData,
              },
            ],
          } as any;
          if (this.mapCodeToName.size > 0) {
            chartData.tooltip = createSimpleMapTooltipFormatter();
          }
        } else {
          chartData = {
            series: result.series,
            xAxis: finalCategories
              ? {
                  categories: finalCategories,
                  title: { text: this.config.xtitle || '' },
                }
              : { title: { text: this.config.xtitle || '' } },
            yAxis: result.yCategories
              ? {
                  categories: result.yCategories,
                  title: { text: this.config.ytitle || '' },
                }
              : { title: { text: this.config.ytitle || '' } },
          } as any;

          // Ajouter le tooltip personnalisé si mapping disponible
          if (this.mapCodeToName.size > 0) {
            chartData.tooltip = createMapTooltipFormatter();
          }
        }
      } else {
        chartData = this.processData();
      }
    }

    const baseOptions: Highcharts.Options = {
      chart: {
        type: this.getHighchartsType(),
        backgroundColor: 'transparent',
      },
      title: { text: this.config.title || '' },
      subtitle: { text: this.config.subtitle || '' },
      credits: { enabled: false },
      exporting: { enabled: false },
      series: chartData.series,
    };

    // Ajouter xAxis et yAxis seulement s'ils existent (pas pour pie, donut, etc.)
    if (chartData.xAxis) {
      baseOptions.xAxis = chartData.xAxis;
    }
    if (chartData.yAxis) {
      baseOptions.yAxis = chartData.yAxis;
    }
    if ((chartData as any).tooltip) {
      baseOptions.tooltip = (chartData as any).tooltip;
    }

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
    applyChartConfigurations(baseOptions, this.type, this.config);

    // donut ? config spé
    if (this.type === 'donut') {
      baseOptions.plotOptions = {
        pie: {
          innerSize: '70%',
          dataLabels: { enabled: false },
          showInLegend: true,
        },
      };
    }

    if (this.type === 'pie') {
      baseOptions.plotOptions = {
        pie: {
          dataLabels: { enabled: false },
          showInLegend: true,
        },
      };
    }

    let finalOptions = baseOptions;
    if (this.config.options) {
      const { series: _, ...optionsWithoutSeries } = this.config.options;
      finalOptions = Highcharts.merge(baseOptions, optionsWithoutSeries);
      finalOptions.series = baseOptions.series;
    }

    if (
      (this.type === 'donut' || this.type === 'pie') &&
      this.config.options?.donutCenter
    ) {
      applyDonutCenterLogic(finalOptions, this.config.options.donutCenter);
    }

    if (this.type === 'radialBar' && this.config.options?.radialBar) {
      applyRadialBarLogic(finalOptions, this.config.options.radialBar);
    }

    const hasCustomMap = !!(this.config.options as any)?.chart?.map;
    if (this.type === 'map' && this.loadedMapData && !hasCustomMap) {
      if (!finalOptions.chart) {
        finalOptions.chart = {};
      }
      (finalOptions.chart as any).map = this.loadedMapData;
      this.debug && console.log('GeoJSON injecté dans les options du chart');
    }

    unifyPlotOptionsForChart(finalOptions, this.type, this.debug);

    enforceCriticalOptions(finalOptions, this.type);

    applyAxisOffsets(finalOptions);

    configureLoadingOptions(finalOptions);

    const originalRender = finalOptions.chart?.events?.render;
    const self = this;

    if (!finalOptions.chart) finalOptions.chart = {};
    if (!finalOptions.chart.events) finalOptions.chart.events = {};

    finalOptions.chart.events.render = function (this: Highcharts.Chart) {
      if (originalRender) {
        originalRender.apply(this, arguments as any);
      }

      const hasData = Array.isArray(self.data) && self.data.length > 0;
      if (self.isLoading && !hasData) {
        const chart = this as any;
        if (chart.customLabel) chart.customLabel.hide();
        if (chart.customTotalLabel) chart.customTotalLabel.hide();
        if (chart.seriesGroup) chart.seriesGroup.hide();
        if (chart.subtitleGroup) chart.subtitleGroup.hide();
      }
    };

    return finalOptions;
  }

  private processData(): { series: any[]; xAxis?: any; yAxis?: any } {
    this.dataValidationError = null;

    if (this.isSimpleChart()) {
      return this.processSimpleChart();
    } else {
      return this.processComplexChart();
    }
  }

  private processSimpleChart(): { series: any[] } {
    const tempSeries = [{ data: this.data }];
    let dataToUse = this.data;
    if (needsDataConversion(tempSeries, this.type)) {
      const previousType = detectPreviousChartType(tempSeries, this.type);
      const result = transformChartData(
        tempSeries,
        previousType,
        this.type,
        undefined,
      );
      if (result.series && result.series[0]?.data) {
        if (result.categories && this.mapCodeToName.size > 0) {
          const categories = replaceCodesWithNames(
            result.categories,
            this.mapCodeToName,
          );
          dataToUse = result.series[0].data.map(
            (value: any, index: number) => ({
              name: categories[index] || `Item ${index + 1}`,
              y: typeof value === 'number' ? value : value.y || value,
            }),
          );
          this.debug &&
            console.log(
              '[Simple Chart - Map Transform] Données avec noms:',
              dataToUse.slice(0, 3),
            );
        } else {
          dataToUse = result.series[0].data;
        }
      }
    }
    const chartConfig = { ...this.config, continue: false };

    if (dataToUse !== this.data && dataToUse[0]?.name && dataToUse[0]?.y) {
      return {
        series: [
          {
            name: this.config.title || 'Données',
            data: dataToUse,
          },
        ],
      };
    }

    const complexChart = buildChart(dataToUse, chartConfig, null);

    if (complexChart.series && complexChart.series.length > 1) {
      const aggregatedData = transformDataForSimpleChart(
        {
          series: complexChart.series,
          xAxis: { categories: complexChart.categories },
        },
        this.config,
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
      if (typeof value === 'object' && value !== null) {
        return {
          name: categories[value.x] || categories[index] || `Item ${index + 1}`,
          y: value.y !== undefined ? value.y : value,
        };
      }
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
    let categories = commonChart.categories || [];

    let series = commonChart.series || [];
    let yCategories: string[] | undefined;

    const validation = validateChartData(series, this.type);

    if (!validation.isValid) {
      if (validation.isNoData) {
        this.dataValidationError = null;
      } else {
        this.dataValidationError = {
          title: validation.errorTitle || 'Erreur',
          message: validation.errorMessage || 'Données incompatibles',
        };
      }

      return {
        series: [],
        xAxis: {
          categories: [],
          title: { text: this.config.xtitle || '' },
        },
      };
    }

    this.dataValidationError = null;
    if (needsDataConversion(series, this.type)) {
      const previousType = detectPreviousChartType(series, this.type);
      const result = transformChartData(
        series,
        previousType,
        this.type,
        categories,
      );
      series = result.series;
      yCategories = result.yCategories;
      if (result.categories && result.categories.length > 0) {
        categories = result.categories as any;
      }
    } else {
      const result = transformChartData(
        series,
        this.type,
        this.type,
        categories,
      );
      series = result.series;
      yCategories = result.yCategories;
      if (result.categories && result.categories.length > 0) {
        categories = result.categories as any;
      }
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
