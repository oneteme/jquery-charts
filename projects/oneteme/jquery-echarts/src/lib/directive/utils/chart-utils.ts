import { ChartProvider, formatChartValue, mergeDeep, selectBestScale, UnitConfig } from '@oneteme/jquery-core';
import { EChartsOption } from './types';

export { selectBestScale };

export function buildTooltipOption(trigger: 'axis' | 'item', el?: HTMLElement): any {
  return {
    trigger,
    position: (point: number[], _params: any, dom: HTMLElement) => {
      const tw = dom?.offsetWidth ?? 0;
      const th = dom?.offsetHeight ?? 0;
      const gap = 10;
      const width = el?.clientWidth ?? 0;
      const height = el?.clientHeight ?? 0;
      let x = point[0] + gap;
      let y = point[1] + gap;
      if (x + tw > width) x = point[0] - tw - gap;
      if (y + th > height) y = point[1] - th - gap;
      return [
        Math.max(gap, Math.min(width - tw - gap, x)),
        Math.max(gap, Math.min(height - th - gap, y)),
      ];
    },
    backgroundColor: '#1a1f2e',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderRadius: 8,
    padding: [10, 14],
    textStyle: {
      color: '#e2e8f0',
      fontSize: 13,
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    extraCssText: 'box-shadow: 0 8px 24px rgba(0,0,0,0.4); position: absolute !important;',
  };
}

function getTooltipValue(param: any): unknown {
  if (Array.isArray(param?.value)) {
    return param.value[1];
  }
  if (param?.value && typeof param.value === 'object' && 'value' in param.value) {
    return Array.isArray(param.value.value) ? param.value.value[1] : param.value.value;
  }
  return param?.value;
}

export function formatTooltipValue(value: unknown): string {
  const numericValue = typeof value === 'number' || typeof value === 'string'
    ? Number(value)
    : Number.NaN;

  if (!Number.isFinite(numericValue)) return formatNonNumericTooltipValue(value);

  if (numericValue === 0) return '0';
  return formatChartValue(numericValue);
}

function formatNonNumericTooltipValue(value: unknown): string {
  if (value == null) return '–';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value) ?? '–';
    } catch {
      return '–';
    }
  }
  switch (typeof value) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'bigint':
    case 'symbol':
      return value.toString();
    case 'function':
      return value.name || 'Function';
    default:
      return '–';
  }
}

function formatNumericAxisValue(value: unknown): string {
  const numericValue = typeof value === 'number' ? value : Number(value);
  if (Number.isFinite(numericValue)) return formatChartValue(numericValue);
  return typeof value === 'string' ? value : '';
}

function centerTitle(title: any): any {
  if (!title || typeof title !== 'object') return title;
  return {
    ...title,
    left: title.left ?? 'center',
  };
}

function applyDefaultNumericAxisLabel(axis: any): any {
  if (!axis || (axis.type !== 'value' && axis.type !== 'log') || axis.axisLabel?.formatter !== undefined) return axis;
  return {
    ...axis,
    axisLabel: { ...axis.axisLabel, formatter: formatNumericAxisValue },
  };
}

function applyDefaultNumericXAxisLabel(axis: any): any {
  if (!axis || (axis.type !== 'value' && axis.type !== 'log')) return axis;
  return applyDefaultNumericAxisLabel(axis);
}

function applyDefaultNumericXAxisLabels(option: any): void {
  if (Array.isArray(option.xAxis)) {
    option.xAxis = option.xAxis.map(applyDefaultNumericXAxisLabel);
  } else if (option.xAxis) {
    option.xAxis = applyDefaultNumericXAxisLabel(option.xAxis);
  }
}

function hasTooltipFormatter(result: any, options: any): boolean {
  const configuredTooltip = options?.tooltip;
  return configuredTooltip?.formatter !== undefined
    || configuredTooltip?.valueFormatter !== undefined
    || result.tooltip?.formatter !== undefined
    || result.tooltip?.valueFormatter !== undefined;
}

function applyDefaultTooltip(result: any, options: any, valueFormatter: (value: number | string) => string): void {
  if (hasTooltipFormatter(result, options)) return;
  if (!result.tooltip) result.tooltip = {};
  result.tooltip.valueFormatter = valueFormatter;
}

