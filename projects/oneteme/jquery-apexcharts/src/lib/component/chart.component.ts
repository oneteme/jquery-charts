import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  ChartClickEvent,
  ChartCustomEvent,
  ChartDrilldownConfig,
  ChartDrilldownRequest,
  ChartDrilldownState,
  ChartExportImageType,
  ChartProvider,
  ChartRenderError,
  ChartType,
  cloneSerializable,
  containsFunction,
  FullscreenManager,
  GroupSyncMode,
  OrganizerConfig,
  OrganizerState,
  VisualCopyFeedbackConfig,
  VisualSnapshot,
  VisualSnapshotApplyResult,
  VisualSnapshotDraft,
  VisualSnapshotStorage,
  XaxisType,
  YaxisType,
} from '@oneteme/jquery-core';
import { ApexChartHandle } from '../directive/apex-chart.directive';
import { BarChartDirective } from '../directive/bar-chart.directive';
import { LineChartDirective } from '../directive/line-chart.directive';
import { PieChartDirective } from '../directive/pie-chart.directive';
import { RangeChartDirective } from '../directive/range-chart.directive';
import { TreemapChartDirective } from '../directive/treemap-chart.directive';
import { ChartViewFacade } from './view/chart-view.facade';

@Component({
  standalone: true,
  imports: [CommonModule, PieChartDirective, BarChartDirective, LineChartDirective, RangeChartDirective, TreemapChartDirective],
  selector: 'chart',
  templateUrl: './chart.component.html',
  styles: [`
    :host { display: block; width: 100%; height: 100%; min-height: 0; }
    :host.visual-fullscreen { width: 100vw; height: 100vh; background: #fff; }
    .chart-frame { position: relative; display: flex; width: 100%; height: 100%; min-height: 0; flex-direction: column; }
    .chart-canvas { width: 100%; height: 100%; min-height: 0; flex: 1; }
    .chart-drilldown-nav { display: flex; min-height: 14px; flex-wrap: wrap; align-items: center; gap: 4px; padding: 0 8px 2px; }
    .chart-drilldown-link { padding: 0; border: 0; background: transparent; color: #1b6ca8; cursor: pointer; font: inherit; font-size: 12px; }
    .chart-drilldown-link[aria-current='page'] { color: #18323a; cursor: default; font-weight: 700; }
    .chart-drilldown-separator { color: #8aa0a5; font-size: 12px; }
    .visual-copy-feedback { position: absolute; top: 10px; left: 50%; z-index: 2; transform: translateX(-50%); padding: 7px 12px; border: 1px solid #c7dfd1; border-radius: 5px; background: rgba(244, 251, 247, .96); color: #24613b; font-size: 12px; pointer-events: none; }
  `],
})
export class ChartComponent<X extends XaxisType, Y extends YaxisType> implements OnChanges, OnDestroy {
  private readonly element = inject(ElementRef<HTMLElement>);

  @HostBinding('class.visual-fullscreen') isFullscreen = false;
  @HostBinding('class.drilldown-active') get hasActiveDrilldown(): boolean {
    return this.drilldownIsActive;
  }
  @HostBinding('style.height') get hostHeight(): string | null {
    return typeof this.config?.height === 'number' && Number.isFinite(this.config.height)
      ? `${this.config.height}px`
      : null;
  }

  protected readonly _charts: {
    [key: string]: { possibleType: ChartType[]; canPivot?: boolean };
  } = {
    pie: { possibleType: ['pie', 'donut', 'polar', 'radar', 'radial'] },
    donut: { possibleType: ['pie', 'donut', 'polar', 'radar', 'radial'] },
    polar: { possibleType: ['pie', 'donut', 'polar', 'radar', 'radial'] },
    radar: { possibleType: ['pie', 'donut', 'polar', 'radar', 'radial'] },
    radial: { possibleType: ['pie', 'donut', 'polar', 'radar', 'radial'] },
    line: { possibleType: ['line', 'area'] },
    area: { possibleType: ['line', 'area'] },
    bar: { possibleType: ['bar', 'column', 'heatmap', 'treemap'] },
    column: { possibleType: ['bar', 'column', 'heatmap', 'treemap'] },
    heatmap: { possibleType: ['bar', 'column', 'heatmap', 'treemap'] },
    treemap: { possibleType: ['bar', 'column', 'heatmap', 'treemap'] },
    funnel: { possibleType: ['funnel', 'pyramid'], canPivot: false },
    pyramid: { possibleType: ['funnel', 'pyramid'], canPivot: false },
    rangeArea: { possibleType: ['rangeArea', 'rangeBar', 'rangeColumn'], canPivot: false },
    rangeBar: { possibleType: ['rangeArea', 'rangeBar', 'rangeColumn'] },
    rangeColumn: { possibleType: ['rangeArea', 'rangeBar', 'rangeColumn'] },
  };

  _type: ChartType;

  @Input({ required: true }) set type(type: ChartType) {
    this._type = type;
  }

