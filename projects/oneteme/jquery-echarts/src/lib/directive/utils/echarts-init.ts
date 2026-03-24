import * as echarts from 'echarts';

/**
 * Enregistrement centralisé des modules ECharts nécessaires.
 * Import de ce fichier = side effect d'enregistrement.
 *
 * ECharts 5/6 permet l'import de l'objet global `echarts` qui inclut
 * tous les charts et composants. Ce fichier est le point d'entrée unique
 * pour configurer l'instance globale (thèmes, etc.) si besoin.
 */

// Thème léger par défaut — peut être remplacé par l'utilisateur
// via echarts.registerTheme('my-theme', {...}) avant d'utiliser la lib.

export { echarts };
