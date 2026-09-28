import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ChartClickEvent,
  ChartDrilldownConfig,
  ChartDrilldownRequest,
  ChartProvider,
  ChartType,
  OrganizerConfig as ChartOrganizerConfig,
  OrganizerState as ChartOrganizerState,
  UnitConfig,
  VisualSnapshot,
  VisualSnapshotDraft,
  convertChartDataValues,
  createUnitConverter,
  defineLinearUnit,
  field,
  formatChartValue,
  formatUnitValue,
  selectBestScale,
} from '@oneteme/jquery-core';
import { ChartComponent as HighchartsChartComponent } from '@oneteme/jquery-highcharts';
import {
  OrganizerButtonComponent,
  OrganizerButtonEvent,
  OrganizerConfig as OrganizerMenuConfig,
  OrganizerState as OrganizerMenuState,
} from '@oneteme/jquery-organizer';
import { mapChartConfig, mapChartData } from '../../basic-test/highcharts-test/map-test-data';

type ApiSource = 'Wrapper' | 'Core' | 'Highcharts natif';
type DemoKind =
  | 'loading'
  | 'theme'
  | 'rendered-option'
  | 'organizer'
  | 'group-sync'
  | 'drilldown'
  | 'export'
  | 'axes'
  | 'unit-conversion'
  | 'unit-scale'
  | 'toolbar'
  | 'map';

interface ApiEntry {
  name: string;
  type: string;
  source: ApiSource;
  description: string;
  code: string;
  types?: string;
}

interface ApiSection {
  id: string;
  title: string;
  description: string;
  example: string;
  entries: ApiEntry[];
}

interface CapabilityDemo {
  id: string;
  kind: DemoKind;
  title: string;
  description: string;
  code: string;
  origin?: string;
  copied?: boolean;
}

interface MonthlyRow {
  month: string;
  energy: number;
  production: number;
  temperature: number;
  forecast: number;
}

interface DrilldownRow {
  region: string;
  site: string;
  value: number;
}

@Component({
  selector: 'app-highcharts-api',
  standalone: true,
  imports: [CommonModule, RouterLink, HighchartsChartComponent, OrganizerButtonComponent],
  templateUrl: './highcharts-api.component.html',
  styleUrls: ['./highcharts-api.component.scss'],
})
export class HighchartsApiComponent {
  @ViewChild('exportChart') exportChart?: HighchartsChartComponent<string, number>;

