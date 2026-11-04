import { radialBarConfigurator } from './radial-bar-config';

const config = (extra: Record<string, unknown> = {}): any => ({
  series: [{ name: (o: any) => o.s, data: { xField: 'c', yField: 'v' }, ...extra }],
});

const rows = [
  { s: 'S1', c: 'A', v: 3 },
  { s: 'S1', c: 'B', v: 5 },
];

function build(data: any[] = rows, cfg: any = config()): any {
  const model = radialBarConfigurator.buildChartData(data, cfg, 'radialBar');
  return radialBarConfigurator.buildOption(model, 'radialBar', cfg);
}

describe('radialBarConfigurator', () => {
  it('supporte radialBar uniquement', () => {
    expect(radialBarConfigurator.supports('radialBar')).toBeTrue();
    expect(radialBarConfigurator.supports('bar')).toBeFalse();
  });

  it('utilise un tooltip par élément', () => {
    expect(radialBarConfigurator.tooltipTrigger).toBe('item');
  });

  it('place les catégories sur l\'axe radial et les valeurs sur l\'axe angulaire', () => {
    const option = build();
    expect(option.radiusAxis).toEqual({ type: 'category', data: ['A', 'B'] });
    expect(option.angleAxis.type).toBe('value');
    expect(option.angleAxis.startAngle).toBe(75);
  });

  it('ne fixe aucun maximum sur l\'axe angulaire', () => {
    const option = build();
    expect(option.angleAxis.max).toBeUndefined();
  });

  it('une barre polaire par série, avec les valeurs de chaque catégorie', () => {
    const option = build();
    expect(option.series.length).toBe(1);
    expect(option.series[0].type).toBe('bar');
    expect(option.series[0].coordinateSystem).toBe('polar');
    expect(option.series[0].data).toEqual([3, 5]);
  });

  it('active les extrémités arrondies et le fond de piste', () => {
    const option = build();
    expect(option.series[0].roundCap).toBeTrue();
    expect(option.series[0].showBackground).toBeTrue();
  });

  it('applique la couleur de la série', () => {
    const option = build(rows, config({ color: '#abcdef' }));
    expect(option.series[0].itemStyle).toEqual({ color: '#abcdef' });
  });

  it('retire grille et axes cartésiens', () => {
    const option = build();
    expect(option.grid).toBeUndefined();
    expect(option.xAxis).toBeUndefined();
    expect(option.yAxis).toBeUndefined();
  });
});
