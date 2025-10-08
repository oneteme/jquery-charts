import { Highcharts } from '../highcharts-modules';

/** Détermine si un type de graphique est un range chart */
export function isRangeChart(chartType: string): boolean {
  return ['columnrange', 'arearange', 'areasplinerange'].includes(chartType);
}

/** Vérifie si les données sont au format range [x, low, high] ou {x, low, high} */
function hasRangeFormat(data: any[]): boolean {
  if (!data || data.length === 0) return false;

  return data.some(
    (point: any) =>
      (Array.isArray(point) && point.length >= 3) ||
      (typeof point === 'object' &&
        point !== null &&
        ('low' in point || 'high' in point))
  );
}

/** Vérifie si les données sont au format simple [x, y] ou {x, y} */
function hasSimpleFormat(data: any[]): boolean {
  if (!data || data.length === 0) return false;

  return data.some(
    (point: any) =>
      (Array.isArray(point) && point.length === 2) ||
      (typeof point === 'object' &&
        point !== null &&
        'y' in point &&
        !('low' in point) &&
        !('high' in point))
  );
}

/** Extrait la valeur numérique d'un point de données */
function extractValue(point: any): number | null {
  if (point === null || point === undefined) return null;
  if (typeof point === 'number') return point;
  if (Array.isArray(point)) return point[1] ?? null;
  if (typeof point === 'object') return point.y ?? null;
  return null;
}

/** Extrait la valeur X d'un point de données */
function extractXValue(point: any, index: number): any {
  if (Array.isArray(point)) return point[0] ?? index;
  if (typeof point === 'object' && point !== null) return point.x ?? index;
  return index;
}

/** Extrait les valeurs low et high d'un point range */
function extractRangeValues(point: any): { low: number; high: number } | null {
  if (Array.isArray(point) && point.length >= 3) {
    return { low: point[1], high: point[2] };
  }
  if (
    typeof point === 'object' &&
    point !== null &&
    'low' in point &&
    'high' in point
  ) {
    return { low: point.low, high: point.high };
  }
  return null;
}

/**
 * TRANSFORMATION RANGE → SIMPLE
 * Convertit des données range en données simples (moyenne de low et high)
 */
function transformRangeToSimple(series: any[]): any[] {
  return series.map((serie) => {
    if (!serie.data || !hasRangeFormat(serie.data)) return serie;

    const simpleData = serie.data.map((point: any, index: number) => {
      const rangeValues = extractRangeValues(point);
      if (!rangeValues) return point;

      const xValue = extractXValue(point, index);
      const yValue = (rangeValues.low + rangeValues.high) / 2; // Moyenne

      if (Array.isArray(point)) {
        return [xValue, yValue];
      }
      return {
        x: xValue,
        y: yValue,
        name: (point as any).name,
        color: (point as any).color,
      };
    });

    // Stocker les données originales dans une propriété cachée
    return {
      ...serie,
      data: simpleData,
      _originalRangeData: serie.data, // Mémoire des données range
    };
  });
}

/**
 * STRATÉGIE 1 : Groupe les points consécutifs 2 par 2
 */
function singleSeriesByPairs(serie: any): any {
  if (!serie.data || serie.data.length < 2) return serie;

  const rangeData: any[] = [];

  for (let i = 0; i < serie.data.length - 1; i += 2) {
    const point1 = serie.data[i];
    const point2 = serie.data[i + 1];

    const val1 = extractValue(point1);
    const val2 = extractValue(point2);

    if (val1 !== null && val2 !== null) {
      const xValue = extractXValue(point1, i);
      rangeData.push({
        x: xValue,
        low: Math.min(val1, val2),
        high: Math.max(val1, val2),
      });
    }
  }

  return {
    ...serie,
    data: rangeData,
    _originalSimpleData: serie.data, // Mémoire des données simples
  };
}

/**
 * STRATÉGIE 2 : Groupe les points par N consécutifs (défaut: 3)
 */
function singleSeriesByGroups(serie: any, groupSize: number = 3): any {
  if (!serie.data || serie.data.length < groupSize) return serie;

  const rangeData: any[] = [];

  for (let i = 0; i < serie.data.length; i += groupSize) {
    const group = serie.data.slice(i, i + groupSize);
    const values = group
      .map(extractValue)
      .filter((v: number | null): v is number => v !== null);

    if (values.length > 0) {
      const xValue = extractXValue(group[0], i);
      rangeData.push({
        x: xValue,
        low: Math.min(...values),
        high: Math.max(...values),
      });
    }
  }

  return {
    ...serie,
    data: rangeData,
    _originalSimpleData: serie.data, // Mémoire des données simples
  };
}

/**
 * STRATÉGIE 3 : Pour chaque position X, prend le min/max entre toutes les séries
 */
function multipleSeriesMinMax(series: any[]): any[] {
  if (!series || series.length === 0) return series;

  const firstSerie = series[0];
  if (!firstSerie.data || firstSerie.data.length === 0) return series;

  const dataLength = firstSerie.data.length;
  const rangeData: any[] = [];

  for (let i = 0; i < dataLength; i++) {
    const valuesAtIndex: number[] = [];
    let xValue: any = i;

    series.forEach((serie) => {
      if (serie.data && serie.data[i] !== undefined) {
        const value = extractValue(serie.data[i]);
        if (value !== null) {
          valuesAtIndex.push(value);
        }
        xValue = extractXValue(serie.data[i], i);
      }
    });

    if (valuesAtIndex.length > 0) {
      rangeData.push({
        x: xValue,
        low: Math.min(...valuesAtIndex),
        high: Math.max(...valuesAtIndex),
      });
    }
  }

  return [
    {
      name: 'Plage (min-max)',
      data: rangeData,
      _originalSeries: series, // Mémoire des séries originales
    },
  ];
}

