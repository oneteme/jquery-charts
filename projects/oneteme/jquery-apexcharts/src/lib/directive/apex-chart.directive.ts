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
  signal,
  SimpleChanges,
} from '@angular/core';
import {
  ChartClickEvent,
  ChartGroupSyncEvent,
  ChartProvider,
  ChartRenderError,
  ChartView,
  cloneSerializable,
  GroupSyncAction,
  GroupSyncMode,
  mergeDeep,
  publishChartGroupSync,
  registerChartGroupSync,
  XaxisType,
  YaxisType,
} from '@oneteme/jquery-core';
import ApexCharts from 'apexcharts';
import { asapScheduler } from 'rxjs';
import {
  ChartCustomEvent,
  customIcons,
  destroyChart,
  fixToolbarSvgIds,
  initCommonChartOptions,
  setupScrollPrevention,
  setupToolbarObserver,
  updateCommonOptions,
} from './utils';

export interface ApexChartHandle {
  exportImage(fileName?: string, type?: 'png' | 'jpeg' | 'svg', pixelRatio?: number): void;
  exportData(fileName?: string, separator?: string): void;
  resize(): void;
  getRenderedOption(): unknown;
}

@Directive()
export abstract class ApexChartDirectiveBase<
  X extends XaxisType,
  Y extends YaxisType,
