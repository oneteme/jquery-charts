import { Highcharts } from '../highcharts-modules';
import { ORIGINAL_DATA_SYMBOL, trackTransformation } from './memory-symbols';

export const DEFAULT_MAP_JOINBY: [string, string] = ['code', 'code'];

export function buildMapSeries(
  data: any[],
  seriesConfig: any[] | undefined,
  userSeriesOptions: any[],
  defaultJoinBy: [string, string]
): any[] {
  let normalizedData = data;
  const joinByKey = defaultJoinBy[1] || 'code';

  if (data && data.length > 0 && Array.isArray(data[0])) {
    normalizedData = data.map((point) => {
      if (Array.isArray(point) && point.length >= 2) {
        const code = point[0];
        return {
          [joinByKey]: code !== null && code !== undefined ? code.toString() : code,
          value: point[1],
        };
      }
      return point;
    });
  }

  const effectiveJoinBy = defaultJoinBy;

  if (seriesConfig && seriesConfig.length > 0) {
    return seriesConfig.map((serieConfig, index) => {
      const userOptions = userSeriesOptions[index] || {};

      const defaultOptions = {
        name: serieConfig.name || 'Données',
        data: normalizedData,
        joinBy: effectiveJoinBy,
        type: 'map',
      };

      return {
        ...defaultOptions,
        ...userOptions,
      };
    });
  } else {
    const userOptions = userSeriesOptions[0] || {};

    const defaultOptions = {
      name: 'Données',
      data: normalizedData,
      joinBy: effectiveJoinBy,
      type: 'map',
    };

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

export function buildMapUrl(
  endpoint: string,
  param: string = 'subdiv',
  defaultValue: string = 'region'
): string {
  if (!endpoint) {
    throw new Error('mapEndpoint est requis pour charger une carte');
  }

  const subdivision = getUrlParameter(param) || defaultValue;

  const normalizedEndpoint = endpoint.endsWith('/') ? endpoint : endpoint + '/';

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

export function replaceCodesWithNames(
  categories: string[],
  codeToName: Map<string, string>
): string[] {
  return categories.map((code) => codeToName.get(code) || code);
}

export function createMapTooltipFormatter() {
  return {
    formatter: function (this: any) {
      const categoryName = this.x || '';
      const value = this.y;
      return `<b>${categoryName}</b><br/>${value.toLocaleString('fr-FR')} habitants`;
    },
  };
}

export function createSimpleMapTooltipFormatter() {
  return {
    formatter: function (this: any) {
      const name = this.point.name || '';
      const value = this.point.y;
      return `<b>${name}</b><br/>${value.toLocaleString('fr-FR')} habitants`;
    },
  };
}

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

function standardToMap(
  series: any[],
  categories?: any[],
  joinByKey?: string
): any[] {
  if (!series || series.length === 0) return series;

  const transformedSeries = series.map((serie) => {
    if (!serie.data || serie.data.length === 0) return serie;

    const effectiveJoinBy = serie.joinBy || joinByKey;
    const joinKey = Array.isArray(effectiveJoinBy)
      ? effectiveJoinBy[1] || effectiveJoinBy[0]
      : effectiveJoinBy;

    const mapData = serie.data.map((point: any, index: number) => {
      if (
        typeof point === 'object' &&
        point !== null &&
        !Array.isArray(point) &&
        joinKey &&
        joinKey in point
      ) {
        return point;
      }

      if (Array.isArray(point) && point.length >= 2) {
        const key = joinKey || 'code';
        return {
          [key]: point[0],
          value: point[1],
        };
      }

      if (typeof point === 'object' && point !== null) {
        const key = point['hc-key'] || point.code || point.key || point.name;
        const value = point.value ?? point.y;

        if (key !== undefined && value !== undefined) {
          if (joinKey) {
            return { [joinKey]: key, value };
          }
          return [key, value];
        }
      }

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

function mapToStandard(series: any[]): any[] {
  if (!series || series.length === 0) return series;

  const transformedSeries = series.map((serie) => {
    if (serie[ORIGINAL_DATA_SYMBOL]) {
      const restored = {
        ...serie,
        data: serie[ORIGINAL_DATA_SYMBOL],
      };
      delete restored[ORIGINAL_DATA_SYMBOL];
      return restored;
    }

    if (!serie.data) return serie;

    const standardData = serie.data.map((point: any, index: number) => {
      if (Array.isArray(point) && point.length >= 2) {
        return point[1];
      }

      if (typeof point === 'object' && point !== null) {
        const hasMapKey =
          'code' in point || 'hc-key' in point || 'key' in point;
        if (hasMapKey && 'value' in point) {
          return point.value;
        }
        if ('y' in point) {
          return point.y;
        }
      }

      if (typeof point === 'number') { return point }
      return point;
    });

    const result = { ...serie, data: standardData };
    delete result.joinBy;
    return result;
  });

  return transformedSeries;
}

export function transformDataForMap(
  series: any[],
  targetIsMap: boolean,
  categories?: any[],
  joinByKey?: string
): any[] | { series: any[]; categories?: string[] } {
  if (!series || series.length === 0) return series;

  const hasMap = series.some((serie) => hasMapFormat(serie.data));

  if (targetIsMap) {
    if (hasMap) {
      return series;
    }
    const effectiveJoinBy = joinByKey || series[0]?.joinBy;
    return standardToMap(series, categories, effectiveJoinBy);
  }

  if (hasMap) {
    const transformedSeries = mapToStandard(series);

    const extractedCategories: string[] = [];
    series.forEach((serie) => {
      if (serie.data) {
        serie.data.forEach((point: any) => {
          let category: string | undefined;

          if (
            Array.isArray(point) &&
            point.length >= 2 &&
            typeof point[0] === 'string'
          ) {
            category = point[0];
          }
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

    if (extractedCategories.length > 0) {
      return { series: transformedSeries, categories: extractedCategories };
    }

    return transformedSeries;
  }

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

function getColorAxisConfig(colorScheme?: string): any {
  if (!colorScheme) {
    return MAP_COLOR_SCHEMES.blue;
  }

  if (MAP_COLOR_SCHEMES[colorScheme]) {
    return MAP_COLOR_SCHEMES[colorScheme];
  }

  return undefined;
}

function getHoverStates(colorScheme?: string): any {
  if (!colorScheme) {
    return MAP_HOVER_STATES.blue;
  }

  if (MAP_HOVER_STATES[colorScheme]) {
    return MAP_HOVER_STATES[colorScheme];
  }

  return undefined;
}

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

export function enforceCriticalMapOptions(
  options: Highcharts.Options,
  chartType: string
): void {
  if (!isMapChart(chartType)) {
    return;
  }

  if (!options.chart) {
    options.chart = {};
  }
  options.chart.type = 'map';
}
