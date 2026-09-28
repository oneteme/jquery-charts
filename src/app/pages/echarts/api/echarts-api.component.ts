import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ChartClickEvent,
  ChartComponent,
  ChartDrilldownConfig,
  ChartDrilldownRequest,
  ChartRenderError,
  EChartsOption,
} from '@oneteme/jquery-echarts';
import {
  ChartProvider,
  OrganizerConfig as ChartOrganizerConfig,
  OrganizerState as ChartOrganizerState,
  VisualSnapshot,
  VisualSnapshotDraft,
  field,
} from '@oneteme/jquery-core';
import {
  OrganizerButtonComponent,
  OrganizerButtonEvent,
  OrganizerConfig as OrganizerMenuConfig,
  OrganizerState as OrganizerMenuState,
} from '@oneteme/jquery-organizer';

export type ApiSource = 'Wrapper' | 'ECharts natif';

export interface ApiEntry {
  name: string;
  type: string;
  source: ApiSource;
  description: string;
  code: string;
  types?: string;
}

export interface ApiSection {
  id: string;
  title: string;
  description: string;
  entries: ApiEntry[];
}

type DemoKind =
  | 'loading'
  | 'theme-renderer'
  | 'rendered-option'
  | 'organizer'
  | 'group-sync'
  | 'drilldown'
  | 'export';

interface CapabilityDemo {
  id: string;
  kind: DemoKind;
  title: string;
  description: string;
  code: string;
  origin?: string;
  copied?: boolean;
}

@Component({
  selector: 'app-echarts-api',
  standalone: true,
  imports: [CommonModule, RouterLink, ChartComponent, OrganizerButtonComponent],
  templateUrl: './echarts-api.component.html',
  styleUrls: ['./echarts-api.component.scss'],
})
export class EChartsApiComponent {
  @ViewChild('exportChart') exportChart?: ChartComponent<string, number>;

