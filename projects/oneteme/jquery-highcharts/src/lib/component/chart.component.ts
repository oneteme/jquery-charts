import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostBinding, HostListener, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import { ChartClickEvent, ChartDrilldownConfig, ChartDrilldownRequest, ChartDrilldownState, ChartExportImageType, ChartProvider, ChartRenderError, ChartType, cloneSerializable, containsFunction, FullscreenManager, GroupSyncMode, OrganizerConfig, OrganizerState, VisualCopyFeedbackConfig, VisualSnapshot, VisualSnapshotApplyResult, VisualSnapshotDraft, VisualSnapshotStorage, XaxisType, YaxisType } from '@oneteme/jquery-core';
import { Highcharts } from '../directive/utils/highcharts-modules';
import { ChartDirective } from '../directive/chart.directive';
import { ChartCustomEvent } from '../directive/utils';
import { ChartViewFacade } from './view/chart-view.facade';

const STANDARD_CHARTS: ChartType[] = [ 'line', 'area', 'spline', 'areaspline', 'bar', 'column', 'scatter', 'mixed' ];
const SIMPLE_CHARTS: ChartType[] = ['pie', 'donut', 'funnel', 'pyramid'];
const POLAR_CHARTS: ChartType[] = ['polar', 'radar', 'radarArea', 'radialBar'];
const RANGE_CHARTS: ChartType[] = [ 'columnrange', 'arearange', 'areasplinerange' ];
const BUBBLE_CHARTS: ChartType[] = ['bubble'];
const HEATMAP_CHARTS: ChartType[] = ['heatmap'];
const TREEMAP_CHARTS: ChartType[] = ['treemap'];
const MAP_CHARTS: ChartType[] = ['map'];

const ALL_COMPATIBLE_CHARTS: ChartType[] = [ ...STANDARD_CHARTS, ...SIMPLE_CHARTS, ...POLAR_CHARTS, ...RANGE_CHARTS, ...BUBBLE_CHARTS, ...HEATMAP_CHARTS, ...TREEMAP_CHARTS ];

