import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TableComponent } from './table.component';
import { JqtCellDefDirective } from '../directive/jqt-cell-def.directive';
import { TableColumnProvider, TableProvider } from '../jquery-table.model';

interface Row { id: number; name: string; team?: string; details?: string }

@Component({
  standalone: true,
  imports: [TableComponent],
  template: `<jquery-table [config]="config" [data]="data" [lazyError]="lazyError" (lazyColumnsRequested)="requested.push($event)"></jquery-table>`,
})
class HostComponent {
  config!: TableProvider<Row>;
  data: Row[] = [];
  lazyError = false;
  requested: string[][] = [];
}

@Component({
  standalone: true,
  imports: [TableComponent, JqtCellDefDirective],
  template: `
    <jquery-table [config]="config" [data]="data" [lazyError]="lazyError" (lazyColumnsRequested)="requested.push($event)">
      <ng-template jqtCellDef="details" let-row let-value="value"><b class="tpl-details">{{ value }}#{{ row.id }}</b></ng-template>
      <ng-template jqtCellDef="name" let-value="value"><i class="tpl-name">{{ value }}</i></ng-template>
    </jquery-table>`,
})
class TemplateHostComponent extends HostComponent {}

const rows = (...ids: number[]): Row[] => ids.map(id => ({ id, name: `name-${id}` }));
const withValues = (key: 'details' | 'team', values: Record<number, string>, ids = [1, 2, 3]): Row[] =>
  ids.map(id => ({ id, name: `name-${id}`, [key]: values[id] }));

interface SetupOptions {
  columns?: TableColumnProvider<Row>[];
  data?: Row[];
  withTemplates?: boolean;
  config?: Partial<TableProvider<Row>>;
}