  readonly apiSections: ApiSection[] = [
    {
      id: 'component',
      title: 'Composant <chart>',
      description: 'Les inputs Angular communs à tous les types de graphiques Highcharts.',
      example: `<chart
      type="line"
      [config]="config"
      [data]="rows"
      [isLoading]="loading"
      loadingLabel="Actualisation du graphique..."
      noDataLabel="Aucun résultat pour cette période"
      [theme]="theme"
      [renderedOption]="nativeOption"
      group="sales"
      groupSync="all"
      [organizer]="organizer"
      [organizerState]="organizerState"
      [drilldown]="drilldown"
      [copyFeedback]="{ enabled: true }"
      (chartClick)="onChartClick($event)"
      (renderError)="onError($event)"
      (drilldownRequest)="onDrilldownRequest($event)"
      (drilldownNavigate)="onDrilldownNavigate($event)">
    </chart>`,
      entries: [
        { name: 'type', type: 'ChartType', source: 'Wrapper', description: 'Choisit la famille de rendu. Le wrapper traduit les types communs vers les types Highcharts correspondants.', code: '<chart type="line" ...></chart>', types: 'Tous' },
        { name: 'config', type: 'ChartProvider<X, Y>', source: 'Core', description: 'Configuration déclarative commune aux renderers jquery-echarts et jquery-highcharts.', code: '<chart [config]="config" ...></chart>', types: 'Tous' },
        { name: 'data', type: 'any[]', source: 'Wrapper', description: 'Lignes brutes consommées par les DataProviders du ChartProvider.', code: '<chart [data]="rows" ...></chart>', types: 'Tous' },
        { name: 'isLoading', type: 'boolean', source: 'Wrapper', description: 'Pilote l’état de chargement côté Angular. Le wrapper appelle ensuite chart.showLoading() ou chart.hideLoading() et conserve les données existantes quand elles sont disponibles.', code: '<chart [isLoading]="loading" ...></chart>', types: 'Tous' },
        { name: 'loadingLabel / noDataLabel', type: 'string', source: 'Wrapper', description: 'Définit les textes transmis aux API natives Highcharts de chargement et d’absence de données. Ces inputs sont la manière recommandée de les personnaliser avec le composant Angular.', code: '<chart loadingLabel="Actualisation du graphique..." noDataLabel="Aucun résultat pour cette période" ...></chart>', types: 'Tous' },
        { name: 'theme', type: 'Highcharts.Options', source: 'Wrapper', description: 'Fusionne les options de style Highcharts au-dessus du graphique généré. Le provider et les données restent inchangés.', code: `const theme: Highcharts.Options = {
  chart: { backgroundColor: '#172554' },
  colors: ['#67e8f9', '#f0abfc', '#fde68a'],
};

<chart type="line" [config]="lineConfig" [data]="baseData"
  [theme]="theme"></chart>`, types: 'Tous' },
        { name: 'renderedOption', type: 'Highcharts.Options', source: 'Wrapper', description: 'Prend la priorité sur les options générées par config et theme pour les propriétés Highcharts en conflit. Le wrapper conserve toutefois ses événements et sa gestion des états.', code: '<chart [config]="config" [data]="data" [renderedOption]="nativeOption"></chart>', types: 'Tous' },
        { name: 'group / groupSync', type: 'string / GroupSyncMode', source: 'Wrapper', description: 'Relie les tooltips et les zooms entre instances Highcharts et ECharts portant le même groupe.', code: '<chart group="sales" groupSync="all" ...></chart>', types: 'Tous' },
        { name: 'organizer / organizerState', type: 'OrganizerConfig / OrganizerState', source: 'Wrapper', description: 'Applique la visibilité contrôlée des séries nommées sans muter le provider source.', code: '<chart [organizer]="organizer" [organizerState]="state" ...></chart>', types: 'Séries nommées' },
        { name: 'drilldown', type: 'ChartDrilldownConfig', source: 'Wrapper', description: 'Ajoute un fil d’Ariane et délègue au parent le chargement du niveau suivant.', code: '<chart [drilldown]="drilldown" (drilldownRequest)="onRequest($event)" ...></chart>', types: 'Tous' },
        { name: 'copyFeedback', type: 'VisualCopyFeedbackConfig', source: 'Wrapper', description: 'Configure le feedback visuel après la création d’un snapshot.', code: '<chart [copyFeedback]="{ enabled: true }" ...></chart>', types: 'Tous' },
      ],
    },
    {
      id: 'events-methods',
      title: 'Événements et méthodes',
      description: 'Les points d’intégration exposés par le composant standalone.',
      example: `@ViewChild('chart') chart!: HighchartsChartComponent<string, number>;

    <chart
      #chart
      type="line"
      [config]="config"
      [data]="data"
      (chartClick)="onChartClick($event)"
      (renderError)="onError($event)"
      (drilldownRequest)="onDrilldownRequest($event)"
      (drilldownNavigate)="onDrilldownNavigate($event)">
    </chart>

    <button (click)="chart.exportImage('sales', 'png', 2)">PNG</button>
    <button (click)="chart.exportData('sales', ';')">CSV</button>
    <button (click)="chart.createVisualSnapshot('Ventes')">Préparer un draft</button>
    <button (click)="chart.copyVisualSnapshot('Ventes filtrées')">Persister le snapshot</button>
    <button (click)="chart.zoomOut()">Réinitialiser le zoom</button>
    <button (click)="chart.toggleFullscreen()">Plein écran</button>`,
      entries: [
        { name: 'chartClick', type: 'EventEmitter<ChartClickEvent>', source: 'Wrapper', description: 'Remonte le point, sa série, sa valeur et ses options Highcharts.', code: '<chart (chartClick)="onChartClick($event)" ...></chart>' },
        { name: 'renderError', type: 'EventEmitter<ChartRenderError>', source: 'Wrapper', description: 'Remonte les erreurs de construction, de chargement de carte ou de rendu.', code: '<chart (renderError)="onError($event)" ...></chart>' },
        { name: 'drilldownRequest / drilldownNavigate', type: 'EventEmitter<...>', source: 'Wrapper', description: 'Permet au parent de piloter une navigation hiérarchique contrôlée.', code: '<chart (drilldownRequest)="onRequest($event)" ...></chart>' },
        { name: 'exportImage()', type: '(fileName, type, pixelRatio) => void', source: 'Wrapper', description: 'Exporte le SVG, PNG ou JPEG du chart courant.', code: 'this.chart.exportImage("sales", "png", 2);' },
        { name: 'exportData()', type: '(fileName, separator) => void', source: 'Wrapper', description: 'Exporte les données Highcharts en CSV avec le séparateur choisi.', code: 'this.chart.exportData("sales", ";");' },
        { name: 'createVisualSnapshot()', type: '() => VisualSnapshotDraft', source: 'Wrapper', description: 'Prépare un draft en mémoire avec la configuration, l’état et les données sérialisables. Aucun identifiant, horodatage ou stockage n’est créé à cette étape.', code: 'const draft = this.chart.createVisualSnapshot("Ventes");' },
        { name: 'copyVisualSnapshot()', type: '(label?) => VisualSnapshot | null', source: 'Wrapper', description: 'Appelle createVisualSnapshot(), ajoute id/date/schemaVersion, persiste via VisualSnapshotStorage, puis émet visualCopied.', code: 'const saved = this.chart.copyVisualSnapshot("Ventes filtrées");' },
        { name: 'toggleFullscreen()', type: '() => Promise<void>', source: 'Wrapper', description: 'Bascule le composant dans le mode plein écran géré par jquery-core.', code: 'await this.chart.toggleFullscreen();' },
        { name: 'zoomOut()', type: '() => void', source: 'Wrapper', description: 'Réinitialise le zoom Highcharts et propage les extrêmes initiaux aux graphiques du même groupe.', code: 'this.chart.zoomOut();' },
      ],
    },
    {
      id: 'wrapper-options',
      title: 'Options ajoutées par jquery-highcharts',
      description: 'Capacités illustrées dans la galerie ci-dessous. Elles ne sont pas des options Highcharts brutes à copier telles quelles.',
      example: `const config: ChartProvider<string, number> = {
  height: 280,
  showToolbar: true,
  mapEndpoint: 'assets/france-geojson/',
  series: [{
    name: 'Énergie',
    unit: 'MWh',
    showUnitOnAxis: false,
    yAxisIndex: 0,
    yAxisConfig: { title: { text: 'Énergie' } },
    data: { x: field('month'), y: field('value') },
  }],
  options: {
    donutCenter: { enabled: true, title: 'Total' },
    radialBar: { track: { enabled: true } },
  },
};`,
      entries: [
        { name: 'showToolbar', type: 'boolean', source: 'Wrapper', description: 'Ajoute la toolbar précédente et suivante au-dessus du rendu Highcharts.', code: 'config = { showToolbar: true, ...config };' },
        { name: 'height', type: 'number', source: 'Core', description: 'Dimension de mise en page explicite du host. Il s’agit d’une convention de conteneur, pas d’une capacité Highcharts particulière.', code: 'const config = { height: 280, series: [...] };' },
        { name: 'yUnit', type: 'string | UnitConfig', source: 'Core', description: 'Ajoute une unité fixe ou sélectionne automatiquement une échelle selon le maximum des valeurs. La scale choisie est appliquée aux graduations et au tooltip.', code: "yUnit: { baseUnit: 'unités', scales: [{ unit: 'unités', scale: 1, threshold: 999 }, { unit: 'k', scale: 0.001, threshold: 999999 }, { unit: 'M', scale: 0.000001, threshold: Infinity }] }" },
        { name: 'donutCenter', type: 'DonutCenterOptions', source: 'Wrapper', description: 'Ajoute un contenu central dynamique ou fixe au donut.', code: 'options: { donutCenter: { enabled: true, title: "Total" } }' },
        { name: 'radialBar', type: 'RadialBarOptions', source: 'Wrapper', description: 'Ajoute une piste de fond et une valeur centrale au radialBar.', code: 'options: { radialBar: { track: { enabled: true } } }' },
        { name: 'mapEndpoint', type: 'string', source: 'Wrapper', description: 'Charge automatiquement le GeoJSON et associe les codes de données aux régions.', code: 'config = { mapEndpoint: "assets/france-geojson/", ...config };' },
        { name: 'unit / showUnitOnAxis / yAxisIndex / yAxisConfig', type: 'SerieProvider', source: 'Core', description: 'Construit les axes multiples, garde l’unité dans le tooltip et permet de retirer le suffixe des graduations.', code: 'series: [{ unit: "MWh", showUnitOnAxis: false, yAxisIndex: 0, ... }]' },
      ],
    },
    {
      id: 'native',
      title: 'Options Highcharts natives',
      description: 'Highcharts fournit déjà plusieurs mécanismes. Le wrapper les laisse passer via config.options et les relie à des inputs Angular plus simples lorsque c’est utile.',
      example: `const config: ChartProvider<string, number> = {
  options: {
    plotOptions: { series: { animation: false } },
    lang: { loading: 'Chargement...', noData: 'Aucun résultat' },
    loading: { style: { opacity: 0.8 } },
    noData: { style: { color: '#526b73' } },
  },
  series: [{ name: 'Ventes', data: { x: field('month'), y: field('value') } }],
};

const nativeOption: Highcharts.Options = {
  chart: { type: 'areaspline' },
  xAxis: { categories: ['Jan', 'Fév', 'Mar'] },
  series: [{ type: 'areaspline', name: 'Option native', data: [4, 7, 5] }],
};

<chart
  type="line"
  [config]="config"
  [data]="data"
  [renderedOption]="nativeOption">
</chart>`,
      entries: [
        { name: 'config.options', type: 'Highcharts.Options partiel', source: 'Highcharts natif', description: 'Surcharge les options générées par le wrapper après le thème.', code: 'config = { options: { plotOptions: { series: { animation: false } } } };' },
        { name: 'loading / noData', type: 'LoadingOptions / NoDataOptions', source: 'Highcharts natif', description: 'Highcharts gère nativement l’écran de chargement avec chart.showLoading()/hideLoading(). L’affichage no-data est fourni par le module officiel no-data-to-display, chargé par jquery-highcharts; les textes se configurent avec lang.loading et lang.noData.', code: 'const nativeOptions: Highcharts.Options = { lang: { loading: "Chargement...", noData: "Aucun résultat" }, loading: { style: { opacity: 0.8 } }, noData: { style: { color: "#526b73" } } };' },
        { name: 'renderedOption', type: 'Highcharts.Options', source: 'Highcharts natif', description: 'Passe une option Highcharts complète. Pour chaque propriété définie à la fois dans theme et renderedOption, renderedOption gagne; les événements et états du wrapper restent appliqués.', code: `const nativeOption: Highcharts.Options = {
  chart: { type: 'areaspline' },
  xAxis: { categories: ['Jan', 'Fév', 'Mar'] },
  series: [{ type: 'areaspline', name: 'Option native', data: [4, 7, 5] }],
};

<chart type="line" [config]="config" [data]="data"
  [renderedOption]="nativeOption"></chart>` },
      ],
    },
  ];

