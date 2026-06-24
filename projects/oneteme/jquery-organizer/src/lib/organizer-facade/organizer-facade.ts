import { Subject } from 'rxjs';
import { OrganizerEvent, OrganizerState } from '@oneteme/jquery-core';
import {
  OrganizerFieldDef,
  OrganizerFieldsState,
  OrganizerGroupByState,
  OrganizerPanelConfig,
  OrganizerSliceByState,
} from './organizer-facade.types';

/** Transforme une clé programmatique en label lisible. Ex: 'createdAt' → 'Created at'. */
export function humanizeKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (v) => v.toUpperCase());
}

/**
 * OrganizerFacade<TField>
 *
 * Centralise l'état et les actions du panneau Organizer (Champs / Group by / Slice by).
 * Générique sur TField extends OrganizerFieldDef : compatible tables (TableColumnProvider),
 * charts (IndicatorDef), KPI, etc.
 *
 * Pas de dépendance Angular/DOM — instanciable en dehors d'un composant.
 *
 * Usage :
 *   this._organizer = new OrganizerFacade();
 *   this._organizer.events$.subscribe(e => { ... });
 *   this._organizer.update({ config, fields, sliceConfigs });
 */
export class OrganizerFacade<TField extends OrganizerFieldDef = OrganizerFieldDef> {

  // ── State

  readonly fields: OrganizerFieldsState<TField> = {
    activeFields: [],
    userCustomized: false,
  };

  readonly groupBy: OrganizerGroupByState = {
    activeKey: null,
    userCustomized: false,
  };

  readonly sliceBy: OrganizerSliceByState<TField> = {
    activeDynamicFields: [],
    availableForDynamic: [],
    allDynamicFields: [],
    activeLabel: 'Aucun',
  };

  private _panelConfig: OrganizerPanelConfig<TField> = { fields: [], sliceConfigs: [] };
  private _hiddenStaticKeys = new Set<string>();

  // ── Events

  private readonly _events$ = new Subject<OrganizerEvent>();
  readonly events$ = this._events$.asObservable();

  // ── Computed flags

  get enabled(): boolean {
    return this._panelConfig.config?.enabled === true;
  }

  get showFields(): boolean {
    return this.enabled;
  }

  get showGroupBySection(): boolean {
    return this.enabled && this.groupByFields.length > 0;
  }

  get showSliceBySection(): boolean {
    return this.enabled && (
      (this._panelConfig.sliceConfigs?.length ?? 0) > 0 ||
      this.sliceBy.allDynamicFields.length > 0
    );
  }

  get allowFieldRemoval(): boolean {
    return this._panelConfig.config?.enableFieldRemoval !== false;
  }

  /** @deprecated Use allowFieldRemoval */
  get allowColumnRemoval(): boolean {
    return this.allowFieldRemoval;
  }

  get isFieldDragDropEnabled(): boolean {
    return this._panelConfig.config?.enableFieldDragDrop === true;
  }

  /** @deprecated Use isFieldDragDropEnabled */
  get isColumnDragDropEnabled(): boolean {
    return this.isFieldDragDropEnabled;
  }

  get menuBaseFields(): TField[] {
    return this._uniqueByKey((this._panelConfig.fields || []).filter(c => !c.optional));
  }

  /** @deprecated Use menuBaseFields */
  get menuBaseColumns(): TField[] {
    return this.menuBaseFields;
  }

  get menuOptionalFields(): TField[] {
    return this._uniqueByKey((this._panelConfig.fields || []).filter(c => c.optional));
  }

  /** @deprecated Use menuOptionalFields */
  get menuOptionalColumns(): TField[] {
    return this.menuOptionalFields;
  }

  get totalFieldCount(): number {
    return new Set((this._panelConfig.fields || []).map(c => c.key)).size;
  }

  /** @deprecated Use totalFieldCount */
  get totalColumnCount(): number {
    return this.totalFieldCount;
  }

  get groupByFields(): TField[] {
    const seen = new Set<string>();
    return (this._panelConfig.fields || []).filter(c => {
      if (c.groupable === false || seen.has(c.key)) return false;
      if (!c.header && c.groupable !== true) return false;
      seen.add(c.key);
      return true;
    });
  }

  /** @deprecated Use groupByFields */
  get groupByColumns(): TField[] {
    return this.groupByFields;
  }

  get activeGroupByLabel(): string {
    if (!this.groupBy.activeKey) return this._panelConfig.noneLabel ?? 'Aucun';
    const field = this.groupByFields.find(c => c.key === this.groupBy.activeKey);
    return field?.header || this.groupBy.activeKey;
  }

