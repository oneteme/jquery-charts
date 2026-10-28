import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Observable, of, Subject, throwError } from 'rxjs';
import { OrganizerButtonComponent } from './organizer-button.component';
import { OrganizerButtonEvent, OrganizerConfig, OrganizerSliceState, OrganizerState } from '../models';

const baseConfig = (): OrganizerConfig => ({
  fields: [
    { id: 'name', label: 'Nom' },
    { id: 'team', label: 'Équipe' },
    { id: 'hidden', label: 'Caché', visible: false },
  ],
  xFields: [{ id: 'day', label: 'Jour' }, { id: 'app', label: 'Application' }],
  yFields: [
    { id: 'count', label: 'Nombre' },
    { id: 'latency', label: 'Latence', aggregates: [{ id: 'avg', label: 'Moyenne' }, { id: 'max', label: 'Max' }] },
  ],
  groups: [{ id: 'status', label: 'Statut' }, { id: 'app', label: 'Application' }],
  slices: [{ id: 'ok', label: 'OK' }, { id: 'ko', label: 'KO' }],
  chartTypes: [{ id: 'bar', label: 'Barres' }, { id: 'line', label: 'Courbe' }, { id: 'pie', label: 'Camembert', disabled: true }],
  templates: [{ id: 'perf', label: 'Performance', xField: 'app', yField: 'latency', yAggregate: 'max', groupBy: 'status' }],
});

function setup(config: OrganizerConfig = baseConfig(), state?: OrganizerState) {
  const fixture: ComponentFixture<OrganizerButtonComponent> = TestBed.createComponent(OrganizerButtonComponent);
  const component = fixture.componentInstance;
  component.config = config;
  component.state = state;
  fixture.detectChanges();

  const events: OrganizerButtonEvent[] = [];
  const sliceStates: Array<OrganizerSliceState | null> = [];
  component.viewChange.subscribe(e => events.push(e));
  component.sliceStateChange.subscribe(s => sliceStates.push(s));
  const last = () => events.at(-1)!;
  return { fixture, component, events, sliceStates, last };
}

