import {
  ChartProvider,
  ChartType,
  formatChartValue,
  SelectedUnitScale,
  selectBestScale,
  UnitConfig,
} from '@oneteme/jquery-core';
import { Highcharts } from '../utils/highcharts-modules';

type UnitDisplay = {
  unit: string;
  scale: number;
  precision?: number;
  formatter?: (value: number, unit: string) => string;
};

export function applyHighchartsSeriesAxes(
  options: Highcharts.Options,
  series: any[],
  config: ChartProvider<any, any>,
  chartType: ChartType,
): void {
  const resolved = resolveSeries(series, config, chartType);
  options.series = resolved;
  const unitScales = new Map<number, UnitDisplay>();
  const seriesUnitDisplays = resolveSeriesUnitDisplays(resolved);
  const titles = resolveAxisTitles(config);
  const axisCount = resolveAxisCount(options, resolved, titles);

  if (axisCount <= 1 && !hasExplicitAxis(resolved)) {
    applySingleAxis(options, resolved, config, unitScales);
  } else {
    applyMultipleAxes(options, resolved, config, titles, axisCount, unitScales);
  }
  applyUnitTooltip(options, unitScales, seriesUnitDisplays);
}

function resolveSeries(series: any[], config: ChartProvider<any, any>, chartType: ChartType): any[] {
  return (series ?? []).map((serie, index) => {
    const provider = config.series?.[index];
    return {
      ...serie,
      type: serie.type
        ?? (typeof provider?.type === 'string' ? provider.type : undefined)
        ?? (chartType === 'mixed' ? 'line' : undefined),
      showUnitOnAxis: serie.showUnitOnAxis ?? provider?.showUnitOnAxis,
      yAxis: serie.yAxisIndex ?? provider?.yAxisIndex,
      unit: serie.unit ?? provider?.unit,
      yAxisConfig: serie.yAxisConfig ?? provider?.yAxisConfig,
    };
  });
}

function resolveSeriesUnitDisplays(series: any[]): Map<number, UnitDisplay> {
  const displays = new Map<number, UnitDisplay>();
  series.forEach((serie, index) => {
    if (typeof serie.unit === 'string' && serie.unit.trim()) {
      displays.set(index, { unit: serie.unit, scale: 1 });
    }
  });
  return displays;
}

function resolveAxisTitles(config: ChartProvider<any, any>): string[] {
  if (Array.isArray(config.ytitle)) return config.ytitle;
  return config.ytitle ? [config.ytitle] : [];
}

function resolveAxisCount(options: Highcharts.Options, series: any[], titles: string[]): number {
  const existingAxisCount = Array.isArray(options.yAxis)
    ? options.yAxis.length
    : options.yAxis ? 1 : 0;
  return Math.max(
    titles.length,
    existingAxisCount,
    ...series.map(serie => typeof serie.yAxis === 'number' ? serie.yAxis + 1 : 0),
    1,
  );
}

function hasExplicitAxis(series: any[]): boolean {
  return series.some(serie => serie.yAxis !== undefined);
}

function applySingleAxis(
  options: Highcharts.Options,
  series: any[],
  config: ChartProvider<any, any>,
  unitScales: Map<number, UnitDisplay>,
): void {
  const existingAxis = Array.isArray(options.yAxis)
    ? Object.assign({}, options.yAxis[0])
    : Object.assign({}, options.yAxis);
  if (existingAxis.showEmpty === undefined) existingAxis.showEmpty = false;
  markAutomaticAxisVisibility(existingAxis, series);
  const hasUnit = !!config.yUnit || series.some(serie => typeof serie.unit === 'string' && serie.unit.trim());

  const display = hasUnit
    ? applyUnitFormatting(options, series, 0, existingAxis, config)
    : undefined;
  options.yAxis = Array.isArray(options.yAxis) ? [existingAxis] : existingAxis;
  if (display) unitScales.set(0, display);
}

function applyMultipleAxes(
  options: Highcharts.Options,
  series: any[],
  config: ChartProvider<any, any>,
  titles: string[],
  axisCount: number,
  unitScales: Map<number, UnitDisplay>,
): void {
  const existing = Array.isArray(options.yAxis)
    ? options.yAxis
    : options.yAxis ? [options.yAxis] : [];
  options.yAxis = Array.from({ length: axisCount }, (_, index) => {
    const axisConfigs = series
      .filter(serie => serie.yAxis === index && serie.yAxisConfig)
      .map(serie => serie.yAxisConfig);
    const axis: any = Highcharts.merge({}, existing[index] ?? {}, ...axisConfigs);
    const title = titles[index];
    if (title) axis.title = mergeAxisTitle(axis.title, title);
    if (axis.showEmpty === undefined) axis.showEmpty = false;
    markAutomaticAxisVisibility(axis, series.filter(serie => (serie.yAxis ?? 0) === index));
    const display = applyUnitFormatting(options, series, index, axis, config);
    if (display) unitScales.set(index, display);
    return axis;
  });
}

