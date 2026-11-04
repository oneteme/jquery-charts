import { barConfigurator, computePyramidPoints, pyramidSlot, toPyramidPoints } from './bar-config';

describe('pyramidSlot', () => {
  it('centre une pyramide unique sur la catégorie et occupe 60 % de la largeur', () => {
    expect(pyramidSlot(100, 0, 1)).toEqual({ offset: 0, width: 60 });
  });

  it('répartit deux séries de part et d\'autre du centre sans chevauchement', () => {
    const first = pyramidSlot(100, 0, 2);
    const second = pyramidSlot(100, 1, 2);
    expect(first).toEqual({ offset: -15, width: 30 });
    expect(second).toEqual({ offset: 15, width: 30 });
    expect(first.offset + first.width / 2).toBeCloseTo(second.offset - second.width / 2, 6);
  });

  it('ne divise jamais par zéro', () => {
    expect(pyramidSlot(100, 0, 0)).toEqual({ offset: 0, width: 60 });
  });
});

describe('computePyramidPoints', () => {
  it('construit un triangle : base de largeur `width` puis pointe au centre', () => {
    expect(computePyramidPoints(50, 200, 100, 20)).toEqual([
      [40, 200],
      [60, 200],
      [50, 100],
    ]);
  });
});

describe('toPyramidPoints', () => {
  it('associe chaque valeur à son index de catégorie et ignore les valeurs absentes', () => {
    expect(toPyramidPoints([1, null, 3, undefined])).toEqual([
      [0, 1],
      [2, 3],
    ]);
  });
});

describe('barConfigurator columnpyramid', () => {
  const config: any = {
    series: [
      { name: 'S1', data: { xField: 'c', yField: 'v' }, color: '#ff0000' },
      { name: 'S2', data: { xField: 'c', yField: 'v' } },
    ],
  };
  const rows = [
    { c: 'A', v: 3 },
    { c: 'B', v: -2 },
  ];

  it('supporte columnpyramid en plus de bar et column', () => {
    expect(barConfigurator.supports('columnpyramid')).toBeTrue();
    expect(barConfigurator.supports('column')).toBeTrue();
    expect(barConfigurator.supports('bar')).toBeTrue();
    expect(barConfigurator.supports('line')).toBeFalse();
  });

  it('produit une série custom par série de données', () => {
    const model = barConfigurator.buildChartData(rows, config, 'columnpyramid');
    const option: any = barConfigurator.buildOption(model, 'columnpyramid', config);
    expect(option.series.length).toBe(2);
    expect(option.series.every((s: any) => s.type === 'custom')).toBeTrue();
    expect(option.series[0].data).toEqual([
      [0, 3],
      [1, -2],
    ]);
    expect(option.series[0].itemStyle).toEqual({ color: '#ff0000' });
    expect(option.series[1].itemStyle).toBeUndefined();
    expect(typeof option.series[0].renderItem).toBe('function');
  });

  it('force l\'axe de valeurs à inclure 0 pour que la base de la pyramide soit visible', () => {
    const model = barConfigurator.buildChartData(rows, config, 'columnpyramid');
    const option: any = barConfigurator.buildOption(model, 'columnpyramid', config);
    expect(option.yAxis.type).toBe('value');
    expect(option.yAxis.min({ min: 5 })).toBe(0);
    expect(option.yAxis.min({ min: -3 })).toBe(-3);
  });
});
