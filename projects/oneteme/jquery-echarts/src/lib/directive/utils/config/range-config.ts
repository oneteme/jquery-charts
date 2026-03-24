import { buildChart, ChartProvider, ChartType, CommonChart, XaxisType } from '@oneteme/jquery-core';
import { EChartsOption } from '../types';
import { getXAxisType } from '../chart-utils';
import { EChartTypeConfigurator } from './chart-config-registry';

const RANGE_TYPES: ChartType[] = ['rangeBar', 'rangeColumn', 'arearange', 'areasplinerange', 'columnrange'];

/**
 * Implémentation des graphiques Range via deux séries "bar" empilées :
 *  - Série 1 transparente (baseline de 0 → min)
 *  - Série 2 visible (de min → max = valeur max-min)
 *
 * ECharts ne dispose pas de type range natif pour les barres,
 * ce pattern produit un résultat visuellement identique.
 *
 * Pour arearange / areasplinerange, on utilise deux séries line en stack.
 */
function buildRangeOption(
  chart: CommonChart<XaxisType, number[]>,
  type: ChartType,
  config: ChartProvider<any, any>
): EChartsOption {
  const isHorizontal = type === 'rangeBar';
  const isArea = type === 'arearange' || type === 'areasplinerange';
  const isSmooth = type === 'areasplinerange';
  const isContinue = !!config.continue;

  const xType = getXAxisType(chart.categories, isContinue);

  const categoryAxis = {
    type: 'category' as const,
    data: chart.categories.map(String),
    boundaryGap: true,
  };
  const valueAxis = { type: 'value' as const };

  const seriesList: any[] = [];

  chart.series.forEach((s) => {
    const baseData = s.data.map((d: any) => (Array.isArray(d) ? d[0] : 0));
    const rangeData = s.data.map((d: any) =>
      Array.isArray(d) ? d[1] - d[0] : 0
    );

    if (isArea) {
      // Série de base transparente
      seriesList.push({
        type: 'line',
        name: s.name ? `${s.name} (min)` : 'min',
        data: isContinue
          ? (s.data as any[]).map((d: any) => [d.x, Array.isArray(d.y) ? d.y[0] : d.y])
          : baseData,
        stack: s.stack ?? `range_${s.name}`,
        areaStyle: { opacity: 0 },
        smooth: isSmooth,
        lineStyle: { width: 0 },
        symbol: 'none',
        itemStyle: { opacity: 0 },
      });
      // Série visible
      seriesList.push({
        type: 'line',
        name: s.name ?? '',
        data: isContinue
          ? (s.data as any[]).map((d: any) => [d.x, Array.isArray(d.y) ? d.y[1] - d.y[0] : 0])
          : rangeData,
        stack: s.stack ?? `range_${s.name}`,
        areaStyle: { opacity: 0.4 },
        smooth: isSmooth,
        itemStyle: s.color ? { color: s.color } : undefined,
      });
    } else {
      // Série de base transparente
      seriesList.push({
        type: 'bar',
        name: s.name ? `${s.name} (base)` : 'base',
        data: baseData,
        stack: s.stack ?? `range_${s.name}`,
        itemStyle: { opacity: 0 },
        barMaxWidth: '60%',
      });
      // Série visible (hauteur = max - min)
      seriesList.push({
        type: 'bar',
        name: s.name ?? '',
        data: rangeData,
        stack: s.stack ?? `range_${s.name}`,
        itemStyle: s.color ? { color: s.color } : undefined,
        barMaxWidth: '60%',
      });
    }
  });

  return {
    xAxis: isHorizontal ? valueAxis : (isContinue ? { type: xType } : categoryAxis),
    yAxis: isHorizontal ? categoryAxis : valueAxis,
    series: seriesList,
  };
}

export const rangeConfigurator: EChartTypeConfigurator = {
  supports: (type) => RANGE_TYPES.includes(type),

  buildChartData: (data, config, type) =>
    buildChart(data, { ...config, continue: config.continue ?? false }),

  buildOption: (chart, type, config) => buildRangeOption(chart as any, type, config),

  tooltipTrigger: 'axis',
};
