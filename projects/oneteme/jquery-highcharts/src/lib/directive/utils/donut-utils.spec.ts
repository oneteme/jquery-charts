import { applyDonutCenterLogic } from './donut-utils';

function createPoint(name: string, y: number, extra: any = {}): any {
  return {
    name,
    y,
    visible: true,
    sliced: false,
    selected: false,
    slice: jasmine.createSpy('slice'),
    select: jasmine.createSpy('select'),
    ...extra,
  };
}

function createTextNode(): any {
  const node: any = {
    attr: jasmine.createSpy('attr'),
    css: jasmine.createSpy('css'),
    add: jasmine.createSpy('add'),
    toFront: jasmine.createSpy('toFront'),
  };
  node.attr.and.returnValue(node);
  node.css.and.returnValue(node);
  node.add.and.returnValue(node);
  return node;
}

function createChart(points: any[]): any {
  const chart: any = {
    plotLeft: 10,
    plotTop: 20,
    redraw: jasmine.createSpy('redraw'),
    renderer: {
      text: jasmine.createSpy('text').and.callFake(() => createTextNode()),
    },
  };
  const series: any = { points, center: [100, 100], chart };
  points.forEach((point) => (point.series = series));
  chart.series = [series];
  return chart;
}

function donnees(): any[] {
  return [
    createPoint('A', 3),
    createPoint('B', 5),
    createPoint('C', 2, { visible: false }),
  ];
}

function appliquer(donutConfig?: any, options: any = {}): any {
  applyDonutCenterLogic(options, donutConfig);
  return options;
}

function rendre(options: any, chart: any): void {
  options.chart.events.render.call(chart);
}

function evenementsPoint(options: any): any {
  return options.plotOptions.series.point.events;
}

