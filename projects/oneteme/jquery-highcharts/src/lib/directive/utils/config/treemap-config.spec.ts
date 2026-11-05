import {
  configureTreemapChart,
  enforceCriticalTreemapOptions,
  isTreemapChart,
  transformDataForTreemap,
} from './treemap-config';

describe('treemap-config', () => {
  describe('isTreemapChart', () => {
    it('reconnaît le type treemap', () => {
      expect(isTreemapChart('treemap')).toBeTrue();
    });

    it('rejette les autres types de graphiques', () => {
      expect(isTreemapChart('heatmap')).toBeFalse();
      expect(isTreemapChart('pie')).toBeFalse();
    });
  });

  describe('transformDataForTreemap', () => {
    it('retourne une liste vide lorsque les séries sont vides', () => {
      expect(transformDataForTreemap([], true)).toEqual([]);
    });

    it('retourne null lorsque les séries sont nulles', () => {
      expect(transformDataForTreemap(null as any, true)).toBeNull();
    });

    it('transforme une série unique de nombres en éléments aplatis nommés par catégorie', () => {
      const result = transformDataForTreemap(
        [{ name: 'S', data: [10, 4] }],
        true,
        ['Jan', 'Fév']
      );

      expect(result.length).toBe(1);
      expect(result[0].type).toBe('treemap');
      expect(result[0].layoutAlgorithm).toBe('squarified');
      expect(result[0].data.map((p: any) => p.name)).toEqual(['Jan', 'Fév']);
      expect(result[0].data.map((p: any) => p.value)).toEqual([10, 4]);
    });

    it('nomme les éléments Item n lorsqu\'aucune catégorie n\'est fournie', () => {
      const result = transformDataForTreemap([{ name: 'S', data: [3] }], true);

      expect(result[0].data[0].name).toBe('Item 1');
      expect(result[0].data[0].value).toBe(3);
    });

    it('ignore les valeurs nulles et négatives en mode aplati', () => {
      const result = transformDataForTreemap(
        [{ name: 'S', data: [10, -5, 0, 4] }],
        true,
        ['A', 'B', 'C', 'D']
      );

      expect(result[0].data.map((p: any) => p.name)).toEqual(['A', 'D']);
      expect(result[0].data.map((p: any) => p.value)).toEqual([10, 4]);
    });

    it('lit la valeur, le nom et la couleur des points objets', () => {
      const result = transformDataForTreemap(
        [{ name: 'S', data: [{ name: 'A', y: 3, color: '#FF0000' }, { y: 2 }] }],
        true
      );

      expect(result[0].data[0].name).toBe('A');
      expect(result[0].data[0].value).toBe(3);
      expect(result[0].data[0].color).toBe('#FF0000');
      expect(result[0].data[1].name).toBe('Item 2');
      expect(result[0].data[1].value).toBe(2);
      expect(result[0].data[1].color).toBeUndefined();
    });

    it('ignore les points null en mode aplati', () => {
      const result = transformDataForTreemap([{ name: 'S', data: [null, 5] }], true);

      expect(result[0].data.length).toBe(1);
      expect(result[0].data[0].value).toBe(5);
    });

    it('agrège les valeurs absolues de chaque série pour plusieurs séries sans catégories', () => {
      const result = transformDataForTreemap(
        [
          { name: 'A', data: [1, -2] },
          { data: [3] },
        ],
        true
      );

      expect(result[0].data.length).toBe(2);
      expect(result[0].data[0]).toEqual(jasmine.objectContaining({ name: 'A', value: 3 }));
      expect(result[0].data[1]).toEqual(jasmine.objectContaining({ name: 'Catégorie 2', value: 3 }));
    });

    it('ignore les séries vides lors de l\'agrégation multi-séries', () => {
      const result = transformDataForTreemap(
        [
          { name: 'Vide', data: [] },
          { name: 'B', data: [4] },
        ],
        true
      );

      expect(result[0].data.length).toBe(1);
      expect(result[0].data[0].name).toBe('B');
      expect(result[0].data[0].value).toBe(4);
    });

    it('construit une hiérarchie de séries et de points lorsque des catégories sont fournies', () => {
      const result = transformDataForTreemap(
        [
          { name: 'Ventes', data: [10, 0, 5] },
          { name: 'Coûts', data: [2] },
        ],
        true,
        ['Jan', 'Fév', 'Mar']
      );
      const data = result[0].data;

      expect(data[0]).toEqual(jasmine.objectContaining({ id: 'serie-0', name: 'Ventes' }));
      expect(data[1]).toEqual(jasmine.objectContaining({ id: 'point-0', parent: 'serie-0', name: 'Jan', value: 10 }));
      expect(data[2]).toEqual(jasmine.objectContaining({ id: 'point-1', parent: 'serie-0', name: 'Mar', value: 5 }));
      expect(data[3]).toEqual(jasmine.objectContaining({ id: 'serie-1', name: 'Coûts' }));
      expect(data[4]).toEqual(jasmine.objectContaining({ id: 'point-2', parent: 'serie-1', name: 'Jan', value: 2 }));
      expect(data.length).toBe(5);
    });

    it('conserve un format treemap déjà présent', () => {
      const series = [{ name: 'T', data: [{ id: 'a', name: 'A', value: 2 }] }];

      expect(transformDataForTreemap(series, true)).toBe(series);
    });

    it('restaure les séries d\'origine après un aller-retour aplati', () => {
      const original = [{ name: 'S', data: [10, 4] }];
      const flat = transformDataForTreemap(original, true, ['Jan', 'Fév']);

      expect(transformDataForTreemap(flat, false)).toBe(original);
    });

    it('recrée les séries à partir des parents et des enfants sans symbole', () => {
      const result = transformDataForTreemap(
        [
          {
            data: [
              { id: 'serie-0', name: 'Ventes', color: '#0000FF' },
              { id: 'point-0', parent: 'serie-0', name: 'Jan', value: 10 },
              { id: 'point-1', parent: 'serie-0', name: 'Mar', value: 5 },
              { id: 'racine', name: 'Racine', value: 7 },
            ],
          },
        ],
        false
      );

      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Ventes');
      expect(result[0].color).toBe('#0000FF');
      expect(result[0].data).toEqual([10, 5]);
      expect(result[1].name).toBe('Racine');
      expect(result[1].data).toEqual([7]);
    });

    it('laisse inchangées les séries non treemap pour une cible non treemap', () => {
      const series = [{ name: 'A', data: [1, 2] }];

      expect(transformDataForTreemap(series, false)).toBe(series);
    });

    it('ne lève pas d\'erreur lorsqu\'un point null est présent en lecture inverse', () => {
      const series = [{ name: 'T', data: [null, { id: 'a', name: 'A', value: 2 }] }];

      expect(() => transformDataForTreemap(series, false)).not.toThrow();
    });
  });

  describe('configureTreemapChart', () => {
    it('ne modifie pas les options pour un type qui n\'est pas treemap', () => {
      const options: any = {};

      configureTreemapChart(options, 'column');

      expect(options).toEqual({});
    });

    it('configure la disposition squarified et les niveaux du treemap', () => {
      const options: any = {};

      configureTreemapChart(options, 'treemap');

      const treemap = options.plotOptions.treemap;
      expect(treemap.layoutAlgorithm).toBe('squarified');
      expect(treemap.allowTraversingTree).toBeTrue();
      expect(treemap.animationLimit).toBe(1000);
      expect(treemap.levelIsConstant).toBeFalse();
      expect(treemap.levels.length).toBe(1);
      expect(treemap.levels[0].level).toBe(1);
      expect(treemap.levels[0].borderWidth).toBe(3);
      expect(treemap.levels[0].borderColor).toBe('#ffffff');
      expect(treemap.levels[0].dataLabels.style.color).toBe('#ffffff');
    });

    it('conserve les options treemap existantes non configurées', () => {
      const options: any = { plotOptions: { treemap: { opacity: 0.5 } } };

      configureTreemapChart(options, 'treemap');

      expect(options.plotOptions.treemap.opacity).toBe(0.5);
      expect(options.plotOptions.treemap.layoutAlgorithm).toBe('squarified');
    });

    it('ajoute un tooltip dont le formateur affiche uniquement le nom de la racine', () => {
      const options: any = {};

      configureTreemapChart(options, 'treemap');

      expect(options.tooltip.pointFormatter.call({ parent: undefined, name: 'Racine' })).toBe('Racine');
    });

    it('formate le tooltip d\'un enfant avec le nom du parent et la valeur', () => {
      const options: any = {};

      configureTreemapChart(options, 'treemap');

      const point = {
        parent: 'serie-0',
        name: 'Jan',
        value: 10,
        series: { data: [{ id: 'serie-0', name: 'Ventes' }] },
      };

      expect(options.tooltip.pointFormatter.call(point)).toBe('Ventes - Jan<br/>Valeur: 10');
    });

    it('conserve un tooltip existant et lui ajoute le formateur', () => {
      const tooltip: any = { enabled: false };
      const options: any = { tooltip };

      configureTreemapChart(options, 'treemap');

      expect(options.tooltip).toBe(tooltip);
      expect(tooltip.enabled).toBeFalse();
      expect(typeof tooltip.pointFormatter).toBe('function');
    });
  });

  describe('enforceCriticalTreemapOptions', () => {
    it('ne modifie pas les options pour un type qui n\'est pas treemap', () => {
      const options: any = {};

      enforceCriticalTreemapOptions(options, 'heatmap');

      expect(options.plotOptions).toBeUndefined();
    });

    it('ajoute la disposition squarified lorsqu\'elle est absente', () => {
      const options: any = {};

      enforceCriticalTreemapOptions(options, 'treemap');

      expect(options.plotOptions.treemap.layoutAlgorithm).toBe('squarified');
    });

    it('conserve une disposition déjà définie', () => {
      const options: any = { plotOptions: { treemap: { layoutAlgorithm: 'strip' } } };

      enforceCriticalTreemapOptions(options, 'treemap');

      expect(options.plotOptions.treemap.layoutAlgorithm).toBe('strip');
    });
  });
});
