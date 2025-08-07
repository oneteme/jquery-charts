import { CommonChart, Coordinate2D, XaxisType, YaxisType, ChartProvider, mergeDeep } from '@oneteme/jquery-core';
import { ICONS } from '../../assets/icons/icons';
import { ElementRef, EventEmitter, NgZone } from '@angular/core';
import ApexCharts from 'apexcharts';

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
      class: 'custom-icon',
      click: function (chart, options, e) {
        event('previous');
      },
    },
    {
      icon: ICONS.next,
      title: 'Graphique suivant',
      class: 'custom-icon',
      click: function (chart, options, e) {
        event('next');
      },
    },
  ];

  if (canPivot) {
    customIcons.push({
      icon: ICONS.pivot,
      title: 'Pivot',
      class: 'custom-icon',
      click: function (chart, options, e) {
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
    return 'numeric';
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
      const categ = commonChart.categories[0];
      return determineXAxisDataType(categ);
    }
  }
  return 'datetime';
}

/**
 * Initialise les options de base communes à tous les graphiques
 */
export function initCommonChartOptions(
  node: ElementRef,
  customEvent: EventEmitter<ChartCustomEvent>,
  ngZone: NgZone,
  chartType: string,
  canPivot: boolean = true
) {
  return {
    shouldRedraw: true,
    chart: {
      type: chartType,
      toolbar: {
        show: false,
        tools: {
          download: false,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false,
          customIcons: customIcons((arg) => {
            ngZone.run(() => customEvent.emit(arg));
          }, canPivot),
        },
      },
      events: {
        mouseMove: function () {
          let toolbar = node.nativeElement.querySelector('.apexcharts-toolbar');
          if (toolbar) toolbar.style.visibility = 'visible';
        },
        mouseLeave: function () {
          let toolbar = node.nativeElement.querySelector('.apexcharts-toolbar');
          if (toolbar) toolbar.style.visibility = 'hidden';
        },
      },
      zoom: {
        enabled: false,
      },
    },
    series: [],
    noData: {
      text: 'Aucune donnée',
    },
    xaxis: {},
    plotOptions: {},
  };
}

/**
 * Met à jour les options communes du graphique en fonction de la configuration fournie
 */
export function updateCommonOptions<X extends XaxisType, Y extends YaxisType>(
  options: any,
  config: ChartProvider<X, Y>
) {
  options ??= {};

const existingBarHorizontal = options?.plotOptions?.bar?.horizontal;
  const updatedOptions = mergeDeep(
    options,
    {
      chart: {
        height: config?.height ?? '100%',
        width: config?.width ?? '100%',
        stacked: config?.stacked,
        toolbar: {
          show: config?.showToolbar ?? false,
        },
      },
      title: {
        text: config?.title,
      },
      subtitle: {
        text: config?.subtitle,
      },
      xaxis: {
        title: {
          text: config?.xtitle,
        },
      },
      yaxis: {
        title: {
          text: config?.ytitle,
        },
      },
    },
    config?.options ?? {}
  );

  const userSetHorizontal = config?.options?.plotOptions?.bar?.horizontal !== undefined;

  if (existingBarHorizontal !== undefined && !userSetHorizontal) {
    updatedOptions.plotOptions ??= {};
    updatedOptions.plotOptions.bar ??= {};
    updatedOptions.plotOptions.bar.horizontal = existingBarHorizontal;
  }

  return updatedOptions;
}

/**
 * Met à jour les options du graphique de manière sécurisée
 */
export function updateChartOptions(
  chartInstance: ApexCharts | null,
  ngZone: NgZone,
  options: any,
  redrawPaths: boolean = true,
  animate: boolean = true,
  updateSyncedCharts: boolean = false
): Promise<void> {
  if (!chartInstance) return Promise.resolve();

  return ngZone.runOutsideAngular(() =>
    chartInstance.updateOptions(
      { ...options },
      redrawPaths,
      animate,
      updateSyncedCharts
    ).catch(error => {
      console.error('Erreur lors de la mise à jour des options:', error);
      return Promise.resolve();
    })
  );
}

/**
 * Fonction commune pour la destruction propre des graphiques
 */
export function destroyChart(chartInstance: any): void {
  if (chartInstance()) {
    chartInstance().destroy();
    chartInstance.set(null);
  }
}