function markAutomaticAxisVisibility(axis: any, series: any[]): void {
  if (axis.visible !== undefined) return;
  axis.custom = {
    ...(axis.custom ?? {}),
    jqueryHighchartsAutoVisibility: true,
  };
  axis.visible = series.length === 0 || series.some(serie => serie.visible !== false);
}

function mergeAxisTitle(title: any, text: string): any {
  return title ? { ...title, text } : { text };
}

function applyUnitFormatting(
  options: Highcharts.Options,
  series: any[],
  axisIndex: number,
  axis: any,
  config: ChartProvider<any, any>,
): UnitDisplay | undefined {
  const axisSeries = series.filter(serie => (serie.yAxis ?? 0) === axisIndex);
  const seriesUnits = [...new Set(
    axisSeries
      .map(serie => serie.unit)
      .filter((unit): unit is string => typeof unit === 'string' && unit.trim().length > 0),
  )];
  const configuredUnit = seriesUnits.length === 1 ? seriesUnits[0] : config.yUnit;
  if (!configuredUnit || !axis) return undefined;

  const values = axisSeries
    .flatMap(serie => (serie.data ?? []).map((point: any) => extractNumericValue(point)))
    .filter((value: unknown): value is number => typeof value === 'number');
  const scale: SelectedUnitScale | undefined = typeof configuredUnit === 'string'
    ? undefined
    : selectBestScale(configuredUnit as UnitConfig, values);
  const unit = typeof configuredUnit === 'string' ? configuredUnit : scale?.unit;
  if (!unit) return undefined;

  const shouldShowUnitOnAxis = axisSeries
    .filter(serie => typeof serie.unit === 'string' && serie.unit.trim())
    .every(serie => serie.showUnitOnAxis !== false);
  if (shouldShowUnitOnAxis) {
    axis.title = mergeAxisTitle(axis.title, axis.title?.text ? `${axis.title.text} (${unit})` : unit);
    if (typeof axis.labels?.formatter !== 'function') {
      axis.labels = {
        ...(axis.labels || {}),
        formatter: function (this: any): string {
          const value = Number(this.value);
          if (!Number.isFinite(value)) return String(this.value);
          const scaled = scale ? value * scale.scale : value;
          return scale?.formatter
            ? scale.formatter(scaled, unit)
            : `${formatChartValue(scaled, typeof configuredUnit === 'string' ? undefined : configuredUnit.precision)}\u00a0${unit}`;
        },
      };
    }
  }

  return {
    unit,
    scale: scale?.scale ?? 1,
    formatter: scale?.formatter,
    precision: typeof configuredUnit === 'string' ? undefined : configuredUnit.precision,
  };
}

function extractNumericValue(point: any): number | undefined {
  if (typeof point === 'number') return point;
  if (typeof point?.y === 'number') return point.y;
  if (Array.isArray(point) && typeof point[1] === 'number') return point[1];
  return undefined;
}

function applyUnitTooltip(
  options: Highcharts.Options,
  unitScales: ReadonlyMap<number, UnitDisplay>,
  seriesUnitDisplays: ReadonlyMap<number, UnitDisplay> = new Map(),
): void {
  if ((unitScales.size === 0 && seriesUnitDisplays.size === 0) || typeof options.tooltip?.formatter === 'function') {
    return;
  }

  options.tooltip = {
    ...(options.tooltip || {}),
    formatter: function (this: any): string {
      const points = Array.isArray(this.points) && this.points.length > 0
        ? this.points
        : [this.point ?? this];
      const title = this.x === undefined ? '' : `${this.x}<br/>`;
      const lines = points.map((point: any) => {
        const axisIndex = Number(point.series?.options?.yAxis ?? 0);
        const seriesIndex = Number(point.series?.index);
        const display = seriesUnitDisplays.get(seriesIndex)
          ?? unitScales.get(axisIndex)
          ?? unitScales.get(0);
        const value = Number(point.y);
        const formatted = formatUnitValue(value, display);
        return `${point.series?.name ?? ''}: ${formatted}`;
      });
      return `${title}${lines.join('<br/>')}`;
    },
  };
}

function formatUnitValue(value: number, display?: UnitDisplay): string {
  if (!display || !Number.isFinite(value)) return String(value);
  const scaled = value * display.scale;
  const formatted = display.formatter
    ? display.formatter(scaled, display.unit)
    : formatChartValue(scaled, display.precision);
  return `${formatted}\u00a0${display.unit}`;
}
