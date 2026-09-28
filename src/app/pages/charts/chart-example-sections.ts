import type { ChartType } from '@oneteme/jquery-core';

export interface ChartExampleSection {
  id: string;
  label: string;
  type: ChartType;
  exampleKey: string;
}

const CHART_EXAMPLE_ORDER = [
  'line',
  'spline',
  'areaspline',
  'area',
  'bar',
  'column',
  'scatter',
  'bubble',
  'pie',
  'donut',
  'funnel',
  'pyramid',
  'polar',
  'radar',
  'radarArea',
  'radial',
  'radialBar',
  'heatmap',
  'treemap',
  'rangeBar',
  'rangeColumn',
  'rangeArea',
  'columnrange',
  'arearange',
  'areasplinerange',
  'multiSeries',
  'dualAxis',
  'customAxis',
  'mixedCategory',
  'pivotRows',
] as const;

const chartExampleOrder = new Map<string, number>(
  CHART_EXAMPLE_ORDER.map((id, index) => [id, index])
);

export function orderChartSections<T extends { id: string }>(sections: readonly T[]): T[] {
  return [...sections].sort((left, right) => {
    const leftIndex = chartExampleOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = chartExampleOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER;
    return leftIndex - rightIndex;
  });
}

export function supportsChartExample(libraryPath: string, sectionId: string): boolean {
  const pathSegments = libraryPath.split('/');
  const libraryId = pathSegments.at(-1) || pathSegments.at(-2) || '';
  return CHART_LIBRARY_DETAIL_SECTIONS[libraryId]?.some(section => section.id === sectionId) ?? false;
}

export const ECHARTS_SECTIONS: ChartExampleSection[] = orderChartSections([
  { id: 'bar',         label: 'Bar (horizontal)',   type: 'bar',         exampleKey: 'barExample' },
  { id: 'column',      label: 'Column (vertical)',  type: 'column',      exampleKey: 'columnExample' },
  { id: 'line',        label: 'Line',               type: 'line',        exampleKey: 'lineExample' },
  { id: 'spline',      label: 'Spline',             type: 'spline',      exampleKey: 'splineExample' },
  { id: 'area',        label: 'Area',               type: 'area',        exampleKey: 'areaExample' },
  { id: 'pie',         label: 'Pie',                type: 'pie',         exampleKey: 'pieExample' },
  { id: 'donut',       label: 'Donut',              type: 'donut',       exampleKey: 'donutExample' },
  { id: 'scatter',     label: 'Scatter',            type: 'scatter',     exampleKey: 'scatterExample' },
  { id: 'bubble',      label: 'Bubble',             type: 'bubble',      exampleKey: 'bubbleExample' },
  { id: 'heatmap',     label: 'Heatmap',            type: 'heatmap',     exampleKey: 'heatmapExample' },
  { id: 'treemap',     label: 'Treemap',             type: 'treemap',     exampleKey: 'treemapExample' },
  { id: 'funnel',      label: 'Funnel',              type: 'funnel',      exampleKey: 'funnelExample' },
  { id: 'pyramid',     label: 'Pyramid',             type: 'pyramid',     exampleKey: 'pyramidExample' },
  { id: 'radar',       label: 'Radar',               type: 'radar',       exampleKey: 'radarExample' },
  { id: 'rangeBar',    label: 'Range Bar (Gantt)',   type: 'rangeBar',    exampleKey: 'rangeBarExample' },
  { id: 'rangeColumn', label: 'Range Column',        type: 'rangeColumn', exampleKey: 'rangeColumnExample' },
  { id: 'multiSeries', label: 'Multi-Series (Bar+Line)', type: 'mixed', exampleKey: 'multiSeriesExample' },
  { id: 'dualAxis',    label: 'Dual Axis (Different Units)', type: 'mixed', exampleKey: 'dualAxisExample' },
  { id: 'customAxis',  label: 'Custom Y Axes',       type: 'mixed',       exampleKey: 'customAxisExample' },
  { id: 'mixedCategory', label: 'Stacked Columns + Target', type: 'mixed', exampleKey: 'mixedCategoryExample' },
  { id: 'pivotRows',   label: 'Pivot Rows (Core)',   type: 'mixed',       exampleKey: 'pivotRowsExample' },
]);

const ECHARTS_DETAIL_IDS = new Set([
  'bar', 'column', 'line', 'spline', 'area', 'pie', 'donut', 'scatter',
  'bubble', 'heatmap', 'treemap', 'funnel', 'pyramid', 'radar', 'rangeBar',
  'rangeColumn',
]);

export const ECHARTS_DETAIL_SECTIONS = ECHARTS_SECTIONS.filter(section => ECHARTS_DETAIL_IDS.has(section.id));

