import { buildChart, ChartProvider, ChartType, CommonChart, Coordinate2D, XaxisType, YaxisType } from '@oneteme/jquery-core';
import { EChartsOption } from '../types';
import { getXAxisType } from '../chart-utils';
import { EChartTypeConfigurator } from './chart-config-registry';

const LINE_TYPES: ChartType[] = ['line', 'spline', 'area', 'areaspline'];

function isSmooth(type: ChartType): boolean {
  return type === 'spline' || type === 'areaspline';
}

function hasArea(type: ChartType): boolean {
  return type === 'area' || type === 'areaspline';
}

function buildLineOption(
  chart: CommonChart<XaxisType, YaxisType | Coordinate2D>,
  type: ChartType,
  config: ChartProvider<any, any>
): EChartsOption {
  const isContinue = !!config.continue;
  const firstX = isContinue && chart.series[0]?.data[0]
    ? (chart.series[0].data[0] as Coordinate2D).x
    : undefined;
  const xType = getXAxisType(chart.categories, isContinue, firstX);

  // Séries masquées par défaut via visible: false → légende désélectionnée initialement
  const legendSelected: Record<string, boolean> = {};
  chart.series.forEach((s) => {
    if (s.visible === false && s.name) {
      legendSelected[s.name] = false;
    }
  });

  return {
    ...(Object.keys(legendSelected).length ? { legend: { selected: legendSelected } } : {}),
    xAxis: {
      type: xType as any,
      data: isContinue ? undefined : chart.categories.map(String),
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
    },
    series: chart.series.map((s) => {
      // Le type d'une série sans type explicite hérite du type du chart (ex: area, spline...)
      const serieType: ChartType = (s as any).type ?? type;
      const serieHasArea = serieType === 'area' || serieType === 'areaspline';
      const serieSmooth = serieType === 'spline' || serieType === 'areaspline' || isSmooth(type);
      return {
        type: 'line',
        name: s.name,
        smooth: serieSmooth,
        symbolSize: 0,
        areaStyle: serieHasArea ? {} : undefined,
        stack: s.stack,
        data: (isContinue
          ? (s.data as Coordinate2D[]).map((d) => {
              const src = (d as any)._o;
              if (src?._noData) {
                const noDataStyle = (s as any).noDataStyle ?? {};
                const color = noDataStyle.color ?? '#94a3b8';
                const symbolSize = noDataStyle.symbolSize ?? 5;
                const symbol = noDataStyle.symbol ?? 'circle';
                return {
                  value: [d.x, d.y],
                  _noData: true,
                  symbol,
                  symbolSize,
                  itemStyle: { color, borderColor: color, opacity: noDataStyle.opacity ?? 0.85 },
                };
              }
              return [d.x, d.y];
            })
          : xType === 'category'
            ? s.data
            : chart.categories.map((cat, i) => [cat, (s.data as any[])[i]])) as any,
        itemStyle: s.color ? { color: s.color } : undefined,
        lineStyle: s.color ? { color: s.color } : undefined,
        z: serieHasArea ? 1 : 2,
      };
    }) as any,
  };
}

export const lineConfigurator: EChartTypeConfigurator = {
  supports: (type) => LINE_TYPES.includes(type),

  buildChartData: (data, config, type) =>
    buildChart(data, { ...config, continue: config.continue ?? false }),

  buildOption: (chart, type, config) => buildLineOption(chart as any, type, config),

  tooltipTrigger: 'axis',
};
