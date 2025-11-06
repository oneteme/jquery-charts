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
        type: 'x',
        autoScaleYaxis: true,
        allowMouseWheelZoom: true,
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

  const userSetHorizontal =
    config?.options?.plotOptions?.bar?.horizontal !== undefined;

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
  updateSyncedCharts: boolean = false,
  chartElement?: HTMLElement
): Promise<void> {
  if (!chartInstance) return Promise.resolve();

  return ngZone.runOutsideAngular(() =>
    chartInstance
      .updateOptions({ ...options }, redrawPaths, animate, updateSyncedCharts)
      .then(() => {
        if (chartElement) fixToolbarSvgIds(chartElement);
      })
      .catch((error) => {
        console.error('Erreur lors de la mise à jour des options:', error);
        return Promise.resolve();
      })
  );
}

export function transformSeriesVisibility(series: any[]): any[] {
  return series.map((serie) => {
    if (serie.visible !== undefined) {
      const { visible, ...serieWithoutVisible } = serie;
      return {
        ...serieWithoutVisible,
        hidden: visible === false,
      };
    }
    return { ...serie, hidden: false };
  });
}

export function setupScrollPrevention(
  chartElement: HTMLElement,
  chartInstance: () => ApexCharts | null
): void {
  if (!chartElement) return;

  let isMouseOverChart = false;

  chartElement.addEventListener('mouseenter', () => (isMouseOverChart = true));
  chartElement.addEventListener('mouseleave', () => (isMouseOverChart = false));

  const handleWheel = (e: WheelEvent) => {
    const chart = chartInstance();
    const chartConfig = (chart as any)?.w?.config?.chart?.zoom?.enabled;
    if (isMouseOverChart && chartConfig) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  chartElement.addEventListener('wheel', handleWheel, { passive: false });
}

// Corrige les IDs dupliqués dans les SVG de la toolbar pour éviter les conflits
export function fixToolbarSvgIds(chartElement: HTMLElement): void {
  if (!chartElement) return;

  const toolbar = chartElement.querySelector('.apexcharts-toolbar');
  if (!toolbar) return;

  const uniqueId = `toolbar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const svgs = toolbar.querySelectorAll('svg');

  svgs.forEach((svg, svgIndex) => {
    const idMap = new Map<string, string>();
    const elementsWithId = svg.querySelectorAll('[id]');
    elementsWithId.forEach((element) => {
      const oldId = element.getAttribute('id');
      if (oldId) {
        const newId = `${uniqueId}-svg${svgIndex}-${oldId}`;
        idMap.set(oldId, newId);
      }
    });

    elementsWithId.forEach((element) => {
      const oldId = element.getAttribute('id');
      if (oldId) {
        const newId = idMap.get(oldId);
        if (newId) {
          element.setAttribute('id', newId);
        }
      }
    });

    const allElements = svg.querySelectorAll('*');
    allElements.forEach((element) => {
      const href = element.getAttribute('href');
      if (href && href.startsWith('#')) {
        const oldId = href.substring(1);
        const newId = idMap.get(oldId);
        if (newId) { element.setAttribute('href', `#${newId}`) }
      }

      const xlinkHref = element.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
      if (xlinkHref && xlinkHref.startsWith('#')) {
        const oldId = xlinkHref.substring(1);
        const newId = idMap.get(oldId);
        if (newId) {
          element.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#${newId}`);
        }
      }

      const clipPath = element.getAttribute('clip-path');
      if (clipPath) {
        let updated = clipPath;
        idMap.forEach((newId, oldId) => {
          updated = updated.replace(`url(#${oldId})`, `url(#${newId})`);
        });
        if (updated !== clipPath) {
          element.setAttribute('clip-path', updated);
        }
      }

      const fill = element.getAttribute('fill');
      if (fill && fill.includes('url(#')) {
        let updated = fill;
        idMap.forEach((newId, oldId) => {
          updated = updated.replace(`url(#${oldId})`, `url(#${newId})`);
        });
        if (updated !== fill) {
          element.setAttribute('fill', updated);
        }
      }

      const mask = element.getAttribute('mask');
      if (mask && mask.includes('url(#')) {
        let updated = mask;
        idMap.forEach((newId, oldId) => {
          updated = updated.replace(`url(#${oldId})`, `url(#${newId})`);
        });
        if (updated !== mask) {
          element.setAttribute('mask', updated);
        }
      }
    });
  });
}

/**
 * Configure un observateur pour surveiller les changements de la toolbar et corriger les IDs
 */
export function setupToolbarObserver(chartElement: HTMLElement): MutationObserver | null {
  if (!chartElement) return null;

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        const toolbar = chartElement.querySelector('.apexcharts-toolbar');
        if (toolbar) {
          fixToolbarSvgIds(chartElement);
          break;
        }
      }
    }
  });

  // Observer le conteneur du graphique pour détecter les modifications de la toolbar
  observer.observe(chartElement, {
    childList: true,
    subtree: true,
    attributes: false
  });

  return observer;
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
