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
      const categ = commonChart.categories[0];
      return determineXAxisDataType(categ);
    }
  }
  return 'datetime';
}

/**
 * Gère l'événement mousemove sur le conteneur du graphique
 */
function handleMouseMove(container: HTMLElement): void {
  container.style.visibility = 'visible';
}

/**
 * Gère l'événement mouseleave sur le conteneur du graphique
 */
function handleMouseLeave(container: HTMLElement): void {
  container.style.visibility = 'hidden';
}

/**
 * Configure la barre d'outils personnalisée pour le graphique
 */
function setupCustomToolbar(
  node: ElementRef,
  customEvent: EventEmitter<ChartCustomEvent>,
  ngZone: NgZone,
  canPivot: boolean
): void {
  const container = document.createElement('div');
  container.className = 'highcharts-custom-toolbar';
  container.style.position = 'absolute';
  container.style.zIndex = '10';
  container.style.right = '10px';
  container.style.top = '10px';
  container.style.visibility = 'hidden';

  const buttons = customIcons((arg) => {
    ngZone.run(() => customEvent.emit(arg));
  }, canPivot);

  buttons.forEach(button => {
    const buttonEl = document.createElement('button');
    buttonEl.innerHTML = button.icon;
    buttonEl.title = button.title;
    buttonEl.className = button.className;
    buttonEl.addEventListener('click', () => button.onclick());
    container.appendChild(buttonEl);
  });

  const chartContainer = node.nativeElement.querySelector('.highcharts-container');
  if (chartContainer) {
    chartContainer.appendChild(container);
    chartContainer.addEventListener('mousemove', () => handleMouseMove(container));
    chartContainer.addEventListener('mouseleave', () => handleMouseLeave(container));
  }
}

/**
 * Initialise les options de base communes à tous les graphiques Highcharts
 */
export function initCommonChartOptions(
  node: ElementRef,
  customEvent: EventEmitter<ChartCustomEvent>,
  ngZone: NgZone,
  chartType: string,
  canPivot: boolean = true
): Highcharts.Options {
  return {
    chart: {
      type: mapChartType(chartType) as any,
      events: {
        load: function () {
          ngZone.run(() => {
            setTimeout(() => setupCustomToolbar(node, customEvent, ngZone, canPivot), 100);
          });
        }
      }
    },
    title: {
      text: undefined
    },
    credits: {
      enabled: false
    },
    series: [],
    legend: {
      enabled: true
    },
    xAxis: {
      type: 'category'
    },
    yAxis: {
      title: {
        text: ''
      }
    },
    plotOptions: {},
    lang: {
      noData: 'Aucune donnée'
    },
    noData: {
      style: {
        fontSize: '14px',
        color: '#666'
      },
      position: {
        verticalAlign: 'middle'
      }
    } as any
  };
}

/**
 * Met à jour les options communes du graphique en fonction de la configuration fournie
 */