  readonly demos: CapabilityDemo[] = [
    { id: 'loading', kind: 'loading', origin: 'NATIF HIGHCHARTS + WRAPPER', title: 'Chargement et absence de données', description: 'Highcharts fournit le rendu des deux états. Le wrapper ajoute une API Angular cohérente : isLoading=true affiche l’écran de chargement, tandis que data=[] affiche le message d’absence de données. Les deux états sont distincts.', code: `<!-- Dans le composant parent : isLoadingDemo est un booléen et loadingData vaut les lignes ou [] -->
<chart
  type="area"
  [config]="lineConfig"
  [data]="loadingData"
  [isLoading]="isLoadingDemo"
  loadingLabel="Actualisation du graphique..."
  noDataLabel="Aucun résultat pour cette période">
</chart>` },
    { id: 'theme', kind: 'theme', title: 'Thème Highcharts fusionné', description: 'Définissez un objet Highcharts.Options pour modifier l’apparence du graphique. Le thème change ici le fond, les couleurs, les axes et le titre, tandis que [config] et [data] continuent de fournir les données.', code: `const theme: Highcharts.Options = {
  chart: { backgroundColor: '#172554', borderRadius: 12 },
  title: { text: 'Un graphique avec un thème sombre' },
  colors: ['#67e8f9', '#f0abfc', '#fde68a'],
};

<chart
  type="line"
  [config]="lineConfig"
  [data]="baseData"
  [theme]="theme">
</chart>` },
    { id: 'rendered-option', kind: 'rendered-option', title: 'Rendered option autoritaire', description: 'Quand [renderedOption] est fourni, ses propriétés remplacent les valeurs concurrentes de config et theme. Ici, type="line", le titre du provider et data ne pilotent pas le contenu : le type, le titre, les catégories, le tooltip, l’axe Y et les séries viennent de nativeOption.', code: `const nativeOption: Highcharts.Options = {
  chart: { type: 'areaspline' },
  title: { text: 'Type et séries imposés par renderedOption' },
  xAxis: { categories: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'] },
  yAxis: { title: { text: "titre d'axe y forcé !" } },
  tooltip: { shared: true, valueSuffix: ' unités' },
  series: [{
    type: 'areaspline',
    name: 'Option native',
    data: [4, 7, 5, 9, 8, 11],
  }],
};

<chart
  type="line"
  [config]="{ title: 'Titre ignoré', series: [] }"
  [data]="[]"
  [renderedOption]="nativeOption">
</chart>` },
    { id: 'organizer', kind: 'organizer', title: 'Séries et type de graphique via Organizer', description: 'Le menu émet la visibilité des séries et le type choisi. Le parent conserve l’état puis réinjecte ce type dans [type] du composant Highcharts.', code: `const organizerMenuConfig = {
  chartTypes: [
    { id: 'line', label: 'Courbe' },
    { id: 'area', label: 'Aire' },
    { id: 'column', label: 'Colonnes' },
    { id: 'bar', label: 'Barres' },
  ],
  fields: [
    { id: 'Ventes', label: 'Ventes', visible: true },
    { id: 'Objectif', label: 'Objectif', visible: true },
  ],
};
let organizerMenuState = {
  visibleFields: ['Ventes', 'Objectif'],
  selectedChartType: 'line',
};
let organizerState = { selectedFieldIds: ['Ventes', 'Objectif'] };
let chartType = 'line';

function onOrganizerChange(event: OrganizerButtonEvent) {
  organizerMenuState = event.state;
  chartType = event.state.selectedChartType ?? chartType;
  organizerState = {
    ...organizerState,
    selectedFieldIds: event.state.visibleFields ?? [],
  };
}

<organizer-button
  [config]="organizerMenuConfig"
  [state]="organizerMenuState"
  (viewChange)="onOrganizerChange($event)">
</organizer-button>
<chart
  [type]="chartType"
  [config]="organizerChartConfig"
  [organizer]="{ enabled: true }"
  [organizerState]="organizerState"
  [data]="data">
</chart>` },
    { id: 'group-sync', kind: 'group-sync', title: 'Synchronisation tooltip et zoom', description: 'Survolez ou faites glisser horizontalement l’un des graphiques : le bus commun relaie le tooltip et les extrêmes aux deux instances. Le bouton « Réinitialiser le zoom » est natif à Highcharts.', code: `const group = 'sales';
const data = [
  { month: 'Jan', value: 1200 },
  { month: 'Fév', value: 1450 },
  { month: 'Mar', value: 1720 },
  { month: 'Avr', value: 1880 },
];
const config: ChartProvider<string, number> = {
  series: [{ name: 'Ventes', data: { x: field('month'), y: field('value') } }],
};

<chart type="line" [config]="config" [data]="data"
  [group]="group" groupSync="all"></chart>
<chart type="area" [config]="config" [data]="data"
  [group]="group" groupSync="all"></chart>` },
    { id: 'drilldown', kind: 'drilldown', title: 'Drilldown piloté par le parent', description: 'Le wrapper affiche le fil d’Ariane, le parent charge et remplace les données.', code: `<chart
  type="column"
  [config]="activeConfig"
  [data]="drilldownData"
  [drilldown]="drilldown"
  (drilldownRequest)="onDrilldown($event)">
</chart>` },
    { id: 'export', kind: 'export', title: 'Export image, données et snapshot', description: 'Les méthodes publiques restent disponibles, mais l’Organizer les regroupe dans un menu unique : export du visuel, export des données, snapshot et plein écran.', code: `readonly organizerConfig: OrganizerConfig = {
  showExport: true,
  onExportVisual: () => this.chart?.exportImage('sales', 'png', 2),
  onExportData: () => this.chart?.exportData('sales', ';'),
  showActions: true,
  onCopyVisual: () => this.chart?.copyVisualSnapshot('Sales'),
  onToggleFullscreen: () => this.chart?.toggleFullscreen(),
};

<organizer-button [config]="organizerConfig"></organizer-button>
<chart #chart type="column" [config]="config" [data]="data"></chart>` },
    { id: 'axes', kind: 'axes', title: 'Axes multiples et unités par série', description: 'Chaque série peut choisir son axe, conserver son unité dans le tooltip et masquer cette unité sur les graduations; un axe sans série visible disparaît.', code: `const config = {
  ytitle: ['Énergie', 'Température'],
  series: [
    { unit: 'MWh', showUnitOnAxis: true, yAxisIndex: 0, type: 'column', ... },
    { unit: '°C', showUnitOnAxis: false, yAxisIndex: 1, type: 'spline', ... },
  ],
};` },
    { id: 'unit-conversion', kind: 'unit-conversion', origin: 'CORE + HIGHCHARTS', title: 'Convertir les données avant le rendu', description: 'Le Core convertit les valeurs de mètres en kilomètres dans une nouvelle collection. Highcharts reçoit ensuite ces données déjà converties et affiche km sur l’axe et dans le tooltip.', code: `const units = createUnitConverter([
  defineLinearUnit('m', { factor: 1 }),
  defineLinearUnit('km', { factor: 1000 }),
]);
const data = convertChartDataValues(rows, ['value'], units, 'm', 'km');

const config: ChartProvider<string, number> = {
  series: [{
    name: 'Distance',
    unit: 'km',
    data: { x: field('month'), y: field('value') },
  }],
};

<chart type="column" [config]="config" [data]="data"></chart>` },
    { id: 'unit-scale', kind: 'unit-scale', origin: 'CORE + HIGHCHARTS', title: 'Choisir automatiquement l’échelle d’affichage', description: 'Les données restent dans leur unité source. yUnit sélectionne unités, k ou M selon le maximum des valeurs, puis Highcharts applique la même conversion à l’axe Y et au tooltip.', code: `const config: ChartProvider<string, number> = {
  ytitle: 'Volume',
  yUnit: {
    baseUnit: 'unités',
    scales: [
      { unit: 'unités', scale: 1, threshold: 999 },
      { unit: 'k', scale: 0.001, threshold: 999999 },
      { unit: 'M', scale: 0.000001, threshold: Infinity },
    ],
  },
  series: [{
    name: 'Volume',
    data: { x: field('step'), y: field('value') },
  }],
};

<chart type="line" [config]="config" [data]="rows"></chart>` },
    { id: 'toolbar', kind: 'toolbar', title: 'Toolbar', description: 'showToolbar ajoute les actions précédentes et suivantes au-dessus du rendu.', code: `<chart
  type="column"
  [config]="{ ...config, showToolbar: true }"
  [data]="data">
</chart>` },
    { id: 'map', kind: 'map', title: 'Carte GeoJSON chargée par endpoint', description: 'mapEndpoint charge la carte, mapParam choisit la subdivision et le wrapper relie les codes aux formes.', code: `const config = {
  mapEndpoint: 'assets/france-geojson/',
  mapParam: 'subdiv',
  mapDefaultValue: 'fr-region',
  series: [{ data: { x: field('code'), y: field('value') } }],
};` },
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
  readonly syncLineConfig: ChartProvider<string, number> = { ...this.lineConfig, height: 220 };
  readonly syncAreaConfig: ChartProvider<string, number> = { ...this.lineConfig, height: 220, title: 'Même groupe, autre vue' };
  readonly theme: any = {
    chart: { backgroundColor: '#172554', borderRadius: 12 },
    colors: ['#67e8f9', '#f0abfc', '#fde68a'],
    title: { text: 'Un graphique avec un thème sombre', style: { color: '#f8fafc', fontWeight: '700' } },
    xAxis: { labels: { style: { color: '#dbeafe' } }, lineColor: '#60a5fa' },
    yAxis: { labels: { style: { color: '#dbeafe' } }, gridLineColor: 'rgba(147, 197, 253, .2)' },
    legend: { itemStyle: { color: '#f8fafc' } },
  };
  readonly renderedOptionConfig: ChartProvider<string, number> = { series: [] };
  readonly renderedOption: any = {
    chart: { type: 'areaspline' },
    title: { text: 'Type et séries imposés par renderedOption' },
    subtitle: { text: 'Le provider ci-dessus ne fournit aucune série' },
    xAxis: { categories: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'] },
    yAxis: { title: { text: "titre d'axe y forcé !" } },
    tooltip: { shared: true, valueSuffix: ' unités' },
    plotOptions: { series: { animation: false } },
    series: [{ type: 'areaspline', name: 'Option native', color: '#c2410c', data: [4, 7, 5, 9, 8, 11] }],
  };
  readonly organizerConfig: ChartOrganizerConfig = { enabled: true };
  readonly organizerPossibleTypes: ChartType[] = ['line', 'area', 'column', 'bar'];
  readonly organizerChartTypes: NonNullable<OrganizerMenuConfig['chartTypes']> = [
    { id: 'line', label: 'Courbe', icon: 'show_chart' },
    { id: 'area', label: 'Aire', icon: 'area_chart' },
    { id: 'column', label: 'Colonnes', icon: 'bar_chart' },
    { id: 'bar', label: 'Barres', icon: 'insert_chart' },
  ];
  organizerChartType: ChartType = 'line';
  readonly organizerMenuConfig: OrganizerMenuConfig = {
    chartTypes: this.organizerChartTypes,
    fields: [
      { id: 'Ventes', label: 'Ventes', visible: true },
      { id: 'Objectif', label: 'Objectif', visible: true },
    ],
    buttonLabel: 'Séries',
    buttonIcon: 'tune',
    showButtonIcon: true,
  };
  organizerMenuState: OrganizerMenuState = {
    visibleFields: ['Ventes', 'Objectif'],
    selectedChartType: 'line',
  };
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
  readonly distanceSourceData = [
    { month: 'Jan', value: 1250 },
    { month: 'Fév', value: 1600 },
    { month: 'Mar', value: 1980 },
    { month: 'Avr', value: 2450 },
    { month: 'Mai', value: 2800 },
    { month: 'Juin', value: 3200 },
  ];
  readonly distanceConverter = createUnitConverter<'m' | 'km'>([
    defineLinearUnit('m', { factor: 1 }),
    defineLinearUnit('km', { factor: 1000 }),
  ]);
  readonly convertedDistanceData = convertChartDataValues(
    this.distanceSourceData,
    ['value'],
    this.distanceConverter,
    'm',
    'km',
  );
  readonly distanceConfig: ChartProvider<string, number> = {
    title: 'Distance convertie',
    ytitle: 'Distance',
    series: [{
      name: 'Distance',
      unit: 'km',
      color: '#0f766e',
      data: { x: field('month'), y: field('value') },
    }],
  };
  readonly compactData = [
    { step: 'Collecte', value: 1200 },
    { step: 'Calcul', value: 2350 },
    { step: 'Agrégation', value: 4180 },
    { step: 'Publication', value: 7600 },
  ];
  readonly compactUnitConfig: UnitConfig = {
    baseUnit: 'unités',
    scales: [
      { unit: 'unités', scale: 1, threshold: 999 },
      { unit: 'k', scale: 0.001, threshold: 999_999 },
      { unit: 'M', scale: 0.000001, threshold: Infinity },
    ],
  };
  readonly compactScaleExamples = [999, 1234.567, 1_250_000].map(value => {
    const scale = selectBestScale(this.compactUnitConfig, [value]);
    return {
      source: formatChartValue(value),
      selectedUnit: scale.unit,
      output: formatUnitValue(value, this.compactUnitConfig.baseUnit, scale),
    };
  });
  readonly compactConfig: ChartProvider<string, number> = {
    title: 'Échelle courte automatique',
    ytitle: 'Volume',
    yUnit: this.compactUnitConfig,
    series: [{
      name: 'Volume',
      color: '#c2410c',
      data: { x: field('step'), y: field('value') },
    }],
  };
  mixedConfig: ChartProvider<string, number> = this.createMixedConfig();
  readonly toolbarConfig: ChartProvider<string, number> = { ...this.lineConfig, showToolbar: true };
  readonly mapConfig: ChartProvider<string, number> = {
    ...mapChartConfig,
    showToolbar: false,
    mapEndpoint: '/assets/france-geojson/',
    title: 'Population par région',
  };
  readonly mapData = mapChartData;

  readonly group = 'highcharts-api-sync';
  private readonly emptyData: typeof this.baseData = [];
  isLoadingDemo = false;
  showNoDataDemo = false;
  snapshotDraft: VisualSnapshotDraft | null = null;
  lastSnapshot: VisualSnapshot | null = null;

  readonly drilldownConfig: ChartDrilldownConfig = {
    levels: [
      { id: 'region', label: 'Régions', groupBy: 'region' },
      { id: 'site', label: 'Sites', groupBy: 'site' },
    ],
    activeLevel: 'region',
  };
  drilldown = { ...this.drilldownConfig };
  activeDrilldownConfig: ChartProvider<string, number> = this.createDrilldownConfig('region');
  drilldownData: DrilldownRow[] = [
    { region: 'Nord', site: 'Lille', value: 42 },
    { region: 'Nord', site: 'Arras', value: 31 },
    { region: 'Sud', site: 'Toulouse', value: 27 },
    { region: 'Sud', site: 'Montpellier', value: 36 },
  ];

  get loadingData(): typeof this.baseData {
    return this.showNoDataDemo ? this.emptyData : this.baseData;
  }

  private createDrilldownConfig(level: 'region' | 'site'): ChartProvider<string, number> {
    return level === 'site'
      ? { title: 'Sites', series: [{ name: 'Valeur', data: { x: field('site'), y: field('value') } }] }
      : { title: 'Régions', series: [{ name: 'Valeur', data: { x: field('region'), y: field('value') } }] };
  }

  onOrganizerChange(event: OrganizerButtonEvent): void {
    this.organizerMenuState = event.state;
    if (event.state.selectedChartType) {
      this.organizerChartType = event.state.selectedChartType;
    }
    const selected = new Set(event.state.visibleFields ?? []);
    this.organizerState = {
      ...this.organizerState,
      selectedFieldIds: ['Ventes', 'Objectif'].filter(name => selected.has(name)),
    };
  }

  private createMixedConfig(): ChartProvider<string, number> {
    return {
      title: 'Énergie et température',
      ytitle: ['Énergie', 'Température'],
      series: [
        { name: 'Énergie', type: 'column', unit: 'MWh', showUnitOnAxis: true, yAxisIndex: 0, color: '#2563eb', data: { x: field('month'), y: field('value') } },
        { name: 'Température', type: 'spline', unit: '°C', showUnitOnAxis: false, yAxisIndex: 1, yAxisConfig: { opposite: true }, color: '#f97316', data: { x: field('month'), y: field('secondary') } },
      ],
      options: { tooltip: { shared: true }, plotOptions: { series: { animation: false } } },
    };
  }

  onDrilldownRequest(request: ChartDrilldownRequest): void {
    if (request.toLevel !== 'site') return;
    if (typeof request.value !== 'string' && typeof request.value !== 'number') return;
    const region = `${request.value}`;
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

  onChartClick(_event: ChartClickEvent): void {}

  onSnapshotCreated(snapshot: VisualSnapshot): void {
    this.lastSnapshot = snapshot;
  }

  exportVisual(): void {
    this.exportChart?.exportImage('highcharts-api', 'png', 2);
  }

  exportData(): void {
    this.exportChart?.exportData('highcharts-api', ';');
  }

  copyExportSnapshot(): void {
    const chart = this.exportChart;
    if (!chart) return;
    this.snapshotDraft = chart.createVisualSnapshot('API Highcharts');
    chart.copyVisualSnapshot('API Highcharts');
  }

  toggleExportFullscreen(): void {
    void this.exportChart?.toggleFullscreen();
  }

  formatJson(value: unknown): string {
    return JSON.stringify(value, null, 2) ?? '';
  }

  async copyCode(demo: CapabilityDemo): Promise<void> {
    await navigator.clipboard?.writeText(demo.code);
    demo.copied = true;
    window.setTimeout(() => demo.copied = false, 1500);
  }
}