  readonly sections: ApiSection[] = [
    {
      id: 'component',
      title: 'Composant <chart>',
      description: 'Le composant Angular qui encapsule le rendu ECharts et les comportements ajoutés par jquery-echarts.',
      entries: [
        { name: 'type', type: 'ChartType', source: 'Wrapper', description: 'Choisit le type de graphique à afficher.', code: '<chart type="line" ...></chart>', types: 'Tous' },
        { name: 'config', type: 'ChartProvider<X, Y>', source: 'Wrapper', description: 'Passe la configuration de votre graphique au composant.', code: '<chart [config]="config" ...></chart>', types: 'Tous' },
        { name: 'data', type: 'any[]', source: 'Wrapper', description: 'Passe les lignes utilisées par les providers de données.', code: '<chart [data]="rows" ...></chart>', types: 'Tous' },
        { name: 'isLoading', type: 'boolean', source: 'Wrapper', description: 'Affiche le chargement natif pendant votre requête.', code: '<chart [isLoading]="loading" ...></chart>', types: 'Tous' },
        { name: 'loadingLabel / noDataLabel', type: 'string', source: 'Wrapper', description: 'Change les textes affichés pendant le chargement ou quand il n’y a aucune donnée.', code: '<chart loadingLabel="Chargement..." noDataLabel="Aucun résultat" ...></chart>', types: 'Tous' },
        { name: 'theme / renderer', type: 'string / \'svg\' | \'canvas\'', source: 'Wrapper', description: 'theme accepte un nom de thème ECharts enregistré ; light est le thème intégré le plus simple. renderer choisit le moteur de rendu SVG ou Canvas.', code: '<chart theme="light" renderer="svg" ...></chart>', types: 'Tous' },
        { name: 'group', type: 'string | null', source: 'Wrapper', description: 'Sert à relier plusieurs graphiques qui affichent des informations liées. Par exemple, un graphique des ventes et un graphique de la marge peuvent suivre la même période : sans le même group, chacun réagit seul ; avec group="sales-dashboard", ils peuvent être synchronisés.', code: '<chart group="sales-dashboard" ...></chart>\n<chart group="sales-dashboard" ...></chart>', types: 'Tous' },
        { name: 'groupSync', type: 'GroupSyncMode', source: 'Wrapper', description: 'Indique quelles interactions doivent être transmises entre les graphiques portant le même group. Utilisez "tooltip" pour déplacer le survol ensemble, "datazoom" pour conserver la même période zoomée, ou "all" pour les deux (valeur par défaut). groupSync ne relie pas les graphiques : il règle seulement ce qui circule entre eux.', code: '<chart group="sales-dashboard" groupSync="tooltip" ...></chart>\n<chart group="sales-dashboard" groupSync="tooltip" ...></chart>', types: 'Tous' },
        { name: 'organizer', type: 'OrganizerConfig', source: 'Wrapper', description: 'Active la gestion interne de la visibilité des séries nommées avec enabled: true. Le composant <chart> ne rend pas lui-même un bouton ou un panneau : l’interface Organizer doit être intégrée séparément.', code: '<chart [organizer]="{ enabled: true }" ...></chart>', types: 'Tous' },
        { name: 'drilldown', type: 'ChartDrilldownConfig', source: 'Wrapper', description: 'Ajoute un breadcrumb et une navigation entre plusieurs niveaux de données. L’application reste responsable de charger les données et de mettre à jour activeLevel.', code: '<chart [drilldown]="drilldown" (drilldownNavigate)="onNavigate($event)" ...></chart>', types: 'Tous' },
        { name: 'copyFeedback', type: 'VisualCopyFeedbackConfig', source: 'Wrapper', description: 'Configure le message affiché après une copie visuelle.', code: '<chart [copyFeedback]="{ enabled: true }" ...></chart>', types: 'Tous' },
      ],
    },
    {
      id: 'events-methods',
      title: 'Événements et méthodes',
      description: 'Les points d’intégration utilisés par l’application consommatrice.',
      entries: [
        { name: 'chartClick', type: 'EventEmitter<ChartClickEvent>', source: 'Wrapper', description: 'Récupère le point cliqué, son index, son nom, sa valeur et sa ligne.', code: '<chart (chartClick)="onChartClick($event)" ...></chart>' },
        { name: 'drilldownNavigate', type: 'EventEmitter<string>', source: 'Wrapper', description: 'Récupère le niveau demandé quand l’utilisateur clique sur le breadcrumb.', code: '<chart (drilldownNavigate)="onNavigate($event)" ...></chart>' },
        { name: 'drilldownStateChange', type: 'EventEmitter<ChartDrilldownState>', source: 'Wrapper', description: 'Informe l’application du niveau actuellement confirmé. active vaut true lorsque le graphique est à un niveau inférieur au premier niveau.', code: '<chart (drilldownStateChange)="onDrilldownState($event)" ...></chart>' },
        { name: 'drilldown-active', type: 'classe CSS hôte', source: 'Wrapper', description: 'Classe ajoutée au composant <chart> lorsque activeLevel est différent du premier niveau. La librairie ne lui applique aucun style : votre dashboard peut afficher une bordure, un badge ou un autre signal.', code: 'chart.drilldown-active { border: 2px solid #d97732; }' },
        { name: 'exportImage()', type: '(fileName, type, pixelRatio) => void', source: 'Wrapper', description: 'Exporte le graphique en PNG, JPEG ou SVG depuis une référence au composant.', code: 'this.chart.exportImage(\'sales.png\', \'png\');' },
        { name: 'exportData()', type: '(fileName, separator) => void', source: 'Wrapper', description: 'Exporte les données affichées en CSV.', code: 'this.chart.exportData(\'sales.csv\', \';\');' },
        { name: 'createVisualSnapshot()', type: '() => VisualSnapshotDraft', source: 'Wrapper', description: 'Prépare une copie des données et de l’état du graphique.', code: 'const draft = this.chart.createVisualSnapshot(\'Ventes\');' },
        { name: 'copyVisualSnapshot()', type: '(label?) => VisualSnapshot | null', source: 'Wrapper', description: 'Crée et enregistre un snapshot visuel nommé.', code: 'this.chart.copyVisualSnapshot(\'Ventes filtrées\');' },
      ],
    },
  ];