describe('applyDonutCenterLogic', () => {
  describe('activation', () => {
    it('ne modifie pas les options lorsque enabled vaut false', () => {
      expect(appliquer({ enabled: false })).toEqual({});
    });

    it('active le centre par défaut sans configuration', () => {
      const options = appliquer();
      expect(options.chart.events.render).toEqual(jasmine.any(Function));
      expect(evenementsPoint(options).mouseOver).toEqual(jasmine.any(Function));
      expect(evenementsPoint(options).mouseOut).toEqual(jasmine.any(Function));
      expect(evenementsPoint(options).click).toEqual(jasmine.any(Function));
    });

    it('initialise les sections plotOptions et chart', () => {
      const options = appliquer();
      expect(options.plotOptions.pie).toEqual({});
      expect(options.chart.events.click).toEqual(jasmine.any(Function));
    });
  });

  describe('rendu du centre', () => {
    it('affiche le titre par défaut et le total des points visibles', () => {
      const options = appliquer();
      const chart = createChart(donnees());
      rendre(options, chart);
      expect(chart.renderer.text).toHaveBeenCalledWith('Total', 110, 103);
      expect(chart.renderer.text).toHaveBeenCalledWith('8', 110, 133);
    });

    it('applique les styles par défaut du libellé et de la valeur', () => {
      const options = appliquer();
      const chart = createChart(donnees());
      rendre(options, chart);
      expect(chart.customLabel.css).toHaveBeenCalledWith(
        jasmine.objectContaining({ color: '#666', fontSize: '14px', fontWeight: '400', textAlign: 'center' }),
      );
      expect(chart.customTotalLabel.css).toHaveBeenCalledWith(
        jasmine.objectContaining({ color: '#333', fontSize: '28px', fontWeight: '700', textAlign: 'center' }),
      );
      expect(chart.customLabel.attr).toHaveBeenCalledWith({ align: 'center', zIndex: 10 });
    });

    it('applique le titre, les couleurs et les tailles configurés', () => {
      const options = appliquer({
        title: 'Ventes',
        labelColor: '#111',
        valueColor: '#222',
        labelFontSize: '12px',
        valueFontSize: '30px',
      });
      const chart = createChart(donnees());
      rendre(options, chart);
      expect(chart.renderer.text).toHaveBeenCalledWith('Ventes', 110, 103);
      expect(chart.customLabel.css).toHaveBeenCalledWith(
        jasmine.objectContaining({ color: '#111', fontSize: '12px' }),
      );
      expect(chart.customTotalLabel.css).toHaveBeenCalledWith(
        jasmine.objectContaining({ color: '#222', fontSize: '30px' }),
      );
    });

    it('applique les décalages verticaux configurés', () => {
      const options = appliquer({ labelYOffset: -10, valueYOffset: 20, centerYOffset: 5 });
      const chart = createChart(donnees());
      rendre(options, chart);
      expect(chart.renderer.text).toHaveBeenCalledWith('Total', 110, 115);
      expect(chart.renderer.text).toHaveBeenCalledWith('8', 110, 145);
    });

    it('affiche zéro lorsqu\'aucun point n\'est visible', () => {
      const options = appliquer();
      const chart = createChart([createPoint('A', 3, { visible: false })]);
      rendre(options, chart);
      expect(chart.renderer.text).toHaveBeenCalledWith('0', 110, 133);
    });

    it('affiche zéro lorsqu\'il n\'y a aucun point', () => {
      const options = appliquer();
      const chart = createChart([]);
      rendre(options, chart);
      expect(chart.renderer.text).toHaveBeenCalledWith('0', 110, 133);
    });

    it('ne dessine rien sans centre de série', () => {
      const options = appliquer();
      const chart = createChart(donnees());
      chart.series[0].center = undefined;
      rendre(options, chart);
      expect(chart.renderer.text).not.toHaveBeenCalled();
    });

    it('met à jour les libellés existants au rendu suivant', () => {
      const options = appliquer();
      const chart = createChart(donnees());
      rendre(options, chart);
      const libelle = chart.customLabel;
      rendre(options, chart);
      expect(chart.renderer.text).toHaveBeenCalledTimes(2);
      expect(libelle.attr).toHaveBeenCalledWith({ x: 110, y: 103, text: 'Total' });
      expect(libelle.toFront).toHaveBeenCalled();
    });

    it('appelle le rendu d\'origine du graphique', () => {
      const originalRender = jasmine.createSpy('render');
      const options = appliquer(undefined, { chart: { events: { render: originalRender } } });
      const chart = createChart(donnees());
      rendre(options, chart);
      expect(originalRender).toHaveBeenCalled();
    });
  });

  describe('valeurs configurées', () => {
    it('affiche une valeur fixe telle quelle', () => {
      const options = appliquer({ value: 'N/A' });
      const chart = createChart(donnees());
      rendre(options, chart);
      expect(chart.renderer.text).toHaveBeenCalledWith('N/A', 110, 133);
    });

    it('formate les nombres avec un séparateur de milliers espace', () => {
      const options = appliquer({ value: 1234567 });
      const chart = createChart(donnees());
      rendre(options, chart);
      expect(chart.renderer.text).toHaveBeenCalledWith('1 234 567', 110, 133);
    });

    it('affiche une chaîne vide lorsque la valeur vaut null', () => {
      const options = appliquer({ value: null });
      const chart = createChart(donnees());
      rendre(options, chart);
      expect(chart.renderer.text).toHaveBeenCalledWith('', 110, 133);
    });

    it('calcule la valeur à partir d\'une fonction avec son contexte', () => {
      const valeur = jasmine.createSpy('value').and.returnValue(16);
      const options = appliquer({ value: valeur });
      const chart = createChart(donnees());
      rendre(options, chart);
      expect(valeur).toHaveBeenCalledWith(jasmine.objectContaining({ chart, total: 8 }));
      expect(chart.renderer.text).toHaveBeenCalledWith('16', 110, 133);
    });

    it('revient au total lorsque la fonction de valeur renvoie undefined', () => {
      const options = appliquer({ value: () => undefined });
      const chart = createChart(donnees());
      rendre(options, chart);
      expect(chart.renderer.text).toHaveBeenCalledWith('8', 110, 133);
    });

    it('fige le libellé avec fixedLabel sans figer la valeur', () => {
      const options = appliquer({ fixedLabel: true });
      const chart = createChart(donnees());
      chart.series[0].points[0].sliced = true;
      rendre(options, chart);
      expect(chart.renderer.text).toHaveBeenCalledWith('Total', 110, 103);
      expect(chart.renderer.text).toHaveBeenCalledWith('3', 110, 133);
    });

    it('fige le total avec fixedValue lorsqu\'un point est sélectionné', () => {
      const options = appliquer({ fixedValue: true });
      const chart = createChart(donnees());
      chart.series[0].points[0].sliced = true;
      rendre(options, chart);
      expect(chart.renderer.text).toHaveBeenCalledWith('8', 110, 133);
    });

    it('affiche le point sélectionné lorsque la valeur n\'est pas figée', () => {
      const options = appliquer();
      const chart = createChart(donnees());
      chart.series[0].points[1].sliced = true;
      rendre(options, chart);
      expect(chart.renderer.text).toHaveBeenCalledWith('B', 110, 103);
      expect(chart.renderer.text).toHaveBeenCalledWith('5', 110, 133);
    });
  });

  describe('survol des points', () => {
    it('affiche le nom et la valeur du point survolé', () => {
      const options = appliquer();
      const chart = createChart(donnees());
      rendre(options, chart);
      evenementsPoint(options).mouseOver.call(chart.series[0].points[1]);
      expect(chart.customLabel.attr).toHaveBeenCalledWith({ text: 'B' });
      expect(chart.customTotalLabel.attr).toHaveBeenCalledWith({ text: '5' });
    });

    it('conserve le titre avec fixedLabel lors du survol', () => {
      const options = appliquer({ fixedLabel: true });
      const chart = createChart(donnees());
      rendre(options, chart);
      evenementsPoint(options).mouseOver.call(chart.series[0].points[1]);
      expect(chart.customLabel.attr).toHaveBeenCalledWith({ text: 'Total' });
    });

    it('conserve le total avec fixedValue lors du survol', () => {
      const options = appliquer({ fixedValue: true });
      const chart = createChart(donnees());
      rendre(options, chart);
      evenementsPoint(options).mouseOver.call(chart.series[0].points[1]);
      expect(chart.customTotalLabel.attr).toHaveBeenCalledWith({ text: '8' });
    });

    it('restaure le total à la sortie du point', () => {
      const options = appliquer();
      const chart = createChart(donnees());
      rendre(options, chart);
      evenementsPoint(options).mouseOver.call(chart.series[0].points[1]);
      evenementsPoint(options).mouseOut.call(chart.series[0].points[1]);
      expect(chart.customLabel.attr).toHaveBeenCalledWith({ text: 'Total' });
      expect(chart.customTotalLabel.attr).toHaveBeenCalledWith({ text: '8' });
    });

    it('restaure le point sélectionné à la sortie du point', () => {
      const options = appliquer();
      const chart = createChart(donnees());
      chart.series[0].points[0].sliced = true;
      rendre(options, chart);
      evenementsPoint(options).mouseOver.call(chart.series[0].points[1]);
      evenementsPoint(options).mouseOut.call(chart.series[0].points[1]);
      expect(chart.customLabel.attr).toHaveBeenCalledWith({ text: 'A' });
      expect(chart.customTotalLabel.attr).toHaveBeenCalledWith({ text: '3' });
    });

    it('ne met rien à jour avant le premier rendu', () => {
      const options = appliquer();
      const chart = createChart(donnees());
      expect(() => evenementsPoint(options).mouseOver.call(chart.series[0].points[1])).not.toThrow();
      expect(chart.renderer.text).not.toHaveBeenCalled();
    });

    it('appelle les événements de survol d\'origine', () => {
      const originalOver = jasmine.createSpy('mouseOver');
      const originalOut = jasmine.createSpy('mouseOut');
      const options = appliquer(undefined, {
        plotOptions: { series: { point: { events: { mouseOver: originalOver, mouseOut: originalOut } } } },
      });
      const chart = createChart(donnees());
      rendre(options, chart);
      evenementsPoint(options).mouseOver.call(chart.series[0].points[1]);
      evenementsPoint(options).mouseOut.call(chart.series[0].points[1]);
      expect(originalOver).toHaveBeenCalled();
      expect(originalOut).toHaveBeenCalled();
    });
  });

  describe('clic sur un point', () => {
    it('sélectionne le point cliqué et désélectionne les autres', () => {
      const options = appliquer();
      const points = donnees();
      const chart = createChart(points);
      evenementsPoint(options).click.call(points[0]);
      expect(points[0].slice).toHaveBeenCalledWith(true, false);
      expect(points[0].select).toHaveBeenCalledWith(true, false);
      expect(points[1].slice).toHaveBeenCalledWith(false, false);
      expect(points[1].select).toHaveBeenCalledWith(false, false);
      expect(chart.redraw).toHaveBeenCalled();
    });

    it('désélectionne le point déjà sélectionné', () => {
      const options = appliquer();
      const points = donnees();
      points[0].sliced = true;
      createChart(points);
      evenementsPoint(options).click.call(points[0]);
      expect(points[0].slice).toHaveBeenCalledWith(false, false);
      expect(points[0].select).toHaveBeenCalledWith(false, false);
    });

    it('ne modifie pas la sélection lorsque allowPointSelect vaut false sur la série', () => {
      const options = appliquer(undefined, { plotOptions: { series: { allowPointSelect: false } } });
      const points = donnees();
      const chart = createChart(points);
      evenementsPoint(options).click.call(points[0]);
      expect(points[0].slice).not.toHaveBeenCalled();
      expect(points[1].slice).not.toHaveBeenCalled();
      expect(chart.redraw).not.toHaveBeenCalled();
    });

    it('ne modifie pas la sélection lorsque allowPointSelect vaut false sur le pie', () => {
      const options = appliquer(undefined, { plotOptions: { pie: { allowPointSelect: false } } });
      const points = donnees();
      const chart = createChart(points);
      evenementsPoint(options).click.call(points[0]);
      expect(points[0].select).not.toHaveBeenCalled();
      expect(chart.redraw).not.toHaveBeenCalled();
    });

    it('retourne false sans clic d\'origine', () => {
      const options = appliquer();
      const points = donnees();
      createChart(points);
      expect(evenementsPoint(options).click.call(points[0])).toBeFalse();
    });

    it('retourne la valeur du clic d\'origine', () => {
      const originalClick = jasmine.createSpy('click').and.returnValue('retour');
      const options = appliquer(undefined, { plotOptions: { series: { point: { events: { click: originalClick } } } } });
      const points = donnees();
      createChart(points);
      expect(evenementsPoint(options).click.call(points[0])).toBe('retour');
      expect(originalClick).toHaveBeenCalled();
    });
  });

  describe('clic sur le graphique', () => {
    it('désélectionne les points sélectionnés et redessine', () => {
      const options = appliquer();
      const points = donnees();
      points[0].selected = true;
      points[1].sliced = true;
      const chart = createChart(points);
      options.chart.events.click.call(chart, {});
      expect(points[0].slice).toHaveBeenCalledWith(false, false);
      expect(points[0].select).toHaveBeenCalledWith(false, false);
      expect(points[1].slice).toHaveBeenCalledWith(false, false);
      expect(chart.redraw).toHaveBeenCalled();
    });

    it('ne redessine pas lorsqu\'aucun point n\'est sélectionné', () => {
      const options = appliquer();
      const chart = createChart(donnees());
      options.chart.events.click.call(chart, {});
      expect(chart.redraw).not.toHaveBeenCalled();
    });

    it('appelle le clic de graphique d\'origine', () => {
      const originalClick = jasmine.createSpy('chartClick');
      const options = appliquer(undefined, { chart: { events: { click: originalClick } } });
      const chart = createChart(donnees());
      options.chart.events.click.call(chart, {});
      expect(originalClick).toHaveBeenCalled();
    });
  });
});
