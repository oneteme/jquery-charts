import {
  configureScatterChart,
  enforceCriticalScatterOptions,
  isScatterChart,
} from './scatter-config';

describe('scatter-config', () => {
  describe('isScatterChart', () => {
    it('reconnaît le type scatter', () => {
      expect(isScatterChart('scatter')).toBeTrue();
    });

    it('rejette les autres types de graphique', () => {
      expect(isScatterChart('bubble')).toBeFalse();
      expect(isScatterChart('line')).toBeFalse();
    });
  });

  describe('configureScatterChart', () => {
    it('ne modifie pas les options pour un type scatter', () => {
      const options: any = {};

      configureScatterChart(options, 'scatter');

      expect(options).toEqual({});
    });

    it('ne modifie pas les options pour un autre type', () => {
      const options: any = { plotOptions: { line: {} } };

      configureScatterChart(options, 'line');

      expect(options).toEqual({ plotOptions: { line: {} } });
    });
  });

  describe('enforceCriticalScatterOptions', () => {
    it("crée la configuration scatter complète lorsqu'elle est absente", () => {
      const options: any = {};

      enforceCriticalScatterOptions(options, 'scatter');

      expect(options.plotOptions.scatter.marker.enabled).toBeTrue();
      expect(options.plotOptions.scatter.marker.radius).toBe(4);
      expect(options.plotOptions.scatter.lineWidth).toBe(0);
    });

    it("force le marqueur visible même s'il était désactivé", () => {
      const options: any = {
        plotOptions: { scatter: { marker: { enabled: false } } },
      };

      enforceCriticalScatterOptions(options, 'scatter');

      expect(options.plotOptions.scatter.marker.enabled).toBeTrue();
    });

    it('conserve un rayon de marqueur personnalisé', () => {
      const options: any = {
        plotOptions: { scatter: { marker: { radius: 8 } } },
      };

      enforceCriticalScatterOptions(options, 'scatter');

      expect(options.plotOptions.scatter.marker.radius).toBe(8);
    });

    it('conserve les autres options de plotOptions', () => {
      const options: any = { plotOptions: { line: { lineWidth: 3 } } };

      enforceCriticalScatterOptions(options, 'scatter');

      expect(options.plotOptions.line).toEqual({ lineWidth: 3 });
      expect(options.plotOptions.scatter.lineWidth).toBe(0);
    });

    it('ne modifie pas les options pour un type non scatter', () => {
      const options: any = {};

      enforceCriticalScatterOptions(options, 'line');

      expect(options).toEqual({});
    });
  });
});
