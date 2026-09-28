/** Common toolbar actions exposed by chart wrappers. */
export type ChartCustomEvent = 'previous' | 'next' | 'pivot';

/** Generic event emitted when a chart point is activated. */
export interface ChartClickEvent {
  componentType?: string;
  seriesType?: string;
  seriesIndex?: number;
  dataIndex?: number;
  name?: string;
  value?: unknown;
  data?: unknown;
  encode?: Record<string, number[]>;
  event?: unknown;
}

/** Error emitted when a chart cannot build or apply its rendered options. */
export interface ChartRenderError {
  error: unknown;
}

export type GroupSyncAction = 'datazoom' | 'tooltip';
export type GroupSyncMode = 'all' | GroupSyncAction | GroupSyncAction[];

export type ChartExportImageType = 'png' | 'jpeg' | 'svg';

export interface ChartDrilldownLevel {
  id: string;
  label: string;
  groupBy?: string;
}

export interface ChartDrilldownConfig {
  levels: ChartDrilldownLevel[];
  activeLevel: string;
}

export interface ChartDrilldownState {
  active: boolean;
  activeLevel: string;
  rootLevel: string | null;
}

export interface ChartDrilldownRequest {
  fromLevel: string;
  toLevel: string;
  groupBy?: string;
  value: unknown;
  path: Record<string, unknown>;
}