  get staticSlicesForMenu(): Array<{ key: string; title: string; icon?: string }> {
    return (this._panelConfig.sliceConfigs ?? [])
      .filter(s => !!s.columnKey)
      .map(s => {
        const fieldIcon = (this._panelConfig.fields ?? []).find(c => c.key === s.columnKey)?.icon;
        return { key: s.columnKey!, title: s.title || humanizeKey(s.columnKey!), icon: s.icon ?? fieldIcon };
      });
  }

  fieldLabel(field: { key: string; header?: string }): string {
    return field.header || humanizeKey(field.key);
  }

  /** @deprecated Use fieldLabel */
  colLabel(col: { key: string; header?: string }): string {
    return this.fieldLabel(col);
  }

  // ── Mise à jour de la config

  update(panelConfig: OrganizerPanelConfig<TField>): void {
    this._panelConfig = panelConfig;
    this._refreshDefaultFields();
    this._refreshDynamicSliceMeta();
    if (!this.groupBy.userCustomized) {
      this.groupBy.activeKey = panelConfig.defaultGroupBy ?? null;
    }
  }

  // ── Actions Fields

  setActiveFields(fields: TField[]): void {
    this.fields.activeFields = fields;
    this.fields.userCustomized = true;
  }

  /** @deprecated Use setActiveFields */
  setActiveColumns(columns: TField[]): void {
    this.setActiveFields(columns);
  }

  setUserCustomized(value: boolean): void {
    this.fields.userCustomized = value;
  }

  /** Remet la vue dans son état initial : champs par défaut, groupBy par défaut, pas de dynamic slices. */
  resetToDefaults(): void {
    this.fields.userCustomized = false;
    this.groupBy.userCustomized = false;
    this._refreshDefaultFields();
    this.groupBy.activeKey = this._panelConfig.defaultGroupBy ?? null;
    this.sliceBy.activeDynamicFields = [];
    this._refreshDynamicSliceMeta();
  }

  addField(field: TField): void {
    const configFields = this._panelConfig.fields ?? [];
    const configIndex = configFields.findIndex(c => c.key === field.key);
    if (configIndex === -1) {
      this.fields.activeFields = [...this.fields.activeFields, field];
    } else {
      const insertBefore = this.fields.activeFields.findIndex(c => {
        const ci = configFields.findIndex(cc => cc.key === c.key);
        return ci !== -1 && ci > configIndex;
      });
      if (insertBefore === -1) {
        this.fields.activeFields = [...this.fields.activeFields, field];
      } else {
        const copy = [...this.fields.activeFields];
        copy.splice(insertBefore, 0, field);
        this.fields.activeFields = copy;
      }
    }
    this.fields.userCustomized = true;
    this._events$.next({ type: 'fieldsChanged', fieldIds: this.fields.activeFields.map(c => c.key) });
  }

  /** @deprecated Use addField */
  addColumn(column: TField): void {
    this.addField(column);
  }

  removeField(fieldKey: string): boolean {
    const field = this.fields.activeFields.find(c => c.key === fieldKey);
    if (!field) return false;
    if (!field.optional && !this.allowFieldRemoval) return false;
    if (this.fields.activeFields.length <= 1) return false;
    this.fields.activeFields = this.fields.activeFields.filter(c => c.key !== fieldKey);
    this.fields.userCustomized = true;
    this._events$.next({ type: 'fieldsChanged', fieldIds: this.fields.activeFields.map(c => c.key) });
    return true;
  }

  /** @deprecated Use removeField */
  removeColumn(columnKey: string): boolean {
    return this.removeField(columnKey);
  }

  toggleFieldVisibility(field: TField, visible: boolean): void {
    const isVisible = this.isFieldVisible(field.key);
    if (visible && !isVisible) {
      this.addField(field);
    } else if (!visible && isVisible) {
      this.removeField(field.key);
    }
  }

  reorderFields(fromKey: string, toKey: string): boolean {
    const prev = this.fields.activeFields.findIndex(c => c.key === fromKey);
    const curr = this.fields.activeFields.findIndex(c => c.key === toKey);
    if (prev === -1 || curr === -1 || prev === curr) return false;
    const reordered = [...this.fields.activeFields];
    const [moved] = reordered.splice(prev, 1);
    reordered.splice(curr, 0, moved);
    this.fields.activeFields = reordered;
    this.fields.userCustomized = true;
    this._events$.next({ type: 'fieldsChanged', fieldIds: this.fields.activeFields.map(c => c.key) });
    return true;
  }

  /** @deprecated Use reorderFields */
  reorderColumns(fromKey: string, toKey: string): boolean {
    return this.reorderFields(fromKey, toKey);
  }

  isFieldVisible(key: string): boolean {
    return this.fields.activeFields.some(c => c.key === key);
  }