@Component({
  standalone: true,
  imports: [CommonModule, ChartDirective],
  selector: 'chart',
  template: `<div class="chart-frame" [class.chart-drilldown]="drilldown?.levels?.length">
    <nav *ngIf="drilldown?.levels?.length" class="chart-drilldown-nav" aria-label="Navigation du graphique">
      <ng-container *ngIf="drilldownIsActive">
        <ng-container *ngFor="let level of drilldownLevels; let last = last">
          <button type="button" class="chart-drilldown-link" [attr.aria-current]="last ? 'page' : null" [disabled]="last" (click)="navigateDrilldown(level.id)">{{ level.label }}</button>
          <span class="chart-drilldown-separator" *ngIf="!last" aria-hidden="true">&gt;</span>
        </ng-container>
      </ng-container>
    </nav>
    <div class="visual-copy-feedback" *ngIf="copyFeedbackMessage" role="status">{{ copyFeedbackMessage }}</div>
    <div
    chart-directive
    [type]="_type"
    [config]="_effectiveConfig"
    [data]="data"
    [possibleTypes]="possibleTypes"
    [debug]="debug"
    [renderedOption]="renderedOption"
    [loadingLabel]="loadingLabel"
    [noDataLabel]="noDataLabel"
    [theme]="theme"
    [group]="group"
    [groupSync]="groupSync"
    [canPivot]="enablePivot && _charts[_type]?.canPivot !== false"
    [isLoading]="isLoading"
    (customEvent)="change($event)"
    (chartClick)="handleChartClick($event)"
    (renderError)="renderError.emit($event)"
  ></div></div>`,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 0;
        aspect-ratio: 3 / 2;
        overflow: hidden;
      }
      :host.visual-fullscreen { width: 100vw; height: 100vh; aspect-ratio: auto; background: #fff; }
      :host ::ng-deep .highcharts-container,
      :host ::ng-deep svg {
        width: 100% !important;
      }
      .chart-frame { position: relative; width: 100%; height: 100%; min-height: 0; display: flex; flex-direction: column; }
      .chart-frame > div[chart-directive] { flex: 1; min-height: 0; }
      .chart-drilldown-nav { min-height: 14px; padding: 0 8px 2px; }
      .chart-drilldown-link { padding: 0; border: 0; background: transparent; color: #1b6ca8; cursor: pointer; font: inherit; font-size: 12px; }
      .chart-drilldown-link[aria-current='page'] { color: #18323a; cursor: default; font-weight: 700; }
      .chart-drilldown-separator { color: #8aa0a5; font-size: 12px; margin: 0 4px; }
      .visual-copy-feedback { position: absolute; top: 10px; left: 50%; z-index: 2; transform: translateX(-50%); padding: 7px 12px; border: 1px solid #c7dfd1; border-radius: 5px; background: rgba(244, 251, 247, .96); color: #24613b; font-size: 12px; }
    `,
  ],
})
export class ChartComponent<X extends XaxisType, Y extends YaxisType> implements OnChanges, OnDestroy {
  private readonly _element = inject(ElementRef<HTMLElement>);
  @HostBinding('class.visual-fullscreen') _isFullscreen = false;
  @HostBinding('style.height') get hostHeight(): string | null {
    return typeof this.config?.height === 'number' && Number.isFinite(this.config.height)
      ? `${this.config.height}px`
      : null;
  }
  @HostBinding('class.drilldown-active') get hasActiveDrilldown(): boolean { return this.drilldownIsActive; }

  protected _charts: {
    [key: string]: { possibleType: ChartType[]; canPivot?: boolean };
  } = {
    line: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: true },
    area: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: true },
    spline: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: true },
    areaspline: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: true },
    bar: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: true },
    column: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: true },
    columnpyramid: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: true },
    scatter: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },
    mixed: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: true },

    pie: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },
    donut: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },
    funnel: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },
    pyramid: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },

    polar: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },
    radar: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },
    radarArea: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },
    radialBar: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },

    columnrange: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },
    arearange: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },
    areasplinerange: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },

    bubble: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },

    heatmap: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },

    treemap: { possibleType: ALL_COMPATIBLE_CHARTS, canPivot: false },

    map: { possibleType: MAP_CHARTS, canPivot: false },
  };

  _type: ChartType;

  @Input({ required: true }) set type(type: ChartType) {
    this._type = type;
  }
  @Input({ required: true }) config!: ChartProvider<X, Y>;
  @Input({ required: true }) data!: any[];
  @Input() possibleTypes?: ChartType[];
  @Input() debug: boolean = false;
  @Input() isLoading: boolean = false;
  @Input() enablePivot: boolean = false;
  @Input() organizer?: OrganizerConfig;
  @Input() organizerState?: OrganizerState;
  @Input() renderedOption?: Highcharts.Options | null;
  @Input() loadingLabel = 'Chargement des données...';
  @Input() noDataLabel = 'Aucune donnée';
  @Input() theme: Highcharts.Options | null = null;
  @Input() group: string | null = null;
  @Input() groupSync: GroupSyncMode | null = null;
  @Input() drilldown?: ChartDrilldownConfig;
  @Input() copyFeedback: VisualCopyFeedbackConfig = {};

  _effectiveConfig!: ChartProvider<X, Y>;

  readonly _organizerFacade = new ChartViewFacade<X, Y>();
  @ViewChild(ChartDirective) private _directive?: ChartDirective<X, Y>;

  @Output() customEvent = new EventEmitter<ChartCustomEvent>();
  @Output() chartClick = new EventEmitter<ChartClickEvent>();
  @Output() renderError = new EventEmitter<ChartRenderError>();
  @Output() drilldownRequest = new EventEmitter<ChartDrilldownRequest>();
  @Output() drilldownNavigate = new EventEmitter<string>();
  @Output() drilldownStateChange = new EventEmitter<ChartDrilldownState>();
  @Output() visualCopied = new EventEmitter<VisualSnapshot>();

  copyFeedbackMessage = '';
  private _copyFeedbackTimer?: number;
  private drilldownPath: Record<string, unknown> = {};

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

  get fullscreenSupported(): boolean {
    return FullscreenManager.isSupported(this._element.nativeElement);
  }

  navigateDrilldown(levelId: string): void {
    if (levelId === this.drilldown?.activeLevel) return;
    const targetIndex = this.drilldown?.levels.findIndex(level => level.id === levelId) ?? -1;
    if (targetIndex >= 0) {
      this.drilldownPath = Object.fromEntries(Object.entries(this.drilldownPath)
        .filter(([level]) => (this.drilldown?.levels.findIndex(item => item.id === level) ?? -1) < targetIndex));
    }
    this.drilldownNavigate.emit(levelId);
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

  exportImage(fileName?: string, type?: ChartExportImageType, pixelRatio?: number): void {
    this._directive?.exportImage(fileName, type, pixelRatio);
  }

  exportData(fileName?: string, separator?: string): void {
    this._directive?.exportData(fileName, separator);
  }

  zoomOut(): void {
    this._directive?.zoomOut();
  }

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
  }

  createVisualSnapshot(label = this.config?.title || 'Graphique'): VisualSnapshotDraft {
    const warnings: string[] = [];
    if (containsFunction(this.config)) warnings.push('Certains providers ou callbacks du graphique ne sont pas transportables.');
    return {
      type: 'chart',
      label,
      config: cloneSerializable({
        type: this._type,
        provider: this._effectiveConfig,
        theme: this.theme,
        renderedOption: this._directive?.getRenderedOption(),
      }),
      state: cloneSerializable({ selectedFieldIds: this._organizerFacade.state.selectedFieldIds }),
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
      return { applied: false, restored: [], skipped: ['type'], warnings: ['Le snapshot n’est pas un graphique.'] };
    }
    const selected = (snapshot.state as { selectedFieldIds?: string[] }).selectedFieldIds;
    const available = new Set(this._organizerFacade.viewFields.map(field => field.id));
    const compatible = selected?.filter(id => available.has(id)) ?? [];
    const skipped = selected?.filter(id => !available.has(id)) ?? [];
    if (selected) {
      this._organizerFacade.state.selectedFieldIds = compatible;
      this.refreshEffectiveConfig(true);
    }
    return { applied: true, restored: selected ? ['seriesVisibility'] : [], skipped, warnings: snapshot.warnings ?? [], data: cloneSerializable(snapshot.data) };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['drilldown']) this.drilldownStateChange.emit(this.drilldownState);
    if (changes['config'] || changes['organizer'] || changes['organizerState']) {
      if (this.config) {
        if (changes['config'] || changes['organizer']) this._organizerFacade.update(this.organizer ?? {}, this.config);
        if (this.organizerState) this._organizerFacade.setState(this.organizerState);
      }
      this.refreshEffectiveConfig();
    }
  }

  ngOnDestroy(): void {
    if (this._copyFeedbackTimer !== undefined && typeof window !== 'undefined') {
      window.clearTimeout(this._copyFeedbackTimer);
    }
    this._organizerFacade.destroy();
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

  private refreshEffectiveConfig(applyState = this.organizerState !== undefined): void {
    if (!this.config) return;
    this._effectiveConfig = this._organizerFacade.getEffectiveProvider(applyState) ?? this.config;
  }

  change(event: ChartCustomEvent) {
    const charts = this.possibleTypes || this._charts[this._type]?.possibleType;
    if (!charts) return;

    const indexOf = charts.indexOf(this._type);
    if (indexOf !== -1) {
      if (event === 'previous') {
        this._type =
          indexOf === 0 ? charts[charts.length - 1] : charts[indexOf - 1];
        return;
      }
      if (event === 'next') {
        this._type =
          indexOf === charts.length - 1 ? charts[0] : charts[indexOf + 1];
        return;
      }
    }
    if (event === 'pivot') {
      this.config = this.config.pivot
        ? { ...this.config, pivot: false }
        : { ...this.config, pivot: true };
      this._organizerFacade.update(this.organizer ?? {}, this.config);
      if (this.organizerState) this._organizerFacade.setState(this.organizerState);
      this.refreshEffectiveConfig();
    }

    this.customEvent.emit(event);
  }
}