  @Input({ required: true }) config!: ChartProvider<X, Y>;
  @Input({ required: true }) data: any[] = [];
  @Input() isLoading = false;
  @Input() debug = false;
  @Input() loadingLabel = 'Chargement des données...';
  @Input() noDataLabel = 'Aucune donnée';
  @Input() enablePivot = false;
  @Input() renderedOption?: unknown;
  @Input() theme: Record<string, unknown> | null = null;
  @Input() group: string | null = null;
  @Input() groupSync: GroupSyncMode | null = null;
  @Input() organizer?: OrganizerConfig;
  /** Alias historique conservé pour les consommateurs existants. */
  @Input() view?: OrganizerConfig;
  @Input() organizerState?: OrganizerState;
  @Input() drilldown?: ChartDrilldownConfig;
  @Input() copyFeedback: VisualCopyFeedbackConfig = {};

  @Output() readonly customEvent = new EventEmitter<ChartCustomEvent>();
  @Output() readonly chartClick = new EventEmitter<ChartClickEvent>();
  @Output() readonly renderError = new EventEmitter<ChartRenderError>();
  @Output() readonly drilldownRequest = new EventEmitter<ChartDrilldownRequest>();
  @Output() readonly drilldownNavigate = new EventEmitter<string>();
  @Output() readonly drilldownStateChange = new EventEmitter<ChartDrilldownState>();
  @Output() readonly visualCopied = new EventEmitter<VisualSnapshot>();

  _effectiveConfig!: ChartProvider<X, Y>;

  readonly _organizerFacade = new ChartViewFacade<X, Y>();
  /** Alias interne conservé pour compatibilité avec la première façade ApexCharts. */
  readonly _viewFacade = this._organizerFacade;
  private copyFeedbackTimer?: number;
  private copyFeedbackMessage = '';
  private drilldownPath: Record<string, unknown> = {};

  @ViewChild(BarChartDirective) private readonly barDirective?: BarChartDirective<any>;
  @ViewChild(LineChartDirective) private readonly lineDirective?: LineChartDirective<any, any>;
  @ViewChild(PieChartDirective) private readonly pieDirective?: PieChartDirective;
  @ViewChild(RangeChartDirective) private readonly rangeDirective?: RangeChartDirective<any>;
  @ViewChild(TreemapChartDirective) private readonly treemapDirective?: TreemapChartDirective;

  get fullscreenSupported(): boolean {
    return FullscreenManager.isSupported(this.element.nativeElement);
  }

  get drilldownLevels(): ChartDrilldownConfig['levels'] {
    const levels = this.drilldown?.levels ?? [];
    const index = levels.findIndex(level => level.id === this.drilldown?.activeLevel);
    return index < 0 ? levels : levels.slice(0, index + 1);
  }

  get drilldownIsActive(): boolean {
    const levels = this.drilldown?.levels ?? [];
    return levels.findIndex(level => level.id === this.drilldown?.activeLevel) > 0;
  }

  get drilldownState(): ChartDrilldownState {
    return {
      active: this.drilldownIsActive,
      activeLevel: this.drilldown?.activeLevel ?? '',
      rootLevel: this.drilldown?.levels?.[0]?.id ?? null,
    };
  }

