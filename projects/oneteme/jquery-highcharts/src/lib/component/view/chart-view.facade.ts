import { Subject } from 'rxjs';
import { ChartProvider, XaxisType, YaxisType, OrganizerConfig, OrganizerFieldDef, OrganizerState, OrganizerEvent, organizerFieldDefsFromChartSeries, applyOrganizerStateToSeries } from '@oneteme/jquery-core';

export class ChartViewFacade<X extends XaxisType = any, Y extends YaxisType = any> {

  private _config: OrganizerConfig = {};
  private _provider: ChartProvider<X, Y> | null = null;

  viewFields: OrganizerFieldDef[] = [];

  readonly state: OrganizerState = {
    selectedFieldIds: [],
    groupByKey: null,
    dynamicSliceKeys: [],
  };

  private readonly _events$ = new Subject<OrganizerEvent>();
  readonly events$ = this._events$.asObservable();

  get enabled(): boolean {
    return this._config.enabled === true;
  }

  update(organizerConfig: OrganizerConfig, provider: ChartProvider<X, Y>): void {
    this._config = organizerConfig ?? {};
    this._provider = provider;
    this.viewFields = organizerFieldDefsFromChartSeries(provider?.series ?? []);

    const existingIds = new Set(this.viewFields.map(f => f.id));

    if (this.state.selectedFieldIds.length === 0) {
      this.state.selectedFieldIds = [...existingIds];
    } else {
      const kept = this.state.selectedFieldIds.filter(id => existingIds.has(id));
      const added = this.viewFields.filter(f => !this.state.selectedFieldIds.includes(f.id) && existingIds.has(f.id)).map(f => f.id);
      this.state.selectedFieldIds = [...kept, ...added];
    }
  }

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

  getEffectiveProvider(): ChartProvider<X, Y> {
    if (!this._provider) return null as any;
    if (!this.enabled) return this._provider;
    return applyOrganizerStateToSeries(this._provider, this.state);
  }

  destroy(): void {
    this._events$.complete();
  }
}
