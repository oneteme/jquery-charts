import { pieConfigurator } from './pie-config';

const config = (): any => ({
  series: [{ name: 'Répartition', data: { xField: 'c', yField: 'v' } }],
});

const rows = [
  { c: 'A', v: 3 },
  { c: 'B', v: 5 },
  { c: 'C', v: 0 },
];

function build(type: any, data: any[] = rows): any {
  const cfg = config();
  const model = pieConfigurator.buildChartData(data, cfg, type);
  return pieConfigurator.buildOption(model, type, cfg);
}

describe('pieConfigurator', () => {
  it('supporte pie, donut et rose uniquement', () => {
    expect(pieConfigurator.supports('pie')).toBeTrue();
    expect(pieConfigurator.supports('donut')).toBeTrue();
    expect(pieConfigurator.supports('rose')).toBeTrue();
    expect(pieConfigurator.supports('bar')).toBeFalse();
  });

  it('utilise un tooltip par élément', () => {
    expect(pieConfigurator.tooltipTrigger).toBe('item');
  });

  it('pie : une seule série centrée avec un rayon de 70 %', () => {
    const option = build('pie');
    expect(option.series.length).toBe(1);
    expect(option.series[0].type).toBe('pie');
    expect(option.series[0].radius).toBe('70%');
    expect(option.series[0].center).toEqual(['50%', '50%']);
    expect(option.series[0].roseType).toBeUndefined();
  });

  it('transforme chaque catégorie en {name, value}', () => {
    const option = build('pie');
    expect(option.series[0].data).toEqual([
      { name: 'A', value: 3 },
      { name: 'B', value: 5 },
      { name: 'C', value: 0 },
    ]);
  });

  it('écarte les valeurs absentes sans écarter les zéros', () => {
    const option = build('pie', [{ c: 'A', v: 3 }, { c: 'B', v: undefined }, { c: 'C', v: 0 }]);
    expect(option.series[0].data.map((d: any) => d.name)).toEqual(['A', 'C']);
  });

  it('donut : anneau de 40 % à 70 % et une seconde série silencieuse pour l\'effet de survol', () => {
    const option = build('donut');
    expect(option.series.length).toBe(2);
    expect(option.series[0].radius).toEqual(['40%', '70%']);
    expect(option.series[1].silent).toBeTrue();
    expect(option.series[1].emphasis).toEqual({ disabled: true });
  });

  it('donut : le survol affiche le pourcentage au centre', () => {
    const option = build('donut');
    expect(option.series[0].emphasis.label).toEqual(jasmine.objectContaining({ show: true, formatter: '{d}%' }));
  });

  it('rose : applique roseType area', () => {
    const option = build('rose');
    expect(option.series.length).toBe(1);
    expect(option.series[0].roseType).toBe('area');
    expect(option.series[0].radius).toBe('70%');
  });

  it('expose la légende en colonne à gauche', () => {
    const option = build('pie');
    expect(option.legend.orient).toBe('vertical');
    expect(option.legend.left).toBe('left');
  });

  it('retire grille et axes', () => {
    const option = build('pie');
    expect(option.grid).toBeUndefined();
    expect(option.xAxis).toBeUndefined();
    expect(option.yAxis).toBeUndefined();
  });
});
