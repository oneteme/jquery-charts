import {
  configureSimpleChart,
  enforceCriticalSimpleOptions,
  isSimpleChart,
  transformSimpleChartData,
} from './simple-chart-config';

describe('simple-chart-config', () => {
  describe('isSimpleChart', () => {
    it('reconnaît les types pie, donut, funnel, pyramid et semi-circle', () => {
      expect(isSimpleChart('pie')).toBeTrue();
      expect(isSimpleChart('donut')).toBeTrue();
      expect(isSimpleChart('funnel')).toBeTrue();
      expect(isSimpleChart('pyramid')).toBeTrue();
      expect(isSimpleChart('semi-circle')).toBeTrue();
    });

    it('rejette les autres types de graphique', () => {
      expect(isSimpleChart('bar')).toBeFalse();
      expect(isSimpleChart('map')).toBeFalse();
    });
  });

  describe('transformSimpleChartData', () => {
    it('retourne une entrée vide ou nulle telle quelle', () => {
      const empty: any[] = [];

      expect(transformSimpleChartData(empty, true)).toBe(empty);
      expect(transformSimpleChartData(null as any, false)).toBeNull();
    });

    it('convertit une série standard en un point par catégorie vers le format simple', () => {
      const result: any = transformSimpleChartData([{ name: 'S', data: [1, 2] }], true, ['A', 'B']);

      expect(result[0].data).toEqual([
        { name: 'A', y: 1 },
        { name: 'B', y: 2 },
      ]);
    });

    it('agrège la somme absolue de chaque série en multi-séries vers le format simple', () => {
      const result: any = transformSimpleChartData(
        [{ name: 'A', data: [1, -2] }, { data: [4] }],
        true
      );

      expect(result[0].name).toBe('Total par série');
      expect(result[0].data).toEqual([
        { name: 'A', y: 3 },
        { name: 'Série', y: 4 },
      ]);
    });

    it('convertit un format simple en standard et retourne les catégories', () => {
      const result: any = transformSimpleChartData(
        [{ name: 'S', data: [{ name: 'A', y: 1 }, { name: 'B', y: 2 }] }],
        false
      );

      expect(result.categories).toEqual(['A', 'B']);
      expect(result.series[0].data[1]).toEqual({ x: 1, y: 2, name: 'B' });
    });

    it('accepte la clé value comme valeur du format simple', () => {
      const result: any = transformSimpleChartData(
        [{ name: 'S', data: [{ name: 'A', value: 7 }] }],
        false
      );

      expect(result.series[0].data[0].y).toBe(7);
    });

    it("retourne la série inchangée lorsqu'elle n'est pas au format simple", () => {
      const series = [{ name: 'S', data: [1, 2] }];

      expect(transformSimpleChartData(series, false)).toBe(series);
    });

    it('retourne la série inchangée pour plusieurs séries en source', () => {
      const series = [
        { name: 'A', data: [{ name: 'X', y: 1 }] },
        { name: 'B', data: [{ name: 'Y', y: 2 }] },
      ];

      expect(transformSimpleChartData(series, false)).toBe(series);
    });
  });

  describe('configureSimpleChart', () => {
    it('ne modifie pas les options pour un type non simple', () => {
      const options: any = {};

      configureSimpleChart(options, 'bar');

      expect(options).toEqual({});
    });

    it('configure le camembert avec un trou nul et les étiquettes de données', () => {
      const options: any = {};

      configureSimpleChart(options, 'pie');

      expect(options.plotOptions.pie.innerSize).toBe('0%');
      expect(options.plotOptions.pie.dataLabels).toEqual({
        enabled: true,
        format: '{point.name}: {point.percentage:.1f}%',
      });
      expect(options.plotOptions.pie.showInLegend).toBeTrue();
    });

    it('configure le donut avec un trou de 50 %', () => {
      const options: any = {};

      configureSimpleChart(options, 'donut');

      expect(options.plotOptions.pie.innerSize).toBe('50%');
    });

    it("configure l'entonnoir avec son col et les étiquettes de données", () => {
      const options: any = {};

      configureSimpleChart(options, 'funnel');

      expect(options.plotOptions.funnel.neckWidth).toBe('30%');
      expect(options.plotOptions.funnel.neckHeight).toBe('25%');
      expect(options.plotOptions.funnel.dataLabels.enabled).toBeTrue();
      expect(options.plotOptions.funnel.showInLegend).toBeTrue();
    });

    it('configure la pyramide sans options de col', () => {
      const options: any = {};

      configureSimpleChart(options, 'pyramid');

      expect(options.plotOptions.pyramid.showInLegend).toBeTrue();
      expect(options.plotOptions.pyramid.neckWidth).toBeUndefined();
    });

    it('crée plotOptions pour le semi-circle sans option spécifique', () => {
      const options: any = {};

      configureSimpleChart(options, 'semi-circle');

      expect(options.plotOptions).toEqual({});
    });

    it('conserve les options pie existantes lors de la configuration', () => {
      const options: any = { plotOptions: { pie: { borderWidth: 2 } } };

      configureSimpleChart(options, 'pie');

      expect(options.plotOptions.pie.borderWidth).toBe(2);
      expect(options.plotOptions.pie.innerSize).toBe('0%');
    });
  });

  describe('enforceCriticalSimpleOptions', () => {
    it('ne modifie pas les options pour un type simple', () => {
      const options: any = {};

      enforceCriticalSimpleOptions(options, 'pie');

      expect(options).toEqual({});
    });

    it('ne modifie pas les options pour un type non simple', () => {
      const options: any = { chart: {} };

      enforceCriticalSimpleOptions(options, 'bar');

      expect(options).toEqual({ chart: {} });
    });
  });
});
