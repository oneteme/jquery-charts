import { Highcharts } from '../highcharts-modules';
import {
  ORIGINAL_DATA_SYMBOL,
  ORIGINAL_METADATA_SYMBOL,
  trackTransformation,
} from './memory-symbols';

export function isHeatmapChart(chartType: string): boolean {
  return chartType === 'heatmap';
}

// Vérifie si les données sont au format heatmap [x, y, value]
function hasHeatmapFormat(data: any[]): boolean {
  if (!data || data.length === 0) return false;

  return data.some(
    (point: any) =>
      (Array.isArray(point) && point.length >= 3) ||
      (typeof point === 'object' &&
        point !== null &&
        'x' in point &&
        'y' in point &&
        'value' in point)
  );
}

/**
 * Transforme une matrice de données simples en format heatmap [x, y, value]
 * Stratégie : Séries = lignes Y, données = colonnes X
 */
function matrixToHeatmap(
  series: any[],
  categories?: any[]
): { series: any[]; yCategories: string[] } {
  if (!series || series.length === 0) return { series: [], yCategories: [] };

  const heatmapData: any[] = [];
  const yCategories: string[] = [];

  series.forEach((serie, yIndex) => {
    if (!serie.data || serie.data.length === 0) return;

    // Récupérer le nom de la série pour l'axe Y
    yCategories.push(serie.name || `Série ${yIndex + 1}`);

    serie.data.forEach((value: any, xIndex: number) => {
      const numValue =
        typeof value === 'number'
          ? value
          : typeof value === 'object' && value !== null
          ? value.y ?? value.value
          : null;

      if (numValue !== null && numValue !== undefined) {
        heatmapData.push([xIndex, yIndex, numValue]);
      }
    });
  });

  const transformedSerie = {
    name: 'Heatmap',
    data: heatmapData,
    [ORIGINAL_DATA_SYMBOL]: series,
    [ORIGINAL_METADATA_SYMBOL]: { yCategories },
  };

  trackTransformation(transformedSerie, 'standard', 'heatmap', 'matrix');

  return {
    series: [transformedSerie],
    yCategories,
  };
}

/**
 * Transforme des données heatmap en format série standard (inverse)
 * Restaure les séries originales si disponibles
 */
function heatmapToSeries(series: any[]): any[] {
  if (!series || series.length === 0) return series;

  const firstSerie = series[0];

  // Si mémoire disponible, restaurer les données originales
  if (firstSerie[ORIGINAL_DATA_SYMBOL]) {
    return firstSerie[ORIGINAL_DATA_SYMBOL];
  }

  // Sinon, convertir manuellement
  if (!firstSerie.data) return series;

  // Grouper par Y pour recréer les séries
  const seriesByY = new Map<number, any[]>();

  firstSerie.data.forEach((point: any) => {
    const heatPoint = typeof point === 'object' ? point : null;
    if (!heatPoint) return;

    const y = heatPoint.y ?? 0;
    const x = heatPoint.x ?? 0;
    const value = heatPoint.value ?? 0;

    if (!seriesByY.has(y)) {
      seriesByY.set(y, []);
    }
    seriesByY.get(y)!.push({ x, value });
  });

  // Recréer les séries
  const recreatedSeries: any[] = [];
  seriesByY.forEach((points, yIndex) => {
    points.sort((a, b) => a.x - b.x);
    recreatedSeries.push({
      name: `Série ${yIndex + 1}`,
      data: points.map((p) => p.value),
    });
  });

  return recreatedSeries;
}

// Transforme intelligemment les données pour/depuis heatmap
export function transformDataForHeatmap(
  series: any[],
  targetIsHeatmap: boolean,
  categories?: any[]
): { series: any[]; yCategories?: string[] } {
  if (!series || series.length === 0) return { series };

  const hasHeatmap = series.some((serie) => hasHeatmapFormat(serie.data));

  // Cas 1 : On veut du heatmap
  if (targetIsHeatmap) {
    if (hasHeatmap) {
      return { series }; // Déjà au bon format
    }
    return matrixToHeatmap(series, categories);
  }

  // Cas 2 : On veut des séries normales
  if (hasHeatmap) {
    return { series: heatmapToSeries(series) };
  }

  return { series };
}

// Configure les options par défaut pour heatmap
export function configureHeatmapChart(
  options: Highcharts.Options,
  chartType: string
): void {
  if (!isHeatmapChart(chartType)) {
    return;
  }

  if (!options.plotOptions) {
    options.plotOptions = {};
  }

  (options.plotOptions as any).heatmap = {
    ...(options.plotOptions as any).heatmap,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    dataLabels: {
      enabled: true,
      color: '#000000',
    },
  };

  // Configuration de la colorAxis pour heatmap
  if (!options.colorAxis) {
    options.colorAxis = {
      min: 0,
      minColor: '#FFFFFF',
      maxColor: (Highcharts as any).getOptions().colors[0],
    } as any;
  }

  // Tooltip standard
  if (!options.tooltip) {
    options.tooltip = {};
  }
}

// Force les configurations critiques pour heatmap après le merge
export function enforceCriticalHeatmapOptions(
  options: Highcharts.Options,
  chartType: string
): void {
  if (!isHeatmapChart(chartType)) {
    return;
  }

  // S'assurer que colorAxis existe
  if (!options.colorAxis) {
    options.colorAxis = {
      min: 0,
      minColor: '#FFFFFF',
      maxColor: (Highcharts as any).getOptions().colors[0],
    } as any;
  }
}
