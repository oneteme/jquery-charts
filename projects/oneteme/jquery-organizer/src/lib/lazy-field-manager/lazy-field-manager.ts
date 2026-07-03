import { Observable, Subject, take, takeUntil } from 'rxjs';

export interface LazyFieldDef {
  key: string;
  lazy?: {
    fetchFn: () => Observable<any[]>;
  };
}
export interface LazyFieldCallbacks {
  onRefresh(): void;
  onMarkForCheck(): void;
}

export const LAZY_FIELD_LOADING_VALUE = '__lazy_loading__';
export const LAZY_FIELD_ERROR_VALUE = '__lazy_error__';

export class LazyFieldManager<TField extends LazyFieldDef = LazyFieldDef> {

  private _status = new Map<string, 'idle' | 'loading' | 'loaded' | 'error'>();
  private _data = new Map<string, Map<any, any>>();
  private _cancels = new Map<string, Subject<void>>();

  get status(): Map<string, 'idle' | 'loading' | 'loaded' | 'error'> {
    return this._status;
  }

  get data(): Map<string, Map<any, any>> {
    return this._data;
  }

  getStatus(key: string): 'idle' | 'loading' | 'loaded' | 'error' {
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
  }

  retry<TRow>(field: TField, resolvedData: TRow[], callbacks: LazyFieldCallbacks): void {
    const k = field.key;
    const prev = this._cancels.get(k);
    if (prev) { prev.next(); prev.complete(); }
    this._cancels.delete(k);

    const newStatus = new Map(this._status);
    newStatus.delete(k);
    this._status = newStatus;

    const newData = new Map(this._data);
    newData.delete(k);
    this._data = newData;

    this.fetch(field, resolvedData, callbacks);
  }

  fetch<TRow>(field: TField, resolvedData: TRow[], callbacks: LazyFieldCallbacks): void {
    if (!field.lazy) return;
    const k = field.key;
    if (this._status.get(k) === 'loading') return;

    const prev = this._cancels.get(k);
    if (prev) { prev.next(); prev.complete(); }
    const cancel$ = new Subject<void>();
    this._cancels.set(k, cancel$);

    const newStatus = new Map(this._status);
    newStatus.set(k, 'loading');
    this._status = newStatus;
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

        const newStatus2 = new Map(this._status);
        newStatus2.set(k, 'loaded');
        this._status = newStatus2;

        callbacks.onRefresh();
        callbacks.onMarkForCheck();
      },
      error: () => {
        const newStatusErr = new Map(this._status);
        newStatusErr.set(k, 'error');
        this._status = newStatusErr;

        callbacks.onRefresh();
        callbacks.onMarkForCheck();
      },
    });
  }
}
