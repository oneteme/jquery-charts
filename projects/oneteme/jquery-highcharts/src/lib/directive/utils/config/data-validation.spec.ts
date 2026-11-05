import {
  detectDataAnomalies,
  extractAndValidateValue,
  isValidValue,
  validateAndCleanData,
  validateAndCleanSeriesData,
  validateDataWithReport,
} from './data-validation';

describe('data-validation', () => {
  describe('isValidValue', () => {
    it('accepte les nombres finis, y compris zéro et négatifs', () => {
      expect(isValidValue(0)).toBeTrue();
      expect(isValidValue(-3.5)).toBeTrue();
    });

    it('rejette null, undefined, NaN, Infinity et les non-nombres', () => {
      expect(isValidValue(null)).toBeFalse();
      expect(isValidValue(undefined)).toBeFalse();
      expect(isValidValue(NaN)).toBeFalse();
      expect(isValidValue(Infinity)).toBeFalse();
      expect(isValidValue('12')).toBeFalse();
    });
  });

  describe('extractAndValidateValue', () => {
    it('retourne null pour null ou undefined', () => {
      expect(extractAndValidateValue(null)).toBeNull();
      expect(extractAndValidateValue(undefined)).toBeNull();
    });

    it('lit directement un nombre valide et rejette NaN', () => {
      expect(extractAndValidateValue(7)).toBe(7);
      expect(extractAndValidateValue(NaN)).toBeNull();
    });

    it('lit la seconde position d\'un tuple', () => {
      expect(extractAndValidateValue(['A', 5])).toBe(5);
      expect(extractAndValidateValue(['A'])).toBeNull();
      expect(extractAndValidateValue(['A', null])).toBeNull();
    });

    it('lit y puis value pour un objet, avec repli sur value quand y est null', () => {
      expect(extractAndValidateValue({ y: 7 })).toBe(7);
      expect(extractAndValidateValue({ value: 3 })).toBe(3);
      expect(extractAndValidateValue({ y: null, value: 4 })).toBe(4);
    });

    it('retourne null pour un objet dont y n\'est pas numérique', () => {
      expect(extractAndValidateValue({ y: 'abc' })).toBeNull();
    });

    it('retourne null pour un objet sans y ni value', () => {
      expect(extractAndValidateValue({ low: 1, high: 2 })).toBeNull();
    });

    it('retourne null pour un type non supporté (chaîne)', () => {
      expect(extractAndValidateValue('12')).toBeNull();
    });
  });

  describe('validateAndCleanSeriesData', () => {
    it('retourne la série telle quelle si elle est absente ou sans données', () => {
      expect(validateAndCleanSeriesData(null)).toBeNull();
      const sansData = { name: 'A' };
      expect(validateAndCleanSeriesData(sansData)).toBe(sansData);
    });

    it('filtre les nombres non finis et conserve les zéros', () => {
      const result = validateAndCleanSeriesData({ name: 'A', data: [1, NaN, 0, Infinity, 2] });
      expect(result.data).toEqual([1, 0, 2]);
    });

    it('conserve les points null, traités comme des trous par Highcharts', () => {
      const result = validateAndCleanSeriesData({ data: [1, null, 2] });
      expect(result.data).toEqual([1, null, 2]);
    });

    it('conserve les autres propriétés de la série', () => {
      const result = validateAndCleanSeriesData({ name: 'A', color: 'red', data: [1, NaN] });
      expect(result).toEqual({ name: 'A', color: 'red', data: [1] });
    });

    it('filtre les tuples dont la valeur est absente ou invalide', () => {
      const result = validateAndCleanSeriesData({
        data: [['A', 1], ['B', undefined], ['C', NaN], ['D', 4]],
      });
      expect(result.data).toEqual([['A', 1], ['D', 4]]);
    });

    it('filtre les objets y invalides', () => {
      const result = validateAndCleanSeriesData({ data: [{ y: 1 }, { y: null }, { y: NaN }] });
      expect(result.data).toEqual([{ y: 1 }]);
    });

    it('exige low et high valides pour un point range', () => {
      const result = validateAndCleanSeriesData({
        data: [{ low: 1, high: 5 }, { low: 1, high: NaN }, { low: null, high: 3 }],
      });
      expect(result.data).toEqual([{ low: 1, high: 5 }]);
    });

    it('filtre les points carte dont la value n\'est pas un nombre valide', () => {
      const result = validateAndCleanSeriesData({
        data: [
          { code: 'FR', value: 10 },
          { code: 'DE', value: null },
          { code: 'IT', value: NaN },
          { code: 'ES', value: 'x' },
        ],
      });
      expect(result.data).toEqual([{ code: 'FR', value: 10 }]);
    });

    it('filtre les objets value sans clé carte selon isValidValue', () => {
      const result = validateAndCleanSeriesData({ data: [{ value: 5 }, { value: Infinity }] });
      expect(result.data).toEqual([{ value: 5 }]);
    });
  });

  describe('validateAndCleanData', () => {
    it('retourne la valeur reçue si la liste est vide ou absente', () => {
      expect(validateAndCleanData([])).toEqual([]);
      expect(validateAndCleanData(null as any)).toBeNull();
    });

    it('supprime les séries qui ne contiennent plus aucun point valide ou sans données', () => {
      const result = validateAndCleanData([
        { name: 'A', data: [NaN] },
        { name: 'B', data: [1, 2] },
        { name: 'C' },
      ]);
      expect(result).toEqual([{ name: 'B', data: [1, 2] }]);
    });
  });

  describe('detectDataAnomalies', () => {
    it('signale l\'absence de série', () => {
      expect(detectDataAnomalies([])).toEqual(['Aucune série de données fournie']);
      expect(detectDataAnomalies(null as any)).toEqual(['Aucune série de données fournie']);
    });

    it('signale une série sans donnée en utilisant son nom ou son rang par défaut', () => {
      expect(detectDataAnomalies([{ name: 'Ventes', data: [] }])).toEqual(['Ventes: Aucune donnée']);
      expect(detectDataAnomalies([{ data: [1] }, {}])).toEqual(['Série 2: Aucune donnée']);
    });

    it('compte les null, NaN et Infinity invalides par catégorie', () => {
      const warnings = detectDataAnomalies([{ name: 'Ventes', data: [null, NaN, Infinity, 5] }]);
      expect(warnings).toEqual([
        'Ventes: 3 valeur(s) invalide(s) (1 null/undefined, 1 NaN, 1 Infinity)',
      ]);
    });

    it('signale une longueur différente de celle de la première série', () => {
      const warnings = detectDataAnomalies([
        { name: 'A', data: [1, 2, 3] },
        { name: 'B', data: [1, 2] },
      ]);
      expect(warnings).toEqual(['B: Longueur différente (2 vs 3 dans la première série)']);
    });

    it('ne signale rien pour des séries complètes et de même longueur', () => {
      expect(detectDataAnomalies([{ name: 'A', data: [1, 2] }, { name: 'B', data: [3, 4] }])).toEqual([]);
    });
  });

  describe('validateDataWithReport', () => {
    it('est valide sans avertissement ni point retiré pour des données propres', () => {
      const series = [{ name: 'A', data: [1, 2] }];
      const report = validateDataWithReport(series);
      expect(report.isValid).toBeTrue();
      expect(report.warnings).toEqual([]);
      expect(report.removedPoints).toBe(0);
      expect(report.cleanedData).toEqual(series);
    });

    it('compte les points retirés et marque le rapport comme invalide', () => {
      const report = validateDataWithReport([{ name: 'A', data: [1, NaN, 3] }]);
      expect(report.isValid).toBeFalse();
      expect(report.removedPoints).toBe(1);
      expect(report.cleanedData).toEqual([{ name: 'A', data: [1, 3] }]);
      expect(report.warnings).toEqual(['A: 1 valeur(s) invalide(s) (1 NaN)']);
    });

    it('signale une liste vide comme invalide', () => {
      const report = validateDataWithReport([]);
      expect(report.isValid).toBeFalse();
      expect(report.removedPoints).toBe(0);
      expect(report.cleanedData).toEqual([]);
      expect(report.warnings).toEqual(['Aucune série de données fournie']);
    });
  });
});
