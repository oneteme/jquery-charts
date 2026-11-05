import { lineConfigurator } from './line-config';

const rows = [
  { s: 'S1', c: 'A', v: 1, t: 'line' },
  { s: 'S1', c: 'B', v: 2, t: 'line' },
  { s: 'S2', c: 'A', v: 3, t: 'area' },
];

const categoryConfig = (extra: Record<string, unknown> = {}): any => ({
  series: [{ name: (o: any) => o.s, data: { xField: 'c', yField: 'v' }, ...extra }],
});

function build(data: any[], config: any, type: any = 'line'): any {
  const model = lineConfigurator.buildChartData(data, config, type);
  return lineConfigurator.buildOption(model, type, config);
}

describe('lineConfigurator', () => {
  it('supporte line, spline, area et areaspline', () => {
    ['line', 'spline', 'area', 'areaspline'].forEach((type) => {
      expect(lineConfigurator.supports(type as any)).toBeTrue();
    });
    expect(lineConfigurator.supports('bar')).toBeFalse();
    expect(lineConfigurator.supports('scatter')).toBeFalse();
  });

  it('produit une série line par nom avec les valeurs alignées sur les catégories', () => {
    const option = build(rows.slice(0, 3), categoryConfig());
    expect(option.xAxis.type).toBe('category');
    expect(option.xAxis.data).toEqual(['A', 'B']);
    expect(option.series.map((s: any) => s.name)).toEqual(['S1', 'S2']);
    expect(option.series[0].data).toEqual([1, 2]);
    expect(option.series[1].data[0]).toBe(3);
    expect(option.series[1].data[1]).toBeUndefined();
  });

  it('n\'applique ni zone ni lissage pour le type line par défaut', () => {
    const option = build(rows.slice(0, 2), categoryConfig(), 'line');
    expect(option.series[0].type).toBe('line');
    expect(option.series[0].areaStyle).toBeUndefined();
    expect(option.series[0].smooth).toBeFalse();
  });

  it('applique la zone pour area et le lissage pour spline', () => {
    const area = build(rows.slice(0, 2), categoryConfig(), 'area');
    expect(area.series[0].areaStyle).toEqual({});
    expect(area.series[0].smooth).toBeFalse();

    const spline = build(rows.slice(0, 2), categoryConfig(), 'spline');
    expect(spline.series[0].areaStyle).toBeUndefined();
    expect(spline.series[0].smooth).toBeTrue();
  });

  it('applique zone et lissage pour areaspline', () => {
    const option = build(rows.slice(0, 2), categoryConfig(), 'areaspline');
    expect(option.series[0].areaStyle).toEqual({});
    expect(option.series[0].smooth).toBeTrue();
  });

  it('le type explicite d\'une série est prioritaire sur le type du graphique', () => {
    const option = build(
      rows,
      categoryConfig({ type: (o: any) => o.t }),
      'spline'
    );
    const [s1, s2] = option.series;
    expect(s1.smooth).toBeFalse();
    expect(s1.areaStyle).toBeUndefined();
    expect(s2.areaStyle).toEqual({});
  });

  it('une série sans type explicite hérite du type du graphique', () => {
    const option = build(rows.slice(0, 2), categoryConfig({ type: undefined }), 'areaspline');
    expect(option.series[0].smooth).toBeTrue();
    expect(option.series[0].areaStyle).toEqual({});
  });

  it('masque initialement une série visible: false via legend.selected', () => {
    const option = build(rows, categoryConfig({ visible: false }));
    expect(option.legend.selected).toEqual({ S1: false, S2: false });
  });

  it('n\'ajoute pas de legend.selected quand toutes les séries sont visibles', () => {
    const option = build(rows, categoryConfig());
    expect(option.legend).toBeUndefined();
  });

  it('transmet le stack et la couleur de la série', () => {
    const option = build(rows.slice(0, 2), categoryConfig({ stack: 'total', color: '#ff0000' }));
    expect(option.series[0].stack).toBe('total');
    expect(option.series[0].itemStyle).toEqual({ color: '#ff0000' });
    expect(option.series[0].lineStyle).toEqual({ color: '#ff0000' });
  });

  it('en mode continu, produit des couples [x, y] et un axe x numérique', () => {
    const data = [
      { s: 'S', x: 1, y: 10 },
      { s: 'S', x: 2, y: 20 },
    ];
    const config = {
      continue: true,
      series: [{ name: (o: any) => o.s, data: { xField: 'x', yField: 'y' } }],
    };
    const option = build(data, config);
    expect(option.xAxis.type).toBe('value');
    expect(option.xAxis.data).toBeUndefined();
    expect(option.series[0].data).toEqual([[1, 10], [2, 20]]);
  });

  it('en mode continu, un point marqué _noData reçoit le style de données absentes', () => {
    const data = [
      { s: 'S', x: 1, y: 10 },
      { s: 'S', x: 2, y: 0, _noData: true },
    ];
    const config = {
      continue: true,
      series: [{
        name: (o: any) => o.s,
        data: { xField: 'x', yField: 'y' },
        noDataStyle: { color: '#000000', symbol: 'rect', symbolSize: 8 },
      }],
    };
    const [, noData] = build(data, config).series[0].data;
    expect(noData.value).toEqual([2, 0]);
    expect(noData._noData).toBeTrue();
    expect(noData.symbol).toBe('rect');
    expect(noData.symbolSize).toBe(8);
    expect(noData.itemStyle.color).toBe('#000000');
  });
});
