import { ChartProvider, mergeDeep } from '@oneteme/jquery-core';
import { EChartsOption } from './types';

/**
 * Construit l'option tooltip avec un style professionnel unifié.
 * Utilisé à la fois dans buildBaseOption et dans le tooltipOverride de la directive.
 */
export function buildTooltipOption(trigger: 'axis' | 'item'): any {
  return {
    trigger,
    confine: true,
    appendToBody: true,
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
    extraCssText: 'box-shadow: 0 8px 24px rgba(0,0,0,0.4);',
  };
}

/**
 * Construit l'option de base commune à tous les types de graphiques.
 * Les options spécifiques au type sont fusionnées par-dessus.
 */
export function buildBaseOption(config: ChartProvider<any, any>): EChartsOption {
  return {
    animation: true,
    title: {
      text: config.title ?? '',
      subtext: config.subtitle ?? '',
      left: 'auto',
    },
    tooltip: buildTooltipOption('axis'),
    legend: {
      show: true,
      type: 'scroll',
      bottom: 0,
    },
    grid: {
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
  const patch: EChartsOption = {
    title: {
      text: config.title ?? '',
      subtext: config.subtitle ?? '',
    },
  };

  if (config.xtitle) {
    (patch as any).xAxis = { name: config.xtitle, nameLocation: 'center', nameGap: 30 };
  }
  if (config.ytitle) {
    (patch as any).yAxis = { name: config.ytitle, nameLocation: 'center', nameGap: 40 };
  }
  if (config.width) {
    (patch as any).width = config.width;
  }
  if (config.height) {
    (patch as any).height = config.height;
  }

  const { series: seriesPatch, ...restOptions } = (config.options ?? {}) as any;
  const result = mergeDeep({}, option, patch, restOptions) as any;

  // Fusion élément-par-élément des séries quand config.options.series est défini,
  // pour permettre la personnalisation par graphique sans écraser les données calculées.
  if (seriesPatch && Array.isArray(seriesPatch) && Array.isArray(result.series)) {
    result.series = result.series.map((s: any, i: number) => ({
      ...s,
      ...(seriesPatch[i] ?? seriesPatch[0] ?? {}),
    }));
  }

  return result as EChartsOption;
}

/**
 * Construit l'option "graphic" pour afficher un message "Aucune donnée".
 * Utilisé nativement via la propriété `graphic` d'ECharts.
 */
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

/**
 * Détermine le type d'axe X ECharts en fonction des données.
 */
export function resolveXAxisType(value: any): 'time' | 'value' | 'category' {
  if (value instanceof Date) return 'time';
  if (typeof value === 'number') return 'value';
  return 'category';
}

/**
 * Retourne le type d'axe X à partir du premier point disponible
 * (catégorie ou valeur x si mode continue).
 */
export function getXAxisType(
  categories: any[],
  isContinue: boolean,
  firstX?: any
): 'time' | 'value' | 'category' {
  if (isContinue && firstX !== undefined) return resolveXAxisType(firstX);
  if (categories.length) return resolveXAxisType(categories[0]);
  return 'category';
}
