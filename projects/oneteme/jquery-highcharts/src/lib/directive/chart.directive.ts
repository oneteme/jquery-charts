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
  ChartGroupSyncEvent,
  ChartType,
  XaxisType,
  YaxisType,
  ChartClickEvent,
  ChartExportImageType,
  ChartRenderError,
  GroupSyncAction,
  GroupSyncMode,
  cloneSerializable,
  publishChartGroupSync,
  registerChartGroupSync,
} from '@oneteme/jquery-core';
import {
  Highcharts,
  sanitizeChartDimensions,
  ChartCustomEvent,
  setupToolbar,
  updateChartLoadingState,
  configureLoadingOptions,
  transformChartData,
  needsDataConversion,
  detectPreviousChartType,
  showValidationError,
  hideValidationError,
  buildMapUrl,
  loadGeoJSON,
  extractCodeToNameMapping,
  replaceCodesWithNames,
  createMapTooltipFormatter,
  createSimpleMapTooltipFormatter,
  validateChartData,
  DEFAULT_MAP_JOINBY,
  buildMapSeries,
} from './utils';
import { applyHighchartsRuntimeEvents } from './runtime/highcharts-events.adapter';
import { buildHighchartsOptions, PreparedHighchartsData } from './pipeline/highcharts-options.pipeline';
import { prepareHighchartsData, resolveHighchartsPointValue } from './pipeline/highcharts-data.pipeline';
import { applyHighchartsSeriesAxes } from './pipeline/highcharts-axis.builder';
import { HighchartsInstanceController } from './runtime/highcharts-instance.controller';

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
  @Input() renderedOption?: Highcharts.Options | null;
  @Input() loadingLabel = 'Chargement des données...';
  @Input() noDataLabel = 'Aucune donnée';
  @Input() theme: Highcharts.Options | null = null;
  @Input() group: string | null = null;
  @Input() groupSync: GroupSyncMode | null = null;
  @Output() customEvent = new EventEmitter<ChartCustomEvent>();
  @Output() chartClick = new EventEmitter<ChartClickEvent>();
  @Output() renderError = new EventEmitter<ChartRenderError>();

  @HostBinding('style.width') width = '100%';
  @HostBinding('style.display') display = 'block';
  @HostBinding('style.overflow') overflow = 'hidden';

  private readonly chartController = new HighchartsInstanceController();
  private _isLoading: boolean = false;
  private dataValidationError: { title: string; message: string } | null = null;
  private loadedMapData: any = null;
  private mapCodeToName: Map<string, string> = new Map();
  private resizeObserver: ResizeObserver | null = null;
  private lastChartSize: { width: number; height: number } | null = null;
  private chartCreationPending = false;
  private destroyed = false;
  private renderGeneration = 0;
  private _isSyncing = false;
  private readonly groupSyncSource = Symbol('jquery-highcharts');
  private groupSyncUnregister: (() => void) | null = null;

  private get effectiveGroup(): string | null {
    return this.group ?? this.config?.group ?? null;
  }

  private get effectiveGroupSync(): GroupSyncMode {
    return this.groupSync ?? this.config?.groupSync ?? 'all';
  }

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
      this.loadingLabel,
      this.noDataLabel,
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] || changes['data'] || changes['type'] || changes['renderedOption'] || changes['theme'] || changes['group'] || changes['groupSync']) {
      this.updateChart();
    }
    if (changes['isLoading'] && !changes['isLoading'].firstChange) {
      this.updateLoadingState();
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.renderGeneration += 1;
    this.unregisterGroup();
    this.destroyChart();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  ngAfterViewInit(): void {
    if (this.elementRef.nativeElement) {
      this.resizeObserver = new ResizeObserver((entries) => {
        if (this.destroyed) return;
        if (!entries[0]) return;

        const { width, height } = entries[0].contentRect;
        if (width <= 0 || height <= 0) return;

        if (this.chart) {
          this.resizeChart(width, height);
        } else if (this.chartCreationPending) {
          this.updateChart();
        }
      });
      this.resizeObserver.observe(this.elementRef.nativeElement);
    }
  }

  private updateChart(): void {
    if (this.destroyed) return;

    const generation = ++this.renderGeneration;
    this.dataValidationError = null;
    this.loadedMapData = null;
    this.mapCodeToName = new Map();
    if (!this.config || !this.data) {
      this.debug && console.log('Configuration ou données manquantes');
      return;
    }

    if (!this.chart && !this.hasRenderableSize()) {
      this.chartCreationPending = true;
      return;
    }

    this.chartCreationPending = false;

    const hasData = Array.isArray(this.data) && this.data.length > 0;
    if (this.type === 'map' && this._isLoading && !hasData) {
      this.debug && console.log('[chart] map isLoading sans données');
      if (this.chart) {
        updateChartLoadingState(this.chart, true, false, false, this.loadingLabel, this.noDataLabel);
        return;
      }
      this.createLoadingChart();
      return;
    }

    this.destroyChart();

    if (this.shouldLoadMapData()) {
      this.createMapChartAsync(generation);
    } else {
      this.createChart(generation);
    }
  }

  private async createMapChartAsync(generation: number): Promise<void> {
    const mapUrl = buildMapUrl(
      this.config.mapEndpoint!,
      this.config.mapParam,
      this.config.mapDefaultValue,
    );

    try {
      const loadedMapData = await loadGeoJSON(mapUrl);
      if (!this.isRenderCurrent(generation)) return;
      this.loadedMapData = loadedMapData;
      this.mapCodeToName = extractCodeToNameMapping(loadedMapData);

      this.createChart(generation);
    } catch (error) {
      if (!this.isRenderCurrent(generation)) return;
      console.error('Erreur lors du chargement de la carte:', error);
      this.renderError.emit({ error });
      this.dataValidationError = {
        title: 'Erreur de chargement',
        message: `Impossible de charger la carte géographique (${mapUrl})`,
      };
      this.createChart(generation); // créer le chart meme si error pour l'afficher
    }
  }

  private createLoadingChart(): void {
    try {
      if (this.destroyed) return;
      const element = this.elementRef.nativeElement;
      if (!element) return;
      if (!this.hasRenderableSize()) {
        this.chartCreationPending = true;
        return;
      }

      const options: Highcharts.Options = {
        chart: {
          backgroundColor: 'transparent',
        },
        title: { text: '' },
        credits: { enabled: false },
        exporting: { enabled: false },
        series: [],
      };

      configureLoadingOptions(options, this.loadingLabel, this.noDataLabel);

      this.chartController.create(element, options, false);

      if (this.chart) {
        const { width, height } = element.getBoundingClientRect();
        this.resizeChart(width, height);
      }

      updateChartLoadingState(this.chart, true, false, false, this.loadingLabel, this.noDataLabel);

      this.debug && console.log('[chart] Loading chart créé pour map');
    } catch (error) {
      console.error('Erreur lors de la création du loading chart:', error);
      this.renderError.emit({ error });
    }
  }

  private async createChart(generation: number): Promise<void> {
    try {
      if (!this.isRenderCurrent(generation)) return;
      const element = this.elementRef.nativeElement;
      if (!this.hasRenderableSize()) {
        this.chartCreationPending = true;
        return;
      }

      const options = await this.buildChartOptions(generation);
      if (!options || !this.isRenderCurrent(generation)) return;
      sanitizeChartDimensions(options, this.config);

      this.chartController.create(element, options, this.type === 'map');
      this.configureZoomAxes();
      this.registerGroup();

      // Force un premier redimensionnement si nécessaire
      if (this.chart) {
        const { width, height } = element.getBoundingClientRect();
        this.resizeChart(width, height);
      }

      if (this.dataValidationError) {
        showValidationError(this.chart, this.dataValidationError.message);
      } else {
        hideValidationError(this.chart, this.noDataLabel);
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
        this.loadingLabel,
        this.noDataLabel,
      );

      this.debug && console.log('Graphique créé:', this.type);
    } catch (error) {
      console.error('Erreur lors de la création du graphique:', error);
      this.renderError.emit({ error });
    }
  }

  private hasRenderableSize(): boolean {
    const { width, height } = this.elementRef.nativeElement.getBoundingClientRect();
    return width > 0 && height > 0;
  }

  private resizeChart(width: number, height: number): void {
    const nextSize = {
      width: Math.round(width),
      height: Math.round(height),
    };
    if (nextSize.width <= 0 || nextSize.height <= 0) return;
    if (this.lastChartSize?.width === nextSize.width && this.lastChartSize.height === nextSize.height) return;

    this.lastChartSize = nextSize;
    this.chartController.resize(nextSize.width, nextSize.height);
  }

  private shouldLoadMapData(): boolean {
    if (!this.config.mapEndpoint) return false;
    if (this.type === 'map') return true;

    const sourceSeries = [{ data: this.data }];
    return needsDataConversion(sourceSeries, this.type)
      && detectPreviousChartType(sourceSeries, this.type) === 'map';
  }

  private isRenderCurrent(generation: number): boolean {
    return !this.destroyed && generation === this.renderGeneration;
  }

  private get chart(): Highcharts.Chart | null {
    return this.chartController.chart;
  }

  private async buildChartOptions(generation: number): Promise<Highcharts.Options | null> {
    if (this.renderedOption) {
      return buildHighchartsOptions({
        chartType: this.type,
        highchartsType: this.getHighchartsType(),
        config: this.config,
        theme: this.theme,
        renderedOption: this.renderedOption,
        loadingLabel: this.loadingLabel,
        noDataLabel: this.noDataLabel,
        debug: this.debug,
        applySeriesAxes: (options, series) => applyHighchartsSeriesAxes(options, series, this.config, this.type),
        applyRuntimeEvents: options => this.applyRuntimeEvents(options),
      });
    }
    // Pour les maps, pas utiliser processData() car transforme les données en tableaux
    // Les maps ont besoin des données au format objet {code, value}
    let chartData: PreparedHighchartsData;

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
      const validation = validateChartData(chartData.series, this.type);
      if (!validation.isValid && !validation.isNoData) {
        this.dataValidationError = {
          title: validation.errorTitle || 'Erreur',
          message: validation.errorMessage || 'Données incompatibles',
        };
      }
    } else {
      const tempSeries = [{ data: this.data }];
      if (needsDataConversion(tempSeries, this.type)) {
        const previousType = detectPreviousChartType(tempSeries, this.type);
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

        if (['pie', 'donut', 'funnel', 'pyramid'].includes(this.type) && finalCategories && result.series[0]?.data) {
          const formattedData = result.series[0].data.map(
            (value: any, index: number) => ({
              name: finalCategories[index] || `Item ${index + 1}`,
                y: resolveHighchartsPointValue(value),
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
            chartData.tooltip = createSimpleMapTooltipFormatter(this.config.options?.mapValueLabel);
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
            chartData.tooltip = createMapTooltipFormatter(this.config.options?.mapValueLabel);
          }
        }
      } else {
        const prepared = prepareHighchartsData({
          data: this.data,
          config: this.config,
          type: this.type,
          mapCodeToName: this.mapCodeToName,
          debug: this.debug,
        });
        chartData = prepared.data;
        this.dataValidationError = prepared.validationError;
      }
    }

    return buildHighchartsOptions({
      chartType: this.type,
      highchartsType: this.getHighchartsType(),
      config: this.config,
      theme: this.theme,
      loadingLabel: this.loadingLabel,
      noDataLabel: this.noDataLabel,
      debug: this.debug,
      preparedData: chartData,
      loadedMapData: this.loadedMapData,
      dataValidationError: this.dataValidationError,
      applySeriesAxes: (options, series) => applyHighchartsSeriesAxes(options, series, this.config, this.type),
      applyRuntimeEvents: options => this.applyRuntimeEvents(options),
    });
  }

  private applyRuntimeEvents(options: Highcharts.Options): void {
    applyHighchartsRuntimeEvents(options, {
      render: chart => {
        const hasData = Array.isArray(this.data) && this.data.length > 0;
        if (this.isLoading && !hasData) {
          const runtimeChart = chart as any;
          runtimeChart.customLabel?.hide?.();
          runtimeChart.customTotalLabel?.hide?.();
          runtimeChart.seriesGroup?.hide?.();
          runtimeChart.subtitleGroup?.hide?.();
        }
      },
      pointClick: event => {
        const point = event.point;
        this.chartClick.emit({
          seriesIndex: point?.series?.index,
          dataIndex: point?.index,
          seriesType: point?.series?.type,
          name: point?.name ?? (point?.category === undefined ? undefined : String(point.category)),
          value: point?.y ?? point?.value,
          data: point?.options ?? point,
          event,
        });
      },
      pointMouseOver: point => {
        this.publishGroupTooltip(point);
      },
      pointMouseOut: () => {
        this.publishGroupTooltip(null);
      },
      seriesVisibility: series => {
        this.updateAxisVisibility(series.chart);
      },
      afterSetExtremes: this.effectiveGroup && this.syncActions().includes('datazoom')
        ? (event, xAxisIndex) => {
            const min = event?.min ?? event?.dataMin;
            const max = event?.max ?? event?.dataMax;
            if (typeof min !== 'number' || typeof max !== 'number') return;
            const axis = this.chart?.xAxis[xAxisIndex];
            this.publishGroupDataZoom(
              min,
              max,
              xAxisIndex,
              this.resolveAxisCategoryValue(axis, min),
              this.resolveAxisCategoryValue(axis, max),
            );
          }
        : undefined,
    });

    if (this.effectiveGroup && this.syncActions().includes('datazoom')) {
      const chartOptions = options.chart as any;
      chartOptions.zooming = {
        ...(chartOptions.zooming ?? {}),
        type: chartOptions.zooming?.type ?? chartOptions.zoomType ?? 'x',
      };
      chartOptions.zoomType = chartOptions.zoomType ?? chartOptions.zooming.type;

      let xAxes: any[] = [];
      if (Array.isArray(options.xAxis)) {
        xAxes = options.xAxis;
      } else if (options.xAxis) {
        xAxes = [options.xAxis];
      }
      xAxes.forEach((xAxis: any) => {
        if (Array.isArray(xAxis.categories) && xAxis.minRange === undefined) {
          xAxis.minRange = 1;
        }
      });
    }
  }

  private getHighchartsType(): string {
    const typeMapping: { [key: string]: string } = {
      donut: 'pie',
      columnpyramid: 'column',
      polar: 'column',
      radar: 'line',
      radarArea: 'area',
      radialBar: 'column',
      mixed: 'line',
    };
    return typeMapping[this.type] || this.type;
  }

  exportImage(
    fileName = 'chart',
    type: ChartExportImageType = 'png',
    pixelRatio = 2,
  ): void {
    if (!this.chart) return;
    if (type === 'svg') {
      const svg = this.chart.getSVG();
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      this.downloadBlob(blob, `${fileName}.svg`);
      return;
    }
    this.chart.exportChartLocal({
      type: `image/${type}`,
      filename: fileName,
      sourceWidth: Math.round(this.chart.chartWidth * pixelRatio),
      sourceHeight: Math.round(this.chart.chartHeight * pixelRatio),
      fallbackToExportServer: false,
    }, {
      chart: {
        backgroundColor: this.resolveExportBackgroundColor(),
      },
    });
  }

  exportData(fileName = 'data', separator = ';'): void {
    if (!this.chart) return;
    const csv = this.replaceCsvDelimiter(this.chart.getCSV(), separator);
    this.downloadBlob(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }), `${fileName}.csv`);
  }

  zoomOut(): void {
    this.chart?.zoomOut();
  }

  getRenderedOption(): Highcharts.Options | null {
    if (this.renderedOption) return cloneSerializable(this.renderedOption);
    if (!this.chart) return null;
    try {
      return cloneSerializable(this.chart.options);
    } catch {
      return null;
    }
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    if (typeof document === 'undefined') return;
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.download = fileName;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }

  private resolveExportBackgroundColor(): string {
    const backgroundColor = this.chart?.options.chart?.backgroundColor;
    if (typeof backgroundColor === 'string' && backgroundColor !== 'transparent') {
      return backgroundColor;
    }
    return '#fff';
  }

  private replaceCsvDelimiter(csv: string, separator: string): string {
    if (!separator || separator === ',') return csv;

    let inQuotes = false;
    let result = '';
    for (const character of csv) {
      if (character === '"') {
        inQuotes = !inQuotes;
      }
      result += character === ',' && !inQuotes ? separator : character;
    }
    return result;
  }

  private registerGroup(): void {
    this.unregisterGroup();
    const group = this.effectiveGroup;
    if (!group || !this.chart) return;
    this.groupSyncUnregister = registerChartGroupSync(
      group,
      this.groupSyncSource,
      (event) => this.applySharedGroupSync(event),
    );
  }

  private unregisterGroup(): void {
    this.groupSyncUnregister?.();
    this.groupSyncUnregister = null;
  }

  private publishGroupTooltip(point: any): void {
    if (!this.effectiveGroup || !this.syncActions().includes('tooltip') || this._isSyncing) return;
    publishChartGroupSync({
      group: this.effectiveGroup,
      action: 'tooltip',
      source: this.groupSyncSource,
      payload: { xValue: point ? point.category ?? point.name ?? point.x : null },
    });
  }

  private publishGroupDataZoom(
    min: number,
    max: number,
    xAxisIndex: number,
    startValue?: unknown,
    endValue?: unknown,
  ): void {
    if (!this.effectiveGroup || !this.syncActions().includes('datazoom') || this._isSyncing) return;
    publishChartGroupSync({
      group: this.effectiveGroup,
      action: 'datazoom',
      source: this.groupSyncSource,
      payload: { min, max, startValue, endValue, xAxisIndex },
    });
  }

  private applySharedGroupSync(event: ChartGroupSyncEvent): void {
    if (!this.chart || !this.syncActions().includes(event.action)) return;

    this._isSyncing = true;
    try {
      if (event.action === 'tooltip') {
        const xValue = event.payload.xValue;
        if (xValue === null || xValue === undefined) {
          this.chart.tooltip?.hide();
          return;
        }

        const target = this.chart.series
          .flatMap(series => series.points)
          .find(point => [point.category, point.name, point.x]
            .some(value => this.matchesGroupValue(value, xValue)));
        if (target) this.chart.tooltip?.refresh(target);
        return;
      }

      const axis = this.chart.xAxis[event.payload.xAxisIndex ?? 0];
      if (!axis) return;
      const min = this.resolveGroupAxisValue(event.payload.startValue, axis)
        ?? this.resolveGroupAxisValue(event.payload.min, axis);
      const max = this.resolveGroupAxisValue(event.payload.endValue, axis)
        ?? this.resolveGroupAxisValue(event.payload.max, axis);
      if (min !== undefined || max !== undefined) {
        const extremes = axis.getExtremes();
        const isReset = min === extremes.dataMin && max === extremes.dataMax;
        if (isReset) {
          this.chart.zoomOut();
        } else {
          this.applyZoomExtremes(axis, min, max);
        }
      }
    } finally {
      this._isSyncing = false;
    }
  }

  private updateAxisVisibility(chart: Highcharts.Chart): void {
    let changed = false;
    chart.yAxis.forEach(axis => {
      const options = axis.options as any;
      if (options.custom?.jqueryHighchartsAutoVisibility !== true) return;

      const hasVisibleSeries = axis.series.some(series => series.visible !== false);
      if ((axis as any).visible !== hasVisibleSeries) {
        axis.update({ visible: hasVisibleSeries }, false);
        changed = true;
      }
    });

    if (changed) chart.redraw();
  }

  private applyZoomExtremes(axis: Highcharts.Axis, min: number, max: number): void {
    const chart = this.chart;
    if (!chart || !Number.isFinite(min) || !Number.isFinite(max)) return;

    const zoomMin = Math.min(min, max);
    const zoomMax = Math.max(min, max);
    const extremes = axis.getExtremes();
    axis.setExtremes(zoomMin, zoomMax, false, false);
    chart.redraw();

    if (
      zoomMin > (extremes.dataMin ?? zoomMin) ||
      zoomMax < (extremes.dataMax ?? zoomMax)
    ) {
      chart.showResetZoom();
    }
  }

  private configureZoomAxes(): void {
    if (!this.chart || !this.effectiveGroup || !this.syncActions().includes('datazoom')) return;

    let changed = false;
    this.chart.xAxis.forEach(axis => {
      const runtimeAxis = axis as any;
      if (!Array.isArray(axis.categories) || runtimeAxis.userMinRange !== undefined) return;

      runtimeAxis.minRange = 1;
      runtimeAxis.userMinRange = 1;
      axis.options.minRange = 1;
      (axis.userOptions as any).minRange = 1;
      runtimeAxis.setScale();
      changed = true;
    });

    if (changed) this.chart.redraw();
  }

  private resolveGroupAxisValue(value: unknown, axis: Highcharts.Axis): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (value === null || value === undefined) return undefined;

    const target = this.chart?.series
      .flatMap(series => series.points)
      .find(point => [point.category, point.name]
        .some(candidate => this.matchesGroupValue(candidate, value)));
    return target?.x;
  }

  private resolveAxisCategoryValue(axis: Highcharts.Axis | undefined, value: number): unknown {
    const categories = axis?.categories;
    if (!Array.isArray(categories) || !Number.isFinite(value)) return undefined;
    return categories[Math.round(value)];
  }

  private matchesGroupValue(left: unknown, right: unknown): boolean {
    if (left === right) return true;
    const isComparable = (value: unknown): value is string | number =>
      typeof value === 'string' || typeof value === 'number';
    return isComparable(left) && isComparable(right) && String(left) === String(right);
  }

  private syncActions(): GroupSyncAction[] {
    const mode = this.effectiveGroupSync;
    if (mode === 'all') return ['datazoom', 'tooltip'];
    return Array.isArray(mode) ? mode : [mode];
  }

  private destroyChart(): void {
    this.unregisterGroup();
    this.lastChartSize = null;
    if (!this.chart) return;
    this.chartController.destroy();
    this.debug && console.log('Graphique détruit');
  }
}
