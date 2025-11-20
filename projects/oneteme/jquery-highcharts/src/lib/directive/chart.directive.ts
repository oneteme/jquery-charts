import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
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
} from './utils';

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
  private loadedMapData: any = null; // cache pour le geojson chargé
  private mapCodeToName: Map<string, string> = new Map(); // mapping code région → nom

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

  ngOnDestroy(): void {
    this.destroyChart();
  }

  private updateChart(): void {
    if (!this.config || !this.data) {
      this.debug && console.log('Configuration ou données manquantes');
      return;
    }

    this.destroyChart();

    // Si c'est une map avec mapEndpoint, charger le GeoJSON de manière asynchrone
    if (this.type === 'map' && this.config.mapEndpoint) {
      this.createMapChartAsync();
    } else {
      // Même pour les types non-map, il faut attendre si les données sont au format map
      this.createChart();
    }
  }

  private async createMapChartAsync(): Promise<void> {
    try {
      const mapUrl = buildMapUrl(
        this.config.mapEndpoint!,
        this.config.mapParam,
        this.config.mapDefaultValue
      );

      this.loadedMapData = await loadGeoJSON(mapUrl);
      // Extraire le mapping code → nom depuis le GeoJSON
      this.mapCodeToName = extractCodeToNameMapping(this.loadedMapData);

      // créer le chart avec les données chargées
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

  private async createChart(): Promise<void> {
    try {
      const element = this.elementRef.nativeElement;
      if (!element) {
        this.debug && console.log('Element not available');
        return;
      }

      const options = await this.buildChartOptions();
      sanitizeChartDimensions(options, this.config, element, this.debug);

      if (this.type === 'map') {
        this.chart = (Highcharts as any).mapChart(element, options);
      } else {
        this.chart = Highcharts.chart(element, options);
      }

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

  private async buildChartOptions(): Promise<Highcharts.Options> {
    // Pour les maps, ne pas utiliser processData() qui transforme les données en tableaux
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
          defaultJoinBy
        ),
      };
    } else {
      // Vérifier si les données brutes sont au format map et les convertir AVANT processData()
      const tempSeries = [{ data: this.data }];
      if (needsDataConversion(tempSeries, this.type)) {
        const previousType = detectPreviousChartType(tempSeries, this.type);
        console.log('🔍 Détection type précédent:', {
          previousType,
          mapCodeToNameSize: this.mapCodeToName.size,
          hasMapEndpoint: !!this.config.mapEndpoint
        });
        
        // Si les données sont au format map et qu'on n'a pas encore chargé le GeoJSON, le charger maintenant
        if (previousType === 'map' && this.mapCodeToName.size === 0 && this.config.mapEndpoint) {
          console.log('🌍 Chargement du GeoJSON pour mapping code→nom...');
          const mapUrl = buildMapUrl(
            this.config.mapEndpoint,
            this.config.mapParam,
            this.config.mapDefaultValue
          );
          try {
            this.loadedMapData = await loadGeoJSON(mapUrl);
            this.mapCodeToName = extractCodeToNameMapping(this.loadedMapData);
            console.log(`✅ Mapping chargé: ${this.mapCodeToName.size} entrées`);
          } catch (error) {
            console.error('Erreur lors du chargement du mapping GeoJSON:', error);
          }
        }
        
        const result = transformChartData(
          tempSeries,
          previousType,
          this.type,
          undefined
        );
        
        // Remplacer les codes par les noms si on a le mapping
        const finalCategories = result.categories && this.mapCodeToName.size > 0
          ? replaceCodesWithNames(result.categories, this.mapCodeToName)
          : result.categories;
        
        // Pour les graphiques simples (pie, donut, funnel), créer directement les séries au bon format
        if (this.isSimpleChart() && finalCategories && result.series[0]?.data) {
          const formattedData = result.series[0].data.map((value: any, index: number) => ({
            name: finalCategories[index] || `Item ${index + 1}`,
            y: typeof value === 'number' ? value : value.y || value
          }));
          
          chartData = {
            series: [
              {
                name: this.config.title || 'Données',
                data: formattedData,
              },
            ],
          } as any;
          
          // Ajouter le tooltip personnalisé pour les graphiques simples
          if (this.mapCodeToName.size > 0) {
            chartData.tooltip = createSimpleMapTooltipFormatter();
          }
        } else {
          // Pour les graphiques complexes (bar, line, etc.)
          chartData = {
            series: result.series,
            xAxis: finalCategories ? { 
              categories: finalCategories,
              title: { text: this.config.xtitle || '' }
            } : { title: { text: this.config.xtitle || '' } },
            yAxis: result.yCategories ? { 
              categories: result.yCategories,
              title: { text: this.config.ytitle || '' }
            } : { 
              title: { text: this.config.ytitle || '' } 
            },
          } as any;
          
          // Ajouter le tooltip personnalisé si mapping disponible
          if (this.mapCodeToName.size > 0) {
            chartData.tooltip = createMapTooltipFormatter();
            this.debug && console.log('✅ Tooltip ajouté avec mapping:', this.mapCodeToName.size, 'entrées');
          } else {
            this.debug && console.log('⚠️ Pas de mapping disponible pour le tooltip');
          }
        }
      } else {
        chartData = this.processData();
      }
    }

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
      // Toujours exclure les séries du merge pour préserver les données transformées
      const { series: _, ...optionsWithoutSeries } = this.config.options;
      finalOptions = Highcharts.merge(baseOptions, optionsWithoutSeries);
      // Toujours utiliser les séries de baseOptions (qui contiennent les données)
      finalOptions.series = baseOptions.series;
    }

    if (this.type === 'map' && this.loadedMapData) {
      if (!finalOptions.chart) {
        finalOptions.chart = {};
      }
      (finalOptions.chart as any).map = this.loadedMapData;
      this.debug && console.log('GeoJSON injecté dans les options du chart');
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
    // Vérifier si les données sont au format map et les convertir
    const tempSeries = [{ data: this.data }];
    let dataToUse = this.data;
    
    if (needsDataConversion(tempSeries, this.type)) {
      const previousType = detectPreviousChartType(tempSeries, this.type);
      const result = transformChartData(
        tempSeries,
        previousType,
        this.type,
        undefined
      );
      
      // Extraire les données transformées
      if (result.series && result.series[0]?.data) {
        // Pour les graphiques simples issus de map, créer des objets {name, y}
        if (result.categories && this.mapCodeToName.size > 0) {
          const categories = replaceCodesWithNames(result.categories, this.mapCodeToName);
          dataToUse = result.series[0].data.map((value: any, index: number) => ({
            name: categories[index] || `Item ${index + 1}`,
            y: typeof value === 'number' ? value : value.y || value
          }));
          this.debug && console.log('[Simple Chart - Map Transform] Données avec noms:', dataToUse.slice(0, 3));
        } else {
          dataToUse = result.series[0].data;
        }
      }
    }
    
    const chartConfig = { ...this.config, continue: false };

    // Pour les graphiques simples, ne pas passer par buildChart si on a déjà des données formatées
    if (dataToUse !== this.data && dataToUse[0]?.name && dataToUse[0]?.y) {
      // Données déjà formatées depuis la transformation map
      return {
        series: [
          {
            name: this.config.title || 'Données',
            data: dataToUse,
          },
        ],
      };
    }

    // D'abord essayer de construire un graph complexe pour détecter le multi-séries
    const complexChart = buildChart(dataToUse, chartConfig, null);

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
    let categories = commonChart.categories || [];

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
    this.dataValidationError = null;
    
    // Si les données sont dans un format spécial non compatible avec le type cible, reconvertir
    if (needsDataConversion(series, this.type)) {
      const previousType = detectPreviousChartType(series, this.type);
      const result = transformChartData(
        series,
        previousType,
        this.type,
        categories
      );
      series = result.series;
      yCategories = result.yCategories;
      // Utiliser les catégories extraites si disponibles
      if (result.categories && result.categories.length > 0) {
        categories = result.categories as any;
      }
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
      // Utiliser les catégories extraites si disponibles
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
