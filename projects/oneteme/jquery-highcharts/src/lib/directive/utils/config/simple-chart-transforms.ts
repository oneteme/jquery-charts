import { ORIGINAL_DATA_SYMBOL } from './memory-symbols';

export function pieToHeatmap(series: any[]): {
  series: any[];
  yCategories: string[];
  xCategories?: string[];
} {
  if (!series || series.length === 0) {
    return { series: [], yCategories: [] };
  }

  const pieData = series[0]?.data || [];
  if (pieData.length === 0) {
    return { series: [], yCategories: [] };
  }

  const heatmapData = pieData.map((point: any, xIndex: number) => {
    const value =
      typeof point === 'object' ? point.y ?? point.value ?? 0 : point;
    return [xIndex, 0, Math.abs(value)];
  });

  const categoryNames = pieData.map((point: any, index: number) => {
    if (typeof point === 'object' && point.name) {
      return point.name;
    }
    return `Catégorie ${index + 1}`;
  });

  return {
    series: [
      {
        name: 'Heatmap',
        data: heatmapData,
        [ORIGINAL_DATA_SYMBOL]: series,
      },
    ],
    yCategories: ['Valeurs'],
    xCategories: categoryNames,
  };
}

export function pieToTreemap(series: any[]): any[] {
  if (!series || series.length === 0) return series;

  const pieData = series[0]?.data || [];
  if (pieData.length === 0) return series;

  const treemapData = pieData.map((point: any, index: number) => {
    const value =
      typeof point === 'object' ? point.y ?? point.value ?? 0 : point;
    const name =
      typeof point === 'object' ? point.name : `Catégorie ${index + 1}`;

    return {
      id: `item-${index}`,
      name: name,
      value: Math.abs(value),
      colorValue: Math.abs(value),
    };
  });

  return [
    {
      type: 'treemap',
      layoutAlgorithm: 'squarified',
      data: treemapData,
      [ORIGINAL_DATA_SYMBOL]: series,
    },
  ];
}

export function isSimpleChartFormat(series: any[]): boolean {
  if (!series || series.length === 0) return false;

  if (series.length !== 1) return false;

  const firstSerie = series[0];
  if (!firstSerie.data || firstSerie.data.length === 0) return false;

  const firstPoint = firstSerie.data[0];
  if (typeof firstPoint === 'object') {
    return 'name' in firstPoint && ('y' in firstPoint || 'value' in firstPoint);
  }

  return false;
}

export function simpleToStandard(series: any[]): {
  series: any[];
  categories: string[];
} {
  if (!series || series.length === 0) {
    return { series: [], categories: [] };
  }

  const pieData = series[0]?.data || [];
  const categories: string[] = [];
  const standardData: any[] = [];

  pieData.forEach((point: any, index: number) => {
    const value =
      typeof point === 'object' ? point.y ?? point.value ?? 0 : point;
    const name =
      typeof point === 'object' ? point.name : `Catégorie ${index + 1}`;

    categories.push(name);
    standardData.push({
      x: index,
      y: value,
      name: name,
    });
  });

  return {
    series: [
      {
        name: series[0].name || 'Données',
        data: standardData,
        [ORIGINAL_DATA_SYMBOL]: series,
      },
    ],
    categories,
  };
}

export function standardToSimple(series: any[], categories?: string[]): any[] {
  if (!series || series.length === 0) return series;

  if (series.length === 1) {
    const serie = series[0];
    const simpleData = serie.data.map((point: any, index: number) => {
      const value =
        typeof point === 'object' ? point.y ?? point.value ?? 0 : point;
      const name =
        (typeof point === 'object' && point.name) ||
        (categories && categories[index]) ||
        `Catégorie ${index + 1}`;

      return {
        name,
        y: value,
      };
    });

    return [
      {
        name: serie.name || 'Données',
        data: simpleData,
        [ORIGINAL_DATA_SYMBOL]: series,
      },
    ];
  }

  const aggregated = series.map((serie) => {
    const sum = serie.data.reduce((total: number, point: any) => {
      const value =
        typeof point === 'object' ? point.y ?? point.value ?? 0 : point;
      return total + Math.abs(value);
    }, 0);

    return {
      name: serie.name || 'Série',
      y: sum,
    };
  });

  return [
    {
      name: 'Total par série',
      data: aggregated,
      [ORIGINAL_DATA_SYMBOL]: series,
    },
  ];
}
