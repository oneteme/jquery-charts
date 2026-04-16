import { Subject, take, takeUntil } from 'rxjs';
import { TableColumnProvider } from '../jquery-table.model';
import { LAZY_LOADING_VALUE, LAZY_ERROR_VALUE } from './table.constants';

export interface LazyCallbacks {
  onRefresh(): void;
  onMarkForCheck(): void;
}

/**
 * Gère le cycle de vie des colonnes à chargement différé (lazy) :
 * statuts, données, annulation des requêtes en cours.
 *
 * Pas de dépendance Angular/DOM — peut être instancié manuellement dans le composant.
 */
export class LazyColumnManager<T = any> {

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
    if (rowValue === LAZY_LOADING_VALUE) return 'loading';
    if (rowValue === LAZY_ERROR_VALUE) return 'error';
    return 'value';
  }

  /** Annule tous les fetches en cours et réinitialise l'état (appeler lors d'un changement de données). */
  cancelAll(): void {
    this._cancels.forEach(s => { s.next(); s.complete(); });
    this._cancels.clear();
    this._status = new Map();
    this._data = new Map();
  }

  /** Réinitialise une colonne et relance son fetch. */
  retry(column: TableColumnProvider<T>, resolvedData: T[], callbacks: LazyCallbacks): void {
    const k = column.key;
    const prev = this._cancels.get(k);
    if (prev) { prev.next(); prev.complete(); }
    this._cancels.delete(k);

    const newStatus = new Map(this._status);
    newStatus.delete(k);
    this._status = newStatus;

    const newData = new Map(this._data);
    newData.delete(k);
    this._data = newData;

    this.fetch(column, resolvedData, callbacks);
  }

  /** Lance le chargement différé d'une colonne. No-op si déjà en cours. */
  fetch(column: TableColumnProvider<T>, resolvedData: T[], callbacks: LazyCallbacks): void {
    if (!column.lazy) return;
    const k = column.key;
    if (this._status.get(k) === 'loading') return;

    const prev = this._cancels.get(k);
    if (prev) { prev.next(); prev.complete(); }
    const cancel$ = new Subject<void>();
    this._cancels.set(k, cancel$);

    const newStatus = new Map(this._status);
    newStatus.set(k, 'loading');
    this._status = newStatus;
    callbacks.onRefresh();

    column.lazy.fetchFn().pipe(
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
