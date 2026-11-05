import {
  configureBubbleChart,
  enforceCriticalBubbleOptions,
  isBubbleChart,
  transformDataForBubble,
} from './bubble-config';
import { ORIGINAL_DATA_SYMBOL, TRANSFORMATION_HISTORY_SYMBOL } from './memory-symbols';

describe('bubble-config', () => {
  describe('isBubbleChart', () => {
    it('reconnaît le type bubble', () => {
      expect(isBubbleChart('bubble')).toBeTrue();
    });

    it('rejette les autres types de graphique', () => {
      expect(isBubbleChart('scatter')).toBeFalse();
    });
  });

  describe('transformDataForBubble', () => {
    it('retourne une entrée vide ou nulle telle quelle', () => {
      expect(transformDataForBubble([], true)).toEqual([]);
      expect(transformDataForBubble(null as any, true)).toBeNull();
    });

    it('calcule z avec 20 pour le maximum et 1 pour le minimum des valeurs y', () => {
      const result = transformDataForBubble([{ name: 'S', data: [[1, 2], [3, 6]] }], true);

      expect(result[0].data[0]).toEqual([1, 2, 1]);
      expect(result[0].data[1]).toEqual([3, 6, 20]);
    });

    it("calcule z pour une valeur intermédiaire selon l'échelle logarithmique", () => {
      const result = transformDataForBubble([{ name: 'S', data: [[0, 2], [1, 4], [2, 6]] }], true);

      expect(result[0].data[1][2]).toBeCloseTo(20 * Math.log10(5.5), 6);
    });

    it("calcule la mise à l'échelle à partir de la valeur absolue de y", () => {
      const result = transformDataForBubble([{ name: 'S', data: [[0, -6], [1, 2]] }], true);

      expect(result[0].data[0]).toEqual([0, -6, 20]);
      expect(result[0].data[1]).toEqual([1, 2, 1]);
    });

    it('ajoute z et name à partir de x pour les points objets', () => {
      const result = transformDataForBubble(
        [{ name: 'S', data: [{ x: 'Paris', y: 2 }, { x: 'Lyon', y: 6, name: 'L' }] }],
        true
      );

      expect(result[0].data[0].z).toBe(1);
      expect(result[0].data[0].name).toBe('Paris');
      expect(result[0].data[1].z).toBe(20);
      expect(result[0].data[1].name).toBe('L');
    });

    it('retire les points dont y est invalide avant le calcul de z', () => {
      const result = transformDataForBubble(
        [{ name: 'S', data: [{ x: 0, y: null }, { x: 1, y: 6 }] }],
        true
      );

      expect(result[0].data.length).toBe(1);
      expect(result[0].data[0].x).toBe(1);
      expect(result[0].data[0].z).toBe(1);
    });

    it('conserve les points ayant déjà une troisième valeur z', () => {
      const data = [[1, 2, 50], [3, 6]];

      const result = transformDataForBubble([{ name: 'S', data }], true);

      expect(result[0].data).toEqual([[1, 2, 50], [3, 6]]);
    });

    it("enregistre la copie originale et l'historique de transformation", () => {
      const result = transformDataForBubble([{ name: 'S', data: [[1, 2], [3, 6]] }], true);

      expect(result[0][ORIGINAL_DATA_SYMBOL]).toEqual([[1, 2], [3, 6]]);
      const history = result[0][TRANSFORMATION_HISTORY_SYMBOL];
      expect(history.transformations[0].to).toBe('bubble');
      expect(history.transformations[0].strategy).toBe('calculZ-global');
    });

    it("restaure les données d'origine depuis la copie du symbole", () => {
      const bubble = transformDataForBubble([{ name: 'S', data: [[1, 2], [3, 6]] }], true);

      const result = transformDataForBubble(bubble, false);

      expect(result[0].data).toEqual([[1, 2], [3, 6]]);
    });

    it('retire la troisième valeur des tableaux sans symbole', () => {
      const result = transformDataForBubble([{ name: 'S', data: [[0, 1, 5]] }], false);

      expect(result[0].data).toEqual([[0, 1]]);
    });

    it('retire la propriété z des points objets sans symbole', () => {
      const result = transformDataForBubble([{ name: 'S', data: [{ x: 0, y: 1, z: 5, name: 'A' }] }], false);

      expect(result[0].data[0]).toEqual({ x: 0, y: 1, name: 'A' });
    });

    it('retourne les séries inchangées pour un type non bulle sans format bulle', () => {
      const series = [{ name: 'S', data: [1, 2] }];

      const result = transformDataForBubble(series, false);

      expect(result[0].data).toEqual([1, 2]);
    });
  });

  describe('configureBubbleChart', () => {
    it('ne modifie pas les options pour un type non bulle', () => {
      const options: any = {};

      configureBubbleChart(options, 'scatter');

      expect(options).toEqual({});
    });

    it('applique les tailles min et max et désactive les étiquettes', () => {
      const options: any = {};

      configureBubbleChart(options, 'bubble');

      expect(options.plotOptions.bubble.minSize).toBe(3);
      expect(options.plotOptions.bubble.maxSize).toBe(20);
      expect(options.plotOptions.bubble.dataLabels.enabled).toBeFalse();
    });

    it('conserve les options bubble existantes', () => {
      const options: any = { plotOptions: { bubble: { color: 'red' } } };

      configureBubbleChart(options, 'bubble');

      expect(options.plotOptions.bubble.color).toBe('red');
      expect(options.plotOptions.bubble.minSize).toBe(3);
    });

    it("affiche la valeur y en gras dans l'infobulle", () => {
      const options: any = {};

      configureBubbleChart(options, 'bubble');

      expect(options.tooltip.pointFormatter.call({ y: 42 })).toBe('Valeur: <b>42</b>');
    });
  });

  describe('enforceCriticalBubbleOptions', () => {
    it('ne modifie pas les options pour un type non bulle', () => {
      const options: any = {};

      enforceCriticalBubbleOptions(options, 'scatter');

      expect(options).toEqual({});
    });

    it("crée la configuration bubble complète lorsqu'elle est absente", () => {
      const options: any = {};

      enforceCriticalBubbleOptions(options, 'bubble');

      expect(options.plotOptions.bubble.marker.enabled).toBeTrue();
      expect(options.plotOptions.bubble.lineWidth).toBe(0);
      expect(options.plotOptions.bubble.minSize).toBe(3);
      expect(options.plotOptions.bubble.maxSize).toBe(20);
    });

    it("force le marqueur visible même s'il était désactivé", () => {
      const options: any = { plotOptions: { bubble: { marker: { enabled: false } } } };

      enforceCriticalBubbleOptions(options, 'bubble');

      expect(options.plotOptions.bubble.marker.enabled).toBeTrue();
    });

    it('conserve les tailles min et max existantes', () => {
      const options: any = { plotOptions: { bubble: { minSize: 5, maxSize: 30 } } };

      enforceCriticalBubbleOptions(options, 'bubble');

      expect(options.plotOptions.bubble.minSize).toBe(5);
      expect(options.plotOptions.bubble.maxSize).toBe(30);
    });
  });
});
