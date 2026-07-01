import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, isObservable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  OrganizerConfig,
  OrganizerButtonEvent,
  OrganizerSliceState,
  OrganizerState,
} from '../models';

/**
 * OrganizerButtonComponent
 *
 * Context-agnostic button component for managing view state across any context.
 *
 * Key Features:
 * - Zero dependency on renderers (table, chart, KPI, etc.)
 * - Configuration via @Input (explicit, no auto-discovery)
 * - mat-menu for accessibility and UX
 * - Lazy-loading with FieldState tracking
 * - Intelligent caching to avoid re-fetches
 * - Events-only interface (@Output)
 *
 * Usage:
 * ```html
 * <organizer-button
 *   [config]="config"
 *   [state]="currentState"
 *   (viewChange)="handleViewChange($event)">
 * </organizer-button>
 * ```
 */
@Component({
  standalone: true,
  imports: [ CommonModule, MatButtonModule, MatIconModule, MatMenuModule, MatDividerModule ],
  selector: 'organizer-button',
  templateUrl: './organizer-button.component.html',
  styleUrls: ['./organizer-button.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganizerButtonComponent implements OnInit, OnDestroy {
  /**
   * Configuration object containing menu structure and callbacks
   */
  @Input() config!: OrganizerConfig;

  /**
   * Current organizer state (optional - for display purposes)
   * Used to show which options are currently selected
   */
  @Input() state?: OrganizerState;

  /**
   * Hide the summary values displayed next to menu labels
   * Set to true for charts to reduce menu size (values visible on hover anyway)
   * Default: false (show values for tables)
   */
  @Input() hideMenuValues = false;

  /**
   * Event emitted when view configuration changes
   * Parent listens and updates its state accordingly
   */
  @Output() viewChange = new EventEmitter<OrganizerButtonEvent>();

  /**
   * Emitted when a filter slice is selected and data is loaded.
   * Emits null when the filter is deselected (slice-panel should be hidden).
   * Only emitted when config.onFetchSliceData is provided.
   */
  @Output() sliceStateChange = new EventEmitter<OrganizerSliceState | null>();

  /** Field currently being loaded (for spinner display) */
  loadingFieldId?: string;

  private fieldDataCache = new Map<string, any[]>();
  private destroy$ = new Subject<void>();

  @ViewChild('mainMenuTrigger') mainMenuTrigger?: MatMenuTrigger;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Mode TABLE ────────────────────────────────────────────────────────────

  isFieldVisible(fieldId: string): boolean {
    const visible = this.state?.visibleFields;
    if (!visible) {
      return this.config.fields?.find(f => f.id === fieldId)?.visible !== false;
    }
    return visible.includes(fieldId);
  }

  fieldsSummary(): string {
    const total = this.config.fields?.length ?? 0;
    const visible = this.state?.visibleFields?.length ?? total;
    return `${visible}/${total}`;
  }

  onFieldToggle(fieldId: string, visible: boolean): void {
    const visibleFields = this.state?.visibleFields || [];
    const updated = visible
      ? [...visibleFields, fieldId]
      : visibleFields.filter(f => f !== fieldId);
    this.emitChange('fieldToggled', { visibleFields: updated });
  }

  // ── Mode CHART — Axe X ────────────────────────────────────────────────────

  onXFieldSelect(fieldId: string): void {
    this.emitChange('xSelected', { selectedX: fieldId });
  }

  // ── Mode CHART — Axe Y ────────────────────────────────────────────────────

  /** Sélection directe d'un champ Y sans agrégat (ex: Count, elapsedP50...) */
  onYFieldSelect(fieldId: string): void {
    this.emitChange('ySelected', {
      selectedY: fieldId,
      selectedYAggregate: undefined
    });
  }

  /** Sélection d'un agrégat pour un champ Y numérique (ex: Durée → P50) */
  onYAggregateSelect(yFieldId: string, aggregateId: string): void {
    this.emitChange('ySelected', {
      selectedY: yFieldId,
      selectedYAggregate: aggregateId
    });
  }

  // ── Grouper par ────────────────────────────────────────────────────────────

  onGroupBySelect(groupId: string): void {
    const current = this.state.selectedGroupBy;
    this.emitChange('groupBySelected', { selectedGroupBy: current === groupId ? undefined : groupId });
  }

  // ── Template ───────────────────────────────────────────────────────────────

  onTemplateSelect(templateId: string): void {
    const t = this.config.templates?.find(tmpl => tmpl.id === templateId);
    if (!t) return;
    this.emitChange('templateSelected', {
      selectedTemplate: templateId,
      selectedX: t.xField,
      selectedY: t.yField,
      selectedYAggregate: t.yAggregate,
      selectedGroupBy: t.groupBy
    });
  }

  // ── Filtrer par (Slices) ───────────────────────────────────────────────────

  onSliceClick(sliceId?: string): void {
    if (this.config.onSliceClick) {
      this.config.onSliceClick();
    }

    const selectedSlices = this.state?.selectedSlices || [];
    let updated: string[];
    if (sliceId) {
      updated = selectedSlices.includes(sliceId) ? [] : [sliceId];
    } else {
      updated = selectedSlices;
    }

    if (updated.length === 0 || !sliceId || !this.config.onFetchSliceData) {
      if (this.config.onFetchSliceData) {
        this.sliceStateChange.emit(null);
      }
      this.emitChange('sliceSelected', { selectedSlices: updated });
      return;
    }

    const slice = this.config.slices?.find(s => s.id === sliceId);
    const result = this.config.onFetchSliceData(sliceId);
    const handleData = (tasks: any[]) => {
      this.sliceStateChange.emit({
        sliceConfigs: [{ title: slice?.label ?? sliceId, columnKey: sliceId }],
        tasks
      });
      this.emitChange('sliceSelected', { selectedSlices: updated });
    };
    if (isObservable(result)) {
      result.pipe(takeUntil(this.destroy$)).subscribe({ next: handleData });
    } else {
      result.then(handleData);
    }
  }

  // ── Lazy-loading champ ─────────────────────────────────────────────────────

  async loadFieldData(fieldId: string): Promise<void> {
    if (this.fieldDataCache.has(fieldId)) return;
    if (!this.config.onFetchFieldData) return;

    const field = this.config.fields?.find(f => f.id === fieldId);
    if (!field) return;

    this.loadingFieldId = fieldId;
    this.cdr.markForCheck();

    try {
      const data = await this.config.onFetchFieldData(fieldId);
      this.fieldDataCache.set(fieldId, data);
    } finally {
      this.loadingFieldId = undefined;
      this.cdr.markForCheck();
    }
  }

  // ── Export / Préférences ───────────────────────────────────────────────────

  onExport(): void {
    if (this.config.onExport) this.config.onExport();
    this.mainMenuTrigger?.closeMenu();
  }

  onExportVisual(): void {
    if (this.config.onExportVisual) this.config.onExportVisual();
    this.mainMenuTrigger?.closeMenu();
  }

  onExportData(): void {
    if (this.config.onExportData) this.config.onExportData();
    this.mainMenuTrigger?.closeMenu();
  }

  hasExportSubMenu(): boolean {
    return !!(this.config.onExportVisual || this.config.onExportData);
  }

  hasSwitchView(): boolean {
    return !!this.config.switchView;
  }

  onSwitchView(): void {
    const sv = this.config.switchView;
    if (!sv) return;
    const newView: 'chart' | 'table' = sv.currentView === 'chart' ? 'table' : 'chart';
    sv.onSwitch(newView);
    this.emitChange('viewSwitched', { viewMode: newView });
    this.mainMenuTrigger?.closeMenu();
  }

  onPreferencesEdit(): void {
    if (this.config.onPreferencesEdit) this.config.onPreferencesEdit();
    this.mainMenuTrigger?.closeMenu();
  }

  onPreferencesSave(): void {
    if (this.config.onPreferencesSave) this.config.onPreferencesSave();
    this.mainMenuTrigger?.closeMenu();
  }

  onPreferencesClear(): void {
    if (this.config.onPreferencesClear) this.config.onPreferencesClear();
    this.mainMenuTrigger?.closeMenu();
  }

  onReset(): void {
    this.emitChange('reset', {
      visibleFields: [],
      selectedX: undefined,
      selectedY: undefined,
      selectedYAggregate: undefined,
      selectedGroupBy: undefined,
      selectedSlices: []
    });
  }

  // ── Labels résumé (affichage dans le menu principal) ─────────────────────

  activeXLabel(): string {
    const id = this.state?.selectedX;
    if (!id) return '';
    return this.config.xFields?.find(f => f.id === id)?.label ?? id;
  }

  activeYLabel(): string {
    const yId = this.state?.selectedY;
    if (!yId) return '';
    const yField = this.config.yFields?.find(f => f.id === yId);
    const base = yField?.label ?? yId;

    if (this.state?.selectedYAggregate) {
      const agg = yField?.aggregates?.find(a => a.id === this.state!.selectedYAggregate);
      return agg ? `${base} · ${agg.label}` : base;
    }
    return base;
  }

  activeGroupByLabel(): string {
    const id = this.state?.selectedGroupBy;
    if (!id) return '';
    return this.config.groups?.find(g => g.id === id)?.label ?? id;
  }

  activeSlicesLabel(): string {
    const ids = this.state?.selectedSlices;
    if (!ids?.length) return '';
    if (ids.length === 1) {
      return this.config.slices?.find(s => s.id === ids[0])?.label ?? ids[0];
    }
    return `${ids.length} sélectionnés`;
  }

  activeTemplateLabel(): string {
    const id = this.state?.selectedTemplate;
    if (!id) return '';
    return this.config.templates?.find(t => t.id === id)?.label ?? id;
  }

  // ── Helpers détection mode ────────────────────────────────────────────────

  hasChartFields(): boolean {
    return (this.config.xFields?.length ?? 0) > 0 || (this.config.yFields?.length ?? 0) > 0;
  }

  hasTableFields(): boolean {
    return (this.config.fields?.length ?? 0) > 0;
  }

  // ── Helpers Y sous-menu ────────────────────────────────────────────────────

  isYActive(yFieldId: string): boolean {
    return this.state?.selectedY === yFieldId;
  }

  isYAggregateActive(yFieldId: string, aggregateId: string): boolean {
    return this.state?.selectedY === yFieldId && this.state?.selectedYAggregate === aggregateId;
  }

  // ── Emit ──────────────────────────────────────────────────────────────────

  private emitChange(type: OrganizerButtonEvent['type'], stateUpdate: Partial<OrganizerState>): void {
    const event: OrganizerButtonEvent = {
      type,
      state: { ...this.state, ...stateUpdate },
      source: 'user'
    };
    this.viewChange.emit(event);
  }
}
