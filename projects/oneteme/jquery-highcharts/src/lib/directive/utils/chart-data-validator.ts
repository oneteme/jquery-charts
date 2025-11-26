import { ChartType } from '@oneteme/jquery-core';

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  errorTitle?: string;
  isNoData?: boolean;
}

export function validateChartData(
  series: any[],
  chartType: ChartType
): ValidationResult {
  if (!series || series.length === 0) {
    return {
      isValid: false,
      isNoData: true,
      errorTitle: 'Aucune donnée disponible',
      errorMessage: 'Aucune donnée',
    };
  }

  if (isRangeChart(chartType)) {
    return validateRangeChartData(series, chartType);
  }

  if (isMapChart(chartType)) {
    return validateMapChartData(series, chartType);
  }

  return { isValid: true };
}

function isRangeChart(chartType: ChartType): boolean {
  return ['columnrange', 'arearange', 'areasplinerange'].includes(chartType);
}

function isMapChart(chartType: ChartType): boolean {
  return chartType === 'map';
}

function validateMapChartData(
  series: any[],
  chartType: ChartType
): ValidationResult {
  const hasMapFormat = series.some((s) => {
    const data = s.data || [];
    return data.some((point: any) => {
      if (
        Array.isArray(point) &&
        point.length >= 2 &&
        typeof point[0] === 'string'
      ) {
        return true;
      }
      if (typeof point === 'object' && point !== null) {
        const hasKey =
          'code' in point ||
          'hc-key' in point ||
          'key' in point ||
          'name' in point;
        const hasValue = 'value' in point || 'y' in point;
        return hasKey && hasValue;
      }
      return false;
    });
  });

  if (!hasMapFormat) {
    return {
      isValid: false,
      errorTitle: 'Données incompatibles',
      errorMessage:
        'Les données doivent être au format map: [{code: "XX", value: 123}] ou [["code", value]]',
    };
  }

  return { isValid: true };
}

function validateRangeChartData(
  series: any[],
  chartType: ChartType
): ValidationResult {
  const hasRangeFormat = series.some((s) => {
    const data = s.data || [];
    return data.some((point: any) => {
      if (Array.isArray(point)) {
        return point.length >= 3;
      }
      return (
        typeof point === 'object' &&
        (point.low !== undefined || point.high !== undefined)
      );
    });
  });

  if (hasRangeFormat) {
    return { isValid: true };
  }

  if (series.length < 2) {
    const chartTypeLabel = getChartTypeLabel(chartType);
    return {
      isValid: false,
      errorTitle: 'Données incompatibles',
      errorMessage: `Veuillez fournir au moins 2 séries pour afficher un graphique "${chartTypeLabel}".`,
    };
  }

  return { isValid: true };
}

function getChartTypeLabel(chartType: ChartType): string {
  const labels: { [key: string]: string } = {
    columnrange: 'Column Range',
    arearange: 'Area Range',
    areasplinerange: 'Area Spline Range',
  };

  return labels[chartType] || chartType;
}
