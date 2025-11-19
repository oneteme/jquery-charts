import { Highcharts } from '../highcharts-modules';
import { ORIGINAL_DATA_SYMBOL, trackTransformation } from './memory-symbols';

export function isMapChart(chartType: string): boolean {
  return chartType === 'map';
}

// Récup value param depuis URL
export function getUrlParameter(paramName: string): string | null {
  if (typeof window === 'undefined') return null;

  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(paramName);
}

/**
 * Construit l'URL complète du GeoJSON à partir de l'endpoint et de la subdivision
 *
 * @param endpoint - URL de base du dossier contenant les GeoJSON (ex: "https://mon-app.com/assets/geojson/" ou "./assets/maps/")
 * @param param - Nom du paramètre URL à lire (défaut: 'subdiv')
 * @param defaultValue - Valeur par défaut si paramètre absent (défaut: 'region')
 * @returns URL complète du fichier GeoJSON (extension .geojson ajoutée automatiquement)
 *
 * Exemples:
 * - endpoint="./assets/maps/", URL="?subdiv=region" => "./assets/maps/region.geojson"
 * - endpoint="./assets/maps/", URL="?subdiv=dr" => "./assets/maps/dr.geojson"
 * - endpoint="./assets/maps/", URL sans subdiv => "./assets/maps/region.geojson" (défaut)
 */
export function buildMapUrl(
  endpoint: string,
  param: string = 'subdiv',
  defaultValue: string = 'region'
): string {
  if (!endpoint) {
    throw new Error('mapEndpoint est requis pour charger une carte');
  }

  // Récup subdiv depuis URL
  const subdivision = getUrlParameter(param) || defaultValue;

  // Protection pour s'assurer que ca finit par /
  const normalizedEndpoint = endpoint.endsWith('/') ? endpoint : endpoint + '/';

  // URL complète avec extension .geojson
  return `${normalizedEndpoint}${subdivision}.geojson`;
}

export async function loadGeoJSON(url: string): Promise<any> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to load GeoJSON from ${url}: ${response.statusText}`
      );
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading GeoJSON:', error);
    throw error;
  }
}

// Vérifie si les données sont au format map (avec hc-key ou code géographique)
function hasMapFormat(data: any[]): boolean {
  if (!data || data.length === 0) return false;

  return data.some(
    (point: any) =>
      (Array.isArray(point) &&
        point.length >= 2 &&
        typeof point[0] === 'string') ||
      (typeof point === 'object' &&
        point !== null &&
        ('hc-key' in point || 'code' in point || 'key' in point) &&
        ('value' in point || 'y' in point))
  );
}

// Transforme les données pour standard au format map
// Format attendu: [{name: 'Région', code: 'XX', value: 123}] ou [['code', value]]
function standardToMap(
  series: any[],
  categories?: any[],
  joinByKey?: string
): any[] {
  if (!series || series.length === 0) return series;

  const transformedSeries = series.map((serie) => {
    if (!serie.data || serie.data.length === 0) return serie;

    // Déterminer la clé de jointure (depuis serie.joinBy ou le paramètre)
    const effectiveJoinBy = serie.joinBy || joinByKey;
    const joinKey = Array.isArray(effectiveJoinBy)
      ? effectiveJoinBy[1] || effectiveJoinBy[0]
      : effectiveJoinBy;

    // Transformer les données en format map si nécessaire
    const mapData = serie.data.map((point: any, index: number) => {
      // Si c'est déjà au bon format objet avec joinBy, on le garde tel quel
      if (
        typeof point === 'object' &&
        point !== null &&
        !Array.isArray(point) &&
        joinKey &&
        joinKey in point
      ) {
        return point;
      }

      // Si c'est un tableau [code, value], toujours convertir en objet pour compatibilité joinBy
      if (Array.isArray(point) && point.length >= 2) {
        const key = joinKey || 'code'; // 'code' par défaut si pas de joinBy spécifié
        return {
          [key]: point[0],
          value: point[1],
        };
      }

      // Si c'est un objet avec les bonnes propriétés
      if (typeof point === 'object' && point !== null) {
        const key = point['hc-key'] || point.code || point.key || point.name;
        const value = point.value ?? point.y;

        if (key !== undefined && value !== undefined) {
          // Si joinBy personnalisé, retourner objet
          if (joinKey) {
            return { [joinKey]: key, value };
          }
          return [key, value];
        }
      }

      // Format simple: utiliser la catégorie comme clé
      if (categories && categories[index]) {
        const value =
          typeof point === 'number' ? point : point?.y ?? point?.value;
        if (joinKey) {
          return { [joinKey]: categories[index], value };
        }
        return [categories[index], value];
      }

      return point;
    });

    return {
      ...serie,
      type: 'map',
      data: mapData,
      [ORIGINAL_DATA_SYMBOL]: serie.data,
    };
  });

  trackTransformation(transformedSeries[0], 'standard', 'map', 'conversion');

  return transformedSeries;
}

// Transforme des données map en format série standard (inverse)
function mapToStandard(series: any[]): any[] {
  if (!series || series.length === 0) return series;

  const transformedSeries = series.map((serie) => {
    // Si mémoire disponible, restaurer les données originales
    if (serie[ORIGINAL_DATA_SYMBOL]) {
      return {
        ...serie,
        data: serie[ORIGINAL_DATA_SYMBOL],
      };
    }

    // Sinon convertir manuellement
    if (!serie.data) return serie;

    const standardData = serie.data.map((point: any) => {
      if (Array.isArray(point) && point.length >= 2) {
        return {
          name: point[0],
          y: point[1],
        };
      }
      return point;
    });

    return {
      ...serie,
      data: standardData,
    };
  });

  return transformedSeries;
}

// Transforme intelligemment les données pour/depuis map
export function transformDataForMap(
  series: any[],
  targetIsMap: boolean,
  categories?: any[],
  joinByKey?: string
): any[] {
  if (!series || series.length === 0) return series;

  const hasMap = series.some((serie) => hasMapFormat(serie.data));

  // Cas 1 : On veut du map
  if (targetIsMap) {
    if (hasMap) {
      return series; // Déjà au bon format
    }
    // Extraire le joinBy de la première série s'il existe
    const effectiveJoinBy = joinByKey || series[0]?.joinBy;
    return standardToMap(series, categories, effectiveJoinBy);
  }

  // Cas 2 : On veut des séries normales
  if (hasMap) {
    return mapToStandard(series);
  }

  return series;
}

/**
 * Configure les options par défaut pour map
 * Configuration minimale - l'utilisateur peut ajouter ce qu'il veut via config.options
 */
export function configureMapChart(
  options: Highcharts.Options,
  chartType: string
): void {
  if (!isMapChart(chartType)) {
    return;
  }

  // Configuration minimale - juste le type de chart
  if (!options.chart) {
    options.chart = {};
  }

  // S'assurer que le type est bien 'map'
  options.chart.type = 'map';
}

/**
 * Force les configurations critiques pour map après le merge
 * Très minimal - on force uniquement ce qui est absolument nécessaire
 */
export function enforceCriticalMapOptions(
  options: Highcharts.Options,
  chartType: string
): void {
  if (!isMapChart(chartType)) {
    return;
  }

  // S'assurer que le type reste 'map' même après merge
  if (!options.chart) {
    options.chart = {};
  }
  options.chart.type = 'map';
}
