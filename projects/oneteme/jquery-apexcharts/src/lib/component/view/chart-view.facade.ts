import { Subject } from 'rxjs';
import {
  ChartProvider, XaxisType, YaxisType,
  ChartOrganizerConfig, ChartOrganizerFieldDef, ChartOrganizerState, ChartOrganizerEvent,
  organizerFieldDefsFromChartSeries, applyOrganizerStateToSeries,
} from '@oneteme/jquery-core';

/**
 * Façade Organizer pour les charts ApexCharts.
 * Gère la visibilité des séries (champs) via le contrat ChartOrganizerState/ChartOrganizerEvent.
 *
 * Pas de dépendance Angular/DOM : peut être instanciée dans un composant ou un service.
 *
 * Usage :
 *   readonly _organizerFacade = new ChartViewFacade();
 *   _organizerFacade.events$.subscribe(e => { computeEffectiveConfig(); });
 *   _organizerFacade.update(organizer ?? {}, config);
 *   getEffectiveProvider() → ChartProvider avec les flags visible appliqués.
 */
export class ChartViewFacade<X extends XaxisType = any, Y extends YaxisType = any> {

  // ── État

  private _config: ChartOrganizerConfig = {};
  private _provider: ChartProvider<X, Y> | null = null;
  /** Ids connus à la dernière mise à jour : seuls les nouveaux ids sont auto-sélectionnés. */
  private _knownIds = new Set<string>();

  /** Champs (séries) disponibles, déduits des noms statiques du provider. */
  viewFields: ChartOrganizerFieldDef[] = [];

  /** Snapshot d'état courant : séries sélectionnées = visibles. */
  readonly state: ChartOrganizerState = {
    selectedFieldIds: [],
    groupByKey: null,
    dynamicSliceKeys: [],
  };

  // ── Événements

  private readonly _events$ = new Subject<ChartOrganizerEvent>();
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
  update(organizerConfig: ChartOrganizerConfig, provider: ChartProvider<X, Y>): void {
    this._config = organizerConfig ?? {};
    this._provider = provider;
    this.viewFields = organizerFieldDefsFromChartSeries(provider?.series ?? []);

    const existingIds = new Set(this.viewFields.map(f => f.id));
    // Une série jamais vue est visible par défaut ; une série déjà connue garde son état (même masquée).
    const added = [...existingIds].filter(id => !this._knownIds.has(id));
    const kept = this.state.selectedFieldIds.filter(id => existingIds.has(id));
    this.state.selectedFieldIds = [...kept, ...added];
    this._knownIds = existingIds;
  }

  /** Applique un état Organizer contrôlé par le composant parent. */
  setState(state: ChartOrganizerState): void {
    const existingIds = new Set(this.viewFields.map(field => field.id));
    this.state.selectedFieldIds = (state.selectedFieldIds ?? [])
      .filter(id => existingIds.has(id));
    this.state.groupByKey = state.groupByKey ?? null;
    this.state.dynamicSliceKeys = [...(state.dynamicSliceKeys ?? [])];
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
  getEffectiveProvider(applyState = false): ChartProvider<X, Y> {
    if (!this._provider) return null as any;
    if (!this.enabled && !applyState) return this._provider;
    return applyOrganizerStateToSeries(this._provider, this.state);
  }

  // ── Destructor

  destroy(): void {
    this._events$.complete();
  }
}