> implements ChartView<X, Y>, OnChanges, OnDestroy, ApexChartHandle {
  protected readonly el = inject(ElementRef<HTMLElement>);
  protected readonly ngZone = inject(NgZone);
  protected readonly chartInstance = signal<ApexCharts | null>(null);

  protected _options: any;
  protected _chartConfig!: ChartProvider<X, Y>;
  private toolbarObserver: MutationObserver | null = null;
  private scrollPreventionCleanup: (() => void) | null = null;
  private groupSyncUnregister: (() => void) | null = null;
  private readonly groupSyncSource = Symbol('jquery-apexcharts');
  private isSyncing = false;
  private _isLoading = false;
  private _loadingLabel = 'Chargement des données...';
  private _noDataLabel = 'Aucune donnée';
  private _canPivot = false;
  private _group: string | null = null;
  private _groupSync: GroupSyncMode | null = null;
  private destroyed = false;

  @Input() debug = false;
  @Input({ required: true }) data: any[] = [];
  @Input() renderedOption?: unknown;

  @Input()
  set config(config: ChartProvider<X, Y>) {
    this._chartConfig = config;
    this._options = updateCommonOptions(this._options, config);
    this.configureTypeSpecificOptions();
    this._options.chart.toolbar.tools.customIcons = this.createCustomIcons();
  }

  @Input()
  set isLoading(value: boolean) {
    this._isLoading = value;
    this.updateNoDataLabel();
  }

  get isLoading(): boolean {
    return this._isLoading;
  }

  @Input()
  set loadingLabel(value: string) {
    this._loadingLabel = value || 'Chargement des données...';
    this.updateNoDataLabel();
  }

  @Input()
  set noDataLabel(value: string) {
    this._noDataLabel = value || 'Aucune donnée';
    this.updateNoDataLabel();
  }

  @Input()
  set canPivot(value: boolean) {
    this._canPivot = value === true;
    this._options.chart.toolbar.tools.customIcons = this.createCustomIcons();
  }

  get canPivot(): boolean {
    return this._canPivot;
  }

  @Input()
  set theme(value: Record<string, unknown> | null) {
    if (value) {
      this._options.theme = value;
    } else {
      delete this._options.theme;
    }
  }

  @Input()
  set group(value: string | null) {
    this._group = value;
  }

  get group(): string | null {
    return this._group ?? this._chartConfig?.group ?? null;
  }

  @Input()
  set groupSync(value: GroupSyncMode | null) {
    this._groupSync = value;
  }

  get groupSync(): GroupSyncMode {
    return this._groupSync ?? this._chartConfig?.groupSync ?? 'all';
  }

  @Output() customEvent = new EventEmitter<ChartCustomEvent>();
  @Output() chartClick = new EventEmitter<ChartClickEvent>();
  @Output() renderError = new EventEmitter<ChartRenderError>();

  protected constructor(initialChartType: string) {
    this._options = initCommonChartOptions(
      this.el,
      this.customEvent,
      this.ngZone,
      initialChartType,
      false,
      this.chartClick,
      {
        onZoomed: (_chartContext, xaxis) => this.publishDataZoom(xaxis),
        onMouseMove: (event, _chartContext, config) => this.publishTooltip(config, event),
        onMouseLeave: () => this.publishTooltip(null),
      },
    );
  }

  protected abstract updateData(): void;

  protected abstract updateType(): void;

  protected configureTypeSpecificOptions(): void {
    // Les directives spécialisées peuvent ajuster les options propres à leur type.
  }

  protected get effectiveConfig(): ChartProvider<X, Y> {
    if (this.canPivot || !this._chartConfig) return this._chartConfig;
    return { ...this._chartConfig, pivot: false };
  }

  init(): void {
    if (this.destroyed || this.chartInstance()) return;

    this.ngZone.runOutsideAngular(() => {
      try {
        const options = this.getEffectiveOptions();
        const chart = new ApexCharts(this.el.nativeElement, options);
        this.chartInstance.set(chart);
        this.registerGroupSync();

        void chart
          .render()
          .then(() => {
            if (this.destroyed || this.chartInstance() !== chart) {
              chart.destroy();
              return;
            }
            this.scrollPreventionCleanup?.();
            this.scrollPreventionCleanup = setupScrollPrevention(this.el.nativeElement, this.chartInstance);
            fixToolbarSvgIds(this.el.nativeElement);
            this.toolbarObserver = setupToolbarObserver(this.el.nativeElement);
          })
          .catch((error) => this.handleRenderError(error));
      } catch (error) {
        this.handleRenderError(error);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.destroyed) return;

    if (this.debug) {
      console.log('[jquery-apexcharts] ngOnChanges', changes);
    }

    this.ngZone.runOutsideAngular(() => {
      asapScheduler.schedule(() => {
        if (!this.destroyed) this.hydrate(changes);
      });
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.disposeChart();
  }

  exportImage(fileName = 'chart', type: 'png' | 'jpeg' | 'svg' = 'png', pixelRatio = 2): void {
    const chart = this.chartInstance();
    if (!chart) return;

    if (type === 'svg') {
      const source = this.el.nativeElement.querySelector('.apexcharts-svg') as SVGElement | null;
      if (!source) return;
      const svg = source.cloneNode(true) as SVGElement;
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      this.download(url, `${fileName}.svg`);
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      return;
    }

    void chart.dataURI({ scale: pixelRatio })
      .then((result) => {
        if (!('imgURI' in result)) return;
        if (type === 'png') {
          this.download(result.imgURI, `${fileName}.png`);
          return;
        }
        this.downloadJpeg(result.imgURI, `${fileName}.jpeg`);
      })
      .catch((error) => this.handleExportError(error));
  }

  exportData(fileName = 'data', separator = ';'): void {
    this.chartInstance()?.exports.exportToCSV({
      fileName,
      columnDelimiter: separator,
    });
  }

  resize(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('resize'));
    }
  }

  getRenderedOption(): unknown {
    if (this.renderedOption) return cloneSerializable(this.renderedOption);
    const chartOptions = (this.chartInstance() as any)?.w?.config;
    return cloneSerializable(chartOptions ?? this._options);
  }

  protected updateChartOptions(
    specificOptions?: any,
    redrawPaths = true,
    animate = true,
    updateSyncedCharts = false,
  ): Promise<void> {
    const chart = this.chartInstance();
    if (!chart) return Promise.resolve();

    return this.ngZone.runOutsideAngular(() =>
      chart
        .updateOptions(
          this.getEffectiveOptions(specificOptions),
          redrawPaths,
          animate,
          updateSyncedCharts,
        )
        .then(() => {
          this.syncSeriesVisibility(chart);
          fixToolbarSvgIds(this.el.nativeElement);
        })
        .catch((error) => this.handleRenderError(error)),
    );
  }

  protected markForRedraw(): void {
    this._options.shouldRedraw = true;
  }

  private hydrate(changes: SimpleChanges): void {
    const needsDataUpdate = !!(changes['data'] || changes['config'] || changes['type']);
    const needsOptionsUpdate = Object.keys(changes).some((key) => key !== 'debug');

    if (changes['type']) this.updateType();
    if (changes['renderedOption']) this.markForRedraw();
    if (needsDataUpdate && this.data && this._chartConfig) this.updateData();

    if (changes['group'] || changes['groupSync'] || changes['config']) {
      this.registerGroupSync();
    }

    if (changes['isLoading'] || changes['loadingLabel'] || changes['noDataLabel']) {
      this.updateChartOptions({ noData: this._options.noData }, false, false, false);
    }

    if (this._options.shouldRedraw || !this.chartInstance()) {
      this.disposeChart();
      delete this._options.shouldRedraw;
      this.init();
    } else if (needsOptionsUpdate) {
      this.updateChartOptions();
    }
  }

  private updateNoDataLabel(): void {
    this._options.noData.text = this._isLoading ? this._loadingLabel : this._noDataLabel;
  }

  private getEffectiveOptions(specificOptions?: any): any {
    const options = specificOptions
      ? mergeDeep({}, this._options, specificOptions)
      : mergeDeep({}, this._options);

    return this.renderedOption
      ? mergeDeep(options, this.renderedOption as object)
      : options;
  }

  private syncSeriesVisibility(chart: ApexCharts): void {
    for (const series of this._options.series ?? []) {
      if (!series.name) continue;
      if (series.hidden === true) chart.hideSeries(series.name);
      else chart.showSeries(series.name);
    }
  }

  private createCustomIcons(): any[] {
    return customIcons(
      (event) => this.ngZone.run(() => this.customEvent.emit(event)),
      this._canPivot,
    );
  }

  private disposeChart(): void {
    this.toolbarObserver?.disconnect();
    this.toolbarObserver = null;
    this.scrollPreventionCleanup?.();
    this.scrollPreventionCleanup = null;
    this.groupSyncUnregister?.();
    this.groupSyncUnregister = null;
    destroyChart(this.chartInstance);
  }

  private handleRenderError(error: unknown): Promise<void> {
    this.chartInstance.set(null);
    this.ngZone.run(() => this.renderError.emit({ error }));
    return Promise.resolve();
  }

  private registerGroupSync(): void {
    this.groupSyncUnregister?.();
    this.groupSyncUnregister = null;
    if (!this.group) return;

    this.groupSyncUnregister = registerChartGroupSync(
      this.group,
      this.groupSyncSource,
      (event) => this.applyGroupSync(event),
    );
  }

  private publishDataZoom(xaxis: any): void {
    if (!this.group || !this.syncs('datazoom') || this.isSyncing || !xaxis) return;
    if (!Number.isFinite(xaxis.min) || !Number.isFinite(xaxis.max)) return;
    publishChartGroupSync({
      group: this.group,
      action: 'datazoom',
      source: this.groupSyncSource,
      payload: {
        min: xaxis.min,
        max: xaxis.max,
      },
    });
  }

  private publishTooltip(config: any, event?: MouseEvent): void {
    if (!this.group || !this.syncs('tooltip') || this.isSyncing) return;
    const xValues = this.getXAxisValues();
    let index = config?.dataPointIndex;
    if (typeof index !== 'number' || index < 0) {
      const grid = this.el.nativeElement.querySelector('.apexcharts-grid') as SVGElement | null;
      if (grid && xValues.length > 1 && event) {
        const bounds = grid.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
        index = Math.round(ratio * (xValues.length - 1));
      }
    }
    if (typeof index !== 'number' || index < 0) {
      publishChartGroupSync({
        group: this.group,
        action: 'tooltip',
        source: this.groupSyncSource,
        payload: { xValue: null },
      });
      return;
    }

    const point = this._options.series?.[config.seriesIndex ?? 0]?.data?.[index];
  const xValue = xValues[index] ?? (point && typeof point === 'object' ? point.x : index);
    publishChartGroupSync({
      group: this.group,
      action: 'tooltip',
      source: this.groupSyncSource,
      payload: { xValue },
    });
  }

  private applyGroupSync(event: ChartGroupSyncEvent): void {
    const chart = this.chartInstance();
    if (!chart || !this.syncs(event.action)) return;

    this.isSyncing = true;
    try {
      if (event.action === 'datazoom') {
        const { min, max } = event.payload;
        if (typeof min === 'number' && typeof max === 'number') chart.zoomX(min, max);
      } else {
        this.applyTooltip(event.payload.xValue);
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private applyTooltip(xValue: unknown): void {
    const target = this.el.nativeElement.querySelector('.apexcharts-inner') as SVGElement | null;
    if (!target) return;
    if (xValue === null || xValue === undefined) {
      target.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      return;
    }
    const xValues = this.getXAxisValues();
    const normalizedXValue = this.normalizeXAxisValue(xValue);
    const index = xValues.indexOf(normalizedXValue);
    if (index < 0) return;
    const grid = this.el.nativeElement.querySelector('.apexcharts-grid') as SVGElement | null;
    if (!grid || xValues.length < 2) return;

    const bounds = grid.getBoundingClientRect();
    target.dispatchEvent(new MouseEvent('mousemove', {
      bubbles: true,
      clientX: bounds.left + (index / (xValues.length - 1)) * bounds.width,
      clientY: bounds.top + bounds.height / 2,
    }));
  }

  private getXAxisValues(): Array<string | number | null> {
    const categories = this._options.xaxis?.categories;
    if (Array.isArray(categories) && categories.length) {
      return categories.map(value => this.normalizeXAxisValue(value));
    }
    const data = this._options.series?.[0]?.data;
    if (!Array.isArray(data)) return [];
    return data.map((point, index) => this.normalizeXAxisValue(
      point && typeof point === 'object' ? point.x : index,
    ));
  }

  private normalizeXAxisValue(value: unknown): string | number | null {
    if (typeof value === 'string' || typeof value === 'number') return value;
    if (value instanceof Date) return value.getTime();
    return null;
  }

  private syncs(action: GroupSyncAction): boolean {
    return this.groupSync === 'all'
      || this.groupSync === action
      || (Array.isArray(this.groupSync) && this.groupSync.includes(action));
  }

  private download(href: string, fileName: string): void {
    if (typeof document === 'undefined') return;
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    link.click();
  }

  private downloadJpeg(source: string, fileName: string): void {
    if (typeof document === 'undefined') return;
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Le contexte canvas est indisponible.');
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0);
        this.download(canvas.toDataURL('image/jpeg'), fileName);
      } catch (error) {
        this.handleExportError(error);
      } finally {
        image.onload = null;
        image.onerror = null;
      }
    };
    image.onerror = () => {
      image.onload = null;
      image.onerror = null;
      this.handleExportError(new Error('Impossible de convertir l’export PNG en JPEG.'));
    };
    image.src = source;
  }

  private handleExportError(error: unknown): void {
    console.error('[jquery-apexcharts] Échec de l’export.', error);
    this.ngZone.run(() => this.renderError.emit({ error }));
  }
}