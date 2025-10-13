// Utilitaires de validation et nettoyage des données

// Vérifie si une valeur est valide (non null, non NaN, finie)
export function isValidValue(value: any): boolean {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === 'number' &&
    !isNaN(value) &&
    isFinite(value)
  );
}

// Extrait une valeur numérique d'un point et la valide
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

// Valide et nettoie les données d'une série
// Retire les points avec des valeurs invalides (null, NaN, Infinity)
export function validateAndCleanSeriesData(serie: any): any {
  if (!serie || !serie.data) return serie;

  const cleanedData = serie.data.filter((point: any) => {
    // Pour les points simples (nombres)
    if (typeof point === 'number') {
      return isValidValue(point);
    }

    // Pour les tableaux [x, y] ou [x, y, z]
    if (Array.isArray(point)) {
      // Au moins la valeur Y doit être valide
      const yValue = point[1];
      return yValue !== undefined && isValidValue(yValue);
    }

    // Pour les objets {x, y}, {x, y, z}, {low, high}, etc.
    if (typeof point === 'object' && point !== null) {
      // Vérifier selon le type d'objet
      if ('low' in point && 'high' in point) {
        // Range chart
        return isValidValue(point.low) && isValidValue(point.high);
      }
      if ('y' in point) {
        // Standard point
        return isValidValue(point.y);
      }
      if ('value' in point) {
        // Heatmap ou autre
        return isValidValue(point.value);
      }
      if ('z' in point && 'y' in point) {
        // Bubble
        return isValidValue(point.y) && isValidValue(point.z);
      }
    }

    // Par défaut, garder le point
    return true;
  });

  return {
    ...serie,
    data: cleanedData,
  };
}

// Valide et nettoie toutes les séries d'un dataset
export function validateAndCleanData(series: any[]): any[] {
  if (!series || series.length === 0) return series;

  return series
    .map((serie) => validateAndCleanSeriesData(serie))
    .filter((serie) => serie.data && serie.data.length > 0); // Retire les séries vides
}

// Détecte les anomalies dans les données et retourne des warnings
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

    // Compter les valeurs invalides
    let invalidCount = 0;
    let nullCount = 0;
    let nanCount = 0;
    let infiniteCount = 0;

    serie.data.forEach((point: any) => {
      const value = extractAndValidateValue(point);
      if (value === null) {
        invalidCount++;

        // Déterminer le type d'erreur
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

    // Vérifier la cohérence des longueurs de séries
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

// Valide les données avec reporting détaillé
export function validateDataWithReport(series: any[]): {
  isValid: boolean;
  cleanedData: any[];
  warnings: string[];
  removedPoints: number;
} {
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
