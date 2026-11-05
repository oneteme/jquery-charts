import { Highcharts } from '../highcharts-modules';
import {
  applyChartConfigurations,
  detectPreviousChartType,
  enforceCriticalOptions,
  needsDataConversion,
  transformChartData,
} from './chart-config-registry';

describe('chart-config-registry', () => {
  describe('applyChartConfigurations', () => {
    it('applique la configuration polaire pour un type polaire', () => {
      const options: any = {};

      applyChartConfigurations(options, 'polar');

      expect(options.chart.polar).toBeTrue();
      expect(options.pane.size).toBe('85%');
    });

    it('désactive les étiquettes de données pour un graphe columnrange', () => {
      const options: any = {};

      applyChartConfigurations(options, 'columnrange');

      expect(options.plotOptions.columnrange.dataLabels.enabled).toBeFalse();
    });

    it('applique les tailles de bulles par défaut', () => {
      const options: any = {};

      applyChartConfigurations(options, 'bubble');

      expect(options.plotOptions.bubble.minSize).toBe(3);
      expect(options.plotOptions.bubble.maxSize).toBe(20);
    });

    it('applique la configuration heatmap (bordures et colorAxis)', () => {
      const options: any = {};

      applyChartConfigurations(options, 'heatmap');

      expect(options.plotOptions.heatmap.borderWidth).toBe(1);
      expect(options.colorAxis.minColor).toBe('#FFFFFF');
      expect(options.colorAxis.maxColor).toBe((Highcharts as any).getOptions().colors[0]);
    });

    it('applique le layout squarified pour un treemap', () => {
      const options: any = {};

      applyChartConfigurations(options, 'treemap');

      expect(options.plotOptions.treemap.layoutAlgorithm).toBe('squarified');
    });

    it('force le type de graphe map pour un type map', () => {
      const options: any = {};

      applyChartConfigurations(options, 'map');

      expect(options.chart.type).toBe('map');
    });

    it('applique un trou nul pour pie et un trou de 50 % pour donut', () => {
      const pieOptions: any = {};
      const donutOptions: any = {};

      applyChartConfigurations(pieOptions, 'pie');
      applyChartConfigurations(donutOptions, 'donut');

      expect(pieOptions.plotOptions.pie.innerSize).toBe('0%');
      expect(donutOptions.plotOptions.pie.innerSize).toBe('50%');
    });

    it('calcule les bornes de l axe X radialBar à partir des données de la série', () => {
      const options: any = { series: [{ data: [1, 2, 3] }] };

      applyChartConfigurations(options, 'radialBar');

      expect(options.xAxis.min).toBe(-0.5);
      expect(options.xAxis.max).toBe(2.5);
    });

    it('ne modifie pas les options pour un type sans configurateur', () => {
      const options: any = {};

      applyChartConfigurations(options, 'bar');

      expect(options).toEqual({});
    });

    it('ne modifie pas les options pour un type inconnu', () => {
      const options: any = {};

      applyChartConfigurations(options, 'graph');

      expect(options).toEqual({});
    });

    it('ne modifie pas les options pour scatter (configuration vide)', () => {
      const options: any = {};

      applyChartConfigurations(options, 'scatter');

      expect(options).toEqual({});
    });
  });

  describe('enforceCriticalOptions', () => {
    it('force le marqueur visible pour un nuage de points scatter', () => {
      const options: any = { plotOptions: { scatter: { marker: { enabled: false } } } };

      enforceCriticalOptions(options, 'scatter');

      expect(options.plotOptions.scatter.marker.enabled).toBeTrue();
      expect(options.plotOptions.scatter.marker.radius).toBe(4);
      expect(options.plotOptions.scatter.lineWidth).toBe(0);
    });

    it('crée la colorAxis d une heatmap lorsqu elle est absente', () => {
      const options: any = {};

      enforceCriticalOptions(options, 'heatmap');

      expect(options.colorAxis.min).toBe(0);
      expect(options.colorAxis.minColor).toBe('#FFFFFF');
      expect(options.colorAxis.maxColor).toBe((Highcharts as any).getOptions().colors[0]);
    });

    it('conserve la colorAxis existante d une heatmap', () => {
      const colorAxis = { min: 2, maxColor: '#123456' };
      const options: any = { colorAxis };

      enforceCriticalOptions(options, 'heatmap');

      expect(options.colorAxis).toBe(colorAxis);
    });

    it('force les options polaires radialBar (chart polar et inversé)', () => {
      const options: any = {};

      enforceCriticalOptions(options, 'radialBar');

      expect(options.chart.polar).toBeTrue();
      expect(options.chart.inverted).toBeTrue();
      expect(options.xAxis.showLastLabel).toBeFalse();
    });

    it('renseigne les tailles de bulles par défaut lorsqu elles sont absentes', () => {
      const options: any = {};

      enforceCriticalOptions(options, 'bubble');

      expect(options.plotOptions.bubble.marker.enabled).toBeTrue();
      expect(options.plotOptions.bubble.minSize).toBe(3);
      expect(options.plotOptions.bubble.maxSize).toBe(20);
    });

    it('ne modifie pas les options pour un type sans configurateur critique', () => {
      const options: any = {};

      enforceCriticalOptions(options, 'bar');

      expect(options).toEqual({});
    });

    it('ne modifie pas les options des plages (configuration critique vide)', () => {
      const options: any = {};

      enforceCriticalOptions(options, 'columnrange');

      expect(options).toEqual({});
    });
  });

  describe('transformChartData', () => {
    it('retourne les séries d origine sans configurateur de transformation', () => {
      const series = [{ name: 'S', data: [1, 2] }];

      const result = transformChartData(series, 'bar', 'bar');

      expect(result.series).toBe(series);
      expect(result.yCategories).toBeUndefined();
      expect(result.categories).toBeUndefined();
    });

    it('convertit une série de plage vers un format simple (moyenne low/high)', () => {
      const series = [{ name: 'S', data: [{ x: 0, low: 1, high: 3 }] }];

      const result = transformChartData(series, 'columnrange', 'bar');

      expect(result.series[0].name).toBe('S');
      expect(result.series[0].data[0].x).toBe(0);
      expect(result.series[0].data[0].y).toBe(2);
    });

    it('convertit une série simple en plage pour une cible columnrange', () => {
      const series = [{ name: 'S', data: [1, 3, 2, 4] }];

      const result = transformChartData(series, 'bar', 'columnrange');

      expect(result.series[0].data).toEqual([
        jasmine.objectContaining({ x: 0, low: 1, high: 3 }),
        jasmine.objectContaining({ x: 2, low: 2, high: 4 }),
      ]);
    });

    it('convertit une matrice vers heatmap et expose les catégories Y', () => {
      const series = [
        { name: 'A', data: [1, 2] },
        { name: 'B', data: [3, 4] },
      ];

      const result = transformChartData(series, 'bar', 'heatmap');

      expect(result.series.length).toBe(1);
      expect(result.series[0].data).toEqual([
        [0, 0, 1],
        [1, 0, 2],
        [0, 1, 3],
        [1, 1, 4],
      ]);
      expect(result.yCategories).toEqual(['A', 'B']);
    });

    it('restaure la matrice d origine depuis une heatmap', () => {
      const original = [
        { name: 'A', data: [1, 2] },
        { name: 'B', data: [3, 4] },
      ];
      const heatmap = transformChartData(original, 'bar', 'heatmap');

      const result = transformChartData(heatmap.series, 'heatmap', 'bar');

      expect(result.series).toBe(original);
    });

    it('restaure les données d origine après un aller-retour bulle', () => {
      const original = [{ name: 'S', data: [[1, 2], [3, 6]] }];
      const bubble = transformChartData(original, 'bar', 'bubble');
      expect(bubble.series[0].data[1][2]).toBeCloseTo(20);

      const result = transformChartData(bubble.series, 'bubble', 'bar');

      expect(result.series[0].data).toEqual([[1, 2], [3, 6]]);
    });

    it('extrait les catégories d un camembert vers un format standard', () => {
      const series = [{ name: 'S', data: [{ name: 'A', y: 1 }, { name: 'B', y: 2 }] }];

      const result = transformChartData(series, 'pie', 'bar');

      expect(result.categories).toEqual(['A', 'B']);
      expect(result.series[0].data[1]).toEqual({ x: 1, y: 2, name: 'B' });
    });

    it('applique les catégories fournies lors de la conversion vers un camembert', () => {
      const series = [{ name: 'S', data: [1, 2] }];

      const result = transformChartData(series, 'bar', 'pie', ['X', 'Y']);

      expect(result.series[0].data).toEqual([
        { name: 'X', y: 1 },
        { name: 'Y', y: 2 },
      ]);
    });

    it('convertit des valeurs vers un format carte en utilisant les catégories comme clés', () => {
      const series = [{ name: 'S', data: [1, 2] }];

      const result = transformChartData(series, 'bar', 'map', ['75', '69']);

      expect(result.series[0].type).toBe('map');
      expect(result.series[0].data).toEqual([
        ['75', 1],
        ['69', 2],
      ]);
    });

    it('extrait les codes géographiques d une carte vers un format standard', () => {
      const series = [{ name: 'S', data: [{ code: '75', value: 1 }, { code: '69', value: 2 }] }];

      const result = transformChartData(series, 'map', 'bar');

      expect(result.series[0].data).toEqual([1, 2]);
      expect(result.categories).toEqual(['75', '69']);
    });
  });

  describe('needsDataConversion', () => {
    it('signale une conversion pour une plage vers un type non plage', () => {
      const series = [{ data: [{ x: 0, low: 1, high: 2 }] }];

      expect(needsDataConversion(series, 'bar')).toBeTrue();
    });

    it('ne signale pas de conversion pour une plage vers columnrange', () => {
      const series = [{ data: [{ x: 0, low: 1, high: 2 }] }];

      expect(needsDataConversion(series, 'columnrange')).toBeFalse();
    });

    it('signale une conversion pour un point bulle vers un type non bulle', () => {
      const series = [{ data: [{ x: 0, y: 1, z: 5 }] }];

      expect(needsDataConversion(series, 'bar')).toBeTrue();
    });

    it('ne signale pas de conversion pour un point bulle vers bubble', () => {
      const series = [{ data: [{ x: 0, y: 1, z: 5 }] }];

      expect(needsDataConversion(series, 'bubble')).toBeFalse();
    });

    it('signale une conversion pour une heatmap vers un type non heatmap', () => {
      const series = [{ data: [{ x: 0, y: 1, value: 5 }] }];

      expect(needsDataConversion(series, 'bar')).toBeTrue();
      expect(needsDataConversion(series, 'heatmap')).toBeFalse();
    });

    it('signale une conversion pour un treemap vers un type non treemap', () => {
      const series = [{ data: [{ id: 'a', value: 1 }] }];

      expect(needsDataConversion(series, 'bar')).toBeTrue();
      expect(needsDataConversion(series, 'treemap')).toBeFalse();
    });

    it('signale une conversion pour une carte vers un type non carte', () => {
      const series = [{ data: [{ code: '75', value: 1 }] }];

      expect(needsDataConversion(series, 'bar')).toBeTrue();
      expect(needsDataConversion(series, 'map')).toBeFalse();
    });

    it('détecte une carte au format tuple [code, valeur]', () => {
      const series = [{ data: [['75', 1]] }];

      expect(needsDataConversion(series, 'bar')).toBeTrue();
    });

    it('ne signale pas de conversion pour des paires x/y simples', () => {
      const series = [{ data: [[0, 1], [1, 2]] }];

      expect(needsDataConversion(series, 'bar')).toBeFalse();
    });

    it('ne signale pas de conversion pour des séries vides ou sans données', () => {
      expect(needsDataConversion([], 'bar')).toBeFalse();
      expect(needsDataConversion([{ name: 'S' }], 'bar')).toBeFalse();
      expect(needsDataConversion([{ name: 'S', data: [] }], 'bar')).toBeFalse();
    });
  });

  describe('detectPreviousChartType', () => {
    it('détecte un format plage (low/high) comme columnrange', () => {
      const series = [{ data: [{ x: 0, low: 1, high: 2 }] }];

      expect(detectPreviousChartType(series, 'bar')).toBe('columnrange');
    });

    it('privilégie le format plage avant le format bulle', () => {
      const series = [{ data: [{ x: 0, low: 1, high: 2, z: 3 }] }];

      expect(detectPreviousChartType(series, 'bar')).toBe('columnrange');
    });

    it('détecte un format bulle (z)', () => {
      const series = [{ data: [{ x: 0, y: 1, z: 5 }] }];

      expect(detectPreviousChartType(series, 'bar')).toBe('bubble');
    });

    it('détecte un format heatmap (x, y, value)', () => {
      const series = [{ data: [{ x: 0, y: 1, value: 5 }] }];

      expect(detectPreviousChartType(series, 'bar')).toBe('heatmap');
    });

    it('détecte un format treemap (id)', () => {
      const series = [{ data: [{ id: 'a', value: 1 }] }];

      expect(detectPreviousChartType(series, 'bar')).toBe('treemap');
    });

    it('détecte un format carte (code)', () => {
      const series = [{ data: [{ code: '75', value: 1 }] }];

      expect(detectPreviousChartType(series, 'bar')).toBe('map');
    });

    it('détecte un format carte tuple [code, valeur]', () => {
      const series = [{ data: [['75', 1]] }];

      expect(detectPreviousChartType(series, 'bar')).toBe('map');
    });

    it('retourne le type courant lorsque aucun format spécifique n est détecté', () => {
      expect(detectPreviousChartType([{ data: [1, 2, 3] }], 'bar')).toBe('bar');
      expect(detectPreviousChartType([], 'line')).toBe('line');
    });
  });
});
