import { ChartViewFacade } from './chart-view.facade';

const provider = (...names: string[]): any => ({
  series: names.map((name) => ({ name, data: { xField: 'c', yField: 'v' } })),
});

describe('ChartViewFacade', () => {
  let facade: ChartViewFacade<any, any>;

  beforeEach(() => {
    facade = new ChartViewFacade<any, any>();
  });

  afterEach(() => {
    facade.destroy();
  });

  it('rend toutes les séries visibles à la première mise à jour', () => {
    facade.update({ enabled: true }, provider('S1', 'S2'));

    expect(facade.viewFields.map((f) => f.id)).toEqual(['S1', 'S2']);
    expect(facade.state.selectedFieldIds).toEqual(['S1', 'S2']);
  });

  it('ignore les séries dont le nom n\'est pas une chaîne', () => {
    const p: any = { series: [{ name: 'S1', data: {} }, { name: () => 'dyn', data: {} }] };
    facade.update({ enabled: true }, p);

    expect(facade.viewFields.map((f) => f.id)).toEqual(['S1']);
  });

  it('toggleSerie retire puis réajoute une série et émet fieldsChanged', () => {
    facade.update({ enabled: true }, provider('S1', 'S2'));
    const fieldIds: string[][] = [];
    facade.events$.subscribe((e) => {
      if (e.type === 'fieldsChanged') fieldIds.push(e.fieldIds);
    });

    facade.toggleSerie('S1', false);
    expect(facade.isSerieVisible('S1')).toBeFalse();
    facade.toggleSerie('S1', true);
    expect(facade.isSerieVisible('S1')).toBeTrue();

    expect(fieldIds).toEqual([['S2'], ['S2', 'S1']]);
  });

  it('setState ne conserve que les identifiants connus', () => {
    facade.update({ enabled: true }, provider('S1', 'S2'));
    facade.setState({ selectedFieldIds: ['S2', 'inconnue'], groupByKey: null, dynamicSliceKeys: [] });

    expect(facade.state.selectedFieldIds).toEqual(['S2']);
  });

  it('getEffectiveProvider applique visible selon la sélection quand Organizer est activé', () => {
    facade.update({ enabled: true }, provider('S1', 'S2'));
    facade.toggleSerie('S2', false);

    const effective = facade.getEffectiveProvider();
    expect(effective.series.map((s) => s.visible)).toEqual([true, false]);
  });

  it('getEffectiveProvider retourne le provider inchangé quand Organizer est désactivé', () => {
    const p = provider('S1', 'S2');
    facade.update({}, p);

    expect(facade.getEffectiveProvider()).toBe(p);
  });

  it('ajoute une série au premier rang de la sélection sans toucher aux autres', () => {
    facade.update({ enabled: true }, provider('S1'));
    facade.update({ enabled: true }, provider('S1', 'S2'));

    expect(facade.state.selectedFieldIds).toEqual(['S1', 'S2']);
  });

  it('conserve une série désélectionnée lors d\'une mise à jour de la config', () => {
    facade.update({ enabled: true }, provider('S1', 'S2'));
    facade.toggleSerie('S1', false);
    facade.update({ enabled: true }, provider('S1', 'S2'));

    expect(facade.isSerieVisible('S1')).toBeFalse();
  });

  it('une nouvelle série n\'a pas à réafficher une série désélectionnée', () => {
    facade.update({ enabled: true }, provider('S1', 'S2'));
    facade.toggleSerie('S1', false);
    facade.update({ enabled: true }, provider('S1', 'S2', 'S3'));

    expect(facade.state.selectedFieldIds).toEqual(['S2', 'S3']);
  });

  it('tout désélectionner ne doit pas tout réafficher à la mise à jour suivante', () => {
    facade.update({ enabled: true }, provider('S1', 'S2'));
    facade.toggleSerie('S1', false);
    facade.toggleSerie('S2', false);
    facade.update({ enabled: true }, provider('S1', 'S2'));

    expect(facade.state.selectedFieldIds).toEqual([]);
  });

  it('une série qui disparaît puis revient est de nouveau visible (elle est nouvelle pour la facade)', () => {
    facade.update({ enabled: true }, provider('S1', 'S2'));
    facade.toggleSerie('S2', false);
    facade.update({ enabled: true }, provider('S1'));
    facade.update({ enabled: true }, provider('S1', 'S2'));

    expect(facade.state.selectedFieldIds).toEqual(['S1', 'S2']);
  });

  it('getEffectiveProvider retourne null tant qu\'aucun provider n\'a été fourni', () => {
    expect(facade.getEffectiveProvider()).toBeNull();
    expect(facade.getEffectiveProvider(true)).toBeNull();
  });

  it('update n\'émet pas fieldsChanged quand la sélection reste identique', () => {
    facade.update({ enabled: true }, provider('S1', 'S2'));
    const emitted: string[][] = [];
    facade.events$.subscribe((e) => {
      if (e.type === 'fieldsChanged') emitted.push(e.fieldIds);
    });

    facade.update({ enabled: true }, provider('S1', 'S2'));

    expect(emitted).toEqual([]);
  });

  it('update émet fieldsChanged quand une série est ajoutée à la sélection', () => {
    facade.update({ enabled: true }, provider('S1'));
    const emitted: string[][] = [];
    facade.events$.subscribe((e) => {
      if (e.type === 'fieldsChanged') emitted.push(e.fieldIds);
    });

    facade.update({ enabled: true }, provider('S1', 'S2'));

    expect(emitted).toEqual([['S1', 'S2']]);
  });

  it('update n\'émet pas quand une série désélectionnée disparaît, mais émet à l\'ajout suivant', () => {
    facade.update({ enabled: true }, provider('S1', 'S2'));
    facade.toggleSerie('S1', false);
    const emitted: string[][] = [];
    facade.events$.subscribe((e) => {
      if (e.type === 'fieldsChanged') emitted.push(e.fieldIds);
    });

    facade.update({ enabled: true }, provider('S2'));

    expect(emitted).toEqual([]);
    facade.update({ enabled: true }, provider('S2', 'S3'));
    expect(emitted).toEqual([['S2', 'S3']]);
  });
});
