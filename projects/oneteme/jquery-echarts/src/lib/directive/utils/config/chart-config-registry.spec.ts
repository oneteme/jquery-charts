import { resolveConfigurator } from './chart-config-registry';
import { barConfigurator } from './bar-config';
import { lineConfigurator } from './line-config';
import { pieConfigurator } from './pie-config';
import { rangeConfigurator } from './range-config';
import { scatterConfigurator } from './scatter-config';
import { heatmapConfigurator } from './heatmap-config';
import { treemapConfigurator } from './treemap-config';
import { funnelConfigurator } from './funnel-config';
import { radarConfigurator } from './radar-config';
import { radialBarConfigurator } from './radial-bar-config';
import { gaugeConfigurator } from './gauge-config';
import { sankeyConfigurator } from './sankey-config';
import { boxplotConfigurator } from './boxplot-config';
import { mixedConfigurator } from './mixed-config';

describe('resolveConfigurator', () => {
  const expectations: [string, unknown][] = [
    ['mixed', mixedConfigurator],
    ['heatmap', heatmapConfigurator],
    ['treemap', treemapConfigurator],
    ['funnel', funnelConfigurator],
    ['radar', radarConfigurator],
    ['radialBar', radialBarConfigurator],
    ['gauge', gaugeConfigurator],
    ['sankey', sankeyConfigurator],
    ['boxplot', boxplotConfigurator],
    ['scatter', scatterConfigurator],
    ['rangeBar', rangeConfigurator],
    ['rangeArea', rangeConfigurator],
    ['pie', pieConfigurator],
    ['line', lineConfigurator],
    ['bar', barConfigurator],
  ];

  expectations.forEach(([type, expected]) => {
    it(`résout « ${type} » vers le bon configurateur`, () => {
      expect(resolveConfigurator(type as any)).toBe(expected as any);
    });
  });

  it('lève une erreur pour un type inconnu', () => {
    expect(() => resolveConfigurator('inconnu' as any)).toThrowError(/non supporté/);
  });
});
