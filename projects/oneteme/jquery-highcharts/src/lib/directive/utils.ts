import { CommonChart, Coordinate2D, XaxisType, YaxisType, ChartProvider, mergeDeep } from '@oneteme/jquery-core';
import { ICONS } from '../../assets/icons/icons';
import { ElementRef, EventEmitter, NgZone } from '@angular/core';
import * as Highcharts from 'highcharts';

export type ChartCustomEvent = 'previous' | 'next' | 'pivot';

/**
 * Crée les boutons personnalisés pour la barre d'outils
 */
export function customIcons(
  event: (arg: ChartCustomEvent) => void,
  canPivot: boolean
): any[] {
  let customIcons = [
    {
      icon: ICONS.previous,
      title: 'Graphique précédent',
      className: 'custom-icon',
      onclick: function () {
        event('previous');
      },
    },
    {
      icon: ICONS.next,
      title: 'Graphique suivant',
      className: 'custom-icon',
      onclick: function () {
        event('next');
      },
    },
  ];

  if (canPivot) {
    customIcons.push({
      icon: ICONS.pivot,
      title: 'Pivot',
      className: 'custom-icon',
      onclick: function () {
        event('pivot');
      },
    });
  }
  return customIcons;
}

export function determineXAxisDataType(value: any): string {
  if (value instanceof Date) {
    return 'datetime';
  } else if (typeof value === 'number') {
    return 'linear';
  } else {
    return 'category';
  }
}

/**
 * Détermine le type d'axe X en fonction des données
 */
export function getType<
  X extends XaxisType,
  Y extends YaxisType | Coordinate2D
>(commonChart: CommonChart<X, Y>): string {
  if (commonChart.series.length && commonChart.series[0].data.length) {
    if (commonChart.continue) {
      const x = (<CommonChart<X, Coordinate2D>>commonChart).series[0].data[0].x;
      return determineXAxisDataType(x);
    } else {
      const categ = commonChart.categories && commonChart.categories.length > 0 ?
        commonChart.categories[0] : '';
      return determineXAxisDataType(categ);
    }
  }
  return 'datetime';
}

/**
 * Initialise les options de base communes à tous les graphiques Highcharts
 */
export function initCommonChartOptions(
  node: ElementRef,
  customEvent: EventEmitter<ChartCustomEvent>,
  ngZone: NgZone,
  chartType: string,
  canPivot: boolean = true,
// )): Highcharts.Options {
) {

  console.log('[HIGHCHARTS] initCommonChartOptions appelé');

  return {
    shouldRedraw: true,
    chart: {
      type: chartType,
      // height: '100%',
      // width: null',
      exporting: {
        enabled: false,

        customIcons: customIcons((arg) => {
          ngZone.run(() => customEvent.emit(arg));
        }, canPivot),
      },
      events: {
        // load() {
          mouseMove: function () {
            let toolbar = node.nativeElement.querySelector('.highcharts-no-tooltip');
            if (toolbar) toolbar.style.visibility = 'visible';
          },
          mouseLeave: function () {
            let toolbar = node.nativeElement.querySelector('.highcharts-no-tooltip');
            if (toolbar) toolbar.style.visibility = 'hidden';
          }
        // }
      },
      zooming: {
        enabled: false
      },
    },
    // title: { text: undefined },
    // subtitle: { text: undefined },
    credits: { enabled: false },
    series: [],
    lang: { noData: 'Aucune donnée' },
    // legend: { enabled: true },
    xAxis: {},
    // yAxis: { title: { text: '' }},
    // accessibility: { enabled: false }
    // plotOptions: { series: { stacking: undefined }}
    plotOptions: {},
  }
}

/**
 * Met à jour les options communes du graphique en fonction de la configuration fournie
 */
export function updateCommonOptions<X extends XaxisType, Y extends YaxisType>(
  options: Highcharts.Options | undefined,
  config: ChartProvider<X, Y>
): Highcharts.Options {
  console.log('[HIGHCHARTS] updateCommonOptions - input options:', options);
  console.log('[HIGHCHARTS] updateCommonOptions - input config:', config);

  // S'assurer que options est défini
  // Nous ne pouvons pas appeler initCommonChartOptions sans arguments
  // donc on retourne un objet vide si options n'est pas défini
  const baseOptions = options || {};

  const updatedOptions = mergeDeep(
    baseOptions,
    {
      chart: {
        height: config.height || '100%',
        width: config.width || null,
      },
      title: {
        text: config.title || undefined
      },
      subtitle: {
        text: config.subtitle || undefined
      },
      xAxis: {
        title: {
          text: config.xtitle || undefined
        }
      },
      yAxis: {
        title: {
          text: config.ytitle || undefined
        }
      },
      plotOptions: {
        series: {
          stacking: config.stacked ? 'normal' : undefined
        }
      }
    }
  );

  // Appliquer les options personnalisées de l'utilisateur
  if (config.options) {
    const finalOptions = mergeDeep(updatedOptions, config.options);
    console.log('[HIGHCHARTS] updateCommonOptions - output avec options utilisateur:', finalOptions);
    return finalOptions;
  }

  console.log('[HIGHCHARTS] updateCommonOptions - output sans options utilisateur:', updatedOptions);
  return updatedOptions;
}

/**
 * Convertit les données CommonChart vers le format Highcharts
 */
export function convertToHighchartsSeries<X extends XaxisType, Y extends YaxisType | Coordinate2D>(
  commonChart: CommonChart<X, Y>
): Highcharts.SeriesOptionsType[] {
  if (!commonChart.series?.length) {
    return [];
  }

  return commonChart.series.map(series => {
    // Traitement pour les données de type {x, y}
    const seriesData = series.data.map(point => {
      if (typeof point === 'object' && point !== null && 'x' in point && 'y' in point) {
        // Format: [x, y]
        return [(point as any).x, (point as any).y];
      }
      return point;
    });

    return {
      name: series.name || '',
      type: 'column',
      data: seriesData,
      color: series.color,
      stack: series.stack
    } as Highcharts.SeriesOptionsType;
  });
}