  /** @deprecated Use isFieldVisible */
  isColumnVisible(key: string): boolean {
    return this.isFieldVisible(key);
  }

  // ── Actions Group by

  setGroupBy(key: string | null): void {
    this.groupBy.activeKey = key;
    this.groupBy.userCustomized = true;
    this._events$.next({ type: 'groupByChanged', key });
  }

  // ── Actions Slice by (dynamique)

  /** Appelée quand le SlicePanelComponent émet dynamicSliceKeysChange */
  onDynamicSliceKeysChange(keys: string[]): void {
    const allFields = this._panelConfig.fields ?? [];
    const staticKeys = new Set(
      (this._panelConfig.sliceConfigs ?? []).map(s => s.columnKey).filter((k): k is string => !!k)
    );
    const dynamicKeySet = new Set(keys);
    const existingKeys = new Set([...staticKeys, ...dynamicKeySet]);

    this.sliceBy.activeDynamicFields = keys
      .map(k => allFields.find(c => c.key === k))
      .filter((c): c is TField => !!c);

    const seen = new Set<string>();
    this.sliceBy.availableForDynamic = allFields.filter(c => {
      if (c.sliceable === false || existingKeys.has(c.key) || seen.has(c.key)) return false;
      seen.add(c.key);
      return true;
    });

    this._computeSliceLabel();
    this._events$.next({ type: 'dynamicSlicesChanged', keys });
  }

  isDynamicSliceActive(key: string): boolean {
    return this.sliceBy.activeDynamicFields.some(c => c.key === key);
  }

  // ── Contrat core (OrganizerState)

  toOrganizerState(): OrganizerState {
    return {
      selectedFieldIds: this.fields.activeFields.map(c => c.key),
      groupByKey: this.groupBy.activeKey,
      dynamicSliceKeys: this.sliceBy.activeDynamicFields.map(c => c.key),
    };
  }

  // ── Destructor

  destroy(): void {
    this._events$.complete();
  }

  // ── Notification des slices statiques cachées

  updateHiddenStaticKeys(keys: Set<string>): void {
    this._hiddenStaticKeys = keys;
    this._computeSliceLabel();
  }

  // ── Helpers privés

  private _refreshDefaultFields(): void {
    const defaultFields = (this._panelConfig.fields || []).filter(c => !c.optional);
    if (!this.fields.userCustomized || this.fields.activeFields.length === 0) {
      this.fields.activeFields = [...defaultFields];
    } else {
      const allowedKeys = new Set((this._panelConfig.fields || []).map(c => c.key));
      this.fields.activeFields = this.fields.activeFields.filter(c => allowedKeys.has(c.key));
    }
  }

  private _refreshDynamicSliceMeta(): void {
    const allFields = this._panelConfig.fields ?? [];
    const staticKeys = new Set(
      (this._panelConfig.sliceConfigs ?? []).map(s => s.columnKey).filter((k): k is string => !!k)
    );
    const activeDynKeys = new Set(this.sliceBy.activeDynamicFields.map(c => c.key));

    const seen1 = new Set<string>();
    this.sliceBy.availableForDynamic = allFields.filter(c => {
      if (c.sliceable === false || staticKeys.has(c.key) || activeDynKeys.has(c.key) || seen1.has(c.key)) return false;
      if (!c.header && c.sliceable !== true) return false;
      seen1.add(c.key);
      return true;
    });

    const seen2 = new Set<string>();
    this.sliceBy.allDynamicFields = allFields.filter(c => {
      if (c.sliceable === false || staticKeys.has(c.key) || seen2.has(c.key)) return false;
      if (!c.header && c.sliceable !== true) return false;
      seen2.add(c.key);
      return true;
    });

    this._computeSliceLabel();
  }

  private _computeSliceLabel(): void {
    const visibleStatics = (this._panelConfig.sliceConfigs ?? []).filter(
      s => !s.columnKey || !this._hiddenStaticKeys.has(s.columnKey)
    );
    const total = visibleStatics.length + this.sliceBy.activeDynamicFields.length;
    if (total === 0) { this.sliceBy.activeLabel = this._panelConfig.noneLabel ?? 'Aucun'; return; }
    if (total === 1) {
      if (visibleStatics.length === 1) {
        const first = visibleStatics[0];
        this.sliceBy.activeLabel = first?.title || first?.columnKey || '1';
        return;
      }
      this.sliceBy.activeLabel = this.sliceBy.activeDynamicFields[0]?.header || '1';
      return;
    }
    this.sliceBy.activeLabel = `${total} actifs`;
  }

  private _uniqueByKey(fields: TField[]): TField[] {
    const seen = new Set<string>();
    return fields.filter(c => {
      if (seen.has(c.key)) return false;
      seen.add(c.key);
      return true;
    });
  }
}
