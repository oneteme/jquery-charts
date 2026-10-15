import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SlicePanelComponent, SlicePanelFilters } from './slice-panel.component';
import { SliceColumnDef, SliceConfig } from './slice-panel.model';

interface Row { id: number; status?: string | null; team?: string | null; score?: number }

const rows = (): Row[] => [
  { id: 1, status: 'OK', team: 'A', score: 5 },
  { id: 2, status: 'KO', team: 'B', score: 50 },
  { id: 3, status: 'OK', team: 'B', score: 500 },
  { id: 4, status: null, team: 'A', score: 7 },
];

const columns = (): SliceColumnDef<Row>[] => [
  { key: 'status', header: 'Statut' },
  { key: 'team', header: 'Équipe', icon: 'group' },
];

function setup(inputs: Partial<Record<'sliceConfigs' | 'columns' | 'data' | 'lazyData' | 'lazyStatus' | 'showCounts' | 'showToggle' | 'collapsedByDefault' | 'alwaysShow', unknown>> = {}) {
  const fixture: ComponentFixture<SlicePanelComponent<Row>> = TestBed.createComponent(SlicePanelComponent<Row>);
  const panel = fixture.componentInstance;
  const defaults = { sliceConfigs: [{ title: 'Statut', columnKey: 'status' }] as SliceConfig<Row>[], columns: columns(), data: rows() };
  Object.entries({ ...defaults, ...inputs }).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
  fixture.detectChanges();

  const filters: Array<(row: Row) => boolean> = [];
  const activeKeys: string[][][] = [];
  const dynamicKeys: string[][] = [];
  panel.filterChange.subscribe(f => filters.push(f));
  panel.activeKeysChange.subscribe(k => activeKeys.push(k));
  panel.dynamicSliceKeysChange.subscribe(k => dynamicKeys.push(k));

  const set = (name: string, value: unknown) => { fixture.componentRef.setInput(name, value); fixture.detectChanges(); };
  const lastFilter = () => filters.at(-1)!;
  const matching = (pred: (row: Row) => boolean) => rows().filter(pred).map(r => r.id);
  const categoryKeys = (index = 0) => panel.slices[index].categories!.map(c => c.key);
  return { fixture, panel, filters, activeKeys, dynamicKeys, set, lastFilter, matching, categoryKeys };
}