export const HIGHCHARTS_SECTIONS: ChartExampleSection[] = orderChartSections([
  { id: 'line',            label: 'Line',              type: 'line',            exampleKey: 'lineExample' },
  { id: 'spline',          label: 'Spline',            type: 'spline',          exampleKey: 'splineExample' },
  { id: 'areaspline',      label: 'Area Spline',       type: 'areaspline',      exampleKey: 'areasplineExample' },
  { id: 'area',            label: 'Area',              type: 'area',            exampleKey: 'areaExample' },
  { id: 'bar',             label: 'Bar (horizontal)',  type: 'bar',             exampleKey: 'barExample' },
  { id: 'column',           label: 'Column (vertical)', type: 'column',          exampleKey: 'columnExample' },
  { id: 'scatter',          label: 'Scatter',           type: 'scatter',         exampleKey: 'scatterExample' },
  { id: 'pie',              label: 'Pie',               type: 'pie',             exampleKey: 'pieExample' },
  { id: 'donut',            label: 'Donut',             type: 'donut',           exampleKey: 'donutExample' },
  { id: 'funnel',           label: 'Funnel',            type: 'funnel',          exampleKey: 'funnelExample' },
  { id: 'pyramid',          label: 'Pyramid',           type: 'pyramid',         exampleKey: 'pyramidExample' },
  { id: 'polar',            label: 'Polar',             type: 'polar',           exampleKey: 'polarExample' },
  { id: 'radar',            label: 'Radar (Web)',       type: 'radar',           exampleKey: 'radarExample' },
  { id: 'radarArea',        label: 'Radar Area',        type: 'radarArea',       exampleKey: 'radarAreaExample' },
  { id: 'radialBar',        label: 'Radial Bar',        type: 'radialBar',       exampleKey: 'radialBarExample' },
  { id: 'bubble',            label: 'Bubble',             type: 'bubble',          exampleKey: 'bubbleExample' },
  { id: 'heatmap',           label: 'Heatmap',            type: 'heatmap',         exampleKey: 'heatmapExample' },
  { id: 'treemap',           label: 'Treemap',            type: 'treemap',         exampleKey: 'treemapExample' },
  { id: 'columnrange',       label: 'Column Range',       type: 'columnrange',     exampleKey: 'columnrangeExample' },
  { id: 'arearange',         label: 'Area Range',         type: 'arearange',       exampleKey: 'arearangeExample' },
  { id: 'areasplinerange',   label: 'Area Spline Range',  type: 'areasplinerange', exampleKey: 'areasplinerangeExample' },
]);

export const APEXCHARTS_SECTIONS: ChartExampleSection[] = orderChartSections([
  { id: 'pie',         label: 'Pie',               type: 'pie',         exampleKey: 'pieExample' },
  { id: 'donut',       label: 'Donut',             type: 'donut',       exampleKey: 'donutExample' },
  { id: 'polar',       label: 'Polar',             type: 'polar',       exampleKey: 'polarExample' },
  { id: 'radar',       label: 'Radar',             type: 'radar',       exampleKey: 'radarExample' },
  { id: 'radial',      label: 'Radial Bar',        type: 'radial',      exampleKey: 'radialExample' },
  { id: 'line',        label: 'Line',              type: 'line',        exampleKey: 'lineExample' },
  { id: 'area',        label: 'Area',              type: 'area',        exampleKey: 'areaExample' },
  { id: 'bar',         label: 'Bar (horizontal)',  type: 'bar',         exampleKey: 'barExample' },
  { id: 'column',      label: 'Column (vertical)', type: 'column',      exampleKey: 'columnExample' },
  { id: 'heatmap',     label: 'Heatmap',            type: 'heatmap',     exampleKey: 'heatmapExample' },
  { id: 'treemap',     label: 'Treemap',            type: 'treemap',     exampleKey: 'treemapExample' },
  { id: 'funnel',      label: 'Funnel',             type: 'funnel',      exampleKey: 'funnelExample' },
  { id: 'pyramid',     label: 'Pyramid',            type: 'pyramid',     exampleKey: 'pyramidExample' },
  { id: 'rangeBar',    label: 'Range Bar (Gantt)',  type: 'rangeBar',    exampleKey: 'rangeBarExample' },
  { id: 'rangeColumn', label: 'Range Column',       type: 'rangeColumn', exampleKey: 'rangeColumnExample' },
  { id: 'rangeArea',   label: 'Range Area',         type: 'rangeArea',   exampleKey: 'rangeAreaExample' },
]);

const CHART_LIBRARY_DETAIL_SECTIONS: Readonly<Record<string, readonly ChartExampleSection[]>> = {
  echarts: ECHARTS_DETAIL_SECTIONS,
  highcharts: HIGHCHARTS_SECTIONS,
  apexcharts: APEXCHARTS_SECTIONS,
};