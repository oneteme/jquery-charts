import { ChartType, ChartProvider } from '@oneteme/jquery-core';
import { EventEmitter } from '@angular/core';
import { Highcharts } from './highcharts-modules';

export type ChartCustomEvent = 'previous' | 'next' | 'pivot';

export interface ToolbarOptions {
  chart: Highcharts.Chart;
  config: ChartProvider<any, any>;
  customEvent: EventEmitter<ChartCustomEvent>;
  canPivot: boolean;
  debug: boolean;
}

export interface LoadingOptions {
  text?: string;
  style?: Partial<CSSStyleDeclaration>;
}

export const PLOTOPTIONS_MAPPING = {
  pie: {
    'series.dataLabels': 'pie.dataLabels',
    'series.allowPointSelect': 'pie.allowPointSelect',
    'series.cursor': 'pie.cursor',
    'series.showInLegend': 'pie.showInLegend',
    'series.borderWidth': 'pie.borderWidth',
    'series.borderColor': 'pie.borderColor',
    'series.slicedOffset': 'pie.slicedOffset',
    'series.startAngle': 'pie.startAngle',
    'series.endAngle': 'pie.endAngle',
    'series.center': 'pie.center',
    'series.size': 'pie.size',
    'series.innerSize': 'pie.innerSize',
    'series.depth': 'pie.depth',
    'series.ignoreHiddenPoint': 'pie.ignoreHiddenPoint',
  },
  donut: {
    'series.dataLabels': 'pie.dataLabels',
    'series.allowPointSelect': 'pie.allowPointSelect',
    'series.cursor': 'pie.cursor',
    'series.showInLegend': 'pie.showInLegend',
    'series.borderWidth': 'pie.borderWidth',
    'series.borderColor': 'pie.borderColor',
    'series.slicedOffset': 'pie.slicedOffset',
    'series.startAngle': 'pie.startAngle',
    'series.endAngle': 'pie.endAngle',
    'series.center': 'pie.center',
    'series.size': 'pie.size',
    'series.innerSize': 'pie.innerSize',
    'series.depth': 'pie.depth',
    'series.ignoreHiddenPoint': 'pie.ignoreHiddenPoint',
  },
  funnel: {
    'series.dataLabels': 'funnel.dataLabels',
    'series.borderWidth': 'funnel.borderWidth',
    'series.borderColor': 'funnel.borderColor',
    'series.center': 'funnel.center',
    'series.height': 'funnel.height',
    'series.width': 'funnel.width',
    'series.neckWidth': 'funnel.neckWidth',
    'series.neckHeight': 'funnel.neckHeight',
    'series.reversed': 'funnel.reversed',
    'series.borderRadius': 'funnel.borderRadius',
  },
  pyramid: {
    'series.dataLabels': 'pyramid.dataLabels',
    'series.borderWidth': 'pyramid.borderWidth',
    'series.borderColor': 'pyramid.borderColor',
    'series.center': 'pyramid.center',
    'series.height': 'pyramid.height',
    'series.width': 'pyramid.width',
    'series.reversed': 'pyramid.reversed',
    'series.borderRadius': 'pyramid.borderRadius',
  },
  polar: {
    'series.pointPlacement': 'series.pointPlacement',
    'series.pointStart': 'series.pointStart',
    'series.connectEnds': 'series.connectEnds',
    'series.dataLabels': 'series.dataLabels',
    'column.borderWidth': 'column.borderWidth',
    'column.pointPadding': 'column.pointPadding',
    'column.stacking': 'column.stacking',
    'column.groupPadding': 'column.groupPadding',
    'column.borderRadius': 'column.borderRadius',
  },
  radar: {
    'series.pointPlacement': 'series.pointPlacement',
    'series.pointStart': 'series.pointStart',
    'series.connectEnds': 'series.connectEnds',
    'series.marker': 'series.marker',
    'series.dataLabels': 'series.dataLabels',
  },
  radarArea: {
    'series.pointPlacement': 'series.pointPlacement',
    'series.pointStart': 'series.pointStart',
    'series.connectEnds': 'series.connectEnds',
    'series.marker': 'series.marker',
    'series.fillOpacity': 'series.fillOpacity',
    'series.dataLabels': 'series.dataLabels',
    'area.fillOpacity': 'area.fillOpacity',
    'area.marker': 'area.marker',
  },
  radialBar: {
    'series.pointPlacement': 'series.pointPlacement',
    'series.pointStart': 'series.pointStart',
    'series.connectEnds': 'series.connectEnds',
    'series.dataLabels': 'series.dataLabels',
    'column.stacking': 'column.stacking',
    'column.borderWidth': 'column.borderWidth',
    'column.pointPadding': 'column.pointPadding',
    'column.groupPadding': 'column.groupPadding',
    'column.borderRadius': 'column.borderRadius',
  },
  heatmap: {
    'series.dataLabels': 'heatmap.dataLabels',
    'series.borderWidth': 'heatmap.borderWidth',
    'series.borderColor': 'heatmap.borderColor',
    'series.nullColor': 'heatmap.nullColor',
    'series.colsize': 'heatmap.colsize',
    'series.rowsize': 'heatmap.rowsize',
    'series.pointPadding': 'heatmap.pointPadding',
    'series.pointRange': 'heatmap.pointRange',
  },
  treemap: {
    'series.dataLabels': 'treemap.dataLabels',
    'series.borderWidth': 'treemap.borderWidth',
    'series.borderColor': 'treemap.borderColor',
    'series.layoutAlgorithm': 'treemap.layoutAlgorithm',
    'series.layoutStartingDirection': 'treemap.layoutStartingDirection',
    'series.alternateStartingDirection': 'treemap.alternateStartingDirection',
    'series.levels': 'treemap.levels',
    'series.levelIsConstant': 'treemap.levelIsConstant',
    'series.drillUpButton': 'treemap.drillUpButton',
    'series.allowTraversingTree': 'treemap.allowTraversingTree',
    'series.colorByPoint': 'treemap.colorByPoint',
  },
  scatter: {
    'series.marker': 'scatter.marker',
    'series.stickyTracking': 'scatter.stickyTracking',
    'series.findNearestPointBy': 'scatter.findNearestPointBy',
    'series.states': 'scatter.states',
  },
  bubble: {
    'series.marker': 'bubble.marker',
    'series.minSize': 'bubble.minSize',
    'series.maxSize': 'bubble.maxSize',
    'series.sizeBy': 'bubble.sizeBy',
    'series.sizeByAbsoluteValue': 'bubble.sizeByAbsoluteValue',
    'series.zThreshold': 'bubble.zThreshold',
    'series.stickyTracking': 'bubble.stickyTracking',
    'series.findNearestPointBy': 'bubble.findNearestPointBy',
    'series.states': 'bubble.states',
  },
  boxplot: {
    'series.boxWidth': 'boxplot.boxWidth',
    'series.grouping': 'boxplot.grouping',
    'series.dataLabels': 'boxplot.dataLabels',
    'series.marker': 'boxplot.marker',
    'series.states': 'boxplot.states',
  },
};

