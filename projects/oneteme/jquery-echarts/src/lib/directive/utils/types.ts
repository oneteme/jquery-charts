import type { ECharts, EChartsOption } from 'echarts';

/** Type EventEmitter pour les events toolbar */
export type ChartCustomEvent = 'previous' | 'next' | 'pivot';

/** Alias exposé pour les options ECharts natives */
export type { ECharts, EChartsOption };

/** Options de la loading API native d'ECharts */
export const DEFAULT_LOADING_OPTION = {
  text: 'Chargement des données...',
  color: '#5470c6',
  textColor: '#333',
  maskColor: 'rgba(255, 255, 255, 0.8)',
  zlevel: 0,
  fontSize: 12,
  showSpinner: false,
};
