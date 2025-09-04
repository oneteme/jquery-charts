/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(item: any): boolean {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
* Deep merge two objects.
* @param target
* @param ...sources
*/
export function mergeDeep(target: any, ...sources: any[]): any {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}

export function processSeriesVisibility<T extends { visible?: boolean }>(series: T[]): T[] {
    return series.map(serie => ({
        ...serie,
        visible: serie.visible !== undefined ? serie.visible : true
    }));
}

export function getVisibleSeries<T extends { visible?: boolean }>(series: T[]): T[] {
    return series.filter(serie => serie.visible !== false);
}

export function updateSeriesVisibility<T extends { visible?: boolean }>(
    series: T[],
    seriesIndex: number,
    visible: boolean
): T[] {
    if (seriesIndex < 0 || seriesIndex >= series.length) {
        console.warn(`Index de série invalide: ${seriesIndex}`);
        return series;
    }

    return series.map((serie, index) =>
        index === seriesIndex ? { ...serie, visible } : serie
    );
}

export function toggleSeriesVisibility<T extends { visible?: boolean }>(
    series: T[],
    seriesIndex: number
): T[] {
    if (seriesIndex < 0 || seriesIndex >= series.length) {
        console.warn(`Index de série invalide: ${seriesIndex}`);
        return series;
    }

    const currentVisibility = series[seriesIndex].visible !== false; // true par défaut
    return updateSeriesVisibility(series, seriesIndex, !currentVisibility);
}
