import { Subject } from 'rxjs';
import {
  ChartProvider, XaxisType, YaxisType,
  OrganizerConfig, OrganizerFieldDef, OrganizerState, OrganizerEvent,
  organizerFieldDefsFromChartSeries, applyOrganizerStateToSeries,
} from '@oneteme/jquery-core';

/**
 * Façade Organizer pour les charts ECharts.
 * Gère la visibilité des séries (champs) via le contrat OrganizerState/OrganizerEvent.
 *
 * Pas de dépendance Angular/DOM : peut être instanciée dans un composant ou un service.
 *
 * Usage :
 *   readonly _organizerFacade = new ChartViewFacade();
 *   _organizerFacade.update(config ?? {}, provider);
 *   getEffectiveProvider() → ChartProvider avec les flags visible appliqués.
 */
export class ChartViewFacade<X extends XaxisType = any, Y extends YaxisType = any> {

  // ── État

  private _config: OrganizerConfig = {};
  private _provider: ChartProvider<X, Y> | null = null;

  /** Champs (séries) disponibles, déduits des noms statiques du provider. */
  viewFields: OrganizerFieldDef[] = [];

  /** Snapshot d'état courant : séries sélectionnées = visibles. */
  readonly state: OrganizerState = {
    selectedFieldIds: [],
    groupByKey: null,
    dynamicSliceKeys: [],
  };

  // ── Événements

  private readonly _events$ = new Subject<OrganizerEvent>();
  readonly events$ = this._events$.asObservable();

  // ── Getters

  get enabled(): boolean {
    return this._config.enabled === true;
  }

  // ── Mise à jour de la config

  /**
   * Appelée à chaque changement de [config] ou [organizer] dans le composant parent.
   * Synchronise les champs disponibles et préserve la visibilité courante.
   */
  update(organizerConfig: OrganizerConfig, provider: ChartProvider<X, Y>): void {
    this._config = organizerConfig ?? {};
    this._provider = provider;
    this.viewFields = organizerFieldDefsFromChartSeries(provider?.series ?? []);

    const existingIds = new Set(this.viewFields.map(f => f.id));

    if (this.state.selectedFieldIds.length === 0) {
      // Initialisation : toutes les séries sont visibles
      this.state.selectedFieldIds = [...existingIds];
    } else {
      // Màj incrémentale : conserver les sélections existantes + ajouter les nouvelles
      const kept = this.state.selectedFieldIds.filter(id => existingIds.has(id));
      const added = this.viewFields
        .filter(f => !this.state.selectedFieldIds.includes(f.id) && existingIds.has(f.id))
        .map(f => f.id);
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
   * Si Organizer n'est pas activé, retourne le provider inchangé.
   */
  getEffectiveProvider(): ChartProvider<X, Y> {
    if (!this._provider) return null as any;
    if (!this.enabled) return this._provider;
    return applyOrganizerStateToSeries(this._provider, this.state);
  }

  // ── Destructor

  destroy(): void {
    this._events$.complete();
  }
}
