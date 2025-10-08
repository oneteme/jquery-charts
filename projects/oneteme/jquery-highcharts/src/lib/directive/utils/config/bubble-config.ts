import { Highcharts } from '../highcharts-modules';

/** Symbole pour stocker les données originales */
const ORIGINAL_DATA_SYMBOL = Symbol('originalBubbleData');

/** Détermine si un type de graphique est bubble */
export function isBubbleChart(chartType: string): boolean {
  return chartType === 'bubble';
}

/** Vérifie si les données sont au format bubble [x, y, z] */
function hasBubbleFormat(data: any[]): boolean {
  if (!data || data.length === 0) return false;

  return data.some(
    (point: any) =>
      (Array.isArray(point) && point.length >= 3) ||
      (typeof point === 'object' && point !== null && 'z' in point)
  );
}

/** Extrait les valeurs d'un point de données */
function extractValues(point: any): {
  x: any;
  y: number | null;
  z?: number | null;
} {
  if (Array.isArray(point)) {
    return { x: point[0], y: point[1] ?? null, z: point[2] ?? null };
  }
  if (typeof point === 'object' && point !== null) {
    return { x: point.x, y: point.y ?? null, z: point.z ?? null };
  }
  return { x: null, y: null };
}

/**
 * TRANSFORMATION : Données [x, y] → [x, y, z]
 * Stratégie : Calculer z basé sur la valeur y de manière proportionnelle et raisonnable
 */
function transformToBubble(series: any[]): any[] {
  if (!series || series.length === 0) return series;

  // Collecter toutes les valeurs Y pour calculer l'échelle
  const allYValues: number[] = [];
  series.forEach((serie) => {
    if (serie.data) {
      serie.data.forEach((point: any) => {
        const { y } = extractValues(point);
        if (y !== null) allYValues.push(Math.abs(y));
      });
    }
  });

  if (allYValues.length === 0) return series;

  const minY = Math.min(...allYValues);
  const maxY = Math.max(...allYValues);
  const range = maxY - minY || 1;

  return series.map((serie) => {
    if (!serie.data) return serie;

    // Sauvegarder les données originales
    const originalData = [...serie.data];

    const bubbleData = serie.data.map((point: any) => {
      const { x, y, z } = extractValues(point);

      // Si déjà format bubble, garder tel quel
      if (z !== null && z !== undefined) {
        return point;
      }

      if (y === null) return point;

      // Calculer z de manière plus subtile
      // Normaliser entre 0 et 1, puis appliquer une racine carrée pour adoucir les différences
      const normalized = (Math.abs(y) - minY) / range;
      const smoothed = Math.sqrt(normalized); // Racine carrée pour réduire l'écart visuel
      const calculatedZ = Math.max(1, smoothed * 50); // Taille entre 1 et 50 (plus raisonnable)

      if (Array.isArray(point)) {
        return [x, y, calculatedZ];
      }
      return { ...point, z: calculatedZ };
    });

    return {
      ...serie,
      data: bubbleData,
      [ORIGINAL_DATA_SYMBOL]: originalData,
    };
  });
}

/**
 * TRANSFORMATION INVERSE : Données [x, y, z] → [x, y]
 * Utilise les données originales si disponibles (mémoire)
 */
function transformFromBubble(series: any[]): any[] {
  if (!series || series.length === 0) return series;

  return series.map((serie) => {
    // Si on a des données originales sauvegardées, les réutiliser
    if (serie[ORIGINAL_DATA_SYMBOL]) {
      return {
        ...serie,
        data: serie[ORIGINAL_DATA_SYMBOL],
      };
    }

    // Sinon, simplement retirer z
    if (!serie.data) return serie;

    const standardData = serie.data.map((point: any) => {
      if (Array.isArray(point) && point.length >= 3) {
        return [point[0], point[1]]; // Garder seulement x, y
      }
      if (typeof point === 'object' && point !== null && 'z' in point) {
        const { z, ...rest } = point;
        return rest;
      }
      return point;
    });

    return {
      ...serie,
      data: standardData,
    };
  });
}

/**
 * Transforme intelligemment les données pour bubble (bidirectionnel)
 * @param series - Les séries de données
 * @param targetIsBubble - true = transformer vers bubble, false = transformer depuis bubble
 */
export function transformDataForBubble(
  series: any[],
  targetIsBubble: boolean
): any[] {
  if (!series || series.length === 0) return series;

  const alreadyBubble = series.some((serie) => hasBubbleFormat(serie.data));

  if (targetIsBubble) {
    // Transformation vers bubble
    if (alreadyBubble) {
      return series; // Déjà au bon format
    }
    return transformToBubble(series);
  } else {
    // Transformation depuis bubble
    if (!alreadyBubble) {
      return series; // Pas au format bubble, rien à faire
    }
    return transformFromBubble(series);
  }
}

/** Configure les options par défaut pour les graphiques bubble */
export function configureBubbleChart(
  options: Highcharts.Options,
  chartType: string
): void {
  if (!isBubbleChart(chartType)) {
    return;
  }

  if (!options.plotOptions) {
    options.plotOptions = {};
  }

  // Configuration minimale - laisser Highcharts gérer le reste
  (options.plotOptions as any).bubble = {
    ...(options.plotOptions as any).bubble,
    minSize: 5,
    maxSize: 50,
    dataLabels: {
      enabled: false,
    },
  };
}

/** Force les configurations critiques pour bubble après le merge */
export function enforceCriticalBubbleOptions(
  options: Highcharts.Options,
  chartType: string
): void {
  if (!isBubbleChart(chartType)) {
    return;
  }

  // Pas de configuration critique forcée - laisser l'utilisateur personnaliser
}