interface UnitFormatInfo {
  displayUnit: string;
  precision?: number;
  scaleInfo?: { scale: number; unit: string; formatter?: (value: number, unit: string) => string };
}

function resolveUnitFormat(yUnit: string | UnitConfig, series: any[]): UnitFormatInfo {
  if (typeof yUnit === 'string') return { displayUnit: yUnit };
  const scaleInfo = selectBestScale(yUnit, _extractYValues(series));
  return {
    displayUnit: scaleInfo.unit,
    precision: yUnit.precision,
    scaleInfo,
  };
}

function applyUnitFormatting(result: any, config: ChartProvider<any, any>): void {
  const unitFormat = resolveUnitFormat(config.yUnit as string | UnitConfig, result.series);
  const formatAxisValue = (value: number): string => {
    const scaled = unitFormat.scaleInfo ? value * unitFormat.scaleInfo.scale : value;
    return unitFormat.scaleInfo?.formatter
      ? unitFormat.scaleInfo.formatter(scaled, unitFormat.displayUnit)
      : formatChartValue(scaled, unitFormat.precision);
  };
  const applyAxisLabel = (axis: any): any => {
    if (!axis || axis.axisLabel?.formatter !== undefined) return axis;
    return { ...axis, axisLabel: { ...axis.axisLabel, formatter: formatAxisValue } };
  };

  result.yAxis = Array.isArray(result.yAxis)
    ? result.yAxis.map(applyAxisLabel)
    : applyAxisLabel(result.yAxis);
  applyDefaultNumericXAxisLabels(result);
  applyDefaultTooltip(result, config.options, (value: number | string) => {
    if (value == null) return '–';
    const num = typeof value === 'number' ? value : Number.parseFloat(String(value));
    if (Number.isNaN(num)) return String(value);
    const scaled = unitFormat.scaleInfo ? num * unitFormat.scaleInfo.scale : num;
    if (unitFormat.scaleInfo?.formatter) {
      return unitFormat.scaleInfo.formatter(scaled, unitFormat.displayUnit);
    }
    return `${formatChartValue(scaled, unitFormat.precision)}\u00a0${unitFormat.displayUnit}`;
  });
}

function applyDefaultFormatting(result: any, config: ChartProvider<any, any>): void {
  if (Array.isArray(result.yAxis)) {
    result.yAxis = result.yAxis.map(applyDefaultNumericAxisLabel);
  } else if (result.yAxis) {
    result.yAxis = applyDefaultNumericAxisLabel(result.yAxis);
  }
  applyDefaultNumericXAxisLabels(result);
  applyDefaultTooltip(result, config.options, (value: number | string) => formatTooltipValue(value));
}

/** Formatte un tooltip axe en conservant l'unité propre à chaque série. */
export function buildAxisTooltipFormatter(resolveUnit: (seriesIndex: number) => string | undefined): (params: any) => string {
  return (params: any) => {
    const items = Array.isArray(params) ? params : [params];
    const title = items[0]?.axisValueLabel ?? items[0]?.name ?? '';
    const lines = items.map((param: any) => {
      const unit = resolveUnit(param.seriesIndex);
      const suffix = unit ? ` ${unit}` : '';
      return `${param.marker ?? ''}${param.seriesName}: ${formatTooltipValue(getTooltipValue(param))}${suffix}`;
    });
    return [title, ...lines].join('<br/>');
  };
}

/**
 * Construit l'option de base commune à tous les types de graphiques.
 */
export function buildBaseOption(config: ChartProvider<any, any>): EChartsOption {
  const hasTitle = !!(config.title || config.subtitle);
  const hasSubtitle = !!config.subtitle;
  let gridTop = 10;
  if (hasTitle) {
    gridTop = hasSubtitle ? 80 : 60;
  }
  return {
    animation: true,
    // N'inclure le composant title que s'il y a effectivement un contenu,
    // sinon ECharts réserve ~60px de padding en haut inutilement.
    ...(hasTitle ? {
      title: {
        text: config.title ?? '',
        subtext: config.subtitle ?? '',
        left: 'center',
      },
    } : {}),
    tooltip: buildTooltipOption('axis'),
    legend: {
      show: true,
      type: 'scroll',
      bottom: 0,
    },
    grid: {
      top: gridTop,
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true,
    },
    toolbox: { show: false },
  };
}


