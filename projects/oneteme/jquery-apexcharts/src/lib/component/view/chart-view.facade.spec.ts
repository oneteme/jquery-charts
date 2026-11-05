import { ChartProvider, ChartOrganizerEvent } from '@oneteme/jquery-core';
import { ChartViewFacade } from './chart-view.facade';

function provider(...names: Array<string | undefined | ((o: any) => string)>): ChartProvider<any, any> {
  return {
    series: names.map(name => ({
      name: name as any,
      data: { x: (o: any) => o.x, y: (o: any) => o.y },
    })),
  } as ChartProvider<any, any>;
}

describe('ChartViewFacade', () => {
  let facade: ChartViewFacade;

  beforeEach(() => {
    facade = new ChartViewFacade();
  });

  afterEach(() => facade.destroy());

  describe('enabled', () => {
    it('est désactivé par défaut', () => {
      expect(facade.enabled).toBeFalse();
    });

    it('n’est activé que si la configuration vaut exactement true', () => {
      facade.update({ enabled: true }, provider('A'));
      expect(facade.enabled).toBeTrue();

      facade.update({ enabled: 'true' as any }, provider('A'));
      expect(facade.enabled).toBeFalse();
    });

    it('accepte une configuration nulle sans lever d’exception', () => {
      expect(() => facade.update(null, provider('A'))).not.toThrow();
      expect(facade.enabled).toBeFalse();
    });
  });

  describe('update', () => {
    it('déduit les champs visibles des séries nommées statiquement', () => {
      facade.update({ enabled: true }, provider('Ventes', 'Coûts'));

      expect(facade.viewFields.map(f => f.id)).toEqual(['Ventes', 'Coûts']);
      expect(facade.viewFields.map(f => f.label)).toEqual(['Ventes', 'Coûts']);
    });

    it('ignore les séries sans nom ou dont le nom est une fonction', () => {
      facade.update({ enabled: true }, provider('A', undefined, () => 'dyn', ''));

      expect(facade.viewFields.map(f => f.id)).toEqual(['A']);
    });

    it('sélectionne toutes les séries à l’initialisation', () => {
      facade.update({ enabled: true }, provider('A', 'B'));

      expect(facade.state.selectedFieldIds).toEqual(['A', 'B']);
      expect(facade.isSerieVisible('A')).toBeTrue();
    });

    it('gère un provider sans séries ni fournisseur', () => {
      facade.update({ enabled: true }, { series: [] } as any);
      expect(facade.viewFields).toEqual([]);
      expect(facade.state.selectedFieldIds).toEqual([]);

      facade.update({ enabled: true }, null);
      expect(facade.viewFields).toEqual([]);
    });

    it('conserve les sélections existantes lors d’une mise à jour incrémentale', () => {
      facade.update({ enabled: true }, provider('A', 'B', 'C'));
      facade.toggleSerie('B', false);

      facade.update({ enabled: true }, provider('A', 'B', 'C', 'D'));

      expect(facade.state.selectedFieldIds).toEqual(['A', 'C', 'D']);
    });

    it('retire de la sélection les séries supprimées du provider', () => {
      facade.update({ enabled: true }, provider('A', 'B', 'C'));

      facade.update({ enabled: true }, provider('A', 'C'));

      expect(facade.state.selectedFieldIds).toEqual(['A', 'C']);
    });

    it('réinitialise la sélection sans rien conserver lorsque le provider est vidé', () => {
      facade.update({ enabled: true }, provider('A', 'B'));

      facade.update({ enabled: true }, provider('X'));

      expect(facade.state.selectedFieldIds).toEqual(['X']);
    });

    it('préserve une sélection vide (toutes séries masquées) lors d’une mise à jour', () => {
      facade.update({ enabled: true }, provider('A', 'B'));
      facade.toggleSerie('A', false);
      facade.toggleSerie('B', false);

      facade.update({ enabled: true }, provider('A', 'B'));

      expect(facade.state.selectedFieldIds).toEqual([]);
      expect(facade.isSerieVisible('A')).toBeFalse();
    });
  });

  describe('toggleSerie', () => {
    it('ajoute une série masquée lorsqu’elle redevient visible', () => {
      facade.update({ enabled: true }, provider('A', 'B'));
      facade.toggleSerie('A', false);

      facade.toggleSerie('A', true);

      expect(facade.state.selectedFieldIds).toEqual(['B', 'A']);
    });

    it('n’ajoute pas deux fois une série déjà visible', () => {
      facade.update({ enabled: true }, provider('A'));

      facade.toggleSerie('A', true);

      expect(facade.state.selectedFieldIds).toEqual(['A']);
    });

    it('ne supprime rien lorsqu’on masque une série inconnue', () => {
      facade.update({ enabled: true }, provider('A'));

      facade.toggleSerie('Z', false);

      expect(facade.state.selectedFieldIds).toEqual(['A']);
    });

    it('émet un événement fieldsChanged à chaque bascule', () => {
      facade.update({ enabled: true }, provider('A', 'B'));
      const events: ChartOrganizerEvent[] = [];
      facade.events$.subscribe(e => events.push(e));

      facade.toggleSerie('A', false);
      facade.toggleSerie('A', false);

      expect(events).toEqual([
        { type: 'fieldsChanged', fieldIds: ['B'] },
        { type: 'fieldsChanged', fieldIds: ['B'] },
      ]);
    });

    it('émet une copie du tableau de sélection', () => {
      facade.update({ enabled: true }, provider('A', 'B'));
      let emitted: ChartOrganizerEvent;
      facade.events$.subscribe(e => emitted = e);

      facade.toggleSerie('A', false);
      (emitted as { fieldIds: string[] }).fieldIds.push('X');

      expect(facade.state.selectedFieldIds).toEqual(['B']);
    });
  });

  describe('setState', () => {
    beforeEach(() => {
      facade.update({ enabled: true }, provider('A', 'B'));
    });

    it('filtre les identifiants inconnus de la sélection', () => {
      facade.setState({ selectedFieldIds: ['B', 'Z'], groupByKey: null, dynamicSliceKeys: [] });

      expect(facade.state.selectedFieldIds).toEqual(['B']);
    });

    it('applique groupByKey par défaut à null lorsqu’il est absent', () => {
      facade.setState({ selectedFieldIds: [] } as any);

      expect(facade.state.groupByKey).toBeNull();
      expect(facade.state.dynamicSliceKeys).toEqual([]);
    });

    it('copie les clés de slices dynamiques sans partager la référence', () => {
      const keys = ['k1'];
      facade.setState({ selectedFieldIds: [], groupByKey: 'A', dynamicSliceKeys: keys });

      expect(facade.state.groupByKey).toBe('A');
      expect(facade.state.dynamicSliceKeys).toEqual(['k1']);
      expect(facade.state.dynamicSliceKeys).not.toBe(keys);
    });

    it('accepte un état sans selectedFieldIds', () => {
      facade.setState({} as any);

      expect(facade.state.selectedFieldIds).toEqual([]);
    });
  });

  describe('getEffectiveProvider', () => {
    it('retourne null lorsqu’aucun provider n’a été fourni', () => {
      expect(facade.getEffectiveProvider()).toBeNull();
    });

    it('retourne le provider d’origine à l’identique lorsque Organizer est désactivé', () => {
      const original = provider('A', 'B');
      facade.update({ enabled: false }, original);

      expect(facade.getEffectiveProvider()).toBe(original);
    });

    it('applique la visibilité des séries lorsque Organizer est activé', () => {
      facade.update({ enabled: true }, provider('A', 'B'));
      facade.toggleSerie('B', false);

      const effective = facade.getEffectiveProvider();

      expect(effective.series.map(s => s.visible)).toEqual([true, false]);
    });

    it('applique l’état même si Organizer est désactivé lorsque applyState est vrai', () => {
      facade.update({ enabled: false }, provider('A', 'B'));
      facade.toggleSerie('A', false);

      const effective = facade.getEffectiveProvider(true);

      expect(effective.series.map(s => s.visible)).toEqual([false, true]);
    });

    it('laisse intactes les séries dont le nom est dynamique', () => {
      facade.update({ enabled: true }, provider('A', () => 'dyn'));

      const effective = facade.getEffectiveProvider();

      expect(effective.series[1].visible).toBeUndefined();
      expect(effective.series[0].visible).toBeTrue();
    });

    it('ne modifie pas le provider d’origine', () => {
      const original = provider('A', 'B');
      facade.update({ enabled: true }, original);
      facade.toggleSerie('A', false);

      facade.getEffectiveProvider();

      expect(original.series[0].visible).toBeUndefined();
    });
  });

  describe('isSerieVisible', () => {
    it('reflète la sélection courante', () => {
      facade.update({ enabled: true }, provider('A', 'B'));
      facade.toggleSerie('A', false);

      expect(facade.isSerieVisible('A')).toBeFalse();
      expect(facade.isSerieVisible('B')).toBeTrue();
      expect(facade.isSerieVisible('Z')).toBeFalse();
    });
  });

  describe('destroy', () => {
    it('termine le flux d’événements', () => {
      const complete = jasmine.createSpy('complete');
      facade.events$.subscribe({ complete });

      facade.destroy();

      expect(complete).toHaveBeenCalled();
    });
  });
});
