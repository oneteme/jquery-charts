import { Subject } from 'rxjs';
import { ViewEvent, ViewField, ViewState } from '@oneteme/jquery-core';
import { TableColumnProvider, TableViewConfig } from '../../jquery-table.model';
import { SliceConfig } from '../slice-panel/slice-panel.model';
import { humanizeKey } from '../table.utils';

export type { ViewField, ViewConfig, ViewState, ViewEvent } from '@oneteme/jquery-core';
export { viewField, groupableViewFields, sliceableViewFields, initialViewState } from '@oneteme/jquery-core';

// ── Types internes

export interface ViewFieldState {
  activeColumns: TableColumnProvider<any>[];
  /** true si l'utilisateur a déjà personnalisé la sélection de colonnes */
  userCustomized: boolean;
}

export interface ViewGroupByState {
  activeKey: string | null;
}

export interface ViewSliceByState {
  activeDynamicColumns: TableColumnProvider<any>[];
  availableForDynamic: TableColumnProvider<any>[];
  allDynamicColumns: TableColumnProvider<any>[];
  activeLabel: string;
}

export interface ViewPanelConfig {
  /** Config brute issue de TableProvider.view */
  config?: TableViewConfig;
  /** Toutes les colonnes résolues (non filtrées) */
  columns: TableColumnProvider<any>[];
  /** Slices statiques */
  sliceConfigs: SliceConfig<any>[];
  /** Label utilisé quand aucun groupe / aucune slice n’est actif. Défaut : 'Aucun'. */
  noneLabel?: string;
}

// ── Facade

/**
 * Centralise l'état et les actions du panneau View (Champs / Group by / Slice by).
 * Pas de dépendance Angular/DOM : peut être extraite vers jquery-core à terme.
 *
 * Usage :
 *   this._view = new ViewFacade();
 *   this._view.events$.subscribe(e => { ... });
 *   this._view.update({ config, columns, sliceConfigs });
 */
export class ViewFacade<T = any> {

  // ── State

  readonly fields: ViewFieldState = {
    activeColumns: [],
    userCustomized: false,
  };

  readonly groupBy: ViewGroupByState = {
    activeKey: null,
  };

  readonly sliceBy: ViewSliceByState = {
    activeDynamicColumns: [],
    availableForDynamic: [],
    allDynamicColumns: [],
    activeLabel: 'Aucun',
  };

  private _panelConfig: ViewPanelConfig = { columns: [], sliceConfigs: [] };
  private _hiddenStaticKeys = new Set<string>();

  // ── Events

  private readonly _events$ = new Subject<ViewEvent>();
  readonly events$ = this._events$.asObservable();

  // ── Computed flags

  get enabled(): boolean {
    return this._panelConfig.config?.enabled === true;
  }

  get showFields(): boolean {
    return this.enabled;
  }

  get showGroupBySection(): boolean {
    return this.enabled && this.groupByColumns.length > 0;
  }

  get showSliceBySection(): boolean {
    return this.enabled && (
      (this._panelConfig.sliceConfigs?.length ?? 0) > 0 ||
      this.sliceBy.allDynamicColumns.length > 0
    );
  }

  get allowColumnRemoval(): boolean {
    return this._panelConfig.config?.enableColumnRemoval !== false;
  }

  get isColumnDragDropEnabled(): boolean {
    return this._panelConfig.config?.enableColumnDragDrop === true;
  }

  get menuBaseColumns(): TableColumnProvider<T>[] {
    return this._uniqueByKey((this._panelConfig.columns || []).filter(c => !c.optional));
  }

  get menuOptionalColumns(): TableColumnProvider<T>[] {
    return this._uniqueByKey((this._panelConfig.columns || []).filter(c => c.optional));
  }

  get totalColumnCount(): number {
    return new Set((this._panelConfig.columns || []).map(c => c.key)).size;
  }

  get groupByColumns(): TableColumnProvider<T>[] {
    const seen = new Set<string>();
    return (this._panelConfig.columns || []).filter(c => {
      if (c.groupable === false || seen.has(c.key)) return false;
      if (!c.header && c.groupable !== true) return false;
      seen.add(c.key);
      return true;
    });
  }

  get activeGroupByLabel(): string {
    if (!this.groupBy.activeKey) return this._panelConfig.noneLabel ?? 'Aucun';
    const col = this.groupByColumns.find(c => c.key === this.groupBy.activeKey);
    return col?.header || this.groupBy.activeKey;
  }

