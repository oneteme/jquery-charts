import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostBinding, HostListener, inject, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { ChartExportImageType, ChartProvider, ChartType, cloneSerializable, containsFunction, FullscreenManager, OrganizerConfig, OrganizerState, VisualCopyFeedbackConfig, VisualSnapshot, VisualSnapshotApplyResult, VisualSnapshotDraft, VisualSnapshotStorage, XaxisType, YaxisType } from '@oneteme/jquery-core';
import { ChartDirective } from '../directive/chart.directive';
import { ChartClickEvent, ChartCustomEvent, ChartDrilldownConfig, ChartDrilldownRequest, ChartDrilldownState, ChartRenderError, EChartsOption, GroupSyncMode } from '../directive/utils/types';
import { ChartViewFacade } from './view/chart-view.facade';

@Component({
  standalone: true,
  imports: [CommonModule, ChartDirective],
  selector: 'chart',
  templateUrl: './chart.component.html',
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    :host.visual-fullscreen { width: 100vw; height: 100vh; background: #fff; }
    .chart-frame { position: relative; width: 100%; height: 100%; }
    .chart-drilldown { display: flex; flex-direction: column; }
    .chart-drilldown-nav { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; min-height: 14px; padding: 0 8px 2px; }
    .chart-drilldown-link { padding: 0; border: 0; background: transparent; color: #1b6ca8; cursor: pointer; font: inherit; font-size: 12px; }
    .chart-drilldown-link[aria-current='page'] { color: #18323a; cursor: default; font-weight: 700; }
    .chart-drilldown-separator { color: #8aa0a5; font-size: 12px; }
    .chart-canvas { min-height: 0; width: 100%; height: 100%; flex: 1; }
    .visual-copy-feedback {
      position: absolute;
      top: 10px;
      left: 50%;
      z-index: 2;
      transform: translateX(-50%);
      padding: 7px 12px;
      border: 1px solid #c7dfd1;
      border-radius: 5px;
      background: rgba(244, 251, 247, 0.96);
      color: #24613b;
      font-size: 12px;
      pointer-events: none;
    }
  `],
})
export class ChartComponent<X extends XaxisType, Y extends YaxisType> implements OnChanges, OnDestroy {
  private readonly _element = inject(ElementRef<HTMLElement>);
  @HostBinding('class.visual-fullscreen') _isFullscreen = false;
  @HostBinding('class.drilldown-active') get hasActiveDrilldown(): boolean { return this.drilldownIsActive; }

  @Input({ required: true }) type: ChartType;
  @Input({ required: true }) config: ChartProvider<X, Y>;
  @Input({ required: true }) data: any[];

  @Input() isLoading: boolean;
  @Input() debug: boolean;
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
  @Input() renderedOption?: EChartsOption | null;
  @Input() drilldown?: ChartDrilldownConfig;

  /** Active la gestion de la visibilité des séries via le panneau Organizer. */
  @Input() organizer?: OrganizerConfig;
  /** Etat Organizer controle par le parent, applique a la visibilite des series. */
  @Input() organizerState?: OrganizerState;
  @Input() copyFeedback: VisualCopyFeedbackConfig = {};

  _effectiveConfig!: ChartProvider<X, Y>;

  readonly _organizerFacade = new ChartViewFacade<X, Y>();

  @HostBinding('style.height') get hostHeight(): string | null {
    return this.config?.height ? `${this.config.height}px` : null;
  }

  @Output() customEvent = new EventEmitter<ChartCustomEvent>();
  @Output() chartClick = new EventEmitter<ChartClickEvent>();
  @Output() renderError = new EventEmitter<ChartRenderError>();
  @Output() drilldownRequest = new EventEmitter<ChartDrilldownRequest>();
  @Output() drilldownNavigate = new EventEmitter<string>();
  @Output() drilldownStateChange = new EventEmitter<ChartDrilldownState>();
  @Output() visualCopied = new EventEmitter<VisualSnapshot>();

  copyFeedbackMessage = '';
  private _copyFeedbackTimer?: number;
  private _fullscreenResizeFrame?: number;
  private drilldownPath: Record<string, unknown> = {};

  @ViewChild(ChartDirective) private _directive: ChartDirective<X, Y>;

  get drilldownLevels(): ChartDrilldownConfig['levels'] {
    const levels = this.drilldown?.levels ?? [];
    const activeIndex = levels.findIndex(level => level.id === this.drilldown?.activeLevel);
    return activeIndex < 0 ? levels : levels.slice(0, activeIndex + 1);
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

  navigateDrilldown(levelId: string): void {
    if (levelId === this.drilldown?.activeLevel) return;
    const targetIndex = this.drilldown?.levels.findIndex(level => level.id === levelId) ?? -1;
    if (targetIndex >= 0) {
      this.drilldownPath = Object.fromEntries(
        Object.entries(this.drilldownPath).filter(([level]) =>
          this.drilldown?.levels.findIndex(candidate => candidate.id === level) < targetIndex
        )
      );
    }
    this.drilldownNavigate.emit(levelId);
  }

  handleChartClick(event: ChartClickEvent): void {
    this.chartClick.emit(event);
    const levels = this.drilldown?.levels ?? [];
    const activeIndex = levels.findIndex(level => level.id === this.drilldown?.activeLevel);
    const nextLevel = levels[activeIndex + 1];
    const activeLevel = levels[activeIndex];
    if (!activeLevel || !nextLevel || event.name === undefined) {
      return;
    }

    const path = {...this.drilldownPath, [activeLevel.id]: event.name};
    this.drilldownPath = path;
    this.drilldownRequest.emit({
      fromLevel: activeLevel.id,
      toLevel: nextLevel.id,
      groupBy: nextLevel.groupBy,
      value: event.name,
      path
    });
  }

  exportImage(fileName?: string, type?: ChartExportImageType, pixelRatio?: number): void {
    this._directive?.exportImage(fileName, type, pixelRatio);
  }

  exportData(fileName?: string, separator?: string): void {
    this._directive?.exportData(fileName, separator);
  }

  get fullscreenSupported(): boolean { return FullscreenManager.isSupported(this._element.nativeElement); }

  async toggleFullscreen(): Promise<void> {
    try {
      await FullscreenManager.toggle(this._element.nativeElement);
    } catch {
      this._isFullscreen = false;
    }
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    this._isFullscreen = FullscreenManager.isActive(this._element.nativeElement);
    this.scheduleFullscreenResize();
  }

  /** Capture les données courantes et la configuration sérialisable du graphique. */
  createVisualSnapshot(label = this.config?.title || 'Graphique'): VisualSnapshotDraft {
    const warnings: string[] = [];
    if (containsFunction(this.config)) {
      warnings.push('Certains providers ou callbacks du graphique ne sont pas transportables.');
    }
    return {
      type: 'chart',
      label,
      config: cloneSerializable({
        type: this.type,
        provider: this._effectiveConfig,
        theme: this.theme,
        renderer: this.renderer,
        renderedOption: this._directive?.getRenderedOption(),
      }),
      state: cloneSerializable({
        selectedFieldIds: this._organizerFacade.state.selectedFieldIds,
      }),
      data: cloneSerializable(this.data ?? []),
      warnings,
    };
  }

  copyVisualSnapshot(label?: string): VisualSnapshot | null {
    const snapshotLabel = label ?? (this.config?.title || 'Graphique');
    if (!snapshotLabel?.trim()) return null;
    const snapshot = new VisualSnapshotStorage().create(this.createVisualSnapshot(snapshotLabel.trim()));
    this.visualCopied.emit(snapshot);
    this.showCopyFeedback();
    return snapshot;
  }

  /** Applique l'état de visibilité compatible et retourne les données capturées. */
  applyVisualSnapshot(snapshot: VisualSnapshot): VisualSnapshotApplyResult {
    if (snapshot.type !== 'chart') {
      return { applied: false, restored: [], skipped: ['type'], warnings: ['Le snapshot n\'est pas un graphique.'] };
    }
    const selectedFieldIds = (snapshot.state as { selectedFieldIds?: string[] }).selectedFieldIds;
    const availableIds = new Set(this._organizerFacade.viewFields.map(field => field.id));
    const compatibleIds = selectedFieldIds?.filter(id => availableIds.has(id)) ?? [];
    const skipped = selectedFieldIds?.filter(id => !availableIds.has(id)) ?? [];
    if (selectedFieldIds) {
      this._organizerFacade.state.selectedFieldIds = compatibleIds;
      this._effectiveConfig = this._organizerFacade.getEffectiveProvider(this.organizerState !== undefined);
    }
    return {
      applied: true,
      restored: selectedFieldIds ? ['seriesVisibility'] : [],
      skipped,
      warnings: snapshot.warnings ?? [],
      data: cloneSerializable(snapshot.data),
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['drilldown']) {
      this.drilldownStateChange.emit(this.drilldownState);
    }
    if (changes['config'] || changes['organizer'] || changes['organizerState']) {
      if (this.config) {
        if (changes['config'] || changes['organizer']) {
          this._organizerFacade.update(this.organizer ?? {}, this.config);
        }
        if (this.organizerState) {
          this._organizerFacade.setState(this.organizerState);
        }
      }
      this._effectiveConfig = this.config
        ? this._organizerFacade.getEffectiveProvider(this.organizerState !== undefined)
        : this.config;
    }
  }

  ngOnDestroy(): void {
    if (this._copyFeedbackTimer !== undefined && typeof window !== 'undefined') {
      window.clearTimeout(this._copyFeedbackTimer);
    }
    if (this._fullscreenResizeFrame !== undefined && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this._fullscreenResizeFrame);
    }
    this._organizerFacade.destroy();
  }

  private scheduleFullscreenResize(): void {
    if (typeof window === 'undefined') return;
    if (this._fullscreenResizeFrame !== undefined) {
      window.cancelAnimationFrame(this._fullscreenResizeFrame);
    }
    this._fullscreenResizeFrame = window.requestAnimationFrame(() => {
      this._fullscreenResizeFrame = window.requestAnimationFrame(() => {
        this._fullscreenResizeFrame = undefined;
        this._directive?.resize();
      });
    });
  }

  private showCopyFeedback(): void {
    if (this.copyFeedback.enabled === false) return;
    this.copyFeedbackMessage = this.copyFeedback.message || 'Copié';
    if (this._copyFeedbackTimer !== undefined && typeof window !== 'undefined') {
      window.clearTimeout(this._copyFeedbackTimer);
    }
    this._copyFeedbackTimer = typeof window !== 'undefined'
      ? window.setTimeout(() => this.copyFeedbackMessage = '', this.copyFeedback.durationMs ?? 2200)
      : undefined;
  }
}
