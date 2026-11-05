import { ChartType } from '@oneteme/jquery-core';
import { prepareHighchartsData, resolveHighchartsPointValue } from './highcharts-data.pipeline';

function run(data: any[], config: any, type: ChartType, mapCodeToName = new Map<string, string>()) {
  return prepareHighchartsData({ data, config, type, mapCodeToName, debug: false });
}

describe('resolveHighchartsPointValue', () => {
  it('retourne null et undefined tels quels', () => {
    expect(resolveHighchartsPointValue(null)).toBeNull();
    expect(resolveHighchartsPointValue(undefined)).toBeUndefined();
  });

  it('retourne les valeurs primitives telles quelles', () => {
    expect(resolveHighchartsPointValue(42)).toBe(42);
    expect(resolveHighchartsPointValue('texte')).toBe('texte');
  });

  it('extrait la propriété y d un objet', () => {
    expect(resolveHighchartsPointValue({ name: 'A', y: 3 })).toBe(3);
  });

  it('extrait la propriété value lorsque y est absent', () => {
    expect(resolveHighchartsPointValue({ name: 'A', value: 7 })).toBe(7);
  });

  it('privilégie y sur value, même lorsque y vaut 0', () => {
    expect(resolveHighchartsPointValue({ y: 0, value: 9 })).toBe(0);
  });

  it('retourne null lorsque y vaut null', () => {
    expect(resolveHighchartsPointValue({ y: null, value: 9 })).toBeNull();
  });

  it('retourne un objet sans y ni value tel quel', () => {
    const point = { name: 'A', x: 1 };
    expect(resolveHighchartsPointValue(point)).toBe(point);
  });
});

