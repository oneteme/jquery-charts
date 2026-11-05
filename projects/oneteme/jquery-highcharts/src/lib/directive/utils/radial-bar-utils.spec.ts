import { applyRadialBarLogic } from './radial-bar-utils';

const SHAPE_ARGS = { x: 100, y: 100, r: 80, innerR: 60, start: 0 };

function createArc(): any {
  const arc: any = {
    attr: jasmine.createSpy('attr'),
    add: jasmine.createSpy('add'),
    destroy: jasmine.createSpy('destroy'),
  };
  arc.attr.and.returnValue(arc);
  arc.add.and.returnValue(arc);
  return arc;
}

function createTextNode(): any {
  const node: any = {
    css: jasmine.createSpy('css'),
    attr: jasmine.createSpy('attr'),
    add: jasmine.createSpy('add'),
    show: jasmine.createSpy('show'),
    hide: jasmine.createSpy('hide'),
  };
  node.css.and.returnValue(node);
  node.attr.and.returnValue(node);
  node.add.and.returnValue(node);
  return node;
}

function createChart(data: any[] = [{ shapeArgs: SHAPE_ARGS }]): any {
  return {
    plotLeft: 10,
    plotTop: 20,
    plotWidth: 200,
    plotHeight: 100,
    series: [{ data, group: {} }],
    userOptions: {},
    renderer: {
      path: jasmine.createSpy('path').and.callFake(() => createArc()),
      text: jasmine.createSpy('text').and.callFake(() => createTextNode()),
    },
  };
}