  readonly demos: CapabilityDemo[] = [
    {
      id: 'loading',
      kind: 'loading',
      origin: 'NATIF ECHARTS + WRAPPER',
      title: 'Chargement et absence de données',
      description: 'ECharts affiche les deux états via le wrapper : isLoading=true conserve le graphique sous masque de chargement, tandis que data=[] affiche le message d’absence de données. Les deux états restent distincts.',
      code: `<chart
  type="area"
  [config]="lineConfig"
  [data]="loadingData"
  [isLoading]="isLoadingDemo"
  loadingLabel="Actualisation du graphique..."
  noDataLabel="Aucun résultat pour cette période">
</chart>`,
    },
    {
      id: 'theme-renderer',
      kind: 'theme-renderer',
      origin: 'WRAPPER',
      title: 'Thème et moteur de rendu',
      description: 'theme est lu à la création de l’instance ECharts ; renderer choisit SVG ou Canvas. Les deux vues utilisent le même provider et les mêmes données.',
      code: `<chart
  type="line"
  [config]="lineConfig"
  [data]="data"
  theme="light"
  renderer="canvas">
</chart>`,
    },
    {
      id: 'rendered-option',
      kind: 'rendered-option',
      origin: 'ECHARTS NATIF',
      title: 'Rendered option autoritaire',
      description: 'Quand renderedOption est fourni, l’option ECharts complète prend la main sur la construction issue du ChartProvider : titre, axes, tooltip et séries viennent directement de l’option native.',
      code: `const nativeOption: EChartsOption = {
  title: { text: 'Option ECharts fournie directement' },
  xAxis: { type: 'category', data: ['Jan', 'Fév', 'Mar'] },
  yAxis: { type: 'value' },
  series: [{ type: 'line', data: [4, 7, 5] }],
};

<chart [config]="{ series: [] }" [data]="data"
  [renderedOption]="nativeOption"></chart>`,
    },
    {
      id: 'organizer',
      kind: 'organizer',
      origin: 'WRAPPER',
      title: 'Visibilité des séries via OrganizerState',
      description: 'Le menu Organizer émet visibleFields. Le parent traduit cet état en selectedFieldIds ; ECharts reconstruit ensuite les séries visibles sans muter la configuration source.',
      code: `const organizerState = {
  selectedFieldIds: ['Ventes', 'Objectif'],
};

<organizer-button
  [config]="organizerMenuConfig"
  [state]="organizerMenuState"
  (viewChange)="onOrganizerChange($event)">
</organizer-button>
<chart [config]="organizerConfig" [data]="data"
  [organizer]="{ enabled: true }"
  [organizerState]="organizerState"></chart>`,
    },
    {
      id: 'group-sync',
      kind: 'group-sync',
      origin: 'WRAPPER + CORE',
      title: 'Synchronisation tooltip et zoom',
      description: 'Deux instances ECharts portant le même group relaient les interactions déclarées par groupSync. Ici, le survol et le datazoom sont synchronisés.',
      code: `<chart type="line" [config]="config" [data]="data"
  group="sales" groupSync="all"></chart>
<chart type="area" [config]="config" [data]="data"
  group="sales" groupSync="all"></chart>`,
    },
    {
      id: 'drilldown',
      kind: 'drilldown',
      origin: 'WRAPPER',
      title: 'Drilldown piloté par le parent',
      description: 'Le wrapper affiche le breadcrumb et émet drilldownRequest. Le parent charge le niveau demandé, remplace les données et pilote activeLevel.',
      code: `<chart
  type="column"
  [config]="activeConfig"
  [data]="drilldownData"
  [drilldown]="drilldown"
  (drilldownRequest)="onDrilldownRequest($event)"
  (drilldownNavigate)="onDrilldownNavigate($event)">
</chart>`,
    },
    {
      id: 'export',
      kind: 'export',
      origin: 'WRAPPER',
      title: 'Export image, données et snapshot',
      description: 'Les méthodes publiques du composant restent disponibles, mais l’Organizer les regroupe dans un menu unique : export du visuel, export des données, snapshot et plein écran.',
      code: `readonly organizerConfig: OrganizerConfig = {
  showExport: true,
  onExportVisual: () => this.chart?.exportImage('sales', 'png', 2),
  onExportData: () => this.chart?.exportData('sales', ';'),
  showActions: true,
  onCopyVisual: () => this.chart?.copyVisualSnapshot('Sales'),
  onToggleFullscreen: () => this.chart?.toggleFullscreen(),
};

<organizer-button [config]="organizerConfig"></organizer-button>
<chart #chart type="column" [config]="config" [data]="data"
  [copyFeedback]="{ enabled: true }"></chart>`,
    },
  ];

