import {
  configurePolarChart,
  enforceCriticalPolarOptions,
  isPolarChart,
} from './polar-config';

describe('polar-config', () => {
  describe('isPolarChart', () => {
    it('reconnaît les types polaires polar, radar, radarArea et radialBar', () => {
      expect(isPolarChart('polar')).toBeTrue();
      expect(isPolarChart('radar')).toBeTrue();
      expect(isPolarChart('radarArea')).toBeTrue();
      expect(isPolarChart('radialBar')).toBeTrue();
    });

    it('rejette les types non polaires, y compris radial', () => {
      expect(isPolarChart('radial')).toBeFalse();
      expect(isPolarChart('bar')).toBeFalse();
      expect(isPolarChart('pie')).toBeFalse();
    });
  });

  describe('configurePolarChart', () => {
    it("active le mode polaire et crée les axes lorsqu'ils sont absents", () => {
      const options: any = {};

      configurePolarChart(options, 'polar');

      expect(options.chart.polar).toBeTrue();
      expect(options.xAxis.tickmarkPlacement).toBe('on');
      expect(options.xAxis.lineWidth).toBe(0);
      expect(options.yAxis.lineWidth).toBe(0);
      expect(options.yAxis.min).toBe(0);
    });

    it('conserve les options de graphique existantes', () => {
      const options: any = { chart: { backgroundColor: '#fff' } };

      configurePolarChart(options, 'polar');

      expect(options.chart.backgroundColor).toBe('#fff');
      expect(options.chart.polar).toBeTrue();
    });

    it('configure le type polar avec grille circulaire, colonnes empilées et panneau à 85 %', () => {
      const options: any = {};

      configurePolarChart(options, 'polar');

      expect(options.yAxis.gridLineInterpolation).toBe('circle');
      expect(options.plotOptions.column).toEqual({
        stacking: 'normal',
        borderWidth: 0,
        pointPadding: 0,
        groupPadding: 0,
      });
      expect(options.pane.size).toBe('85%');
      expect(options.plotOptions.series.pointPlacement).toBe('between');
    });

    it('configure le type radar avec grille en polygone sans plotOptions', () => {
      const options: any = {};

      configurePolarChart(options, 'radar');

      expect(options.yAxis.gridLineInterpolation).toBe('polygon');
      expect(options.plotOptions).toBeUndefined();
    });

    it('configure le type radarArea avec grille en polygone et remplissage à 0.5', () => {
      const options: any = {};

      configurePolarChart(options, 'radarArea');

      expect(options.yAxis.gridLineInterpolation).toBe('polygon');
      expect(options.plotOptions.area).toEqual({ fillOpacity: 0.5 });
    });

    it('configure le type radialBar avec graphique inversé et panneau à 360 degrés', () => {
      const options: any = {};

      configurePolarChart(options, 'radialBar');

      expect(options.chart.inverted).toBeTrue();
      expect(options.pane.startAngle).toBe(0);
      expect(options.pane.endAngle).toBe(360);
      expect(options.pane.background).toEqual([]);
    });

    it('configure les axes et colonnes du type radialBar', () => {
      const options: any = {};

      configurePolarChart(options, 'radialBar');

      expect(options.xAxis.tickInterval).toBe(1);
      expect(options.xAxis.showLastLabel).toBeFalse();
      expect(options.yAxis.gridLineWidth).toBe(0);
      expect(options.yAxis.reversedStacks).toBeFalse();
      expect(options.yAxis.labels).toEqual({ enabled: true });
      expect(options.plotOptions.column.groupPadding).toBe(0.15);
      expect(options.plotOptions.column.pointPlacement).toBe('on');
    });

    it("calcule les bornes de l'axe X radialBar à partir des catégories", () => {
      const options: any = {
        xAxis: { categories: ['A', 'B', 'C', 'D'] },
        series: [{ data: [1, 2] }],
      };

      configurePolarChart(options, 'radialBar');

      expect(options.xAxis.min).toBe(-0.5);
      expect(options.xAxis.max).toBe(3.5);
    });

    it("calcule les bornes de l'axe X radialBar à partir des données de la série sans catégories", () => {
      const options: any = { series: [{ data: [1, 2] }] };

      configurePolarChart(options, 'radialBar');

      expect(options.xAxis.min).toBe(-0.5);
      expect(options.xAxis.max).toBe(1.5);
    });

    it("ne remplace pas les bornes de l'axe X radialBar déjà définies", () => {
      const options: any = {
        xAxis: { min: 0, max: 10 },
        series: [{ data: [1, 2, 3] }],
      };

      configurePolarChart(options, 'radialBar');

      expect(options.xAxis.min).toBe(0);
      expect(options.xAxis.max).toBe(10);
    });

    it('ne définit pas de bornes radialBar sans aucune donnée', () => {
      const options: any = { series: [{ data: [] }] };

      configurePolarChart(options, 'radialBar');

      expect(options.xAxis.min).toBeUndefined();
      expect(options.xAxis.max).toBeUndefined();
    });
  });

  describe('enforceCriticalPolarOptions', () => {
    it('ne modifie pas les options pour un type non polaire', () => {
      const options: any = {};

      enforceCriticalPolarOptions(options, 'bar');

      expect(options).toEqual({});
    });

    it('force chart.polar à true pour un type polaire', () => {
      const options: any = { chart: { polar: false } };

      enforceCriticalPolarOptions(options, 'polar');

      expect(options.chart.polar).toBeTrue();
    });

    it('force la grille circulaire pour le type polar', () => {
      const options: any = {};

      enforceCriticalPolarOptions(options, 'polar');

      expect(options.yAxis.gridLineInterpolation).toBe('circle');
    });

    it('force la grille en polygone pour radar et radarArea', () => {
      const radarOptions: any = {};
      const radarAreaOptions: any = {};

      enforceCriticalPolarOptions(radarOptions, 'radar');
      enforceCriticalPolarOptions(radarAreaOptions, 'radarArea');

      expect(radarOptions.yAxis.gridLineInterpolation).toBe('polygon');
      expect(radarAreaOptions.yAxis.gridLineInterpolation).toBe('polygon');
    });

    it('force les options critiques du type radialBar', () => {
      const options: any = {};

      enforceCriticalPolarOptions(options, 'radialBar');

      expect(options.chart.polar).toBeTrue();
      expect(options.chart.inverted).toBeTrue();
      expect(options.xAxis.showLastLabel).toBeFalse();
      expect(options.xAxis.gridLineWidth).toBe(0);
      expect(options.xAxis.lineWidth).toBe(0);
      expect(options.yAxis.gridLineWidth).toBe(0);
    });
  });
});
