import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject } from 'rxjs';
import { TableComponent } from './table.component';
import { JqtCellDefDirective } from '../directive/jqt-cell-def.directive';
import { TableColumnLoadRequest, TableColumnProvider, TableProvider } from '../jquery-table.model';

interface Row { id: number; name: string; team?: string; details?: string }

@Component({
  standalone: true,
  imports: [TableComponent],
  template: `<jquery-table [config]="config" [data]="data"></jquery-table>`,
})
class HostComponent {
  config!: TableProvider<Row>;
  data: Row[] = [];
}

@Component({
  standalone: true,
  imports: [TableComponent, JqtCellDefDirective],
  template: `
    <jquery-table [config]="config" [data]="data">
      <ng-template jqtCellDef="details" let-row let-value="value"><b class="tpl-details">{{ value }}#{{ row.id }}</b></ng-template>
      <ng-template jqtCellDef="name" let-value="value"><i class="tpl-name">{{ value }}</i></ng-template>
    </jquery-table>`,
})
class TemplateHostComponent extends HostComponent {}

const rows = (...ids: number[]): Row[] => ids.map(id => ({ id, name: `name-${id}` }));

interface SetupOptions {
  columns?: TableColumnProvider<Row>[];
  data?: Row[];
  withLoader?: boolean;
  withTemplates?: boolean;
  config?: Partial<TableProvider<Row>>;
}

function setup(options: SetupOptions = {}) {
  const requests: TableColumnLoadRequest<Row>[] = [];
  const pending: Subject<readonly any[]>[] = [];
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
    columnLoader: options.withLoader === false ? undefined : {
      rowKey: row => row.id,
      load: request => {
        requests.push(request);
        const response = new Subject<readonly any[]>();
        pending.push(response);
        return response;
      },
    },
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

  return { fixture, host, requests, pending, makeConfig, table, column, settle, cells, count, activate, deactivate, root };
}