  get copyFeedbackText(): string {
    return this.copyFeedbackMessage;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['drilldown']) this.drilldownStateChange.emit(this.drilldownState);
    if (changes['config'] || changes['organizer'] || changes['organizerState'] || changes['view']) {
      if (this.config) {
        if (changes['config'] || changes['organizer'] || changes['view']) {
          this._organizerFacade.update(this.organizer ?? this.view ?? {}, this.config);
        }
        if (this.organizerState) this._organizerFacade.setState(this.organizerState);
      }
      this.refreshEffectiveConfig();
    }
  }

  ngOnDestroy(): void {
    if (this.copyFeedbackTimer !== undefined && typeof window !== 'undefined') {
      window.clearTimeout(this.copyFeedbackTimer);
    }
    this._organizerFacade.destroy();
  }

  change(event: ChartCustomEvent): void {
    if (this.changeType(event)) {
      this.customEvent.emit(event);
      return;
    }

    if (event === 'pivot') this.togglePivot();
    this.customEvent.emit(event);
  }

  private changeType(event: ChartCustomEvent): boolean {
    if (event !== 'previous' && event !== 'next') return false;
    const charts = this._charts[this._type]?.possibleType;
    if (!charts) return false;
    const index = charts.indexOf(this._type);
    if (index < 0) return false;
    if (event === 'previous') {
      this._type = index === 0 ? charts.at(-1)! : charts[index - 1];
    } else {
      this._type = index === charts.length - 1 ? charts[0] : charts[index + 1];
    }
    return true;
  }

  private togglePivot(): void {
    if (
      !this.enablePivot
      || this._charts[this._type]?.canPivot === false
      || !this.config
    ) return;

    this.config = this.config.pivot
      ? { ...this.config, pivot: false }
      : { ...this.config, pivot: true };
    this._organizerFacade.update(this.organizer ?? this.view ?? {}, this.config);
    if (this.organizerState) this._organizerFacade.setState(this.organizerState);
    this.refreshEffectiveConfig();
  }

  handleChartClick(event: ChartClickEvent): void {
    this.chartClick.emit(event);
    const levels = this.drilldown?.levels ?? [];
    const index = levels.findIndex(level => level.id === this.drilldown?.activeLevel);
    const active = levels[index];
    const next = levels[index + 1];
    if (!active || !next || event.name === undefined) return;

    const path = { ...this.drilldownPath, [active.id]: event.name };
    this.drilldownPath = path;
    this.drilldownRequest.emit({
      fromLevel: active.id,
      toLevel: next.id,
      groupBy: next.groupBy,
      value: event.name,
      path,
    });
  }

  navigateDrilldown(levelId: string): void {
    if (levelId === this.drilldown?.activeLevel) return;
    const targetIndex = this.drilldown?.levels.findIndex(level => level.id === levelId) ?? -1;
    if (targetIndex >= 0) {
      this.drilldownPath = Object.fromEntries(
        Object.entries(this.drilldownPath).filter(([level]) =>
          (this.drilldown?.levels.findIndex(item => item.id === level) ?? -1) < targetIndex,
        ),
      );
    }
    this.drilldownNavigate.emit(levelId);
  }

  exportImage(fileName?: string, type?: ChartExportImageType, pixelRatio?: number): void {
    this.activeDirective?.exportImage(fileName, type, pixelRatio);
  }

  exportData(fileName?: string, separator?: string): void {
    this.activeDirective?.exportData(fileName, separator);
  }

  async toggleFullscreen(): Promise<boolean> {
    try {
      const isFullscreen = await FullscreenManager.toggle(this.element.nativeElement);
      this.isFullscreen = isFullscreen;
      return isFullscreen;
    } catch {
      this.isFullscreen = false;
      return false;
    }
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    this.isFullscreen = FullscreenManager.isActive(this.element.nativeElement);
    this.activeDirective?.resize();
  }

  createVisualSnapshot(label = this.config?.title || 'Graphique'): VisualSnapshotDraft {
    const warnings: string[] = [];
    if (containsFunction(this.config)) {
      warnings.push('Certains providers ou callbacks du graphique ne sont pas transportables.');
    }
    return {
      type: 'chart',
      label,
      config: cloneSerializable({
        type: this._type,
        provider: this._effectiveConfig,
        theme: this.theme,
        renderedOption: this.activeDirective?.getRenderedOption(),
      }),
      state: cloneSerializable({
        selectedFieldIds: this._organizerFacade.state.selectedFieldIds,
      }),
      data: cloneSerializable(this.data ?? []),
      warnings,
    };
  }

  copyVisualSnapshot(label?: string): VisualSnapshot | null {
    const snapshotLabel = (label ?? this.config?.title ?? 'Graphique').trim();
    if (!snapshotLabel) return null;
    const snapshot = new VisualSnapshotStorage().create(this.createVisualSnapshot(snapshotLabel));
    this.visualCopied.emit(snapshot);
    this.showCopyFeedback();
    return snapshot;
  }

  applyVisualSnapshot(snapshot: VisualSnapshot): VisualSnapshotApplyResult {
    if (snapshot.type !== 'chart') {
      return {
        applied: false,
        restored: [],
        skipped: ['type'],
        warnings: ["Le snapshot n'est pas un graphique."],
      };
    }

    const selected = (snapshot.state as { selectedFieldIds?: string[] }).selectedFieldIds;
    const available = new Set(this._organizerFacade.viewFields.map(field => field.id));
    const compatible = selected?.filter(id => available.has(id)) ?? [];
    const skipped = selected?.filter(id => !available.has(id)) ?? [];
    if (selected) {
      this._organizerFacade.setState({
        selectedFieldIds: compatible,
        groupByKey: this._organizerFacade.state.groupByKey,
        dynamicSliceKeys: this._organizerFacade.state.dynamicSliceKeys,
      });
      this.refreshEffectiveConfig(true);
    }
    return {
      applied: true,
      restored: selected ? ['seriesVisibility'] : [],
      skipped,
      warnings: snapshot.warnings ?? [],
      data: cloneSerializable(snapshot.data),
    };
  }

  private refreshEffectiveConfig(applyState = this.organizerState !== undefined): void {
    this._effectiveConfig = this.config
      ? this._organizerFacade.getEffectiveProvider(applyState)
      : this.config;
  }

  private showCopyFeedback(): void {
    if (this.copyFeedback.enabled === false) return;
    this.copyFeedbackMessage = this.copyFeedback.message || 'Copié';
    if (this.copyFeedbackTimer !== undefined && typeof window !== 'undefined') {
      window.clearTimeout(this.copyFeedbackTimer);
    }
    if (typeof window !== 'undefined') {
      this.copyFeedbackTimer = window.setTimeout(
        () => this.copyFeedbackMessage = '',
        this.copyFeedback.durationMs ?? 2200,
      );
    }
  }

  private get activeDirective(): ApexChartHandle | undefined {
    return this.barDirective
      ?? this.lineDirective
      ?? this.pieDirective
      ?? this.rangeDirective
      ?? this.treemapDirective;
  }
}