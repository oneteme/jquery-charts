export {
  ChartClickEvent,
  ChartCustomEvent,
  ChartExportImageType,
  ChartDrilldownConfig,
  ChartDrilldownLevel,
  ChartDrilldownRequest,
  ChartDrilldownState,
  ChartRenderError,
  GroupSyncAction,
  GroupSyncMode,
} from '@oneteme/jquery-core';

/** Alias exposé pour les options ECharts natives */
export type { ECharts, EChartsOption } from 'echarts';

/** Options de la loading API native d'ECharts (hors `text` — fourni par l'Input `loadingLabel`) */
export const DEFAULT_LOADING_OPTION = {
  color: '#5470c6',
  textColor: '#333',
  maskColor: 'rgba(255, 255, 255, 0.8)',
  zlevel: 0,
  fontSize: 12,
  showSpinner: false,
};