  get staticSlicesForMenu(): Array<{ key: string; title: string; icon?: string }> {
    return (this._panelConfig.sliceConfigs ?? [])
      .filter(s => !!s.columnKey)
      .map(s => {
        const colIcon = (this._panelConfig.columns ?? []).find(c => c.key === s.columnKey)?.icon;
        return { key: s.columnKey!, title: s.title || humanizeKey(s.columnKey!), icon: s.icon ?? colIcon };
      });
  }

  colLabel(col: { key: string; header?: string }): string {
    return col.header || humanizeKey(col.key);
  }

  // ── Mise à jour de la config (appelée depuis refreshViewModel)

  update(panelConfig: ViewPanelConfig): void {
    this._panelConfig = panelConfig;
    this._refreshDefaultColumns();
    this._refreshDynamicSliceMeta();
  }

  // ── Actions Fields

  setActiveColumns(columns: TableColumnProvider<T>[]): void {
    this.fields.activeColumns = columns;
    this.fields.userCustomized = true;
  }

  setUserCustomized(value: boolean): void {
    this.fields.userCustomized = value;
  }

  /** Remet la vue dans son état initial : colonnes par défaut, pas de groupBy, pas de dynamic slices. */
  resetToDefaults(): void {
    this.fields.userCustomized = false;
    this._refreshDefaultColumns();
    this.groupBy.activeKey = null;
    this.sliceBy.activeDynamicColumns = [];
    this._refreshDynamicSliceMeta();
  }

  addColumn(column: TableColumnProvider<T>): void {
    const configCols = this._panelConfig.columns ?? [];
    const configIndex = configCols.findIndex(c => c.key === column.key);
    if (configIndex === -1) {
      this.fields.activeColumns = [...this.fields.activeColumns, column];
    } else {
      const insertBefore = this.fields.activeColumns.findIndex(c => {
        const ci = configCols.findIndex(cc => cc.key === c.key);
        return ci !== -1 && ci > configIndex;
      });
      if (insertBefore === -1) {
        this.fields.activeColumns = [...this.fields.activeColumns, column];
      } else {
        const copy = [...this.fields.activeColumns];
        copy.splice(insertBefore, 0, column);
        this.fields.activeColumns = copy;
      }
    }
    this.fields.userCustomized = true;
    this._events$.next({ type: 'fieldsChanged', fieldIds: this.fields.activeColumns.map(c => c.key) });
  }

  removeColumn(columnKey: string): boolean {
    const col = this.fields.activeColumns.find(c => c.key === columnKey);
    if (!col) return false;
    if (!col.optional && !this.allowColumnRemoval) return false;
    if (this.fields.activeColumns.length <= 1) return false;
    this.fields.activeColumns = this.fields.activeColumns.filter(c => c.key !== columnKey);
    this.fields.userCustomized = true;
    this._events$.next({ type: 'fieldsChanged', fieldIds: this.fields.activeColumns.map(c => c.key) });
    return true;
  }

  toggleColumnVisibility(column: TableColumnProvider<T>, visible: boolean): void {
    const isVisible = this.isColumnVisible(column.key);
    if (visible && !isVisible) {
      this.addColumn(column);
    } else if (!visible && isVisible) {
      this.removeColumn(column.key);
    }
  }

  reorderColumns(fromKey: string, toKey: string): boolean {
    const prev = this.fields.activeColumns.findIndex(c => c.key === fromKey);
    const curr = this.fields.activeColumns.findIndex(c => c.key === toKey);
    if (prev === -1 || curr === -1 || prev === curr) return false;
    const reordered = [...this.fields.activeColumns];
    const [moved] = reordered.splice(prev, 1);
    reordered.splice(curr, 0, moved);
    this.fields.activeColumns = reordered;
    this.fields.userCustomized = true;
    this._events$.next({ type: 'fieldsChanged', fieldIds: this.fields.activeColumns.map(c => c.key) });
    return true;
  }

  isColumnVisible(key: string): boolean {
    return this.fields.activeColumns.some(c => c.key === key);
  }

  // ── Actions Group by

  setGroupBy(key: string | null): void {
    this.groupBy.activeKey = key;
    this._events$.next({ type: 'groupByChanged', key });
  }

  // ── Actions Slice by (dynamique)

