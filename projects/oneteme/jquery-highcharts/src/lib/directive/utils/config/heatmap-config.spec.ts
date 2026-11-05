import { Highcharts } from '../highcharts-modules';
import {
  configureHeatmapChart,
  enforceCriticalHeatmapOptions,
  isHeatmapChart,
  transformDataForHeatmap,
} from './heatmap-config';

describe('heatmap-config', () => {
  describe('isHeatmapChart', () => {
    it('reconnaît le type heatmap', () => {
      expect(isHeatmapChart('heatmap')).toBeTrue();
    });

    it('rejette les autres types de graphiques', () => {
      expect(isHeatmapChart('column')).toBeFalse();
      expect(isHeatmapChart('treemap')).toBeFalse();
      expect(isHeatmapChart('')).toBeFalse();
    });
  });

  describe('transformDataForHeatmap', () => {
    it('retourne une liste vide lorsque les séries sont vides', () => {
      expect(transformDataForHeatmap([], true).series).toEqual([]);
    });

    it('retourne null lorsque les séries sont nulles', () => {
      expect(transformDataForHeatmap(null as any, true).series).toBeNull();
    });

    it('transforme une matrice en une série heatmap avec les indices x et y', () => {
      const result = transformDataForHeatmap(
        [
          { name: 'A', data: [1, 2] },
          { name: 'B', data: [3, 4] },
        ],
        true
      );

      expect(result.series.length).toBe(1);
      expect(result.series[0].name).toBe('Heatmap');
      expect(result.series[0].data).toEqual([
        [0, 0, 1],
        [1, 0, 2],
        [0, 1, 3],
        [1, 1, 4],
      ]);
      expect(result.yCategories).toEqual(['A', 'B']);
    });

    it('conserve la valeur zéro comme une cellule valide', () => {
      const result = transformDataForHeatmap([{ name: 'A', data: [0, 2] }], true);

      expect(result.series[0].data).toEqual([
        [0, 0, 0],
        [1, 0, 2],
      ]);
    });

    it('ignore les points null de la matrice', () => {
      const result = transformDataForHeatmap([{ name: 'A', data: [null, 2] }], true);

      expect(result.series[0].data).toEqual([[1, 0, 2]]);
    });

    it('extrait la valeur des points objets via y ou value', () => {
      const result = transformDataForHeatmap(
        [{ name: 'A', data: [{ y: 5 }, { value: 7 }] }],
        true
      );

      expect(result.series[0].data).toEqual([
        [0, 0, 5],
        [1, 0, 7],
      ]);
    });

    it('nomme la catégorie Y par défaut lorsque la série n\'a pas de nom', () => {
      const result = transformDataForHeatmap([{ data: [1] }], true);

      expect(result.yCategories).toEqual(['Série 1']);
    });

    it('ne fournit pas de yCategories lorsque les données sont déjà au format heatmap', () => {
      const series = [{ name: 'H', data: [[0, 0, 5], [1, 0, 3]] }];
      const result = transformDataForHeatmap(series, true);

      expect(result.yCategories).toBeUndefined();
      expect(result.series).toBe(series);
    });

    it('restaure les séries d\'origine à partir de la série heatmap', () => {
      const original = [
        { name: 'A', data: [1, 2] },
        { name: 'B', data: [3, 4] },
      ];
      const heatmap = transformDataForHeatmap(original, true);
      const result = transformDataForHeatmap(heatmap.series, false);

      expect(result.series).toBe(original);
    });

    it('recrée une série par valeur y à partir d objets x, y et value', () => {
      const result = transformDataForHeatmap(
        [
          {
            name: 'H',
            data: [
              { x: 0, y: 0, value: 3 },
              { x: 1, y: 0, value: 4 },
              { x: 0, y: 1, value: 9 },
            ],
          },
        ],
        false
      );

      expect(result.series.length).toBe(2);
      expect(result.series[0].name).toBe('Série 1');
      expect(result.series[0].data).toEqual([3, 4]);
      expect(result.series[1].name).toBe('Série 2');
      expect(result.series[1].data).toEqual([9]);
    });

    it('laisse inchangées les séries non heatmap pour une cible non heatmap', () => {
      const series = [{ name: 'A', data: [1, 2] }];
      const result = transformDataForHeatmap(series, false);

      expect(result.series).toBe(series);
    });

    it('aligne les indices Y sur yCategories lorsqu\'une série est vide', () => {
      const result = transformDataForHeatmap(
        [
          { name: 'A', data: [] },
          { name: 'B', data: [1, 2] },
        ],
        true
      );

      expect(result.yCategories).toEqual(['B']);
      expect(result.series[0].data).toEqual([
        [0, 0, 1],
        [1, 0, 2],
      ]);
    });

    it('lit la valeur des triplets [x, y, valeur] lors d\'une cible non heatmap sans symbole', () => {
      const result = transformDataForHeatmap(
        [{ name: 'H', data: [[0, 0, 5], [1, 0, 3]] }],
        false
      );

      expect(result.series[0].data).toEqual([5, 3]);
    });
  });

  describe('configureHeatmapChart', () => {
    it('ne modifie pas les options pour un type qui n\'est pas heatmap', () => {
      const options: any = {};

      configureHeatmapChart(options, 'column');

      expect(options).toEqual({});
    });

    it('configure les bordures et les étiquettes de données de la heatmap', () => {
      const options: any = {};

      configureHeatmapChart(options, 'heatmap');

      expect(options.plotOptions.heatmap.borderWidth).toBe(1);
      expect(options.plotOptions.heatmap.borderColor).toBe('#FFFFFF');
      expect(options.plotOptions.heatmap.dataLabels).toEqual({
        enabled: true,
        color: '#000000',
      });
    });

    it('crée un colorAxis avec la couleur principale de Highcharts', () => {
      const options: any = {};

      configureHeatmapChart(options, 'heatmap');

      expect(options.colorAxis.min).toBe(0);
      expect(options.colorAxis.minColor).toBe('#FFFFFF');
      expect(options.colorAxis.maxColor).toBe((Highcharts as any).getOptions().colors[0]);
    });

    it('ajoute un objet tooltip vide lorsqu\'il est absent', () => {
      const options: any = {};

      configureHeatmapChart(options, 'heatmap');

      expect(options.tooltip).toEqual({});
    });

    it('conserve un colorAxis et un tooltip déjà définis', () => {
      const colorAxis = { minColor: '#000000', maxColor: '#FF0000' };
      const tooltip = { enabled: false };
      const options: any = { colorAxis, tooltip };

      configureHeatmapChart(options, 'heatmap');

      expect(options.colorAxis).toBe(colorAxis);
      expect(options.colorAxis.maxColor).toBe('#FF0000');
      expect(options.tooltip).toBe(tooltip);
    });

    it('conserve les options heatmap existantes lorsque les bordures sont définies', () => {
      const options: any = { plotOptions: { heatmap: { opacity: 0.5 } } };

      configureHeatmapChart(options, 'heatmap');

      expect(options.plotOptions.heatmap.opacity).toBe(0.5);
      expect(options.plotOptions.heatmap.borderWidth).toBe(1);
    });
  });

  describe('enforceCriticalHeatmapOptions', () => {
    it('ne modifie pas les options pour un type qui n\'est pas heatmap', () => {
      const options: any = {};

      enforceCriticalHeatmapOptions(options, 'column');

      expect(options.colorAxis).toBeUndefined();
    });

    it('ajoute un colorAxis lorsqu\'il est absent', () => {
      const options: any = {};

      enforceCriticalHeatmapOptions(options, 'heatmap');

      expect(options.colorAxis.min).toBe(0);
      expect(options.colorAxis.minColor).toBe('#FFFFFF');
      expect(options.colorAxis.maxColor).toBe((Highcharts as any).getOptions().colors[0]);
    });

    it('conserve un colorAxis existant', () => {
      const colorAxis = { min: 5, minColor: '#111111' };
      const options: any = { colorAxis };

      enforceCriticalHeatmapOptions(options, 'heatmap');

      expect(options.colorAxis).toBe(colorAxis);
    });
  });
});
