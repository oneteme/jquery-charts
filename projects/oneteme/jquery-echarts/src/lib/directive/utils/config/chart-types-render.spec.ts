import * as echarts from 'echarts';
import { ChartType } from '@oneteme/jquery-core';
import { applyCommonConfig, buildBaseOption } from '../chart-utils';
import { resolveConfigurator } from './chart-config-registry';

/** Reproduit le pipeline de la directive (sans le dataZoom) et rend le graphique dans un conteneur réel. */
function renderType(type: ChartType, data: any[], config: any): { option: any; seriesTypes: string[]; polygons: number[][][] } {
  const configurator = resolveConfigurator(type);
  const model = configurator.buildChartData(data, config, type);
  const typeOption = configurator.buildOption(model, type, config);
  const option = applyCommonConfig({ ...buildBaseOption(config), ...typeOption }, config);

  const host = document.createElement('div');
  host.style.width = '640px';
  host.style.height = '420px';
  document.body.appendChild(host);
  const instance = echarts.init(host, undefined, { renderer: 'canvas' });
  try {
    instance.setOption(option as any, { notMerge: true });
    const rendered: any = instance.getOption();
    const displayed: any[] = (instance.getZr() as any).storage.getDisplayList(true);
    const polygons = displayed.filter((el) => el.type === 'polygon').map((el) => el.shape.points as number[][]);
    return { option, seriesTypes: rendered.series.map((s: any) => s.type), polygons };
  } finally {
    instance.dispose();
    host.remove();
  }
}

describe('Rendu ECharts des nouveaux types', () => {
  it('gauge : une jauge par catégorie', () => {
    const { seriesTypes } = renderType(
      'gauge',
      [{ c: 'A', v: 42 }, { c: 'B', v: 77 }],
      { series: [{ name: 'S', data: { xField: 'c', yField: 'v' }, unit: '%' }] }
    );
    expect(seriesTypes).toEqual(['gauge', 'gauge']);
  });

  it('sankey : une série sankey avec nœuds et liens', () => {
    const { seriesTypes } = renderType(
      'sankey',
      [{ s: 'A', v: 3 }, { s: 'B', v: 2 }],
      { series: [{ name: 'Cible', data: { xField: 's', yField: 'v' } }] }
    );
    expect(seriesTypes).toEqual(['sankey']);
  });

  it('boxplot : boîtes et valeurs aberrantes', () => {
    const { seriesTypes } = renderType(
      'boxplot',
      [{ c: 'A', v: 1 }, { c: 'A', v: 2 }, { c: 'A', v: 3 }, { c: 'A', v: 50 }, { c: 'B', v: 4 }],
      { series: [{ name: 'S', data: { xField: 'c', yField: 'v' } }] }
    );
    expect(seriesTypes).toEqual(['boxplot', 'scatter']);
  });

  it('radialBar : barres polaires', () => {
    const { seriesTypes } = renderType(
      'radialBar',
      [{ c: 'A', v: 3 }, { c: 'B', v: 5 }],
      { series: [{ name: 'S', data: { xField: 'c', yField: 'v' } }] }
    );
    expect(seriesTypes).toEqual(['bar']);
  });

  it('columnpyramid : dessine un triangle par point, pointe au-dessus de la base si positif et en dessous si négatif', () => {
    const { seriesTypes, polygons } = renderType(
      'columnpyramid',
      [{ c: 'A', v: 3 }, { c: 'B', v: -2 }],
      { series: [{ name: 'S1', data: { xField: 'c', yField: 'v' } }] }
    );
    expect(seriesTypes).toEqual(['custom']);
    expect(polygons.length).toBe(2);
    polygons.forEach((points) => expect(points.length).toBe(3));
    const [positive, negative] = polygons;
    expect(positive[2][1]).toBeLessThan(positive[0][1]);
    expect(negative[2][1]).toBeGreaterThan(negative[0][1]);
  });

  it('rose : pie avec roseType', () => {
    const { option, seriesTypes } = renderType(
      'rose',
      [{ c: 'A', v: 3 }, { c: 'B', v: 5 }],
      { series: [{ name: 'S', data: { xField: 'c', yField: 'v' } }] }
    );
    expect(seriesTypes).toEqual(['pie']);
    expect(option.series[0].roseType).toBe('area');
    expect(option.series[0].radius).toBe('70%');
  });

  it('rangeArea : aire min/max', () => {
    const { seriesTypes } = renderType(
      'rangeArea',
      [{ c: 'A', lo: 1, hi: 4 }, { c: 'B', lo: 2, hi: 6 }],
      { series: [{ name: 'S', data: { x: (o: any) => o.c, y: (o: any) => [o.lo, o.hi] } }] }
    );
    expect(seriesTypes).toEqual(['line', 'line']);
  });

  it('sunburst : une série sunburst', () => {
    const { option, seriesTypes } = renderType(
      'sunburst',
      [{ c: 'A', v: 3 }, { c: 'B', v: 5 }],
      { series: [{ name: 'S', data: { xField: 'c', yField: 'v' } }] }
    );
    expect(seriesTypes).toEqual(['sunburst']);
    expect(option.series[0].data.length).toBe(2);
  });

  it('graph : un graphe force avec nœuds et liens', () => {
    const { seriesTypes } = renderType(
      'graph',
      [{ s: 'A', v: 2 }, { s: 'B', v: 1 }],
      { series: [{ name: 'T', data: { xField: 's', yField: 'v' } }] }
    );
    expect(seriesTypes).toEqual(['graph']);
  });

  it('calendar : une heatmap calendaire', () => {
    const { option, seriesTypes } = renderType(
      'calendar',
      [{ d: '2024-01-05', v: 2 }, { d: '2024-01-06', v: 4 }],
      { series: [{ name: 'S', data: { xField: 'd', yField: 'v' } }] }
    );
    expect(seriesTypes).toEqual(['heatmap']);
    expect(option.calendar.range).toEqual(['2024-01-05', '2024-01-06']);
  });

  it('waterfall : une série custom dessinant les barres de cascade', () => {
    const { seriesTypes } = renderType(
      'waterfall',
      [{ c: 'A', v: 10 }, { c: 'B', v: -4 }],
      { series: [{ name: 'S', data: { xField: 'c', yField: 'v' } }] }
    );
    expect(seriesTypes).toEqual(['custom']);
  });
});
