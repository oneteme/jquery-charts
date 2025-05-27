import { ChartProvider, CommonChart, Coordinate2D, XaxisType, YaxisType } from '@oneteme/jquery-core';
import { DataAnalysisResult, PercentageDisplayConfig } from './types';

export function determineXAxisDataType(value: any): string {
  if (value instanceof Date) {
    return 'datetime';
  } else if (typeof value === 'number') {
    return 'numeric';
  } else {
    return 'category';
  }
}

export function getType<
  X extends XaxisType,
  Y extends YaxisType | Coordinate2D
>(commonChart: CommonChart<X, Y>): string {
  if (commonChart.series.length && commonChart.series[0].data.length) {
    if (commonChart.continue) {
      const x = (<CommonChart<X, Coordinate2D>>commonChart).series[0].data[0].x;
      return determineXAxisDataType(x);
    } else {
      const categ = commonChart.categories[0];
      return determineXAxisDataType(categ);
    }
  }
  return 'datetime';
}

export function sanitizeChartDimensions(
  chartOptions: Highcharts.Options,
  config: ChartProvider<any, any>
) {
  if (!chartOptions.chart) chartOptions.chart = {};
  // Nettoyage width/height : ne garder que les valeurs numériques valides
  if (typeof config.width === 'number' && !isNaN(config.width)) {
    chartOptions.chart.width = config.width;
  } else if (
    chartOptions.chart.width &&
    typeof chartOptions.chart.width !== 'number'
  ) {
    delete chartOptions.chart.width;
  }
  if (typeof config.height === 'number' && !isNaN(config.height)) {
    chartOptions.chart.height = config.height;
  } else if (
    chartOptions.chart.height &&
    typeof chartOptions.chart.height !== 'number'
  ) {
    delete chartOptions.chart.height;
  }
}

/**
 * Analyse les données pour déterminer si elles sont déjà en pourcentage
 * et fournit des informations utiles sur leur format
 */
export function analyzeChartData(data: any[]): DataAnalysisResult {
  if (!data || data.length === 0) {
    return {
      isAlreadyPercentage: false,
      hasDecimalValues: false,
      maxValue: 0,
      minValue: 0,
      averageValue: 0,
      totalValue: 0,
      dataCount: 0,
      suggestedFormat: 'integer'
    };
  }

  const values: number[] = [];
  
  // Extraction des valeurs numériques selon le format des données
  data.forEach(item => {
    if (typeof item === 'number') {
      values.push(item);
    } else if (item && typeof item.y === 'number') {
      values.push(item.y);
    } else if (item && typeof item.value === 'number') {
      values.push(item.value);
    } else if (Array.isArray(item) && item.length >= 2 && typeof item[1] === 'number') {
      values.push(item[1]);
    }
  });

  if (values.length === 0) {
    return {
      isAlreadyPercentage: false,
      hasDecimalValues: false,
      maxValue: 0,
      minValue: 0,
      averageValue: 0,
      totalValue: 0,
      dataCount: 0,
      suggestedFormat: 'integer'
    };
  }

  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const totalValue = values.reduce((sum, val) => sum + val, 0);
  const averageValue = totalValue / values.length;
  const hasDecimalValues = values.some(val => val % 1 !== 0);

  // Heuristiques pour détecter si les données sont déjà en pourcentage :
  // 1. Toutes les valeurs sont entre 0 et 100
  // 2. La somme est proche de 100 (± 5%) pour des graphiques comme pie/donut
  // 3. Présence de décimales avec des valeurs < 100
  const allValuesBetween0And100 = minValue >= 0 && maxValue <= 100;
  const sumCloseToHundred = Math.abs(totalValue - 100) <= 5;
  const hasSmallDecimals = hasDecimalValues && maxValue <= 100;

  const isAlreadyPercentage = allValuesBetween0And100 && (sumCloseToHundred || hasSmallDecimals);

  // Suggestion de format basée sur l'analyse
  let suggestedFormat: 'percentage' | 'decimal' | 'integer' = 'integer';
  if (isAlreadyPercentage) {
    suggestedFormat = 'percentage';
  } else if (hasDecimalValues) {
    suggestedFormat = 'decimal';
  }

  return {
    isAlreadyPercentage,
    hasDecimalValues,
    maxValue,
    minValue,
    averageValue,
    totalValue,
    dataCount: values.length,
    suggestedFormat
  };
}

/**
 * Active ou désactive l'affichage en pourcentage pour les dataLabels et tooltips
 * pour les types pie, donut, funnel, pyramid avec détection automatique
 */