export function unifyPlotOptionsForChart(
  options: any,
  chartType: ChartType,
  debug: boolean = false
): void {
  if (!options.plotOptions?.series || !PLOTOPTIONS_MAPPING[chartType]) {
    debug &&
      console.log(`Pas de plotOptions.series à transformer pour ${chartType}`);
    return;
  }

  debug &&
    console.log(`Unification plotOptions.series pour type: ${chartType}`);

  const mapping = PLOTOPTIONS_MAPPING[chartType];
  const seriesConfig = options.plotOptions.series;

  Object.keys(seriesConfig).forEach((seriesProperty) => {
    const fullSeriesPath = `series.${seriesProperty}`;
    const targetPath = mapping[fullSeriesPath];

    if (targetPath) {
      const value = seriesConfig[seriesProperty];
      debug &&
        console.log(
          `Transformation: plotOptions.${fullSeriesPath} -> plotOptions.${targetPath}`,
          value
        );

      const targetParts = targetPath.split('.');
      let current = options.plotOptions;

      for (let i = 0; i < targetParts.length - 1; i++) {
        const part = targetParts[i];
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }

      const finalProperty = targetParts[targetParts.length - 1];
      current[finalProperty] = value;

      debug &&
        console.log(
          `Propriété transformée: plotOptions.${targetPath} =`,
          value
        );
    } else {
      debug &&
        console.log(
          `Pas de mapping trouvé pour plotOptions.${fullSeriesPath} dans le type ${chartType}`
        );
    }
  });

  debug && console.log(`Unification terminée pour ${chartType}`);
}
