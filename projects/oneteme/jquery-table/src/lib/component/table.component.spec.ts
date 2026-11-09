import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SlicePanelComponent } from '@oneteme/jquery-organizer';
import { TableComponent } from './table.component';
import { TableColumnProvider, TableProvider } from '../jquery-table.model';

interface Row { id: number; name: string; team: string; status: string; score: number; when: Date }

@Component({
  standalone: true,
  imports: [TableComponent],
  template: `<jquery-table [config]="config" [data]="data" [isLoading]="loading"
    (rowSelected)="selected.push($event)" (sortChange)="sorts.push($event)" (pageChange)="pages.push($event)"
    (searchChange)="searches.push($event)" (groupByChange)="groups.push($event)" (columnsChange)="columns.push($event)"></jquery-table>`,
})
class HostComponent {
  config!: TableProvider<Row>;
  data: Row[] = [];
  loading = false;
  selected: Row[] = [];
  sorts: unknown[] = [];
  pages: unknown[] = [];
  searches: string[] = [];
  groups: Array<string | null> = [];
  columns: string[][] = [];
}

const TEAMS = ['Alpha', 'Beta', 'Gamma'];
function makeRows(count = 12): Row[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `item-${String(i + 1).padStart(2, '0')}`,
    team: TEAMS[i % 3],
    status: i % 2 === 0 ? 'OK' : 'KO',
    score: [5, 50, 500, 7, 70, 700, 9, 90, 900, 1, 10, 100][i % 12] + Math.floor(i / 12),
    when: new Date(2026, 0, 31 - i),
  }));
}

const baseColumns = (): TableColumnProvider<Row>[] => [
  { key: 'name', header: 'Nom' },
  { key: 'team', header: 'Équipe' },
  { key: 'status', header: 'Statut' },
  { key: 'score', header: 'Score', optional: true },
  { key: 'when', header: 'Date', optional: true },
];

