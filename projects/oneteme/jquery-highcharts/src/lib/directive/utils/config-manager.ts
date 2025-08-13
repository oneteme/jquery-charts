import { ChartProvider, ChartType } from '@oneteme/jquery-core';
import { Highcharts } from './highcharts-modules';
import { unifyPlotOptionsForChart } from './types';
import { isPolarChartType } from './chart-utils';
import { ChartCleaner } from './chart-cleaners';
import { configureSimpleGraphOptions } from './chart-options';

type SimpleChartType = 'pie' | 'donut' | 'funnel' | 'pyramid' | 'polar' | 'radar' | 'radarArea' | 'radialBar';

export class ConfigurationManager {

  static applyUserConfigWithTransformation(
    baseOptions: Highcharts.Options,
    userConfig: ChartProvider<any, any>,
    chartType: ChartType,
    debug: boolean = false
  ): Highcharts.Options {

    debug && console.log(`Configuration Manager: Traitement pour type ${chartType}`);

  const cleanedOptions = this.smartCleanConfig(baseOptions, chartType, debug);

    const typeOptions = this.applyTypeSpecificConfig(cleanedOptions, chartType, debug);

    if (userConfig.options) {
      debug && console.log('Config utilisateur détectée, application des transformations...');
      this.mergeUserConfigWithTransformation(typeOptions, userConfig, chartType, debug);
    } else {
      debug && console.log('Aucune config utilisateur détectée');
    }

    return typeOptions;
  }

  private static smartCleanConfig(options: Highcharts.Options, chartType: ChartType, debug: boolean): Highcharts.Options {
    debug && console.log('Nettoyage intelligent de la configuration');

    const preserved = {
      chart: { ...options.chart },
      title: { ...options.title },
      subtitle: { ...options.subtitle },
      credits: { ...options.credits },
      lang: { ...options.lang },
      noData: { ...options.noData }
    };

  ChartCleaner.cleanAllSpecialConfigs(options, true);
  ChartCleaner.cleanForChartType(options, String(chartType), true);

    Object.assign(options, preserved);

    return options;
  }

  private static applyTypeSpecificConfig(
    options: Highcharts.Options,
    chartType: ChartType,
    debug: boolean
  ): Highcharts.Options {
    debug && console.log(`Application config spécifique pour ${chartType}`);

    if (this.isSimpleChartType(chartType)) {
      const preserved = {
        title: { ...(options as any).title },
        subtitle: { ...(options as any).subtitle },
        credits: { ...(options as any).credits },
        lang: { ...(options as any).lang },
        noData: { ...(options as any).noData },
      };

  configureSimpleGraphOptions(options, chartType as any, debug);

      Object.assign(options, preserved);
    }

    return options;
  }

  private static isSimpleChartType(chartType: ChartType): chartType is SimpleChartType {
    return ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radarArea', 'radialBar'].includes(chartType);
  }

  private static mergeUserConfigWithTransformation(
    targetOptions: Highcharts.Options,
    userConfig: ChartProvider<any, any>,
    chartType: ChartType,
    debug: boolean
  ): void {

    const userOptions = JSON.parse(JSON.stringify(userConfig.options));

    unifyPlotOptionsForChart(userOptions, chartType, debug);

    if (userOptions.plotOptions) {
      if (!targetOptions.plotOptions) targetOptions.plotOptions = {} as any;

      Object.keys(userOptions.plotOptions).forEach(plotKey => {
        const plotOptions = targetOptions.plotOptions as any;
        if (!plotOptions[plotKey]) {
          plotOptions[plotKey] = {};
        }

        Object.assign(plotOptions[plotKey], userOptions.plotOptions[plotKey]);

        debug && console.log(`Config utilisateur appliquée: plotOptions.${plotKey}`, userOptions.plotOptions[plotKey]);
      });
    }

    Object.keys(userOptions).forEach(key => {
      if (key !== 'plotOptions' && userOptions[key] !== undefined) {
        if (typeof userOptions[key] === 'object' && userOptions[key] !== null && !Array.isArray(userOptions[key])) {
          if (!targetOptions[key]) targetOptions[key] = {};
          Object.assign(targetOptions[key], userOptions[key]);
        } else {
          targetOptions[key] = userOptions[key];
        }
        debug && console.log(`Config utilisateur appliquée: ${key}`, userOptions[key]);
      }
    });
  }

  static handlePolarChartSpecifics(
    options: Highcharts.Options,
    chartType: ChartType,
    debug: boolean
  ): boolean {
    if (!isPolarChartType(chartType)) {
      return false;
    }

    debug && console.log(`Traitement spécial graphique polaire: ${chartType}`);

    if (!options.chart) options.chart = {};
    options.chart.polar = true;
    return true;
  }
}
