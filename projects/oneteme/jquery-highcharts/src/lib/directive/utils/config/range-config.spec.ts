import {
  configureRangeChart,
  enforceCriticalRangeOptions,
  isRangeChart,
  transformDataForRangeChart,
} from './range-config';

describe('range-config', () => {
  describe('isRangeChart', () => {
    it('reconnaît les types columnrange, arearange et areasplinerange', () => {
      expect(isRangeChart('columnrange')).toBeTrue();
      expect(isRangeChart('arearange')).toBeTrue();
      expect(isRangeChart('areasplinerange')).toBeTrue();
    });

    it('rejette les types qui ne sont pas des plages', () => {
      expect(isRangeChart('column')).toBeFalse();
      expect(isRangeChart('area')).toBeFalse();
      expect(isRangeChart('bar')).toBeFalse();
    });
  });

  describe('transformDataForRangeChart', () => {
    it('retourne une entrée vide ou nulle telle quelle', () => {
      expect(transformDataForRangeChart([])).toEqual([]);
      expect(transformDataForRangeChart(null as any)).toBeNull();
    });

    it('ignore les séries sans données valides', () => {
      expect(transformDataForRangeChart([{ name: 'Vide', data: [] }], true)).toEqual([]);
    });

    it('retourne les séries inchangées lorsqu\'elles sont déjà au format plage', () => {
      const result = transformDataForRangeChart([{ name: 'S', data: [{ low: 1, high: 3 }] }], true);

      expect(result.length).toBe(1);
      expect(result[0].data).toEqual([{ low: 1, high: 3 }]);
    });

    it('convertit une série unique de paires en plages min-max', () => {
      const result = transformDataForRangeChart([{ name: 'S', data: [1, 3, 2, 4] }], true);

      expect(result.length).toBe(1);
      expect(result[0].data).toEqual([
        { x: 0, low: 1, high: 3 },
        { x: 2, low: 2, high: 4 },
      ]);
    });

    it('regroupe une série unique de trois valeurs en une plage min-max', () => {
      const result = transformDataForRangeChart([{ name: 'S', data: [5, 1, 3] }], true);

      expect(result[0].data).toEqual([{ x: 0, low: 1, high: 5 }]);
    });

    it('conserve une série unique trop courte pour être convertie', () => {
      const result = transformDataForRangeChart([{ name: 'S', data: [4] }], true);

      expect(result[0].name).toBe('S');
      expect(result[0].data).toEqual([4]);
    });

    it('calcule une plage entre deux séries nommées', () => {
      const result = transformDataForRangeChart(
        [
          { name: 'Min', data: [1, 8] },
          { name: 'Max', data: [3, 2] },
        ],
        true
      );

      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Min - Max');
      expect(result[0].data).toEqual([
        { x: 0, low: 1, high: 3 },
        { x: 1, low: 2, high: 8 },
      ]);
    });

    it('utilise les noms par défaut pour deux séries sans nom', () => {
      const result = transformDataForRangeChart([{ data: [1] }, { data: [2] }], true);

      expect(result[0].name).toBe('Min - Max');
      expect(result[0].data).toEqual([{ x: 0, low: 1, high: 2 }]);
    });

    it('regroupe les valeurs par x lorsque plus de deux séries partagent les mêmes x', () => {
      const result = transformDataForRangeChart(
        [
          { name: 'A', data: [1, 4] },
          { name: 'B', data: [2, 5] },
          { name: 'C', data: [3, 6] },
        ],
        true
      );

      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Plage groupée');
      expect(result[0].data).toEqual([
        { x: 0, low: 1, high: 3 },
        { x: 1, low: 4, high: 6 },
      ]);
    });

    it('agrège min et max à chaque index pour plus de deux séries sans x dupliqué', () => {
      const result = transformDataForRangeChart(
        [
          { name: 'A', data: [{ x: 0, y: 1 }] },
          { name: 'B', data: [{ x: 1, y: 5 }] },
          { name: 'C', data: [{ x: 2, y: 3 }] },
        ],
        true
      );

      expect(result[0].name).toBe('Plage (min-max)');
      expect(result[0].data[0].low).toBe(1);
      expect(result[0].data[0].high).toBe(5);
    });

    it('restaure les données d\'origine d\'une série unique après un aller-retour plage', () => {
      const range = transformDataForRangeChart([{ name: 'S', data: [{ low: 1, high: 3 }] }], false);
      const result = transformDataForRangeChart(range, true);

      expect(result[0].data).toEqual([{ low: 1, high: 3 }]);
    });

    it('restaure les séries d\'origine après une comparaison de deux séries', () => {
      const original = [
        { name: 'A', data: [1, 8] },
        { name: 'B', data: [3, 2] },
      ];
      const range = transformDataForRangeChart(original, true);
      const result = transformDataForRangeChart(range, false);

      expect(result.map((serie: any) => serie.name)).toEqual(['A', 'B']);
      expect(result[0].data).toEqual([1, 8]);
      expect(result[1].data).toEqual([3, 2]);
    });

    it('moyenne low et high pour convertir une plage en série simple', () => {
      const result = transformDataForRangeChart(
        [{ name: 'S', data: [{ low: 1, high: 3 }, { low: 2, high: 6 }] }],
        false
      );

      expect(result[0].data.map((point: any) => point.y)).toEqual([2, 4]);
      expect(result[0].data.map((point: any) => point.x)).toEqual([0, 1]);
    });

    it('moyenne les triplets [x, low, high] pour une cible non plage', () => {
      const result = transformDataForRangeChart([{ name: 'S', data: [[0, 1, 3]] }], false);

      expect(result[0].data).toEqual([[0, 2]]);
    });

    it('laisse inchangée une série sans format plage pour une cible non plage', () => {
      const result = transformDataForRangeChart([{ name: 'S', data: [1, 2] }], false);

      expect(result[0].data).toEqual([1, 2]);
    });

    it('restaure la série d\'origine lorsqu\'une série unique est convertie en plage puis revient en simple', () => {
      const result = transformDataForRangeChart(
        transformDataForRangeChart([{ name: 'S', data: [1, 3, 2, 4] }], true),
        false
      );

      expect(result[0].name).toBe('S');
      expect(result[0].data).toEqual([1, 3, 2, 4]);
    });

    it('compte la valeur 0 comme une borne valide lors de la comparaison de deux séries', () => {
      const result = transformDataForRangeChart(
        [
          { name: 'A', data: [0, 5] },
          { name: 'B', data: [3, 8] },
        ],
        true
      );

      expect(result[0].data.length).toBe(2);
      expect(result[0].data[0]).toEqual({ x: 0, low: 0, high: 3 });
    });
  });

  describe('configureRangeChart', () => {
    it('ne modifie pas les options pour un type qui n\'est pas une plage', () => {
      const options: any = {};

      configureRangeChart(options, 'bar');

      expect(options).toEqual({});
    });

    it('désactive les étiquettes de données pour columnrange sans autre style', () => {
      const options: any = {};

      configureRangeChart(options, 'columnrange');

      expect(options.plotOptions.columnrange).toEqual({ dataLabels: { enabled: false } });
      expect(options.plotOptions.arearange).toBeUndefined();
    });

    it('conserve les options columnrange existantes', () => {
      const options: any = { plotOptions: { columnrange: { color: '#123456' } } };

      configureRangeChart(options, 'columnrange');

      expect(options.plotOptions.columnrange.color).toBe('#123456');
      expect(options.plotOptions.columnrange.dataLabels.enabled).toBeFalse();
    });

    it('configure arearange avec un trait de 2, un remplissage à 0.3 et sans marqueurs', () => {
      const options: any = {};

      configureRangeChart(options, 'arearange');

      expect(options.plotOptions.arearange.lineWidth).toBe(2);
      expect(options.plotOptions.arearange.fillOpacity).toBe(0.3);
      expect(options.plotOptions.arearange.marker).toEqual({ enabled: false });
      expect(options.plotOptions.arearange.dataLabels).toEqual({ enabled: false });
    });

    it('configure areasplinerange avec les mêmes options que arearange', () => {
      const options: any = {};

      configureRangeChart(options, 'areasplinerange');

      expect(options.plotOptions.areasplinerange.lineWidth).toBe(2);
      expect(options.plotOptions.areasplinerange.fillOpacity).toBe(0.3);
      expect(options.plotOptions.areasplinerange.marker).toEqual({ enabled: false });
      expect(options.plotOptions.areasplinerange.dataLabels).toEqual({ enabled: false });
    });
  });

  describe('enforceCriticalRangeOptions', () => {
    it('ne modifie aucune option pour une plage', () => {
      const options: any = {};

      enforceCriticalRangeOptions(options, 'arearange');

      expect(options).toEqual({});
    });
  });
});
