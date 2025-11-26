export function isValidValue(value: any): boolean {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === 'number' &&
    !isNaN(value) &&
    isFinite(value)
  );
}

export function extractAndValidateValue(point: any): number | null {
  if (point === null || point === undefined) return null;

  let value: number | null = null;

  if (typeof point === 'number') {
    value = point;
  } else if (Array.isArray(point)) {
    value = point[1] ?? null;
  } else if (typeof point === 'object') {
    value = point.y ?? point.value ?? null;
  }

  return value !== null && isValidValue(value) ? value : null;
}

export function validateAndCleanSeriesData(serie: any): any {
  if (!serie || !serie.data) return serie;

  const cleanedData = serie.data.filter((point: any) => {
    if (typeof point === 'number') {
      return isValidValue(point);
    }

    if (Array.isArray(point)) {
      const yValue = point[1];
      return yValue !== undefined && isValidValue(yValue);
    }

    if (typeof point === 'object' && point !== null) {
      if ('low' in point && 'high' in point) {
        return isValidValue(point.low) && isValidValue(point.high);
      }
      if ('y' in point) {
        return isValidValue(point.y);
      }
      if ('value' in point) {
        const hasMapKey =
          'code' in point ||
          'hc-key' in point ||
          'key' in point ||
          'name' in point;
        if (hasMapKey) {
          return (
            point.value !== null &&
            point.value !== undefined &&
            typeof point.value === 'number' &&
            !isNaN(point.value)
          );
        }
        return isValidValue(point.value);
      }
      if ('z' in point && 'y' in point) {
        return isValidValue(point.y) && isValidValue(point.z);
      }
    }

    return true;
  });

  return {
    ...serie,
    data: cleanedData,
  };
}

export function validateAndCleanData(series: any[]): any[] {
  if (!series || series.length === 0) return series;

  return series
    .map((serie) => validateAndCleanSeriesData(serie))
    .filter((serie) => serie.data && serie.data.length > 0);
}

export function detectDataAnomalies(series: any[]): string[] {
  const warnings: string[] = [];

  if (!series || series.length === 0) {
    warnings.push('Aucune série de données fournie');
    return warnings;
  }

  series.forEach((serie, index) => {
    const serieName = serie.name || `Série ${index + 1}`;

    if (!serie.data || serie.data.length === 0) {
      warnings.push(`${serieName}: Aucune donnée`);
      return;
    }

    let invalidCount = 0;
    let nullCount = 0;
    let nanCount = 0;
    let infiniteCount = 0;

    serie.data.forEach((point: any) => {
      const value = extractAndValidateValue(point);
      if (value === null) {
        invalidCount++;

        if (point === null || point === undefined) {
          nullCount++;
        } else if (typeof point === 'number' && isNaN(point)) {
          nanCount++;
        } else if (typeof point === 'number' && !isFinite(point)) {
          infiniteCount++;
        }
      }
    });

    if (invalidCount > 0) {
      const details: string[] = [];
      if (nullCount > 0) details.push(`${nullCount} null/undefined`);
      if (nanCount > 0) details.push(`${nanCount} NaN`);
      if (infiniteCount > 0) details.push(`${infiniteCount} Infinity`);

      warnings.push(
        `${serieName}: ${invalidCount} valeur(s) invalide(s) (${details.join(
          ', '
        )})`
      );
    }

    if (index > 0 && series[0].data) {
      const firstLength = series[0].data.length;
      const currentLength = serie.data.length;

      if (firstLength !== currentLength) {
        warnings.push(
          `${serieName}: Longueur différente (${currentLength} vs ${firstLength} dans la première série)`
        );
      }
    }
  });

  return warnings;
}

export interface DataValidationReport {
  isValid: boolean;
  cleanedData: any[];
  warnings: string[];
  removedPoints: number;
}

export function validateDataWithReport(series: any[]): DataValidationReport {
  const warnings = detectDataAnomalies(series);
  const originalPointCount = series.reduce(
    (sum, s) => sum + (s.data?.length || 0),
    0
  );

  const cleanedData = validateAndCleanData(series);
  const cleanedPointCount = cleanedData.reduce(
    (sum, s) => sum + (s.data?.length || 0),
    0
  );

  const removedPoints = originalPointCount - cleanedPointCount;

  return {
    isValid: warnings.length === 0 && removedPoints === 0,
    cleanedData,
    warnings,
    removedPoints,
  };
}
