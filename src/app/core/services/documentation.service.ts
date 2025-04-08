import { Injectable } from '@angular/core';
import { infoGlobalGraphTypes } from '../../data/doc/graphTypes/info-global-graph-types';
import { globalChartConfig, pieChartConfig, barChartConfig, lineChartConfig, treemapChartConfig, heatmapChartConfig, rangeChartConfig, funnelChartConfig } from '../../data/doc/configs/_index';
import { dataCombine, dataProviders, dataValues, dataFields, dataStructure } from '../../data/doc/data/_index';

@Injectable({
  providedIn: 'root',
})
export class DocumentationService {
  graphTypes = {
    infosGlobal: infoGlobalGraphTypes,
  };

  configs = {
    global: globalChartConfig,
    pie: pieChartConfig,
    bar: barChartConfig,
    line: lineChartConfig,
    treemap: treemapChartConfig,
    heatmap: heatmapChartConfig,
    range: rangeChartConfig,
    funnel: funnelChartConfig,
  };

  datas = {
    combine: dataCombine,
    providers: dataProviders,
    values: dataValues,
    fields: dataFields,
    structure: dataStructure,
  };

  infoGeneralNotes: string[] = [
    "• Chaque famille de graphiques est optimisée pour un cas d'usage spécifique",
    '• La configuration de base reste consistante entre tous les types',
    '• La toolbar permet de basculer dynamiquement entre types compatibles',
    '• Les détails de configuration spécifiques sont disponibles dans les sections dédiées',
  ];

  chartTypeNotes: string[] = [
    '• Le symbole ↔ indique que les types peuvent être basculés entre eux',
    '• Certains types partagent les mêmes données mais offrent des visualisations différentes',
    "• La propriété 'pivot' n'est pas disponible pour tous les types",
    "• 'stacked' ne fonctionne qu'avec les types bar/column",
  ];

  gettingStartedNotes: string[] = [
    "• Il est recommandé de suivre la documentation dans l'ordre proposé",
    '• Commencez par explorer les différents types de graphiques disponibles ainsi que leur compatibilité',
    '• Puis approfondissez avec les options de configuration spécifiques',
    '• La section Data vous permet de maitriser la structuration des données',
  ];

  configGlobalNotes1: string[] = [
    '1. Les propriétés height et series sont obligatoires',
    '2. Le pivot et continue sont mutuellement exclusifs',
    `3. stacked n'est compatible qu'avec les types bar/column`,
    '4. Certaines options peuvent être écrasées par les configurations spécifiques des types',
  ];

  configGlobalNotes2: string[] = [
    "Si une propriété n'est pas documentée ici ou dans les configurations spécifiques, elle utilise certainement la valeur par défaut de la bibliothèque ApexCharts",
    "La syntaxe jQuery Charts est une couche d'abstraction qui simplifie la configuration tout en maintenant l'accès aux options natives",
    'Pour des cas très spécifiques, vous pouvez toujours accéder aux options avancées via l\'objet "options"',
    'Consultez la <a href="https://apexcharts.com/docs/installation/#" target="_blank" class="doc-link">documentation d\'ApexCharts</a> pour des fonctionnalités plus avancées',
  ];

  chartCompatibilityNotes: string[] = [
    '• Pie Charts : pie ↔ donut (même données, avec/sans trou central), polar ↔ radar (visualisation différente)',
    '• Bar Charts : bar ↔ column (orientation), compatible stacked et pivot',
    '• Line Charts : line ↔ area (avec/sans remplissage), compatible continue',
    '• Treemap Charts : treemap ↔ heatmap, supporte le groupement',
    '• Range Charts : rangeArea ↔ rangeBar ↔ rangeColumn, nécessite min/max',
    '• Funnel Charts : funnel ↔ pyramid, configuration spécifique pour le goulot',
  ];
}