describe('OrganizerButtonComponent', () => {

  beforeEach(() => TestBed.configureTestingModule({
    imports: [OrganizerButtonComponent],
    providers: [provideNoopAnimations()],
  }));

  describe('champs visibles', () => {
    it('sans état, la visibilité vient de la config (visible !== false)', () => {
      const { component } = setup();
      expect(component.isFieldVisible('name')).toBeTrue();
      expect(component.isFieldVisible('hidden')).toBeFalse();
      expect(component.fieldsSummary()).toBe('3/3');
    });

    it('avec un état, la visibilité vient de visibleFields', () => {
      const { component } = setup(baseConfig(), { visibleFields: ['name'] });
      expect(component.isFieldVisible('name')).toBeTrue();
      expect(component.isFieldVisible('team')).toBeFalse();
      expect(component.fieldsSummary()).toBe('1/3');
    });

    it('onFieldToggle ajoute ou retire un champ de visibleFields', () => {
      const { component, last } = setup(baseConfig(), { visibleFields: ['name'] });
      component.onFieldToggle('team', true);
      expect(last().type).toBe('fieldToggled');
      expect(last().state.visibleFields).toEqual(['name', 'team']);

      component.onFieldToggle('name', false);
      expect(last().state.visibleFields).toEqual([]);
    });

    it('sans état, masquer un champ conserve les autres champs visibles par défaut', () => {
      const { component, last } = setup();
      component.onFieldToggle('team', false);
      expect(last().state.visibleFields).toEqual(['name']);
    });

    it('n\'ajoute pas deux fois un champ déjà visible', () => {
      const { component, last } = setup(baseConfig(), { visibleFields: ['name'] });
      component.onFieldToggle('name', true);
      expect(last().state.visibleFields).toEqual(['name']);
    });
  });

  describe('sélections X / Y / Group by / type de graphique', () => {
    it('X : émet la sélection, ignore une re-sélection identique et normalise un identifiant inconnu', () => {
      const { component, events, last } = setup(baseConfig(), { selectedX: 'day' });
      component.onXFieldSelect('day');
      expect(events.length).toBe(0);

      component.onXFieldSelect('app');
      expect(last().type).toBe('xSelected');
      expect(last().state.selectedX).toBe('app');
      expect(last().source).toBe('user');

      component.onXFieldSelect('ghost');
      expect(last().state.selectedX).toBeUndefined();
    });

    it('Y : sélectionner un champ à agrégats choisit le premier agrégat', () => {
      const { component, last } = setup();
      component.onYFieldSelect('latency');
      expect(last().type).toBe('ySelected');
      expect(last().state.selectedY).toBe('latency');
      expect(last().state.selectedYAggregate).toBe('avg');

      component.onYFieldSelect('count');
      expect(last().state.selectedYAggregate).toBeUndefined();
    });

    it('Y : ignore une re-sélection identique et applique un agrégat précis', () => {
      const { component, events, last } = setup(baseConfig(), { selectedY: 'count' });
      component.onYFieldSelect('count');
      expect(events.length).toBe(0);

      component.onYAggregateSelect('latency', 'max');
      expect(last().state.selectedY).toBe('latency');
      expect(last().state.selectedYAggregate).toBe('max');

      const before = events.length;
      component.state = last().state;
      component.onYAggregateSelect('latency', 'max');
      expect(events.length).toBe(before);
    });

    it('Group by : un second clic sur le même groupe le désactive', () => {
      const { component, last } = setup();
      component.onGroupBySelect('status');
      expect(last().state.selectedGroupBy).toBe('status');

      component.state = last().state;
      component.onGroupBySelect('status');
      expect(last().state.selectedGroupBy).toBeUndefined();
    });

    it('type de graphique : ignore un type désactivé, inconnu ou déjà actif', () => {
      const { component, events, last } = setup(baseConfig(), { selectedChartType: 'bar' });
      component.onChartTypeSelect('pie');
      component.onChartTypeSelect('ghost');
      component.onChartTypeSelect('bar');
      expect(events.length).toBe(0);

      component.onChartTypeSelect('line');
      expect(last().type).toBe('chartTypeSelected');
      expect(last().state.selectedChartType).toBe('line');
    });
  });

  describe('modèles', () => {
    it('applique un modèle et le marque comme sélectionné', () => {
      const { component, last } = setup();
      component.onTemplateSelect('perf');

      expect(last().type).toBe('templateSelected');
      expect(last().state.selectedX).toBe('app');
      expect(last().state.selectedY).toBe('latency');
      expect(last().state.selectedYAggregate).toBe('max');
      expect(last().state.selectedGroupBy).toBe('status');
      expect(last().state.selectedTemplate).toBe('perf');
    });

    it('ignore un modèle inconnu ou une config sans modèle', () => {
      const { component, events } = setup();
      component.onTemplateSelect('ghost');
      expect(events.length).toBe(0);

      const bare = setup({ ...baseConfig(), templates: undefined });
      bare.component.onTemplateSelect('perf');
      expect(bare.events.length).toBe(0);
    });

    it('un changement manuel qui correspond à un modèle le sélectionne automatiquement', () => {
      const { component, last } = setup(baseConfig(), { selectedY: 'latency', selectedYAggregate: 'max', selectedGroupBy: 'status' });
      component.onXFieldSelect('app');
      expect(last().state.selectedTemplate).toBe('perf');
    });
  });

  describe('slices', () => {
    it('ajoute puis retire un slice sélectionné et notifie onSliceClick', () => {
      const onSliceClick = jasmine.createSpy('onSliceClick');
      const { component, last, sliceStates } = setup({ ...baseConfig(), onSliceClick });

      component.onSliceClick('ok');
      expect(last().type).toBe('sliceSelected');
      expect(last().state.selectedSlices).toEqual(['ok']);
      expect(onSliceClick).toHaveBeenCalledTimes(1);
      expect(sliceStates.at(-1)).toBeNull();

      component.state = last().state;
      component.onSliceClick('ok');
      expect(last().state.selectedSlices).toEqual([]);
    });

    it('charge les données du slice avant d\'émettre la sélection', () => {
      const onFetchSliceData = jasmine.createSpy('onFetchSliceData').and.returnValue(of([{ id: 1 }]));
      const { component, last, sliceStates, events } = setup({ ...baseConfig(), onFetchSliceData });

      component.onSliceClick('ko');
      expect(onFetchSliceData).toHaveBeenCalledOnceWith('ko');
      expect(sliceStates.at(-1)).toEqual({ sliceConfigs: [{ title: 'KO', columnKey: 'ko' }], tasks: [{ id: 1 }], filterApplied: false });
      expect(events.length).toBe(1);
      expect(last().state.selectedSlices).toEqual(['ko']);
    });

    it('accepte une promesse et signale une erreur de chargement sans bloquer la sélection', async () => {
      const failing = setup({ ...baseConfig(), onFetchSliceData: () => Promise.reject(new Error('boom')) });
      spyOn(console, 'error');
      failing.component.onSliceClick('ko');
      await Promise.resolve();
      await Promise.resolve();

      expect(failing.sliceStates.at(-1)).toBeNull();
      expect(failing.events.at(-1)?.state.selectedSlices).toEqual(['ko']);
    });

    it('une erreur d\'observable est traitée de la même façon', () => {
      const onFetchSliceData = () => throwError(() => new Error('boom')) as Observable<any[]>;
      const { component, last, sliceStates } = setup({ ...baseConfig(), onFetchSliceData });
      spyOn(console, 'error');
      component.onSliceClick('ko');
      expect(sliceStates.at(-1)).toBeNull();
      expect(last().state.selectedSlices).toEqual(['ko']);
    });

    it('n\'émet rien après la destruction du composant', () => {
      const pending = new Subject<any[]>();
      const { component, fixture, events } = setup({ ...baseConfig(), onFetchSliceData: () => pending });
      component.onSliceClick('ok');
      fixture.destroy();
      pending.next([]);
      expect(events.length).toBe(0);
    });

    it('ignore la réponse d\'un ancien clic arrivée après celle du dernier clic', () => {
      const responses: Subject<any[]>[] = [];
      const { component, sliceStates } = setup({
        ...baseConfig(),
        onFetchSliceData: () => { const s = new Subject<any[]>(); responses.push(s); return s; },
      });
      component.onSliceClick('ok');
      component.onSliceClick('ko');
      responses[1].next([{ id: 'recent' }]);
      responses[0].next([{ id: 'stale' }]);

      expect(sliceStates.at(-1)?.tasks).toEqual([{ id: 'recent' }]);
    });
  });

  describe('autres actions', () => {
    it('reset restaure les champs visibles par défaut et vide les sélections', () => {
      const { component, last } = setup(baseConfig(), { selectedX: 'day', selectedY: 'count', selectedGroupBy: 'status', selectedSlices: ['ok'] });
      component.onReset();

      expect(last().type).toBe('reset');
      expect(last().state.visibleFields).toEqual(['name', 'team']);
      expect(last().state.selectedX).toBeUndefined();
      expect(last().state.selectedY).toBeUndefined();
      expect(last().state.selectedGroupBy).toBeUndefined();
      expect(last().state.selectedSlices).toEqual([]);
    });

    it('switchView bascule entre graphique et tableau et notifie les deux canaux', () => {
      const onSwitch = jasmine.createSpy('onSwitch');
      const { component, last } = setup({ ...baseConfig(), switchView: { currentView: 'chart', onSwitch } });
      component.onSwitchView();
      expect(onSwitch).toHaveBeenCalledOnceWith('table');
      expect(last().type).toBe('viewSwitched');
      expect(last().state.viewMode).toBe('table');

      const table = setup({ ...baseConfig(), switchView: { currentView: 'table', onSwitch } });
      table.component.onSwitchView();
      expect(table.last().state.viewMode).toBe('chart');
    });

    it('les actions d\'export, de copie, de plein écran et de préférences appellent les callbacks', () => {
      const cb = {
        onExport: jasmine.createSpy('onExport'),
        onExportVisual: jasmine.createSpy('onExportVisual'),
        onExportData: jasmine.createSpy('onExportData'),
        onCopyVisual: jasmine.createSpy('onCopyVisual'),
        onToggleFullscreen: jasmine.createSpy('onToggleFullscreen'),
        onPreferencesEdit: jasmine.createSpy('onPreferencesEdit'),
        onPreferencesSave: jasmine.createSpy('onPreferencesSave'),
        onPreferencesClear: jasmine.createSpy('onPreferencesClear'),
      };
      const { component } = setup({ ...baseConfig(), ...cb });
      component.onExport(); component.onExportVisual(); component.onExportData(); component.onCopyVisual();
      component.onToggleFullscreen(); component.onPreferencesEdit(); component.onPreferencesSave(); component.onPreferencesClear();
      Object.values(cb).forEach(spy => expect(spy).toHaveBeenCalledTimes(1));
    });

    it('les actions sans callback ne plantent pas', () => {
      const { component } = setup();
      expect(() => {
        component.onExport(); component.onExportVisual(); component.onExportData(); component.onCopyVisual();
        component.onToggleFullscreen(); component.onPreferencesEdit(); component.onPreferencesSave(); component.onPreferencesClear();
      }).not.toThrow();
    });

    it('visibilité des actions : copie, plein écran, libellé', () => {
      const none = setup().component;
      expect(none.hasActions()).toBeFalse();

      const copyOnly = setup({ ...baseConfig(), showActions: true, onCopyVisual: () => undefined }).component;
      expect(copyOnly.hasActions()).toBeTrue();
      expect(copyOnly.actionsLabel()).toBe('Action');

      const both = setup({ ...baseConfig(), showActions: true, onCopyVisual: () => undefined, onToggleFullscreen: () => undefined }).component;
      expect(both.actionsLabel()).toBe('Actions');

      const hidden = setup({ ...baseConfig(), showActions: true, onCopyVisual: () => undefined, actions: { showCopy: false } }).component;
      expect(hidden.hasActions()).toBeFalse();

      const labelled = setup({ ...baseConfig(), actions: { label: 'Outils' } }).component;
      expect(labelled.actionsLabel()).toBe('Outils');
    });

    it('hasExportSubMenu et hasSwitchView reflètent la config', () => {
      expect(setup().component.hasExportSubMenu()).toBeFalse();
      expect(setup({ ...baseConfig(), onExportData: () => undefined }).component.hasExportSubMenu()).toBeTrue();
      expect(setup().component.hasSwitchView()).toBeFalse();
    });
  });

  describe('libellés actifs', () => {
    it('retourne des libellés lisibles, ou l\'identifiant si inconnu, ou vide', () => {
      const { component } = setup(baseConfig(), {
        selectedX: 'day', selectedY: 'latency', selectedYAggregate: 'max', selectedGroupBy: 'status',
        selectedChartType: 'bar', selectedSlices: ['ok'], selectedTemplate: 'perf',
      });
      expect(component.activeXLabel()).toBe('Jour');
      expect(component.activeYLabel()).toBe('Latence · Max');
      expect(component.activeGroupByLabel()).toBe('Statut');
      expect(component.activeChartTypeLabel()).toBe('Barres');
      expect(component.activeSlicesLabel()).toBe('OK');
      expect(component.activeTemplateLabel()).toBe('Performance');
      expect(component.isYActive('latency')).toBeTrue();
      expect(component.isYAggregateActive('latency', 'max')).toBeTrue();
      expect(component.isYAggregateActive('latency', 'avg')).toBeFalse();
      expect(component.isChartTypeActive('bar')).toBeTrue();

      component.state = { selectedX: 'zzz', selectedSlices: ['ok', 'ko'] };
      expect(component.activeXLabel()).toBe('zzz');
      expect(component.activeSlicesLabel()).toBe('2 sélectionnés');
      component.state = undefined;
      expect(component.activeXLabel()).toBe('');
      expect(component.activeYLabel()).toBe('');
      expect(component.activeSlicesLabel()).toBe('');
    });
  });

  describe('chargement des données d\'un champ', () => {
    it('charge une seule fois puis sert le cache', async () => {
      const onFetchFieldData = jasmine.createSpy('onFetchFieldData').and.resolveTo(['a', 'b']);
      const { component } = setup({ ...baseConfig(), onFetchFieldData });

      await component.loadFieldData('name');
      await component.loadFieldData('name');
      expect(onFetchFieldData).toHaveBeenCalledTimes(1);
      expect(component.loadingFieldId).toBeUndefined();
    });

    it('un échec n\'est pas mis en cache : une nouvelle tentative est possible', async () => {
      spyOn(console, 'error');
      const onFetchFieldData = jasmine.createSpy('onFetchFieldData').and.returnValues(Promise.reject(new Error('boom')), Promise.resolve(['ok']));
      const { component } = setup({ ...baseConfig(), onFetchFieldData });

      await component.loadFieldData('name');
      expect(component.loadingFieldId).toBeUndefined();
      await component.loadFieldData('name');
      expect(onFetchFieldData).toHaveBeenCalledTimes(2);
    });

    it('ignore un champ inconnu ou l\'absence de callback', async () => {
      const onFetchFieldData = jasmine.createSpy('onFetchFieldData').and.resolveTo([]);
      await setup({ ...baseConfig(), onFetchFieldData }).component.loadFieldData('ghost');
      expect(onFetchFieldData).not.toHaveBeenCalled();
      await expectAsync(setup().component.loadFieldData('name')).toBeResolved();
    });
  });

  describe('rendu', () => {
    it('n\'écrit rien dans la console lors d\'interactions normales', () => {
      const debug = spyOn(console, 'debug');
      const log = spyOn(console, 'log');
      const { component } = setup(baseConfig(), { selectedX: 'day' });
      component.onXFieldSelect('app');
      component.onYFieldSelect('count');
      component.onGroupBySelect('status');
      component.onSliceClick('ok');
      expect(debug).not.toHaveBeenCalled();
      expect(log).not.toHaveBeenCalled();
    });

    it('affiche le bouton déclencheur du menu', () => {
      const { fixture } = setup();
      expect(fixture.nativeElement.querySelector('button')).not.toBeNull();
    });
  });
});