/**
 * Applique les propriétés communes de la config ChartProvider
 * sur une option ECharts existante (title, subtitle, axes, stacking...).
 */
export function applyCommonConfig(
  option: EChartsOption,
  config: ChartProvider<any, any>
): EChartsOption {
  // N'injecter le composant title que s'il y a du contenu
  // (même guard que buildBaseOption pour éviter le padding ECharts inutile)
  const patch: EChartsOption = {
    ...(config.title || config.subtitle
      ? {
        title: {
          text: config.title ?? '',
          subtext: config.subtitle ?? '',
          left: 'center',
        },
      }
      : {}),
  };

  if (config.xtitle) {
    (patch as any).xAxis = { name: config.xtitle, nameLocation: 'center', nameGap: 30 };
  }
  if (config.ytitle && !Array.isArray(config.ytitle)) {
    (patch as any).yAxis = { name: config.ytitle, nameLocation: 'center', nameGap: 40 };
  }

  const { series: seriesPatch, ...restOptions } = (config.options ?? {}) as any;
  const result = mergeDeep({}, option, patch, restOptions) as any;
  if (Array.isArray(result.title)) {
    result.title = result.title.map(centerTitle);
  } else if (result.title) {
    result.title = centerTitle(result.title);
  }
  if (result.tooltip) {
    result.tooltip.appendToBody = false;
  }

  applyControlledLegendSelection(result);

  if (seriesPatch && Array.isArray(seriesPatch) && Array.isArray(result.series)) {
    result.series = result.series.map((s: any, i: number) => {
      const patch = seriesPatch[i] ?? {};
      const merged = mergeDeep({}, s, patch);
      // Si l'utilisateur active les labels (show: true) sans préciser de position,
      // on supprime le position:'center' hérité du workaround hover donut
      // pour qu'ECharts utilise sa position par défaut ('outside' pour pie/donut).
      if (patch.label?.show === true && patch.label?.position === undefined && merged.label?.position === 'center') {
        delete merged.label.position;
      }
      return merged;
    });
  }

  if (config.yUnit) {
    applyUnitFormatting(result, config);
  } else {
    applyDefaultFormatting(result, config);
  }

  return result as EChartsOption;
}

function _extractYValues(series: any[]): number[] {
  const values: number[] = [];
  if (!Array.isArray(series)) return values;

  for (const s of series) {
    if (Array.isArray(s.data)) {
      for (const point of s.data) {
        if (typeof point === 'number') {
          values.push(point);
        } else if (point && typeof point === 'object' && typeof point.value === 'number') {
          values.push(point.value);
        } else if (point && Array.isArray(point) && typeof point[1] === 'number') {
          // Format [x, y]
          values.push(point[1]);
        }
      }
    }
  }
  return values;
}

export function applyControlledLegendSelection(option: any): void {
  const controlledSelection = (option.series ?? []).reduce((selection: Record<string, boolean>, series: any) => {
    if (typeof series?.name === 'string' && typeof series.visible === 'boolean') {
      selection[series.name] = series.visible;
    }
    return selection;
  }, {});
  if (Object.keys(controlledSelection).length === 0) return;

  if (option.legend) {
    option.legend.selected = option.legend.selected
      ? { ...option.legend.selected, ...controlledSelection }
      : controlledSelection;
  } else {
    option.legend = { selected: controlledSelection };
  }
}

export function buildNoDataGraphic(message = 'Aucune donnée'): any {
  return [
    {
      type: 'text',
      left: 'center',
      top: 'middle',
      style: {
        text: message,
        fontSize: 12,
        fill: '#333',
      },
      z: 100,
    },
  ];
}

export function resolveXAxisType(value: any): 'time' | 'value' | 'category' {
  if (value instanceof Date) return 'time';
  if (typeof value === 'number') return 'value';
  return 'category';
}

export function getXAxisType(
  categories: any[],
  isContinue: boolean,
  firstX?: any
): 'time' | 'value' | 'category' {
  if (isContinue && firstX !== undefined) return resolveXAxisType(firstX);
  if (categories.length) return resolveXAxisType(categories[0]);
  return 'category';
}
