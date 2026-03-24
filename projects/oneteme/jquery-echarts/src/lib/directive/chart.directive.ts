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
@Directive({
  standalone: true,
  selector: '[echarts-chart]',
})
export class ChartDirective<X extends XaxisType, Y extends YaxisType>
  implements ChartView<X, Y>, OnChanges, AfterViewInit, OnDestroy
{
  private readonly el: ElementRef = inject(ElementRef);
  private readonly ngZone = inject(NgZone);

  private _chartInstance: ReturnType<typeof echarts.init> | null = null;
  private _resizeObserver: ResizeObserver | null = null;
  private _initialized = false;

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

    this._setupResizeObserver(dom);
  }

  private _setupResizeObserver(dom: HTMLElement): void {
    this._resizeObserver = new ResizeObserver(() => {
      this.ngZone.runOutsideAngular(() => {
        if (!this._chartInstance) {
          // Init différée : le container a maintenant des dimensions
          this._initChart();
          this._render();
        } else {
          this._chartInstance.resize();
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
      tooltip: buildTooltipOption(configurator.tooltipTrigger),
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
