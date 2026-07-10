import { AfterViewInit, Directive, ElementRef, EventEmitter, inject, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { ChartProvider, ChartType, ChartView, XaxisType, YaxisType } from '@oneteme/jquery-core';
import { asapScheduler } from 'rxjs';

import { echarts } from './utils/echarts-init';
import { EChartsOption, ChartCustomEvent, DEFAULT_LOADING_OPTION } from './utils/types';
import { applyCommonConfig, buildBaseOption, buildNoDataGraphic, buildTooltipOption } from './utils/chart-utils';
import { resolveConfigurator } from './utils/config/chart-config-registry';

export type GroupSyncAction = 'datazoom' | 'tooltip';
export type GroupSyncMode = 'all' | GroupSyncAction | GroupSyncAction[];

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
  private _isSyncing = false;

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
  @Input() set isLoading(loading: boolean) {
    this._isLoading = loading;
    this._applyLoadingState();
  }
  @Input() debug = false;
  @Input() theme: string | null = null;
  @Input() renderer: 'svg' | 'canvas' = 'svg';
  @Input() loadingLabel = 'Chargement des données...';
  @Input() noDataLabel = 'Aucune donnée';
  @Input() group: string | null = null;
  @Input() groupSync: GroupSyncMode | null = null;

  private get _group(): string | null {
    return this.group ?? this._config?.group ?? null;
  }

  private get _groupSync(): GroupSyncMode {
    return this.groupSync ?? this._config?.groupSync ?? 'all';
  }

  @Output() customEvent = new EventEmitter<ChartCustomEvent>();
  @Output() chartClick = new EventEmitter<any>();

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      asapScheduler.schedule(() => {
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
      asapScheduler.schedule(() => this._render(changes));
    });
  }

  ngOnDestroy(): void {
    if (this._group) {
      const set = ChartDirective._groupRegistry.get(this._group);
      if (set) {
        set.delete(this);
        if (set.size === 0) ChartDirective._groupRegistry.delete(this._group);
      }
    }
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    if (this._chartInstance) {
      this._chartInstance.dispose();
      this._chartInstance = null;
    }
  }

  // Init

  private _initChart(): void {
    if (this._chartInstance) return;

    const dom = this.el.nativeElement as HTMLElement;
    this._chartInstance = echarts.init(dom, this.theme ?? undefined, {
      renderer: this.renderer,
    });

    this._chartInstance.on('click', (params: any) => {
      this.ngZone.run(() => this.chartClick.emit(params));
    });

    if (this._group) {
      const sync = this._resolveSync();
      if (sync === 'all') {
        // Synchronisation complète : zoom + tooltip + légende (comportement echarts natif)
        (this._chartInstance as any).group = this._group;
        echarts.connect(this._group);
      } else {
        // Synchronisation manuelle ciblée : la légende reste indépendante par graphique
        let set = ChartDirective._groupRegistry.get(this._group);
        if (!set) { set = new Set(); ChartDirective._groupRegistry.set(this._group, set); }
        set.add(this);

        if (sync.includes('datazoom')) {
          this._chartInstance.on('datazoom', (p: any) => this._syncDataZoom(p));
        }
        if (sync.includes('tooltip')) {
          // Synchronisation via valeur axe X → conversion pixel/valeur pour aligner les tooltips
          // même si les graphiques ont des marges différentes (labels Y-axis de largeur variable)
          this._chartInstance.getZr().on('mousemove', (e: any) => {
            if (this._isSyncing) return;
            const peers = ChartDirective._groupRegistry.get(this._group!);
            if (!peers) return;
            // Convertir le pixel X source en valeur sur l'axe X (timestamp, index, etc.)
            const xValue = (this._chartInstance as any).convertFromPixel({ xAxisIndex: 0 }, e.offsetX);
            if (xValue === null || xValue === undefined) return;
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
          });
        }
      }
    }

    this._setupResizeObserver(dom);
  }

  private _resolveSync(): 'all' | GroupSyncAction[] {
    const gs = this._groupSync;
    if (!gs || gs === 'all') return 'all';
    if (Array.isArray(gs)) return gs;
    return [gs];
  }

  private _syncDataZoom(params: any): void {
    if (this._isSyncing || !this._group) return;
    const peers = ChartDirective._groupRegistry.get(this._group);
    if (!peers) return;
    const source = params.batch?.[0] ?? params;
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
    this._resizeObserver = new ResizeObserver(() => {
      this.ngZone.runOutsideAngular(() => {
        if (this._chartInstance) {
          this._chartInstance.resize();
        } else {
          // Init différée : le container a maintenant des dimensions
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
        this._chartInstance.setOption(option, { notMerge: false, replaceMerge: ['series', 'xAxis', 'yAxis'], lazyUpdate: false });
      }
    } catch (e) {
      console.error('[jquery-echarts] Erreur lors de la construction ou du rendu :', e);
    }
  }

  private _buildFullOption(): EChartsOption {
    const configurator = resolveConfigurator(this._type);
    const commonChart = configurator.buildChartData(this.data, this._config, this._type);
    const base = buildBaseOption(this._config);
    const typeSpecific = configurator.buildOption(commonChart, this._type, this._config);
    const tooltipOverride: EChartsOption = {
      tooltip: buildTooltipOption(configurator.tooltipTrigger, this.el.nativeElement),
    };
    const merged = applyCommonConfig(
      { ...base, ...typeSpecific, ...tooltipOverride },
      this._config
    );
    return merged;
  }

  // Loading / No-data

  private _applyLoadingState(): void {
    if (!this._chartInstance) return;
    if (this._isLoading) {
      this._chartInstance.setOption({ series: [], graphic: [] }, { notMerge: true });
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
  }

  // Export

  exportImage(fileName = 'chart', type?: 'png' | 'jpeg' | 'svg', pixelRatio = 2): void {
    if (!this._chartInstance) return;
    // Avec le renderer SVG, getDataURL ne peut pas produire un PNG valide.
    // On choisit automatiquement le bon format selon le renderer actif.
    const effectiveType = type ?? (this.renderer === 'svg' ? 'svg' : 'png');
    const url = this._chartInstance.getDataURL({ type: effectiveType, pixelRatio, backgroundColor: '#fff' });
    const link = document.createElement('a');
    link.download = `${fileName}.${effectiveType}`;
    link.href = url;
    link.click();
  }

  exportData(fileName = 'data', separator = ';'): void {
    if (!this.data?.length) return;
    const keys = Object.keys(this.data[0]);
    const rows = this.data.map(row => keys.map(k => {
      const v = row[k];
      const s = v == null ? '' : String(v);
      return s.includes(separator) || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
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
}
