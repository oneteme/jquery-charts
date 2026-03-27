import {
  AfterViewInit,
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
import { ChartProvider, ChartType, ChartView, XaxisType, YaxisType } from '@oneteme/jquery-core';
import { asapScheduler } from 'rxjs';

import { echarts } from './utils/echarts-init';
import { EChartsOption, ChartCustomEvent, DEFAULT_LOADING_OPTION } from './utils/types';
import { applyCommonConfig, buildBaseOption, buildNoDataGraphic, buildTooltipOption } from './utils/chart-utils';
import { resolveConfigurator } from './utils/config/chart-config-registry';

/**
 * Directive principale du renderer ECharts.
 *
 * Orchestre le cycle de vie complet :
 *  1. Initialisation de l'instance ECharts après affichage DOM
 *  2. Mise à jour via `setOption` lors des changements Angular
 *  3. Gestion native loading / no-data via l'API ECharts
 *  4. Redimensionnement automatique via ResizeObserver
 *  5. Dispatch vers le bon configurateur via le registry
 */
/** Actions synchronisables entre graphiques d'un même groupe. */
export type GroupSyncAction = 'datazoom' | 'tooltip';

/**
 * Mode de synchronisation du groupe :
 * - `'all'` : synchronisation complète via `echarts.connect()` (zoom + tooltip + légende)
 * - `'datazoom'` | `'tooltip'` | `Array<...>` : synchronisation manuelle ciblée,
 *   sans impact sur la sélection de légende des autres graphiques.
 */
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

  /**
   * Moteur de rendu ECharts.
   * - `'svg'` (défaut) : rendu vectoriel, meilleure qualité visuelle, export SVG natif
   * - `'canvas'` : rendu raster, meilleures performances sur grands volumes de données
   *
   * Note : le renderer ne peut pas être changé à chaud après initialisation.
   * Un changement de valeur après le premier rendu n'aura aucun effet.
   */
  @Input() renderer: 'svg' | 'canvas' = 'svg';

  /** Message affiché pendant le chargement. Peut être surchargé par l'utilisateur. */
  @Input() loadingLabel = 'Chargement des données...';

  /** Message affiché quand aucune donnée n'est disponible. Peut être surchargé. */
  @Input() noDataLabel = 'Aucune donnée';

  /**
   * Groupe de synchronisation.
   * Peut aussi être défini via `config.group`.
   * L'input HTML a priorité sur la config.
   */
  @Input() group: string | null = null;

  /**
   * Définit ce qui est synchronisé entre les graphiques du groupe.
   * Peut aussi être défini via `config.groupSync`.
   * - `'all'` (défaut) : synchronisation complète via `echarts.connect()` — zoom, tooltip ET légende.
   * - `'datazoom'` : seul le zoom est synchronisé (légende indépendante par graphique).
   * - `'tooltip'` : seul le crosshair/tooltip est synchronisé.
   * - `['datazoom', 'tooltip']` : zoom + tooltip synchronisés, légende indépendante.
   */
  @Input() groupSync: GroupSyncMode | null = null;

  private get _group(): string | null {
    return this.group ?? this._config?.group ?? null;
  }

  private get _groupSync(): GroupSyncMode {
    return this.groupSync ?? this._config?.groupSync ?? 'all';
  }

  @Output() customEvent = new EventEmitter<ChartCustomEvent>();

  // ─── Cycle de vie Angular ────────────────────────────────────────────────

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
      ChartDirective._groupRegistry.get(this._group)?.delete(this);
    }
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    if (this._chartInstance) {
      this._chartInstance.dispose();
      this._chartInstance = null;
    }
  }

  // ─── Initialisation ECharts ───────────────────────────────────────────────

  private _initChart(): void {
    if (this._chartInstance) return;

    const dom = this.el.nativeElement as HTMLElement;
    this._chartInstance = echarts.init(dom, this.theme ?? undefined, {
      renderer: this.renderer,
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

  /** @deprecated Remplacé par le listener ZRender mousemove — conservé pour compatibilité */
  private _syncTooltip(_params: any): void {}
  private _syncHideTip(): void {}

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

  // ─── Rendu ────────────────────────────────────────────────────────────────

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
      const option = { ...this._buildFullOption(), graphic: [] };
      if (this.debug) console.log('[jquery-echarts] setOption', option);
      this._chartInstance.setOption(option, { notMerge: true, lazyUpdate: false });
    } catch (e) {
      console.error('[jquery-echarts] Erreur lors de la construction ou du rendu :', e);
    }
  }

  private _buildFullOption(): EChartsOption {
    const configurator = resolveConfigurator(this._type);

    // 1. Construit le CommonChart via le configurateur (buildChart ou buildSingleSerieChart)
    const commonChart = configurator.buildChartData(this.data, this._config, this._type);

    // 2. Option de base : title, legend, grid, toolbox
    const base = buildBaseOption(this._config);

    // 3. Option spécifique au type
    const typeSpecific = configurator.buildOption(commonChart, this._type, this._config);

    // 4. Surcharge tooltip : trigger correct + style professionnel conservé
    const tooltipOverride: EChartsOption = {
      tooltip: buildTooltipOption(configurator.tooltipTrigger, this.el.nativeElement),
    };

    // 5. Fusion dans l'ordre : base ← typeSpecific ← tooltipOverride ← options user
    const merged = applyCommonConfig(
      { ...base, ...typeSpecific, ...tooltipOverride },
      this._config
    );

    return merged;
  }

  // ─── Loading / No-data ───────────────────────────────────────────────────

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
}