describe('TableComponent — colonnes lazy chargées par clé', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent, TemplateHostComponent], providers: [provideNoopAnimations()] });
  });

  describe('activation depuis Organizer', () => {
    it('ne charge pas une colonne optionnelle tant qu\'elle n\'est pas affichée', async () => {
      const t = setup();
      await t.settle();

      expect(t.requests.length).toBe(0);
      expect(t.count('td.mat-column-details')).toBe(0);
    });

    it('envoie une requête avec la colonne et les clés des lignes, puis affiche les valeurs fusionnées par clé', async () => {
      const t = setup();
      await t.settle();

      t.activate('details');
      await t.settle();
      expect(t.requests.length).toBe(1);
      expect(t.requests[0].columnKeys).toEqual(['details']);
      expect(t.requests[0].keys).toEqual([1, 2, 3]);
      expect(t.count('td.mat-column-details .lazy-skeleton')).toBe(3);

      t.pending[0].next([{ id: 3, details: 'd3' }, { id: 1, details: 'd1' }, { id: 2, details: 'd2' }]);
      await t.settle();
      expect(t.cells('details')).toEqual(['d1', 'd2', 'd3']);
      expect(t.count('.lazy-skeleton')).toBe(0);
    });

    it('une ligne absente de la réponse reste vide', async () => {
      const t = setup();
      t.activate('details');
      await t.settle();

      t.pending[0].next([{ id: 1, details: 'd1' }]);
      await t.settle();
      expect(t.cells('details')).toEqual(['d1', 'N/A', 'N/A']);
    });

    it('ne requête qu\'une fois, même si la colonne est réactivée pendant le chargement', async () => {
      const t = setup();
      t.activate('details');
      await t.settle();
      t.activate('details');
      await t.settle();

      expect(t.requests.length).toBe(1);
    });

    it('regroupe en une requête les colonnes activées dans le même tick', async () => {
      const t = setup();
      await t.settle();

      t.activate('details');
      t.activate('team');
      await t.settle();
      expect(t.requests.length).toBe(1);
      expect(t.requests[0].columnKeys).toEqual(['details', 'team']);

      t.pending[0].next([{ id: 1, details: 'd1', team: 't1' }]);
      await t.settle();
      expect(t.cells('details')[0]).toBe('d1');
      expect(t.cells('team')[0]).toBe('t1');
    });

    it('des colonnes activées l\'une après l\'autre se chargent indépendamment, dans n\'importe quel ordre de réponse', async () => {
      const t = setup();
      t.activate('details');
      await t.settle();
      t.activate('team');
      await t.settle();
      expect(t.requests.length).toBe(2);

      t.pending[1].next([{ id: 1, team: 't1' }]);
      t.pending[0].next([{ id: 1, details: 'd1' }]);
      await t.settle();
      expect(t.cells('details')[0]).toBe('d1');
      expect(t.cells('team')[0]).toBe('t1');
    });
  });

  describe('colonnes visibles par défaut', () => {
    it('charge toutes les colonnes lazy visibles dans une seule requête', async () => {
      const t = setup({
        columns: [
          { key: 'name', header: 'Nom' },
          { key: 'details', header: 'Détails', lazy: true },
          { key: 'team', header: 'Équipe', lazy: true },
        ],
      });
      await t.settle();

      expect(t.requests.length).toBe(1);
      expect(t.requests[0].columnKeys).toEqual(['details', 'team']);
    });

    it('n\'envoie rien tant que le tableau est vide, puis charge à l\'arrivée des données', async () => {
      const t = setup({
        data: [],
        columns: [{ key: 'name', header: 'Nom' }, { key: 'details', header: 'Détails', lazy: true }],
      });
      await t.settle();
      expect(t.requests.length).toBe(0);

      t.host.data = rows(1, 2);
      await t.settle();
      expect(t.requests.length).toBe(1);
      expect(t.requests[0].keys).toEqual([1, 2]);
    });

    it('sans columnLoader, la colonne reste vide sans erreur', async () => {
      const t = setup({
        withLoader: false,
        columns: [{ key: 'name', header: 'Nom' }, { key: 'details', header: 'Détails', lazy: true }],
      });
      await t.settle();

      expect(t.cells('details')).toEqual(['N/A', 'N/A', 'N/A']);
      expect(t.count('.lazy-skeleton')).toBe(0);
    });
  });

  describe('erreur et nouvel essai', () => {
    it('affiche un bouton de nouvel essai par ligne puis recharge au clic', async () => {
      const t = setup();
      t.activate('details');
      await t.settle();
      t.pending[0].error(new Error('boom'));
      await t.settle();
      expect(t.count('td.mat-column-details .lazy-error-btn')).toBe(3);

      (t.root().querySelector('td.mat-column-details .lazy-error-btn') as HTMLButtonElement).click();
      await t.settle();
      expect(t.requests.length).toBe(2);
      expect(t.requests[1].columnKeys).toEqual(['details']);
      expect(t.count('.lazy-error-btn')).toBe(0);

      t.pending[1].next([{ id: 1, details: 'd1' }, { id: 2, details: 'd2' }, { id: 3, details: 'd3' }]);
      await t.settle();
      expect(t.cells('details')).toEqual(['d1', 'd2', 'd3']);
    });
  });

  describe('mise à jour des données', () => {
    async function loaded() {
      const t = setup();
      t.activate('details');
      await t.settle();
      t.pending[0].next([{ id: 1, details: 'd1' }, { id: 2, details: 'd2' }, { id: 3, details: 'd3' }]);
      await t.settle();
      return t;
    }

    it('garde les valeurs affichées sans skeleton pendant le rafraîchissement, puis applique les nouvelles', async () => {
      const t = await loaded();

      t.host.data = rows(1, 2, 3);
      await t.settle();
      expect(t.requests.length).toBe(2);
      expect(t.cells('details')).toEqual(['d1', 'd2', 'd3']);
      expect(t.count('.lazy-skeleton')).toBe(0);

      t.pending[1].next([{ id: 1, details: 'n1' }, { id: 2, details: 'n2' }, { id: 3, details: 'n3' }]);
      await t.settle();
      expect(t.cells('details')).toEqual(['n1', 'n2', 'n3']);
    });

    it('suit les lignes par clé quand leur ordre change', async () => {
      const t = await loaded();

      t.host.data = rows(3, 1, 2);
      await t.settle();
      expect(t.cells('details')).toEqual(['d3', 'd1', 'd2']);
    });

    it('conserve les valeurs si le rafraîchissement échoue', async () => {
      const t = await loaded();

      t.host.data = rows(1, 2, 3);
      await t.settle();
      t.pending[1].error(new Error('boom'));
      await t.settle();
      expect(t.cells('details')).toEqual(['d1', 'd2', 'd3']);
      expect(t.count('.lazy-error-btn')).toBe(0);
    });

    it('laisse vide une ligne apparue puis la complète avec la réponse', async () => {
      const t = await loaded();

      t.host.data = rows(1, 2, 3, 4);
      await t.settle();
      expect(t.requests[1].keys).toEqual([1, 2, 3, 4]);
      expect(t.cells('details')).toEqual(['d1', 'd2', 'd3', 'N/A']);

      t.pending[1].next([{ id: 1, details: 'd1' }, { id: 4, details: 'd4' }]);
      await t.settle();
      expect(t.cells('details')).toEqual(['d1', 'N/A', 'N/A', 'd4']);
    });

    it('ignore une réponse arrivée après un nouveau rafraîchissement plus récent', async () => {
      const t = await loaded();

      t.host.data = rows(1, 2, 3);
      await t.settle();
      t.host.data = rows(1, 2, 3);
      await t.settle();
      expect(t.requests.length).toBe(3);

      t.pending[1].next([{ id: 1, details: 'stale' }]);
      t.pending[2].next([{ id: 1, details: 'fresh' }]);
      await t.settle();
      expect(t.cells('details')[0]).toBe('fresh');
    });

    it('un changement de config repart de zéro et ignore les réponses de l\'ancienne config', async () => {
      const t = setup({
        columns: [{ key: 'name', header: 'Nom' }, { key: 'details', header: 'Détails', lazy: true }],
      });
      await t.settle();
      expect(t.requests.length).toBe(1);

      t.host.config = t.makeConfig();
      await t.settle();
      expect(t.requests.length).toBe(2);
      expect(t.count('td.mat-column-details .lazy-skeleton')).toBe(3);

      t.pending[0].next([{ id: 1, details: 'old' }]);
      t.pending[1].next([{ id: 1, details: 'new' }]);
      await t.settle();
      expect(t.cells('details')[0]).toBe('new');
    });

    it('rafraîchit une colonne masquée puis réaffichée, sans clignotement', async () => {
      const t = await loaded();

      t.deactivate('details');
      await t.settle();
      t.host.data = rows(1, 2, 3);
      await t.settle();
      expect(t.requests.length).toBe(1);

      t.activate('details');
      await t.settle();
      expect(t.requests.length).toBe(2);
      expect(t.cells('details')).toEqual(['d1', 'd2', 'd3']);
      expect(t.count('.lazy-skeleton')).toBe(0);

      t.pending[1].next([{ id: 1, details: 'n1' }, { id: 2, details: 'n2' }, { id: 3, details: 'n3' }]);
      await t.settle();
      expect(t.cells('details')).toEqual(['n1', 'n2', 'n3']);
    });
  });

  describe('fonctionnalités conservées sur une colonne chargée', () => {
    async function loaded() {
      const t = setup();
      t.activate('details');
      await t.settle();
      t.pending[0].next([{ id: 1, details: 'banana' }, { id: 2, details: 'apple' }, { id: 3, details: 'cherry' }]);
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
      t.pending[0].next([{ id: 1, team: 'A' }, { id: 2, team: 'B' }, { id: 3, team: 'A' }]);
      await t.settle();

      t.table().onGroupByChange('team');
      await t.settle();
      const labels = Array.from(t.root().querySelectorAll('.group-header-row .group-key-label')).map(e => e.textContent!.trim());
      expect(labels).toEqual(['A', 'B']);
    });

    it('regrouper par une colonne non chargée la charge et affiche un état de chargement', async () => {
      const t = setup();
      await t.settle();

      t.table().onGroupByChange('team');
      await t.settle();
      expect(t.requests.length).toBe(1);
      expect(t.requests[0].columnKeys).toEqual(['team']);
      expect(t.count('.group-header-loading')).toBe(1);

      t.pending[0].next([{ id: 1, team: 'A' }, { id: 2, team: 'A' }, { id: 3, team: 'B' }]);
      await t.settle();
      expect(t.count('.group-header-loading')).toBe(0);
      expect(t.count('.group-header-row')).toBe(2);
    });
  });

  describe('autres déclencheurs et cycle de vie', () => {
    it('ajouter la colonne comme Slice by la charge', async () => {
      const t = setup();
      await t.settle();

      t.table().addDynamicSlice(t.column('team'));
      await t.settle();
      expect(t.requests.length).toBe(1);
      expect(t.requests[0].columnKeys).toEqual(['team']);
    });

    it('n\'envoie aucune requête si le composant est détruit avant le regroupement', async () => {
      const t = setup();
      await t.settle();

      t.activate('details');
      t.fixture.destroy();
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(t.requests.length).toBe(0);
    });

    it('un changement de données sans colonne lazy affichée ne déclenche aucune requête', async () => {
      const t = setup();
      await t.settle();

      t.host.data = rows(1, 2, 3, 4);
      await t.settle();
      expect(t.requests.length).toBe(0);
    });

    it('une erreur de chargement ne casse pas le tri et la recherche sur les colonnes de base', async () => {
      const t = setup();
      t.activate('details');
      await t.settle();
      t.pending[0].error(new Error('boom'));
      await t.settle();

      t.table().searchQuery = 'name-2';
      t.table().onSearchChange();
      await t.settle();
      expect(t.cells('name')).toEqual(['name-2']);
    });
  });

  describe('templates de cellule (jqtCellDef) sur une colonne lazy', () => {
    it('affiche le skeleton pendant le chargement puis le template avec la valeur chargée', async () => {
      const t = setup({ withTemplates: true });
      t.activate('details');
      await t.settle();
      expect(t.count('td.mat-column-details .lazy-skeleton')).toBe(3);
      expect(t.count('.tpl-details')).toBe(0);

      t.pending[0].next([{ id: 1, details: 'd1' }, { id: 2, details: 'd2' }, { id: 3, details: 'd3' }]);
      await t.settle();
      expect(t.count('td.mat-column-details .lazy-skeleton')).toBe(0);
      expect(t.cells('details')).toEqual(['d1#1', 'd2#2', 'd3#3']);
    });

    it('affiche le bouton d\'erreur à la place du template, puis le template après un nouvel essai', async () => {
      const t = setup({ withTemplates: true });
      t.activate('details');
      await t.settle();
      t.pending[0].error(new Error('boom'));
      await t.settle();
      expect(t.count('td.mat-column-details .lazy-error-btn')).toBe(3);
      expect(t.count('.tpl-details')).toBe(0);

      (t.root().querySelector('td.mat-column-details .lazy-error-btn') as HTMLButtonElement).click();
      await t.settle();
      t.pending[1].next([{ id: 1, details: 'd1' }]);
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

  describe('colonne lazy utilisée sans être affichée', () => {
    const groupLabels = (t: ReturnType<typeof setup>) =>
      Array.from(t.root().querySelectorAll('.group-header-row .group-key-label')).map(e => e.textContent!.trim());

    it('charge la colonne du Group by par défaut puis regroupe', async () => {
      const t = setup({ config: { defaultGroupBy: 'team' } });
      await t.settle();
      expect(t.requests.length).toBe(1);
      expect(t.requests[0].columnKeys).toEqual(['team']);

      t.pending[0].next([{ id: 1, team: 'A' }, { id: 2, team: 'B' }, { id: 3, team: 'A' }]);
      await t.settle();
      expect(groupLabels(t)).toEqual(['A', 'B']);
    });

    it('affiche une erreur avec nouvel essai quand la colonne du Group by échoue', async () => {
      const t = setup({ config: { defaultGroupBy: 'team' } });
      await t.settle();
      t.pending[0].error(new Error('boom'));
      await t.settle();
      expect(t.count('.group-header-error .lazy-error-btn')).toBe(1);
      expect(t.count('.group-header-loading')).toBe(0);

      (t.root().querySelector('.group-header-error .lazy-error-btn') as HTMLButtonElement).click();
      await t.settle();
      expect(t.requests.length).toBe(2);
      expect(t.requests[1].columnKeys).toEqual(['team']);
      expect(t.count('.group-header-loading')).toBe(1);

      t.pending[1].next([{ id: 1, team: 'A' }, { id: 2, team: 'A' }, { id: 3, team: 'B' }]);
      await t.settle();
      expect(groupLabels(t)).toEqual(['A', 'B']);
    });

    it('rafraîchit en silence la colonne du Group by quand data change, groupes conservés pendant la requête', async () => {
      const t = setup({ config: { defaultGroupBy: 'team' } });
      await t.settle();
      t.pending[0].next([{ id: 1, team: 'A' }, { id: 2, team: 'B' }, { id: 3, team: 'A' }]);
      await t.settle();

      t.host.data = rows(1, 2, 3);
      await t.settle();
      expect(t.requests.length).toBe(2);
      expect(groupLabels(t)).toEqual(['A', 'B']);

      t.pending[1].next([{ id: 1, team: 'C' }, { id: 2, team: 'C' }, { id: 3, team: 'C' }]);
      await t.settle();
      expect(groupLabels(t)).toEqual(['C']);
    });

    it('charge une colonne lazy restaurée par un snapshot', async () => {
      const t = setup();
      await t.settle();

      t.table().applyVisualSnapshot({
        type: 'table', label: 'copie', config: {}, state: { columnOrder: ['name', 'details'] }, data: [], warnings: [],
      } as any);
      await t.settle();
      expect(t.requests.length).toBe(1);
      expect(t.requests[0].columnKeys).toEqual(['details']);
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

    it('n\'exporte aucune valeur de statut pendant le chargement ni en erreur', async () => {
      const t = setup();
      t.activate('details');
      await t.settle();
      const read = captureExport();

      t.table().onExport();
      expect(await read()).toEqual(['Nom,Détails', 'name-1,', 'name-2,', 'name-3,']);

      t.pending[0].error(new Error('boom'));
      await t.settle();
      t.table().onExport();
      expect(await read()).toEqual(['Nom,Détails', 'name-1,', 'name-2,', 'name-3,']);
    });

    it('exporte les valeurs chargées', async () => {
      const t = setup();
      t.activate('details');
      await t.settle();
      t.pending[0].next([{ id: 1, details: 'd1' }, { id: 3, details: 'd3' }]);
      await t.settle();
      const read = captureExport();

      t.table().onExport();
      expect(await read()).toEqual(['Nom,Détails', 'name-1,d1', 'name-2,', 'name-3,d3']);
    });

    it('transmet les valeurs lazy chargées à export.transform', async () => {
      const t = setup({
        config: { export: { enabled: true, transform: row => ({ name: row.name, details: row.details ?? 'absent' }) } },
      });
      t.activate('details');
      await t.settle();
      const read = captureExport();
      t.table().onExport();
      expect((await read())[1]).toBe('name-1,absent');

      t.pending[0].next([{ id: 1, details: 'd1' }]);
      await t.settle();
      t.table().onExport();
      expect((await read())[1]).toBe('name-1,d1');
    });

    it('inclut les valeurs lazy chargées dans les données du snapshot', async () => {
      const t = setup();
      t.activate('details');
      await t.settle();
      t.pending[0].next([{ id: 1, details: 'd1' }, { id: 2, details: 'd2' }, { id: 3, details: 'd3' }]);
      await t.settle();

      const draft = t.table().createVisualSnapshot('copie');
      expect((draft.data as Row[]).map(row => row.details)).toEqual(['d1', 'd2', 'd3']);
      expect(t.table()['_resolvedData'][0].details).toBeUndefined();
    });
  });

  describe('chargement positionnel existant', () => {
    it('continue de fonctionner et se recharge quand les données changent', async () => {
      const fetchFn = jasmine.createSpy('fetchFn').and.callFake(() => of(['x', 'y', 'z']));
      const t = setup({
        withLoader: false,
        columns: [{ key: 'name', header: 'Nom' }, { key: 'details', header: 'Détails', lazy: { fetchFn } }],
      });
      await t.settle();
      expect(t.cells('details')).toEqual(['x', 'y', 'z']);
      expect(fetchFn).toHaveBeenCalledTimes(1);

      t.host.data = rows(1, 2, 3);
      await t.settle();
      expect(fetchFn).toHaveBeenCalledTimes(2);
      expect(t.cells('details')).toEqual(['x', 'y', 'z']);
    });
  });
});
