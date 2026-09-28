import { GroupSyncAction } from './chart-capabilities.model';

export interface ChartGroupSyncPayload {
  xValue?: unknown;
  visible?: boolean;
  min?: number;
  max?: number;
  start?: number;
  end?: number;
  startValue?: unknown;
  endValue?: unknown;
  xAxisIndex?: number;
}

export interface ChartGroupSyncEvent {
  group: string;
  action: GroupSyncAction;
  source: symbol;
  payload: ChartGroupSyncPayload;
}

type ChartGroupSyncListener = (event: ChartGroupSyncEvent) => void;

interface ChartGroupSyncRegistration {
  source: symbol;
  listener: ChartGroupSyncListener;
}

const registrations = new Map<string, Set<ChartGroupSyncRegistration>>();

export function registerChartGroupSync(
  group: string | null | undefined,
  source: symbol,
  listener: ChartGroupSyncListener,
): () => void {
  if (!group) return () => undefined;

  let groupRegistrations = registrations.get(group);
  if (!groupRegistrations) {
    groupRegistrations = new Set();
    registrations.set(group, groupRegistrations);
  }

  const registration = { source, listener };
  groupRegistrations.add(registration);

  return () => {
    groupRegistrations?.delete(registration);
    if (groupRegistrations?.size === 0) registrations.delete(group);
  };
}

export function publishChartGroupSync(event: ChartGroupSyncEvent): void {
  registrations.get(event.group)?.forEach(({ source, listener }) => {
    if (source === event.source) return;
    try {
      listener(event);
    } catch (error) {
      console.error('[jquery-core] Chart group sync listener failed', error);
    }
  });
}
