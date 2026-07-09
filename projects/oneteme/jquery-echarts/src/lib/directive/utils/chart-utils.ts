import { ChartProvider, mergeDeep, UnitConfig } from '@oneteme/jquery-core';
import { EChartsOption } from './types';

export function buildTooltipOption(trigger: 'axis' | 'item', el?: HTMLElement): any {
  return {
    trigger,
    appendToBody: true,
    position: (point: number[], _params: any, dom: HTMLElement) => {
      const rect = el?.getBoundingClientRect();
      if (!rect) return undefined;
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      // Container hors viewport → tooltip masqué (tooltips synchronisés via echarts.connect())
      if (rect.bottom < 0 || rect.top > vh || rect.right < 0 || rect.left > vw) {
        return [-9999, -9999];
      }
      const tw = dom?.offsetWidth ?? 0;
      const th = dom?.offsetHeight ?? 0;
      const gap = 10;
      const sx = window.scrollX;
      const sy = window.scrollY;
      let vx = rect.left + point[0] + gap;
      let vy = rect.top  + point[1] + gap;
      if (vx + tw > vw) vx = rect.left + point[0] - tw - gap;
      if (vy + th > vh) vy = rect.top  + point[1] - th - gap;
      vx = Math.max(gap, Math.min(vw - tw - gap, vx));
      vy = Math.max(gap, Math.min(vh - th - gap, vy));
      return [vx - rect.left - sx, vy - rect.top - sy];
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
    // position:fixed retire le tooltip du flux du document → impossible de créer une scrollbar
    extraCssText: 'box-shadow: 0 8px 24px rgba(0,0,0,0.4); position: fixed !important;',
  };
}

/**
 * Construit l'option de base commune à tous les types de graphiques.
 * Les options spécifiques au type sont fusionnées par-dessus.
 */
export function buildBaseOption(config: ChartProvider<any, any>): EChartsOption {
  const hasTitle = !!(config.title || config.subtitle);
  const hasSubtitle = !!config.subtitle;
  // Réserver suffisamment d'espace en haut pour le titre ECharts :
  // ~60px pour un titre seul, ~80px si sous-titre présent, 10px sinon.
  const gridTop = hasTitle ? (hasSubtitle ? 80 : 60) : 10;
  return {
    animation: true,
    // N'inclure le composant title que s'il y a effectivement un contenu,
    // sinon ECharts réserve ~60px de padding en haut inutilement.
    ...(hasTitle ? { title: { text: config.title ?? '', subtext: config.subtitle ?? '', left: 'auto' } } : {}),
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
      ? { title: { text: config.title ?? '', subtext: config.subtitle ?? '' } }
      : {}),
  };

  if (config.xtitle) {
    (patch as any).xAxis = { name: config.xtitle, nameLocation: 'center', nameGap: 30 };
  }
  if (config.ytitle) {
    (patch as any).yAxis = { name: config.ytitle, nameLocation: 'center', nameGap: 40 };
  }

  const { series: seriesPatch, ...restOptions } = (config.options ?? {}) as any;
  const result = mergeDeep({}, option, patch, restOptions) as any;

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
    const yUnitConfig = config.yUnit;
    let displayUnit: string;
    let scaleInfo: { scale: number; unit: string; formatter?: (v: number, unit: string) => string } | undefined;

    if (typeof yUnitConfig === 'string') {
      // Cas simple : unité statique
      displayUnit = yUnitConfig;
    } else {
      // Cas UnitConfig : auto-détection du meilleur format
      const unitConfig = yUnitConfig as UnitConfig;
      const dataValues = _extractYValues(result.series);
      scaleInfo = selectBestScale(unitConfig, dataValues);
      displayUnit = scaleInfo.unit;
    }

    if (!result.yAxis) result.yAxis = {};
    if (!result.yAxis.axisLabel) result.yAxis.axisLabel = {};

    if (scaleInfo?.formatter) {
      result.yAxis.axisLabel.formatter = (v: number) => scaleInfo!.formatter!(v * scaleInfo!.scale, displayUnit);
    } else {
      result.yAxis.axisLabel.formatter = (v: number) => {
        const scaled = scaleInfo ? v * scaleInfo.scale : v;
        return _smartFormatY(scaled);
      };
    }

    const devTooltip = (config.options as any)?.tooltip;
    if (!devTooltip?.formatter && !devTooltip?.valueFormatter) {
      if (!result.tooltip) result.tooltip = {};
      result.tooltip.valueFormatter = (v: number | string) => {
        if (v == null) return '–';
        const num = typeof v === 'number' ? v : parseFloat(String(v));
        if (isNaN(num)) return String(v);
        const scaled = scaleInfo ? num * scaleInfo.scale : num;
        if (scaleInfo?.formatter) {
          return scaleInfo.formatter(scaled, displayUnit);
        }
        return `${_smartFormatY(scaled)}\u00a0${displayUnit}`;
      };
    }
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

export function selectBestScale(
  unitConfig: UnitConfig,
  dataValues: number[]
): { scale: number; unit: string; formatter?: (v: number, unit: string) => string } {
  if (!Array.isArray(unitConfig.scales) || unitConfig.scales.length === 0) {
    return { scale: 1, unit: unitConfig.baseUnit };
  }

  const sortedScales = [...unitConfig.scales].sort((a, b) => (a.threshold ?? Infinity) - (b.threshold ?? Infinity));

  const maxValue = Math.max(...dataValues.filter(v => isFinite(v) && v !== 0), 0);
  for (const scale of sortedScales) {
    const threshold = scale.threshold ?? Infinity;
    if (maxValue <= threshold) {
      return {
        scale: scale.scale,
        unit: scale.unit,
        formatter: unitConfig.formatter,
      };
    }
  }
  const lastScale = sortedScales[sortedScales.length - 1];
  return {
    scale: lastScale.scale,
    unit: lastScale.unit,
    formatter: unitConfig.formatter,
  };
}

function _smartFormatY(v: number): string {
  if (!isFinite(v) || v === 0) return '0';
  const abs = Math.abs(v);
  const magnitude = Math.floor(Math.log10(abs));
  const decimals = Math.max(0, Math.min(-magnitude + 2, 6));
  return v.toLocaleString('fr-FR', { maximumFractionDigits: decimals });
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
