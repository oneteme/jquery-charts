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

  return {
    xAxis: {
      type: xType as any,
      data: isContinue ? undefined : chart.categories.map(String),
      boundaryGap: false,
      name: config.xtitle,
      nameLocation: 'center',
      nameGap: 30,
    },
    yAxis: {
      type: 'value',
      name: config.ytitle,
      nameLocation: 'center',
      nameGap: 40,
    },
    series: chart.series.map((s) => ({
      type: 'line',
      name: s.name,
      smooth: isSmooth(type),
      areaStyle: hasArea(type) ? {} : undefined,
      stack: s.stack,
      data: (isContinue
        ? (s.data as Coordinate2D[]).map((d) => [d.x, d.y])
        : s.data) as any,
      itemStyle: s.color ? { color: s.color } : undefined,
      lineStyle: s.color ? { color: s.color } : undefined,
    })) as any,
  };
}

export const lineConfigurator: EChartTypeConfigurator = {
  supports: (type) => LINE_TYPES.includes(type),

  buildChartData: (data, config, type) =>
    buildChart(data, { ...config, continue: config.continue ?? false }),

  buildOption: (chart, type, config) => buildLineOption(chart as any, type, config),

  tooltipTrigger: 'axis',
};
