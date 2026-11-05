import { validateChartData } from './chart-data-validator';

const DONNEES_INCOMPATIBLES = 'Données incompatibles';
const AUCUNE_VALEUR_RENDABLE = 'Aucune valeur numérique rendable dans les séries fournies.';

describe('validateChartData', () => {
  describe('absence de données', () => {
    it('signale isNoData pour un tableau de séries vide', () => {
      expect(validateChartData([], 'pie')).toEqual({
        isValid: false,
        isNoData: true,
        errorTitle: 'Aucune donnée disponible',
        errorMessage: 'Aucune donnée',
      });
    });

    it('signale isNoData pour des séries absentes', () => {
      expect(validateChartData(null as any, 'bar').isNoData).toBeTrue();
    });
  });

  describe('données rendables', () => {
    it('signale des données incompatibles quand aucune série n\'a de données', () => {
      expect(validateChartData([{ name: 'A' }], 'bar')).toEqual({
        isValid: false,
        errorTitle: DONNEES_INCOMPATIBLES,
        errorMessage: AUCUNE_VALEUR_RENDABLE,
      });
    });

    it('rejette les points nuls, non numériques ou non finis', () => {
      const result = validateChartData(
        [{ data: [null, 'abc', NaN, Infinity, ['A'], {}, { name: 'x' }] }],
        'bar',
      );
      expect(result.isValid).toBeFalse();
      expect(result.errorTitle).toBe(DONNEES_INCOMPATIBLES);
    });

    it('accepte un point numérique, un tuple, un objet y, value ou low/high', () => {
      const points: any[] = [5, ['A', 5], { y: 3 }, { value: 3 }, { low: 1, high: 4 }];
      points.forEach((point) => {
        expect(validateChartData([{ data: [point] }], 'bar')).toEqual({ isValid: true });
      });
    });

    it('considère les données rendables dès qu\'une série en contient une', () => {
      expect(validateChartData([{ data: [] }, { data: [null, 2] }], 'bar')).toEqual({ isValid: true });
    });

    it('rejette les séries dont data n\'est pas un tableau', () => {
      expect(validateChartData([{ data: 'abc' }, { data: { y: 1 } }], 'bar').errorTitle).toBe(DONNEES_INCOMPATIBLES);
    });
  });

  describe('graphiques range', () => {
    it('accepte le format [x, low, high] et le format {low, high}', () => {
      expect(validateChartData([{ data: [['2024', 1, 5]] }], 'columnrange')).toEqual({ isValid: true });
      expect(validateChartData([{ data: [{ low: 1, high: 5 }] }], 'arearange')).toEqual({ isValid: true });
    });

    it('accepte deux séries numériques pour un graphique range', () => {
      expect(validateChartData([{ data: [1, 2] }, { data: [3, 4] }], 'areasplinerange')).toEqual({ isValid: true });
    });

    it('exige au moins 2 séries pour un graphique range sans format range', () => {
      expect(validateChartData([{ name: 'A', data: [1, 2] }], 'columnrange')).toEqual({
        isValid: false,
        errorTitle: DONNEES_INCOMPATIBLES,
        errorMessage: 'Veuillez fournir au moins 2 séries pour afficher un graphique "Column Range".',
      });
    });

    it('utilise le libellé du type dans le message d\'erreur', () => {
      expect(validateChartData([{ data: [1] }], 'arearange').errorMessage).toContain('"Area Range"');
      expect(validateChartData([{ data: [1] }], 'areasplinerange').errorMessage).toContain('"Area Spline Range"');
    });

    it('signale l\'absence de valeur rendable avant de contrôler le format range', () => {
      expect(validateChartData([{ data: [null] }], 'columnrange').errorMessage).toBe(AUCUNE_VALEUR_RENDABLE);
    });

    it('ne lève pas d\'erreur pour un point null dans une série range', () => {
      expect(validateChartData([{ data: [null, [0, 1, 5]] }], 'columnrange')).toEqual({ isValid: true });
    });
  });

  describe('graphiques map', () => {
    it('accepte les objets {code, value} et {name, y}', () => {
      expect(validateChartData([{ data: [{ code: 'FR', value: 10 }] }], 'map')).toEqual({ isValid: true });
      expect(validateChartData([{ data: [{ name: 'Paris', y: 4 }] }], 'map')).toEqual({ isValid: true });
    });

    it('accepte le tuple [code, value]', () => {
      expect(validateChartData([{ data: [['FR', 10]] }], 'map')).toEqual({ isValid: true });
    });

    it('rejette un format map sans clé géographique', () => {
      expect(validateChartData([{ data: [{ value: 5 }] }], 'map')).toEqual({
        isValid: false,
        errorTitle: DONNEES_INCOMPATIBLES,
        errorMessage: 'Les données doivent être au format map: [{code: "XX", value: 123}] ou [["code", value]]',
      });
    });

    it('rejette un tuple dont la première position n\'est pas une chaîne', () => {
      expect(validateChartData([{ data: [[5, 10]] }], 'map').isValid).toBeFalse();
    });

    it('ne valide le format map que pour le type map', () => {
      expect(validateChartData([{ data: [{ value: 5 }] }], 'pie')).toEqual({ isValid: true });
    });
  });
});
