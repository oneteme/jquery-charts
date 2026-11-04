import { scatterConfigurator } from './scatter-config';

const config = (extra: Record<string, unknown> = {}): any => ({
  series: [{ name: (o: any) => o.s, data: { xField: 'x', yField: 'y' }, ...extra }],
});

const rows = [
  { s: 'S1', x: 1, y: 10 },
  { s: 'S1', x: 2, y: 20 },
  { s: 'S2', x: 3, y: 5 },
];

function build(type: any, data: any[] = rows, cfg: any = config()): any {
  const model = scatterConfigurator.buildChartData(data, cfg, type);
  return scatterConfigurator.buildOption(model, type, cfg);
}

describe('scatterConfigurator', () => {
  it('supporte scatter et bubble uniquement', () => {
    expect(scatterConfigurator.supports('scatter')).toBeTrue();
    expect(scatterConfigurator.supports('bubble')).toBeTrue();
    expect(scatterConfigurator.supports('line')).toBeFalse();
  });

  it('utilise un tooltip par élément', () => {
    expect(scatterConfigurator.tooltipTrigger).toBe('item');
  });

  it('construit des axes de valeurs et une série scatter par nom', () => {
    const option = build('scatter');
    expect(option.xAxis).toEqual({ type: 'value' });
    expect(option.yAxis).toEqual({ type: 'value' });
    expect(option.series.map((s: any) => s.name)).toEqual(['S1', 'S2']);
    expect(option.series.every((s: any) => s.type === 'scatter')).toBeTrue();
  });

  it('transforme chaque point en couple [x, y]', () => {
    const option = build('scatter');
    expect(option.series[0].data).toEqual([[1, 10], [2, 20]]);
    expect(option.series[1].data).toEqual([[3, 5]]);
  });

  it('fixe une taille de symbole constante pour scatter', () => {
    const option = build('scatter');
    expect(option.series[0].symbolSize).toBe(10);
  });

  it('applique la couleur de la série', () => {
    const option = build('scatter', rows, config({ color: '#00ff00' }));
    expect(option.series[0].itemStyle).toEqual({ color: '#00ff00' });
  });

  it('en bubble, la taille du symbole est une fonction croissante de la valeur z', () => {
    const option = build('bubble');
    const sizeOf: (value: number[]) => number = option.series[0].symbolSize;
    expect(typeof sizeOf).toBe('function');
    expect(sizeOf([0, 0, 16])).toBeGreaterThan(sizeOf([0, 0, 1]));
  });

  it('en bubble, la taille ne descend jamais sous 5 px', () => {
    const option = build('bubble');
    const sizeOf: (value: number[]) => number = option.series[0].symbolSize;
    expect(sizeOf([0, 0, 0])).toBe(5);
    expect(sizeOf([0, 0, -4])).toBeGreaterThanOrEqual(5);
  });

  it('en bubble, z est lu depuis zField et dimensionne chaque bulle', () => {
    const sized = [
      { s: 'S1', x: 1, y: 10, size: 1 },
      { s: 'S1', x: 2, y: 20, size: 16 },
    ];
    const cfg = { series: [{ name: (o: any) => o.s, data: { xField: 'x', yField: 'y', zField: 'size' } }] };
    const option = build('bubble', sized, cfg);

    expect(option.series[0].data).toEqual([[1, 10, 1], [2, 20, 16]]);
    const sizeOf: (value: number[]) => number = option.series[0].symbolSize;
    expect(sizeOf(option.series[0].data[1])).toBeGreaterThan(sizeOf(option.series[0].data[0]));
  });
});
