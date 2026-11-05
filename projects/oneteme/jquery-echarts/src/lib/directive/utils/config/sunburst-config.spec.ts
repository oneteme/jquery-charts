import { sunburstConfigurator } from './sunburst-config';

describe('sunburstConfigurator', () => {
  const config: any = { title: 'Répartition', series: [{ name: 'S', data: { xField: 'c', yField: 'v' } }] };
  const rows = [{ c: 'A', v: 3 }, { c: 'B', v: 5 }];

  it('supporte uniquement sunburst', () => {
    expect(sunburstConfigurator.supports('sunburst')).toBeTrue();
    expect(sunburstConfigurator.supports('treemap')).toBeFalse();
  });

  it('produit une série sunburst à partir des catégories, sans légende ni axes', () => {
    const model = sunburstConfigurator.buildChartData(rows, config, 'sunburst');
    const option: any = sunburstConfigurator.buildOption(model, 'sunburst', config);
    expect(option.series.length).toBe(1);
    expect(option.series[0].type).toBe('sunburst');
    expect(option.series[0].data.map((n: any) => ({ name: n.name, value: n.value }))).toEqual([
      { name: 'A', value: 3 },
      { name: 'B', value: 5 },
    ]);
    expect(option.legend.show).toBeFalse();
    expect(option.xAxis).toBeUndefined();
    expect(option.yAxis).toBeUndefined();
  });

  it('crée un niveau parent par série quand il y en a plusieurs', () => {
    const multi: any = {
      series: [
        { name: 'S1', data: { xField: 'c', yField: 'v1' } },
        { name: 'S2', data: { xField: 'c', yField: 'v2' } },
      ],
    };
    const data = [{ c: 'A', v1: 1, v2: 2 }, { c: 'B', v1: 3, v2: 4 }];
    const model = sunburstConfigurator.buildChartData(data, multi, 'sunburst');
    const option: any = sunburstConfigurator.buildOption(model, 'sunburst', multi);
    expect(option.series[0].data.map((n: any) => n.name)).toEqual(['S1', 'S2']);
    expect(option.series[0].data[0].value).toBe(4);
    expect(option.series[0].data[0].children.map((n: any) => n.name)).toEqual(['A', 'B']);
  });
});
