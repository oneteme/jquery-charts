import { EventEmitter, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  ChartDrilldownConfig,
  ChartProvider,
  ChartType,
  DuplicateVisualSnapshotLabelError,
  FullscreenManager,
  VISUAL_SNAPSHOT_STORAGE_KEY,
  VisualSnapshot,
} from '@oneteme/jquery-core';
import { BarChartDirective } from '../directive/bar-chart.directive';
import { LineChartDirective } from '../directive/line-chart.directive';
import { PieChartDirective } from '../directive/pie-chart.directive';
import { RangeChartDirective } from '../directive/range-chart.directive';
import { TreemapChartDirective } from '../directive/treemap-chart.directive';
import { ChartComponent } from './chart.component';

const DATA = [
  { mois: 'Jan', valeur: 10, cout: 4 },
  { mois: 'Fév', valeur: 20, cout: 8 },
  { mois: 'Mar', valeur: 15, cout: 6 },
];

const BASE_CONFIG: ChartProvider<any, any> = {
  title: 'Ventes 2024',
  series: [
    { name: 'Ventes', data: { xField: 'mois', yField: 'valeur' } },
    { name: 'Coûts', data: { xField: 'mois', yField: 'cout' } },
  ],
};

const DRILLDOWN: ChartDrilldownConfig = {
  levels: [
    { id: 'year', label: 'Année' },
    { id: 'month', label: 'Mois', groupBy: 'mois' },
    { id: 'day', label: 'Jour', groupBy: 'jour' },
  ],
  activeLevel: 'year',
};

const CHART_DIRECTIVE_SELECTOR = '[line-chart],[bar-chart],[pie-chart],[range-chart],[treemap-chart]';

function settle(ms = 30): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitFor(condition: () => boolean, timeout = 3000): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error('Délai dépassé en attendant la condition.');
    }
    await settle(20);
  }
}

function collect<T>(emitter: EventEmitter<T>): T[] {
  const values: T[] = [];
  emitter.subscribe(value => values.push(value));
  return values;
}

