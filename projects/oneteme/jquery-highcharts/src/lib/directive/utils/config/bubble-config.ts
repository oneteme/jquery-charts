import { Highcharts } from '../highcharts-modules';
import { ORIGINAL_DATA_SYMBOL, trackTransformation } from './memory-symbols';
import { validateAndCleanData } from './data-validation';

export function isBubbleChart(chartType: string): boolean {
  return chartType === 'bubble';
}

// format bubble [x, y, z]
function hasBubbleFormat(data: any[]): boolean {
  if (!data || data.length === 0) return false;

  return data.some(
    (point: any) =>
      (Array.isArray(point) && point.length >= 3) ||
      (typeof point === 'object' && point !== null && 'z' in point)
  );
}

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

function transformToBubble(
  series: any[],
  mode: 'global' | 'per-series' = 'global'
): any[] {
  if (!series || series.length === 0) return series;

  if (mode === 'per-series') {
    // Calculer z indépendamment pour chaque série
    return series.map((serie) => {
      if (!serie.data) return serie;

      const yValues = serie.data
        .map((p: any) => extractValues(p).y)
        .filter((y: number | null): y is number => y !== null);

      if (yValues.length === 0) return serie;

      const minY = Math.min(...yValues);
      const maxY = Math.max(...yValues);
      const range = maxY - minY || 1;

      const originalData = [...serie.data];

      const bubbleData = serie.data.map((point: any) => {
        const { x, y, z } = extractValues(point);

        if (z !== null && z !== undefined) return point;
        if (y === null) return point;

        const absY = Math.abs(y);
        const normalized = (absY - minY) / range;
        const logScaled = Math.log10(1 + normalized * 9);
        const calculatedZ = Math.max(1, logScaled * 20);

        if (Array.isArray(point)) {
          return [x, y, calculatedZ];
        }
        return { ...point, z: calculatedZ, name: point.name || point.x };
      });

      const transformedSerie = {
        ...serie,
        data: bubbleData,
        [ORIGINAL_DATA_SYMBOL]: originalData,
      };

      trackTransformation(
        transformedSerie,
        'standard',
        'bubble',
        'calculZ-per-series'
      );

      return transformedSerie;
    });
  }

  // Mode global (comportement par défaut)
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

      const absY = Math.abs(y);
      const normalized = (absY - minY) / range;
      const logScaled = Math.log10(1 + normalized * 9);
      const calculatedZ = Math.max(1, logScaled * 20);

      if (Array.isArray(point)) {
        return [x, y, calculatedZ];
      }
      return { ...point, z: calculatedZ, name: point.name || point.x };
    });

    const transformedSerie = {
      ...serie,
      data: bubbleData,
      [ORIGINAL_DATA_SYMBOL]: originalData,
    };

    // Enregistrer la transformation
    trackTransformation(
      transformedSerie,
      'standard',
      'bubble',
      'calculZ-global'
    );

    return transformedSerie;
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

export function transformDataForBubble(
  series: any[],
  targetIsBubble: boolean
): any[] {
  if (!series || series.length === 0) return series;

  // Validation et nettoyage des données
  series = validateAndCleanData(series);
  if (series.length === 0) return series;

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

// Configure les options par défaut pour les graphiques bubble
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

  (options.plotOptions as any).bubble = {
    ...(options.plotOptions as any).bubble,
    minSize: 3,
    maxSize: 20,
    dataLabels: {
      enabled: false,
    },
  };

  if (!options.tooltip) {
    options.tooltip = {};
  }

  (options.tooltip as any).pointFormatter = function (this: any) {
    return `Valeur: <b>${this.y}</b>`;
  };
}

// Force les configurations critiques pour bubble après le merge
export function enforceCriticalBubbleOptions(
  options: Highcharts.Options,
  chartType: string
): void {
  if (!isBubbleChart(chartType)) {
    return;
  }
  if (!options.plotOptions) {
    options.plotOptions = {};
  }
  if (!(options.plotOptions as any).bubble) {
    (options.plotOptions as any).bubble = {};
  }
  if (!(options.plotOptions as any).bubble.marker) {
    (options.plotOptions as any).bubble.marker = {};
  }
  (options.plotOptions as any).bubble.marker.enabled = true;
  (options.plotOptions as any).bubble.lineWidth = 0;

  if ((options.plotOptions as any).bubble.minSize === undefined) {
    (options.plotOptions as any).bubble.minSize = 3;
  }
  if ((options.plotOptions as any).bubble.maxSize === undefined) {
    (options.plotOptions as any).bubble.maxSize = 20;
  }
}
