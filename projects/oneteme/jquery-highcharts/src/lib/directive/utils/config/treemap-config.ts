import { Highcharts } from '../highcharts-modules';

/** Détermine si un type de graphique est treemap */
export function isTreemapChart(chartType: string): boolean {
  return chartType === 'treemap';
}

/** Vérifie si les données sont au format treemap (avec parent/value/id) */
function hasTreemapFormat(data: any[]): boolean {
  if (!data || data.length === 0) return false;

  return data.some(
    (point: any) =>
      typeof point === 'object' &&
      point !== null &&
      ('value' in point || 'parent' in point || 'id' in point)
  );
}

/**
 * STRATÉGIE 1 : Structure plate - chaque série = un rectangle
 * Exemple: Serie1(total:100) + Serie2(total:200) → 2 rectangles
 */
function flatTreemap(series: any[]): any[] {
  const treemapData: any[] = [];

  series.forEach((serie, index) => {
    if (!serie.data || serie.data.length === 0) return;

    // Calculer la somme totale de la série
    const total = serie.data.reduce((sum: number, value: any) => {
      const numValue =
        typeof value === 'number'
          ? value
          : typeof value === 'object' && value !== null
          ? value.y ?? value.value
          : 0;
      return sum + Math.abs(numValue || 0);
    }, 0);

    if (total > 0) {
      treemapData.push({
        name: serie.name || `Catégorie ${index + 1}`,
        value: total,
        colorValue: total,
      });
    }
  });

  return [
    {
      type: 'treemap',
      layoutAlgorithm: 'squarified',
      data: treemapData,
      __originalSeries: series, // Mémoire des données originales
    },
  ];
}

/**
 * STRATÉGIE 2 : Structure hiérarchique - séries → points
 * Exemple: Serie1[val1, val2] → Parent1 → [Child1, Child2]
 */
function hierarchicalTreemap(series: any[], categories?: any[]): any[] {
  const treemapData: any[] = [];
  let pointIndex = 0;

  series.forEach((serie, serieIndex) => {
    const parentId = `serie-${serieIndex}`;
    const serieName = serie.name || `Catégorie ${serieIndex + 1}`;

    // Ajouter le nœud parent
    treemapData.push({
      id: parentId,
      name: serieName,
      color: serie.color,
    });

    // Ajouter les points enfants
    if (serie.data && serie.data.length > 0) {
      serie.data.forEach((value: any, dataIndex: number) => {
        const numValue =
          typeof value === 'number'
            ? value
            : typeof value === 'object' && value !== null
            ? value.y ?? value.value
            : null;

        if (numValue !== null && numValue !== undefined && numValue > 0) {
          const pointName =
            categories && categories[dataIndex]
              ? categories[dataIndex]
              : `Point ${dataIndex + 1}`;

          treemapData.push({
            id: `point-${pointIndex++}`,
            parent: parentId,
            name: pointName,
            value: Math.abs(numValue),
          });
        }
      });
    }
  });

  return [
    {
      type: 'treemap',
      layoutAlgorithm: 'squarified',
      data: treemapData,
      __originalSeries: series, // Mémoire des données originales
    },
  ];
}

/**
 * Transforme des données treemap en format série standard (inverse)
 * Restaure les séries originales si disponibles
 */
function treemapToSeries(series: any[]): any[] {
  if (!series || series.length === 0) return series;

  const firstSerie = series[0];

  // Si mémoire disponible, restaurer les données originales
  if (firstSerie.__originalSeries) {
    return firstSerie.__originalSeries;
  }

  // Sinon, convertir manuellement
  if (!firstSerie.data) return series;

  // Grouper par parent pour recréer les séries
  const parents = firstSerie.data.filter((p: any) => !p.parent);
  const children = firstSerie.data.filter((p: any) => p.parent);

  const recreatedSeries: any[] = [];

  parents.forEach((parent: any) => {
    const parentChildren = children.filter((c: any) => c.parent === parent.id);

    if (parentChildren.length > 0) {
      // Structure hiérarchique
      recreatedSeries.push({
        name: parent.name,
        color: parent.color,
        data: parentChildren.map((c: any) => c.value),
      });
    } else {
      // Structure plate
      recreatedSeries.push({
        name: parent.name,
        data: [parent.value],
      });
    }
  });

  return recreatedSeries.length > 0 ? recreatedSeries : series;
}

/**
 * MODE AUTOMATIQUE : Détecte la structure et applique la meilleure transformation
 */
function autoTransformTreemap(series: any[], categories?: any[]): any[] {
  if (!series || series.length === 0) return series;

  // Si une seule série OU pas de catégories → structure plate
  if (series.length === 1 || !categories || categories.length === 0) {
    return flatTreemap(series);
  }

  // Si plusieurs séries avec catégories → structure hiérarchique
  return hierarchicalTreemap(series, categories);
}

/**
 * Transforme intelligemment les données pour/depuis treemap
 * @param series - Les séries de données
 * @param targetIsTreemap - true si on veut transformer vers treemap, false pour l'inverse
 * @param categories - Catégories optionnelles pour l'axe X
 */
export function transformDataForTreemap(
  series: any[],
  targetIsTreemap: boolean,
  categories?: any[]
): any[] {
  if (!series || series.length === 0) return series;

  const hasTreemap = series.some((serie) => hasTreemapFormat(serie.data));

  // Cas 1 : On veut du treemap
  if (targetIsTreemap) {
    if (hasTreemap) {
      return series; // Déjà au bon format
    }
    return autoTransformTreemap(series, categories);
  }

  // Cas 2 : On veut des séries normales
  if (hasTreemap) {
    return treemapToSeries(series);
  }

  return series;
}

/** Configure les options par défaut pour treemap */
export function configureTreemapChart(
  options: Highcharts.Options,
  chartType: string
): void {
  if (!isTreemapChart(chartType)) {
    return;
  }

  if (!options.plotOptions) {
    options.plotOptions = {};
  }

  (options.plotOptions as any).treemap = {
    ...(options.plotOptions as any).treemap,
    layoutAlgorithm: 'squarified',
    alternateStartingDirection: true,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    dataLabels: {
      enabled: true,
      align: 'center',
      verticalAlign: 'middle',
      style: {
        fontSize: '12px',
        fontWeight: 'bold',
        textOutline: '1px contrast',
      },
    },
    levels: [
      {
        level: 1,
        dataLabels: {
          enabled: true,
        },
        borderWidth: 3,
        borderColor: '#999999',
      },
    ],
  };

  // Tooltip standard
  if (!options.tooltip) {
    options.tooltip = {};
  }
}

/** Force les configurations critiques pour treemap après le merge */
export function enforceCriticalTreemapOptions(
  options: Highcharts.Options,
  chartType: string
): void {
  if (!isTreemapChart(chartType)) {
    return;
  }

  // S'assurer du layout algorithm
  if (!options.plotOptions) {
    options.plotOptions = {};
  }
  if (!(options.plotOptions as any).treemap) {
    (options.plotOptions as any).treemap = {};
  }
  if (!(options.plotOptions as any).treemap.layoutAlgorithm) {
    (options.plotOptions as any).treemap.layoutAlgorithm = 'squarified';
  }
}
