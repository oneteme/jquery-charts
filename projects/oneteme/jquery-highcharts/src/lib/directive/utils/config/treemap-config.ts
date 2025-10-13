import { Highcharts } from '../highcharts-modules';
import { ORIGINAL_DATA_SYMBOL, trackTransformation } from './memory-symbols';

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

// STRATÉGIE 1 : Structure plate - chaque point de données = un rectangle
// Pour une série simple (ex: Pie/Donut vers Treemap), chaque valeur devient une case
function flatTreemap(series: any[], categories?: any[]): any[] {
  const treemapData: any[] = [];

  // Si une seule série avec plusieurs points de données
  if (series.length === 1 && series[0].data && series[0].data.length > 0) {
    const serie = series[0];

    serie.data.forEach((point: any, index: number) => {
      // Extraire la valeur
      let value: number;
      let name: string;
      let color: string | undefined;

      if (typeof point === 'number') {
        value = point;
        name =
          categories && categories[index]
            ? categories[index]
            : `Item ${index + 1}`;
      } else if (typeof point === 'object' && point !== null) {
        value = point.y ?? point.value ?? 0;
        name =
          point.name ??
          (categories && categories[index]
            ? categories[index]
            : `Item ${index + 1}`);
        color = point.color;
      } else {
        return; // Ignorer les valeurs invalides
      }

      if (value > 0) {
        const dataPoint: any = {
          name: name,
          value: Math.abs(value),
          colorValue: Math.abs(value),
        };

        if (color) {
          dataPoint.color = color;
        }

        treemapData.push(dataPoint);
      }
    });
  } else {
    // Plusieurs séries : chaque série = un rectangle avec sa somme totale
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
        const dataPoint: any = {
          name: serie.name || `Catégorie ${index + 1}`,
          value: total,
          colorValue: total,
        };

        // Ajouter la couleur de la série si elle existe
        if (serie.color) {
          dataPoint.color = serie.color;
        }

        treemapData.push(dataPoint);
      }
    });
  }

  const transformedSerie = {
    type: 'treemap',
    layoutAlgorithm: 'squarified',
    data: treemapData,
    [ORIGINAL_DATA_SYMBOL]: series,
  };

  trackTransformation(transformedSerie, 'standard', 'treemap', 'flat');

  return [transformedSerie];
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
    const serieColor = serie.color;

    // Ajouter le nœud parent
    treemapData.push({
      id: parentId,
      name: serieName,
      color: serieColor,
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
            color: serieColor,
          });
        }
      });
    }
  });

  const transformedSerie = {
    type: 'treemap',
    layoutAlgorithm: 'squarified',
    data: treemapData,
    [ORIGINAL_DATA_SYMBOL]: series,
  };

  trackTransformation(transformedSerie, 'standard', 'treemap', 'hierarchical');

  return [transformedSerie];
}

/**
 * Transforme des données treemap en format série standard (inverse)
 * Restaure les séries originales si disponibles
 */
function treemapToSeries(series: any[]): any[] {
  if (!series || series.length === 0) return series;

  const firstSerie = series[0];

  // Si mémoire disponible, restaurer les données originales
  if (firstSerie[ORIGINAL_DATA_SYMBOL]) {
    return firstSerie[ORIGINAL_DATA_SYMBOL];
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

  // Si une seule série -> structure plate (chaque point = une case)
  if (series.length === 1) {
    return flatTreemap(series, categories);
  }

  // Si plusieurs séries sans catégories -> structure plate (chaque série = une case)
  if (!categories || categories.length === 0) {
    return flatTreemap(series, categories);
  }

  // Si plusieurs séries avec catégories -> structure hiérarchique
  return hierarchicalTreemap(series, categories);
}

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

  if (!(options.plotOptions as any).treemap) {
    (options.plotOptions as any).treemap = {};
  }

  // Configuration pour afficher clairement la hiérarchie
  (options.plotOptions as any).treemap = {
    ...(options.plotOptions as any).treemap,
    layoutAlgorithm: 'squarified',
    allowTraversingTree: true,
    animationLimit: 1000,
    levelIsConstant: false,

    levels: [
      {
        level: 1,
        borderWidth: 3,
        borderColor: '#ffffff',
        dataLabels: {
          enabled: true,
          align: 'center',
          verticalAlign: 'middle',
          style: {
            fontSize: '13px',
            fontWeight: 'normal',
            color: '#ffffff',
          },
        },
      },
    ],
  };

  // Tooltip amélioré
  if (!options.tooltip) {
    options.tooltip = {};
  }

  options.tooltip.pointFormatter = function (this: any) {
    // Si c'est un parent (série)
    if (!this.parent) {
      return `${this.name}`;
    }
    // Si c'est un enfant (mois)
    const parentData = this.series.data.find((d: any) => d.id === this.parent);
    const parentName = parentData?.name || '';
    return `${parentName} - ${this.name}<br/>Valeur: ${this.value}`;
  };
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
