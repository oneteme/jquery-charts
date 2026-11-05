import { FRENCH_HIGHCHARTS_LANG } from '../utils';
import { buildHighchartsOptions, HighchartsOptionsPipelineContext } from './highcharts-options.pipeline';

function build(overrides: Partial<HighchartsOptionsPipelineContext> = {}): any {
  const context: HighchartsOptionsPipelineContext = {
    chartType: 'bar',
    highchartsType: 'column',
    config: { title: 'Titre', subtitle: 'Sous-titre' } as any,
    theme: null,
    loadingLabel: 'Chargement des données...',
    noDataLabel: 'Aucune donnée',
    debug: false,
    applySeriesAxes: () => undefined,
    applyRuntimeEvents: () => undefined,
    ...overrides,
  };
  return buildHighchartsOptions(context);
}

describe('buildHighchartsOptions', () => {
  describe('chemin renderedOption', () => {
    it('fusionne le thème puis renderedOption, renderedOption ayant la priorité', () => {
      const options = build({
        theme: { chart: { type: 'line' }, title: { text: 'Thème' } } as any,
        renderedOption: { title: { text: 'Rendu' } } as any,
      });

      expect(options.title.text).toBe('Rendu');
      expect(options.chart.type).toBe('line');
    });

    it('applique les valeurs par défaut credits, exporting, fond et langue', () => {
      const options = build({ renderedOption: {} as any });

      expect(options.credits.enabled).toBeFalse();
      expect(options.exporting.enabled).toBeFalse();
      expect(options.chart.backgroundColor).toBe('transparent');
      expect(options.lang.noData).toBe(FRENCH_HIGHCHARTS_LANG.noData);
    });

    it('ajoute les durées de chargement par défaut', () => {
      const options = build({ renderedOption: {} as any });

      expect(options.loading.showDuration).toBe(100);
      expect(options.loading.hideDuration).toBe(100);
    });

    it('conserve la durée de chargement fournie par renderedOption', () => {
      const options = build({ renderedOption: { loading: { showDuration: 300 } } as any });

      expect(options.loading.showDuration).toBe(300);
      expect(options.loading.hideDuration).toBe(100);
    });

    it('appelle applyRuntimeEvents avec les options finales', () => {
      const applyRuntimeEvents = jasmine.createSpy('applyRuntimeEvents');
      const options = build({ renderedOption: {} as any, applyRuntimeEvents });

      expect(applyRuntimeEvents).toHaveBeenCalledWith(options);
    });

    it('ignore les séries et axes préparés', () => {
      const applySeriesAxes = jasmine.createSpy('applySeriesAxes');
      const options = build({
        renderedOption: { series: [{ name: 'Rendu', data: [1] }] } as any,
        preparedData: { series: [{ name: 'Préparée', data: [2] }] },
        applySeriesAxes,
      });

      expect(applySeriesAxes).not.toHaveBeenCalled();
      expect(options.series.map((serie: any) => serie.name)).toEqual(['Rendu']);
    });

    it('ne modifie pas le thème fourni', () => {
      const theme = { title: { text: 'Thème' } } as any;
      build({ theme, renderedOption: { title: { text: 'Rendu' } } as any });

      expect(theme.title.text).toBe('Thème');
    });
  });

  describe('chemin standard', () => {
    it('initialise le type Highcharts et les titres depuis la configuration', () => {
      const options = build({ highchartsType: 'column', config: { title: 'Ventes', subtitle: 'Annuelles' } as any });

      expect(options.chart.type).toBe('column');
      expect(options.chart.backgroundColor).toBe('transparent');
      expect(options.title.text).toBe('Ventes');
      expect(options.subtitle.text).toBe('Annuelles');
    });

    it('utilise des titres vides et une liste de séries vide par défaut', () => {
      const options = build({ config: {} as any });

      expect(options.title.text).toBe('');
      expect(options.subtitle.text).toBe('');
      expect(options.series).toEqual([]);
    });

    it('reprend xAxis et tooltip préparés', () => {
      const options = build({
        preparedData: {
          series: [],
          xAxis: { categories: ['Jan', 'Fév'] },
          tooltip: { shared: true },
        },
      });

      expect(options.xAxis.categories).toEqual(['Jan', 'Fév']);
      expect(options.tooltip.shared).toBeTrue();
    });

    it('fusionne le yAxis préparé avec le titre de base', () => {
      const options = build({
        preparedData: { series: [], yAxis: { title: { text: 'Montant' }, min: 0 } },
      });

      expect(options.yAxis.title.text).toBe('Montant');
      expect(options.yAxis.min).toBe(0);
    });

    it('transmet les séries préparées à applySeriesAxes et conserve ses mutations', () => {
      const series = [{ name: 'A', data: [1] }];
      const applySeriesAxes = jasmine.createSpy('applySeriesAxes').and.callFake((_options: any, target: any[]) => {
        target[0].yAxis = 1;
      });
      const options = build({ preparedData: { series }, applySeriesAxes });

      expect(applySeriesAxes.calls.mostRecent().args[1]).toBe(series);
      expect(options.series[0].yAxis).toBe(1);
    });
  });

  describe('erreur de validation des données', () => {
    it('remplace lang.noData par le message de validation', () => {
      const options = build({ dataValidationError: { message: 'Données incompatibles' } });
      expect(options.lang.noData).toBe('Données incompatibles');
    });

    it('applique le style du message sans données', () => {
      const options = build({ dataValidationError: { message: 'Données incompatibles' } });

      expect(options.noData.style.color).toBe('#666');
      expect(options.noData.style.fontSize).toBe('14px');
      expect(options.noData.style.fontWeight).toBe('normal');
    });

    it('conserve le libellé de langue français sans erreur de validation', () => {
      const options = build({ dataValidationError: null });

      expect(options.lang.noData).toBe(FRENCH_HIGHCHARTS_LANG.noData);
      expect(options.noData).toEqual({
        style: { fontWeight: 'normal', fontSize: '14px', color: '#666' },
      });
    });
  });

  describe('thème et options utilisateur', () => {
    it('applique le thème au-dessus des options de base', () => {
      const options = build({
        theme: { chart: { backgroundColor: '#000000' }, title: { text: 'Thème' } } as any,
      });

      expect(options.title.text).toBe('Thème');
      expect(options.chart.backgroundColor).toBe('#000000');
      expect(options.chart.type).toBe('column');
    });

    it('applique config.options au-dessus du thème', () => {
      const options = build({
        theme: { title: { text: 'Thème' } } as any,
        config: { title: 'Titre', options: { title: { text: 'Option' } } } as any,
      });

      expect(options.title.text).toBe('Option');
    });

    it('conserve les séries préparées quand config.options.series n est pas un tableau', () => {
      const series = [{ name: 'A', data: [1] }];
      const options = build({
        preparedData: { series },
        config: { title: 'Titre', options: { series: { color: 'red' } } } as any,
      });

      expect(options.series).toEqual([{ name: 'A', data: [1] }]);
    });

    it('fusionne les options de série utilisateur par index, les données préparées prévalent', () => {
      const options = build({
        preparedData: { series: [{ name: 'A', data: [1] }] },
        config: {
          title: 'Titre',
          options: {
            series: [{ type: 'spline', color: '#f00', name: 'Nom utilisateur' }, { type: 'column' }],
          },
        } as any,
      });

      expect(options.series.length).toBe(1);
      expect(options.series[0].name).toBe('A');
      expect(options.series[0].type).toBe('spline');
      expect(options.series[0].color).toBe('#f00');
    });
  });

  describe('options spéciales', () => {
    it('ajoute un gestionnaire de rendu au donut avec donutCenter', () => {
      const options = build({
        chartType: 'donut',
        highchartsType: 'pie',
        config: { title: 'Titre', options: { donutCenter: {} } } as any,
        preparedData: { series: [{ name: 'A', data: [{ name: 'x', y: 1 }] }] },
      });

      expect(typeof options.chart.events.render).toBe('function');
    });

    it('n ajoute aucun gestionnaire de rendu au donut quand donutCenter est désactivé', () => {
      const options = build({
        chartType: 'donut',
        highchartsType: 'pie',
        config: { title: 'Titre', options: { donutCenter: { enabled: false } } } as any,
        preparedData: { series: [{ name: 'A', data: [{ name: 'x', y: 1 }] }] },
      });

      expect(options.chart.events?.render).toBeUndefined();
    });

    it('ajoute un gestionnaire de rendu radialBar avec track', () => {
      const options = build({
        chartType: 'radialBar',
        highchartsType: 'solidgauge',
        config: { title: 'Titre', options: { radialBar: { track: {} } } } as any,
        preparedData: { series: [{ name: 'A', data: [50] }] },
      });

      expect(typeof options.chart.events.render).toBe('function');
    });

    it('ne configure pas le rendu radialBar sans option radialBar', () => {
      const options = build({
        chartType: 'radialBar',
        highchartsType: 'solidgauge',
        preparedData: { series: [{ name: 'A', data: [50] }] },
      });

      expect(options.chart.events?.render).toBeUndefined();
    });

    it('injecte loadedMapData dans chart.map pour une carte', () => {
      const loadedMapData = { type: 'FeatureCollection', features: [] };
      const options = build({
        chartType: 'map',
        highchartsType: 'map',
        loadedMapData,
        preparedData: { series: [] },
      });

      expect(options.chart.map).toBe(loadedMapData);
    });

    it('conserve chart.map personnalisé de config.options', () => {
      const options = build({
        chartType: 'map',
        highchartsType: 'map',
        loadedMapData: { type: 'FeatureCollection', features: [] },
        config: { title: 'Titre', options: { chart: { map: { custom: true } } } } as any,
        preparedData: { series: [] },
      });

      expect(options.chart.map).toEqual({ custom: true });
    });

    it('n injecte pas loadedMapData hors carte', () => {
      const options = build({
        chartType: 'bar',
        loadedMapData: { type: 'FeatureCollection', features: [] },
      });

      expect(options.chart.map).toBeUndefined();
    });
  });

  describe('configuration des graphiques simples', () => {
    it('pie : innerSize à 0 % et étiquettes de données activées', () => {
      const options = build({
        chartType: 'pie',
        highchartsType: 'pie',
        preparedData: { series: [{ name: 'A', data: [{ name: 'x', y: 1 }] }] },
      });

      expect(options.plotOptions.pie.innerSize).toBe('0%');
      expect(options.plotOptions.pie.dataLabels.enabled).toBeTrue();
    });

    it('donut : innerSize à 50 %', () => {
      const options = build({
        chartType: 'donut',
        highchartsType: 'pie',
        preparedData: { series: [{ name: 'A', data: [{ name: 'x', y: 1 }] }] },
      });

      expect(options.plotOptions.pie.innerSize).toBe('50%');
    });
  });
});