describe('applyRadialBarLogic', () => {
  it('ne modifie pas les options sans configuration', () => {
    const options: any = {};
    applyRadialBarLogic(options);
    expect(options).toEqual({});
  });

  it('ne modifie pas les options sans track ni centerValue', () => {
    const options: any = {};
    applyRadialBarLogic(options, {});
    expect(options).toEqual({});
  });

  describe('track', () => {
    it('active le track par défaut', () => {
      const options: any = {};
      applyRadialBarLogic(options, { track: {} });
      expect(options.chart.events.render).toEqual(jasmine.any(Function));
    });

    it('désactive le track lorsque enabled vaut false', () => {
      const options: any = {};
      applyRadialBarLogic(options, { track: { enabled: false } });
      expect(options.chart).toBeUndefined();
    });

    it('conserve le rendu original du graphique', () => {
      const originalRender = jasmine.createSpy('render');
      const options: any = { chart: { events: { render: originalRender } } };
      applyRadialBarLogic(options, { track: {} });
      const chart = createChart();
      options.chart.events.render.call(chart);
      expect(originalRender).toHaveBeenCalledTimes(1);
    });

    it('ne dessine rien sans données', () => {
      const options: any = {};
      applyRadialBarLogic(options, { track: {} });
      const chart = createChart([]);
      options.chart.events.render.call(chart);
      expect(chart.renderer.path).not.toHaveBeenCalled();
      expect(chart.customBackgroundArcs).toBeUndefined();
    });

    it('ne dessine rien sans série', () => {
      const options: any = {};
      applyRadialBarLogic(options, { track: {} });
      const chart = createChart();
      chart.series = undefined;
      expect(() => options.chart.events.render.call(chart)).not.toThrow();
      expect(chart.renderer.path).not.toHaveBeenCalled();
    });

    it('dessine un arc de fond par point avec la couleur par défaut', () => {
      const options: any = {};
      applyRadialBarLogic(options, { track: {} });
      const chart = createChart([{ shapeArgs: SHAPE_ARGS }, { shapeArgs: SHAPE_ARGS }]);
      options.chart.events.render.call(chart);
      expect(chart.renderer.path).toHaveBeenCalledTimes(2);
      expect(chart.customBackgroundArcs.length).toBe(2);
      expect(chart.customBackgroundArcs[0].attr).toHaveBeenCalledWith({ fill: '#E5E7EB', zIndex: 0 });
    });

    it('utilise la couleur de track fournie', () => {
      const options: any = {};
      applyRadialBarLogic(options, { track: { color: '#123456' } });
      const chart = createChart();
      options.chart.events.render.call(chart);
      expect(chart.customBackgroundArcs[0].attr).toHaveBeenCalledWith({ fill: '#123456', zIndex: 0 });
    });

    it('ignore les points sans shapeArgs', () => {
      const options: any = {};
      applyRadialBarLogic(options, { track: {} });
      const chart = createChart([{}, { shapeArgs: SHAPE_ARGS }]);
      options.chart.events.render.call(chart);
      expect(chart.customBackgroundArcs.length).toBe(1);
    });

    it('construit un chemin fermé', () => {
      const options: any = {};
      applyRadialBarLogic(options, { track: {} });
      const chart = createChart();
      options.chart.events.render.call(chart);
      const path = chart.renderer.path.calls.mostRecent().args[0];
      expect(path[0]).toBe('M');
      expect(path[path.length - 1]).toBe('Z');
    });

    it('détruit les arcs du rendu précédent', () => {
      const options: any = {};
      applyRadialBarLogic(options, { track: {} });
      const chart = createChart();
      options.chart.events.render.call(chart);
      const premierArc = chart.customBackgroundArcs[0];
      options.chart.events.render.call(chart);
      expect(premierArc.destroy).toHaveBeenCalled();
      expect(chart.customBackgroundArcs.length).toBe(1);
    });

    it('place l\'arc avant l\'élément graphique du point', () => {
      const insertBefore = jasmine.createSpy('insertBefore');
      const options: any = {};
      applyRadialBarLogic(options, { track: {} });
      const chart = createChart();
      chart.renderer.path.and.callFake(() => {
        const arc = createArc();
        arc.element = { parentNode: { insertBefore } };
        return arc;
      });
      const graphicElement = {};
      chart.series[0].data[0].graphic = { element: graphicElement };
      options.chart.events.render.call(chart);
      const arc = chart.customBackgroundArcs[0];
      expect(insertBefore).toHaveBeenCalledWith(arc.element, graphicElement);
    });
  });

  describe('valeur centrale', () => {
    function survol(options: any, point: any): void {
      options.plotOptions.series.point.events.mouseOver.call(point);
    }

    it('active la valeur centrale par défaut', () => {
      const options: any = {};
      applyRadialBarLogic(options, { centerValue: {} });
      expect(options.plotOptions.series.point.events.mouseOver).toEqual(jasmine.any(Function));
      expect(options.plotOptions.series.point.events.mouseOut).toEqual(jasmine.any(Function));
    });

    it('désactive la valeur centrale lorsque enabled vaut false', () => {
      const options: any = {};
      applyRadialBarLogic(options, { centerValue: { enabled: false } });
      expect(options.plotOptions).toBeUndefined();
    });

    it('affiche la valeur au centre de la zone tracée lors du survol', () => {
      const options: any = {};
      applyRadialBarLogic(options, { centerValue: {} });
      const chart = createChart();
      survol(options, { series: { chart }, y: 7, color: '#123' });
      expect(chart.renderer.text).toHaveBeenCalledWith(7, 110, 70);
    });

    it('privilégie count sur y', () => {
      const options: any = {};
      applyRadialBarLogic(options, { centerValue: {} });
      const chart = createChart();
      survol(options, { series: { chart }, y: 7, count: 42, color: '#123' });
      expect(chart.renderer.text).toHaveBeenCalledWith(42, 110, 70);
    });

    it('affiche zéro lorsque count vaut zéro', () => {
      const options: any = {};
      applyRadialBarLogic(options, { centerValue: {} });
      const chart = createChart();
      survol(options, { series: { chart }, y: 7, count: 0, color: '#123' });
      expect(chart.renderer.text).toHaveBeenCalledWith(0, 110, 70);
    });

    it('applique la couleur du point et les styles par défaut', () => {
      const options: any = {};
      applyRadialBarLogic(options, { centerValue: {} });
      const chart = createChart();
      survol(options, { series: { chart }, y: 7, color: '#123' });
      expect(chart.customCenterValue.css).toHaveBeenCalledWith(
        jasmine.objectContaining({ color: '#123', fontSize: '20px', fontWeight: '700', textAlign: 'center' }),
      );
      expect(chart.customCenterValue.attr).toHaveBeenCalledWith({ align: 'center', zIndex: 5 });
      expect(chart.customCenterValue.add).toHaveBeenCalled();
    });

    it('applique la taille et le poids de police configurés', () => {
      const options: any = {};
      applyRadialBarLogic(options, { centerValue: { fontSize: '32px', fontWeight: '400' } });
      const chart = createChart();
      survol(options, { series: { chart }, y: 7, color: '#123' });
      expect(chart.customCenterValue.css).toHaveBeenCalledWith(
        jasmine.objectContaining({ fontSize: '32px', fontWeight: '400' }),
      );
    });

    it('met à jour le texte existant au survol suivant', () => {
      const options: any = {};
      applyRadialBarLogic(options, { centerValue: {} });
      const chart = createChart();
      survol(options, { series: { chart }, y: 7, color: '#123' });
      const node = chart.customCenterValue;
      survol(options, { series: { chart }, y: 9, color: '#456' });
      expect(chart.renderer.text).toHaveBeenCalledTimes(1);
      expect(node.attr).toHaveBeenCalledWith({ x: 110, y: 70, text: 9 });
      expect(node.css).toHaveBeenCalledWith({ color: '#456' });
      expect(node.show).toHaveBeenCalled();
    });

    it('masque la valeur centrale à la sortie du point', () => {
      const options: any = {};
      applyRadialBarLogic(options, { centerValue: {} });
      const chart = createChart();
      survol(options, { series: { chart }, y: 7, color: '#123' });
      options.plotOptions.series.point.events.mouseOut.call({ series: { chart } });
      expect(chart.customCenterValue.hide).toHaveBeenCalled();
    });

    it('appelle les événements de point d\'origine', () => {
      const originalOver = jasmine.createSpy('mouseOver');
      const originalOut = jasmine.createSpy('mouseOut');
      const options: any = {
        plotOptions: { series: { point: { events: { mouseOver: originalOver, mouseOut: originalOut } } } },
      };
      applyRadialBarLogic(options, { centerValue: {} });
      const chart = createChart();
      const point = { series: { chart }, y: 7, color: '#123' };
      options.plotOptions.series.point.events.mouseOver.call(point);
      options.plotOptions.series.point.events.mouseOut.call(point);
      expect(originalOver).toHaveBeenCalled();
      expect(originalOut).toHaveBeenCalled();
    });

    it('ne fait rien sans graphique associé au point', () => {
      const options: any = {};
      applyRadialBarLogic(options, { centerValue: {} });
      expect(() => survol(options, { y: 7, color: '#123' })).not.toThrow();
      expect(() => options.plotOptions.series.point.events.mouseOut.call({})).not.toThrow();
    });
  });
});
