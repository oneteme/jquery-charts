import { treemapConfigurator } from './treemap-config';

const config = (extra: Record<string, unknown> = {}): any => ({
  title: 'Mémoire',
  series: [{ name: (o: any) => o.s, data: { xField: 'c', yField: 'v' }, ...extra }],
});

function build(data: any[], cfg: any = config()): any {
  const model = treemapConfigurator.buildChartData(data, cfg, 'treemap');
  return treemapConfigurator.buildOption(model, 'treemap', cfg);
}

describe('treemapConfigurator', () => {
  it('supporte treemap uniquement', () => {
    expect(treemapConfigurator.supports('treemap')).toBeTrue();
    expect(treemapConfigurator.supports('pie')).toBeFalse();
  });

  it('utilise un tooltip par élément', () => {
    expect(treemapConfigurator.tooltipTrigger).toBe('item');
  });

  it('une seule série : chaque catégorie devient une feuille, profondeur 1', () => {
    const option = build([
      { s: 'S', c: 'A', v: 4 },
      { s: 'S', c: 'B', v: 6 },
    ]);
    const [series] = option.series;
    expect(series.type).toBe('treemap');
    expect(series.leafDepth).toBe(1);
    expect(series.data).toEqual([
      { name: 'A', value: 4 },
      { name: 'B', value: 6 },
    ]);
  });

  it('écarte les catégories nulles, nulles ou négatives', () => {
    const option = build([
      { s: 'S', c: 'A', v: 4 },
      { s: 'S', c: 'B', v: 0 },
      { s: 'S', c: 'C', v: -2 },
    ]);
    expect(option.series[0].data.map((d: any) => d.name)).toEqual(['A']);
  });

  it('plusieurs séries : chaque série devient un nœud parent avec sa somme et ses enfants', () => {
    const option = build([
      { s: 'S1', c: 'A', v: 1 },
      { s: 'S1', c: 'B', v: 2 },
      { s: 'S2', c: 'A', v: 5 },
    ]);
    const [series] = option.series;
    expect(series.leafDepth).toBe(2);
    expect(series.data[0]).toEqual({
      name: 'S1',
      value: 3,
      children: [
        { name: 'A', value: 1 },
        { name: 'B', value: 2 },
      ],
    });
    expect(series.data[1].value).toBe(5);
  });

  it('nomme le graphique avec le titre de la configuration', () => {
    const option = build([{ s: 'S', c: 'A', v: 1 }]);
    expect(option.series[0].name).toBe('Mémoire');
  });

  it('nomme le graphique "Treemap" sans titre', () => {
    const option = build([{ s: 'S', c: 'A', v: 1 }], { series: config().series });
    expect(option.series[0].name).toBe('Treemap');
  });

  it('affiche le nom et la valeur de chaque élément', () => {
    const option = build([{ s: 'S', c: 'A', v: 1 }]);
    expect(option.series[0].label).toEqual({ show: true, formatter: '{b}\n{c}' });
  });
});
