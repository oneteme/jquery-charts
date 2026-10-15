import { of, Subject, throwError } from 'rxjs';
import { LazyBatchLoader, LazyBatchRequest, LazyFieldDef, LazyFieldManager } from './lazy-field-manager';

interface Row { id: number; name: string }

const fieldA: LazyFieldDef = { key: 'a', lazy: true };
const fieldB: LazyFieldDef = { key: 'b', lazy: true };

function makeRows(...ids: number[]): Row[] {
  return ids.map(id => ({ id, name: `row-${id}` }));
}

function setup(initialRows: Row[] = makeRows(1, 2, 3)) {
  const manager = new LazyFieldManager<LazyFieldDef>();
  const state = { rows: initialRows };
  const requests: LazyBatchRequest<Row>[] = [];
  const responses: Subject<readonly any[]>[] = [];
  const loader: LazyBatchLoader<Row> = {
    rowKey: row => row.id,
    load: request => {
      requests.push(request);
      const response = new Subject<readonly any[]>();
      responses.push(response);
      return response;
    },
  };
  const callbacks = { onRefresh: jasmine.createSpy('onRefresh'), onMarkForCheck: jasmine.createSpy('onMarkForCheck') };
  const fetch = (fields: LazyFieldDef[], silent = false) =>
    manager.fetchBatch(fields, loader, () => state.rows, callbacks, silent);
  const value = (column: string, row: Row) => manager.data.get(column)?.get(row);
  return { manager, state, requests, responses, loader, callbacks, fetch, value };
}

