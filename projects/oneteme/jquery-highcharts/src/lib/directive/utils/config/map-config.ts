import { Highcharts } from '../highcharts-modules';
import { ORIGINAL_DATA_SYMBOL, trackTransformation } from './memory-symbols';

export const DEFAULT_MAP_JOINBY: [string, string] = ['code', 'code'];

export function buildMapSeries(
  data: any[],
  seriesConfig: any[] | undefined,
  userSeriesOptions: any[],
  defaultJoinBy: [string, string]
): any[] {
  if (seriesConfig && seriesConfig.length > 0) {
    // Si on a des configs de séries, construire une série pour chacune
    return seriesConfig.map((serieConfig, index) => {
      const userOptions = userSeriesOptions[index] || {};

      // Options par défaut
      const defaultOptions = {
        name: serieConfig.name || 'Données',
        data: data,
        joinBy: defaultJoinBy,
        type: 'map',
      };

      // Merge : les userOptions écrasent les defaultOptions
      return {
        ...defaultOptions,
        ...userOptions,
      };
    });
  } else {
    // Sinon, créer une seule série par défaut
    const userOptions = userSeriesOptions[0] || {};

    // Options par défaut
    const defaultOptions = {
      name: 'Données',
      data: data,
      joinBy: defaultJoinBy,
      type: 'map',
    };

    // Merge : les userOptions écrasent les defaultOptions
    return [
      {
        ...defaultOptions,
        ...userOptions,
      },
    ];
  }
}

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

// Extrait le mapping code → nom depuis un GeoJSON
export function extractCodeToNameMapping(geoJSON: any): Map<string, string> {
  const mapping = new Map<string, string>();
  if (geoJSON?.features) {
    geoJSON.features.forEach((feature: any) => {
      const code = feature.properties?.code || feature.properties?.['hc-key'];
      const name = feature.properties?.nom || feature.properties?.name;
      if (code && name) {
        mapping.set(code.toString(), name);
      }
    });
  }
  return mapping;
}

// Remplace les codes par les noms dans un tableau de catégories
export function replaceCodesWithNames(
  categories: string[],
  codeToName: Map<string, string>
): string[] {
  return categories.map((code) => codeToName.get(code) || code);
}

// Crée un tooltip formaté pour les graphiques issus de maps
export function createMapTooltipFormatter() {
  return {
    formatter: function (this: any) {
      const categoryName = this.x || '';
      const value = this.y;
      return `<b>${categoryName}</b><br/>${value.toLocaleString('fr-FR')} habitants`;
    },
  };
}

// Crée un tooltip formaté pour les graphiques simples (pie, donut) issus de maps
export function createSimpleMapTooltipFormatter() {
  return {
    formatter: function (this: any) {
      const name = this.point.name || '';
      const value = this.point.y;
      return `<b>${name}</b><br/>${value.toLocaleString('fr-FR')} habitants`;
    },
  };
}

// Vérifie si les données sont au format map (avec hc-key ou code géographique)
function hasMapFormat(data: any[]): boolean {
  if (!data || data.length === 0) return false;

  const result = data.some(
    (point: any) =>
      (Array.isArray(point) &&
        point.length >= 2 &&
        typeof point[0] === 'string') ||
      (typeof point === 'object' &&
        point !== null &&
        ('hc-key' in point || 'code' in point || 'key' in point) &&
        ('value' in point || 'y' in point))
  );
  
  console.log('[hasMapFormat] data:', data, 'result:', result);
  return result;
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
      const restored = {
        ...serie,
        data: serie[ORIGINAL_DATA_SYMBOL],
      };
      // Nettoyer le symbole de mémoire
      delete restored[ORIGINAL_DATA_SYMBOL];
      return restored;
    }

    // Sinon convertir manuellement
    if (!serie.data) return serie;

    const standardData = serie.data.map((point: any, index: number) => {
      // Format tableau [code, value]
      if (Array.isArray(point) && point.length >= 2) {
        // Pour les graphiques standard, on retourne juste la valeur numérique
        // Les catégories seront extraites séparément si nécessaire
        return point[1];
      }

      // Format objet avec code/hc-key et value
      if (typeof point === 'object' && point !== null) {
        const hasMapKey =
          'code' in point || 'hc-key' in point || 'key' in point;
        if (hasMapKey && 'value' in point) {
          // Retourner juste la valeur pour compatibilité avec les graphiques standard
          return point.value;
        }
        // Si c'est déjà au format standard {x, y} ou {name, y}, le garder tel quel
        if ('y' in point) {
          return point.y;
        }
      }

      // Valeur numérique simple
      if (typeof point === 'number') {
        return point;
      }

      return point;
    });

    const result = {
      ...serie,
      data: standardData,
    };

    // Nettoyer les propriétés spécifiques aux maps
    delete result.joinBy;

    return result;
  });

  return transformedSeries;
}

