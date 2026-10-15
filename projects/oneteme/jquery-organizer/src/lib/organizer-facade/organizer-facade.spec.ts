import { ChartOrganizerEvent } from '@oneteme/jquery-core';
import { humanizeKey, OrganizerFacade } from './organizer-facade';
import { OrganizerFieldDef, OrganizerPanelConfig } from './organizer-facade.types';

interface Field extends OrganizerFieldDef { tag?: string }

const fields = (): Field[] => [
  { key: 'name', header: 'Nom' },
  { key: 'team', header: 'Équipe', optional: true },
  { key: 'status', header: 'Statut' },
  { key: 'score', header: 'Score', optional: true },
];

function setup(overrides: Partial<OrganizerPanelConfig<Field>> = {}, columns: Field[] = fields()) {
  const facade = new OrganizerFacade<Field>();
  const events: ChartOrganizerEvent[] = [];
  facade.events$.subscribe(e => events.push(e));
  const panel: OrganizerPanelConfig<Field> = {
    config: { enabled: true },
    fields: columns,
    sliceConfigs: [],
    ...overrides,
  };
  facade.update(panel);
  return { facade, events, panel };
}

const keys = (list: Field[]) => list.map(f => f.key);

describe('OrganizerFacade', () => {

  describe('état par défaut', () => {
    it('active uniquement les champs non optionnels, dans l\'ordre de la config', () => {
      const { facade } = setup();
      expect(keys(facade.fields.activeFields)).toEqual(['name', 'status']);
      expect(facade.fields.userCustomized).toBeFalse();
    });

    it('sépare champs de base et champs optionnels, sans doublon de clé', () => {
      const { facade } = setup({}, [...fields(), { key: 'name', header: 'Doublon' }, { key: 'team', optional: true }]);
      expect(keys(facade.menuBaseFields)).toEqual(['name', 'status']);
      expect(keys(facade.menuOptionalFields)).toEqual(['team', 'score']);
      expect(facade.totalFieldCount).toBe(4);
    });

    it('expose les sections selon la config', () => {
      const disabled = setup({ config: { enabled: false } }).facade;
      expect(disabled.enabled).toBeFalse();
      expect(disabled.showFields).toBeFalse();
      expect(disabled.showGroupBySection).toBeFalse();

      const enabled = setup().facade;
      expect(enabled.showFields).toBeTrue();
      expect(enabled.showGroupBySection).toBeTrue();
      expect(enabled.allowFieldRemoval).toBeTrue();
      expect(enabled.isFieldDragDropEnabled).toBeFalse();
    });

    it('respecte enableFieldRemoval et enableFieldDragDrop', () => {
      const { facade } = setup({ config: { enabled: true, enableFieldRemoval: false, enableFieldDragDrop: true } });
      expect(facade.allowFieldRemoval).toBeFalse();
      expect(facade.isFieldDragDropEnabled).toBeTrue();
    });

    it('applique le Group by par défaut de la config', () => {
      const { facade } = setup({ defaultGroupBy: 'team' });
      expect(facade.groupBy.activeKey).toBe('team');
      expect(facade.groupBy.userCustomized).toBeFalse();
    });
  });

  describe('Group by', () => {
    it('propose les champs groupables : header requis sauf groupable explicite, groupable:false exclu, sans doublon', () => {
      const { facade } = setup({}, [
        { key: 'a', header: 'A' },
        { key: 'b' },
        { key: 'c', groupable: true },
        { key: 'd', header: 'D', groupable: false },
        { key: 'a', header: 'A bis' },
      ]);
      expect(keys(facade.groupByFields)).toEqual(['a', 'c']);
    });

    it('libellé actif : Aucun, header, clé brute, libellé personnalisé', () => {
      const { facade } = setup({}, [{ key: 'a', header: 'Alpha' }, { key: 'c', groupable: true }]);
      expect(facade.activeGroupByLabel).toBe('Aucun');

      facade.setGroupBy('a');
      expect(facade.activeGroupByLabel).toBe('Alpha');
      facade.setGroupBy('c');
      expect(facade.activeGroupByLabel).toBe('c');

      const custom = setup({ noneLabel: 'Rien' }).facade;
      expect(custom.activeGroupByLabel).toBe('Rien');
    });

    it('setGroupBy émet groupByChanged et protège le choix utilisateur des mises à jour de config', () => {
      const { facade, events, panel } = setup({ defaultGroupBy: 'team' });
      facade.setGroupBy('status');

      expect(events).toEqual([{ type: 'groupByChanged', key: 'status' }]);
      expect(facade.groupBy.userCustomized).toBeTrue();

      facade.update({ ...panel, defaultGroupBy: 'team' });
      expect(facade.groupBy.activeKey).toBe('status');

      facade.setGroupBy(null);
      expect(facade.groupBy.activeKey).toBeNull();
    });

    it('une mise à jour de config change le Group by par défaut tant que l\'utilisateur n\'a pas choisi', () => {
      const { facade, panel } = setup({ defaultGroupBy: 'team' });
      facade.update({ ...panel, defaultGroupBy: 'status' });
      expect(facade.groupBy.activeKey).toBe('status');
      facade.update({ ...panel, defaultGroupBy: undefined });
      expect(facade.groupBy.activeKey).toBeNull();
    });
  });

  describe('gestion des champs', () => {
    it('addField insère un champ selon l\'ordre de la config et émet fieldsChanged', () => {
      const { facade, events } = setup();
      const all = fields();

      facade.addField(all[3]); // score : après status
      expect(keys(facade.fields.activeFields)).toEqual(['name', 'status', 'score']);
      facade.addField(all[1]); // team : entre name et status
      expect(keys(facade.fields.activeFields)).toEqual(['name', 'team', 'status', 'score']);

      expect(facade.fields.userCustomized).toBeTrue();
      expect(events.at(-1)).toEqual({ type: 'fieldsChanged', fieldIds: ['name', 'team', 'status', 'score'] });
    });

    it('addField ajoute à la fin un champ inconnu de la config', () => {
      const { facade } = setup();
      facade.addField({ key: 'extra' });
      expect(keys(facade.fields.activeFields)).toEqual(['name', 'status', 'extra']);
    });

    it('removeField retire un champ optionnel et émet', () => {
      const { facade, events } = setup();
      facade.addField(fields()[1]);

      expect(facade.removeField('team')).toBeTrue();
      expect(keys(facade.fields.activeFields)).toEqual(['name', 'status']);
      expect(events.at(-1)).toEqual({ type: 'fieldsChanged', fieldIds: ['name', 'status'] });
    });

    it('removeField refuse un champ inconnu, le dernier champ et un champ de base si le retrait est désactivé', () => {
      const locked = setup({ config: { enabled: true, enableFieldRemoval: false } }).facade;
      expect(locked.removeField('missing')).toBeFalse();
      expect(locked.removeField('name')).toBeFalse();
      expect(keys(locked.fields.activeFields)).toEqual(['name', 'status']);

      const single = setup({}, [{ key: 'only', header: 'Seul' }]).facade;
      expect(single.removeField('only')).toBeFalse();
      expect(keys(single.fields.activeFields)).toEqual(['only']);
    });

    it('removeField autorise un champ optionnel même si le retrait des champs de base est désactivé', () => {
      const { facade } = setup({ config: { enabled: true, enableFieldRemoval: false } });
      facade.addField(fields()[1]);
      expect(facade.removeField('team')).toBeTrue();
    });

    it('toggleFieldVisibility n\'agit que sur un changement réel', () => {
      const { facade, events } = setup();
      const team = fields()[1];

      facade.toggleFieldVisibility(team, false);
      expect(events.length).toBe(0);

      facade.toggleFieldVisibility(team, true);
      expect(facade.isFieldVisible('team')).toBeTrue();
      facade.toggleFieldVisibility(team, true);
      expect(keys(facade.fields.activeFields).filter(k => k === 'team').length).toBe(1);

      facade.toggleFieldVisibility(team, false);
      expect(facade.isFieldVisible('team')).toBeFalse();
    });

    it('reorderFields déplace un champ et refuse les clés invalides ou identiques', () => {
      const { facade, events } = setup();
      expect(facade.reorderFields('name', 'status')).toBeTrue();
      expect(keys(facade.fields.activeFields)).toEqual(['status', 'name']);
      expect(events.at(-1)).toEqual({ type: 'fieldsChanged', fieldIds: ['status', 'name'] });

      const before = events.length;
      expect(facade.reorderFields('name', 'name')).toBeFalse();
      expect(facade.reorderFields('name', 'missing')).toBeFalse();
      expect(facade.reorderFields('missing', 'name')).toBeFalse();
      expect(events.length).toBe(before);
    });

    it('setActiveFields remplace la sélection et marque la personnalisation', () => {
      const { facade } = setup();
      facade.setActiveFields([fields()[3]]);
      expect(keys(facade.fields.activeFields)).toEqual(['score']);
      expect(facade.fields.userCustomized).toBeTrue();
    });
  });

  describe('mise à jour de la config après personnalisation', () => {
    it('conserve la sélection de l\'utilisateur et retire les champs disparus de la config', () => {
      const { facade, panel } = setup();
      facade.addField(fields()[1]);

      facade.update({ ...panel, fields: panel.fields.filter(f => f.key !== 'status') });
      expect(keys(facade.fields.activeFields)).toEqual(['name', 'team']);
    });

    it('revient aux champs par défaut si la personnalisation a vidé la sélection', () => {
      const { facade, panel } = setup();
      facade.setActiveFields([]);
      facade.update(panel);
      expect(keys(facade.fields.activeFields)).toEqual(['name', 'status']);
    });

    it('utilise la nouvelle définition d\'un champ conservé quand la config est reconstruite', () => {
      const { facade, panel } = setup();
      facade.addField(fields()[1]);

      const rebuilt = panel.fields.map(f => ({ ...f, header: `${f.header} v2` }));
      facade.update({ ...panel, fields: rebuilt });

      expect(facade.fields.activeFields.map(f => f.header)).toEqual(['Nom v2', 'Équipe v2', 'Statut v2']);
    });

    it('resetToDefaults restaure champs, Group by et slices dynamiques', () => {
      const { facade } = setup({ defaultGroupBy: 'team' });
      facade.addField(fields()[3]);
      facade.setGroupBy('status');
      facade.onDynamicSliceKeysChange(['status']);

      facade.resetToDefaults();
      expect(keys(facade.fields.activeFields)).toEqual(['name', 'status']);
      expect(facade.fields.userCustomized).toBeFalse();
      expect(facade.groupBy.activeKey).toBe('team');
      expect(facade.groupBy.userCustomized).toBeFalse();
      expect(facade.sliceBy.activeDynamicFields).toEqual([]);
    });
  });

  describe('Slice by', () => {
    const slicePanel = (): Partial<OrganizerPanelConfig<Field>> => ({
      sliceConfigs: [{ title: 'Statut', columnKey: 'status' }, { title: 'Catégories', categories: [] }],
    });

    it('exclut les colonnes déjà utilisées en slice statique et celles sans header de la liste dynamique', () => {
      const { facade } = setup(slicePanel(), [
        { key: 'name', header: 'Nom' },
        { key: 'status', header: 'Statut' },
        { key: 'hidden' },
        { key: 'forced', sliceable: true },
        { key: 'never', header: 'Jamais', sliceable: false },
      ]);

      expect(keys(facade.sliceBy.allDynamicFields)).toEqual(['name', 'forced']);
      expect(keys(facade.sliceBy.availableForDynamic)).toEqual(['name', 'forced']);
    });

    it('onDynamicSliceKeysChange résout les champs actifs, met à jour les disponibles et émet', () => {
      const { facade, events } = setup(slicePanel());
      facade.onDynamicSliceKeysChange(['name', 'unknown']);

      expect(keys(facade.sliceBy.activeDynamicFields)).toEqual(['name']);
      expect(keys(facade.sliceBy.availableForDynamic)).not.toContain('name');
      expect(keys(facade.sliceBy.availableForDynamic)).not.toContain('status');
      expect(facade.isDynamicSliceActive('name')).toBeTrue();
      expect(events.at(-1)).toEqual({ type: 'dynamicSlicesChanged', keys: ['name', 'unknown'] });
    });

    it('garde la même règle d\'éligibilité (header requis) avant et après un changement de slices dynamiques', () => {
      const { facade } = setup(slicePanel(), [
        { key: 'name', header: 'Nom' },
        { key: 'status', header: 'Statut' },
        { key: 'hidden' },
      ]);
      const before = keys(facade.sliceBy.availableForDynamic);
      facade.onDynamicSliceKeysChange([]);
      expect(keys(facade.sliceBy.availableForDynamic)).toEqual(before);
    });

    it('showSliceBySection : slices statiques ou colonnes dynamiques possibles, section activée', () => {
      expect(setup(slicePanel()).facade.showSliceBySection).toBeTrue();
      expect(setup({ sliceConfigs: [] }, [{ key: 'x' }]).facade.showSliceBySection).toBeFalse();
      expect(setup({ sliceConfigs: [], config: { enabled: false } }).facade.showSliceBySection).toBeFalse();
    });

    it('staticSlicesForMenu : titre, titre dérivé de la clé et icône de la colonne', () => {
      const { facade } = setup(
        { sliceConfigs: [{ title: 'Statut', columnKey: 'status' }, { columnKey: 'createdAt' }, { title: 'Sans clé' }] },
        [{ key: 'status', header: 'S', icon: 'flag' }, { key: 'createdAt', header: 'C' }],
      );
      expect(facade.staticSlicesForMenu).toEqual([
        { key: 'status', title: 'Statut', icon: 'flag' },
        { key: 'createdAt', title: 'Created At', icon: undefined },
      ]);
    });

    it('libellé : Aucun, titre statique, header dynamique, nombre total, statiques masquées ignorées', () => {
      const { facade } = setup({ sliceConfigs: [{ title: 'Statut', columnKey: 'status' }] });
      expect(facade.sliceBy.activeLabel).toBe('Statut');

      facade.updateHiddenStaticKeys(new Set(['status']));
      expect(facade.sliceBy.activeLabel).toBe('Aucun');

      facade.onDynamicSliceKeysChange(['name']);
      expect(facade.sliceBy.activeLabel).toBe('Nom');

      facade.updateHiddenStaticKeys(new Set());
      expect(facade.sliceBy.activeLabel).toBe('2 actifs');
    });
  });

  describe('divers', () => {
    it('toOrganizerState reflète champs, Group by et slices dynamiques', () => {
      const { facade } = setup(slicePanelLike());
      facade.setGroupBy('team');
      facade.onDynamicSliceKeysChange(['name']);
      expect(facade.toOrganizerState()).toEqual({
        selectedFieldIds: ['name', 'status'],
        groupByKey: 'team',
        dynamicSliceKeys: ['name'],
      });
    });

    it('fieldLabel utilise le header puis une clé lisible', () => {
      const { facade } = setup();
      expect(facade.fieldLabel({ key: 'a', header: 'Alpha' })).toBe('Alpha');
      expect(facade.fieldLabel({ key: 'createdAt' })).toBe('Created At');
    });

    it('destroy termine le flux d\'événements', () => {
      const { facade } = setup();
      let completed = false;
      facade.events$.subscribe({ complete: () => completed = true });
      facade.destroy();
      expect(completed).toBeTrue();
    });

    it('humanizeKey gère camelCase, snake_case et kebab-case', () => {
      expect(humanizeKey('createdAt')).toBe('Created At');
      expect(humanizeKey('my_field')).toBe('My field');
      expect(humanizeKey('a-b_cD')).toBe('A b c D');
    });
  });
});

function slicePanelLike(): Partial<OrganizerPanelConfig<Field>> {
  return { sliceConfigs: [] };
}