describe('prepareHighchartsData', () => {
  describe('graphiques simples', () => {
    it('produit une série unique nommée d après le titre avec des points name et y', () => {
      const { data, validationError } = run(
        [{ name: 'A', y: 1 }, { name: 'B', y: 2 }],
        { title: 'Parts', series: [{ data: { xField: 'name', yField: 'y' } }] },
        'pie',
      );

      expect(validationError).toBeNull();
      expect(data.series).toEqual([
        { name: 'Parts', data: [{ name: 'A', y: 1 }, { name: 'B', y: 2 }] },
      ]);
    });

    it('utilise "Données" comme nom de série sans titre', () => {
      const { data } = run(
        [{ name: 'A', y: 1 }],
        { series: [{ data: { xField: 'name', yField: 'y' } }] },
        'donut',
      );

      expect(data.series[0].name).toBe('Données');
    });

    it('traite funnel et pyramid comme graphiques simples sans axes', () => {
      for (const type of ['funnel', 'pyramid'] as ChartType[]) {
        const { data } = run(
          [{ name: 'A', y: 1 }],
          { series: [{ data: { xField: 'name', yField: 'y' } }] },
          type,
        );

        expect(data.xAxis).toBeUndefined();
        expect(data.series[0].data).toEqual([{ name: 'A', y: 1 }]);
      }
    });

    it('nomme "Item 1" un point sans catégorie', () => {
      const { data } = run(
        [{ y: 5 }],
        { series: [{ data: { xField: 'name', yField: 'y' } }] },
        'pie',
      );

      expect(data.series[0].data).toEqual([{ name: 'Item 1', y: 5 }]);
    });

    it('agrège les séries multiples sous le titre du graphique', () => {
      const config = {
        title: 'Total général',
        series: [
          { name: 'Ventes', data: { xField: 'name', yField: 'ventes' } },
          { name: 'Achats', data: { xField: 'name', yField: 'achats' } },
        ],
      };
      const { data, validationError } = run(
        [{ name: 'A', ventes: 1, achats: 2 }, { name: 'B', ventes: 3, achats: 4 }],
        config,
        'pie',
      );

      expect(validationError).toBeNull();
      expect(data.series).toEqual([
        {
          name: 'Total général',
          data: [{ name: 'Ventes', y: 4 }, { name: 'Achats', y: 6 }],
        },
      ]);
    });

    it('nomme "Total" la série agrégée sans titre', () => {
      const config = {
        series: [
          { name: 'Ventes', data: { xField: 'name', yField: 'ventes' } },
          { name: 'Achats', data: { xField: 'name', yField: 'achats' } },
        ],
      };
      const { data } = run([{ name: 'A', ventes: 1, achats: 2 }], config, 'pie');

      expect(data.series[0].name).toBe('Total');
    });

    it('signale des données incompatibles pour une valeur nulle', () => {
      const { validationError } = run(
        [{ name: 'A', y: null }],
        { series: [{ data: { xField: 'name', yField: 'y' } }] },
        'pie',
      );

      expect(validationError).toEqual({
        title: 'Données incompatibles',
        message: 'Aucune valeur numérique rendable dans les séries fournies.',
      });
    });

    it('convertit les codes de carte en noms via la table de correspondance', () => {
      const { data, validationError } = run(
        [{ code: '75', value: 10 }],
        { title: 'Départements', series: [{ data: { xField: 'code', yField: 'value' } }] },
        'pie',
        new Map([['75', 'Paris']]),
      );

      expect(validationError).toBeNull();
      expect(data.series).toEqual([{ name: 'Départements', data: [{ name: 'Paris', y: 10 }] }]);
    });

    it('conserve les codes lorsque la table de correspondance est vide', () => {
      const { data } = run(
        [{ code: '75', value: 10 }],
        { title: 'Départements', series: [{ data: { xField: 'code', yField: 'value' } }] },
        'pie',
      );

      expect(data.series[0].data).toEqual([{ name: '75', y: 10 }]);
    });

    it("ne signale pas d'erreur pour un pie sans données", () => {
      const { validationError } = run(
        [],
        { series: [{ data: { xField: 'name', yField: 'y' } }] },
        'pie',
      );

      expect(validationError).toBeNull();
    });
  });

  describe('graphiques complexes', () => {
    it('construit les catégories et les séries à partir des données', () => {
      const { data, validationError } = run(
        [{ x: 'Jan', a: 1 }, { x: 'Fév', a: 2 }],
        { series: [{ name: 'Ventes', data: { xField: 'x', yField: 'a' } }] },
        'bar',
      );

      expect(validationError).toBeNull();
      expect(data.xAxis.categories).toEqual(['Jan', 'Fév']);
      expect(data.series[0].name).toBe('Ventes');
      expect(data.series[0].data).toEqual([1, 2]);
    });

    it('utilise xtitle comme titre de l axe x', () => {
      const { data } = run(
        [{ x: 'Jan', a: 1 }],
        { xtitle: 'Mois', series: [{ name: 'Ventes', data: { xField: 'x', yField: 'a' } }] },
        'bar',
      );

      expect(data.xAxis.title).toEqual({ text: 'Mois' });
    });

    it('utilise une chaîne vide comme titre de l axe x sans xtitle', () => {
      const { data } = run(
        [{ x: 'Jan', a: 1 }],
        { series: [{ name: 'Ventes', data: { xField: 'x', yField: 'a' } }] },
        'bar',
      );

      expect(data.xAxis.title).toEqual({ text: '' });
    });

    it('reprend type, showUnitOnAxis, yAxisIndex et yAxisConfig du provider', () => {
      const config = {
        series: [{
          name: 'Ventes',
          type: 'column',
          showUnitOnAxis: false,
          yAxisIndex: 1,
          yAxisConfig: { opposite: true },
          data: { xField: 'x', yField: 'a' },
        }],
      };
      const { data } = run([{ x: 'Jan', a: 1 }], config, 'bar');
      const serie = data.series[0];

      expect(serie.type).toBe('column');
      expect(serie.showUnitOnAxis).toBeFalse();
      expect(serie.yAxisIndex).toBe(1);
      expect(serie.yAxisConfig).toEqual({ opposite: true });
    });

    it('attribue "line" aux séries sans type en mixed et conserve le type du provider', () => {
      const config = {
        series: [
          { name: 'Ventes', type: 'column', data: { xField: 'x', yField: 'a' } },
          { name: 'Objectif', data: { xField: 'x', yField: 'b' } },
        ],
      };
      const { data } = run([{ x: 'Jan', a: 1, b: 3 }, { x: 'Fév', a: 2, b: 4 }], config, 'mixed');

      expect(data.series[0].type).toBe('column');
      expect(data.series[1].type).toBe('line');
    });

    it('ne renvoie pas d axe y sans yCategories', () => {
      const { data } = run(
        [{ x: 'Jan', a: 1 }],
        { series: [{ name: 'Ventes', data: { xField: 'x', yField: 'a' } }] },
        'bar',
      );

      expect(data.yAxis).toBeUndefined();
    });

    it('construit la matrice heatmap et l axe y à partir des séries', () => {
      const config = {
        xtitle: 'Mois',
        ytitle: 'Séries',
        series: [
          { name: 'S1', data: { xField: 'x', yField: 'a' } },
          { name: 'S2', data: { xField: 'x', yField: 'b' } },
        ],
      };
      const { data, validationError } = run(
        [{ x: 'Jan', a: 1, b: 3 }, { x: 'Fév', a: 2, b: 4 }],
        config,
        'heatmap',
      );

      expect(validationError).toBeNull();
      expect(data.xAxis.categories).toEqual(['Jan', 'Fév']);
      expect(data.yAxis).toEqual({ categories: ['S1', 'S2'], title: { text: 'Séries' } });
      expect(data.series[0].data).toEqual([[0, 0, 1], [1, 0, 2], [0, 1, 3], [1, 1, 4]]);
    });

    it('utilise une chaîne vide comme titre de l axe y sans ytitle', () => {
      const config = {
        series: [
          { name: 'S1', data: { xField: 'x', yField: 'a' } },
          { name: 'S2', data: { xField: 'x', yField: 'b' } },
        ],
      };
      const { data } = run(
        [{ x: 'Jan', a: 1, b: 3 }, { x: 'Fév', a: 2, b: 4 }],
        config,
        'heatmap',
      );

      expect(data.yAxis.title).toEqual({ text: '' });
    });

    it('traite semi-circle par le chemin complexe avec des points name et y', () => {
      const config = {
        series: [{ name: 'Part', data: { xField: 'name', yField: 'y' } }],
      };
      const { data, validationError } = run(
        [{ name: 'A', y: 1 }, { name: 'B', y: 2 }],
        config,
        'semi-circle',
      );

      expect(validationError).toBeNull();
      expect(data.xAxis.categories).toEqual(['A', 'B']);
      expect(data.series[0].data).toEqual([{ name: 'A', y: 1 }, { name: 'B', y: 2 }]);
    });

    it('retourne une série vide et une erreur pour des valeurs nulles', () => {
      const { data, validationError } = run(
        [{ x: 'Jan', a: null }],
        { series: [{ name: 'Ventes', data: { xField: 'x', yField: 'a' } }] },
        'bar',
      );

      expect(data.series).toEqual([]);
      expect(data.xAxis.categories).toEqual([]);
      expect(validationError).toEqual({
        title: 'Données incompatibles',
        message: 'Aucune valeur numérique rendable dans les séries fournies.',
      });
    });

    it('ne signale pas d erreur pour des données vides', () => {
      const { data, validationError } = run(
        [],
        { series: [{ name: 'Ventes', data: { xField: 'x', yField: 'a' } }] },
        'bar',
      );

      expect(validationError).toBeNull();
      expect(data.series).toEqual([]);
      expect(data.xAxis.categories).toEqual([]);
    });
  });
});
