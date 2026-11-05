import { ElementRef, EventEmitter, NgZone, signal } from '@angular/core';
import { ChartClickEvent, ChartProvider } from '@oneteme/jquery-core';
import {
  ApexChartRuntimeEvents,
  ChartCustomEvent,
  customIcons,
  destroyChart,
  determineXAxisDataType,
  fixToolbarSvgIds,
  getType,
  initCommonChartOptions,
  setupScrollPrevention,
  setupToolbarObserver,
  transformSeriesVisibility,
  updateChartOptions,
  updateCommonOptions,
} from './utils';

const runInZone: NgZone = {
  run: (fn: () => unknown) => fn(),
  runOutsideAngular: (fn: () => unknown) => fn(),
} as unknown as NgZone;

function createNode(html = ''): ElementRef<HTMLElement> {
  const div = document.createElement('div');
  div.innerHTML = html;
  return new ElementRef(div);
}

describe('utils', () => {

  describe('customIcons', () => {
    it('crée deux icônes précédent / suivant sans pivot', () => {
      const icons = customIcons(() => { });

      expect(icons.length).toBe(2);
      expect(icons.map(i => i.title)).toEqual(['Graphique précédent', 'Graphique suivant']);
      expect(icons.every(i => i.class === 'custom-icon')).toBeTrue();
    });

    it('ajoute une icône pivot lorsque canPivot est vrai', () => {
      const icons = customIcons(() => { }, true);

      expect(icons.length).toBe(3);
      expect(icons[2].title).toBe('Pivot');
    });

    it('émet previous, next et pivot selon l’icône cliquée', () => {
      const event = jasmine.createSpy('event');
      const icons = customIcons(event, true);

      icons[0].click(null, null, null);
      icons[1].click(null, null, null);
      icons[2].click(null, null, null);

      expect(event.calls.allArgs()).toEqual([['previous'], ['next'], ['pivot']]);
    });
  });

  describe('determineXAxisDataType', () => {
    it('retourne "datetime" pour une Date', () => {
      expect(determineXAxisDataType(new Date(2024, 0, 1))).toBe('datetime');
    });

    it('retourne "numeric" pour un nombre, y compris zéro et négatif', () => {
      expect(determineXAxisDataType(0)).toBe('numeric');
      expect(determineXAxisDataType(-3.5)).toBe('numeric');
    });

    it('retourne "category" pour une chaîne vide, null, undefined ou un booléen', () => {
      expect(determineXAxisDataType('')).toBe('category');
      expect(determineXAxisDataType('Janvier')).toBe('category');
      expect(determineXAxisDataType(null)).toBe('category');
      expect(determineXAxisDataType(undefined)).toBe('category');
      expect(determineXAxisDataType(true)).toBe('category');
    });

    it('ne considère pas une chaîne de date comme une Date', () => {
      expect(determineXAxisDataType('2024-01-01')).toBe('category');
    });
  });

  describe('getType', () => {
    it('retourne "datetime" lorsqu’il n’y a aucune série', () => {
      expect(getType({ series: [], categories: ['A'] } as any)).toBe('datetime');
    });

    it('retourne "datetime" lorsque la première série est vide', () => {
      expect(getType({ series: [{ data: [] }], categories: ['A'] } as any)).toBe('datetime');
    });

    it('déduit le type depuis la première catégorie en mode catégories', () => {
      expect(getType({ series: [{ data: [1] }], categories: ['Janvier'] } as any)).toBe('category');
      expect(getType({ series: [{ data: [1] }], categories: [2024] } as any)).toBe('numeric');
      expect(getType({ series: [{ data: [1] }], categories: [new Date()] } as any)).toBe('datetime');
    });

    it('déduit le type depuis le x du premier point en mode continu', () => {
      const chart = { continue: true, series: [{ data: [{ x: new Date(), y: 1 }] }] };
      expect(getType(chart as any)).toBe('datetime');

      const numeric = { continue: true, series: [{ data: [{ x: 10, y: 1 }] }] };
      expect(getType(numeric as any)).toBe('numeric');
    });
  });

  describe('initCommonChartOptions', () => {
    it('initialise les options de base sans toolbar ni zoom', () => {
      const options: any = initCommonChartOptions(createNode(), new EventEmitter(), runInZone, 'bar');

      expect(options.shouldRedraw).toBeTrue();
      expect(options.chart.type).toBe('bar');
      expect(options.chart.toolbar.show).toBeFalse();
      expect(options.chart.zoom.enabled).toBeFalse();
      expect(options.noData.text).toBe('Aucune donnée');
      expect(options.series).toEqual([]);
      expect(options.xaxis).toEqual({});
      expect(options.plotOptions).toEqual({});
    });

    it('ajoute l’icône pivot uniquement si canPivot est vrai', () => {
      const withoutPivot: any = initCommonChartOptions(createNode(), new EventEmitter(), runInZone, 'line', false);
      const withPivot: any = initCommonChartOptions(createNode(), new EventEmitter(), runInZone, 'line', true);

      expect(withoutPivot.chart.toolbar.tools.customIcons.length).toBe(2);
      expect(withPivot.chart.toolbar.tools.customIcons.length).toBe(3);
    });

    it('émet l’événement custom via la zone Angular lors du clic sur une icône', () => {
      const customEvent = new EventEmitter<ChartCustomEvent>();
      const emitted: ChartCustomEvent[] = [];
      customEvent.subscribe(v => emitted.push(v));
      const zone = { run: jasmine.createSpy('run').and.callFake((fn: () => unknown) => fn()) } as unknown as NgZone;

      const options: any = initCommonChartOptions(createNode(), customEvent, zone, 'line');
      options.chart.toolbar.tools.customIcons[1].click(null, null, null);

      expect(zone.run).toHaveBeenCalled();
      expect(emitted).toEqual(['next']);
    });

    it('affiche la toolbar au survol et la masque à la sortie', () => {
      const node = createNode('<div class="apexcharts-toolbar" style="visibility: hidden"></div>');
      const options: any = initCommonChartOptions(node, new EventEmitter(), runInZone, 'line');
      const toolbar = node.nativeElement.querySelector('.apexcharts-toolbar') as HTMLElement;

      options.chart.events.mouseMove(null, null, null);
      expect(toolbar.style.visibility).toBe('visible');

      options.chart.events.mouseLeave();
      expect(toolbar.style.visibility).toBe('hidden');
    });

    it('ne plante pas au survol lorsque la toolbar est absente', () => {
      const options: any = initCommonChartOptions(createNode(), new EventEmitter(), runInZone, 'line');

      expect(() => options.chart.events.mouseMove(null, null, null)).not.toThrow();
      expect(() => options.chart.events.mouseLeave()).not.toThrow();
    });

    it('transmet les événements runtime (mouseMove, mouseLeave, zoomed)', () => {
      const runtime: ApexChartRuntimeEvents = {
        onMouseMove: jasmine.createSpy('onMouseMove'),
        onMouseLeave: jasmine.createSpy('onMouseLeave'),
        onZoomed: jasmine.createSpy('onZoomed'),
      };
      const options: any = initCommonChartOptions(createNode(), new EventEmitter(), runInZone, 'line', false, undefined, runtime);
      const ctx = { id: 'ctx' };
      const cfg = { dataPointIndex: 2 };
      const xaxis = { min: 1, max: 5 };

      options.chart.events.mouseMove('evt', ctx, cfg);
      options.chart.events.mouseLeave();
      options.chart.events.zoomed(ctx, { xaxis });
      options.chart.events.zoomed(ctx, undefined);

      expect(runtime.onMouseMove).toHaveBeenCalledWith('evt', ctx, cfg);
      expect(runtime.onMouseLeave).toHaveBeenCalled();
      expect(runtime.onZoomed).toHaveBeenCalledWith(ctx, xaxis);
      expect((runtime.onZoomed as jasmine.Spy).calls.mostRecent().args[1]).toBeUndefined();
    });

    it('n’émet rien sur dataPointSelection lorsque chartClick n’est pas fourni', () => {
      const options: any = initCommonChartOptions(createNode(), new EventEmitter(), runInZone, 'bar');

      expect(() => options.chart.events.dataPointSelection({}, { w: { config: { series: [] } } }, { seriesIndex: 0, dataPointIndex: 0 })).not.toThrow();
    });

    describe('dataPointSelection avec chartClick', () => {
      let emitted: ChartClickEvent[];
      let options: any;

      beforeEach(() => {
        emitted = [];
        const chartClick = new EventEmitter<ChartClickEvent>();
        chartClick.subscribe(e => emitted.push(e));
        options = initCommonChartOptions(createNode(), new EventEmitter(), runInZone, 'bar', false, chartClick);
      });

      it('résout le nom depuis categoryLabels en priorité', () => {
        const ctx = {
          w: {
            config: { chart: { type: 'bar' }, series: [{ data: [10, 20] }], xaxis: { categories: ['cat-A', 'cat-B'] } },
            globals: { categoryLabels: ['label-A', 'label-B'], labels: ['lab-A', 'lab-B'] },
          },
        };
        options.chart.events.dataPointSelection('evt', ctx, { seriesIndex: 0, dataPointIndex: 1 });

        expect(emitted.length).toBe(1);
        expect(emitted[0].name).toBe('label-B');
        expect(emitted[0].seriesType).toBe('bar');
        expect(emitted[0].seriesIndex).toBe(0);
        expect(emitted[0].dataIndex).toBe(1);
        expect(emitted[0].value).toBe(20);
        expect(emitted[0].data).toBe(20);
        expect(emitted[0].componentType).toBe('series');
      });

      it('se rabat sur labels puis xaxis.categories si categoryLabels est absent', () => {
        const withLabels = {
          w: { config: { series: [{ data: [1] }] }, globals: { labels: ['lab-A'] } },
        };
        options.chart.events.dataPointSelection('evt', withLabels, { seriesIndex: 0, dataPointIndex: 0 });

        const withCategories = {
          w: { config: { series: [{ data: [1] }], xaxis: { categories: ['cat-A'] } }, globals: {} },
        };
        options.chart.events.dataPointSelection('evt', withCategories, { seriesIndex: 0, dataPointIndex: 0 });

        expect(emitted.map(e => e.name)).toEqual(['lab-A', 'cat-A']);
      });

      it('utilise value.x lorsque la donnée est un objet et qu’aucun libellé n’existe', () => {
        const ctx = { w: { config: { series: [{ data: [{ x: 'Q1', y: 3 }] }] }, globals: {} } };
        options.chart.events.dataPointSelection('evt', ctx, { seriesIndex: 0, dataPointIndex: 0 });

        expect(emitted[0].name).toBe('Q1');
        expect(emitted[0].value).toEqual({ x: 'Q1', y: 3 });
      });

      it('gère une valeur absente sans lever d’exception (index hors limites)', () => {
        const ctx = { w: { config: { series: [{ data: [1] }] }, globals: {} } };
        options.chart.events.dataPointSelection('evt', ctx, { seriesIndex: 0, dataPointIndex: 9 });

        expect(emitted[0].value).toBeUndefined();
        expect(emitted[0].name).toBeUndefined();
      });

      it('gère un contexte absent', () => {
        options.chart.events.dataPointSelection('evt', undefined, undefined);

        expect(emitted.length).toBe(1);
        expect(emitted[0].seriesIndex).toBeUndefined();
        expect(emitted[0].seriesType).toBeUndefined();
      });
    });
  });

  describe('updateCommonOptions', () => {
    it('applique les valeurs par défaut (100 %, toolbar masquée) sur des options absentes', () => {
      const result = updateCommonOptions(undefined, {} as ChartProvider<any, any>);

      expect(result.chart.height).toBe('100%');
      expect(result.chart.width).toBe('100%');
      expect(result.chart.toolbar.show).toBeFalse();
    });

    it('applique les dimensions numériques fournies', () => {
      const result = updateCommonOptions({}, { height: 400, width: 600 } as ChartProvider<any, any>);

      expect(result.chart.height).toBe(400);
      expect(result.chart.width).toBe(600);
    });

    it('renseigne titre, sous-titre et titres d’axes', () => {
      const result = updateCommonOptions({}, {
        title: 'Titre',
        subtitle: 'Sous-titre',
        xtitle: 'Mois',
        ytitle: 'Montant',
      } as ChartProvider<any, any>);

      expect(result.title.text).toBe('Titre');
      expect(result.subtitle.text).toBe('Sous-titre');
      expect(result.xaxis.title.text).toBe('Mois');
      expect(result.yaxis.title.text).toBe('Montant');
    });

    it('active la toolbar et le mode empilé selon la configuration', () => {
      const result = updateCommonOptions({}, { showToolbar: true, stacked: true } as ChartProvider<any, any>);

      expect(result.chart.toolbar.show).toBeTrue();
      expect(result.chart.stacked).toBeTrue();
    });

    it('fusionne les options utilisateur dans le résultat', () => {
      const result = updateCommonOptions({}, { options: { legend: { show: false } } } as ChartProvider<any, any>);

      expect(result.legend.show).toBeFalse();
    });

    it('conserve plotOptions.bar.horizontal déjà présent lorsque l’utilisateur ne le fixe pas', () => {
      const result = updateCommonOptions(
        { plotOptions: { bar: { horizontal: true } } },
        {} as ChartProvider<any, any>,
      );

      expect(result.plotOptions.bar.horizontal).toBeTrue();
    });

    it('laisse la configuration utilisateur remplacer plotOptions.bar.horizontal', () => {
      const result = updateCommonOptions(
        { plotOptions: { bar: { horizontal: true } } },
        { options: { plotOptions: { bar: { horizontal: false } } } } as ChartProvider<any, any>,
      );

      expect(result.plotOptions.bar.horizontal).toBeFalse();
    });

    it('n’ajoute pas plotOptions.bar.horizontal lorsqu’il n’existait pas', () => {
      const result = updateCommonOptions({}, {} as ChartProvider<any, any>);

      expect(result.plotOptions?.bar?.horizontal).toBeUndefined();
    });
  });

  describe('updateChartOptions', () => {
    let zone: NgZone;

    beforeEach(() => {
      zone = { runOutsideAngular: (fn: () => unknown) => fn() } as unknown as NgZone;
    });

    it('résout immédiatement lorsqu’il n’y a aucune instance', async () => {
      await expectAsync(updateChartOptions(null, zone, {})).toBeResolved();
    });

    it('transmet une copie des options et les drapeaux à updateOptions', async () => {
      const chart = { updateOptions: jasmine.createSpy('updateOptions').and.returnValue(Promise.resolve()) };
      const options = { title: { text: 'T' } };

      await updateChartOptions(chart as any, zone, options, false, false, true);

      const [sent, redraw, animate, synced] = chart.updateOptions.calls.mostRecent().args;
      expect(sent).toEqual(options);
      expect(sent).not.toBe(options);
      expect([redraw, animate, synced]).toEqual([false, false, true]);
    });

    it('journalise l’erreur sans rejeter la promesse', async () => {
      const chart = { updateOptions: () => Promise.reject(new Error('boom')) };
      const consoleError = spyOn(console, 'error');

      await expectAsync(updateChartOptions(chart as any, zone, {})).toBeResolved();
      expect(consoleError).toHaveBeenCalled();
    });

    it('corrige les IDs de la toolbar après la mise à jour lorsqu’un élément est fourni', async () => {
      const element = document.createElement('div');
      element.innerHTML = '<div class="apexcharts-toolbar"><svg><g id="t1"></g></svg></div>';
      const chart = { updateOptions: () => Promise.resolve() };

      await updateChartOptions(chart as any, zone, {}, true, true, false, element);

      const g = element.querySelector('g');
      expect(g.getAttribute('id')).toMatch(/^toolbar-\d+-\d+-svg0-t1$/);
    });
  });

  describe('transformSeriesVisibility', () => {
    it('retourne un tableau vide pour un tableau vide', () => {
      expect(transformSeriesVisibility([])).toEqual([]);
    });

    it('convertit visible=false en hidden=true et retire la clé visible', () => {
      const [serie] = transformSeriesVisibility([{ name: 'A', visible: false, data: [1] }]);

      expect(serie.hidden).toBeTrue();
      expect('visible' in serie).toBeFalse();
      expect(serie.name).toBe('A');
    });

    it('convertit visible=true en hidden=false', () => {
      const [serie] = transformSeriesVisibility([{ name: 'A', visible: true }]);

      expect(serie.hidden).toBeFalse();
      expect('visible' in serie).toBeFalse();
    });

    it('considère une série sans visible comme affichée', () => {
      const [serie] = transformSeriesVisibility([{ name: 'A' }]);

      expect(serie.hidden).toBeFalse();
    });

    it('ne modifie pas le tableau d’entrée', () => {
      const input = [{ name: 'A', visible: false }];

      transformSeriesVisibility(input);

      expect(input).toEqual([{ name: 'A', visible: false }]);
    });
  });

  describe('setupScrollPrevention', () => {
    function wheelOn(el: HTMLElement): WheelEvent {
      const event = new WheelEvent('wheel', { cancelable: true, bubbles: true });
      el.dispatchEvent(event);
      return event;
    }

    it('retourne null lorsque l’élément est absent', () => {
      expect(setupScrollPrevention(null, () => null)).toBeNull();
    });

    it('bloque la molette lorsque la souris est sur le graphique et que le zoom est activé', () => {
      const el = document.createElement('div');
      const chart = { w: { config: { chart: { zoom: { enabled: true } } } } } as any;
      const cleanup = setupScrollPrevention(el, () => chart);

      el.dispatchEvent(new Event('mouseenter'));
      expect(wheelOn(el).defaultPrevented).toBeTrue();

      cleanup();
    });

    it('ne bloque pas la molette lorsque la souris est sortie du graphique', () => {
      const el = document.createElement('div');
      const chart = { w: { config: { chart: { zoom: { enabled: true } } } } } as any;
      const cleanup = setupScrollPrevention(el, () => chart);

      el.dispatchEvent(new Event('mouseenter'));
      el.dispatchEvent(new Event('mouseleave'));
      expect(wheelOn(el).defaultPrevented).toBeFalse();

      cleanup();
    });

    it('ne bloque pas la molette lorsque le zoom est désactivé', () => {
      const el = document.createElement('div');
      const chart = { w: { config: { chart: { zoom: { enabled: false } } } } } as any;
      const cleanup = setupScrollPrevention(el, () => chart);

      el.dispatchEvent(new Event('mouseenter'));
      expect(wheelOn(el).defaultPrevented).toBeFalse();

      cleanup();
    });

    it('ne bloque pas la molette lorsque l’instance est absente', () => {
      const el = document.createElement('div');
      const cleanup = setupScrollPrevention(el, () => null);

      el.dispatchEvent(new Event('mouseenter'));
      expect(wheelOn(el).defaultPrevented).toBeFalse();

      cleanup();
    });

    it('retire tous les écouteurs après le nettoyage', () => {
      const el = document.createElement('div');
      const chart = { w: { config: { chart: { zoom: { enabled: true } } } } } as any;
      const cleanup = setupScrollPrevention(el, () => chart);

      cleanup();
      el.dispatchEvent(new Event('mouseenter'));

      expect(wheelOn(el).defaultPrevented).toBeFalse();
    });
  });

  describe('fixToolbarSvgIds', () => {
    it('ne fait rien lorsque l’élément est absent ou sans toolbar', () => {
      expect(() => fixToolbarSvgIds(null)).not.toThrow();

      const el = createNode('<svg><g id="x"></g></svg>').nativeElement;
      fixToolbarSvgIds(el);
      expect(el.querySelector('g').getAttribute('id')).toBe('x');
    });

    it('préfixe les ids de la toolbar et met à jour les références url(#...)', () => {
      const el = createNode(`
        <div class="apexcharts-toolbar">
          <svg>
            <defs><linearGradient id="g1"></linearGradient><clipPath id="c1"></clipPath></defs>
            <rect fill="url(#g1)" clip-path="url(#c1)" mask="url(#g1)"></rect>
          </svg>
        </div>`).nativeElement;

      fixToolbarSvgIds(el);

      const gradient = el.querySelector('linearGradient');
      const clip = el.querySelector('clipPath');
      const rect = el.querySelector('rect');
      expect(gradient.getAttribute('id')).toMatch(/^toolbar-\d+-\d+-svg0-g1$/);
      expect(clip.getAttribute('id')).toMatch(/^toolbar-\d+-\d+-svg0-c1$/);
      expect(rect.getAttribute('fill')).toBe(`url(#${gradient.getAttribute('id')})`);
      expect(rect.getAttribute('mask')).toBe(`url(#${gradient.getAttribute('id')})`);
      expect(rect.getAttribute('clip-path')).toBe(`url(#${clip.getAttribute('id')})`);
    });

    it('met à jour les références href="#..." vers les ids renommés', () => {
      const el = createNode(`
        <div class="apexcharts-toolbar">
          <svg>
            <symbol id="s1"></symbol>
            <use href="#s1"></use>
          </svg>
        </div>`).nativeElement;

      fixToolbarSvgIds(el);

      const symbolId = el.querySelector('symbol').getAttribute('id');
      expect(symbolId).toMatch(/^toolbar-\d+-\d+-svg0-s1$/);
      expect(el.querySelector('use').getAttribute('href')).toBe(`#${symbolId}`);
    });

    it('ne modifie pas les références vers des ids inconnus', () => {
      const el = createNode(`
        <div class="apexcharts-toolbar">
          <svg><rect fill="url(#inconnu)"></rect></svg>
        </div>`).nativeElement;

      fixToolbarSvgIds(el);

      expect(el.querySelector('rect').getAttribute('fill')).toBe('url(#inconnu)');
    });

    it('ne renomme pas les ids situés hors de la toolbar', () => {
      const el = createNode(`
        <svg><g id="hors"></g></svg>
        <div class="apexcharts-toolbar"><svg><g id="dans"></g></svg></div>`).nativeElement;

      fixToolbarSvgIds(el);

      expect(el.querySelector('svg > g#hors')).not.toBeNull();
      expect(el.querySelector('.apexcharts-toolbar g').getAttribute('id')).toMatch(/-svg0-dans$/);
    });
  });

  describe('setupToolbarObserver', () => {
    it('retourne null lorsque l’élément est absent', () => {
      expect(setupToolbarObserver(null)).toBeNull();
    });

    it('corrige les ids de la toolbar ajoutée après la création de l’observateur', async () => {
      const host = document.createElement('div');
      const observer = setupToolbarObserver(host);

      host.innerHTML = '<div class="apexcharts-toolbar"><svg><linearGradient id="g1"></linearGradient><rect fill="url(#g1)"></rect></svg></div>';
      await new Promise(resolve => setTimeout(resolve, 20));
      observer.disconnect();

      expect(host.querySelector('rect').getAttribute('fill')).toMatch(/^url\(#toolbar-\d+-\d+-svg0-g1\)$/);
    });

    it('retourne un MutationObserver actif', () => {
      const observer = setupToolbarObserver(document.createElement('div'));

      expect(observer instanceof MutationObserver).toBeTrue();
      observer.disconnect();
    });
  });

  describe('destroyChart', () => {
    it('détruit l’instance et remet le signal à null', () => {
      const instance = { destroy: jasmine.createSpy('destroy') };
      const chartSignal = signal<any>(instance);

      destroyChart(chartSignal);

      expect(instance.destroy).toHaveBeenCalledTimes(1);
      expect(chartSignal()).toBeNull();
    });

    it('ne fait rien lorsqu’aucune instance n’est présente', () => {
      const chartSignal = signal<any>(null);

      expect(() => destroyChart(chartSignal)).not.toThrow();
      expect(chartSignal()).toBeNull();
    });
  });
});
