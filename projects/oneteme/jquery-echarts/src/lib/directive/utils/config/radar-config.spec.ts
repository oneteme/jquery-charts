import { radarConfigurator } from './radar-config';

const config = (extra: Record<string, unknown> = {}): any => ({
  series: [{ name: (o: any) => o.s, data: { xField: 'c', yField: 'v' }, ...extra }],
});

const rows = [
  { s: 'S1', c: 'A', v: 3 },
  { s: 'S1', c: 'B', v: 9 },
  { s: 'S2', c: 'A', v: 5 },
  { s: 'S2', c: 'B', v: 2 },
];

function build(type: any, data: any[] = rows, cfg: any = config()): any {
  const model = radarConfigurator.buildChartData(data, cfg, type);
  return radarConfigurator.buildOption(model, type, cfg);
}

describe('radarConfigurator', () => {
  it('supporte radar et radarArea uniquement', () => {
    expect(radarConfigurator.supports('radar')).toBeTrue();
    expect(radarConfigurator.supports('radarArea')).toBeTrue();
    expect(radarConfigurator.supports('pie')).toBeFalse();
  });

  it('utilise un tooltip par élément', () => {
    expect(radarConfigurator.tooltipTrigger).toBe('item');
  });

  it('définit un indicateur par catégorie avec le maximum observé sur toutes les séries', () => {
    const option = build('radar');
    expect(option.radar.indicator).toEqual([
      { name: 'A', max: 5 },
      { name: 'B', max: 9 },
    ]);
  });

  it('utilise 1 comme maximum quand toutes les valeurs d\'une catégorie valent 0', () => {
    const option = build('radar', [
      { s: 'S1', c: 'A', v: 0 },
      { s: 'S1', c: 'B', v: 4 },
    ]);
    expect(option.radar.indicator[0].max).toBe(1);
    expect(option.radar.indicator[1].max).toBe(4);
  });

  it('une série par nom avec sa valeur par catégorie', () => {
    const option = build('radar');
    expect(option.series.length).toBe(1);
    expect(option.series[0].type).toBe('radar');
    expect(option.series[0].data).toEqual([
      jasmine.objectContaining({ name: 'S1', value: [3, 9] }),
      jasmine.objectContaining({ name: 'S2', value: [5, 2] }),
    ]);
  });

  it('radar : pas de zone de remplissage', () => {
    const option = build('radar');
    expect(option.series[0].data[0].areaStyle).toBeUndefined();
  });

  it('radarArea : zone de remplissage à 30 % d\'opacité', () => {
    const option = build('radarArea');
    expect(option.series[0].data[0].areaStyle).toEqual({ opacity: 0.3 });
    expect(option.series[0].data[1].areaStyle).toEqual({ opacity: 0.3 });
  });

  it('applique la couleur de la série à la ligne et au marqueur', () => {
    const option = build('radar', rows, config({ color: '#123456' }));
    expect(option.series[0].data[0].itemStyle).toEqual({ color: '#123456' });
    expect(option.series[0].data[0].lineStyle).toEqual({ color: '#123456' });
  });

  it('forme polygonale et légende en bas', () => {
    const option = build('radar');
    expect(option.radar.shape).toBe('polygon');
    expect(option.legend.bottom).toBe(0);
  });
});
