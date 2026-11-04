import { funnelConfigurator } from './funnel-config';

const config = (): any => ({
  title: 'Parcours',
  series: [{ name: 'Étapes', data: { xField: 'c', yField: 'v' } }],
});

const rows = [
  { c: 'Vus', v: 50 },
  { c: 'Ajoutés', v: 120 },
  { c: 'Achetés', v: 30 },
];

function build(type: any, data: any[] = rows): any {
  const cfg = config();
  const model = funnelConfigurator.buildChartData(data, cfg, type);
  return funnelConfigurator.buildOption(model, type, cfg);
}

describe('funnelConfigurator', () => {
  it('supporte funnel et pyramid uniquement', () => {
    expect(funnelConfigurator.supports('funnel')).toBeTrue();
    expect(funnelConfigurator.supports('pyramid')).toBeTrue();
    expect(funnelConfigurator.supports('bar')).toBeFalse();
  });

  it('utilise un tooltip par élément', () => {
    expect(funnelConfigurator.tooltipTrigger).toBe('item');
  });

  it('funnel : trie par valeur décroissante (plus grand en haut)', () => {
    const option = build('funnel');
    const [series] = option.series;
    expect(series.type).toBe('funnel');
    expect(series.sort).toBe('descending');
    expect(series.data.map((d: any) => d.value)).toEqual([120, 50, 30]);
    expect(series.data[0].name).toBe('Ajoutés');
  });

  it('pyramid : trie par valeur croissante (plus petit en haut)', () => {
    const option = build('pyramid');
    const [series] = option.series;
    expect(series.sort).toBe('ascending');
    expect(series.data.map((d: any) => d.value)).toEqual([30, 50, 120]);
  });

  it('remplace une valeur absente par 0', () => {
    const option = build('funnel', [{ c: 'A', v: 4 }, { c: 'B', v: undefined }]);
    expect(option.series[0].data).toEqual([
      { name: 'A', value: 4 },
      { name: 'B', value: 0 },
    ]);
  });

  it('conserve un élément à zéro', () => {
    const option = build('funnel', [{ c: 'A', v: 4 }, { c: 'B', v: 0 }]);
    expect(option.series[0].data.map((d: any) => d.name)).toEqual(['A', 'B']);
  });

  it('nomme la série avec le titre de la configuration', () => {
    const option = build('funnel');
    expect(option.series[0].name).toBe('Parcours');
  });

  it('place les étiquettes à l\'intérieur et la légende en bas', () => {
    const option = build('funnel');
    expect(option.series[0].label).toEqual({ show: true, position: 'inside' });
    expect(option.legend.bottom).toBe(0);
  });
});
