import { normalizeCellValue, humanizeKey, getFrenchPaginatorIntl } from './component/table.utils';
import { ExportManager } from './component/export.manager';
import { TablePreferencesManager } from './component/table-preferences.manager';
import { tableProviderFromSnapshot } from './snapshot-table-config';
import { TableColumnProvider, TableExportConfig } from './jquery-table.model';

describe('table.utils', () => {
  describe('normalizeCellValue', () => {
    it('convertit null et undefined en chaîne vide', () => {
      expect(normalizeCellValue(null)).toBe('');
      expect(normalizeCellValue(undefined)).toBe('');
    });

    it('conserve nombres, booléens et chaînes tels quels (le tri numérique en dépend)', () => {
      expect(normalizeCellValue(42)).toBe(42);
      expect(normalizeCellValue(0)).toBe(0);
      expect(normalizeCellValue(false)).toBe(false);
      expect(normalizeCellValue('x')).toBe('x');
    });

    it('formate une date', () => {
      const date = new Date(2026, 0, 2, 3, 4, 5);
      expect(normalizeCellValue(date)).toBe(date.toLocaleString());
    });

    it('joint les tableaux, y compris imbriqués', () => {
      expect(normalizeCellValue(['a', 'b'])).toBe('a, b');
      expect(normalizeCellValue([['a', 'b'], null, 3])).toBe('a, b, , 3');
    });

    it('utilise label puis name d\'un objet, sinon JSON', () => {
      expect(normalizeCellValue({ label: 'L', name: 'N' })).toBe('L');
      expect(normalizeCellValue({ name: 'N' })).toBe('N');
      expect(normalizeCellValue({ a: 1 })).toBe('{"a":1}');
    });
  });

  describe('humanizeKey', () => {
    it('gère camelCase, snake_case et kebab-case', () => {
      expect(humanizeKey('createdAt')).toBe('Created At');
      expect(humanizeKey('my_field')).toBe('My field');
      expect(humanizeKey('my-field')).toBe('My field');
      expect(humanizeKey('a1B')).toBe('A1 B');
    });
  });

  describe('getFrenchPaginatorIntl', () => {
    const intl = getFrenchPaginatorIntl();

    it('traduit les libellés', () => {
      expect(intl.itemsPerPageLabel).toBe('Éléments par page :');
      expect(intl.nextPageLabel).toBe('Page suivante');
    });

    it('formate la plage affichée', () => {
      expect(intl.getRangeLabel(0, 10, 25)).toBe('1 – 10 sur 25');
      expect(intl.getRangeLabel(2, 10, 25)).toBe('21 – 25 sur 25');
      expect(intl.getRangeLabel(0, 10, 0)).toBe('0 sur 0');
      expect(intl.getRangeLabel(0, 0, 5)).toBe('0 sur 5');
    });
  });
});

describe('ExportManager', () => {
  interface Row { id: number; name: string }
  const columns: TableColumnProvider<Row>[] = [{ key: 'id', header: 'Identifiant' }, { key: 'name' }];
  let blob: Blob | undefined;
  let download: string | undefined;
  let hasBom = false;

  beforeEach(() => {
    blob = undefined;
    hasBom = false;
    download = undefined;
    spyOn(URL, 'createObjectURL').and.callFake((b: any) => { blob = b; return 'blob:test'; });
    spyOn(URL, 'revokeObjectURL');
    spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function (this: HTMLAnchorElement) { download = this.download; });
  });

  const run = async (rows: Row[], config: TableExportConfig<Row> | undefined) => {
    const manager = new ExportManager<Row>(() => rows, () => columns, () => config, (col, row) => (row as any)[col.key]);
    manager.export();
    if (!blob) return undefined;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    hasBom = bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF;
    return new TextDecoder().decode(bytes);
  };

  it('n\'exporte rien si l\'export est désactivé ou absent', async () => {
    expect(await run([], { enabled: false })).toBeUndefined();
    expect(await run([], undefined)).toBeUndefined();
  });

  it('écrit un BOM UTF-8, l\'en-tête (header sinon clé) et une ligne par enregistrement', async () => {
    const text = await run([{ id: 1, name: 'a' }, { id: 2, name: 'b' }], { enabled: true });
    expect(hasBom).toBeTrue();
    expect(text!.split('\n')).toEqual(['Identifiant,name', '1,a', '2,b']);
  });

  it('échappe virgules, guillemets et retours à la ligne', async () => {
    const text = await run([{ id: 1, name: 'a,b' }, { id: 2, name: 'dit "oui"' }, { id: 3, name: 'l1\nl2' }], { enabled: true });
    expect(text).toBe('Identifiant,name\n1,"a,b"\n2,"dit ""oui"""\n3,"l1\nl2"');
  });

  it('nomme le fichier avec l\'extension .csv', async () => {
    await run([], { enabled: true, filename: 'rapport' });
    expect(download).toBe('rapport.csv');
    await run([], { enabled: true });
    expect(download).toBe('export.csv');
  });

  it('ne double pas l\'extension d\'un nom de fichier déjà terminé par .csv', async () => {
    await run([], { enabled: true, filename: 'autre.csv' });
    expect(download).toBe('autre.csv');
  });

  it('applique transform et remplace les valeurs manquantes par une chaîne vide', async () => {
    const text = await run([{ id: 1, name: 'a' }], { enabled: true, transform: row => ({ id: `#${row.id}` }) });
    expect(text!.split('\n')).toEqual(['Identifiant,name', '#1,']);
  });

  it('libère l\'URL temporaire', async () => {
    await run([], { enabled: true });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
  });
});

