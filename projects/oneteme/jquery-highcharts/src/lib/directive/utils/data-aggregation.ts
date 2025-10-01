import { ChartProvider, XaxisType, YaxisType } from '@oneteme/jquery-core';

/**
 * Agrège les données multi-séries pour les graphiques de type pie/donut
 * Chaque série devient une part du pie avec la somme totale de ses valeurs
 */
export function aggregateMultiSeriesForPie(
  series: any[],
  categories: string[] | undefined
): any[] {
  if (!series || series.length === 0) {
    return [];
  }

  // Si une seule série, retourner les données telles quelles
  if (series.length === 1) {
    return series[0]?.data || [];
  }

  // Agréger les données : pour chaque série, calculer la somme totale de toutes ses valeurs
  const aggregatedData = series.map(serie => {
    if (!serie.data || serie.data.length === 0) {
      return {
        name: serie.name || 'Série',
        y: 0
      };
    }

    // Calculer la somme de toutes les valeurs de cette série
    const sum = serie.data.reduce((total: number, dataPoint: any) => {
      const value = typeof dataPoint === 'object' 
        ? (dataPoint.y !== undefined ? dataPoint.y : dataPoint) 
        : dataPoint;
      return total + (value || 0);
    }, 0);

    return {
      name: serie.name || 'Série',
      y: sum
    };
  });

  return aggregatedData;
}

/**
 * Détermine si les données nécessitent une agrégation pour un graphique pie/donut
 */
export function shouldAggregateForPie(
  series: any[],
  categories: string[] | undefined
): boolean {
  // Si on a plusieurs séries, il faut agréger (on ne vérifie plus les catégories)
  return !!(series && series.length > 1);
}

/**
 * Transforme les données multi-séries pour les graphiques simples (pie, donut, funnel, pyramid)
 * en agrégeant les valeurs si nécessaire.
 * Chaque série multi-séries devient une part du graphique avec la somme totale de ses valeurs.
 */
export function transformDataForSimpleChart<X extends XaxisType, Y extends YaxisType>(
  chartData: { series: any[]; xAxis?: any },
  config: ChartProvider<X, Y>
): any[] {
  const { series, xAxis } = chartData;
  const categories = xAxis?.categories;

  // Vérifier si on doit agréger les données
  if (shouldAggregateForPie(series, categories)) {
    return aggregateMultiSeriesForPie(series, categories);
  }

  // Sinon, retourner les données de la première série
  return series[0]?.data || [];
}