describe('SlicePanelComponent', () => {

  beforeEach(() => TestBed.configureTestingModule({ imports: [SlicePanelComponent] }));

  describe('catégories dérivées d\'une colonne', () => {
    it('liste les valeurs distinctes triées puis « Vide » pour les valeurs absentes', () => {
      const { categoryKeys, panel } = setup();
      expect(categoryKeys()).toEqual(['KO', 'OK', '__empty__']);
      expect(panel.slices[0].categories!.at(-1)!.label).toBe('Vide');
    });

    it('compte les lignes par catégorie', () => {
      const { panel } = setup();
      expect(panel.sliceCategoryCount(0, 'OK')).toBe(2);
      expect(panel.sliceCategoryCount(0, 'KO')).toBe(1);
      expect(panel.sliceCategoryCount(0, '__empty__')).toBe(1);
      expect(panel.sliceCategoryCount(0, 'ghost')).toBe(0);
      expect(panel.sliceCategoryCount(5, 'OK')).toBe(0);
    });

    it('utilise le provider value de la colonne', () => {
      const { categoryKeys } = setup({
        columns: [{ key: 'status', header: 'Statut', value: (row: Row) => (row.status ?? 'n/a').toLowerCase() }],
      });
      expect(categoryKeys()).toEqual(['KO'.toLowerCase(), 'n/a', 'ok']);
    });

    it('utilise bucket pour des valeurs continues et ignore les colonnes déjà catégorisées', () => {
      const bucket = (row: Row) => (row.score! < 10 ? '< 10' : row.score! < 100 ? '< 100' : '≥ 100');
      const { categoryKeys } = setup({ sliceConfigs: [{ title: 'Score', columnKey: 'score', bucket }] });
      expect(categoryKeys()).toEqual(['< 10', '< 100', '≥ 100']);

      const explicit = setup({ sliceConfigs: [{ title: 'Manuelle', categories: [{ key: 'x', label: 'X' }] }] });
      expect(explicit.categoryKeys()).toEqual(['x']);
    });

    it('recalcule les catégories quand les données changent', () => {
      const { set, categoryKeys } = setup();
      set('data', [{ id: 9, status: 'PENDING' }]);
      expect(categoryKeys()).toEqual(['PENDING']);
    });
  });

  describe('filtrage', () => {
    it('émet un prédicat reflétant les catégories sélectionnées (OU au sein d\'un slice)', () => {
      const { panel, lastFilter, matching, activeKeys } = setup();

      panel.onSliceCategorySelected(0, 'OK');
      expect(matching(lastFilter())).toEqual([1, 3]);
      expect(activeKeys.at(-1)).toEqual([['OK']]);

      panel.onSliceCategorySelected(0, 'KO');
      expect(matching(lastFilter())).toEqual([1, 2, 3]);

      panel.onSliceCategorySelected(0, 'OK');
      expect(matching(lastFilter())).toEqual([2]);
    });

    it('filtre sur la catégorie « Vide »', () => {
      const { panel, lastFilter, matching } = setup();
      panel.onSliceCategorySelected(0, '__empty__');
      expect(matching(lastFilter())).toEqual([4]);
    });

    it('multiSelect false : une seule catégorie active, un second clic la désélectionne', () => {
      const { panel, lastFilter, matching, activeKeys } = setup({ sliceConfigs: [{ title: 'Statut', columnKey: 'status', multiSelect: false }] });

      panel.onSliceCategorySelected(0, 'OK');
      panel.onSliceCategorySelected(0, 'KO');
      expect(activeKeys.at(-1)).toEqual([['KO']]);
      expect(matching(lastFilter())).toEqual([2]);

      panel.onSliceCategorySelected(0, 'KO');
      expect(activeKeys.at(-1)).toEqual([[]]);
      expect(matching(lastFilter())).toEqual([1, 2, 3, 4]);
    });

    it('combine plusieurs slices avec un ET', () => {
      const { panel, lastFilter, matching } = setup({
        sliceConfigs: [{ title: 'Statut', columnKey: 'status' }, { title: 'Équipe', columnKey: 'team' }],
      });
      panel.onSliceCategorySelected(0, 'OK');
      panel.onSliceCategorySelected(1, 'B');
      expect(matching(lastFilter())).toEqual([3]);
    });

    it('« Tout » efface les sélections d\'un slice', () => {
      const { panel, lastFilter, matching } = setup();
      panel.onSliceCategorySelected(0, 'OK');
      expect(panel.isSliceAllActive(0)).toBeFalse();

      panel.onSliceAllSelected(0);
      expect(panel.isSliceAllActive(0)).toBeTrue();
      expect(matching(lastFilter())).toEqual([1, 2, 3, 4]);
    });

    it('un slice sans catégorie ne filtre rien', () => {
      const { panel, lastFilter, matching } = setup({ data: [] });
      panel.activeKeysBySlice.set(0, new Set(['x']));
      panel.onSliceAllSelected(5);
      expect(matching(lastFilter())).toEqual([1, 2, 3, 4]);
    });

    it('une catégorie manuelle sans filtre laisse passer toutes les lignes', () => {
      const { panel, lastFilter, matching } = setup({
        sliceConfigs: [{ title: 'Info', categories: [{ key: 'all', label: 'Tout voir' }] }],
      });
      panel.onSliceCategorySelected(0, 'all');
      expect(matching(lastFilter())).toEqual([1, 2, 3, 4]);
    });
  });

  describe('conservation des sélections quand les données changent', () => {
    it('conserve la sélection tant que la catégorie existe et réémet le filtre', () => {
      const { panel, set, filters } = setup();
      panel.onSliceCategorySelected(0, 'OK');
      const before = filters.length;

      set('data', [...rows(), { id: 5, status: 'OK', team: 'C' }]);
      expect(panel.isSliceCategoryActive(0, 'OK')).toBeTrue();
      expect(filters.length).toBe(before + 1);
    });

    it('retire la sélection d\'une catégorie qui a disparu', () => {
      const { panel, set } = setup();
      panel.onSliceCategorySelected(0, 'OK');
      set('data', [{ id: 9, status: 'KO' }]);
      expect(panel.isSliceCategoryActive(0, 'OK')).toBeFalse();
      expect(panel.isSliceAllActive(0)).toBeTrue();
    });

    it('ne réémet pas de filtre quand rien n\'est sélectionné', () => {
      const { set, filters } = setup();
      const before = filters.length;
      set('data', rows());
      expect(filters.length).toBe(before);
    });
  });

  describe('persistance des filtres', () => {
    it('exporte les filtres par clé de colonne ou par index et les restaure', () => {
      const config: SliceConfig<Row>[] = [
        { title: 'Statut', columnKey: 'status' },
        { title: 'Manuelle', categories: [{ key: 'high', label: 'Haut', filter: r => r.score! > 10 }] },
      ];
      const { panel, lastFilter, matching } = setup({ sliceConfigs: config });
      panel.onSliceCategorySelected(0, 'OK');
      panel.onSliceCategorySelected(1, 'high');

      const saved = panel.getActiveFilters();
      expect(saved).toEqual({ 'column:status': ['OK'], 'index:1': ['high'] });

      const fresh = setup({ sliceConfigs: config });
      fresh.panel.restoreFilters(saved);
      expect(matching(fresh.lastFilter())).toEqual([3]);
      expect(matching(lastFilter())).toEqual([3]);
    });

    it('lit les anciennes préférences indexées par position', () => {
      const { panel, lastFilter, matching } = setup();
      panel.restoreFilters({ '0': ['KO'] } as SlicePanelFilters);
      expect(matching(lastFilter())).toEqual([2]);
    });

    it('restoreFilters({}) efface tous les filtres', () => {
      const { panel, lastFilter, matching } = setup();
      panel.onSliceCategorySelected(0, 'OK');
      panel.restoreFilters({});
      expect(matching(lastFilter())).toEqual([1, 2, 3, 4]);
    });
  });

  describe('slices dynamiques', () => {
    it('ajoute un slice depuis une colonne, émet les clés et ignore un doublon', () => {
      const { panel, dynamicKeys, categoryKeys } = setup();
      panel.addDynamicSlice(columns()[1]);
      panel.addDynamicSlice(columns()[1]);

      expect(dynamicKeys).toEqual([['team']]);
      expect(panel.slices.length).toBe(2);
      expect(panel.isSliceDynamic(0)).toBeFalse();
      expect(panel.isSliceDynamic(1)).toBeTrue();
      expect(categoryKeys(1)).toEqual(['A', 'B']);
      expect(panel.activeDynamicSliceColumns.map(c => c.key)).toEqual(['team']);
    });

    it('availableColumnsForDynamicSlice exclut les colonnes déjà utilisées', () => {
      const { panel } = setup();
      expect(panel.availableColumnsForDynamicSlice.map(c => c.key)).toEqual(['team']);
      panel.addDynamicSlice(columns()[1]);
      expect(panel.availableColumnsForDynamicSlice).toEqual([]);
    });

    it('supprime un slice dynamique et émet les clés restantes', () => {
      const { panel, dynamicKeys, lastFilter, matching } = setup();
      panel.addDynamicSlice(columns()[1]);
      panel.addDynamicSlice({ key: 'score', header: 'Score' });
      panel.onSliceCategorySelected(0, 'OK');

      panel.removeDynamicSlice(2);
      expect(dynamicKeys.at(-1)).toEqual(['team']);
      expect(panel.slices.length).toBe(2);
      expect(matching(lastFilter())).toEqual([1, 3]);
    });

    it('conserve la sélection des slices suivants quand un slice dynamique est supprimé', () => {
      const { panel, lastFilter, matching } = setup();
      panel.addDynamicSlice(columns()[1]); // index 1
      panel.addDynamicSlice({ key: 'score', header: 'Score' }); // index 2
      panel.onSliceCategorySelected(1, 'B');
      panel.onSliceCategorySelected(2, '500');
      expect(matching(lastFilter())).toEqual([3]);

      panel.removeDynamicSlice(1);
      expect(panel.isSliceCategoryActive(1, '500')).toBeTrue();
      expect(matching(lastFilter())).toEqual([3]);
    });

    it('ne supprime pas un slice statique', () => {
      const { panel, dynamicKeys } = setup();
      panel.removeDynamicSlice(0);
      expect(dynamicKeys).toEqual([]);
      expect(panel.slices.length).toBe(1);
    });

    it('removeDynamicSliceByKey ignore une clé inconnue', () => {
      const { panel, dynamicKeys } = setup();
      panel.addDynamicSlice(columns()[1]);
      panel.removeDynamicSliceByKey('ghost');
      expect(panel.slices.length).toBe(2);
      panel.removeDynamicSliceByKey('team');
      expect(panel.slices.length).toBe(1);
      expect(dynamicKeys.at(-1)).toEqual([]);
    });

    it('met à jour les catégories d\'un slice dynamique quand les données changent', () => {
      const { panel, set, categoryKeys } = setup();
      panel.addDynamicSlice(columns()[1]);
      set('data', [{ id: 1, team: 'Z' }]);
      expect(categoryKeys(1)).toEqual(['Z']);
    });
  });

  describe('colonnes lazy', () => {
    const lazyColumns = (): SliceColumnDef<Row>[] => [{ key: 'team', header: 'Équipe', lazy: true }, { key: 'status', header: 'Statut' }];
    const lazyData = (data: Row[]) => new Map([['team', new Map(data.map(r => [r, r.team]))]]);

    it('affiche un état de chargement et aucune catégorie tant que la colonne n\'est pas chargée', () => {
      const { panel, categoryKeys } = setup({ sliceConfigs: [{ title: 'Équipe', columnKey: 'team' }], columns: lazyColumns() });
      expect(panel.isSliceLoading(0)).toBeTrue();
      expect(categoryKeys()).toEqual([]);

      panel.lazyStatus = new Map([['team', 'loading']]);
      expect(panel.isSliceLoading(0)).toBeTrue();
    });

    it('calcule catégories et filtre à partir des valeurs chargées', () => {
      const data = rows();
      const { panel, set, categoryKeys, lastFilter } = setup({ sliceConfigs: [{ title: 'Équipe', columnKey: 'team' }], columns: lazyColumns(), data });
      set('lazyData', lazyData(data));
      set('lazyStatus', new Map([['team', 'loaded']]));

      expect(panel.isSliceLoading(0)).toBeFalse();
      expect(categoryKeys()).toEqual(['A', 'B']);

      panel.onSliceCategorySelected(0, 'B');
      expect(data.filter(lastFilter()).map(r => r.id)).toEqual([2, 3]);
    });

    it('un slice dynamique lazy se remplit quand la colonne est chargée', () => {
      const data = rows();
      const { panel, set, categoryKeys } = setup({ sliceConfigs: [], columns: lazyColumns(), data });
      panel.addDynamicSlice(lazyColumns()[0]);
      expect(panel.isSliceLoading(0)).toBeTrue();

      set('lazyData', lazyData(data));
      set('lazyStatus', new Map([['team', 'loaded']]));
      expect(panel.isSliceLoading(0)).toBeFalse();
      expect(categoryKeys(0)).toEqual(['A', 'B']);
    });

    it('réémet le filtre quand les valeurs lazy changent et qu\'une sélection est active', () => {
      const data = rows();
      const { panel, set, filters } = setup({ sliceConfigs: [{ title: 'Équipe', columnKey: 'team' }], columns: lazyColumns(), data });
      set('lazyData', lazyData(data));
      set('lazyStatus', new Map([['team', 'loaded']]));
      panel.onSliceCategorySelected(0, 'A');
      const before = filters.length;

      set('lazyData', lazyData(data));
      expect(filters.length).toBe(before + 1);
    });
  });

  describe('affichage', () => {
    it('showPanel exige une config et des données, sauf alwaysShow', () => {
      expect(setup().panel.showPanel).toBeTrue();
      expect(setup({ data: [] }).panel.showPanel).toBeFalse();
      expect(setup({ data: [], alwaysShow: true }).panel.showPanel).toBeTrue();
      expect(setup({ sliceConfigs: [], alwaysShow: true }).panel.showPanel).toBeFalse();
    });

    it('un slice unique est déplié par défaut ; avec plusieurs slices ils sont repliés et ouverts un à un', () => {
      const single = setup().panel;
      expect(single.isSliceCollapsed(0)).toBeFalse();
      single.toggleSliceCollapse(0);
      expect(single.isSliceCollapsed(0)).toBeTrue();

      const multi = setup({ sliceConfigs: [{ title: 'S', columnKey: 'status' }, { title: 'T', columnKey: 'team' }] }).panel;
      expect(multi.isSliceCollapsed(0)).toBeTrue();
      expect(multi.isSliceCollapsed(1)).toBeTrue();
      multi.toggleSliceCollapse(0);
      expect(multi.isSliceCollapsed(0)).toBeFalse();
      multi.toggleSliceCollapse(1);
      expect(multi.isSliceCollapsed(0)).toBeTrue();
      expect(multi.isSliceCollapsed(1)).toBeFalse();
    });

    it('togglePanel émet l\'état replié ; collapsedByDefault initialise l\'état', () => {
      const { panel } = setup({ collapsedByDefault: true });
      expect(panel.isCollapsed).toBeTrue();
      const states: boolean[] = [];
      panel.collapsedChange.subscribe(s => states.push(s));
      panel.togglePanel();
      panel.togglePanel();
      expect(states).toEqual([false, true]);
    });

    it('rend une entrée par catégorie non vide avec son effectif, et filtre au clic', () => {
      const { fixture, lastFilter, matching } = setup();
      const items = fixture.debugElement.queryAll(By.css('.slice-item'));
      expect(items.map(i => i.nativeElement.textContent.replace(/\s+/g, '').trim())).toEqual(['KO1', 'OK2', 'Vide1']);

      items[1].nativeElement.click();
      fixture.detectChanges();
      expect(matching(lastFilter())).toEqual([1, 3]);
      expect(fixture.debugElement.query(By.css('.slice-item.active')).nativeElement.textContent).toContain('OK');
    });

    it('masque les effectifs avec showCounts=false', () => {
      const { fixture } = setup({ showCounts: false });
      const first = fixture.debugElement.query(By.css('.slice-item'));
      expect(first.queryAll(By.css('span')).length).toBe(1);
    });

    it('affiche « Aucune donnée » quand aucune catégorie n\'a de ligne', () => {
      const { fixture } = setup({
        data: [{ id: 1 }],
        alwaysShow: true,
        sliceConfigs: [{ title: 'X', categories: [{ key: 'a', label: 'A', filter: () => false }] }],
      });
      expect(fixture.nativeElement.querySelector('.slice-empty-state')?.textContent).toContain('Aucune donnée');
    });

    it('le bouton de suppression n\'existe que pour les slices dynamiques', () => {
      const { fixture, panel } = setup();
      expect(fixture.debugElement.queryAll(By.css('.slice-remove-btn')).length).toBe(0);
      panel.addDynamicSlice(columns()[1]);
      fixture.detectChanges();
      expect(fixture.debugElement.queryAll(By.css('.slice-remove-btn')).length).toBe(1);
    });

    it('getSliceIcon : icône du slice puis icône de la colonne', () => {
      const { panel } = setup({ sliceConfigs: [{ title: 'Équipe', columnKey: 'team' }, { title: 'X', icon: 'star', categories: [] }] });
      expect(panel.getSliceIcon(panel.slices[0])).toBe('group');
      expect(panel.getSliceIcon(panel.slices[1])).toBe('star');
    });
  });
});
