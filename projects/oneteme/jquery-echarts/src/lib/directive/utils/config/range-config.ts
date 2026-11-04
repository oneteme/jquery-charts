import { buildChart, ChartProvider, ChartType, CommonChart, XaxisType } from '@oneteme/jquery-core';
import { EChartsOption } from '../types';
import { formatTooltipValue, getXAxisType } from '../chart-utils';
import { EChartTypeConfigurator } from './chart-config-registry';
import { toNumber } from './raw-series';

const RANGE_TYPES: ChartType[] = ['rangeBar', 'rangeColumn', 'rangeArea', 'arearange', 'areasplinerange', 'columnrange'];

type Range = [number, number];

/** Couple [min, max] ; null si une extrémité est absente ou non numérique. */
function readRange(value: unknown): Range | null {
  if (!Array.isArray(value)) return null;
  const low = toNumber(value[0]);
  const high = toNumber(value[1]);
  return low === undefined || high === undefined ? null : [low, high];
}

function crossesZero(range: Range | null): boolean {
  return !!range && range[0] < 0 && range[1] > 0;
}

/** Plage de chaque point d'une série : en mode continu la plage est dans `y` et l'abscisse est `x`, sinon l'index de catégorie. */
function readRangePoints(data: any[], isContinue: boolean): { x: number; range: Range | null }[] {
  return data.map((d, i) => (isContinue ? { x: d.x, range: readRange(d.y) } : { x: i, range: readRange(d) }));
}

/**
 * ECharts empile séparément les valeurs positives et négatives des barres.
 * Pour que chaque plage occupe exactement [min, max], elle est découpée en :
 *  - base : partie transparente jusqu'au bord le plus proche de 0 ;
 *  - visible : longueur visible (partie positive, ou partie négative si la plage est entièrement négative) ;
 *  - negative : partie négative visible, utilisée seulement quand la plage traverse zéro.
 */
function splitBarRanges(ranges: (Range | null)[]) {
  const base: (number | null)[] = [];
  const visible: (number | null)[] = [];
  const negative: (number | null)[] = [];
  ranges.forEach((range) => {
    if (!range) {
      base.push(null);
      visible.push(null);
      negative.push(null);
      return;
    }
    const [low, high] = range;
    if (low >= 0) {
      base.push(low);
      visible.push(high - low);
      negative.push(0);
    } else if (high <= 0) {
      base.push(high);
      visible.push(low - high);
      negative.push(0);
    } else {
      base.push(0);
      visible.push(high);
      negative.push(low);
    }
  });
  return { base, visible, negative };
}

/** Rôle d'une série ECharts : série d'origine et indicateur de segment visible (les bases et mins sont masqués). */
interface RangeSeriesRole {
  owner: number;
  visible: boolean;
}

/** Plages d'une série d'origine, indexées par catégorie, utilisées par le tooltip. */
interface RangeOwner {
  name: string;
  unit?: string;
  ranges: (Range | null)[];
}

/** Tooltip affichant les bornes « min – max unité » au lieu de la longueur du segment empilé. */
function buildRangeTooltipFormatter(roles: RangeSeriesRole[], owners: RangeOwner[]) {
  return (params: any) => {
    const items: any[] = Array.isArray(params) ? params : [params];
    const title = items[0]?.axisValueLabel ?? items[0]?.name ?? '';
    const lines: string[] = [];
    items.forEach((param) => {
      const role = roles[param.seriesIndex];
      if (!role?.visible) return;
      const owner = owners[role.owner];
      const range = owner.ranges[param.dataIndex];
      if (!range) return;
      const unit = owner.unit ? ` ${owner.unit}` : '';
      lines.push(`${param.marker ?? ''}${owner.name}: ${formatTooltipValue(range[0])} – ${formatTooltipValue(range[1])}${unit}`);
    });
    return [title, ...lines].join('<br/>');
  };
}

/**
 * Implémentation des graphiques Range via des séries "bar" empilées :
 *  - Série 1 transparente (baseline jusqu'au bord de la plage le plus proche de 0)
 *  - Série 2 visible (la plage, découpée selon son signe, voir splitBarRanges)
 *
 * ECharts ne dispose pas de type range natif pour les barres,
 * ce pattern produit un résultat visuellement identique.
 *
 * Pour arearange / areasplinerange, on utilise deux séries line en stack (cumul : pas de découpe par signe).
 */
