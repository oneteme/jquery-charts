import { ScaleConfig, UnitConfig } from './jquery-core.model';

export interface SelectedUnitScale {
  readonly scale: number;
  readonly unit: string;
  readonly formatter?: (value: number, unit: string) => string;
}

/** Selects the first configured display scale that can represent the data. */
export function selectBestScale(unitConfig: UnitConfig, values: readonly number[]): SelectedUnitScale {
  if (!unitConfig.scales?.length) {
    return { scale: 1, unit: unitConfig.baseUnit, formatter: unitConfig.formatter };
  }

  const scales = [...unitConfig.scales].sort(
    (left: ScaleConfig, right: ScaleConfig) => (left.threshold ?? Infinity) - (right.threshold ?? Infinity),
  );
  const maximum = values
    .filter(value => Number.isFinite(value))
    .reduce((currentMaximum, value) => Math.max(currentMaximum, Math.abs(value)), 0);
  const selected = scales.find(scale => maximum <= (scale.threshold ?? Infinity)) ?? scales.at(-1)!;
  return { scale: selected.scale, unit: selected.unit, formatter: unitConfig.formatter };
}

/** Consistent compact formatting used by chart axes and tooltips. */
export function formatChartValue(value: number, precision?: number): string {
  if (!Number.isFinite(value) || value === 0) return '0';
  if (precision !== undefined) {
    return value.toLocaleString('fr-FR', { maximumFractionDigits: precision, minimumFractionDigits: precision });
  }
  const magnitude = Math.floor(Math.log10(Math.abs(value)));
  const decimals = Math.max(0, Math.min(-magnitude + 2, 6));
  return value.toLocaleString('fr-FR', { maximumFractionDigits: decimals });
}

export function formatUnitValue(value: number, unit: string, scale?: SelectedUnitScale): string {
  const scaled = scale ? value * scale.scale : value;
  if (scale?.formatter) return scale.formatter(scaled, scale.unit);
  return `${formatChartValue(scaled)}\u00a0${scale?.unit ?? unit}`;
}

export interface UnitDefinition<Unit extends string = string> {
  readonly unit: Unit;
  /** Converts a value from this unit to the converter base unit. */
  readonly toBase: (value: number) => number;
  /** Converts a value from the converter base unit to this unit. */
  readonly fromBase: (value: number) => number;
}

export interface LinearUnitOptions {
  /**
   * Number of base units represented by one unit, before applying `offset`.
   * For example, a kilometre definition in a metre-based converter uses 1000.
   */
  readonly factor: number;
  /**
   * Offset applied in the source unit before scaling. This supports affine
   * units such as Celsius/Fahrenheit.
   */
  readonly offset?: number;
}

export interface ChartUnitConverter<Unit extends string = string> {
  readonly units: readonly Unit[];
  convert(value: number, from: Unit, to: Unit): number;
}

export class UnknownUnitError extends Error {
  readonly unit: string;

  constructor(unit: string) {
    super(`[jquery-core] Unknown chart unit: "${unit}".`);
    this.name = 'UnknownUnitError';
    this.unit = unit;
  }
}

/**
 * Creates a reusable linear unit definition.
 *
 * `toBase(value)` is `(value - offset) * factor`; the inverse is used for
 * `fromBase(value)`. A factor of 1 and no offset therefore defines the base
 * unit itself.
 */
export function defineLinearUnit<Unit extends string>(
  unit: Unit,
  options: LinearUnitOptions,
): UnitDefinition<Unit> {
  if (!unit.trim()) {
    throw new TypeError('[jquery-core] A chart unit name cannot be empty.');
  }
  if (!Number.isFinite(options.factor) || options.factor === 0) {
    throw new RangeError('[jquery-core] A chart unit factor must be finite and non-zero.');
  }
  if (options.offset !== undefined && !Number.isFinite(options.offset)) {
    throw new RangeError('[jquery-core] A chart unit offset must be finite.');
  }

  const offset = options.offset ?? 0;
  return {
    unit,
    toBase: (value) => (value - offset) * options.factor,
    fromBase: (value) => value / options.factor + offset,
  };
}

/**
 * Creates an extensible converter from custom unit definitions.
 *
 * Every unit must be registered explicitly. Unknown source or target units
 * throw `UnknownUnitError`; there is no implicit identity or fallback unit.
 */
export function createUnitConverter<Unit extends string>(
  definitions: readonly UnitDefinition<Unit>[],
): ChartUnitConverter<Unit> {
  if (definitions.length === 0) {
    throw new TypeError('[jquery-core] At least one chart unit must be defined.');
  }

  const definitionByUnit = new Map<Unit, UnitDefinition<Unit>>();
  for (const definition of definitions) {
    if (!definition.unit.trim()) {
      throw new TypeError('[jquery-core] A chart unit name cannot be empty.');
    }
    if (definitionByUnit.has(definition.unit)) {
      throw new TypeError(`[jquery-core] Chart unit is registered more than once: "${definition.unit}".`);
    }
    if (typeof definition.toBase !== 'function' || typeof definition.fromBase !== 'function') {
      throw new TypeError(`[jquery-core] Chart unit "${definition.unit}" must define toBase and fromBase functions.`);
    }
    definitionByUnit.set(definition.unit, definition);
  }

  const units = Object.freeze([...definitionByUnit.keys()]);
  return {
    units,
    convert(value, from, to) {
      assertFiniteValue(value);
      const source = getDefinition(definitionByUnit, from);
      const target = getDefinition(definitionByUnit, to);
      const converted = target.fromBase(source.toBase(value));
      assertFiniteValue(converted);
      return converted;
    },
  };
}

export function convertUnitValue<Unit extends string>(
  value: number,
  from: Unit,
  to: Unit,
  converter: ChartUnitConverter<Unit>,
): number {
  return converter.convert(value, from, to);
}

function getDefinition<Unit extends string>(
  definitions: ReadonlyMap<Unit, UnitDefinition<Unit>>,
  unit: Unit,
): UnitDefinition<Unit> {
  const definition = definitions.get(unit);
  if (!definition) {
    throw new UnknownUnitError(unit);
  }
  return definition;
}

function assertFiniteValue(value: number): void {
  if (!Number.isFinite(value)) {
    throw new TypeError(`[jquery-core] Chart unit conversion requires finite numbers: ${String(value)}`);
  }
}