describe('LazyFieldManager — chargement par clé', () => {

  it('charge plusieurs colonnes en une seule requête avec les clés des lignes', () => {
    const { requests, fetch, manager, state } = setup();
    fetch([fieldA, fieldB]);

    expect(requests.length).toBe(1);
    expect(requests[0].columnKeys).toEqual(['a', 'b']);
    expect(requests[0].keys).toEqual([1, 2, 3]);
    expect(requests[0].rows).toEqual(state.rows);
    expect(manager.getStatus('a')).toBe('loading');
    expect(manager.getStatus('b')).toBe('loading');
  });

  it('fusionne par clé, quel que soit l\'ordre de la réponse', () => {
    const { manager, state, responses, fetch, value } = setup();
    fetch([fieldA, fieldB]);
    responses[0].next([
      { id: 3, a: 'a3', b: 'b3' },
      { id: 1, a: 'a1', b: 'b1' },
    ]);

    expect(manager.getStatus('a')).toBe('loaded');
    expect(manager.getStatus('b')).toBe('loaded');
    expect(value('a', state.rows[0])).toBe('a1');
    expect(value('b', state.rows[2])).toBe('b3');
    expect(manager.data.get('a')!.has(state.rows[1])).toBeFalse();
  });

  it('ignore les enregistrements dont la clé ne correspond à aucune ligne', () => {
    const { manager, responses, fetch } = setup();
    fetch([fieldA]);
    responses[0].next([{ id: 1, a: 'a1' }, { id: 99, a: 'orphan' }]);

    expect(manager.data.get('a')!.size).toBe(1);
  });

  it('compare les clés sans tenir compte de leur type (nombre / texte)', () => {
    const { state, responses, fetch, value } = setup();
    fetch([fieldA]);
    responses[0].next([{ id: '1', a: 'a1' }]);

    expect(value('a', state.rows[0])).toBe('a1');
  });

  it('conserve une valeur falsy (0, chaîne vide, null) fournie par le serveur', () => {
    const { manager, state, responses, fetch } = setup();
    fetch([fieldA]);
    responses[0].next([{ id: 1, a: 0 }, { id: 2, a: '' }, { id: 3, a: null }]);

    const values = manager.data.get('a')!;
    expect(values.get(state.rows[0])).toBe(0);
    expect(values.get(state.rows[1])).toBe('');
    expect(values.get(state.rows[2])).toBeNull();
  });

  it('ne relance pas une colonne en cours de chargement ou déjà chargée', () => {
    const { requests, responses, fetch } = setup();
    fetch([fieldA]);
    fetch([fieldA]);
    expect(requests.length).toBe(1);

    responses[0].next([]);
    fetch([fieldA]);
    expect(requests.length).toBe(1);

    fetch([fieldA, fieldB]);
    expect(requests.length).toBe(2);
    expect(requests[1].columnKeys).toEqual(['b']);
  });

  it('ne requête pas tant qu\'il n\'y a aucune ligne', () => {
    const { manager, requests, fetch } = setup([]);
    fetch([fieldA]);

    expect(requests.length).toBe(0);
    expect(manager.getStatus('a')).toBe('idle');
  });

  it('des requêtes concurrentes ne s\'écrasent pas entre colonnes', () => {
    const { manager, state, responses, fetch, value } = setup();
    fetch([fieldA]);
    fetch([fieldB]);
    responses[1].next([{ id: 1, b: 'b1' }]);
    responses[0].next([{ id: 1, a: 'a1' }]);

    expect(manager.getStatus('a')).toBe('loaded');
    expect(manager.getStatus('b')).toBe('loaded');
    expect(value('a', state.rows[0])).toBe('a1');
    expect(value('b', state.rows[0])).toBe('b1');
  });

  it('applique une réponse tardive aux lignes courantes, pas à celles de la requête', () => {
    const { manager, state, responses, fetch, value } = setup();
    fetch([fieldA]);
    const oldRows = state.rows;
    state.rows = makeRows(1, 2, 3);
    responses[0].next([{ id: 1, a: 'a1' }]);

    expect(value('a', state.rows[0])).toBe('a1');
    expect(manager.data.get('a')!.has(oldRows[0])).toBeFalse();
  });

  it('complète en silence les lignes apparues pendant la requête', () => {
    const { manager, state, requests, responses, fetch, value } = setup();
    fetch([fieldA]);
    state.rows = [...state.rows, { id: 4, name: 'row-4' }];
    responses[0].next([{ id: 1, a: 'a1' }]);

    expect(requests.length).toBe(2);
    expect(requests[1].keys).toEqual([1, 2, 3, 4]);
    expect(manager.getStatus('a')).toBe('loaded');

    responses[1].next([{ id: 1, a: 'a1' }, { id: 4, a: 'a4' }]);
    expect(value('a', state.rows[3])).toBe('a4');
    expect(requests.length).toBe(2);
  });

  it('ne boucle pas quand le serveur ne retourne pas toutes les lignes', () => {
    const { requests, responses, fetch } = setup();
    fetch([fieldA]);
    responses[0].next([]);

    expect(requests.length).toBe(1);
  });

  describe('erreurs et nouvel essai', () => {
    it('passe toutes les colonnes de la requête en erreur', () => {
      const { manager, responses, fetch } = setup();
      fetch([fieldA, fieldB]);
      responses[0].error(new Error('boom'));

      expect(manager.getStatus('a')).toBe('error');
      expect(manager.getStatus('b')).toBe('error');
      expect(manager.data.has('a')).toBeFalse();
    });

    it('traite une exception synchrone de load comme une erreur', () => {
      const { manager, callbacks } = setup();
      const failing: LazyBatchLoader<Row> = { rowKey: r => r.id, load: () => { throw new Error('sync'); } };
      manager.fetchBatch([fieldA], failing, () => makeRows(1), callbacks);

      expect(manager.getStatus('a')).toBe('error');
    });

    it('retryBatch ne relance que les colonnes demandées et efface les anciennes valeurs', () => {
      const { manager, state, requests, responses, fetch, loader, callbacks, value } = setup();
      fetch([fieldA, fieldB]);
      responses[0].error(new Error('boom'));

      manager.retryBatch([fieldA], loader, () => state.rows, callbacks);
      expect(requests.length).toBe(2);
      expect(requests[1].columnKeys).toEqual(['a']);
      expect(manager.getStatus('a')).toBe('loading');
      expect(manager.getStatus('b')).toBe('error');

      responses[1].next([{ id: 2, a: 'a2' }]);
      expect(manager.getStatus('a')).toBe('loaded');
      expect(value('a', state.rows[1])).toBe('a2');
    });

    it('retryBatch sur une colonne chargée repasse par loading sans garder l\'ancienne valeur', () => {
      const { manager, state, responses, fetch, loader, callbacks, value } = setup();
      fetch([fieldA]);
      responses[0].next([{ id: 1, a: 'old' }]);

      manager.retryBatch([fieldA], loader, () => state.rows, callbacks);
      expect(manager.getStatus('a')).toBe('loading');
      expect(value('a', state.rows[0])).toBeUndefined();
    });
  });

  describe('annulation', () => {
    it('cancelAll ignore les réponses encore en vol et vide l\'état', () => {
      const { manager, state, responses, fetch, value } = setup();
      fetch([fieldA]);
      manager.cancelAll();
      responses[0].next([{ id: 1, a: 'a1' }]);

      expect(manager.getStatus('a')).toBe('idle');
      expect(value('a', state.rows[0])).toBeUndefined();
    });

    it('cancelAll oublie aussi les valeurs conservées pour rebind', () => {
      const { manager, state, responses, fetch, value } = setup();
      fetch([fieldA]);
      responses[0].next([{ id: 1, a: 'a1' }]);
      manager.cancelAll();
      manager.rebind(state.rows);

      expect(value('a', state.rows[0])).toBeUndefined();
      expect(manager.getStatus('a')).toBe('idle');
    });
  });

  describe('rebind (remplacement des lignes)', () => {
    it('rattache les valeurs aux nouveaux objets ligne sans repasser par loading', () => {
      const { manager, state, requests, responses, fetch, value } = setup();
      fetch([fieldA]);
      responses[0].next([{ id: 1, a: 'a1' }, { id: 2, a: 'a2' }]);

      state.rows = makeRows(2, 1, 5);
      manager.rebind(state.rows);

      expect(manager.getStatus('a')).toBe('loaded');
      expect(value('a', state.rows[0])).toBe('a2');
      expect(value('a', state.rows[1])).toBe('a1');
      expect(manager.data.get('a')!.has(state.rows[2])).toBeFalse();
      expect(requests.length).toBe(1);
    });

    it('ne perd pas une colonne par clé encore en cours de chargement', () => {
      const { manager, state, responses, fetch, value } = setup();
      fetch([fieldA]);
      state.rows = makeRows(1, 2, 3);
      manager.rebind(state.rows);

      expect(manager.getStatus('a')).toBe('loading');
      responses[0].next([{ id: 1, a: 'a1' }]);
      expect(manager.getStatus('a')).toBe('loaded');
      expect(value('a', state.rows[0])).toBe('a1');
    });

    it('réinitialise les colonnes positionnelles (fetchFn), qui ne survivent pas à un changement de lignes', () => {
      const { manager, state, callbacks } = setup();
      const positional: LazyFieldDef = { key: 'p', lazy: { fetchFn: () => of(['x', 'y', 'z']) } };
      manager.fetch(positional, state.rows, callbacks);
      expect(manager.getStatus('p')).toBe('loaded');

      state.rows = makeRows(1, 2, 3);
      manager.rebind(state.rows);

      expect(manager.getStatus('p')).toBe('idle');
      expect(manager.data.has('p')).toBeFalse();
    });
  });

  describe('rafraîchissement silencieux', () => {
    it('garde le statut loaded et remplace les valeurs à la réponse', () => {
      const { manager, state, callbacks, responses, fetch, value } = setup();
      fetch([fieldA]);
      responses[0].next([{ id: 1, a: 'old' }]);
      callbacks.onRefresh.calls.reset();

      fetch([fieldA], true);
      expect(manager.getStatus('a')).toBe('loaded');
      expect(callbacks.onRefresh).not.toHaveBeenCalled();
      expect(value('a', state.rows[0])).toBe('old');

      responses[1].next([{ id: 1, a: 'new' }]);
      expect(value('a', state.rows[0])).toBe('new');
    });

    it('retire la valeur d\'une ligne absente de la nouvelle réponse', () => {
      const { manager, state, responses, fetch } = setup();
      fetch([fieldA]);
      responses[0].next([{ id: 1, a: 'a1' }, { id: 2, a: 'a2' }]);
      fetch([fieldA], true);
      responses[1].next([{ id: 1, a: 'a1' }]);

      expect(manager.data.get('a')!.has(state.rows[1])).toBeFalse();
    });

    it('conserve les valeurs affichées si le rafraîchissement échoue', () => {
      const { manager, state, responses, fetch, value } = setup();
      fetch([fieldA]);
      responses[0].next([{ id: 1, a: 'a1' }]);
      fetch([fieldA], true);
      responses[1].error(new Error('boom'));

      expect(manager.getStatus('a')).toBe('loaded');
      expect(value('a', state.rows[0])).toBe('a1');
    });

    it('un rafraîchissement remplace la requête silencieuse précédente', () => {
      const { state, responses, fetch, value } = setup();
      fetch([fieldA]);
      responses[0].next([{ id: 1, a: 'a1' }]);
      fetch([fieldA], true);
      fetch([fieldA], true);
      responses[1].next([{ id: 1, a: 'stale' }]);
      responses[2].next([{ id: 1, a: 'fresh' }]);

      expect(value('a', state.rows[0])).toBe('fresh');
    });
  });

  describe('chargement positionnel existant (fetchFn)', () => {
    it('associe les valeurs par position et gère l\'erreur puis le nouvel essai', () => {
      const { manager, state, callbacks } = setup();
      let fail = true;
      const positional: LazyFieldDef = {
        key: 'p',
        lazy: { fetchFn: () => (fail ? throwError(() => new Error('boom')) : of(['x', 'y', 'z'])) },
      };

      manager.fetch(positional, state.rows, callbacks);
      expect(manager.getStatus('p')).toBe('error');

      fail = false;
      manager.retry(positional, state.rows, callbacks);
      expect(manager.getStatus('p')).toBe('loaded');
      expect(manager.data.get('p')!.get(state.rows[1])).toBe('y');
    });

    it('fetch ignore une colonne lazy: true (traitée uniquement par fetchBatch)', () => {
      const { manager, state, callbacks } = setup();
      manager.fetch(fieldA, state.rows, callbacks);

      expect(manager.getStatus('a')).toBe('idle');
    });
  });
});
