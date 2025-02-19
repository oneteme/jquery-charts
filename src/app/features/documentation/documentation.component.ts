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
} from './components/contenu/graphTypes/_index';
import {
  globalChartConfig,
  pieChartConfig,
  barChartConfig,
  lineChartConfig,
  treemapChartConfig,
  heatmapChartConfig,
  rangeChartConfig,
  funnelChartConfig,
} from './components/contenu/configs/_index';
import {
  dataCombine,
  dataProviders,
  dataValues,
  dataFields,
  dataStructure,
} from './components/contenu/data/_index';

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
  chartTypeNotes: string[] = [
    'Le symbole ↔ indique que les types peuvent être basculés entre eux',
    'Certains types partagent les mêmes données mais offrent des visualisations différentes',
    "La propriété 'pivot' n'est pas disponible pour tous les types",
    "'stacked' ne fonctionne qu'avec les types bar/column",
  ];

  gettingStartedNotes: string[] = [
    "Il est recommandé de suivre la documentation dans l'ordre proposé",
    'Commencez par explorer les différents types de graphiques disponibles',
    'Puis approfondissez avec les options de configuration spécifiques',
    'La section Data (prochainement disponible) vous permettra de maitriser la structuration des données',
  ];

  toggleGraphTypesMenu(event: Event) {
    event.stopPropagation();
    this.isGraphTypesOpen = !this.isGraphTypesOpen;
  }

  toggleConfigMenu(event: Event) {
    event.stopPropagation();
    this.isConfigOpen = !this.isConfigOpen;
  }

  toggleDataMenu(event: Event) {
    event.stopPropagation();
    this.isDataOpen = !this.isDataOpen;
  }

  selectSection(section: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.currentSection = section;
  }
}
