import { ChartProvider, ChartType } from '@oneteme/jquery-core';
import { Highcharts } from './highcharts-modules';
import { unifyPlotOptionsForChart } from './types';
import { isPolarChartType } from './chart-utils';
import { cleanAllConfigs, configureSimpleGraphOptions } from './chart-options';

// Types pour les configurations simples supportées
type SimpleChartType = 'pie' | 'donut' | 'funnel' | 'pyramid' | 'polar' | 'radar' | 'radarArea' | 'radialBar';

export class ConfigurationManager {

  static applyUserConfigWithTransformation(
    baseOptions: Highcharts.Options,
    userConfig: ChartProvider<any, any>,
    chartType: ChartType,
    debug: boolean = false
  ): Highcharts.Options {

    debug && console.log(`🔄 Configuration Manager: Traitement pour type ${chartType}`);

    const cleanedOptions = this.smartCleanConfig(baseOptions, debug);

    const typeOptions = this.applyTypeSpecificConfig(cleanedOptions, chartType, debug);

    if (userConfig.options) {
      debug && console.log('📝 Config utilisateur détectée, application des transformations...');
      this.mergeUserConfigWithTransformation(typeOptions, userConfig, chartType, debug);
    } else {
      debug && console.log('❌ Aucune config utilisateur détectée');
    }

    return typeOptions;
  }

  private static smartCleanConfig(options: Highcharts.Options, debug: boolean): Highcharts.Options {
    debug && console.log('🧹 Nettoyage intelligent de la configuration');

    const preserved = {
      chart: { ...options.chart },
      title: { ...options.title },
      subtitle: { ...options.subtitle },
      credits: { ...options.credits },
      lang: { ...options.lang },
      noData: { ...options.noData }
    };

    cleanAllConfigs(options, true);

    Object.assign(options, preserved);

    return options;
  }

  private static applyTypeSpecificConfig(
    options: Highcharts.Options,
    chartType: ChartType,
    debug: boolean
  ): Highcharts.Options {
    debug && console.log(`⚙️ Application config spécifique pour ${chartType}`);

    if (this.isSimpleChartType(chartType)) {
      configureSimpleGraphOptions(options, chartType as SimpleChartType, debug);
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
      if (!targetOptions.plotOptions) targetOptions.plotOptions = {};

      Object.keys(userOptions.plotOptions).forEach(plotKey => {
        if (!targetOptions.plotOptions![plotKey]) {
          targetOptions.plotOptions![plotKey] = {};
        }

        Object.assign(targetOptions.plotOptions![plotKey], userOptions.plotOptions[plotKey]);

        debug && console.log(`✅ Config utilisateur appliquée: plotOptions.${plotKey}`, userOptions.plotOptions[plotKey]);
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
