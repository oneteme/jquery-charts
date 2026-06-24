import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, isObservable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { OrganizerConfig, OrganizerButtonEvent, OrganizerSliceState, OrganizerState, FieldState } from '../models';

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

  /**
   * Field currently being loaded (for spinner display)
   */
  loadingFieldId?: string;

  /**
   * Cache for fetched field data to avoid re-fetches
   * Key: fieldId, Value: field data array
   */
  private fieldDataCache = new Map<string, any[]>();

  private destroy$ = new Subject<void>();

  @ViewChild('mainMenuTrigger') mainMenuTrigger?: MatMenuTrigger;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // No special init needed - mat-menu handles everything
    // Config validation can be added here if needed
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Vrai si le champ est visible selon l'état courant */
  isFieldVisible(fieldId: string): boolean {
    const visible = this.state?.visibleFields;
    if (!visible) {
      // Fallback sur field.visible si pas de state
      return this.config.fields?.find(f => f.id === fieldId)?.visible !== false;
    }
    return visible.includes(fieldId);
  }

  /** Résumé visible/total pour la section Champs */
  fieldsSummary(): string {
    const total = this.config.fields?.length ?? 0;
    const visible = this.state?.visibleFields?.length ?? total;
    return `${visible}/${total}`;
  }

  /**
   * Handle field visibility toggle
   * @param fieldId Field ID to toggle
   * @param visible New visibility state
   */
  onFieldToggle(fieldId: string, visible: boolean): void {
    const visibleFields = this.state?.visibleFields || [];
    const updated = visible
      ? [...visibleFields, fieldId]
      : visibleFields.filter(f => f !== fieldId);

    this.emitChange('fieldToggled', { visibleFields: updated });
  }

  /**
   * Handle indicator selection
   * @param fieldId Field ID to select as indicator
   */
  onIndicatorSelect(fieldId: string): void {
    const field = this.config.indicators?.find(f => f.id === fieldId);
    if (!field) return;

    // If field doesn't have data yet, trigger fetch
    if (field.state !== 'ready') {
      this.loadFieldData(fieldId);
    }

    this.emitChange('indicatorSelected', { selectedIndicator: fieldId });
  }

  /**
   * Handle group by selection
   * @param groupId Group ID to group by
   */
  onGroupBySelect(groupId: string): void {
    this.emitChange('groupSelected', { selectedGroup: groupId });
  }

  /**
   * Handle stack selection (single-select only, always one required)
   * Only one stack can be active at a time for a given indicator
   * At least one stack must always be selected (cannot deselect all)
   * Selecting the same stack again has no effect (if it's the last one)
   * @param stackId Stack ID to select
   */
  onStackSelect(stackId: string): void {
    const selectedStacks = this.state?.selectedStacks || [];
    
    // Prevent deselecting if this is the last stack
    if (selectedStacks.includes(stackId) && selectedStacks.length === 1) {
      return; // Do nothing - keep the current stack selected
    }
    
    // Single-select: toggle the selected stack
    const updated = selectedStacks.includes(stackId) ? [] : [stackId];
    this.emitChange('stackSelected', { selectedStacks: updated });
  }

  /**
   * Handle slice/filter click
   * Delegates to parent's callback if provided
   * @param sliceId Slice ID (optional)
   */
  onSliceClick(sliceId?: string): void {
    if (this.config.onSliceClick) {
      this.config.onSliceClick();
    }

    const selectedSlices = this.state?.selectedSlices || [];
    let updated: string[];
    if (sliceId) {
      // Single-select toggle: if already selected, deselect; otherwise select exclusively
      updated = selectedSlices.includes(sliceId) ? [] : [sliceId];
    } else {
      updated = selectedSlices;
    }

    // If deselecting or no fetch callback: emit null slice state
    if (updated.length === 0 || !sliceId || !this.config.onFetchSliceData) {
      if (this.config.onFetchSliceData) {
        this.sliceStateChange.emit(null);
      }
      this.emitChange('sliceSelected', { selectedSlices: updated });
      return;
    }

    // Selecting a new filter: fetch data then emit
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

  /**
   * Load field data on-demand with caching
   *
   * Process:
   * 1. Check cache first (return immediately if found)
   * 2. Set loading state on field
   * 3. Call onFetchFieldData callback
   * 4. Cache result
   * 5. Update field state to 'ready'
   * 6. Detect changes for template
   *
   * @param fieldId Field ID to load data for
   */
  async loadFieldData(fieldId: string): Promise<void> {
    // Check cache first
    if (this.fieldDataCache.has(fieldId)) {
      console.log(`Field ${fieldId} already cached, skipping fetch`);
      return;
    }

    // Validate config
    if (!this.config.onFetchFieldData) {
      console.warn(`No onFetchFieldData callback configured for field ${fieldId}`);
      return;
    }

    // Find field in all sections
    const field =
      this.config.fields?.find(f => f.id === fieldId) ||
      this.config.indicators?.find(f => f.id === fieldId);

    if (!field) return;

    // Set loading state
    this.loadingFieldId = fieldId;
    field.state = 'loading';
    this.cdr.markForCheck();

    try {
      // Fetch data
      const data = await this.config.onFetchFieldData(fieldId);

      // Cache and mark ready
      this.fieldDataCache.set(fieldId, data);
      field.state = 'ready';

      // Trigger change detection
      this.cdr.markForCheck();
    } catch (error) {
      // Mark error state
      console.error(`Failed to fetch data for field ${fieldId}:`, error);
      field.state = 'error';
      this.cdr.markForCheck();
    } finally {
      // Clear loading indicator
      this.loadingFieldId = undefined;
      this.cdr.markForCheck();
    }
  }

  /** Appelle le callback export et ferme le menu */
  onExport(): void {
    if (this.config.onExport) {
      this.config.onExport();
    }
    this.mainMenuTrigger?.closeMenu();
  }

  /** Préférences : mode édition */
  onPreferencesEdit(): void {
    if (this.config.onPreferencesEdit) {
      this.config.onPreferencesEdit();
    }
    this.mainMenuTrigger?.closeMenu();
  }

  /** Préférences : sauvegarde */
  onPreferencesSave(): void {
    if (this.config.onPreferencesSave) {
      this.config.onPreferencesSave();
    }
    this.mainMenuTrigger?.closeMenu();
  }

  /** Préférences : réinitialisation */
  onPreferencesClear(): void {
    if (this.config.onPreferencesClear) {
      this.config.onPreferencesClear();
    }
    this.mainMenuTrigger?.closeMenu();
  }

  /**
   * Reset view to default state
   */
  onReset(): void {
    const resetState: OrganizerState = {
      visibleFields: [],
      selectedIndicator: undefined,
      selectedGroup: undefined,
      selectedStacks: [],
      selectedSlices: []
    };

    this.emitChange('reset', resetState);
  }

  /** Label de l'indicateur actif (pour le menu principal) */
  activeIndicatorLabel(): string {
    const id = this.state?.selectedIndicator;
    if (!id) return 'Aucun';
    return this.config.indicators?.find(i => i.id === id)?.label ?? id;
  }

  /** Label du groupe actif (pour le menu principal) */
  activeGroupLabel(): string {
    const id = this.state?.selectedGroup;
    if (!id) return 'Aucun';
    return this.config.groups?.find(g => g.id === id)?.label ?? id;
  }

  /** Label du stack actif (pour le menu principal) */
  activeStackLabel(): string {
    const ids = this.state?.selectedStacks;
    if (!ids?.length) return 'Aucun';
    if (ids.length === 1) {
      return this.config.stacks?.find(s => s.id === ids[0])?.label ?? ids[0];
    }
    return `${ids.length} sélectionnés`;
  }

  /** Label des filtres actifs (pour le menu principal) */
  activeSlicesLabel(): string {
    const ids = this.state?.selectedSlices;
    if (!ids?.length) return 'Aucun';
    if (ids.length === 1) {
      return this.config.slices?.find(s => s.id === ids[0])?.label ?? ids[0];
    }
    return `${ids.length} sélectionnés`;
  }

  /**
   * Emit view change event
   *
   * @param type Event type
   * @param state Updated organizer state (partial)
   */
  private emitChange(type: OrganizerButtonEvent['type'], stateUpdate: Partial<OrganizerState>): void {
    const event: OrganizerButtonEvent = {
      type,
      state: { ...this.state, ...stateUpdate },
      source: 'user'
    };

    this.viewChange.emit(event);
  }
}
