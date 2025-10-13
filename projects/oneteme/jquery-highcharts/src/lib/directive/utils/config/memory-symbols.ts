export const ORIGINAL_DATA_SYMBOL = Symbol('originalData');

export const ORIGINAL_METADATA_SYMBOL = Symbol('originalMetadata');

export const TRANSFORMATION_HISTORY_SYMBOL = Symbol('transformationHistory');

export interface TransformationHistory {
  originalType: string;
  transformations: Array<{
    from: string;
    to: string;
    timestamp: number;
    strategy?: string;
  }>;
}

export function trackTransformation(
  data: any,
  from: string,
  to: string,
  strategy?: string
): void {
  if (!data[TRANSFORMATION_HISTORY_SYMBOL]) {
    data[TRANSFORMATION_HISTORY_SYMBOL] = {
      originalType: from,
      transformations: [],
    };
  }

  data[TRANSFORMATION_HISTORY_SYMBOL].transformations.push({
    from,
    to,
    timestamp: Date.now(),
    strategy,
  });
}
