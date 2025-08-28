export { cleanPolarConfigs } from './polar-cleaner';
export { cleanPieConfigs } from './pie-cleaner';
export { cleanScatterBubbleConfigs } from './scatter-bubble-cleaner';
export { cleanAnimatedConfigs } from './animated-cleaner';
export { cleanTreemapConfigs } from './treemap-cleaner';
export { cleanHeatmapConfigs } from './heatmap-cleaner';
export { cleanBoxplotConfigs } from './boxplot-cleaner';
export { cleanFunnelConfigs } from './funnel-cleaner';
export { cleanPyramidConfigs } from './pyramid-cleaner';
export { cleanBasicConfigs } from './basic-cleaner';

import { cleanPolarConfigs } from './polar-cleaner';
import { cleanPieConfigs } from './pie-cleaner';
import { cleanScatterBubbleConfigs } from './scatter-bubble-cleaner';
import { cleanAnimatedConfigs } from './animated-cleaner';
import { cleanTreemapConfigs } from './treemap-cleaner';
import { cleanHeatmapConfigs } from './heatmap-cleaner';
import { cleanBoxplotConfigs } from './boxplot-cleaner';
import { cleanFunnelConfigs } from './funnel-cleaner';
import { cleanPyramidConfigs } from './pyramid-cleaner';
import { cleanBasicConfigs } from './basic-cleaner';

export class ChartCleaner {
  static cleanForChartType(options: any, chartType: string, preserveUserConfig: boolean = false): void {
    let userPlotOptions: any = null;
    if (preserveUserConfig && options.plotOptions?.series) {
      userPlotOptions = JSON.parse(JSON.stringify(options.plotOptions.series));
    }

    switch (chartType) {
      case 'polar':
      case 'radialBar':
      case 'radar':
      case 'radarArea':
        cleanPolarConfigs(options);
        break;

      case 'pie':
      case 'donut':
        cleanPieConfigs(options);
        break;

      case 'scatter':
      case 'bubble':
        cleanScatterBubbleConfigs(options);
        break;

      case 'treemap':
        cleanTreemapConfigs(options);
        break;

      case 'heatmap':
        cleanHeatmapConfigs(options);
        break;

      case 'boxplot':
        cleanBoxplotConfigs(options);
        break;

      case 'funnel':
        cleanFunnelConfigs(options);
        break;

      case 'pyramid':
        cleanPyramidConfigs(options);
        break;

      default:
        // Pour les types de base (line, bar, column, area, etc.), utiliser le nettoyeur de base
        cleanBasicConfigs(options);
        break;
    }

    if (userPlotOptions && preserveUserConfig) {
      if (!options.plotOptions) options.plotOptions = {};
      if (!options.plotOptions.series) options.plotOptions.series = {};
      Object.assign(options.plotOptions.series, userPlotOptions);
    }
  }

  static cleanAllSpecialConfigs(options: any, preserveUserConfig: boolean = false): void {
    let userPlotOptions: any = null;
    if (preserveUserConfig && options.plotOptions?.series) {
      userPlotOptions = JSON.parse(JSON.stringify(options.plotOptions.series));
    }

    cleanPolarConfigs(options);
    cleanPieConfigs(options);
    cleanAnimatedConfigs(options);
    cleanScatterBubbleConfigs(options);
    cleanTreemapConfigs(options);
    cleanHeatmapConfigs(options);
    cleanBoxplotConfigs(options);

    if (userPlotOptions && preserveUserConfig) {
      if (!options.plotOptions) options.plotOptions = {};
      if (!options.plotOptions.series) options.plotOptions.series = {};
      Object.assign(options.plotOptions.series, userPlotOptions);
    }
  }
}
