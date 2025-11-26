import { Highcharts } from '../highcharts-modules';
import { ORIGINAL_DATA_SYMBOL, trackTransformation } from './memory-symbols';

export function isTreemapChart(chartType: string): boolean {
  return chartType === 'treemap';
}

function hasTreemapFormat(data: any[]): boolean {
  if (!data || data.length === 0) return false;

  return data.some(
    (point: any) =>
      typeof point === 'object' &&
      point !== null &&
      ('value' in point || 'parent' in point || 'id' in point)
  );
}

function flatTreemap(series: any[], categories?: any[]): any[] {
  const treemapData: any[] = [];

  if (series.length === 1 && series[0].data && series[0].data.length > 0) {
    const serie = series[0];

    serie.data.forEach((point: any, index: number) => {
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
        return;
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
    series.forEach((serie, index) => {
      if (!serie.data || serie.data.length === 0) return;

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

function hierarchicalTreemap(series: any[], categories?: any[]): any[] {
  const treemapData: any[] = [];
  let pointIndex = 0;

  series.forEach((serie, serieIndex) => {
    const parentId = `serie-${serieIndex}`;
    const serieName = serie.name || `Catégorie ${serieIndex + 1}`;
    const serieColor = serie.color;

    treemapData.push({
      id: parentId,
      name: serieName,
      color: serieColor,
    });

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

function treemapToSeries(series: any[]): any[] {
  if (!series || series.length === 0) return series;

  const firstSerie = series[0];

  if (firstSerie[ORIGINAL_DATA_SYMBOL]) {
    return firstSerie[ORIGINAL_DATA_SYMBOL];
  }

  if (!firstSerie.data) return series;

  const parents = firstSerie.data.filter((p: any) => !p.parent);
  const children = firstSerie.data.filter((p: any) => p.parent);

  const recreatedSeries: any[] = [];

  parents.forEach((parent: any) => {
    const parentChildren = children.filter((c: any) => c.parent === parent.id);

    if (parentChildren.length > 0) {
      recreatedSeries.push({
        name: parent.name,
        color: parent.color,
        data: parentChildren.map((c: any) => c.value),
      });
    } else {
      recreatedSeries.push({
        name: parent.name,
        data: [parent.value],
      });
    }
  });

  return recreatedSeries.length > 0 ? recreatedSeries : series;
}

function autoTransformTreemap(series: any[], categories?: any[]): any[] {
  if (!series || series.length === 0) return series;

  if (series.length === 1) {
    return flatTreemap(series, categories);
  }

  if (!categories || categories.length === 0) {
    return flatTreemap(series, categories);
  }

  return hierarchicalTreemap(series, categories);
}

export function transformDataForTreemap(
  series: any[],
  targetIsTreemap: boolean,
  categories?: any[]
): any[] {
  if (!series || series.length === 0) return series;

  const hasTreemap = series.some((serie) => hasTreemapFormat(serie.data));

  if (targetIsTreemap) {
    if (hasTreemap) {
      return series;
    }
    return autoTransformTreemap(series, categories);
  }

  if (hasTreemap) {
    return treemapToSeries(series);
  }

  return series;
}

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
  if (!options.tooltip) {
    options.tooltip = {};
  }

  options.tooltip.pointFormatter = function (this: any) {
    if (!this.parent) {
      return `${this.name}`;
    }
    const parentData = this.series.data.find((d: any) => d.id === this.parent);
    const parentName = parentData?.name || '';
    return `${parentName} - ${this.name}<br/>Valeur: ${this.value}`;
  };
}

export function enforceCriticalTreemapOptions(
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
  if (!(options.plotOptions as any).treemap.layoutAlgorithm) {
    (options.plotOptions as any).treemap.layoutAlgorithm = 'squarified';
  }
}