/**
 * STRATÉGIE 4 : Groupe par valeur X (pour données avec x dupliqués)
 */
function groupByXValue(series: any[]): any[] {
  const groupedByX = new Map<any, number[]>();

  series.forEach((serie) => {
    if (!serie.data) return;

    serie.data.forEach((point: any, index: number) => {
      const xValue = extractXValue(point, index);
      const yValue = extractValue(point);

      if (yValue !== null) {
        if (!groupedByX.has(xValue)) {
          groupedByX.set(xValue, []);
        }
        groupedByX.get(xValue)!.push(yValue);
      }
    });
  });

  const rangeData: any[] = [];
  groupedByX.forEach((values, xValue) => {
    rangeData.push({
      x: xValue,
      low: Math.min(...values),
      high: Math.max(...values),
    });
  });

  rangeData.sort((a, b) => {
    if (typeof a.x === 'number' && typeof b.x === 'number') {
      return a.x - b.x;
    }
    return 0;
  });

  return [
    {
      name: 'Plage groupée',
      data: rangeData,
      _originalSeries: series, // Mémoire des séries originales
    },
  ];
}

/**
 * MODE AUTOMATIQUE : Détecte la structure et applique la meilleure transformation
 */
function autoTransform(series: any[]): any[] {
  if (!series || series.length === 0) return series;

  // Cas 1 : Plusieurs séries → Min/Max entre séries
  if (series.length > 1) {
    const allXValues: any[] = [];
    series.forEach((serie) => {
      if (serie.data) {
        serie.data.forEach((point: any, index: number) => {
          allXValues.push(extractXValue(point, index));
        });
      }
    });

    const uniqueX = new Set(allXValues);
    const hasDuplicateX = uniqueX.size < allXValues.length;

    if (hasDuplicateX) {
      return groupByXValue(series);
    } else {
      return multipleSeriesMinMax(series);
    }
  }

  // Cas 2 : Une seule série
  if (series.length === 1) {
    const serie = series[0];
    const dataLength = serie.data?.length || 0;

    if (dataLength % 2 === 0 && dataLength >= 2) {
      return [singleSeriesByPairs(serie)];
    }

    if (dataLength >= 3) {
      return [singleSeriesByGroups(serie, 3)];
    }
  }

  return series;
}

/**
 * Transforme intelligemment les données entre format simple et range
 * - Range → Simple : Moyenne de low et high
 * - Simple → Range : Utilise le mode automatique
 * - Mémoire : Conserve les données originales pour revenir en arrière
 */
export function transformDataForRangeChart(
  series: any[],
  targetIsRange: boolean = true
): any[] {
  if (!series || series.length === 0) return series;

  // Si on veut du range
  if (targetIsRange) {
    // Vérifier si déjà au format range
    const alreadyRange = series.some((serie) => hasRangeFormat(serie.data));
    if (alreadyRange) return series;

    // Vérifier si on a des données originales en mémoire
    if (series.length === 1 && series[0]._originalSimpleData) {
      // Retourner les données range depuis la mémoire
      return [
        {
          ...series[0],
          data: series[0]._originalSimpleData,
        },
      ];
    }

    // Sinon, appliquer la transformation automatique
    return autoTransform(series);
  }

  // Si on veut du simple (pour switch vers line, bar, etc.)
  if (!targetIsRange) {
    // Vérifier si on a des données originales en mémoire
    if (series.length === 1 && series[0]._originalSeries) {
      // Retourner les séries originales depuis la mémoire
      return series[0]._originalSeries;
    }

    // Sinon, convertir range → simple
    return transformRangeToSimple(series);
  }

  return series;
}

/** Configure les options par défaut pour les graphiques range */
export function configureRangeChart(
  options: Highcharts.Options,
  chartType: string
): void {
  if (!isRangeChart(chartType)) return;

  if (!options.plotOptions) {
    options.plotOptions = {};
  }

  const commonConfig = {
    dataLabels: { enabled: false },
  };

  if (chartType === 'columnrange') {
    (options.plotOptions as any).columnrange = {
      ...(options.plotOptions as any).columnrange,
      ...commonConfig,
    };
  } else if (chartType === 'arearange') {
    (options.plotOptions as any).arearange = {
      ...(options.plotOptions as any).arearange,
      lineWidth: 2,
      fillOpacity: 0.3,
      marker: { enabled: false },
      ...commonConfig,
    };
  } else if (chartType === 'areasplinerange') {
    (options.plotOptions as any).areasplinerange = {
      ...(options.plotOptions as any).areasplinerange,
      lineWidth: 2,
      fillOpacity: 0.3,
      marker: { enabled: false },
      ...commonConfig,
    };
  }
}

/** Force les configurations critiques pour les graphiques range après le merge */
export function enforceCriticalRangeOptions(
  options: Highcharts.Options,
  chartType: string
): void {
  if (!isRangeChart(chartType)) return;

  // Pas besoin de forcer shared car maintenant on a une seule série
}
