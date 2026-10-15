import { defer, Observable, Subject, take, takeUntil } from 'rxjs';

export interface LazyFieldDef {
  key: string;
  /**
   * `{ fetchFn }` : chargement positionnel par colonne (le tableau retourné suit l'ordre des lignes).
   * `true` : chargement par clé de ligne via un `LazyBatchLoader` partagé, groupé avec les autres colonnes.
   */
  lazy?: true | {
    fetchFn: () => Observable<any[]>;
  };
}
export interface LazyFieldCallbacks {
  onRefresh(): void;
  onMarkForCheck(): void;
}

export type LazyRowKey = string | number;

export interface LazyBatchRequest<TRow = any> {
  /** Colonnes à charger, dans une seule requête. */
  columnKeys: readonly string[];
  /** Lignes affichées au moment de la requête. */
  rows: readonly TRow[];
  /** Clés des lignes affichées (même ordre que `rows`). */
  keys: readonly LazyRowKey[];
}

export interface LazyBatchLoader<TRow = any> {
  /** Clé stable d'une ligne ; appliquée aux lignes du tableau et aux enregistrements retournés par `load`. */
  rowKey: (row: any) => LazyRowKey;
  /** Retourne des enregistrements contenant la clé de ligne et les valeurs, indexées par `key` de colonne. L'ordre n'importe pas. */
  load: (request: LazyBatchRequest<TRow>) => Observable<readonly any[]>;
}

export const LAZY_FIELD_LOADING_VALUE = '__lazy_loading__';
export const LAZY_FIELD_ERROR_VALUE = '__lazy_error__';

type LazyStatus = 'idle' | 'loading' | 'loaded' | 'error';

export class LazyFieldManager<TField extends LazyFieldDef = LazyFieldDef> {

  private _status = new Map<string, LazyStatus>();
  private _data = new Map<string, Map<any, any>>();
  private _cancels = new Map<string, Subject<void>>();
  /** Valeurs des colonnes chargées par clé, conservées pour survivre au remplacement des lignes. */
  private readonly _values = new Map<string, Map<string, any>>();
  private readonly _keyed = new Set<string>();
  private _rowKey?: (row: any) => LazyRowKey;

  get status(): Map<string, LazyStatus> {
    return this._status;
  }

  get data(): Map<string, Map<any, any>> {
    return this._data;
  }

  getStatus(key: string): LazyStatus {
    return this._status.get(key) ?? 'idle';
  }

  getRenderType(rowValue: any): 'loading' | 'error' | 'value' {
    if (rowValue === LAZY_FIELD_LOADING_VALUE) return 'loading';
    if (rowValue === LAZY_FIELD_ERROR_VALUE) return 'error';
    return 'value';
  }

  cancelAll(): void {
    this._cancels.forEach(s => { s.next(); s.complete(); });
    this._cancels.clear();
    this._status = new Map();
    this._data = new Map();
    this._values.clear();
    this._keyed.clear();
  }

  /**
   * Rattache les valeurs déjà chargées par clé aux nouvelles lignes.
   * Les colonnes positionnelles (`fetchFn`) ne peuvent pas survivre à un changement de lignes : elles sont réinitialisées.
   */
  rebind<TRow>(rows: readonly TRow[]): void {
    const positional = [...this._status.keys()].filter(k => !this._keyed.has(k));
    this._drop(positional);
    if (this._rowKey) this._bind([...this._keyed], rows);
  }

  retry<TRow>(field: TField, resolvedData: TRow[], callbacks: LazyFieldCallbacks): void {
    this._drop([field.key]);
    this.fetch(field, resolvedData, callbacks);
  }

  fetch<TRow>(field: TField, resolvedData: TRow[], callbacks: LazyFieldCallbacks): void {
    if (typeof field.lazy !== 'object') return;
    const k = field.key;
    if (this._status.get(k) === 'loading') return;

    const prev = this._cancels.get(k);
    if (prev) { prev.next(); prev.complete(); }
    const cancel$ = new Subject<void>();
    this._cancels.set(k, cancel$);

    this._setStatus([k], 'loading');
    callbacks.onRefresh();

    field.lazy.fetchFn().pipe(
      take(1),
      takeUntil(cancel$),
    ).subscribe({
      next: (values: any[]) => {
        const rowMap = new Map<any, any>();
        values.forEach((value, i) => {
          if (i < resolvedData.length) rowMap.set(resolvedData[i], value);
        });
        const newData = new Map(this._data);
        newData.set(k, rowMap);
        this._data = newData;

        this._setStatus([k], 'loaded');
        callbacks.onRefresh();
        callbacks.onMarkForCheck();
      },
      error: () => {
        this._setStatus([k], 'error');
        callbacks.onRefresh();
        callbacks.onMarkForCheck();
      },
    });
  }

