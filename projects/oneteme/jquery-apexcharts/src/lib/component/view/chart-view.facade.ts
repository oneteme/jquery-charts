import { Subject } from 'rxjs';
import {
  ChartProvider, XaxisType, YaxisType,
  ViewConfig, ViewField, ViewState, ViewEvent,
  viewFieldsFromChartSeries, applyViewStateToSeries,
} from '@oneteme/jquery-core';

/**
 * Façade View pour les charts ApexCharts.
 * Gère la visibilité des séries (champs) via le contrat ViewState/ViewEvent.
 *
 * Pas de dépendance Angular/DOM : peut être instanciée dans un composant ou un service.
 *
 * Usage :
 *   readonly _viewFacade = new ChartViewFacade();
 *   _viewFacade.events$.subscribe(e => { computeEffectiveConfig(); });
 *   _viewFacade.update(view ?? {}, config);
 *   getEffectiveProvider() → ChartProvider avec les flags visible appliqués.
 */
export class ChartViewFacade<X extends XaxisType = any, Y extends YaxisType = any> {

  // ── État

  private _config: ViewConfig = {};
  private _provider: ChartProvider<X, Y> | null = null;

  /** Champs (séries) disponibles, déduits des noms statiques du provider. */
  viewFields: ViewField[] = [];

  /** Snapshot d'état courant : séries sélectionnées = visibles. */
  readonly state: ViewState = {
    selectedFieldIds: [],
    groupByKey: null,
    dynamicSliceKeys: [],
  };

  // ── Événements

  private readonly _events$ = new Subject<ViewEvent>();
  readonly events$ = this._events$.asObservable();

  // ── Getters

  get enabled(): boolean {
    return this._config.enabled === true;
  }

  // ── Mise à jour de la config

  /**
   * Appelée à chaque changement de [config] ou [view] dans le composant parent.
   * Synchronise les champs disponibles et préserve la visibilité courante.
   */
  update(viewConfig: ViewConfig, provider: ChartProvider<X, Y>): void {
    this._config = viewConfig ?? {};
    this._provider = provider;
    this.viewFields = viewFieldsFromChartSeries(provider?.series ?? []);

    const existingIds = new Set(this.viewFields.map(f => f.id));

    if (this.state.selectedFieldIds.length === 0) {
      // Initialisation : toutes les séries sont visibles
      this.state.selectedFieldIds = [...existingIds];
    } else {
      // Màj incrémentale : conserver les sélections existantes + ajouter les nouvelles
      const kept = this.state.selectedFieldIds.filter(id => existingIds.has(id));
      const added = this.viewFields.filter(f => !this.state.selectedFieldIds.includes(f.id) && existingIds.has(f.id)).map(f => f.id);
      this.state.selectedFieldIds = [...kept, ...added];
    }
  }

  // ── Actions

  /** Bascule la visibilité d'une série. */
  toggleSerie(id: string, visible: boolean): void {
    if (visible && !this.state.selectedFieldIds.includes(id)) {
      this.state.selectedFieldIds = [...this.state.selectedFieldIds, id];
    } else if (!visible) {
      this.state.selectedFieldIds = this.state.selectedFieldIds.filter(x => x !== id);
    }
    this._events$.next({ type: 'fieldsChanged', fieldIds: [...this.state.selectedFieldIds] });
  }

  isSerieVisible(id: string): boolean {
    return this.state.selectedFieldIds.includes(id);
  }

  // ── Provider effectif

  /**
   * Retourne le ChartProvider avec les flags `visible` appliqués selon l'état courant.
   * Si View n'est pas activé, retourne le provider inchangé.
   */
  getEffectiveProvider(): ChartProvider<X, Y> {
    if (!this._provider) return null as any;
    if (!this.enabled) return this._provider;
    return applyViewStateToSeries(this._provider, this.state);
  }

  // ── Destructor

  destroy(): void {
    this._events$.complete();
  }
}
