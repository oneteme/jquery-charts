import { buildChart, ChartProvider, ChartType, CommonChart, XaxisType } from '@oneteme/jquery-core';
import { EChartsOption } from '../types';
import { EChartTypeConfigurator } from './chart-config-registry';

const RADIAL_BAR_TYPES: ChartType[] = ['radialBar'];

/**
 * Barres radiales : catégories sur l'axe radial, valeurs sur l'axe angulaire.
 * L'axe angulaire est en `value` sans max imposé (ECharts calcule le max automatiquement).
 * Plusieurs séries se superposent sur les mêmes anneaux : privilégier une seule série
 * ou accepter le chevauchement.
 */
function buildRadialBarOption(chart: CommonChart<XaxisType, number>): EChartsOption {
  return {
    grid: undefined,
    xAxis: undefined,
    yAxis: undefined,
    polar: { radius: ['20%', '80%'] },
    angleAxis: { type: 'value', startAngle: 75 },
    radiusAxis: { type: 'category', data: chart.categories.map(String) },
    series: chart.series.map((s) => ({
      type: 'bar',
      name: s.name,
      coordinateSystem: 'polar',
      data: s.data,
      roundCap: true,
      showBackground: true,
      itemStyle: s.color ? { color: s.color } : undefined,
    })),
  };
}

export const radialBarConfigurator: EChartTypeConfigurator = {
  supports: (type) => RADIAL_BAR_TYPES.includes(type),

  buildChartData: (data, config) => buildChart(data, { ...config, continue: false }),

  buildOption: (chart) => buildRadialBarOption(chart as any),

  tooltipTrigger: 'item',
};
