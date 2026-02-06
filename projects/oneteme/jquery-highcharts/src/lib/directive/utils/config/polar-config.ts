import { Highcharts } from '../highcharts-modules';

export function configurePolarChart(
  options: Highcharts.Options,
  chartType: string,
  config?: any,
): void {
  if (!options.chart) {
    options.chart = {};
  }

  options.chart.polar = true;

  if (!options.xAxis) {
    options.xAxis = {};
  }
  (options.xAxis as any).tickmarkPlacement = 'on';
  (options.xAxis as any).lineWidth = 0;

  if (!options.yAxis) {
    options.yAxis = {};
  }
  (options.yAxis as any).lineWidth = 0;
  (options.yAxis as any).min = 0;

  switch (chartType) {
    case 'polar':
      configurePolarType(options);
      break;
    case 'radar':
      configureRadarType(options);
      break;
    case 'radarArea':
      configureRadarAreaType(options);
      break;
    case 'radialBar':
      configureRadialBarType(options, config);
      break;
  }
}

function configurePolarType(options: Highcharts.Options): void {
  (options.yAxis as any).gridLineInterpolation = 'circle';

  if (!options.plotOptions) {
    options.plotOptions = {};
  }
  options.plotOptions.column = {
    stacking: 'normal',
    borderWidth: 0,
    pointPadding: 0,
    groupPadding: 0,
  };
  options.pane = { size: '85%' };

  if (!(options.plotOptions as any).series) {
    (options.plotOptions as any).series = {};
  }
  (options.plotOptions as any).series.pointPlacement = 'between';
}

function configureRadarType(options: Highcharts.Options): void {
  (options.yAxis as any).gridLineInterpolation = 'polygon';
}

function configureRadarAreaType(options: Highcharts.Options): void {
  (options.yAxis as any).gridLineInterpolation = 'polygon';

  if (!options.plotOptions) {
    options.plotOptions = {};
  }
  options.plotOptions.area = { fillOpacity: 0.5 };
}

function configureRadialBarType(
  options: Highcharts.Options,
  config?: any,
): void {
  if (!options.chart) {
    options.chart = {};
  }
  (options.chart as any).inverted = true;

  options.pane = {
    startAngle: 0,
    endAngle: 360,
    background: [],
  };

  if (!options.xAxis) {
    options.xAxis = {};
  }
  (options.xAxis as any).tickInterval = 1;
  (options.xAxis as any).lineWidth = 0;
  (options.xAxis as any).showLastLabel = false;

  if (!options.yAxis) {
    options.yAxis = {};
  }
  (options.yAxis as any).min = 0;
  (options.yAxis as any).lineWidth = 0;
  (options.yAxis as any).gridLineWidth = 0;
  (options.yAxis as any).reversedStacks = false;
  (options.yAxis as any).labels = { enabled: true };

  if (!options.plotOptions) {
    options.plotOptions = {};
  }
  options.plotOptions.column = {
    stacking: 'normal',
    borderWidth: 0,
    pointPadding: 0,
    groupPadding: 0.15,
    borderRadius: 0,
    pointPlacement: 'on',
  };

  if (!(options.plotOptions as any).series) {
    (options.plotOptions as any).series = {};
  }

  const xAxis = options.xAxis as any;
  const series = options.series as any[];
  let categoryCount = 0;

  if (xAxis.categories && xAxis.categories.length > 0) {
    categoryCount = xAxis.categories.length;
  } else if (series && series.length > 0 && series[0].data) {
    categoryCount = series[0].data.length;
  }

  if (categoryCount > 0) {
    if (xAxis.min === undefined) xAxis.min = -0.5;
    if (xAxis.max === undefined) xAxis.max = categoryCount - 0.5;
  }
}

export function isPolarChart(chartType: string): boolean {
  return ['polar', 'radar', 'radarArea', 'radialBar'].includes(chartType);
}

export function enforceCriticalPolarOptions(
  options: Highcharts.Options,
  chartType: string
): void {
  if (!isPolarChart(chartType)) return;

  if (!options.chart) {
    options.chart = {};
  }
  options.chart.polar = true;

  switch (chartType) {
    case 'radialBar':
      enforceRadialBarCriticalOptions(options);
      break;
    case 'radar':
    case 'radarArea':
      enforceRadarCriticalOptions(options);
      break;
    case 'polar':
      enforcePolarTypeCriticalOptions(options);
      break;
  }
}

function enforceRadialBarCriticalOptions(options: Highcharts.Options): void {
  if (!options.chart) {
    options.chart = {};
  }
  (options.chart as any).inverted = true;

  if (!options.xAxis) {
    options.xAxis = {};
  }
  (options.xAxis as any).showLastLabel = false;
  (options.xAxis as any).gridLineWidth = 0;
  (options.xAxis as any).lineWidth = 0;

  if (!options.yAxis) {
    options.yAxis = {};
  }
  (options.yAxis as any).gridLineWidth = 0;
}

function enforceRadarCriticalOptions(options: Highcharts.Options): void {
  if (!options.yAxis) {
    options.yAxis = {};
  }
  (options.yAxis as any).gridLineInterpolation = 'polygon';
}

function enforcePolarTypeCriticalOptions(options: Highcharts.Options): void {
  if (!options.yAxis) {
    options.yAxis = {};
  }
  (options.yAxis as any).gridLineInterpolation = 'circle';
}