export function updateCommonOptions<X extends XaxisType, Y extends YaxisType>(
  options: Highcharts.Options,
  config: ChartProvider<X, Y>
): Highcharts.Options {
  const existingBarHorizontal = (options?.plotOptions as any)?.bar?.horizontal;

  const updatedOptions = mergeDeep(
    options,
    {
      chart: {
        height: config.height ?? '100%',
        width: config.width ?? '100%',
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
    },
    config.options || {}
  );

  // Gestion spécifique des graphiques horizontaux
  const userSetHorizontal = config.options?.plotOptions?.bar?.horizontal !== undefined;

  if (existingBarHorizontal !== undefined && !userSetHorizontal) {
    if (!updatedOptions.plotOptions) updatedOptions.plotOptions = {};
    if (!updatedOptions.plotOptions.bar) updatedOptions.plotOptions.bar = {};
    updatedOptions.plotOptions.bar.horizontal = existingBarHorizontal;
  }

  return updatedOptions;
}

/**
 * Met à jour les options du graphique Highcharts
 */
export function updateChartOptions(
  chartInstance: Highcharts.Chart | null,
  ngZone: NgZone,
  options: any,
  redrawPaths: boolean = true,
  animate: boolean = true,
  updateSyncedCharts: boolean = false
): Promise<void> {
  if (!chartInstance) return Promise.resolve();

  return ngZone.runOutsideAngular(() => {
    try {
      // Mise à jour des séries si nécessaire
      if (options.series) {
        // Supprimer les séries existantes
        while (chartInstance.series.length > 0) {
          chartInstance.series[0].remove(false);
        }

        // Ajouter les nouvelles séries
        options.series.forEach((serie: any) => {
          chartInstance.addSeries(serie, false);
        });
      }

      // Mise à jour des options générales du graphique
      chartInstance.update(options, animate, redrawPaths);
      return Promise.resolve();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des options:', error);
      return Promise.resolve();
    }
  });
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

/**
 * Convertit le format de données CommonChart vers le format Highcharts
 */
export function convertToHighchartsSeries<X extends XaxisType, Y extends YaxisType>(
  commonChart: CommonChart<X, Y>
): any[] {
  if (!commonChart.series?.length) {
    return [];
  }

  return commonChart.series.map(series => {
    const result: any = {
      name: series.name || '',
      type: mapChartType((series as any).type),
      color: series.color
    };

    // Format de données continue avec {x, y}
    if (commonChart.continue) {
      result.data = series.data.map(point => {
        // Si le point a des coordonnées x et y
        const pointObj = point as unknown as { x: X; y: Y };
        if ('x' in pointObj && 'y' in pointObj) {
          return [pointObj.x, pointObj.y];
        }
        return point;
      });
    }
    // Format avec catégories séparées
    else {
      result.data = series.data;
    }

    // Gestion du stacking
    if (series.stack) {
      result.stack = series.stack;
    }

    return result;
  });
}

/**
 * Convertit les types de graphiques entre notre API et Highcharts
 */
function mapChartType(type: string | undefined): string {
  if (!type) return 'line';

  switch (type) {
    case 'bar': return 'bar';
    case 'column': return 'column';
    case 'line': return 'line';
    case 'area': return 'area';
    case 'pie': return 'pie';
    case 'donut': return 'pie'; // Highcharts utilise innerSize pour donut
    case 'polar': return 'line'; // Nécessite une configuration spéciale
    case 'radar': return 'line'; // Nécessite une configuration spéciale
    case 'radial': return 'line'; // Nécessite une configuration spéciale
    case 'treemap': return 'treemap';
    case 'heatmap': return 'heatmap';
    case 'rangeBar': return 'columnrange';
    case 'rangeArea': return 'arearange';
    case 'rangeColumn': return 'columnrange';
    case 'funnel': return 'funnel';
    case 'pyramid': return 'pyramid';
    default: return 'line';
  }
}

/**
 * Applique les configurations spécifiques selon le type de graphique
 */
function applySpecificChartOptions(
  options: Highcharts.Options,
  type: string,
  chartType: string
): void {
  switch (type) {
    case 'donut':
      if (!options.plotOptions) options.plotOptions = {};
      if (!(options.plotOptions as any).pie) (options.plotOptions as any).pie = {};
      (options.plotOptions as any).pie.innerSize = '50%';
      break;

    case 'polar':
    case 'radar':
      if (!options.chart) options.chart = {};
      options.chart.polar = true;
      break;

    case 'funnel':
    case 'pyramid':
      if (!options.plotOptions) options.plotOptions = {};
      if (!(options.plotOptions as any)[chartType]) (options.plotOptions as any)[chartType] = {};
      break;

    case 'bar':
      if (!options.plotOptions) options.plotOptions = {};
      if (!(options.plotOptions as any).bar) (options.plotOptions as any).bar = {};
      (options.plotOptions as any).bar.horizontal = true;
      break;
  }
}

/**
 * Configure les options spécifiques selon le type de graphique
 */
export function configureChartTypeOptions(
  options: Highcharts.Options,
  type: string
): void {
  const chartType = mapChartType(type);

  if (options.chart) {
    options.chart.type = chartType as any;
  }

  // Applique les configurations spécifiques
  applySpecificChartOptions(options, type, chartType);
}