describe('ChartComponent', () => {
  let fixture: ComponentFixture<ChartComponent<any, any>>;
  let component: ChartComponent<any, any>;

  function createChart(inputs: {
    type: ChartType;
    config?: ChartProvider<any, any>;
    data?: any[];
    drilldown?: ChartDrilldownConfig;
  }): void {
    fixture = TestBed.createComponent(ChartComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('type', inputs.type);
    fixture.componentRef.setInput('config', inputs.config ?? BASE_CONFIG);
    fixture.componentRef.setInput('data', inputs.data ?? DATA);
    fixture.componentRef.setInput('drilldown', inputs.drilldown);
    fixture.detectChanges();
  }

  function findDirective<T>(directive: Type<T>): T | null {
    const element = fixture.debugElement.query(By.directive(directive));
    return element ? element.injector.get(directive) : null;
  }

  function buildSnapshot(selectedFieldIds?: string[], warnings: string[] = []): VisualSnapshot {
    const draft = component.createVisualSnapshot('Import');
    return {
      ...draft,
      id: 'snapshot-test',
      schemaVersion: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      state: selectedFieldIds ? { selectedFieldIds } : {},
      warnings,
    } as VisualSnapshot;
  }

  beforeEach(() => {
    localStorage.removeItem(VISUAL_SNAPSHOT_STORAGE_KEY);
    TestBed.configureTestingModule({ imports: [ChartComponent] });
  });

  afterEach(() => {
    localStorage.removeItem(VISUAL_SNAPSHOT_STORAGE_KEY);
  });

  describe('rendu selon le type', () => {
    const expectations: [ChartType, Type<unknown>][] = [
      ['line', LineChartDirective],
      ['area', LineChartDirective],
      ['bar', BarChartDirective],
      ['column', BarChartDirective],
      ['funnel', BarChartDirective],
      ['pyramid', BarChartDirective],
      ['pie', PieChartDirective],
      ['donut', PieChartDirective],
      ['polar', PieChartDirective],
      ['radar', PieChartDirective],
      ['radial', PieChartDirective],
      ['treemap', TreemapChartDirective],
      ['heatmap', TreemapChartDirective],
      ['rangeArea', RangeChartDirective],
      ['rangeBar', RangeChartDirective],
      ['rangeColumn', RangeChartDirective],
    ];

    for (const [type, directive] of expectations) {
      it(`affiche uniquement la directive adaptée au type ${type}`, () => {
        createChart({ type });

        expect(findDirective(directive)).not.toBeNull();
        expect(fixture.debugElement.queryAll(By.css(CHART_DIRECTIVE_SELECTOR)).length).toBe(1);
      });
    }

    it('transmet le type courant à la directive rendue', () => {
      createChart({ type: 'funnel' });

      expect(findDirective(BarChartDirective)?.type).toBe('funnel');
    });

    it("n'affiche aucun graphique pour un type non géré", () => {
      createChart({ type: 'sunburst' as ChartType });

      expect(fixture.debugElement.queryAll(By.css(CHART_DIRECTIVE_SELECTOR)).length).toBe(0);
    });

    it('remplace la directive lorsque le type change', () => {
      createChart({ type: 'bar' });
      fixture.componentRef.setInput('type', 'line');
      fixture.detectChanges();

      expect(findDirective(LineChartDirective)).not.toBeNull();
      expect(findDirective(BarChartDirective)).toBeNull();
    });
  });

  describe('propriétés de l\'hôte', () => {
    it('applique la hauteur de configuration en pixels à l\'hôte', () => {
      createChart({ type: 'bar', config: { ...BASE_CONFIG, height: 320 } });

      expect(fixture.nativeElement.style.height).toBe('320px');
    });

    it('n\'applique aucune hauteur lorsque la valeur n\'est pas finie', () => {
      createChart({ type: 'bar', config: { ...BASE_CONFIG, height: NaN } });

      expect(fixture.nativeElement.style.height).toBe('');
    });

    it('ajoute la classe drilldown-active lorsqu\'un niveau enfant est actif', () => {
      createChart({ type: 'bar', drilldown: { ...DRILLDOWN, activeLevel: 'month' } });

      expect(fixture.nativeElement.classList.contains('drilldown-active')).toBeTrue();
    });

    it('n\'ajoute pas la classe drilldown-active au niveau racine', () => {
      createChart({ type: 'bar', drilldown: DRILLDOWN });

      expect(fixture.nativeElement.classList.contains('drilldown-active')).toBeFalse();
    });

    it('ajoute la classe visual-fullscreen lorsque le mode plein écran est actif', () => {
      createChart({ type: 'bar' });
      spyOn(FullscreenManager, 'isActive').and.returnValue(true);

      component.onFullscreenChange();
      fixture.detectChanges();

      expect(fixture.nativeElement.classList.contains('visual-fullscreen')).toBeTrue();
    });
  });

  describe('changement de type (previous / next)', () => {
    it('passe au type suivant de la même famille', () => {
      createChart({ type: 'bar' });

      component.change('next');

      expect(component._type).toBe('column');
    });

    it('revient au dernier type de la famille lorsqu\'on remonte depuis le premier', () => {
      createChart({ type: 'bar' });

      component.change('previous');

      expect(component._type).toBe('treemap');
    });

    it('revient au premier type de la famille lorsqu\'on avance depuis le dernier', () => {
      createChart({ type: 'treemap' });

      component.change('next');

      expect(component._type).toBe('bar');
    });

    it('cycle entre les types de la famille pie (donut, polar, radar, radial)', () => {
      createChart({ type: 'pie' });

      const visited: ChartType[] = [];
      for (let i = 0; i < 5; i++) {
        component.change('next');
        visited.push(component._type);
      }

      expect(visited).toEqual(['donut', 'polar', 'radar', 'radial', 'pie']);
    });

    it('bascule entre funnel et pyramid', () => {
      createChart({ type: 'funnel' });

      component.change('next');
      expect(component._type).toBe('pyramid');

      component.change('previous');
      expect(component._type).toBe('funnel');
    });

    it('ne modifie pas le type lorsque celui-ci n\'appartient à aucune famille', () => {
      createChart({ type: 'sunburst' as ChartType });

      component.change('next');

      expect(component._type).toBe('sunburst');
    });

    it('émet toujours l\'événement customEvent après un changement de type', () => {
      createChart({ type: 'bar' });
      const events = collect(component.customEvent);

      component.change('next');

      expect(events).toEqual(['next']);
    });

    it('met à jour le graphique rendu lorsque la directive enfant demande un changement', () => {
      createChart({ type: 'bar' });
      const events = collect(component.customEvent);

      findDirective(BarChartDirective)!.customEvent.emit('next');
      fixture.detectChanges();

      expect(component._type).toBe('column');
      expect(events).toEqual(['next']);
    });
  });

  describe('pivot', () => {
    it('émet pivot sans modifier la configuration lorsque enablePivot est désactivé', () => {
      createChart({ type: 'bar' });
      const events = collect(component.customEvent);

      component.change('pivot');

      expect(component.config.pivot).toBeUndefined();
      expect(events).toEqual(['pivot']);
    });

    it('bascule le pivot à chaque action lorsque enablePivot est activé', () => {
      createChart({ type: 'bar' });
      fixture.componentRef.setInput('enablePivot', true);
      fixture.detectChanges();

      component.change('pivot');
      expect(component.config.pivot).toBeTrue();
      expect(component._effectiveConfig.pivot).toBeTrue();

      component.change('pivot');
      expect(component.config.pivot).toBeFalse();
    });

    it('ne bascule pas le pivot pour un type dont canPivot vaut false', () => {
      createChart({ type: 'funnel' });
      fixture.componentRef.setInput('enablePivot', true);
      fixture.detectChanges();

      component.change('pivot');

      expect(component.config.pivot).toBeUndefined();
    });

    it('bascule le pivot pour un type pie', () => {
      createChart({ type: 'pie' });
      fixture.componentRef.setInput('enablePivot', true);
      fixture.detectChanges();

      component.change('pivot');

      expect(component.config.pivot).toBeTrue();
    });
  });

  describe('drill-down', () => {
    it('émet chartClick sans demande de drill-down lorsqu\'aucune configuration n\'est fournie', () => {
      createChart({ type: 'bar' });
      const clicks = collect(component.chartClick);
      const requests = collect(component.drilldownRequest);

      component.handleChartClick({ name: '2023' });

      expect(clicks).toEqual([{ name: '2023' }]);
      expect(requests).toEqual([]);
    });

    it('émet une demande de drill-down vers le niveau suivant lors d\'un clic', () => {
      createChart({ type: 'bar', drilldown: DRILLDOWN });
      const requests = collect(component.drilldownRequest);

      component.handleChartClick({ name: '2023' });

      expect(requests).toEqual([{
        fromLevel: 'year',
        toLevel: 'month',
        groupBy: 'mois',
        value: '2023',
        path: { year: '2023' },
      }]);
    });

    it('ignore le clic lorsque le clic n\'a pas de nom', () => {
      createChart({ type: 'bar', drilldown: DRILLDOWN });
      const requests = collect(component.drilldownRequest);

      component.handleChartClick({ value: 10 });

      expect(requests).toEqual([]);
    });

    it('ne demande pas de drill-down depuis le dernier niveau', () => {
      createChart({ type: 'bar', drilldown: { ...DRILLDOWN, activeLevel: 'day' } });
      const requests = collect(component.drilldownRequest);

      component.handleChartClick({ name: 'Lundi' });

      expect(requests).toEqual([]);
    });

    it('accumule le chemin de drill-down au fil des niveaux', () => {
      createChart({ type: 'bar', drilldown: DRILLDOWN });
      const requests = collect(component.drilldownRequest);

      component.handleChartClick({ name: '2023' });
      component.drilldown = { ...DRILLDOWN, activeLevel: 'month' };
      component.handleChartClick({ name: 'Jan' });

      expect(requests[1].path).toEqual({ year: '2023', month: 'Jan' });
      expect(requests[1].toLevel).toBe('day');
    });

    it('élague le chemin lors d\'une navigation vers un niveau supérieur', () => {
      createChart({ type: 'bar', drilldown: DRILLDOWN });
      const requests = collect(component.drilldownRequest);
      const navigations = collect(component.drilldownNavigate);

      component.handleChartClick({ name: '2023' });
      component.drilldown = { ...DRILLDOWN, activeLevel: 'month' };
      component.handleChartClick({ name: 'Jan' });
      component.drilldown = { ...DRILLDOWN, activeLevel: 'day' };
      component.navigateDrilldown('month');
      component.drilldown = { ...DRILLDOWN, activeLevel: 'month' };
      component.handleChartClick({ name: 'Fév' });

      expect(navigations).toEqual(['month']);
      expect(requests[2].path).toEqual({ year: '2023', month: 'Fév' });
    });

    it('n\'émet pas de navigation vers le niveau déjà actif', () => {
      createChart({ type: 'bar', drilldown: { ...DRILLDOWN, activeLevel: 'month' } });
      const navigations = collect(component.drilldownNavigate);

      component.navigateDrilldown('month');

      expect(navigations).toEqual([]);
    });

    it('émet la navigation vers un identifiant de niveau inconnu sans modifier le chemin', () => {
      createChart({ type: 'bar', drilldown: { ...DRILLDOWN, activeLevel: 'month' } });
      const navigations = collect(component.drilldownNavigate);

      component.navigateDrilldown('inconnu');

      expect(navigations).toEqual(['inconnu']);
    });

    it('ne garde que les niveaux jusqu\'au niveau actif', () => {
      createChart({ type: 'bar', drilldown: { ...DRILLDOWN, activeLevel: 'month' } });

      expect(component.drilldownLevels.map(level => level.id)).toEqual(['year', 'month']);
    });

    it('conserve tous les niveaux lorsque le niveau actif est inconnu', () => {
      createChart({ type: 'bar', drilldown: { ...DRILLDOWN, activeLevel: 'inconnu' } });

      expect(component.drilldownLevels.length).toBe(3);
      expect(component.drilldownIsActive).toBeFalse();
    });

    it('décrit l\'état de drill-down au niveau racine', () => {
      createChart({ type: 'bar', drilldown: DRILLDOWN });

      expect(component.drilldownState).toEqual({ active: false, activeLevel: 'year', rootLevel: 'year' });
    });

    it('décrit un état vide sans configuration de drill-down', () => {
      createChart({ type: 'bar' });

      expect(component.drilldownState).toEqual({ active: false, activeLevel: '', rootLevel: null });
    });

    it('émet drilldownStateChange lorsque la configuration de drill-down change', () => {
      createChart({ type: 'bar', drilldown: DRILLDOWN });
      const states = collect(component.drilldownStateChange);

      fixture.componentRef.setInput('drilldown', { ...DRILLDOWN, activeLevel: 'month' });
      fixture.detectChanges();

      expect(states).toEqual([{ active: true, activeLevel: 'month', rootLevel: 'year' }]);
    });

    it('affiche la navigation des niveaux et désactive le niveau courant', () => {
      createChart({ type: 'bar', drilldown: { ...DRILLDOWN, activeLevel: 'month' } });

      const buttons = fixture.debugElement.queryAll(By.css('.chart-drilldown-link'));
      const labels = buttons.map(button => (button.nativeElement as HTMLElement).textContent?.trim());

      expect(labels).toEqual(['Année', 'Mois']);
      expect((buttons[1].nativeElement as HTMLButtonElement).disabled).toBeTrue();
      expect(buttons[1].nativeElement.getAttribute('aria-current')).toBe('page');
    });

    it('navigue vers le niveau cliqué depuis la barre de navigation', () => {
      createChart({ type: 'bar', drilldown: { ...DRILLDOWN, activeLevel: 'month' } });
      const navigations = collect(component.drilldownNavigate);

      fixture.debugElement.queryAll(By.css('.chart-drilldown-link'))[0].nativeElement.click();

      expect(navigations).toEqual(['year']);
    });

    it('relaie les clics du graphique enfant vers la demande de drill-down', () => {
      createChart({ type: 'bar', drilldown: DRILLDOWN });
      const clicks = collect(component.chartClick);
      const requests = collect(component.drilldownRequest);

      findDirective(BarChartDirective)!.chartClick.emit({ name: '2024' });

      expect(clicks).toEqual([{ name: '2024' }]);
      expect(requests[0].value).toBe('2024');
    });
  });

  describe('organizer', () => {
    it('sélectionne toutes les séries nommées par défaut lorsque l\'organizer est activé', () => {
      createChart({ type: 'bar' });
      fixture.componentRef.setInput('organizer', { enabled: true });
      fixture.detectChanges();

      expect(component._organizerFacade.enabled).toBeTrue();
      expect(component._organizerFacade.viewFields.map(field => field.id)).toEqual(['Ventes', 'Coûts']);
      expect(component._organizerFacade.state.selectedFieldIds).toEqual(['Ventes', 'Coûts']);
    });

    it('accepte l\'alias view lorsque organizer n\'est pas renseigné', () => {
      createChart({ type: 'bar' });
      fixture.componentRef.setInput('view', { enabled: true });
      fixture.detectChanges();

      expect(component._organizerFacade.enabled).toBeTrue();
    });

    it('retourne la configuration d\'origine lorsque l\'organizer est désactivé', () => {
      createChart({ type: 'bar' });

      expect(component._effectiveConfig).toBe(BASE_CONFIG);
    });

    it('masque les séries absentes de organizerState', () => {
      createChart({ type: 'bar' });
      fixture.componentRef.setInput('organizer', { enabled: true });
      fixture.componentRef.setInput('organizerState', { selectedFieldIds: ['Ventes'], groupByKey: null, dynamicSliceKeys: [] });
      fixture.detectChanges();

      const [ventes, couts] = component._effectiveConfig.series as any[];
      expect(component._organizerFacade.state.selectedFieldIds).toEqual(['Ventes']);
      expect(ventes.visible).toBeTrue();
      expect(couts.visible).toBeFalse();
    });

    it('applique organizerState même lorsque l\'organizer est désactivé', () => {
      createChart({ type: 'bar' });
      fixture.componentRef.setInput('organizerState', { selectedFieldIds: ['Coûts'], groupByKey: null, dynamicSliceKeys: [] });
      fixture.detectChanges();

      const [ventes, couts] = component._effectiveConfig.series as any[];
      expect(ventes.visible).toBeFalse();
      expect(couts.visible).toBeTrue();
    });

    it('ignore les identifiants de séries inconnus dans organizerState', () => {
      createChart({ type: 'bar' });
      fixture.componentRef.setInput('organizer', { enabled: true });
      fixture.componentRef.setInput('organizerState', { selectedFieldIds: ['Inconnu', 'Coûts'], groupByKey: null, dynamicSliceKeys: [] });
      fixture.detectChanges();

      expect(component._organizerFacade.state.selectedFieldIds).toEqual(['Coûts']);
    });
  });

  describe('exports et plein écran', () => {
    it('délègue exportData à la directive active avec ses paramètres', () => {
      createChart({ type: 'bar' });
      const directive = findDirective(BarChartDirective)!;
      const spy = spyOn(directive, 'exportData');

      component.exportData('bilan', ';');

      expect(spy).toHaveBeenCalledOnceWith('bilan', ';');
    });

    it('délègue exportImage à la directive active avec ses paramètres', () => {
      createChart({ type: 'line' });
      const directive = findDirective(LineChartDirective)!;
      const spy = spyOn(directive, 'exportImage');

      component.exportImage('graphique', 'png', 2);

      expect(spy).toHaveBeenCalledOnceWith('graphique', 'png', 2);
    });

    it('ignore les exports lorsqu\'aucune directive n\'est rendue', () => {
      createChart({ type: 'sunburst' as ChartType });

      expect(() => {
        component.exportImage('graphique');
        component.exportData('bilan');
      }).not.toThrow();
    });

    it('redimensionne le graphique actif lors d\'un changement de plein écran', () => {
      createChart({ type: 'pie' });
      const directive = findDirective(PieChartDirective)!;
      const spy = spyOn(directive, 'resize');
      spyOn(FullscreenManager, 'isActive').and.returnValue(false);

      component.onFullscreenChange();

      expect(spy).toHaveBeenCalled();
      expect(component.isFullscreen).toBeFalse();
    });

    it('active le plein écran et retourne true lorsque le basculement réussit', async () => {
      createChart({ type: 'bar' });
      spyOn(FullscreenManager, 'toggle').and.resolveTo(true);

      const result = await component.toggleFullscreen();

      expect(result).toBeTrue();
      expect(component.isFullscreen).toBeTrue();
    });

    it('retourne false lorsque le basculement du plein écran échoue', async () => {
      createChart({ type: 'bar' });
      spyOn(FullscreenManager, 'toggle').and.rejectWith(new Error('refusé'));

      const result = await component.toggleFullscreen();

      expect(result).toBeFalse();
      expect(component.isFullscreen).toBeFalse();
    });
  });

  describe('instantanés visuels', () => {
    it('crée un snapshot à partir du titre de configuration', () => {
      createChart({ type: 'bar' });
      const emitted = collect(component.visualCopied);

      const snapshot = component.copyVisualSnapshot();

      expect(snapshot).not.toBeNull();
      expect(snapshot!.label).toBe('Ventes 2024');
      expect(snapshot!.type).toBe('chart');
      expect(snapshot!.config['type']).toBe('bar');
      expect(snapshot!.data).toEqual(DATA);
      expect(emitted).toEqual([snapshot!]);
    });

    it('persiste le snapshot dans le stockage local', () => {
      createChart({ type: 'bar' });

      component.copyVisualSnapshot('Trimestre');

      const stored = JSON.parse(localStorage.getItem(VISUAL_SNAPSHOT_STORAGE_KEY)!);
      expect(stored.snapshots.length).toBe(1);
      expect(stored.snapshots[0].label).toBe('Trimestre');
    });

    it('normalise les espaces du libellé fourni', () => {
      createChart({ type: 'bar' });

      const snapshot = component.copyVisualSnapshot('  Mon   graphique ');

      expect(snapshot!.label).toBe('Mon graphique');
    });

    it('utilise le libellé par défaut lorsque la configuration n\'a pas de titre', () => {
      createChart({ type: 'bar', config: { series: BASE_CONFIG.series } });

      const snapshot = component.copyVisualSnapshot();

      expect(snapshot!.label).toBe('Graphique');
    });

    it('ne crée aucun snapshot pour un libellé vide ou blanc', () => {
      createChart({ type: 'bar' });
      const emitted = collect(component.visualCopied);

      expect(component.copyVisualSnapshot('   ')).toBeNull();
      expect(localStorage.getItem(VISUAL_SNAPSHOT_STORAGE_KEY)).toBeNull();
      expect(emitted).toEqual([]);
    });

    it('refuse un second snapshot portant le même libellé', () => {
      createChart({ type: 'bar' });
      component.copyVisualSnapshot('Doublon');

      expect(() => component.copyVisualSnapshot('doublon')).toThrowError(DuplicateVisualSnapshotLabelError);
    });

    it('affiche le message de copie par défaut puis le masque après la durée', async () => {
      createChart({ type: 'bar' });
      fixture.componentRef.setInput('copyFeedback', { durationMs: 50 });
      fixture.detectChanges();

      component.copyVisualSnapshot('Feedback');
      fixture.detectChanges();

      expect(component.copyFeedbackText).toBe('Copié');
      expect(fixture.nativeElement.querySelector('.visual-copy-feedback')).not.toBeNull();

      await waitFor(() => component.copyFeedbackText === '');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.visual-copy-feedback')).toBeNull();
    });

    it('utilise le message de copie personnalisé', () => {
      createChart({ type: 'bar' });
      fixture.componentRef.setInput('copyFeedback', { message: 'Enregistré' });
      fixture.detectChanges();

      component.copyVisualSnapshot('Personnalisé');

      expect(component.copyFeedbackText).toBe('Enregistré');
    });

    it('n\'affiche aucun message lorsque copyFeedback est désactivé', () => {
      createChart({ type: 'bar' });
      fixture.componentRef.setInput('copyFeedback', { enabled: false });
      fixture.detectChanges();

      component.copyVisualSnapshot('Silencieux');

      expect(component.copyFeedbackText).toBe('');
    });

    it('signale les callbacks qui ne sont pas transportables dans un snapshot', () => {
      const config = {
        ...BASE_CONFIG,
        options: { tooltip: { y: { formatter: (value: number) => `${value} €` } } },
      } as any;
      createChart({ type: 'bar', config });

      const draft = component.createVisualSnapshot();

      expect(draft.warnings.length).toBe(1);
      expect(draft.warnings[0]).toContain('ne sont pas transportables');
    });

    it('ne produit aucun avertissement pour une configuration sérialisable', () => {
      createChart({ type: 'bar' });

      expect(component.createVisualSnapshot().warnings).toEqual([]);
    });

    it('rejette un snapshot qui n\'est pas un graphique', () => {
      createChart({ type: 'bar' });
      const snapshot = { ...buildSnapshot(), type: 'table' } as unknown as VisualSnapshot;

      const result = component.applyVisualSnapshot(snapshot);

      expect(result.applied).toBeFalse();
      expect(result.restored).toEqual([]);
      expect(result.skipped).toEqual(['type']);
      expect(result.warnings.length).toBe(1);
    });

    it('restaure les séries connues et ignore les identifiants inconnus', () => {
      createChart({ type: 'bar' });
      fixture.componentRef.setInput('organizer', { enabled: true });
      fixture.detectChanges();
      const snapshot = buildSnapshot(['Coûts', 'Inconnu']);

      const result = component.applyVisualSnapshot(snapshot);

      expect(result.applied).toBeTrue();
      expect(result.restored).toEqual(['seriesVisibility']);
      expect(result.skipped).toEqual(['Inconnu']);
      expect(component._organizerFacade.state.selectedFieldIds).toEqual(['Coûts']);
    });

    it('n\'altère pas la sélection lorsque le snapshot ne contient pas d\'état de séries', () => {
      createChart({ type: 'bar' });
      fixture.componentRef.setInput('organizer', { enabled: true });
      fixture.detectChanges();
      const before = [...component._organizerFacade.state.selectedFieldIds];

      const result = component.applyVisualSnapshot(buildSnapshot());

      expect(result.applied).toBeTrue();
      expect(result.restored).toEqual([]);
      expect(result.skipped).toEqual([]);
      expect(component._organizerFacade.state.selectedFieldIds).toEqual(before);
    });

    it('retourne une copie des données et les avertissements du snapshot', () => {
      createChart({ type: 'bar' });
      const snapshot = buildSnapshot(undefined, ['Avertissement']);

      const result = component.applyVisualSnapshot(snapshot);

      expect(result.data).toEqual(DATA);
      expect(result.data).not.toBe(snapshot.data);
      expect(result.warnings).toEqual(['Avertissement']);
    });
  });

  describe('cycle de vie', () => {
    it('termine le flux events$ de la façade à la destruction', () => {
      createChart({ type: 'bar' });
      let completed = false;
      component._organizerFacade.events$.subscribe({ complete: () => completed = true });

      fixture.destroy();

      expect(completed).toBeTrue();
    });
  });
});
