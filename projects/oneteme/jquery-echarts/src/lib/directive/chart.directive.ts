import { AfterViewInit, Directive, ElementRef, EventEmitter, inject, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { ChartExportImageType, ChartGroupSyncEvent, ChartProvider, ChartType, ChartView, cloneSerializable, mergeDeep, publishChartGroupSync, registerChartGroupSync, XaxisType, YaxisType } from '@oneteme/jquery-core';
import { asapScheduler } from 'rxjs';

import { echarts } from './utils/echarts-init';
import { EChartsOption, ChartClickEvent, ChartCustomEvent, ChartRenderError, DEFAULT_LOADING_OPTION, GroupSyncAction, GroupSyncMode } from './utils/types';
import { applyCommonConfig, applyControlledLegendSelection, buildBaseOption, buildNoDataGraphic, buildTooltipOption } from './utils/chart-utils';
import { resolveConfigurator } from './utils/config/chart-config-registry';

@Directive({
  standalone: true,
  selector: '[echarts-chart]',
})
export class ChartDirective<X extends XaxisType, Y extends YaxisType>
  implements ChartView<X, Y>, OnChanges, AfterViewInit, OnDestroy
{
  /** Registre statique des instances par groupe pour la synchronisation manuelle. */
  private static readonly _groupRegistry = new Map<string, Set<ChartDirective<any, any>>>();

  private readonly el: ElementRef = inject(ElementRef);
  private readonly ngZone = inject(NgZone);

  private _chartInstance: ReturnType<typeof echarts.init> | null = null;
  private _resizeObserver: ResizeObserver | null = null;
  private _initialized = false;
  private _isDestroyed = false;
  private _isSyncing = false;
  private _showingNoData = false;
  private readonly _groupSyncSource = Symbol('jquery-echarts');
  private _groupSyncUnregister: (() => void) | null = null;

  private _config: ChartProvider<X, Y>;
  private _type: ChartType;
  private _isLoading = false;

  @Input({ required: true }) set type(type: ChartType) {
    this._type = type;
  }
  @Input({ required: true }) set config(config: ChartProvider<X, Y>) {
    this._config = config;
  }
  @Input({ required: true }) data: any[];
  @Input() renderedOption?: EChartsOption | null;
  @Input() set isLoading(loading: boolean) {
    this._isLoading = loading;
    this._applyLoadingState();
  }
  @Input() debug = false;
  /** Lu uniquement lors de la creation de l'instance ECharts. Recréez le composant pour le modifier. */
  @Input() theme: string | null = null;
  /** Lu uniquement lors de la creation de l'instance ECharts. Recréez le composant pour le modifier. */
  @Input() renderer: 'svg' | 'canvas' = 'svg';
  @Input() loadingLabel = 'Chargement des données...';
  @Input() noDataLabel = 'Aucune donnée';
  /** Lu uniquement lors de la creation de l'instance ECharts. Recréez le composant pour le modifier. */
  @Input() group: string | null = null;
  /** Lu uniquement lors de la creation de l'instance ECharts. Recréez le composant pour le modifier. */
  @Input() groupSync: GroupSyncMode | null = null;

  private get _group(): string | null {
    return this.group ?? this._config?.group ?? null;
  }

  private get _groupSync(): GroupSyncMode {
    return this.groupSync ?? this._config?.groupSync ?? 'all';
  }

  @Output() customEvent = new EventEmitter<ChartCustomEvent>();
  @Output() chartClick = new EventEmitter<ChartClickEvent>();
  @Output() renderError = new EventEmitter<ChartRenderError>();

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      asapScheduler.schedule(() => {
        if (this._isDestroyed) return;
        const dom = this.el.nativeElement as HTMLElement;
        if (dom.clientWidth > 0 && dom.clientHeight > 0) {
          // Dimensions disponibles immédiatement : init normale
          this._initChart();
          this._initialized = true;
          this._render();
        } else {
          // Dimensions nulles (layout async, tab caché, etc.)
          // Le ResizeObserver déclenchera l'init dès que le container aura une taille
          this._initialized = true;
          this._setupResizeObserver(dom);
        }
      });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this._initialized) return;
    if (this.debug) console.log('[jquery-echarts] ngOnChanges', changes);

    this.ngZone.runOutsideAngular(() => {
      asapScheduler.schedule(() => {
        if (!this._isDestroyed) this._render(changes);
      });
    });
  }

  ngOnDestroy(): void {
    this._isDestroyed = true;
    if (this._group) {
      const set = ChartDirective._groupRegistry.get(this._group);
      if (set) {
        set.delete(this);
        if (set.size === 0) ChartDirective._groupRegistry.delete(this._group);
      }
    }
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    this._groupSyncUnregister?.();
    this._groupSyncUnregister = null;
    if (this._chartInstance) {
      this._chartInstance.dispose();
      this._chartInstance = null;
    }
  }

  // Init

  private _initChart(): void {
    if (this._isDestroyed || this._chartInstance) return;

    const dom = this.el.nativeElement as HTMLElement;
    this._chartInstance = echarts.init(dom, this.theme ?? undefined, {
      renderer: this.renderer,
    });

    this._chartInstance.on('click', (params: any) => {
      this.ngZone.run(() => this.chartClick.emit(params));
    });

    if (this._group) {
      const sync = this._resolveSync();
      let set = ChartDirective._groupRegistry.get(this._group);
      if (!set) { set = new Set(); ChartDirective._groupRegistry.set(this._group, set); }
      set.add(this);

      if (sync === 'all' || sync.includes('datazoom')) {
        this._chartInstance.on('datazoom', (p: any) => {
          this._syncDataZoom(p);
          this._publishDataZoom(p);
        });
      }
      if (sync === 'all' || sync.includes('tooltip')) {
        // Synchronisation via valeur axe X → conversion pixel/valeur pour aligner les tooltips
        // même si les graphiques ont des marges différentes (labels Y-axis de largeur variable)
        this._chartInstance.getZr().on('mousemove', (e: any) => {
          if (this._isSyncing) return;
          const peers = ChartDirective._groupRegistry.get(this._group!);
          if (!peers) return;
          // Convertir le pixel X source en valeur sur l'axe X (timestamp, index, etc.)
          const xValue = (this._chartInstance as any).convertFromPixel({ xAxisIndex: 0 }, e.offsetX);
          if (xValue === null || xValue === undefined) return;
          this._publishTooltip(xValue);
          peers?.forEach(peer => {
            if (peer !== this && peer._chartInstance) {
              // Convertir la valeur axe X en pixel sur le graphique pair (tient compte de ses propres marges)
              const peerPixelX = (peer._chartInstance as any).convertToPixel({ xAxisIndex: 0 }, xValue);
              if (peerPixelX === null || peerPixelX === undefined) return;
              peer._isSyncing = true;
              peer._chartInstance.dispatchAction({ type: 'showTip', x: peerPixelX, y: e.offsetY });
              peer._isSyncing = false;
            }
          });
        });
        this._chartInstance.getZr().on('mouseout', () => {
          const peers = ChartDirective._groupRegistry.get(this._group!);
          peers?.forEach(peer => {
            if (peer !== this && peer._chartInstance) {
              peer._chartInstance.dispatchAction({ type: 'hideTip' });
            }
          });
          this._publishTooltip(null);
        });
      }
    }

    this._setupResizeObserver(dom);
    this._registerSharedGroupSync();
  }

  private _registerSharedGroupSync(): void {
    this._groupSyncUnregister?.();
    this._groupSyncUnregister = null;
    if (!this._group) return;

    this._groupSyncUnregister = registerChartGroupSync(
      this._group,
      this._groupSyncSource,
      (event) => this._applySharedGroupSync(event),
    );
  }

  private _publishTooltip(xValue: unknown): void {
    if (!this._group || !this._syncs('tooltip') || this._isSyncing) return;
    publishChartGroupSync({
      group: this._group,
      action: 'tooltip',
      source: this._groupSyncSource,
      payload: { xValue },
    });
  }

  private _publishDataZoom(params: any): void {
    if (!this._group || !this._syncs('datazoom') || this._isSyncing) return;
    const source = params?.batch?.[0] ?? params ?? {};
    publishChartGroupSync({
      group: this._group,
      action: 'datazoom',
      source: this._groupSyncSource,
      payload: {
        min: source.min,
        max: source.max,
        start: source.start,
        end: source.end,
        startValue: source.startValue,
        endValue: source.endValue,
      },
    });
  }

  private _applySharedGroupSync(event: ChartGroupSyncEvent): void {
    if (!this._chartInstance || !this._syncs(event.action)) return;

    this._isSyncing = true;
    try {
      if (event.action === 'tooltip') {
        this._applySharedTooltip(event.payload.xValue);
      } else {
        this._applySharedDataZoom(event.payload);
      }
    } finally {
      this._isSyncing = false;
    }
  }

  private _applySharedTooltip(xValue: unknown): void {
    if (xValue === null || xValue === undefined) {
      this._chartInstance?.dispatchAction({ type: 'hideTip' });
      return;
    }

    const pixel = (this._chartInstance as any).convertToPixel({ xAxisIndex: 0 }, xValue);
    const x = Array.isArray(pixel) ? pixel[0] : pixel;
    if (typeof x === 'number' && Number.isFinite(x)) {
      this._chartInstance?.dispatchAction({
        type: 'showTip',
        x,
        y: Math.max(1, this.el.nativeElement.clientHeight / 2),
      });
    }
  }

  private _applySharedDataZoom(payload: ChartGroupSyncEvent['payload']): void {
    const action: any = { type: 'dataZoom', dataZoomIndex: 0 };
    if (payload.startValue !== undefined) action.startValue = payload.startValue;
    if (payload.endValue !== undefined) action.endValue = payload.endValue;
    if (payload.start !== undefined) action.start = payload.start;
    if (payload.end !== undefined) action.end = payload.end;
    if (payload.min !== undefined && action.startValue === undefined) action.startValue = payload.min;
    if (payload.max !== undefined && action.endValue === undefined) action.endValue = payload.max;
    this._chartInstance?.dispatchAction(action);
  }

  private _resolveSync(): 'all' | GroupSyncAction[] {
    const gs = this._groupSync;
    if (!gs || gs === 'all') return 'all';
    if (Array.isArray(gs)) return gs;
    return [gs];
  }

  resize(): void {
    this._chartInstance?.resize();
  }

  private _syncDataZoom(params: any): void {
    if (this._isSyncing || !this._group) return;
    const peers = ChartDirective._groupRegistry.get(this._group);
    if (!peers) return;
    const source = params?.batch?.[0] ?? params ?? {};
    const action: any = { type: 'dataZoom', dataZoomIndex: 0 };
    if (source.startValue !== undefined) action.startValue = source.startValue;
    if (source.endValue   !== undefined) action.endValue   = source.endValue;
    if (source.start      !== undefined) action.start      = source.start;
    if (source.end        !== undefined) action.end        = source.end;
    peers.forEach(peer => {
      if (peer !== this && peer._chartInstance) {
        peer._isSyncing = true;
        peer._chartInstance.dispatchAction(action);
        peer._isSyncing = false;
      }
    });
  }

  private _setupResizeObserver(dom: HTMLElement): void {
    this._resizeObserver?.disconnect();
    this._resizeObserver = new ResizeObserver(() => {
      this.ngZone.runOutsideAngular(() => {
        if (this._isDestroyed) return;
        if (this._chartInstance) {
          this._chartInstance.resize();
        } else {
          // Init différée : le container a maintenant des dimensions
          if (dom.clientWidth <= 0 || dom.clientHeight <= 0) return;
          this._initChart();
          this._render();
        }
      });
    });
    this._resizeObserver.observe(dom);
  }

  // Rendu

  private _render(changes?: SimpleChanges): void {
    if (!this._chartInstance || !this._config || !this._type) return;

    if (this._isLoading) {
      this._applyLoadingState();
      return;
    }

    if (!this.data?.length) {
      this._showNoData();
      return;
    }

    this._chartInstance.hideLoading();

    try {
      const option = this._buildFullOption();
      if (!(option as any).graphic) {
        (option as any).graphic = [];
      }
      if (this.debug) console.log('[jquery-echarts] setOption', option);
      const isInitialRender = !changes;
      const isTypeChange = !!changes?.['type'];
      if (isInitialRender || isTypeChange) {
        this._chartInstance.setOption(option, { notMerge: true, lazyUpdate: false });
      } else {
        this._chartInstance.setOption(option, { notMerge: false, replaceMerge: ['series', 'xAxis', 'yAxis', 'legend', 'graphic'], lazyUpdate: false });
      }
      this._showingNoData = false;
    } catch (e) {
      console.error('[jquery-echarts] Erreur lors de la construction ou du rendu :', e);
      this.ngZone.run(() => this.renderError.emit({ error: e }));
    }
  }

  private _buildFullOption(): EChartsOption {
    if (this.renderedOption) {
      const option = mergeDeep({}, this.renderedOption as object) as EChartsOption;
      const nativeSeries = Array.isArray((option as any).series) ? (option as any).series : [];
      const providerSeries = this._config?.series ?? [];
      if (nativeSeries.length && providerSeries.length) {
        (option as any).series = nativeSeries.map((series: any, index: number) => {
          const visible = (providerSeries[index] as any)?.visible;
          return typeof visible === 'boolean' ? { ...series, visible } : series;
        });
        applyControlledLegendSelection(option);
      }
      return option;
    }
    const configurator = resolveConfigurator(this._type);
    const commonChart = configurator.buildChartData(this.data, this._config, this._type);
    const base = buildBaseOption(this._config);
    const typeSpecific = configurator.buildOption(commonChart, this._type, this._config);
    const tooltipOverride: EChartsOption = {
      tooltip: buildTooltipOption(configurator.tooltipTrigger, this.el.nativeElement),
    };
    const merged = applyCommonConfig(
      mergeDeep({}, base, typeSpecific, tooltipOverride),
      this._config
    );
    if (this._group && this._syncs('datazoom') && !(merged as any).dataZoom && (merged as any).xAxis) {
      (merged as any).dataZoom = [
        { type: 'inside', xAxisIndex: 0 },
        { type: 'slider', xAxisIndex: 0, bottom: 24, height: 14 },
      ];
    }
    return merged;
  }

  private _syncs(action: 'datazoom' | 'tooltip'): boolean {
    const sync = this._resolveSync();
    return sync === 'all' || sync.includes(action);
  }

  // Loading / No-data

  private _applyLoadingState(): void {
    if (!this._chartInstance) return;
    if (this._isLoading) {
      if (this._showingNoData) {
        this._chartInstance.setOption(
          { graphic: [] },
          { replaceMerge: ['graphic'], lazyUpdate: false },
        );
        this._showingNoData = false;
      }
      this._chartInstance.showLoading('default', { ...DEFAULT_LOADING_OPTION, text: this.loadingLabel });
    } else {
      this._chartInstance.hideLoading();
    }
  }

  private _showNoData(): void {
    if (!this._chartInstance) return;
    this._chartInstance.hideLoading();
    this._chartInstance.setOption(
      { graphic: buildNoDataGraphic(this.noDataLabel), series: [] },
      { notMerge: true }
    );
    this._showingNoData = true;
  }

  // Export

  exportImage(fileName = 'chart', type?: ChartExportImageType, pixelRatio = 2): void {
    if (!this._chartInstance) return;
    const effectiveType = type ?? (this.renderer === 'svg' ? 'svg' : 'png');
    if (this.renderer === 'svg' && (effectiveType === 'png' || effectiveType === 'jpeg')) {
      const svgUrl = this._chartInstance.getDataURL({ type: 'svg', pixelRatio, backgroundColor: '#fff' });
      this.exportSvgAsRaster(svgUrl, fileName, effectiveType, pixelRatio);
      return;
    }

    const url = this._chartInstance.getDataURL({ type: effectiveType, pixelRatio, backgroundColor: '#fff' });
    this.downloadImage(url, `${fileName}.${effectiveType}`);
  }

  exportData(fileName = 'data', separator = ';'): void {
    if (!this.data?.length) return;
    const keys = Object.keys(this.data[0]);
    const rows = this.data.map(row => keys.map(k => {
      const v = row[k];
      const s = v == null ? '' : String(v);
      return s.includes(separator) || s.includes('"') || s.includes('\n') ? `"${s.replaceAll('"', '""')}"` : s;
    }).join(separator));
    const csv = [keys.join(separator), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${fileName}.csv`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }

  private exportSvgAsRaster(
    source: string,
    fileName: string,
    type: 'png' | 'jpeg',
    pixelRatio: number,
  ): void {
    const image = new Image();
    image.onload = () => {
      const scale = Number.isFinite(pixelRatio) && pixelRatio > 0 ? pixelRatio : 1;
      const width = Math.max(1, Math.round(this._chartInstance?.getWidth() || image.naturalWidth));
      const height = Math.max(1, Math.round(this._chartInstance?.getHeight() || image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const context = canvas.getContext('2d');
      if (!context) return;

      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      this.downloadImage(canvas.toDataURL(`image/${type}`), `${fileName}.${type}`);
    };
    image.onerror = () => console.error('[jquery-echarts] Impossible de rasteriser le SVG exporté.');
    image.src = source;
  }

  private downloadImage(url: string, fileName: string): void {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = url;
    link.click();
  }

  /** Retourne une copie sérialisable de l'option ECharts actuellement calculée. */
  getRenderedOption(): EChartsOption | null {
    if (!this._config || !this._type || !this.data?.length) return null;
    try {
      return cloneSerializable(this._buildFullOption());
    } catch {
      return null;
    }
  }
}