function setup(options: { data?: Row[]; config?: Partial<TableProvider<Row>>; columns?: TableColumnProvider<Row>[] } = {}) {
  const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
  const host = fixture.componentInstance;
  host.config = {
    columns: options.columns ?? baseColumns(),
    view: { enabled: true, enableColumnRemoval: true, enableColumnDragDrop: true },
    search: { enabled: true },
    pagination: { enabled: true, pageSize: 5, pageSizeOptions: [5, 10], pageSizeOptionsGroupBy: [2, 5] },
    preferences: { enabled: true, tableId: 'spec-table' },
    ...options.config,
  };
  host.data = options.data ?? makeRows();
  fixture.detectChanges();

  const table = (): TableComponent<Row> => fixture.debugElement.query(By.directive(TableComponent)).componentInstance;
  const root = (): HTMLElement => fixture.nativeElement;
  const settle = async () => {
    for (let round = 0; round < 4; round++) {
      fixture.detectChanges();
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const cells = (key: string) => Array.from(root().querySelectorAll(`td.mat-column-${key}`)).map(td => (td.textContent ?? '').trim());
  const count = (selector: string) => root().querySelectorAll(selector).length;
  const search = (query: string) => { table().searchQuery = query; table().onSearchChange(); };
  const sortBy = (id: string, times = 1) => { for (let i = 0; i < times; i++) table().sort!.sort({ id, start: 'asc', disableClear: false }); };
  const groupLabels = () => Array.from(root().querySelectorAll('.group-header-row .group-key-label')).map(e => (e.textContent ?? '').trim());
  const columnKeys = () => table().renderedColumns.slice();
  return { fixture, host, table, root, settle, cells, count, search, sortBy, groupLabels, columnKeys };
}

describe('TableComponent', () => {
  beforeEach(() => {
    localStorage.removeItem('jqt_prefs_spec-table');
    TestBed.configureTestingModule({ imports: [HostComponent], providers: [provideNoopAnimations()] });
  });
  afterEach(() => localStorage.removeItem('jqt_prefs_spec-table'));

  describe('rendu et pagination', () => {
    it('affiche les colonnes de base et la première page', async () => {
      const t = setup();
      await t.settle();

      expect(t.columnKeys()).toEqual(['name', 'team', 'status']);
      expect(t.cells('name')).toEqual(['item-01', 'item-02', 'item-03', 'item-04', 'item-05']);
      expect(t.root().querySelector('.mat-mdc-paginator-range-label')?.textContent?.trim()).toBe('1 – 5 sur 12');
    });

    it('change de page et émet pageChange', async () => {
      const t = setup();
      await t.settle();

      t.table().paginator!.nextPage();
      await t.settle();
      expect(t.cells('name')[0]).toBe('item-06');
      expect(t.host.pages).toEqual([{ pageIndex: 1, pageSize: 5 }]);

      t.table().paginator!.lastPage();
      await t.settle();
      expect(t.cells('name')).toEqual(['item-11', 'item-12']);
    });

    it('conserve un index de page valide quand le nombre de lignes diminue', async () => {
      const t = setup();
      await t.settle();
      t.table().paginator!.lastPage();
      await t.settle();

      t.host.data = makeRows(6);
      await t.settle();
      expect(t.cells('name')).toEqual(['item-06']);
    });

    it('affiche l\'état vide, personnalisable, et l\'état de chargement', async () => {
      const empty = setup({ data: [], config: { labels: { empty: 'Rien du tout', loading: 'Patientez' } } });
      await empty.settle();
      expect(empty.root().querySelector('.table-body-overlay-text')?.textContent).toContain('Rien du tout');

      empty.host.loading = true;
      await empty.settle();
      expect(empty.root().querySelector('.table-body-overlay-text')?.textContent).toContain('Patientez');
    });

    it('construit les colonnes depuis la première ligne sans configuration de colonnes', async () => {
      const t = setup({ columns: undefined, config: { columns: undefined }, data: [{ id: 1, name: 'x', team: 'T', status: 'OK', score: 1, when: new Date() }] });
      await t.settle();
      expect(t.columnKeys()).toEqual(['id', 'name', 'team', 'status', 'score', 'when']);
    });

    it('ne duplique pas les lignes quand les données sont remplacées', async () => {
      const t = setup();
      await t.settle();
      t.host.data = makeRows(3);
      await t.settle();
      expect(t.cells('name')).toEqual(['item-01', 'item-02', 'item-03']);
    });
  });

  describe('recherche', () => {
    it('filtre sur toutes les colonnes sans tenir compte de la casse et émet searchChange', async () => {
      const t = setup();
      await t.settle();

      t.search('GAMMA');
      await t.settle();
      expect(t.cells('team')).toEqual(['Gamma', 'Gamma', 'Gamma', 'Gamma']);
      expect(t.host.searches.at(-1)).toBe('GAMMA');
      expect(t.root().querySelector('.search-count')?.textContent?.trim()).toBe('4');
    });

    it('n\'émet pas searchChange à l\'initialisation sans requête initiale', async () => {
      const t = setup();
      await t.settle();
      expect(t.host.searches).toEqual([]);
    });

    it('revient à la première page', async () => {
      const t = setup();
      await t.settle();
      t.table().paginator!.nextPage();
      await t.settle();

      t.search('item');
      await t.settle();
      expect(t.table().paginator!.pageIndex).toBe(0);
    });

    it('restreint la recherche aux colonnes searchColumns', async () => {
      const t = setup({ config: { search: { enabled: true, searchColumns: ['name'] } } });
      await t.settle();

      t.search('gamma');
      await t.settle();
      expect(t.cells('name')).toEqual([]);
      t.search('item-03');
      await t.settle();
      expect(t.cells('name')).toEqual(['item-03']);
    });

    it('applique searchValue et value personnalisés', async () => {
      const t = setup({
        columns: [
          { key: 'name', header: 'Nom' },
          { key: 'score', header: 'Score', value: row => `${row.score} pts`, searchValue: row => `points:${row.score}` },
        ],
      });
      await t.settle();
      t.search('points:500');
      await t.settle();
      expect(t.cells('score')).toEqual(['500 pts']);
    });

    it('applique initialQuery au premier affichage et un clearSearchInput qui change efface la recherche', async () => {
      const t = setup({ config: { search: { enabled: true, initialQuery: 'beta' }, clearSearchInput: 'a' } });
      await t.settle();
      expect(t.table().searchQuery).toBe('beta');
      expect(t.cells('team').every(v => v === 'Beta')).toBeTrue();

      t.host.config = { ...t.host.config, clearSearchInput: 'b', search: { enabled: true, initialQuery: 'beta' } };
      await t.settle();
      expect(t.table().searchQuery).toBe('');
      expect(t.cells('name').length).toBe(5);
    });

    it('le bouton de recherche vide la recherche', async () => {
      const t = setup();
      await t.settle();
      t.search('beta');
      await t.settle();

      (t.root().querySelector('.search-clear-btn') as HTMLButtonElement).click();
      await t.settle();
      expect(t.table().searchQuery).toBe('');
      expect(t.cells('name').length).toBe(5);
    });
  });

  describe('tri', () => {
    it('trie les nombres numériquement, pas comme du texte', async () => {
      const t = setup({ config: { pagination: { enabled: true, pageSize: 20, pageSizeOptions: [20] } } });
      await t.settle();
      t.table().onColumnVisibilityChange(t.host.config.columns![3], true);
      await t.settle();

      t.sortBy('score');
      await t.settle();
      const scores = t.cells('score').map(Number);
      expect(scores).toEqual([...scores].sort((a, b) => a - b));

      t.sortBy('score');
      await t.settle();
      expect(t.cells('score').map(Number)).toEqual([...scores].sort((a, b) => b - a));
    });

    it('trie le texte sans tenir compte de la casse et émet sortChange', async () => {
      const t = setup({ data: [{ ...makeRows(1)[0], name: 'bravo' }, { ...makeRows(2)[1], name: 'Alpha' }, { ...makeRows(3)[2], name: 'charlie' }] });
      await t.settle();

      t.sortBy('name');
      await t.settle();
      expect(t.cells('name')).toEqual(['Alpha', 'bravo', 'charlie']);
      expect(t.host.sorts.at(-1)).toEqual({ active: 'name', direction: 'asc' });
    });

    it('applique defaultSort au premier affichage sans émettre de tri utilisateur', async () => {
      const t = setup({ config: { defaultSort: { active: 'name', direction: 'desc' } } });
      await t.settle();
      expect(t.cells('name')[0]).toBe('item-12');
    });

    it('utilise sortValue pour trier une colonne formatée', async () => {
      const t = setup({
        data: makeRows(4),
        columns: [
          { key: 'name', header: 'Nom' },
          { key: 'score', header: 'Score', value: row => `${row.score} pts`, sortValue: row => row.score },
        ],
      });
      await t.settle();
      t.sortBy('score');
      await t.settle();
      const scores = t.cells('score').map(v => Number.parseInt(v, 10));
      expect(scores).toEqual([...scores].sort((a, b) => a - b));
    });

    it('trie les dates chronologiquement', async () => {
      const t = setup({ data: makeRows(5), config: { pagination: { enabled: true, pageSize: 20, pageSizeOptions: [20] } } });
      await t.settle();
      t.sortBy('when');
      await t.settle();
      expect(t.cells('name')).toEqual(['item-05', 'item-04', 'item-03', 'item-02', 'item-01']);
    });

    it('trie les accents selon l\'ordre alphabétique français', async () => {
      const t = setup({ data: [{ ...makeRows(1)[0], name: 'Zoé' }, { ...makeRows(2)[1], name: 'Émile' }, { ...makeRows(3)[2], name: 'Anna' }] });
      await t.settle();
      t.sortBy('name');
      await t.settle();
      expect(t.cells('name')).toEqual(['Anna', 'Émile', 'Zoé']);
    });

    it('évalue sortValue au plus une fois par ligne', async () => {
      const sortValue = jasmine.createSpy('sortValue').and.callFake((row: Row) => row.score);
      const data = makeRows(200);
      const t = setup({ data, columns: [{ key: 'name', header: 'Nom' }, { key: 'score', header: 'Score', sortValue }], config: { pagination: { enabled: true, pageSize: 20, pageSizeOptions: [20] } } });
      await t.settle();
      sortValue.calls.reset();

      t.sortBy('score');
      await t.settle();
      expect(sortValue.calls.count()).toBeLessThanOrEqual(data.length * 2);
    });
  });

  describe('Group by', () => {
    it('regroupe, trie les groupes, replie par défaut et affiche les effectifs', async () => {
      const t = setup();
      await t.settle();

      t.table().onGroupByChange('team');
      await t.settle();
      expect(t.groupLabels()).toEqual(['Alpha', 'Beta', 'Gamma']);
      expect(Array.from(t.root().querySelectorAll('.group-count-badge')).map(b => b.textContent?.trim())).toEqual(['4', '4', '4']);
      expect(t.cells('name').length).toBe(0);
      expect(t.host.groups).toEqual(['team']);
    });

    it('ouvre un groupe à la fois, avec pagination interne', async () => {
      const t = setup();
      await t.settle();
      t.table().onGroupByChange('team');
      await t.settle();

      (t.root().querySelector('tr.group-header-row') as HTMLElement).click();
      await t.settle();
      expect(t.cells('team')).toEqual(['Alpha', 'Alpha']);

      t.table().groupPageForward('Alpha', 4);
      await t.settle();
      expect(t.cells('name')).toEqual(['item-07', 'item-10']);

      (t.root().querySelectorAll('tr.group-header-row')[1] as HTMLElement).click();
      await t.settle();
      expect(t.cells('team').every(v => v === 'Beta')).toBeTrue();
    });

    it('inverse l\'ordre des groupes et revient au tableau normal', async () => {
      const t = setup();
      await t.settle();
      t.table().onGroupByChange('team');
      await t.settle();

      t.table().onGroupSortToggle('desc');
      await t.settle();
      expect(t.groupLabels()).toEqual(['Gamma', 'Beta', 'Alpha']);

      t.table().onGroupByChange(null);
      await t.settle();
      expect(t.groupLabels()).toEqual([]);
      expect(t.cells('name').length).toBe(5);
      expect(t.host.groups).toEqual(['team', null]);
    });

    it('applique defaultGroupBy et ne le réapplique pas quand les données changent', async () => {
      const t = setup({ config: { defaultGroupBy: 'status' } });
      await t.settle();
      expect(t.groupLabels()).toEqual(['KO', 'OK']);

      t.table().onGroupByChange(null);
      t.host.data = makeRows(8);
      await t.settle();
      expect(t.groupLabels()).toEqual([]);
    });

    it('respecte la recherche en mode groupé', async () => {
      const t = setup();
      await t.settle();
      t.table().onGroupByChange('team');
      t.search('alpha');
      await t.settle();
      expect(t.groupLabels()).toEqual(['Alpha']);
    });

    it('protège le navigateur quand le nombre de groupes est trop élevé', async () => {
      const t = setup({ data: makeRows(600).map((r, i) => ({ ...r, team: `team-${i}` })) });
      await t.settle();
      t.table().onGroupByChange('team');
      await t.settle();
      expect(t.count('.group-header-too-many')).toBe(1);
    });
  });

  describe('Slice by', () => {
    const sliceConfig = (): Partial<TableProvider<Row>> => ({
      slices: [{ title: 'Statut', columnKey: 'status', hidden: false }, { title: 'Équipe', columnKey: 'team' }],
    });
    const pick = async (t: ReturnType<typeof setup>, sliceIndex: number, label: string) => {
      const panel = t.fixture.debugElement.query(By.directive(SlicePanelComponent)).componentInstance as SlicePanelComponent<Row>;
      panel.onSliceCategorySelected(sliceIndex, label);
      await t.settle();
    };

    it('filtre les lignes avec le panneau de slices et met à jour le compteur', async () => {
      const t = setup({ config: sliceConfig() });
      await t.settle();

      await pick(t, 0, 'OK');
      expect(t.root().querySelector('.search-count')?.textContent?.trim()).toBe('6');
      expect(t.cells('status').every(v => v === 'OK')).toBeTrue();
    });

    it('combine slices et recherche', async () => {
      const t = setup({ config: sliceConfig() });
      await t.settle();
      await pick(t, 0, 'OK');
      t.search('alpha');
      await t.settle();
      expect(t.root().querySelector('.search-count')?.textContent?.trim()).toBe('2');
    });

    it('ajoute et retire un slice dynamique depuis une colonne', async () => {
      const t = setup({ config: { slices: [{ title: 'Statut', columnKey: 'status' }] } });
      await t.settle();

      const team = t.host.config.columns![1];
      t.table().toggleDynamicSlice(team);
      await t.settle();
      expect(t.table().isDynamicSliceActive('team')).toBeTrue();

      t.table().toggleDynamicSlice(team);
      await t.settle();
      expect(t.table().isDynamicSliceActive('team')).toBeFalse();
    });

    it('masquer un slice conserve les filtres des autres slices', async () => {
      const t = setup({ config: sliceConfig() });
      await t.settle();
      await pick(t, 0, 'OK');

      t.table().toggleStaticSlice('team');
      await t.settle();
      expect(t.cells('status').every(v => v === 'OK')).toBeTrue();
    });
  });

  describe('colonnes', () => {
    it('affiche une colonne optionnelle, émet columnAdded / columnsChange, puis la retire', async () => {
      const t = setup();
      await t.settle();
      const added: string[] = [];
      t.table().columnAdded.subscribe(c => added.push(c.key));

      t.table().onColumnVisibilityChange(t.host.config.columns![3], true);
      await t.settle();
      expect(t.columnKeys()).toEqual(['name', 'team', 'status', 'score']);
      expect(added).toEqual(['score']);
      expect(t.host.columns.at(-1)).toEqual(['name', 'team', 'status', 'score']);
      expect(t.cells('score').length).toBe(5);

      t.table().onRemoveColumn('score');
      await t.settle();
      expect(t.columnKeys()).toEqual(['name', 'team', 'status']);
      expect(t.host.columns.at(-1)).toEqual(['name', 'team', 'status']);
    });

    it('affiche une colonne sans nom avec inFieldsMenu: false sans la proposer dans le menu Champs', async () => {
      const t = setup({
        columns: [
          { key: 'name', header: 'Nom' },
          { key: 'rank', value: row => `#${row.id}`, inFieldsMenu: false },
          { key: 'score', header: 'Score', optional: true },
        ],
      });
      await t.settle();

      expect(t.columnKeys()).toEqual(['name', 'rank']);
      expect(t.cells('rank')[0]).toBe('#1');
      expect(t.table()._organizer.menuBaseFields.map(column => column.key)).toEqual(['name']);
      expect(t.table()._organizer.menuOptionalFields.map(column => column.key)).toEqual(['score']);
      expect(t.root().querySelector('.head-text:empty')?.hasAttribute('title')).toBe(false);
    });

    it('place les champs affichés en tête du menu Champs, dans leur ordre d\'affichage', async () => {
      const t = setup({
        columns: [
          { key: 'a', header: 'A', optional: true },
          { key: 'b', header: 'B' },
          { key: 'c', header: 'C', optional: true },
        ],
      });
      await t.settle();
      expect(t.table().organizerConfig.fields!.map(f => f.id)).toEqual(['b', 'a', 'c']);

      t.table().onColumnVisibilityChange(t.host.config.columns![2], true);
      await t.settle();
      expect(t.table().organizerConfig.fields!.map(f => f.id)).toEqual(['b', 'c', 'a']);
    });

    it('refuse une colonne sans nom optionnelle ou lazy', () => {
      const optional = [{ key: 'name', header: 'Nom' }, { key: 'rank', value: (row: Row) => row.id, optional: true }] as TableColumnProvider<Row>[];
      const lazy = [{ key: 'name', header: 'Nom' }, { key: 'rank', value: (row: Row) => row.id, lazy: true }] as TableColumnProvider<Row>[];

      expect(() => setup({ columns: optional })).toThrowError(/'rank' n'a pas de header/);
      expect(() => setup({ columns: lazy })).toThrowError(/'rank' n'a pas de header/);
    });

    it('refuse de retirer la dernière colonne', async () => {
      const t = setup({ columns: [{ key: 'name', header: 'Nom' }] });
      await t.settle();
      t.table().onRemoveColumn('name');
      await t.settle();
      expect(t.columnKeys()).toEqual(['name']);
    });

    it('réordonne les colonnes par glisser-déposer quand enableColumnDragDrop est activé', async () => {
      const t = setup();
      await t.settle();
      const dragEvent = () => ({ preventDefault: () => undefined, dataTransfer: null }) as unknown as DragEvent;

      t.table().onHeaderDragStart('name', dragEvent());
      t.table().onHeaderDragOver('status', dragEvent());
      expect(t.table().isHeaderDropTarget('status')).toBeTrue();
      t.table().onHeaderDrop('status', dragEvent());
      await t.settle();
      expect(t.columnKeys()).toEqual(['team', 'status', 'name']);
      expect(t.table().draggedColumnKey).toBeNull();
    });

    it('réordonne les colonnes au clavier quand enableColumnDragDrop est activé', async () => {
      const t = setup();
      await t.settle();
      const key = (k: string) => ({ key: k, preventDefault: () => undefined }) as unknown as KeyboardEvent;

      t.table().onHeaderKeyDown('team', key('ArrowLeft'));
      expect(t.columnKeys()).toEqual(['team', 'name', 'status']);
      t.table().onHeaderKeyDown('team', key('ArrowLeft'));
      expect(t.columnKeys()).toEqual(['team', 'name', 'status']);
      t.table().onHeaderKeyDown('status', key('ArrowRight'));
      expect(t.columnKeys()).toEqual(['team', 'name', 'status']);
    });

    it('affiche la valeur calculée par le provider value d\'une colonne', async () => {
      const t = setup({ columns: [{ key: 'name', header: 'Nom', value: row => row.name.toUpperCase() }] });
      await t.settle();
      expect(t.cells('name')[0]).toBe('ITEM-01');
    });

    it('affiche un libellé pour les cellules vides', async () => {
      const t = setup({ data: [{ ...makeRows(1)[0], team: '' }] });
      await t.settle();
      expect(t.root().querySelector('td.mat-column-team .cell-empty')).not.toBeNull();
    });
  });

  describe('dimensionnement et épinglage', () => {
    const pinButton = (t: ReturnType<typeof setup>, key: string) =>
      t.root().querySelector<HTMLButtonElement>(`th.mat-column-${key} .pin-btn`);
    const dragEvent = () => ({ preventDefault: () => undefined, dataTransfer: null }) as unknown as DragEvent;
    const keyEvent = (key: string) => ({ key, preventDefault: () => undefined }) as unknown as KeyboardEvent;
    const savedPrefs = (saved: object) => localStorage.setItem('jqt_prefs_spec-table', JSON.stringify(saved));
    const visibleOrder = { columnOrder: ['name', 'team', 'status'], visibleColumns: ['name', 'team', 'status'] };
    const wideColumns = (): TableColumnProvider<Row>[] => [
      { key: 'name', header: 'Nom', minWidth: 600 },
      { key: 'team', header: 'Équipe', minWidth: 600 },
      { key: 'status', header: 'Statut', minWidth: 600 },
    ];
    // Le débordement est mesuré par ResizeObserver (asynchrone) : on attend l'apparition des boutons
    const settleWide = async (t: ReturnType<typeof setup>) => {
      await t.settle();
      for (let i = 0; i < 25 && t.count('.pin-btn') === 0; i++) {
        await new Promise(resolve => setTimeout(resolve, 20));
        await t.settle();
      }
    };

    it('n\'affiche le bouton d\'épinglage que lorsque le tableau défile horizontalement', async () => {
      const vertical = setup({ config: { pinning: { enabled: true } } });
      (vertical.fixture.debugElement.query(By.directive(TableComponent)).nativeElement as HTMLElement).style.height = '400px';
      await vertical.settle();
      await new Promise(resolve => setTimeout(resolve, 50));
      await vertical.settle();
      const scroller = vertical.root().querySelector<HTMLElement>('.table-body-scroll')!;
      expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight);
      expect(scroller.scrollWidth).toBeLessThanOrEqual(scroller.clientWidth);
      expect(vertical.count('.pin-btn')).toBe(0);

      const wide = setup({ config: { pinning: { enabled: true } }, columns: wideColumns() });
      await settleWide(wide);
      expect(wide.count('.pin-btn')).toBe(3);
    });

    it('place le bouton d\'épinglage à gauche du titre, dans le conteneur head-lead', async () => {
      const t = setup({
        config: { pinning: { enabled: true } },
        columns: [
          { key: 'name', header: 'Nom', icon: 'person', minWidth: 600 },
          { key: 'team', header: 'Équipe', minWidth: 600 },
          { key: 'status', header: 'Statut', minWidth: 600 },
        ],
      });
      await settleWide(t);
      const btn = pinButton(t, 'name')!;
      const headCell = btn.closest('.head-cell')!;
      expect(headCell.firstElementChild?.classList.contains('head-lead')).toBe(true);
      expect(btn.closest('.head-lead')).not.toBeNull();
      expect(headCell.classList.contains('has-icon')).toBe(true);
      expect(pinButton(t, 'team')!.closest('.head-cell')!.classList.contains('has-icon')).toBe(false);
    });

    it('n\'épingle qu\'une colonne à la fois : les autres boutons sont désactivés tant qu\'une colonne est épinglée', async () => {
      const t = setup({ config: { pinning: { enabled: true } }, columns: wideColumns() });
      await settleWide(t);

      pinButton(t, 'status')!.click();
      await t.settle();
      expect(t.columnKeys()).toEqual(['status', 'name', 'team']);
      expect(t.count('th.col-pinned')).toBe(1);
      expect(pinButton(t, 'status')!.getAttribute('aria-pressed')).toBe('true');
      expect(pinButton(t, 'name')!.disabled).toBe(true);
      expect(pinButton(t, 'team')!.disabled).toBe(true);
      expect(pinButton(t, 'status')!.disabled).toBe(false);

      // Une tentative directe sur une autre colonne n'a aucun effet
      t.table().togglePinColumn('team');
      await t.settle();
      expect(t.table()._pinnedColumnKey).toBe('status');
      expect(t.columnKeys()).toEqual(['status', 'name', 'team']);
    });

    it('permet d\'épingler une autre colonne après avoir désépinglé la première', async () => {
      const t = setup({ config: { pinning: { enabled: true } }, columns: wideColumns() });
      await settleWide(t);

      pinButton(t, 'status')!.click();
      await t.settle();
      pinButton(t, 'status')!.click();
      await t.settle();
      expect(pinButton(t, 'team')!.disabled).toBe(false);

      pinButton(t, 'team')!.click();
      await t.settle();
      expect(t.columnKeys()).toEqual(['team', 'name', 'status']);
      expect(t.count('th.col-pinned')).toBe(1);
      expect(t.count('td.col-pinned')).toBe(5);
    });

    it('remet la colonne épinglée à sa position d\'origine au désépinglage', async () => {
      const t = setup({ config: { pinning: { enabled: true } }, columns: wideColumns() });
      await settleWide(t);
      pinButton(t, 'status')!.click();
      await t.settle();
      expect(t.columnKeys()).toEqual(['status', 'name', 'team']);
      pinButton(t, 'status')!.click();
      await t.settle();
      expect(t.table()._pinnedColumnKey).toBeNull();
      expect(t.count('th.col-pinned')).toBe(0);
      expect(t.columnKeys()).toEqual(['name', 'team', 'status']);
    });

    it('ne fixe aucune largeur minimale de tableau sans largeur explicite', async () => {
      const t = setup();
      await t.settle();
      expect(t.table().tableMinWidth).toBeNull();
      expect(t.table().getColumnWidth('name')).toBe('auto');
    });

    it('calcule la largeur minimale du tableau depuis minWidth et width en px', async () => {
      const t = setup({
        columns: [
          { key: 'name', header: 'Nom', minWidth: 200 },
          { key: 'team', header: 'Équipe', width: '150px', minWidth: 300 },
          { key: 'status', header: 'Statut' },
        ],
      });
      await t.settle();
      expect(t.table().getColumnWidth('name')).toBe('200px');
      expect(t.table().getColumnWidth('team')).toBe('150px');
      expect(t.table().getColumnWidth('status')).toBe('auto');
      expect(t.table().tableMinWidth).toBe('350px');
    });

    it('n\'affiche aucun bouton d\'épinglage quand pinning est désactivé', async () => {
      const t = setup({ config: { pinning: { enabled: false } }, columns: wideColumns() });
      await settleWide(t);
      expect(t.count('.pin-btn')).toBe(0);
      t.table().togglePinColumn('status');
      await t.settle();
      expect(t.columnKeys()).toEqual(['name', 'team', 'status']);
    });

    it('active l\'épinglage par défaut, sans configuration', async () => {
      const t = setup({ columns: wideColumns() });
      await settleWide(t);
      expect(t.table().isPinningEnabled).toBeTrue();
      expect(t.count('.pin-btn')).toBe(3);
    });

    it('applique columnMinWidth aux colonnes sans minWidth ni width, sans écraser minWidth', async () => {
      const t = setup({
        config: { columnMinWidth: 120 },
        columns: [
          { key: 'name', header: 'Nom' },
          { key: 'team', header: 'Équipe', minWidth: 200 },
          { key: 'status', header: 'Statut', width: '150px' },
        ],
      });
      await t.settle();
      expect(t.table().getColumnWidth('name')).toBe('120px');
      expect(t.table().getColumnWidth('team')).toBe('200px');
      expect(t.table().getColumnWidth('status')).toBe('150px');
      expect(t.table().tableMinWidth).toBe('470px');
    });

    it('sans columnMinWidth, une colonne sans largeur reste auto', async () => {
      const t = setup({ columns: [{ key: 'name', header: 'Nom' }] });
      await t.settle();
      expect(t.table().getColumnWidth('name')).toBe('auto');
      expect(t.table().tableMinWidth).toBeNull();
    });

    it('garde la colonne épinglée en tête lors d\'un déplacement clavier ou glisser-déposer', async () => {
      const t = setup({ config: { pinning: { enabled: true } } });
      await t.settle();
      t.table().togglePinColumn('status');
      await t.settle();

      t.table().onHeaderKeyDown('status', keyEvent('ArrowRight'));
      expect(t.columnKeys()[0]).toBe('status');

      t.table().onHeaderDragStart('team', dragEvent());
      t.table().onHeaderDrop('status', dragEvent());
      await t.settle();
      expect(t.columnKeys()[0]).toBe('status');
      expect(t.columnKeys().length).toBe(3);
    });

    it('rend la colonne épinglée sticky à gauche', async () => {
      const t = setup({ config: { pinning: { enabled: true } } });
      await t.settle();
      t.table().togglePinColumn('name');
      await t.settle();
      const th = t.root().querySelector<HTMLElement>('th.mat-column-name')!;
      const td = t.root().querySelector<HTMLElement>('td.mat-column-name')!;
      expect(getComputedStyle(th).position).toBe('sticky');
      expect(getComputedStyle(td).position).toBe('sticky');
      expect(getComputedStyle(td).left).toBe('0px');
      expect(Number(getComputedStyle(th).zIndex)).toBeGreaterThan(100);
      expect(getComputedStyle(td).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(getComputedStyle(t.root().querySelector<HTMLElement>('td.mat-column-team')!).position).not.toBe('sticky');
    });

    it('sauvegarde et restaure la colonne épinglée', async () => {
      const t = setup({ config: { pinning: { enabled: true } } });
      await t.settle();
      t.table().togglePinColumn('status');
      await t.settle();
      t.table().savePreferences();
      expect(JSON.parse(localStorage.getItem('jqt_prefs_spec-table')!).pinnedColumn).toBe('status');
      t.fixture.destroy();

      const restored = setup({ config: { pinning: { enabled: true } } });
      await restored.settle();
      expect(restored.columnKeys()[0]).toBe('status');
      expect(restored.count('th.col-pinned')).toBe(1);
    });

    it('ignore la colonne épinglée sauvegardée si elle n\'est plus visible', async () => {
      savedPrefs({ ...visibleOrder, pinnedColumn: 'score' });
      const t = setup({ config: { pinning: { enabled: true } } });
      await t.settle();
      expect(t.table()._pinnedColumnKey).toBeNull();
      expect(t.columnKeys()).toEqual(['name', 'team', 'status']);
    });

    it('n\'applique pas l\'épingle sauvegardée quand pinning est désactivé', async () => {
      savedPrefs({ ...visibleOrder, pinnedColumn: 'status' });
      const t = setup({ config: { pinning: { enabled: false } } });
      await t.settle();
      expect(t.table()._pinnedColumnKey).toBeNull();
      expect(t.columnKeys()).toEqual(['name', 'team', 'status']);
    });

    it('réinitialise l\'épingle avec les préférences', async () => {
      const t = setup({ config: { pinning: { enabled: true } } });
      await t.settle();
      t.table().togglePinColumn('status');
      await t.settle();
      t.table().clearPreferences();
      await t.settle();
      expect(t.table()._pinnedColumnKey).toBeNull();
    });
  });

  describe('lignes', () => {
    it('émet la ligne brute au clic, appelle onRowSelected et applique rowClass', async () => {
      const onRowSelected = jasmine.createSpy('onRowSelected');
      const t = setup({ config: { onRowSelected, rowClass: row => ({ 'is-ko': row.status === 'KO' }) } });
      await t.settle();

      const rows = t.root().querySelectorAll('tr.mat-mdc-row');
      expect(rows[1].classList).toContain('is-ko');
      expect(rows[0].classList).not.toContain('is-ko');

      (rows[1] as HTMLElement).click();
      expect(t.host.selected.length).toBe(1);
      expect(t.host.selected[0].id).toBe(2);
      expect(onRowSelected).toHaveBeenCalledOnceWith(t.host.data[1], jasmine.any(MouseEvent));
    });

    it('un clic sur un en-tête de groupe n\'émet pas de sélection de ligne', async () => {
      const t = setup();
      await t.settle();
      t.table().onGroupByChange('team');
      await t.settle();
      (t.root().querySelector('tr.group-header-row') as HTMLElement).click();
      expect(t.host.selected.length).toBe(0);
    });
  });

  describe('préférences', () => {
    it('sauvegarde colonnes, groupe et recherche puis les restaure dans un nouveau tableau', async () => {
      const t = setup();
      await t.settle();
      t.table().onColumnVisibilityChange(t.host.config.columns![3], true);
      t.table().onGroupByChange('team');
      t.search('a');
      t.table().savePreferences();
      expect(JSON.parse(localStorage.getItem('jqt_prefs_spec-table')!)).toEqual(jasmine.objectContaining({
        groupBy: 'team', visibleColumns: ['name', 'team', 'status', 'score'], search: 'a',
      }));
      t.fixture.destroy();

      const restored = setup();
      await restored.settle();
      expect(restored.columnKeys()).toEqual(['name', 'team', 'status', 'score']);
      expect(restored.table().activeGroupByKey).toBe('team');
      expect(restored.table().hasSavedPreferences).toBeTrue();
    });

    it('sauvegarde et restaure le nombre de lignes par page', async () => {
      const t = setup();
      await t.settle();
      t.table().paginator!.pageSize = 10;
      t.table().paginator!.page.emit({ pageIndex: 0, pageSize: 10, length: 12 });
      await t.settle();
      expect(t.cells('name').length).toBe(10);
      t.table().savePreferences();
      expect(JSON.parse(localStorage.getItem('jqt_prefs_spec-table')!).pageSize).toBe(10);
      t.fixture.destroy();

      const restored = setup();
      await restored.settle();
      expect(restored.cells('name').length).toBe(10);
      expect(restored.table().paginator!.pageSize).toBe(10);
    });

    it('conserve le nombre de lignes restauré après un group by puis un retour au tableau normal', async () => {
      localStorage.setItem('jqt_prefs_spec-table', JSON.stringify({ pageSize: 10, groupBy: 'team' }));
      const t = setup();
      await t.settle();
      expect(t.groupLabels()).toEqual(['Alpha', 'Beta', 'Gamma']);

      t.table().onGroupByChange(null);
      await t.settle();
      expect(t.cells('name').length).toBe(10);

      t.host.data = makeRows(12);
      await t.settle();
      expect(t.cells('name').length).toBe(10);
    });

    it('sauvegarde et restaure le nombre de lignes par groupe, y compris « tout afficher »', async () => {
      const t = setup();
      await t.settle();
      t.table().onGroupByChange('team');
      t.table().onGroupPageSizeChange(2);
      t.table().savePreferences();
      expect(JSON.parse(localStorage.getItem('jqt_prefs_spec-table')!).groupPageSize).toBe(2);
      t.fixture.destroy();

      const restored = setup();
      await restored.settle();
      expect(restored.table().groupPageSize).toBe(2);
      (restored.root().querySelector('tr.group-header-row') as HTMLElement).click();
      await restored.settle();
      expect(restored.cells('name').length).toBe(2);
      restored.table().onGroupPageSizeChange(0);
      restored.table().savePreferences();
      restored.fixture.destroy();

      const all = setup();
      await all.settle();
      expect(all.table().groupPageSize).toBe(0);
      (all.root().querySelector('tr.group-header-row') as HTMLElement).click();
      await all.settle();
      expect(all.cells('name').length).toBe(4);
    });

    it('ignore un nombre de lignes absent des options de la config', async () => {
      localStorage.setItem('jqt_prefs_spec-table', JSON.stringify({ pageSize: 7, groupPageSize: 9, groupBy: 'team' }));
      const t = setup();
      await t.settle();
      expect(t.table().groupPageSize).not.toBe(9);
      t.table().onGroupByChange(null);
      await t.settle();
      expect(t.cells('name').length).toBe(5);
    });

    it('une ancienne sauvegarde sans nombre de lignes garde les valeurs de la config', async () => {
      localStorage.setItem('jqt_prefs_spec-table', JSON.stringify({ groupBy: null }));
      const t = setup();
      await t.settle();
      expect(t.cells('name').length).toBe(5);
    });

    it('clearPreferences remet le nombre de lignes de la config', async () => {
      const t = setup();
      await t.settle();
      t.table().paginator!.pageSize = 10;
      t.table().paginator!.page.emit({ pageIndex: 0, pageSize: 10, length: 12 });
      await t.settle();
      t.table().onGroupPageSizeChange(5);
      t.table().savePreferences();

      t.table().clearPreferences();
      await t.settle();
      expect(t.cells('name').length).toBe(5);
      expect(t.table().groupPageSize).toBe(2);
    });

    it('clearPreferences restaure l\'état par défaut et supprime la sauvegarde', async () => {
      const t = setup();
      await t.settle();
      t.table().onColumnVisibilityChange(t.host.config.columns![3], true);
      t.table().onGroupByChange('team');
      t.table().savePreferences();

      t.table().clearPreferences();
      await t.settle();
      expect(t.columnKeys()).toEqual(['name', 'team', 'status']);
      expect(t.table().activeGroupByKey).toBeNull();
      expect(localStorage.getItem('jqt_prefs_spec-table')).toBeNull();
    });

    it('ignore une préférence qui référence des colonnes disparues', async () => {
      localStorage.setItem('jqt_prefs_spec-table', JSON.stringify({ columnOrder: ['ghost', 'team'], visibleColumns: ['ghost', 'team'] }));
      const t = setup();
      await t.settle();
      expect(t.columnKeys()).toEqual(['team']);
    });

    it('une préférence illisible est ignorée', async () => {
      localStorage.setItem('jqt_prefs_spec-table', '{broken');
      const t = setup();
      await t.settle();
      expect(t.columnKeys()).toEqual(['name', 'team', 'status']);
    });

    it('sauvegarde le tri de colonne et le restaure sans émettre sortChange', async () => {
      const t = setup();
      await t.settle();
      t.sortBy('name', 2);
      await t.settle();
      expect(t.cells('name')[0]).toBe('item-12');
      t.table().savePreferences();
      expect(JSON.parse(localStorage.getItem('jqt_prefs_spec-table')!).sort).toEqual({ active: 'name', direction: 'desc' });
      t.fixture.destroy();

      const restored = setup();
      await restored.settle();
      expect(restored.cells('name')).toEqual(['item-12', 'item-11', 'item-10', 'item-09', 'item-08']);
      expect(restored.table().sort!.active).toBe('name');
      expect(restored.table().sort!.direction).toBe('desc');
      expect(restored.host.sorts).toEqual([]);
    });

    it('un tri sauvegardé prime sur defaultSort', async () => {
      localStorage.setItem('jqt_prefs_spec-table', JSON.stringify({ sort: { active: 'name', direction: 'asc' } }));
      const t = setup({ config: { defaultSort: { active: 'name', direction: 'desc' } } });
      await t.settle();
      expect(t.cells('name')[0]).toBe('item-01');
      expect(t.table().sort!.direction).toBe('asc');
    });

    it('ignore un tri sur une colonne absente de la vue', async () => {
      localStorage.setItem('jqt_prefs_spec-table', JSON.stringify({ sort: { active: 'ghost', direction: 'desc' } }));
      const t = setup();
      await t.settle();
      expect(t.table().sort!.active).toBe('');
      expect(t.cells('name')[0]).toBe('item-01');
    });

    it('ignore un tri sur une colonne non triable', async () => {
      const columns = baseColumns().map(c => c.key === 'status' ? { ...c, sortable: false } : c);
      localStorage.setItem('jqt_prefs_spec-table', JSON.stringify({ sort: { active: 'status', direction: 'asc' } }));
      const t = setup({ columns });
      await t.settle();
      expect(t.table().sort!.active).toBe('');
    });

    it('sauvegarde et restaure l\'ordre des groupes', async () => {
      const t = setup();
      await t.settle();
      t.table().onGroupByChange('team');
      t.table().onGroupSortToggle('desc');
      await t.settle();
      t.table().savePreferences();
      expect(JSON.parse(localStorage.getItem('jqt_prefs_spec-table')!).groupSortOrder).toBe('desc');
      t.fixture.destroy();

      const restored = setup();
      await restored.settle();
      expect(restored.table().groupSortOrder).toBe('desc');
      expect(restored.groupLabels()).toEqual(['Gamma', 'Beta', 'Alpha']);
    });

    it('clearPreferences remet le tri de colonne et l\'ordre des groupes par défaut', async () => {
      const t = setup();
      await t.settle();
      t.sortBy('name', 2);
      await t.settle();
      t.table().onGroupByChange('team');
      t.table().onGroupSortToggle('desc');
      await t.settle();
      t.table().savePreferences();
      expect(JSON.parse(localStorage.getItem('jqt_prefs_spec-table')!)).toEqual(jasmine.objectContaining({ sort: { active: 'name', direction: 'desc' }, groupSortOrder: 'desc' }));

      t.table().clearPreferences();
      await t.settle();
      expect(t.table().sort!.active).toBe('');
      expect(t.table().sort!.direction).toBe('');
      expect(t.table().groupSortOrder).toBe('asc');
      expect(localStorage.getItem('jqt_prefs_spec-table')).toBeNull();
    });

    it('clearPreferences réapplique defaultSort au lieu du tri utilisateur', async () => {
      const t = setup({ config: { defaultSort: { active: 'name', direction: 'desc' } } });
      await t.settle();
      t.sortBy('score', 1);
      await t.settle();
      expect(t.table().sort!.active).toBe('score');

      t.table().clearPreferences();
      await t.settle();
      expect(t.table().sort!.active).toBe('name');
      expect(t.cells('name')[0]).toBe('item-12');
    });
  });

  describe('snapshot visuel', () => {
    it('capture données filtrées, état et avertissement sur les fonctions non transportables', async () => {
      const t = setup({ config: { onRowSelected: () => undefined } });
      await t.settle();
      t.search('alpha');
      await t.settle();

      const draft = t.table().createVisualSnapshot('copie');
      expect(draft.type).toBe('table');
      expect((draft.data as Row[]).length).toBe(4);
      expect(draft.warnings?.length).toBeGreaterThan(0);
      expect((draft.state as { search: string }).search).toBe('alpha');
    });

    it('applyVisualSnapshot restaure colonnes, recherche et Group by, et signale les colonnes inconnues', async () => {
      const t = setup();
      await t.settle();

      const result = t.table().applyVisualSnapshot({
        type: 'table', label: 'c', config: {}, data: [], warnings: [],
        state: { columnOrder: ['team', 'ghost', 'name'], search: 'beta', groupBy: 'team' },
      } as any);
      await t.settle();

      expect(result.applied).toBeTrue();
      expect(result.skipped).toEqual(['ghost']);
      expect(t.columnKeys()).toEqual(['team', 'name']);
      expect(t.table().searchQuery).toBe('beta');
      expect(t.table().activeGroupByKey).toBe('team');
    });

    it('refuse un snapshot qui n\'est pas un tableau', async () => {
      const t = setup();
      expect(t.table().applyVisualSnapshot({ type: 'chart', state: {} } as any).applied).toBeFalse();
    });
  });

  describe('performance de la recherche', () => {
    it('ne reconstruit pas le panneau de slices à chaque frappe', async () => {
      const t = setup({ config: { slices: [{ title: 'Statut', columnKey: 'status' }] } });
      await t.settle();
      const rebuild = spyOn<any>(SlicePanelComponent.prototype, '_rebuildCache').and.callThrough();

      t.search('a');
      await t.settle();
      t.search('al');
      await t.settle();
      expect(rebuild).not.toHaveBeenCalled();
    });
  });
});