function buildRangeOption(
  chart: CommonChart<XaxisType, number[]>,
  type: ChartType,
  config: ChartProvider<any, any>
): EChartsOption {
  const isHorizontal = type === 'rangeBar';
  const isArea = type === 'arearange' || type === 'areasplinerange' || type === 'rangeArea';
  const isSmooth = type === 'areasplinerange';
  const isContinue = !!config.continue;
  // En horizontal, l'axe des catégories ne porte pas l'abscisse : pas de couples [x, valeur]
  const usePairs = isContinue && !isHorizontal;
  const toValue = (value: number | null, x: number) => (usePairs ? [x, value] : value);

  const firstX = isContinue ? (chart.series[0]?.data[0] as any)?.x : undefined;
  const xType = getXAxisType(chart.categories ?? [], isContinue, firstX);

  const categoryAxis = {
    type: 'category' as const,
    data: (chart.categories ?? []).map(String),
    boundaryGap: true,
  };
  const valueAxis = { type: 'value' as const };

  const seriesList: any[] = [];
  const roles: RangeSeriesRole[] = [];
  const owners: RangeOwner[] = [];
  const push = (series: any, owner: number, visible: boolean) => {
    seriesList.push(series);
    roles.push({ owner, visible });
  };

  chart.series.forEach((s, owner) => {
    if (isArea) {
      // Les aires sont empilées en cumul : pas de découpe par signe, base = min et épaisseur = max - min
      const points = readRangePoints(s.data, isContinue);
      owners.push({ name: s.name ?? '', unit: s.unit, ranges: points.map((p) => p.range) });
      push({
        type: 'line',
        name: s.name ? `${s.name} (min)` : 'min',
        data: points.map((p) => toValue(p.range ? p.range[0] : null, p.x)),
        stack: s.stack ?? `range_${s.name}`,
        areaStyle: { opacity: 0 },
        smooth: isSmooth,
        lineStyle: { width: 0 },
        symbol: 'none',
        itemStyle: { opacity: 0 },
      }, owner, false);
      push({
        type: 'line',
        name: s.name ?? '',
        data: points.map((p) => toValue(p.range ? p.range[1] - p.range[0] : null, p.x)),
        stack: s.stack ?? `range_${s.name}`,
        areaStyle: { opacity: 0.4 },
        smooth: isSmooth,
        itemStyle: s.color ? { color: s.color } : undefined,
      }, owner, true);
    } else {
      const points = readRangePoints(s.data, isContinue);
      const ranges = points.map((p) => p.range);
      const { base, visible, negative } = splitBarRanges(ranges);
      const withX = (values: (number | null)[]) => values.map((value, i) => toValue(value, points[i].x));
      owners.push({ name: s.name ?? '', unit: s.unit, ranges });
      // Série de base transparente
      push({
        type: 'bar',
        name: s.name ? `${s.name} (base)` : 'base',
        data: withX(base),
        stack: s.stack ?? `range_${s.name}`,
        itemStyle: { opacity: 0 },
        barMaxWidth: '60%',
      }, owner, false);
      // Série visible (hauteur = max - min, côté positif ou négatif)
      push({
        type: 'bar',
        name: s.name ?? '',
        data: withX(visible),
        stack: s.stack ?? `range_${s.name}`,
        itemStyle: s.color ? { color: s.color } : undefined,
        barMaxWidth: '60%',
      }, owner, true);
      // Partie négative d'une plage qui traverse zéro : même pile, même couleur
      if (ranges.some(crossesZero)) {
        push({
          type: 'bar',
          name: s.name ?? '',
          data: withX(negative),
          stack: s.stack ?? `range_${s.name}`,
          itemStyle: s.color ? { color: s.color } : undefined,
          barMaxWidth: '60%',
        }, owner, false);
      }
    }
  });

  return {
    // N'afficher dans la légende que les séries "visibles" (pas les bases transparentes)
    legend: { data: chart.series.map((s) => s.name ?? '').filter(Boolean) },
    tooltip: { formatter: buildRangeTooltipFormatter(roles, owners) },
    xAxis: isHorizontal ? valueAxis : (isContinue ? { type: xType } : categoryAxis),
    yAxis: isHorizontal ? categoryAxis : valueAxis,
    series: seriesList,
  };
}


export const rangeConfigurator: EChartTypeConfigurator = {
  supports: (type) => RANGE_TYPES.includes(type),

  buildChartData: (data, config, type) =>
    buildChart(data, { ...config, continue: config.continue ?? false }),

  buildOption: (chart, type, config) => buildRangeOption(chart as any, type, config),

  tooltipTrigger: 'axis',
};