export function togglePercentDisplay(
  options: any, 
  config: PercentageDisplayConfig,
  chartData?: any[]
): DataAnalysisResult | null {
  const analysisResult = performDataAnalysis(config, chartData);
  updateChartDisplayFormats(options, config, analysisResult);
  
  if (config.debug) {
    console.log(`Format d'affichage mis à jour: ${config.showPercent ? 'pourcentage' : 'valeur brute'}`);
  }

  return analysisResult;
}

/**
 * Effectue l'analyse des données si nécessaire
 */
function performDataAnalysis(
  config: PercentageDisplayConfig,
  chartData?: any[]
): DataAnalysisResult | null {
  if (!config.autoDetect || !chartData) {
    return null;
  }

  const analysisResult = analyzeChartData(chartData);
  
  if (config.debug) {
    console.log('Analyse des données:', analysisResult);
  }

  // Si les données sont déjà en pourcentage et qu'on ne force pas la conversion
  if (analysisResult.isAlreadyPercentage && !config.forceConversion) {
    if (config.debug) {
      console.log('Les données semblent déjà être en pourcentage, pas de conversion nécessaire');
    }
    // On peut quand même ajuster le format d'affichage
    config.showPercent = true;
  }

  return analysisResult;
}

/**
 * Met à jour les formats d'affichage du graphique
 */
function updateChartDisplayFormats(
  options: any,
  config: PercentageDisplayConfig,
  analysisResult: DataAnalysisResult | null
): void {
  const chartTypes = ['pie', 'donut', 'funnel', 'pyramid', 'polar', 'radar', 'radialBar'];
  
  // Update dataLabels format for all applicable chart types
  chartTypes.forEach(type => {
    if (options.plotOptions?.[type]) {
      options.plotOptions[type].dataLabels = options.plotOptions[type].dataLabels ?? {};
      setDataLabelsFormat(options.plotOptions[type], config, analysisResult);
    }
  });

  // Special case for pie which is used by donut too
  if (options.plotOptions?.pie) {
    setDataLabelsFormat(options.plotOptions.pie, config, analysisResult);
  }

  // Update tooltip format if it exists
  if (options.tooltip) {
    setTooltipFormat(options, config, analysisResult);
  }
}

/**
 * Configure le format des dataLabels pour un type de graphique donné
 */
function setDataLabelsFormat(
  plotOption: any,
  config: PercentageDisplayConfig,
  analysisResult: DataAnalysisResult | null
): void {
  if (!plotOption?.dataLabels) return;

  const decimalPlaces = config.decimalPlaces ?? 1;

  if (config.showPercent) {
    // Si les données sont déjà en %, on affiche directement
    if (analysisResult?.isAlreadyPercentage && !config.forceConversion) {
      plotOption.dataLabels.format = `<b>{point.name}</b>: {point.y:.${decimalPlaces}f}%`;
    } else {
      // Sinon on utilise la propriété percentage de Highcharts
      plotOption.dataLabels.format = `<b>{point.name}</b>: {point.percentage:.${decimalPlaces}f}%`;
    }
  } else {
    // Format par défaut selon le type de données détecté
    const format = analysisResult?.hasDecimalValues ? 
      `<b>{point.name}</b>: {point.y:.${decimalPlaces}f}` : 
      '<b>{point.name}</b>: {point.y}';
    plotOption.dataLabels.format = format;
  }
}

/**
 * Configure le format des tooltips
 */
function setTooltipFormat(
  options: any,
  config: PercentageDisplayConfig,
  analysisResult: DataAnalysisResult | null
): void {
  const decimalPlaces = config.decimalPlaces ?? 1;

  if (config.showPercent) {
    if (analysisResult?.isAlreadyPercentage && !config.forceConversion) {
      options.tooltip.pointFormat = `<span style="color:{point.color}">●</span> <b>{point.name}</b>: <b>{point.y:.${decimalPlaces}f}%</b><br/>`;
    } else {
      options.tooltip.pointFormat = `<span style="color:{point.color}">●</span> <b>{point.name}</b>: <b>{point.percentage:.${decimalPlaces}f}%</b><br/>`;
    }
  } else {
    const format = analysisResult?.hasDecimalValues ? 
      `<span style="color:{point.color}">●</span> <b>{point.name}</b>: <b>{point.y:.${decimalPlaces}f}</b><br/>` :
      '<span style="color:{point.color}">●</span> <b>{point.name}</b>: <b>{point.y}</b><br/>';
    options.tooltip.pointFormat = format;
  }
}

/**
 * Version simplifiée de togglePercentDisplay pour compatibilité avec l'ancienne API
 */
export function togglePercentDisplaySimple(options: any, showPercent: boolean) {
  return togglePercentDisplay(options, { 
    showPercent, 
    autoDetect: false, 
    decimalPlaces: 1 
  });
}