  retryBatch<TRow>(
    fields: TField[],
    loader: LazyBatchLoader<TRow>,
    getRows: () => readonly TRow[],
    callbacks: LazyFieldCallbacks,
  ): void {
    this._drop(fields.map(f => f.key));
    this.fetchBatch(fields, loader, getRows, callbacks);
  }

  /**
   * Charge plusieurs colonnes en une seule requête et fusionne le résultat par clé de ligne.
   * `silent` rafraîchit des colonnes déjà chargées sans repasser en `loading` ni effacer les valeurs en cas d'erreur.
   */
  fetchBatch<TRow>(
    fields: TField[],
    loader: LazyBatchLoader<TRow>,
    getRows: () => readonly TRow[],
    callbacks: LazyFieldCallbacks,
    silent = false,
  ): void {
    const targets = silent
      ? fields
      : fields.filter(f => { const s = this._status.get(f.key); return s !== 'loading' && s !== 'loaded'; });
    const rows = getRows();
    if (!targets.length || !rows.length) return;

    const columnKeys = targets.map(f => f.key);
    const rowKeys = rows.map(r => loader.rowKey(r));
    const requestedKeys = rowKeys.map(String);
    this._rowKey = loader.rowKey;

    new Set(columnKeys.map(k => this._cancels.get(k))).forEach(s => { s?.next(); s?.complete(); });
    const cancel$ = new Subject<void>();
    columnKeys.forEach(k => { this._cancels.set(k, cancel$); this._keyed.add(k); });

    if (!silent) {
      this._setStatus(columnKeys, 'loading');
      callbacks.onRefresh();
    }

    defer(() => loader.load({ columnKeys, rows, keys: rowKeys })).pipe(
      take(1),
      takeUntil(cancel$),
    ).subscribe({
      next: records => {
        const byKey = new Map<string, any>();
        records.forEach(record => byKey.set(String(loader.rowKey(record)), record));
        columnKeys.forEach(k => {
          const values = new Map<string, any>();
          byKey.forEach((record, rowKey) => values.set(rowKey, record?.[k]));
          this._values.set(k, values);
        });

        const currentRows = getRows();
        this._bind(columnKeys, currentRows);
        this._setStatus(columnKeys, 'loaded');
        callbacks.onRefresh();
        callbacks.onMarkForCheck();

        // Des lignes sont apparues pendant la requête : un rafraîchissement silencieux les complète.
        const requested = new Set(requestedKeys);
        if (currentRows.some(r => !requested.has(String(loader.rowKey(r))))) {
          this.fetchBatch(targets, loader, getRows, callbacks, true);
        }
      },
      error: () => {
        if (silent) return;
        this._setStatus(columnKeys, 'error');
        callbacks.onRefresh();
        callbacks.onMarkForCheck();
      },
    });
  }

  private _bind<TRow>(columnKeys: string[], rows: readonly TRow[]): void {
    const rowKey = this._rowKey!;
    const newData = new Map(this._data);
    columnKeys.forEach(k => {
      const values = this._values.get(k);
      if (!values) return;
      const rowMap = new Map<any, any>();
      rows.forEach(row => {
        const key = String(rowKey(row));
        if (values.has(key)) rowMap.set(row, values.get(key));
      });
      newData.set(k, rowMap);
    });
    this._data = newData;
  }

  private _drop(keys: string[]): void {
    if (!keys.length) return;
    new Set(keys.map(k => this._cancels.get(k))).forEach(s => { s?.next(); s?.complete(); });
    const status = new Map(this._status);
    const data = new Map(this._data);
    keys.forEach(k => {
      this._cancels.delete(k);
      this._values.delete(k);
      this._keyed.delete(k);
      status.delete(k);
      data.delete(k);
    });
    this._status = status;
    this._data = data;
  }

  private _setStatus(keys: string[], status: LazyStatus): void {
    const next = new Map(this._status);
    keys.forEach(k => next.set(k, status));
    this._status = next;
  }
}
