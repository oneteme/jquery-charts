import { ChartProvider, ChartType, formatChartDate } from '@oneteme/jquery-core';
import { EChartsOption } from '../types';
import { EChartTypeConfigurator } from './chart-config-registry';
import { formatTooltipValue } from '../chart-utils';
import { readRawPoints, toNumber } from './raw-series';

const CALENDAR_TYPES: ChartType[] = ['calendar'];
const CALENDAR_LOCALE = 'fr-FR';
const CALENDAR_CELL_SIZE = 14;

/** Libellés français générés par Intl pour rester alignés avec les autres dates du lib. */
const DAY_NAMES = Array.from({ length: 7 }, (_, i) =>
  new Intl.DateTimeFormat(CALENDAR_LOCALE, { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 7 + i))),
);
const MONTH_NAMES = Array.from({ length: 12 }, (_, i) =>
  new Intl.DateTimeFormat(CALENDAR_LOCALE, { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, i, 1))),
);

export interface CalendarModel {
  /** Couples [YYYY-MM-DD, valeur agrégée] */
  days: [string, number][];
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Convertit une date en clé `YYYY-MM-DD` dans le fuseau local.
 * Une chaîne déjà au format `YYYY-MM-DD` est gardée telle quelle ; une date avec heure
 * (ISO, Date, timestamp) est convertie en jour local pour ne pas décaler les données.
 */
export function toDayKey(value: unknown): string | undefined {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }
  if (value === null || value === undefined || value === '') return undefined;
  const date = value instanceof Date ? value : new Date(value as string | number);
  if (Number.isNaN(date.getTime())) return undefined;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Mapping des données : X = date, Y = valeur. Les valeurs sont additionnées par jour,
 * toutes séries confondues. Les lignes sans date valide ou sans valeur numérique sont ignorées.
 */
export function buildCalendarModel(data: any[], config: ChartProvider<any, any>): CalendarModel {
  const totals = new Map<string, number>();
  readRawPoints(data, config).forEach((p) => {
    const day = toDayKey(p.x);
    const value = toNumber(p.y);
    if (day === undefined || value === undefined) return;
    totals.set(day, (totals.get(day) ?? 0) + value);
  });
  return {
    days: [...totals.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  };
}

function buildCalendarOption(model: CalendarModel, config: ChartProvider<any, any>): EChartsOption {
  const values = model.days.map(([, v]) => v);
  const minValue = values.reduce((acc, v) => Math.min(acc, v), Infinity);
  const maxValue = values.reduce((acc, v) => Math.max(acc, v), -Infinity);
  const visualMin = Number.isFinite(minValue) ? minValue : 0;
  const visualMax = Number.isFinite(maxValue) && maxValue > visualMin ? maxValue : visualMin + 1;

  // Sans donnée, on affiche l'année courante pour garder un calendrier visible
  const range: string | [string, string] = model.days.length
    ? [model.days[0][0], model.days[model.days.length - 1][0]]
    : String(new Date().getFullYear());

  return {
    grid: undefined,
    xAxis: undefined,
    yAxis: undefined,
    legend: { show: false },
    calendar: {
      range,
      top: config.title ? 90 : 56,
      left: 40,
      right: 40,
      cellSize: ['auto', CALENDAR_CELL_SIZE],
      itemStyle: { borderWidth: 2, borderColor: '#fff' },
      splitLine: { show: false },
      yearLabel: { show: true, position: 'top', margin: 28, fontSize: 13, fontWeight: 'bold', color: '#444' },
      monthLabel: { nameMap: MONTH_NAMES, margin: 10, fontSize: 11 },
      dayLabel: { firstDay: 1, nameMap: DAY_NAMES, margin: 8 },
    },
    visualMap: {
      min: visualMin,
      max: visualMax,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 10,
      text: ['Élevé', 'Faible'],
      inRange: { color: ['#eef2f7', '#0b5ea8'] },
    },
    series: [
      {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: model.days,
        emphasis: { itemStyle: { borderColor: '#333', borderWidth: 1 } },
      },
    ],
  };
}

/**
 * Calendrier d'activité : une cellule par jour, couleur selon la valeur agrégée du jour.
 */
export const calendarConfigurator: EChartTypeConfigurator<CalendarModel> = {
  supports: (type) => CALENDAR_TYPES.includes(type),

  buildChartData: (data, config) => buildCalendarModel(data, config),

  buildOption: (model, _type, config) => {
    const option = buildCalendarOption(model, config);
    (option.series as any)[0].tooltip = {
      formatter: (p: any) => {
        const date = formatChartDate(p.value[0], {
          locale: CALENDAR_LOCALE,
          timeZone: 'UTC',
          format: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
        });
        return `${date}<br/>${formatTooltipValue(p.value[1])}`;
      },
    };
    return option;
  },

  tooltipTrigger: 'item',
};
