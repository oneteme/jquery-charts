import { Highcharts } from '../highcharts-modules';
import { ORIGINAL_DATA_SYMBOL } from './memory-symbols';
import { validateAndCleanData } from './data-validation';

export function isRangeChart(chartType: string): boolean {
  return ['columnrange', 'arearange', 'areasplinerange'].includes(chartType);
}

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

function extractValue(point: any): number | null {
  if (point === null || point === undefined) return null;
  if (typeof point === 'number') return point;
  if (Array.isArray(point)) return point[1] ?? null;
  if (typeof point === 'object') return point.y ?? null;
  return null;
}

function extractXValue(point: any, index: number): any {
  if (Array.isArray(point)) return point[0] ?? index;
  if (typeof point === 'object' && point !== null) return point.x ?? index;
  return index;
}

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

    return {
      ...serie,
      data: simpleData,
      [ORIGINAL_DATA_SYMBOL]: serie.data,
    };
  });
}

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
    [ORIGINAL_DATA_SYMBOL]: serie.data,
  };
}

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
    [ORIGINAL_DATA_SYMBOL]: serie.data,
  };
}

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
      [ORIGINAL_DATA_SYMBOL]: series,
    },
  ];
}

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
      [ORIGINAL_DATA_SYMBOL]: series,
    },
  ];
}

function compareTwoSeries(series: any[]): any[] {
  if (!series || series.length !== 2) return series;

  const serie1 = series[0];
  const serie2 = series[1];

  if (!serie1.data || !serie2.data) return series;

  const maxLength = Math.max(serie1.data.length, serie2.data.length);
  const rangeData: any[] = [];

  for (let i = 0; i < maxLength; i++) {
    const val1 = serie1.data[i] ? extractValue(serie1.data[i]) : null;
    const val2 = serie2.data[i] ? extractValue(serie2.data[i]) : null;

    if (val1 !== null && val2 !== null) {
      const xValue = extractXValue(serie1.data[i] || serie2.data[i], i);
      rangeData.push({
        x: xValue,
        low: Math.min(val1, val2),
        high: Math.max(val1, val2),
      });
    }
  }

  return [
    {
      name: `${serie1.name || 'Min'} - ${serie2.name || 'Max'}`,
      data: rangeData,
      [ORIGINAL_DATA_SYMBOL]: series,
    },
  ];
}

function autoTransform(series: any[]): any[] {
  if (!series || series.length === 0) return series;

  if (series.length === 2) {
    return compareTwoSeries(series);
  }

  if (series.length > 2) {
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

export function transformDataForRangeChart(
  series: any[],
  targetIsRange: boolean = true
): any[] {
  if (!series || series.length === 0) return series;

  series = validateAndCleanData(series);
  if (series.length === 0) return series;

  if (targetIsRange) {
    const alreadyRange = series.some((serie) => hasRangeFormat(serie.data));
    if (alreadyRange) return series;

    if (series.length === 1 && series[0][ORIGINAL_DATA_SYMBOL]) {
      return [
        {
          ...series[0],
          data: series[0][ORIGINAL_DATA_SYMBOL],
        },
      ];
    }

    return autoTransform(series);
  }

  if (!targetIsRange) {
    if (series.length === 1 && series[0][ORIGINAL_DATA_SYMBOL]) {
      return series[0][ORIGINAL_DATA_SYMBOL];
    }

    return transformRangeToSimple(series);
  }

  return series;
}

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

export function enforceCriticalRangeOptions(
  options: Highcharts.Options,
  chartType: string
): void {
  if (!isRangeChart(chartType)) return;
}