// Transforme intelligemment les données pour/depuis map
export function transformDataForMap(
  series: any[],
  targetIsMap: boolean,
  categories?: any[],
  joinByKey?: string
): any[] | { series: any[]; categories?: string[] } {
  console.log('🗺️ transformDataForMap appelé:', { targetIsMap, seriesLength: series?.length, categories, joinByKey });
  if (!series || series.length === 0) {
    console.log('⚠️ Séries vides ou undefined');
    return series;
  }

  const hasMap = series.some((serie) => hasMapFormat(serie.data));
  console.log('🗺️ Détection format map:', hasMap);
  console.log('[transformDataForMap] targetIsMap:', targetIsMap, 'hasMap:', hasMap, 'series:', series);

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
    console.log('[transformDataForMap] Converting map to standard...');
    const transformedSeries = mapToStandard(series);
    console.log('[transformDataForMap] Transformed series:', transformedSeries);

    // Extraire les catégories depuis les données map
    const extractedCategories: string[] = [];
    series.forEach((serie) => {
      if (serie.data) {
        serie.data.forEach((point: any) => {
          let category: string | undefined;

          // Format tableau [code, value]
          if (
            Array.isArray(point) &&
            point.length >= 2 &&
            typeof point[0] === 'string'
          ) {
            category = point[0];
          }
          // Format objet avec code/hc-key
          else if (typeof point === 'object' && point !== null) {
            const code = point.code || point['hc-key'] || point.key || point.name;
            category = code !== undefined ? String(code) : undefined;
          }

          if (category && !extractedCategories.includes(category)) {
            extractedCategories.push(category);
          }
        });
      }
    });

    // Si on a extrait des catégories, les retourner avec les séries
    if (extractedCategories.length > 0) {
      console.log('🗺️ Catégories extraites:', extractedCategories);
      return { series: transformedSeries, categories: extractedCategories };
    }

    console.log('🗺️ Retour séries transformées sans catégories');
    return transformedSeries;
  }

  console.log('ℹ️ Aucune transformation nécessaire, retour séries inchangées');
  return series;
}

// Schémas de couleur prédéfinis pour les maps
const MAP_COLOR_SCHEMES: { [key: string]: any } = {
  blue: {
    minColor: '#89CFF0',
    maxColor: '#000066',
    stops: [
      [0, '#89CFF0'],
      [0.5, '#007FFF'],
      [1, '#00008B'],
    ],
  },
  green: {
    minColor: '#F0FFF0',
    maxColor: '#008746',
  },
  purple: {
    minColor: '#E6D5F5',
    maxColor: '#FF1493',
    stops: [
      [0, '#E6D5F5'],
      [0.5, '#9370DB'],
      [1, '#FF1493'],
    ],
  },
  orange: {
    minColor: '#FFE5CC',
    maxColor: '#D35400',
    stops: [
      [0, '#FFE5CC'],
      [0.5, '#FF8C00'],
      [1, '#D35400'],
    ],
  },
  grey: {
    minColor: '#F0F0F0',
    maxColor: '#2C3E50',
    stops: [
      [0, '#F0F0F0'],
      [0.5, '#7F8C8D'],
      [1, '#2C3E50'],
    ],
  },
};

// États de hover pour chaque schéma de couleur
const MAP_HOVER_STATES: { [key: string]: any } = {
  blue: {
    hover: {
      color: '#D35400',
    },
  },
  green: {
    hover: {
      color: '#BADA55',
    },
  },
  purple: {
    hover: {
      color: '#FFD700',
    },
  },
  orange: {
    hover: {
      color: '#1ABC9C',
    },
  },
  grey: {
    hover: {
      color: '#E74C3C',
    },
  },
};

/**
 * Récupère la configuration colorAxis selon le schéma demandé
 */
function getColorAxisConfig(colorScheme?: string): any {
  if (!colorScheme) {
    // Par défaut : schéma bleu
    return MAP_COLOR_SCHEMES.blue;
  }

  // Si c'est un schéma prédéfini
  if (MAP_COLOR_SCHEMES[colorScheme]) {
    return MAP_COLOR_SCHEMES[colorScheme];
  }

  // Sinon, pas de config par défaut (l'utilisateur gère via options)
  return undefined;
}

/**
 * Récupère les états de hover selon le schéma de couleur
 */
function getHoverStates(colorScheme?: string): any {
  if (!colorScheme) {
    // Par défaut : schéma bleu
    return MAP_HOVER_STATES.blue;
  }

  // Si c'est un schéma prédéfini
  if (MAP_HOVER_STATES[colorScheme]) {
    return MAP_HOVER_STATES[colorScheme];
  }

  // Sinon, pas de config par défaut
  return undefined;
}

/**
 * Configure les options par défaut pour map
 */
export function configureMapChart(
  options: Highcharts.Options,
  chartType: string,
  config?: any
): void {
  if (!isMapChart(chartType)) {
    return;
  }

  if (!options.chart) {
    options.chart = {};
  }
  options.chart.type = 'map';

  if (!options.mapView) {
    options.mapView = {
      projection: {
        name: 'LambertConformalConic',
      },
    };
  }

  if (!options.legend) {
    options.legend = { enabled: false };
  }

  if (options.title === undefined) {
    options.title = { text: undefined };
  }

  if (options.subtitle === undefined) {
    options.subtitle = { text: undefined };
  }

  if (!options.mapNavigation) {
    options.mapNavigation = { enabled: false };
  }

  if (!options.credits) {
    options.credits = { enabled: false };
  }

  const colorScheme = config?.mapColor;
  const colorAxisConfig = getColorAxisConfig(colorScheme);
  if (colorAxisConfig && !options.colorAxis) {
    options.colorAxis = colorAxisConfig;
  }

  const hoverStates = getHoverStates(colorScheme);
  if (hoverStates) {
    if (!options.plotOptions) {
      options.plotOptions = {};
    }
    if (!options.plotOptions.series) {
      options.plotOptions.series = {};
    }
    if (!options.plotOptions.series.states) {
      options.plotOptions.series.states = hoverStates;
    }
    if (!options.plotOptions.series.animation) {
      options.plotOptions.series.animation = {
        duration: 700,
        easing: 'easeOutBounce',
      };
    }
  }
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