  readonly baseData = [
    { month: 'Jan', value: 1200, secondary: 5 },
    { month: 'Fév', value: 1450, secondary: 7 },
    { month: 'Mar', value: 1720, secondary: 11 },
    { month: 'Avr', value: 1880, secondary: 14 },
    { month: 'Mai', value: 2140, secondary: 18 },
    { month: 'Juin', value: 2360, secondary: 22 },
  ];

  readonly lineConfig: ChartProvider<string, number> = {
    title: 'Ventes mensuelles',
    series: [{ name: 'Ventes', color: '#0f766e', data: { x: field('month'), y: field('value') } }],
  };
  readonly rendererConfig: ChartProvider<string, number> = { ...this.lineConfig, height: 280 };
  readonly theme = 'light';
  readonly syncLineConfig: ChartProvider<string, number> = { ...this.lineConfig, height: 220 };
  readonly syncAreaConfig: ChartProvider<string, number> = { ...this.lineConfig, height: 220, title: 'Même groupe, autre vue' };
  readonly renderedOptionConfig: ChartProvider<string, number> = { series: [] };
  readonly renderedOption: EChartsOption = {
    title: { text: 'Option ECharts fournie directement', subtext: 'Le provider ci-dessus ne fournit aucune série' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'] },
    yAxis: { type: 'value' },
    series: [{ type: 'line', name: 'Option native', data: [4, 7, 5, 9, 8, 11] }],
  };

  readonly organizerConfig: ChartOrganizerConfig = { enabled: true };
  readonly organizerMenuConfig: OrganizerMenuConfig = {
    fields: [
      { id: 'Ventes', label: 'Ventes', visible: true },
      { id: 'Objectif', label: 'Objectif', visible: true },
    ],
    buttonLabel: 'Séries',
    buttonIcon: 'tune',
    showButtonIcon: true,
  };
  organizerMenuState: OrganizerMenuState = { visibleFields: ['Ventes', 'Objectif'] };
  organizerState: ChartOrganizerState = {
    selectedFieldIds: ['Ventes', 'Objectif'],
    groupByKey: null,
    dynamicSliceKeys: [],
  };
  readonly organizerChartConfig: ChartProvider<string, number> = {
    title: 'Séries visibles contrôlées',
    series: [
      { name: 'Ventes', color: '#0f766e', data: { x: field('month'), y: field('value') } },
      { name: 'Objectif', color: '#d97732', data: { x: field('month'), y: field('secondary') } },
    ],
  };
  readonly organizerSeries = [
    { name: 'Ventes', color: '#0f766e' },
    { name: 'Objectif', color: '#d97732' },
  ];
  readonly exportOrganizerConfig: OrganizerMenuConfig = {
    buttonLabel: 'Organizer',
    buttonIcon: 'tune',
    showButtonIcon: true,
    showExport: true,
    onExportVisual: () => this.exportVisual(),
    onExportData: () => this.exportData(),
    showActions: true,
    actions: { label: 'Actions du graphique', showCopy: true, showFullscreen: true },
    onCopyVisual: () => this.copyExportSnapshot(),
    onToggleFullscreen: () => this.toggleExportFullscreen(),
  };
  readonly exportOrganizerState: OrganizerMenuState = {};

  readonly group = 'echarts-api-sync';
  private readonly emptyData: typeof this.baseData = [];
  isLoadingDemo = false;
  showNoDataDemo = false;
  snapshotDraft: VisualSnapshotDraft | null = null;
  lastSnapshot: VisualSnapshot | null = null;
  lastChartClick = 'Aucun clic capturé';
  lastRenderError = '';

  readonly drilldownConfig: ChartDrilldownConfig = {
    levels: [
      { id: 'region', label: 'Régions', groupBy: 'region' },
      { id: 'site', label: 'Sites', groupBy: 'site' },
    ],
    activeLevel: 'region',
  };
  drilldown = { ...this.drilldownConfig };
  activeDrilldownConfig: ChartProvider<string, number> = this.createDrilldownConfig('region');
  drilldownData = [
    { region: 'Nord', site: 'Lille', value: 42 },
    { region: 'Nord', site: 'Arras', value: 31 },
    { region: 'Sud', site: 'Toulouse', value: 27 },
    { region: 'Sud', site: 'Montpellier', value: 36 },
  ];

  get loadingData(): typeof this.baseData {
    return this.showNoDataDemo ? this.emptyData : this.baseData;
  }

  toggleLoadingDemo(): void {
    this.isLoadingDemo = !this.isLoadingDemo;
    if (this.isLoadingDemo) this.showNoDataDemo = false;
  }

  toggleNoDataDemo(): void {
    this.showNoDataDemo = !this.showNoDataDemo;
    if (this.showNoDataDemo) this.isLoadingDemo = false;
  }

  onOrganizerChange(event: OrganizerButtonEvent): void {
    this.organizerMenuState = event.state;
    const selected = new Set(event.state.visibleFields ?? []);
    this.organizerState = {
      ...this.organizerState,
      selectedFieldIds: ['Ventes', 'Objectif'].filter(name => selected.has(name)),
    };
  }

  onChartClick(event: ChartClickEvent): void {
    this.lastChartClick = JSON.stringify({ name: event.name, value: event.value });
  }

  onRenderError(event: ChartRenderError): void {
    this.lastRenderError = typeof event.error === 'string' ? event.error : this.formatJson(event.error);
  }

  onSnapshotCreated(snapshot: VisualSnapshot): void {
    this.lastSnapshot = snapshot;
  }

  exportVisual(): void {
    this.exportChart?.exportImage('echarts-api', 'png', 2);
  }

  exportData(): void {
    this.exportChart?.exportData('echarts-api', ';');
  }

  copyExportSnapshot(): void {
    const chart = this.exportChart;
    if (!chart) return;
    this.snapshotDraft = chart.createVisualSnapshot('API ECharts');
    chart.copyVisualSnapshot('API ECharts');
  }

  toggleExportFullscreen(): void {
    void this.exportChart?.toggleFullscreen();
  }

  onDrilldownRequest(request: ChartDrilldownRequest): void {
    if (request.toLevel !== 'site') return;
    const region = typeof request.value === 'string' ? request.value : this.formatJson(request.value);
    if (!region) return;
    this.drilldownData = this.drilldownData.filter(row => row.region === region);
    this.drilldown = { ...this.drilldown, activeLevel: 'site' };
    this.activeDrilldownConfig = this.createDrilldownConfig('site');
  }

  onDrilldownNavigate(levelId: string): void {
    if (levelId !== 'region') return;
    this.drilldownData = [
      { region: 'Nord', site: 'Lille', value: 42 },
      { region: 'Nord', site: 'Arras', value: 31 },
      { region: 'Sud', site: 'Toulouse', value: 27 },
      { region: 'Sud', site: 'Montpellier', value: 36 },
    ];
    this.drilldown = { ...this.drilldown, activeLevel: 'region' };
    this.activeDrilldownConfig = this.createDrilldownConfig('region');
  }

  private createDrilldownConfig(level: 'region' | 'site'): ChartProvider<string, number> {
    return level === 'site'
      ? { title: 'Sites', series: [{ name: 'Valeur', data: { x: field('site'), y: field('value') } }] }
      : { title: 'Régions', series: [{ name: 'Valeur', data: { x: field('region'), y: field('value') } }] };
  }

  formatJson(value: unknown): string {
    return JSON.stringify(value, null, 2) ?? '';
  }

  async copyCode(demo: CapabilityDemo): Promise<void> {
    await navigator.clipboard?.writeText(demo.code);
    demo.copied = true;
    window.setTimeout(() => demo.copied = false, 1500);
  }

  getSectionExample(section: ApiSection): string {
    return section.entries
      .map(entry => `// ${entry.name}\n${entry.code}`)
      .join('\n\n');
  }
}