function setup(options: SetupOptions = {}) {
  const columns = options.columns ?? [
    { key: 'name', header: 'Nom' },
    { key: 'details', header: 'Détails', optional: true, lazy: true },
    { key: 'team', header: 'Équipe', optional: true, lazy: true },
  ];

  const makeConfig = (): TableProvider<Row> => ({
    columns: columns.map(column => ({ ...column })),
    view: { enabled: true, enableColumnRemoval: true },
    pagination: { enabled: true, pageSize: 10, pageSizeOptions: [10] },
    ...options.config,
  });

  const fixture: ComponentFixture<HostComponent> = options.withTemplates
    ? TestBed.createComponent(TemplateHostComponent)
    : TestBed.createComponent(HostComponent);
  const host = fixture.componentInstance;
  host.config = makeConfig();
  host.data = options.data ?? rows(1, 2, 3);
  fixture.detectChanges();

  const table = (): TableComponent<Row> => fixture.debugElement.query(By.directive(TableComponent)).componentInstance;
  const column = (key: string): TableColumnProvider<Row> => host.config.columns!.find(c => c.key === key)!;
  const settle = async () => {
    // Le rendu est différé par setTimeout(0) et peut en replanifier un autre : on laisse passer plusieurs tours.
    for (let round = 0; round < 4; round++) {
      fixture.detectChanges();
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const root = (): HTMLElement => fixture.nativeElement;
  const cells = (key: string): string[] =>
    Array.from(root().querySelectorAll(`td.mat-column-${key}`)).map(td => (td.textContent ?? '').trim());
  const count = (selector: string): number => root().querySelectorAll(selector).length;
  const activate = (key: string) => table().onColumnVisibilityChange(column(key), true);
  const deactivate = (key: string) => table().onColumnVisibilityChange(column(key), false);
  const groupLabels = () =>
    Array.from(root().querySelectorAll('.group-header-row .group-key-label')).map(e => e.textContent!.trim());

  return { fixture, host, makeConfig, table, column, settle, cells, count, activate, deactivate, groupLabels, root };
}

describe('TableComponent — colonnes lazy (requête relancée par l\'application)', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent, TemplateHostComponent], providers: [provideNoopAnimations()] });
  });

  describe('activation depuis Organizer', () => {
    it('ne demande pas une colonne optionnelle tant qu\'elle n\'est pas affichée', async () => {
      const t = setup();
      await t.settle();

      expect(t.host.requested).toEqual([]);
      expect(t.count('td.mat-column-details')).toBe(0);
    });

    it('émet la colonne demandée, affiche un skeleton, puis les valeurs dès que les nouvelles data arrivent', async () => {
      const t = setup();
      await t.settle();

      t.activate('details');
      await t.settle();
      expect(t.host.requested).toEqual([['details']]);
      expect(t.count('td.mat-column-details .lazy-skeleton')).toBe(3);

      t.host.data = withValues('details', { 1: 'd1', 2: 'd2', 3: 'd3' });
      await t.settle();
      expect(t.cells('details')).toEqual(['d1', 'd2', 'd3']);
      expect(t.count('.lazy-skeleton')).toBe(0);
    });

    it('ne redemande pas une colonne masquée puis réaffichée pendant l\'attente', async () => {
      const t = setup();
      t.activate('details');
      await t.settle();
      deactivateThenActivate(t);
      await t.settle();

      expect(t.host.requested.length).toBe(1);
    });

    it('regroupe en un seul événement les colonnes activées dans le même tick', async () => {
      const t = setup();
      await t.settle();

      t.activate('details');
      t.activate('team');
      await t.settle();
      expect(t.host.requested).toEqual([['details', 'team']]);
    });

    it('cumule les colonnes déjà demandées quand une autre est activée plus tard', async () => {
      const t = setup();
      t.activate('details');
      await t.settle();
      t.host.data = withValues('details', { 1: 'd1', 2: 'd2', 3: 'd3' });
      await t.settle();

      t.activate('team');
      await t.settle();
      expect(t.host.requested).toEqual([['details'], ['details', 'team']]);
      expect(t.cells('details')).toEqual(['d1', 'd2', 'd3']);
      expect(t.count('td.mat-column-team .lazy-skeleton')).toBe(3);
    });

    it('une colonne chargée puis masquée et réaffichée ne redemande rien et garde ses valeurs', async () => {
      const t = setup();
      t.activate('details');
      await t.settle();
      t.host.data = withValues('details', { 1: 'd1', 2: 'd2', 3: 'd3' });
      await t.settle();

      t.deactivate('details');
      await t.settle();
      t.activate('details');
      await t.settle();
      expect(t.host.requested.length).toBe(1);
      expect(t.cells('details')).toEqual(['d1', 'd2', 'd3']);
      expect(t.count('.lazy-skeleton')).toBe(0);
    });
  });

  describe('colonnes visibles par défaut', () => {
    const visibleLazy: TableColumnProvider<Row>[] = [
      { key: 'name', header: 'Nom' },
      { key: 'details', header: 'Détails', lazy: true },
      { key: 'team', header: 'Équipe', lazy: true },
    ];

    it('demande toutes les colonnes lazy visibles en un seul événement', async () => {
      const t = setup({ columns: visibleLazy });
      await t.settle();

      expect(t.host.requested).toEqual([['details', 'team']]);
    });

    it('n\'émet rien tant que le tableau est vide, puis demande les colonnes à l\'arrivée des lignes', async () => {
      const t = setup({ columns: visibleLazy, data: [] });
      await t.settle();
      expect(t.host.requested).toEqual([]);

      t.host.data = rows(1, 2);
      await t.settle();
      expect(t.host.requested).toEqual([['details', 'team']]);
    });
  });

  describe('mise à jour des données et de la config', () => {
    it('un rafraîchissement de data garde la colonne prête sans nouvelle demande', async () => {
      const t = setup();
      t.activate('details');
      await t.settle();
      t.host.data = withValues('details', { 1: 'd1', 2: 'd2', 3: 'd3' });
      await t.settle();

      t.host.data = withValues('details', { 1: 'x1', 2: 'x2', 3: 'x3' });
      await t.settle();
      expect(t.cells('details')).toEqual(['x1', 'x2', 'x3']);
      expect(t.host.requested.length).toBe(1);
      expect(t.count('.lazy-skeleton')).toBe(0);
    });

    it('une nouvelle config avec les mêmes colonnes ne relance rien', async () => {
      const t = setup();
      t.activate('details');
      await t.settle();
      t.host.data = withValues('details', { 1: 'd1', 2: 'd2', 3: 'd3' });
      await t.settle();

      t.host.config = t.makeConfig();
      await t.settle();
      expect(t.host.requested.length).toBe(1);
      expect(t.count('.lazy-skeleton')).toBe(0);
    });
  });

  describe('erreur et nouvel essai', () => {
    it('affiche un bouton de nouvel essai par ligne, puis redemande les colonnes et revient au skeleton au clic', async () => {
      const t = setup();
      t.activate('details');
      await t.settle();

      t.host.lazyError = true;
      await t.settle();
      expect(t.count('td.mat-column-details .lazy-error-btn')).toBe(3);
      expect(t.count('.lazy-skeleton')).toBe(0);

      (t.root().querySelector('td.mat-column-details .lazy-error-btn') as HTMLButtonElement).click();
      await t.settle();
      expect(t.host.requested).toEqual([['details'], ['details']]);
      expect(t.count('.lazy-error-btn')).toBe(0);
      expect(t.count('td.mat-column-details .lazy-skeleton')).toBe(3);

      t.host.lazyError = false;
      t.host.data = withValues('details', { 1: 'd1', 2: 'd2', 3: 'd3' });
      await t.settle();
      expect(t.cells('details')).toEqual(['d1', 'd2', 'd3']);
    });

    it('repasser lazyError à false remet les colonnes en erreur en attente', async () => {
      const t = setup();
      t.activate('details');
      await t.settle();
      t.host.lazyError = true;
      await t.settle();

      t.host.lazyError = false;
      await t.settle();
      expect(t.count('.lazy-error-btn')).toBe(0);
      expect(t.count('td.mat-column-details .lazy-skeleton')).toBe(3);
    });

    it('le clic sur « Réessayer » ne sélectionne pas la ligne', async () => {
      const t = setup();
      const selected: Row[] = [];
      t.table().rowSelected.subscribe(row => selected.push(row));
      t.activate('details');
      await t.settle();
      t.host.lazyError = true;
      await t.settle();

      (t.root().querySelector('td.mat-column-details .lazy-error-btn') as HTMLButtonElement).click();
      await t.settle();
      expect(t.host.requested.length).toBe(2);
      expect(selected).toEqual([]);
    });

    it('une erreur ne casse pas le tri ni la recherche sur les colonnes de base', async () => {
      const t = setup();
      t.activate('details');
      await t.settle();
      t.host.lazyError = true;
      await t.settle();

      t.table().searchQuery = 'name-2';
      t.table().onSearchChange();
      await t.settle();
      expect(t.cells('name')).toEqual(['name-2']);
    });
  });

  describe('fonctionnalités conservées sur une colonne chargée', () => {
    async function loaded() {
      const t = setup();
      t.activate('details');
      await t.settle();
      t.host.data = withValues('details', { 1: 'banana', 2: 'apple', 3: 'cherry' });
      await t.settle();
      return t;
    }

    it('trie sur la colonne', async () => {
      const t = await loaded();

      t.table().sort!.sort({ id: 'details', start: 'asc', disableClear: false });
      await t.settle();
      expect(t.cells('details')).toEqual(['apple', 'banana', 'cherry']);

      t.table().sort!.sort({ id: 'details', start: 'asc', disableClear: false });
      await t.settle();
      expect(t.cells('details')).toEqual(['apple', 'banana', 'cherry'].reverse());
    });

    it('recherche dans les valeurs chargées', async () => {
      const t = await loaded();

      t.table().searchQuery = 'ppl';
      t.table().onSearchChange();
      await t.settle();
      expect(t.cells('details')).toEqual(['apple']);
    });

    it('regroupe par la colonne', async () => {
      const t = setup();
      t.activate('team');
      await t.settle();
      t.host.data = withValues('team', { 1: 'A', 2: 'B', 3: 'A' });
      await t.settle();

      t.table().onGroupByChange('team');
      await t.settle();
      expect(t.groupLabels()).toEqual(['A', 'B']);
    });
  });

  describe('colonne lazy utilisée sans être affichée', () => {
    it('regrouper par une colonne non chargée la demande et affiche un état de chargement, puis regroupe', async () => {
      const t = setup();
      await t.settle();

      t.table().onGroupByChange('team');
      await t.settle();
      expect(t.host.requested).toEqual([['team']]);
      expect(t.count('.group-header-loading')).toBe(1);

      t.host.data = withValues('team', { 1: 'A', 2: 'A', 3: 'B' });
      await t.settle();
      expect(t.count('.group-header-loading')).toBe(0);
      expect(t.count('.group-header-row')).toBe(2);
    });

    it('demande la colonne du Group by par défaut puis regroupe', async () => {
      const t = setup({ config: { defaultGroupBy: 'team' } });
      await t.settle();
      expect(t.host.requested).toEqual([['team']]);

      t.host.data = withValues('team', { 1: 'A', 2: 'B', 3: 'A' });
      await t.settle();
      expect(t.groupLabels()).toEqual(['A', 'B']);
    });

    it('affiche une erreur avec nouvel essai quand la colonne du Group by échoue', async () => {
      const t = setup({ config: { defaultGroupBy: 'team' } });
      await t.settle();
      t.host.lazyError = true;
      await t.settle();
      expect(t.count('.group-header-error .lazy-error-btn')).toBe(1);
      expect(t.count('.group-header-loading')).toBe(0);

      (t.root().querySelector('.group-header-error .lazy-error-btn') as HTMLButtonElement).click();
      await t.settle();
      expect(t.host.requested).toEqual([['team'], ['team']]);
      expect(t.count('.group-header-loading')).toBe(1);

      t.host.lazyError = false;
      t.host.data = withValues('team', { 1: 'A', 2: 'A', 3: 'B' });
      await t.settle();
      expect(t.groupLabels()).toEqual(['A', 'B']);
    });

    it('ajouter la colonne comme Slice by la demande', async () => {
      const t = setup();
      await t.settle();

      t.table().addDynamicSlice(t.column('team'));
      await t.settle();
      expect(t.host.requested).toEqual([['team']]);
    });

    it('demande une colonne lazy restaurée par un snapshot', async () => {
      const t = setup();
      await t.settle();

      t.table().applyVisualSnapshot({
        type: 'table', label: 'copie', config: {}, state: { columnOrder: ['name', 'details'] }, data: [], warnings: [],
      } as any);
      await t.settle();
      expect(t.host.requested).toEqual([['details']]);
    });

    it('n\'émet rien si le composant est détruit avant l\'envoi', async () => {
      const t = setup();
      await t.settle();

      t.activate('details');
      t.fixture.destroy();
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(t.host.requested).toEqual([]);
    });

    it('un changement de données sans colonne lazy affichée n\'émet rien', async () => {
      const t = setup();
      await t.settle();

      t.host.data = rows(1, 2, 3, 4);
      await t.settle();
      expect(t.host.requested).toEqual([]);
    });
  });

  describe('templates de cellule (jqtCellDef) sur une colonne lazy', () => {
    it('affiche le skeleton pendant l\'attente puis le template avec la valeur reçue', async () => {
      const t = setup({ withTemplates: true });
      t.activate('details');
      await t.settle();
      expect(t.count('td.mat-column-details .lazy-skeleton')).toBe(3);
      expect(t.count('.tpl-details')).toBe(0);

      t.host.data = withValues('details', { 1: 'd1', 2: 'd2', 3: 'd3' });
      await t.settle();
      expect(t.count('td.mat-column-details .lazy-skeleton')).toBe(0);
      expect(t.cells('details')).toEqual(['d1#1', 'd2#2', 'd3#3']);
    });

    it('affiche le bouton d\'erreur à la place du template, puis le template après un nouvel essai', async () => {
      const t = setup({ withTemplates: true });
      t.activate('details');
      await t.settle();
      t.host.lazyError = true;
      await t.settle();
      expect(t.count('td.mat-column-details .lazy-error-btn')).toBe(3);
      expect(t.count('.tpl-details')).toBe(0);

      (t.root().querySelector('td.mat-column-details .lazy-error-btn') as HTMLButtonElement).click();
      await t.settle();
      t.host.lazyError = false;
      t.host.data = withValues('details', { 1: 'd1', 2: 'd2', 3: 'd3' });
      await t.settle();
      expect(t.count('.lazy-error-btn')).toBe(0);
      expect(t.cells('details')[0]).toBe('d1#1');
    });

    it('fournit aussi la valeur affichée aux colonnes non lazy', async () => {
      const t = setup({ withTemplates: true });
      await t.settle();

      expect(t.cells('name')).toEqual(['name-1', 'name-2', 'name-3']);
      expect(t.count('.tpl-name')).toBe(3);
    });
  });

  describe('export CSV et snapshot', () => {
    function captureExport() {
      let blob: Blob | undefined;
      spyOn(URL, 'createObjectURL').and.callFake((b: any) => { blob = b; return 'blob:test'; });
      spyOn(URL, 'revokeObjectURL');
      spyOn(HTMLAnchorElement.prototype, 'click');
      return async () => (await blob!.text()).replace('\uFEFF', '').split('\n');
    }

    it('n\'exporte aucune valeur de statut pendant l\'attente ni en erreur', async () => {
      const t = setup();
      t.activate('details');
      await t.settle();
      const read = captureExport();

      t.table().onExport();
      expect(await read()).toEqual(['Nom,Détails', 'name-1,', 'name-2,', 'name-3,']);

      t.host.lazyError = true;
      await t.settle();
      t.table().onExport();
      expect(await read()).toEqual(['Nom,Détails', 'name-1,', 'name-2,', 'name-3,']);
    });

    it('exporte les valeurs reçues', async () => {
      const t = setup();
      t.activate('details');
      await t.settle();
      t.host.data = withValues('details', { 1: 'd1', 3: 'd3' } as Record<number, string>);
      await t.settle();
      const read = captureExport();

      t.table().onExport();
      expect(await read()).toEqual(['Nom,Détails', 'name-1,d1', 'name-2,', 'name-3,d3']);
    });

    it('inclut les valeurs lazy reçues dans les données du snapshot', async () => {
      const t = setup();
      t.activate('details');
      await t.settle();
      t.host.data = withValues('details', { 1: 'd1', 2: 'd2', 3: 'd3' });
      await t.settle();

      const draft = t.table().createVisualSnapshot('copie');
      expect((draft.data as Row[]).map(row => row.details)).toEqual(['d1', 'd2', 'd3']);
    });
  });
});

function deactivateThenActivate(t: ReturnType<typeof setup>): void {
  t.deactivate('details');
  t.activate('details');
}