describe('TablePreferencesManager', () => {
  const id = 'spec-prefs';
  let manager: TablePreferencesManager;

  beforeEach(() => { manager = new TablePreferencesManager(id); localStorage.removeItem(manager.key); });
  afterEach(() => localStorage.removeItem(manager.key));

  it('préfixe la clé de stockage', () => {
    expect(manager.key).toBe('jqt_prefs_spec-prefs');
  });

  it('sauvegarde, relit, détecte et efface une configuration', () => {
    expect(manager.hasSaved()).toBeFalse();
    expect(manager.load()).toBeNull();

    manager.save({ search: 'abc', groupBy: 'team', visibleColumns: ['a', 'b'] });
    expect(manager.hasSaved()).toBeTrue();
    expect(manager.load()).toEqual({ search: 'abc', groupBy: 'team', visibleColumns: ['a', 'b'] });

    manager.clear();
    expect(manager.hasSaved()).toBeFalse();
    expect(manager.load()).toBeNull();
  });

  it('retourne null pour un contenu corrompu', () => {
    localStorage.setItem(manager.key, '{pas du json');
    expect(manager.load()).toBeNull();
  });

  it('save et load ignorent un stockage indisponible', () => {
    spyOn(Storage.prototype, 'setItem').and.throwError('quota');
    spyOn(Storage.prototype, 'getItem').and.throwError('denied');
    expect(() => manager.save({ search: 'x' })).not.toThrow();
    expect(manager.load()).toBeNull();
  });

  it('hasSaved et clear ignorent aussi un stockage indisponible', () => {
    const getItem = spyOn(Storage.prototype, 'getItem').and.throwError('denied');
    const removeItem = spyOn(Storage.prototype, 'removeItem').and.throwError('denied');
    expect(manager.hasSaved()).toBeFalse();
    expect(() => manager.clear()).not.toThrow();
    getItem.and.callThrough();
    removeItem.and.callThrough();
  });
});

describe('tableProviderFromSnapshot', () => {
  const snapshot = (overrides: Record<string, unknown> = {}) => ({
    type: 'table',
    label: 'copie',
    config: {
      title: 'Titre',
      columns: [{ key: 'a', header: 'A' }, { key: 'b', sortable: false }, { key: 'c', header: 'C', optional: true }],
      search: { enabled: true },
      pagination: { enabled: true, pageSize: 10 },
    },
    state: { search: 'x', groupBy: 'a', columnOrder: ['c', 'a'], pageSize: 25 },
    data: [],
    ...overrides,
  }) as any;

  it('retourne une config vide pour un snapshot qui n\'est pas un tableau', () => {
    expect(tableProviderFromSnapshot({ type: 'chart' } as any)).toEqual({ columns: [] });
  });

  it('reconstruit une vue autonome et non éditable', () => {
    const provider = tableProviderFromSnapshot(snapshot());
    expect(provider.title).toBe('Titre');
    expect(provider.columns!.map(c => c.key)).toEqual(['c', 'a']);
    expect(provider.search).toEqual({ enabled: true, initialQuery: 'x' });
    expect(provider.pagination!.pageSize).toBe(25);
    expect(provider.defaultGroupBy).toBe('a');
    expect(provider.view).toEqual({ enabled: false, enableColumnRemoval: false, enableColumnDragDrop: false });
    expect(provider.export).toEqual({ enabled: false });
    expect(provider.preferences).toEqual({ enabled: false });
    expect(provider.showActions).toBeFalse();
  });

  it('utilise l\'ordre de config sans ordre d\'état, le libellé par défaut et le tri par défaut', () => {
    const provider = tableProviderFromSnapshot(snapshot({ state: {} }));
    expect(provider.columns!.map(c => c.key)).toEqual(['a', 'b', 'c']);
    expect(provider.columns![1].header).toBe('b');
    expect(provider.columns![1].sortable).toBeFalse();
    expect(provider.columns![0].sortable).toBeTrue();
    expect(provider.defaultGroupBy).toBeNull();
  });

  it('la recherche d\'une colonne s\'appuie sur la valeur sérialisée', () => {
    const column = tableProviderFromSnapshot(snapshot()).columns![1];
    expect(column.searchValue!({ a: 5 }, 0)).toBe('5');
    expect(column.searchValue!({}, 0)).toBe('');
  });
});
