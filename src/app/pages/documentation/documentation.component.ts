import { Component } from '@angular/core';
import {
  barGraphTypes,
  funnelGraphTypes,
  heatmapGraphTypes,
  infoGlobalGraphTypes,
  lineGraphTypes,
  pieGraphTypes,
  rangeGraphTypes,
  treemapGraphTypes,
} from '../../components/documentation/data/graphTypes/_index';
import {
  globalChartConfig,
  pieChartConfig,
  barChartConfig,
  lineChartConfig,
  treemapChartConfig,
  heatmapChartConfig,
  rangeChartConfig,
  funnelChartConfig,
} from '../../components/documentation/data/configs/_index';
import {
  dataCombine,
  dataProviders,
  dataValues,
  dataFields,
  dataStructure,
} from '../../components/documentation/data/data/_index';

@Component({
  selector: 'app-documentation',
  templateUrl: './documentation.component.html',
  styleUrls: ['./documentation.component.scss'],
})
export class DocumentationComponent {
  graphTypes = {
    infosGlobal: infoGlobalGraphTypes,
    pie: pieGraphTypes,
    bar: barGraphTypes,
    line: lineGraphTypes,
    treemap: treemapGraphTypes,
    heatmap: heatmapGraphTypes,
    range: rangeGraphTypes,
    funnel: funnelGraphTypes,
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
  currentSection: string = 'getting-started';
  isGraphTypesOpen: boolean = false;
  isConfigOpen: boolean = false;
  isDataOpen: boolean = false;
  infoGeneralNotes: string[] = [
    "• Chaque famille de graphiques est optimisée pour un cas d'usage spécifique",
    '• La configuration de base reste consistante entre tous les types',
    '• La toolbar permet de basculer dynamiquement entre types compatibles',
    '• Les détails de configuration spécifiques sont disponibles dans les sections dédiées'
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
  globalConfigNotes: string[] = [
    '• Les propriétés height et series sont obligatoires',
    '• Le pivot et continue sont mutuellement exclusifs',
    "• 'stacked' n'est compatible qu'avec les types bar/column",
    '• Certaines options peuvent être écrasées par les configurations spécifiques des types'
  ];
  chartCompatibilityNotes: string[] = [
    '• Pie Charts : pie ↔ donut (même données, avec/sans trou central), polar ↔ radar (visualisation différente)',
    '• Bar Charts : bar ↔ column (orientation), compatible stacked et pivot',
    '• Line Charts : line ↔ area (avec/sans remplissage), compatible continue',
    '• Treemap Charts : treemap ↔ heatmap, supporte le groupement',
    '• Range Charts : rangeArea ↔ rangeBar ↔ rangeColumn, nécessite min/max',
    '• Funnel Charts : funnel ↔ pyramid, configuration spécifique pour le goulot'
  ];
  menuState: { [key: string]: boolean } = {
    config: false,
    data: false
  };

  toggleMenu(menuName: 'config' | 'data', event: Event) {
    event.stopPropagation();

    Object.keys(this.menuState).forEach(key => {
      if (key !== menuName) {
        this.menuState[key] = false;
      }
    });

    this.menuState[menuName] = !this.menuState[menuName];
  }

  selectSection(section: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.currentSection = section;
  }
}
