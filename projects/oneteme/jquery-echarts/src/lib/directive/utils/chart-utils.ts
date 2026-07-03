import { ChartProvider, mergeDeep, UnitConfig, ScaleConfig } from '@oneteme/jquery-core';
import { EChartsOption } from './types';

/**
 * Construit l'option tooltip avec un style professionnel unifié.
 * Utilisé à la fois dans buildBaseOption et dans le tooltipOverride de la directive.
 */
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
      // Calcul en coordonnées viewport absolues.
      // Avec position:fixed sur le tooltip, ces coordonnées == coordonnées CSS finales,
      // ce qui élimine tout impact sur le scroll de la page.
      // Note : ECharts ajoute rect + window.pageOffset au retour du callback (pour position:absolute).
      // On soustrait ce décalage pour que la position CSS finale corresponde au viewport cible.
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

  // Fusion profonde élément-par-élément des séries quand config.options.series est défini.
  // mergeDeep (au lieu de spread superficiel) préserve les propriétés imbriquées (label, emphasis.label…)
  // qui seraient écrasées par un spread top-level, notamment position:'center' sur le label de base.
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

  // ── Unité Y ── appliqué après mergeDeep pour préserver les fonctions (mergeDeep ne clone pas les fonctions)
  // Le dev peut toujours surcharger via config.options.tooltip.formatter / config.options.tooltip.valueFormatter
  if (config.yUnit) {
    const yUnitConfig = config.yUnit;

    // Déterminer le label d'unité à afficher (string ou auto-détection via UnitConfig)
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

    // Unité dans les noms de séries → affichée dans la légende et dans les tooltips
    if (Array.isArray(result.series)) {
      result.series = result.series.map((s: any) => ({
        ...s,
        name: s.name ? `${s.name}\u00a0[${displayUnit}]` : s.name,
      }));
    }

    // Formatter des ticks Y — précision adaptative, sans unité (l'unité est déjà dans la légende)
    if (!result.yAxis) result.yAxis = {};
    if (!result.yAxis.axisLabel) result.yAxis.axisLabel = {};

    if (scaleInfo?.formatter) {
      // Formatage personnalisé si fourni dans UnitConfig
      result.yAxis.axisLabel.formatter = (v: number) => scaleInfo!.formatter!(v * scaleInfo!.scale, displayUnit);
    } else {
      // Formatage adaptatif avec scaling automatique
      result.yAxis.axisLabel.formatter = (v: number) => {
        const scaled = scaleInfo ? v * scaleInfo.scale : v;
        return _smartFormatY(scaled);
      };
    }

    // valueFormatter du tooltip — cohérent avec l'axe, sans unité redondante
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
        return _smartFormatY(scaled);
      };
    }
  }

  return result as EChartsOption;
}

/**
 * Extrait toutes les valeurs Y d'une liste de séries ECharts pour calcul d'auto-scaling.
 * Retourne un tableau de nombres (valeurs brutes, non scalées).
 */
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

/**
 * Sélectionne le meilleur scale pour une UnitConfig basé sur l'ordre de grandeur des données.
 * @param unitConfig Configuration des scales disponibles
 * @param dataValues Valeurs Y brutes (dans l'unité de base)
 * @returns L'objet scale à appliquer
 */
export function selectBestScale(
  unitConfig: UnitConfig,
  dataValues: number[]
): { scale: number; unit: string; formatter?: (v: number, unit: string) => string } {
  if (!Array.isArray(unitConfig.scales) || unitConfig.scales.length === 0) {
    // Fallback : retourner première scale ou scale 1x
    return { scale: 1, unit: unitConfig.baseUnit };
  }

  // Trier les scales par threshold croissant
  const sortedScales = [...unitConfig.scales].sort((a, b) => (a.threshold ?? Infinity) - (b.threshold ?? Infinity));

  // Trouver le max des données
  const maxValue = Math.max(...dataValues.filter(v => isFinite(v) && v !== 0), 0);

  // Trouver la première scale dont le threshold est >= maxValue
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

  // Si aucune ne correspond, retourner la dernière (fallback)
  const lastScale = sortedScales[sortedScales.length - 1];
  return {
    scale: lastScale.scale,
    unit: lastScale.unit,
    formatter: unitConfig.formatter,
  };
}

/**
 * Formate un nombre pour l'affichage sur un axe Y ou en tooltip.
 * Adapte automatiquement la précision à l'ordre de grandeur de la valeur.
 * @example 0 → "0" | 0,000 123 → "0,000 123" | 7,318 → "7,32" | 1 234 → "1 234"
 */
function _smartFormatY(v: number): string {
  if (!isFinite(v) || v === 0) return '0';
  const abs = Math.abs(v);
  const magnitude = Math.floor(Math.log10(abs));
  const decimals = Math.max(0, Math.min(-magnitude + 2, 6));
  return v.toLocaleString('fr-FR', { maximumFractionDigits: decimals });
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
