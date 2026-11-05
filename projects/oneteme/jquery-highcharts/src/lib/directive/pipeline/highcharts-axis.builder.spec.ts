import { applyHighchartsSeriesAxes } from './highcharts-axis.builder';

const MS_OR_S = {
  baseUnit: 'ms',
  scales: [
    { unit: 'ms', scale: 1, threshold: 1000 },
    { unit: 's', scale: 0.001 },
  ],
};

function apply(series: any[], config: any = {}, chartType: any = 'bar', options: any = {}): any {
  applyHighchartsSeriesAxes(options, series, config, chartType);
  return options;
}

function axisOf(options: any, index: number): any {
  return Array.isArray(options.yAxis) ? options.yAxis[index] : options.yAxis;
}

function formatLabel(options: any, axisIndex: number, value: any): string {
  return axisOf(options, axisIndex).labels.formatter.call({ value });
}

function point(name: string, index: number, y: any, yAxis = 0): any {
  return { series: { name, index, options: { yAxis } }, y };
}

describe('applyHighchartsSeriesAxes', () => {
  describe('résolution des séries', () => {
    it('reprend type, showUnitOnAxis, yAxis, unit et yAxisConfig depuis le provider', () => {
      const config = {
        series: [{ type: 'column', showUnitOnAxis: false, yAxisIndex: 1, unit: 'ms', yAxisConfig: { opposite: true } }],
      };
      const options = apply([{ name: 'A', data: [1] }], config, 'bar');
      const serie = options.series[0];

      expect(serie.type).toBe('column');
      expect(serie.showUnitOnAxis).toBeFalse();
      expect(serie.yAxis).toBe(1);
      expect(serie.unit).toBe('ms');
      expect(serie.yAxisConfig).toEqual({ opposite: true });
    });

    it('privilégie les valeurs de la série sur celles du provider', () => {
      const config = { series: [{ type: 'column', unit: 'ms', yAxisIndex: 1 }] };
      const options = apply([{ name: 'A', data: [1], type: 'spline', unit: 's', yAxisIndex: 0 }], config, 'bar');
      const serie = options.series[0];

      expect(serie.type).toBe('spline');
      expect(serie.unit).toBe('s');
      expect(serie.yAxis).toBe(0);
    });

    it('attribue le type "line" par défaut en mixed', () => {
      const options = apply([{ name: 'A', data: [1] }], {}, 'mixed');
      expect(options.series[0].type).toBe('line');
    });

    it('utilise le type du provider en mixed plutôt que "line"', () => {
      const options = apply([{ name: 'A', data: [1] }], { series: [{ type: 'column' }] }, 'mixed');
      expect(options.series[0].type).toBe('column');
    });

    it('laisse le type indéfini en bar sans type explicite', () => {
      const options = apply([{ name: 'A', data: [1] }], {}, 'bar');
      expect(options.series[0].type).toBeUndefined();
    });

    it('ignore un type de provider non textuel', () => {
      const options = apply([{ name: 'A', data: [1] }], { series: [{ type: 42 }] }, 'bar');
      expect(options.series[0].type).toBeUndefined();
    });

    it('traite une liste de séries absente comme vide', () => {
      const options = apply(undefined as any, {}, 'bar');
      expect(options.series).toEqual([]);
    });

    it('conserve les autres propriétés de la série', () => {
      const options = apply([{ name: 'A', data: [1, 2], color: '#ff0000', stack: 's1' }], {}, 'bar');
      const serie = options.series[0];

      expect(serie.name).toBe('A');
      expect(serie.data).toEqual([1, 2]);
      expect(serie.color).toBe('#ff0000');
      expect(serie.stack).toBe('s1');
    });
  });

  describe('axe unique', () => {
    it('désactive showEmpty par défaut', () => {
      const options = apply([{ name: 'A', data: [1] }]);
      expect(options.yAxis.showEmpty).toBeFalse();
    });

    it('marque la visibilité de l axe comme automatique', () => {
      const options = apply([{ name: 'A', data: [1] }]);

      expect(options.yAxis.visible).toBeTrue();
      expect(options.yAxis.custom.jqueryHighchartsAutoVisibility).toBeTrue();
    });

    it('masque l axe quand toutes les séries sont invisibles', () => {
      const options = apply([{ name: 'A', data: [1], visible: false }]);
      expect(options.yAxis.visible).toBeFalse();
    });

    it('affiche l axe quand il n y a aucune série', () => {
      const options = apply([]);
      expect(options.yAxis.visible).toBeTrue();
    });

    it('respecte une visibilité explicite sans marquage automatique', () => {
      const options = apply([{ name: 'A', data: [1] }], {}, 'bar', { yAxis: { visible: false } });

      expect(options.yAxis.visible).toBeFalse();
      expect(options.yAxis.custom).toBeUndefined();
    });

    it('respecte un showEmpty explicite', () => {
      const options = apply([{ name: 'A', data: [1] }], {}, 'bar', { yAxis: { showEmpty: true } });
      expect(options.yAxis.showEmpty).toBeTrue();
    });

    it('conserve la forme tableau du yAxis existant', () => {
      const options = apply([{ name: 'A', data: [1] }], {}, 'bar', { yAxis: [{ opposite: true }] });

      expect(Array.isArray(options.yAxis)).toBeTrue();
      expect(options.yAxis[0].opposite).toBeTrue();
    });

    it('ne modifie pas le titre existant quand aucune unité n est définie', () => {
      const options = apply([{ name: 'A', data: [1] }], {}, 'bar', { yAxis: { title: { text: 'Existant' } } });
      expect(options.yAxis.title.text).toBe('Existant');
    });

    it('applique ytitle comme titre d un axe unique', () => {
      const options = apply([{ name: 'A', data: [1] }], { ytitle: 'Montant' }, 'bar');
      expect(options.yAxis.title?.text).toBe('Montant');
    });
  });

  describe('plusieurs axes', () => {
    it('crée un axe par titre ytitle', () => {
      const config = { ytitle: ['Montant', 'Quantité'] };
      const options = apply([{ name: 'A', data: [1] }, { name: 'B', data: [2], yAxisIndex: 1 }], config, 'bar');

      expect(options.yAxis.length).toBe(2);
      expect(options.yAxis[0].title.text).toBe('Montant');
      expect(options.yAxis[1].title.text).toBe('Quantité');
    });

    it('crée autant d axes que l index de série le requiert', () => {
      const options = apply([{ name: 'A', data: [1], yAxisIndex: 2 }], {}, 'bar');
      expect(options.yAxis.length).toBe(3);
    });

    it('fusionne yAxisConfig dans l axe correspondant uniquement', () => {
      const series = [
        { name: 'A', data: [1] },
        { name: 'B', data: [2], yAxisIndex: 1, yAxisConfig: { opposite: true, min: 0 } },
      ];
      const options = apply(series, { ytitle: ['A', 'B'] }, 'bar');

      expect(options.yAxis[1].opposite).toBeTrue();
      expect(options.yAxis[1].min).toBe(0);
      expect(options.yAxis[0].opposite).toBeUndefined();
    });

    it('ne remplace que le texte du titre existant', () => {
      const existing = [{ title: { text: 'Ancien', style: { color: 'red' } }, gridLineWidth: 0 }, {}];
      const options = apply([{ name: 'A', data: [1] }], { ytitle: ['Nouveau'] }, 'bar', { yAxis: existing });

      expect(options.yAxis[0].title).toEqual({ text: 'Nouveau', style: { color: 'red' } });
      expect(options.yAxis[0].gridLineWidth).toBe(0);
    });

    it('ne pose pas de titre sur un axe sans ytitle correspondant', () => {
      const series = [{ name: 'A', data: [1] }, { name: 'B', data: [2], yAxisIndex: 1 }];
      const options = apply(series, { ytitle: ['Montant'] }, 'bar');

      expect(options.yAxis[1].title).toBeUndefined();
    });

    it('calcule la visibilité de chaque axe à partir de ses propres séries', () => {
      const series = [{ name: 'A', data: [1] }, { name: 'B', data: [2], yAxisIndex: 1, visible: false }];
      const options = apply(series, { ytitle: ['A', 'B'] }, 'bar');

      expect(options.yAxis[0].visible).toBeTrue();
      expect(options.yAxis[1].visible).toBeFalse();
    });
  });

  describe('unités sur les axes', () => {
    it('ajoute l unité textuelle au titre existant', () => {
      const options = apply([{ name: 'A', data: [5] }], { yUnit: 'ms' }, 'bar', { yAxis: { title: { text: 'Durée' } } });
      expect(options.yAxis.title.text).toBe('Durée (ms)');
    });

    it('utilise l unité seule comme titre quand aucun titre n existe', () => {
      const options = apply([{ name: 'A', data: [5] }], { yUnit: 'ms' });
      expect(options.yAxis.title.text).toBe('ms');
    });

    it('utilise l unité portée par la série quand yUnit est absent', () => {
      const options = apply([{ name: 'A', data: [5], unit: 'ms' }], {});
      expect(options.yAxis.title.text).toBe('ms');
    });

    it('sépare la valeur formatée de l unité par une espace insécable', () => {
      const options = apply([{ name: 'A', data: [5] }], { yUnit: 'ms' });
      expect(formatLabel(options, 0, 5)).toBe('5\u00a0ms');
    });

    it('renvoie la valeur brute quand elle n est pas numérique', () => {
      const options = apply([{ name: 'A', data: [5] }], { yUnit: 'ms' });
      expect(formatLabel(options, 0, 'abc')).toBe('abc');
    });

    it('ne remplace pas un formateur de graduations existant', () => {
      const custom = function (): string {
        return 'perso';
      };
      const options = apply([{ name: 'A', data: [5] }], { yUnit: 'ms' }, 'bar', { yAxis: { labels: { formatter: custom } } });
      expect(options.yAxis.labels.formatter).toBe(custom);
    });

    it('n ajoute ni titre ni graduations quand showUnitOnAxis vaut false', () => {
      const options = apply([{ name: 'A', data: [5], unit: 'ms', showUnitOnAxis: false }], {});

      expect(options.yAxis.title).toBeUndefined();
      expect(options.yAxis.labels).toBeUndefined();
    });

    it('choisit l échelle couvrant les valeurs quand elles restent sous le seuil', () => {
      const options = apply([{ name: 'A', data: [{ y: 500 }] }], { yUnit: MS_OR_S });

      expect(options.yAxis.title.text).toBe('ms');
      expect(formatLabel(options, 0, 500)).toBe('500\u00a0ms');
    });

    it('bascule vers l échelle suivante au-delà du seuil', () => {
      const options = apply([{ name: 'A', data: [{ y: 5000 }] }], { yUnit: MS_OR_S });

      expect(options.yAxis.title.text).toBe('s');
      expect(formatLabel(options, 0, 5000)).toBe('5\u00a0s');
    });

    it('applique la précision de l unité objet', () => {
      const options = apply([{ name: 'A', data: [2.34] }], { yUnit: { baseUnit: 'm', scales: [], precision: 1 } });
      expect(formatLabel(options, 0, 2.34)).toMatch(/^2[,.]3\u00a0m$/);
    });

    it('délègue au formateur personnalisé de l unité objet', () => {
      const yUnit = { baseUnit: 'o', scales: [], formatter: (value: number, unit: string) => `${value} [${unit}]` };
      const options = apply([{ name: 'A', data: [3] }], { yUnit });

      expect(options.yAxis.title.text).toBe('o');
      expect(formatLabel(options, 0, 3)).toBe('3 [o]');
    });

    it('ignore des unités textuelles en conflit au profit de yUnit', () => {
      const series = [{ name: 'A', data: [1], unit: 'ms' }, { name: 'B', data: [2], unit: 's' }];
      const options = apply(series, { yUnit: 'kg' });
      expect(options.yAxis.title.text).toBe('kg');
    });

    it('n ajoute aucune unité quand les unités de série sont en conflit sans yUnit', () => {
      const series = [{ name: 'A', data: [1], unit: 'ms' }, { name: 'B', data: [2], unit: 's' }];
      const options = apply(series, {});

      expect(options.yAxis.title).toBeUndefined();
      expect(options.yAxis.labels).toBeUndefined();
    });

    it('applique l unité propre à chaque axe', () => {
      const series = [{ name: 'A', data: [1], unit: 'ms' }, { name: 'B', data: [2], unit: '%', yAxisIndex: 1 }];
      const options = apply(series, { ytitle: ['Temps', 'Taux'] });

      expect(options.yAxis[0].title.text).toBe('Temps (ms)');
      expect(options.yAxis[1].title.text).toBe('Taux (%)');
      expect(formatLabel(options, 1, 2)).toBe('2\u00a0%');
    });
  });

  describe('tooltip avec unités', () => {
    it('n ajoute aucun tooltip sans unité', () => {
      const options = apply([{ name: 'A', data: [1] }], {});
      expect(options.tooltip).toBeUndefined();
    });

    it('ajoute un formateur de tooltip en conservant les autres options', () => {
      const options = apply([{ name: 'A', data: [5] }], { yUnit: 'ms' }, 'bar', { tooltip: { shared: true } });

      expect(options.tooltip.shared).toBeTrue();
      expect(typeof options.tooltip.formatter).toBe('function');
    });

    it('conserve un formateur de tooltip existant', () => {
      const custom = function (): string {
        return 'perso';
      };
      const options = apply([{ name: 'A', data: [5] }], { yUnit: 'ms' }, 'bar', { tooltip: { formatter: custom } });
      expect(options.tooltip.formatter).toBe(custom);
    });

    it('affiche l unité de chaque série en mode partagé', () => {
      const series = [{ name: 'A', data: [5], unit: 'ms' }, { name: 'B', data: [2], unit: 's' }];
      const options = apply(series, {});
      const text = options.tooltip.formatter.call({ x: 'Jan', points: [point('A', 0, 5), point('B', 1, 2)] });

      expect(text).toBe('Jan<br/>A: 5\u00a0ms<br/>B: 2\u00a0s');
    });

    it('affiche un seul point sans préfixe quand x est indéfini', () => {
      const options = apply([{ name: 'A', data: [5], unit: 'ms' }], {});
      expect(options.tooltip.formatter.call({ point: point('A', 0, 5) })).toBe('A: 5\u00a0ms');
    });

    it('préfixe le point par la valeur de x quand elle est définie', () => {
      const options = apply([{ name: 'A', data: [5], unit: 'ms' }], {});
      expect(options.tooltip.formatter.call({ x: 'Jan', point: point('A', 0, 5) })).toBe('Jan<br/>A: 5\u00a0ms');
    });

    it('utilise l unité de l axe quand la série n en porte pas', () => {
      const options = apply([{ name: 'A', data: [5] }], { yUnit: 'ms' });
      const text = options.tooltip.formatter.call({ x: 'Jan', points: [point('A', 0, 5)] });

      expect(text).toBe('Jan<br/>A: 5\u00a0ms');
    });

    it('applique l échelle de l axe objet dans le tooltip', () => {
      const options = apply([{ name: 'A', data: [{ y: 5000 }] }], { yUnit: MS_OR_S });
      const text = options.tooltip.formatter.call({ point: point('A', 0, 5000) });

      expect(text).toBe('A: 5\u00a0s');
    });
  });
});