  /** Appelée quand le SlicePanelComponent émet dynamicSliceKeysChange */
  onDynamicSliceKeysChange(keys: string[]): void {
    const allCols = this._panelConfig.columns ?? [];
    const staticKeys = new Set(
      (this._panelConfig.sliceConfigs ?? []).map(s => s.columnKey).filter((k): k is string => !!k)
    );
    const dynamicKeySet = new Set(keys);
    const existingKeys = new Set([...staticKeys, ...dynamicKeySet]);

    this.sliceBy.activeDynamicColumns = keys
      .map(k => allCols.find(c => c.key === k))
      .filter((c): c is TableColumnProvider<T> => !!c);

    const seen = new Set<string>();
    this.sliceBy.availableForDynamic = allCols.filter(c => {
      if (c.sliceable === false || existingKeys.has(c.key) || seen.has(c.key)) return false;
      seen.add(c.key);
      return true;
    });

    this._computeSliceLabel();
    this._events$.next({ type: 'dynamicSlicesChanged', keys });
  }

  isDynamicSliceActive(key: string): boolean {
    return this.sliceBy.activeDynamicColumns.some(c => c.key === key);
  }

  // ── Contrat core

  /** Retourne un snapshot ViewState (contrat core) de l'état courant. */
  toViewState(): ViewState {
    return {
      selectedFieldIds: this.fields.activeColumns.map(c => c.key),
      groupByKey: this.groupBy.activeKey,
      dynamicSliceKeys: this.sliceBy.activeDynamicColumns.map(c => c.key),
    };
  }

  /** Convertit une TableColumnProvider en ViewField (contrat core). */
  static toViewField(col: TableColumnProvider<any>): ViewField {
    return {
      id: col.key,
      label: col.header,
      icon: col.icon,
      groupable: col.groupable,
      sliceable: col.sliceable,
      optional: col.optional,
    };
  }

  // ── Destructor

  destroy(): void {
    this._events$.complete();
  }

  // ── Helpers privés

  private _refreshDefaultColumns(): void {
    const defaultCols = (this._panelConfig.columns || []).filter(c => !c.optional);
    if (!this.fields.userCustomized || this.fields.activeColumns.length === 0) {
      this.fields.activeColumns = [...defaultCols];
    } else {
      const allowedKeys = new Set((this._panelConfig.columns || []).map(c => c.key));
      this.fields.activeColumns = this.fields.activeColumns.filter(c => allowedKeys.has(c.key));
    }
  }

  private _refreshDynamicSliceMeta(): void {
    const allCols = this._panelConfig.columns ?? [];
    const staticKeys = new Set(
      (this._panelConfig.sliceConfigs ?? []).map(s => s.columnKey).filter((k): k is string => !!k)
    );
    const activeDynKeys = new Set(this.sliceBy.activeDynamicColumns.map(c => c.key));

    const seen1 = new Set<string>();
    this.sliceBy.availableForDynamic = allCols.filter(c => {
      if (c.sliceable === false || staticKeys.has(c.key) || activeDynKeys.has(c.key) || seen1.has(c.key)) return false;
      if (!c.header && c.sliceable !== true) return false;
      seen1.add(c.key);
      return true;
    });

    const seen2 = new Set<string>();
    this.sliceBy.allDynamicColumns = allCols.filter(c => {
      if (c.sliceable === false || staticKeys.has(c.key) || seen2.has(c.key)) return false;
      if (!c.header && c.sliceable !== true) return false;
      seen2.add(c.key);
      return true;
    });

    this._computeSliceLabel();
  }

  /** Notifie la facade des slices statiques actuellement cachées (géré par table.component).
   * Recalcule le label slice afin qu'il reflète uniquement les slices visibles. */
  updateHiddenStaticKeys(keys: Set<string>): void {
    this._hiddenStaticKeys = keys;
    this._computeSliceLabel();
  }

  private _computeSliceLabel(): void {
    const visibleStatics = (this._panelConfig.sliceConfigs ?? []).filter(
      s => !s.columnKey || !this._hiddenStaticKeys.has(s.columnKey)
    );
    const visibleStaticCount = visibleStatics.length;
    const total = visibleStaticCount + this.sliceBy.activeDynamicColumns.length;
    if (total === 0) { this.sliceBy.activeLabel = this._panelConfig.noneLabel ?? 'Aucun'; return; }
    if (total === 1) {
      if (visibleStaticCount === 1) {
        const first = visibleStatics[0];
        this.sliceBy.activeLabel = first?.title || first?.columnKey || '1';
        return;
      }
      this.sliceBy.activeLabel = this.sliceBy.activeDynamicColumns[0]?.header || '1';
      return;
    }
    this.sliceBy.activeLabel = `${total} actifs`;
  }

  private _uniqueByKey(cols: TableColumnProvider<T>[]): TableColumnProvider<T>[] {
    const seen = new Set<string>();
    return cols.filter(c => {
      if (seen.has(c.key)) return false;
      seen.add(c.key);
      return true;
    });
  }
}
