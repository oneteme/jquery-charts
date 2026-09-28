import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChartComponent as ApexChartComponent } from '@oneteme/jquery-apexcharts';
import {
  ChartClickEvent,
  ChartDrilldownConfig,
  ChartDrilldownRequest,
  ChartProvider,
  ChartRenderError,
  ChartType,
  OrganizerConfig as ChartOrganizerConfig,
  OrganizerState as ChartOrganizerState,
  VisualSnapshot,
  VisualSnapshotDraft,
  field,
  rangeFields,
} from '@oneteme/jquery-core';
import {
  OrganizerButtonComponent,
  OrganizerButtonEvent,
  OrganizerConfig as OrganizerMenuConfig,
  OrganizerState as OrganizerMenuState,
} from '@oneteme/jquery-organizer';

type ApiSource = 'Wrapper' | 'Core' | 'ApexCharts natif';

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

interface FamilyDemo {
  id: string;
  label: string;
  types: ChartType[];
  currentType: ChartType;
  config: ChartProvider<any, any>;
  data: any[];
}

interface CompleteOrganizerRow {
  month: string;
  week: string;
  region: string;
  channel: string;
  revenue: number;
  orders: number;
  margin: number;
}

type CompleteOrganizerDimension = 'month' | 'week' | 'region';
type CompleteOrganizerMetric = 'revenue' | 'orders' | 'margin';
type CompleteOrganizerGroup = 'region' | 'channel';
type CompleteOrganizerAggregate = 'sum' | 'average' | 'count' | 'min' | 'max';

interface CompleteOrganizerProjectedRow {
  [key: string]: string | number;
}

interface CompleteOrganizerTableColumn {
  name: string;
  valueKey: string;
}

@Component({
  selector: 'app-apexcharts-api',
  standalone: true,
  imports: [CommonModule, RouterLink, ApexChartComponent, OrganizerButtonComponent],
  templateUrl: './apexcharts-api.component.html',
  styleUrls: ['./apexcharts-api.component.scss'],
})
export class ApexChartsApiComponent {
  @ViewChild('exportChart') exportChart?: ApexChartComponent<string, number>;
  @ViewChild('completeOrganizerChart') completeOrganizerChart?: ApexChartComponent<string, number>;

  readonly sections: ApiSection[] = [
    {
      id: 'component',
      title: 'Composant <chart>',
      description: 'Le composant Angular public qui construit un graphique ApexCharts à partir du modèle ChartProvider.',
      example: `<chart
  type="line"
  [config]="config"
  [data]="rows"
  [isLoading]="loading"
  loadingLabel="Actualisation..."
  noDataLabel="Aucun résultat"
  [organizer]="{ enabled: true }"
  [organizerState]="organizerState"
  group="sales"
  groupSync="all"
  [drilldown]="drilldown"
  [copyFeedback]="{ enabled: true }"
  (chartClick)="onChartClick($event)"
  (renderError)="onRenderError($event)">
</chart>`,
      entries: [
        { name: 'type', type: 'ChartType', source: 'Wrapper', description: 'Sélectionne le renderer interne et traduit les types communs vers les types ApexCharts correspondants.', code: '<chart type="line" ...></chart>', types: 'line, area, bar, column, funnel, pyramid, pie, donut, polar, radar, radial, heatmap, treemap, rangeArea, rangeBar, rangeColumn' },
        { name: 'config', type: 'ChartProvider<X, Y>', source: 'Core', description: 'Décrit les séries, les coordonnées et les options communes. Le wrapper relit notamment title, subtitle, axes, dimensions, pivot, stacked et showToolbar.', code: '<chart [config]="config" ...></chart>', types: 'Tous' },
        { name: 'data', type: 'any[]', source: 'Wrapper', description: 'Lignes brutes utilisées par jquery-core pour construire les séries ApexCharts.', code: '<chart [data]="rows" ...></chart>', types: 'Tous' },
        { name: 'isLoading', type: 'boolean', source: 'Wrapper', description: 'Bascule le texte no-data vers loadingLabel pendant le chargement. Avec un tableau vide, ApexCharts affiche cet état.', code: '<chart [isLoading]="loading" ...></chart>', types: 'Tous' },
        { name: 'loadingLabel / noDataLabel', type: 'string', source: 'Wrapper', description: 'Personnalise les deux messages gérés par le wrapper lorsque le graphique charge ou ne contient aucune donnée.', code: '<chart loadingLabel="Actualisation..." noDataLabel="Aucun résultat" ...></chart>', types: 'Tous' },
        { name: 'debug', type: 'boolean', source: 'Wrapper', description: 'Active les logs de cycle de vie et d’hydratation dans la console du navigateur.', code: '<chart [debug]="true" ...></chart>', types: 'Tous' },
        { name: 'enablePivot', type: 'boolean', source: 'Wrapper', description: 'Active explicitement le bouton et la logique de pivot. La valeur par défaut est false pour ApexCharts.', code: '<chart [enablePivot]="true" ...></chart>', types: 'line, area, bar, column' },
        { name: 'theme', type: 'Record<string, unknown>', source: 'Wrapper', description: 'Fusionne un thème ApexCharts dans les options du graphique.', code: '<chart [theme]="theme" ...></chart>', types: 'Tous' },
        { name: 'renderedOption', type: 'unknown', source: 'Wrapper', description: 'Ajoute une option ApexCharts déjà rendue lors de la création ou de la recréation de l’instance, après les options communes.', code: '<chart [renderedOption]="nativeOption" ...></chart>', types: 'Tous' },
        { name: 'group / groupSync', type: 'string / GroupSyncMode', source: 'Wrapper', description: 'Synchronise le tooltip et le zoom entre les graphiques partageant le même groupe. groupSync vaut all, tooltip, datazoom ou un tableau de ces actions.', code: '<chart group="sales" groupSync="all" ...></chart>', types: 'Tous' },
        { name: 'organizer / organizerState', type: 'OrganizerConfig / OrganizerState', source: 'Wrapper', description: 'Applique la visibilité contrôlée des séries nommées sans muter le provider source. L’interface Organizer reste intégrée par l’application consommatrice.', code: '<chart [organizer]="{ enabled: true }" [organizerState]="state" ...></chart>', types: 'Séries nommées' },
        { name: 'view', type: 'OrganizerConfig', source: 'Wrapper', description: 'Alias historique de organizer, conservé pour compatibilité avec les intégrations existantes.', code: '<chart [view]="organizerConfig" ...></chart>', types: 'Compatibilité' },
        { name: 'drilldown', type: 'ChartDrilldownConfig', source: 'Wrapper', description: 'Affiche le fil d’Ariane et délègue au parent le chargement du niveau suivant via drilldownRequest.', code: '<chart [drilldown]="drilldown" (drilldownRequest)="onRequest($event)" ...></chart>', types: 'Tous' },
        { name: 'copyFeedback', type: 'VisualCopyFeedbackConfig', source: 'Wrapper', description: 'Configure le message temporaire affiché après la création d’un snapshot visuel.', code: '<chart [copyFeedback]="{ enabled: true }" ...></chart>', types: 'Tous' },
      ],
    },
    {
      id: 'events-methods',
      title: 'Événements et méthodes',
      description: 'Les points d’intégration exposés par le composant standalone ApexCharts.',
      example: `@ViewChild('chart') chart!: ApexChartComponent<string, number>;

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

chart.exportImage('sales', 'png', 2);
chart.exportData('sales', ';');
chart.copyVisualSnapshot('Ventes filtrées');
await chart.toggleFullscreen();`,
      entries: [
        { name: 'customEvent', type: 'EventEmitter<ChartCustomEvent>', source: 'Wrapper', description: 'Remonte les commandes de toolbar previous, next et pivot traitées par le composant.', code: '<chart (customEvent)="onToolbarEvent($event)" ...></chart>' },
        { name: 'chartClick', type: 'EventEmitter<ChartClickEvent>', source: 'Wrapper', description: 'Remonte la série, l’index, le nom et la valeur du point sélectionné dans ApexCharts.', code: '<chart (chartClick)="onChartClick($event)" ...></chart>' },
        { name: 'renderError', type: 'EventEmitter<ChartRenderError>', source: 'Wrapper', description: 'Remonte les erreurs de construction, de rendu ou de mise à jour.', code: '<chart (renderError)="onError($event)" ...></chart>' },
        { name: 'drilldownRequest / drilldownNavigate', type: 'EventEmitter<...>', source: 'Wrapper', description: 'Permet au parent de charger un niveau hiérarchique et de piloter le retour dans le fil d’Ariane.', code: '<chart (drilldownRequest)="onRequest($event)" ...></chart>' },
        { name: 'drilldownStateChange', type: 'EventEmitter<ChartDrilldownState>', source: 'Wrapper', description: 'Informe le parent du niveau actif et de l’état du drilldown après une modification de sa configuration.', code: '<chart (drilldownStateChange)="onStateChange($event)" ...></chart>' },
        { name: 'visualCopied', type: 'EventEmitter<VisualSnapshot>', source: 'Wrapper', description: 'Émet le snapshot persistant créé par copyVisualSnapshot().', code: '<chart (visualCopied)="onSnapshot($event)" ...></chart>' },
        { name: 'exportImage()', type: '(fileName, type, pixelRatio) => void', source: 'Wrapper', description: 'Exporte le rendu courant en PNG, JPEG ou SVG.', code: 'this.chart.exportImage("sales", "png", 2);' },
        { name: 'exportData()', type: '(fileName, separator) => void', source: 'Wrapper', description: 'Exporte les données ApexCharts en CSV avec le séparateur choisi.', code: 'this.chart.exportData("sales", ";");' },
        { name: 'createVisualSnapshot()', type: '() => VisualSnapshotDraft', source: 'Wrapper', description: 'Prépare un draft sérialisable avec la configuration, l’état Organizer et les données.', code: 'const draft = this.chart.createVisualSnapshot("Ventes");' },
        { name: 'copyVisualSnapshot()', type: '(label?) => VisualSnapshot | null', source: 'Wrapper', description: 'Crée, persiste et émet un snapshot visuel nommé.', code: 'const snapshot = this.chart.copyVisualSnapshot("Ventes filtrées");' },
        { name: 'applyVisualSnapshot()', type: '(snapshot) => VisualSnapshotApplyResult', source: 'Wrapper', description: 'Restaure les visibilités compatibles et retourne les éléments appliqués, ignorés et les avertissements.', code: 'const result = this.chart.applyVisualSnapshot(snapshot);' },
        { name: 'toggleFullscreen()', type: '() => Promise<void>', source: 'Wrapper', description: 'Bascule l’élément chart dans le mode plein écran géré par jquery-core.', code: 'await this.chart.toggleFullscreen();' },
      ],
    },
    {
      id: 'provider',
      title: 'ChartProvider consommé par ApexCharts',
      description: 'Les champs du modèle partagé qui ont un effet concret dans les directives ApexCharts.',
      example: `const config: ChartProvider<string, number> = {
  title: 'Temps de réponse',
  subtitle: 'P50 et P95',
  height: 320,
  showToolbar: true,
  continue: false,
  series: [
    { name: 'P50', data: { x: field('week'), y: field('p50') } },
    { name: 'P95', data: { x: field('week'), y: field('p95') } },
  ],
  options: { stroke: { curve: 'smooth' } },
};`,
      entries: [
        { name: 'series', type: 'SerieProvider<X, Y>[]', source: 'Core', description: 'Construit les séries et leurs coordonnées avec field(), des fonctions x/y ou la forme sérialisable { xField, yField }. name, color, stack, visible, unit et yAxisIndex sont conservés lors de la construction.', code: "series: [{ name: 'P50', data: { x: field('week'), y: field('p50') } }]" },
        { name: 'title / subtitle', type: 'string', source: 'Wrapper', description: 'Sont convertis vers les options title et subtitle natives d’ApexCharts.', code: "{ title: 'Ventes', subtitle: 'Mensuel' }" },
        { name: 'xtitle / ytitle', type: 'string | string[]', source: 'Wrapper', description: 'Alimente les titres des axes xaxis et yaxis. ytitle peut décrire plusieurs axes.', code: "{ xtitle: 'Mois', ytitle: 'k€' }" },
        { name: 'width / height', type: 'number', source: 'Wrapper', description: 'Définit les dimensions transmises aux options chart d’ApexCharts.', code: '{ width: 720, height: 320 }' },
        { name: 'stacked', type: 'boolean', source: 'Wrapper', description: 'Active le mode empilé dans les graphiques à barres et colonnes.', code: '{ stacked: true }' },
        { name: 'pivot / continue / xorder', type: 'boolean / boolean / Sort', source: 'Core', description: 'Contrôle la construction commune des données : pivot des séries, coordonnées continues [x, y] et ordre des catégories.', code: "{ pivot: false, continue: false, xorder: 'asc' }" },
        { name: 'showToolbar', type: 'boolean', source: 'Wrapper', description: 'Affiche la toolbar ApexCharts et les commandes de navigation ajoutées par le wrapper. Le pivot reste désactivé tant que enablePivot n’est pas activé.', code: '{ showToolbar: true }' },
        { name: 'options', type: 'ApexCharts options', source: 'ApexCharts natif', description: 'Surcharge les options natives après les options communes. C’est le point d’extension pour stroke, colors, tooltip, plotOptions, annotations, zoom, dataLabels, etc.', code: "options: { stroke: { curve: 'smooth' }, colors: ['#176b72'] }" },
      ],
    },
    {
      id: 'types',
      title: 'Types et transformations',
      description: 'Les cinq directives internes regroupent les types en familles et adaptent les données au format attendu par ApexCharts.',
      example: `<chart type="rangeBar" [config]="rangeConfig" [data]="rangeRows"></chart>

// Le même composant peut recevoir un autre type de la famille.
<chart type="rangeColumn" [config]="rangeConfig" [data]="rangeRows"></chart>`,
      entries: [
        { name: 'line-chart', type: '[line-chart]', source: 'Wrapper', description: 'Gère line et area, les séries multi-indicateurs et les coordonnées catégorielles, numériques ou temporelles.', code: '<chart type="line" ...></chart>', types: 'line, area' },
        { name: 'bar-chart', type: '[bar-chart]', source: 'Wrapper', description: 'Gère bar, column, funnel et pyramid. funnel et pyramid trient les lignes selon la mesure principale et désactivent le pivot.', code: '<chart type="funnel" ...></chart>', types: 'bar, column, funnel, pyramid' },
        { name: 'pie-chart', type: '[pie-chart]', source: 'Wrapper', description: 'Transforme une série commune en valeurs et labels ApexCharts pour les vues circulaires. radar accepte plusieurs séries.', code: '<chart type="donut" ...></chart>', types: 'pie, donut, polar, radial, radar' },
        { name: 'treemap-chart', type: '[treemap-chart]', source: 'Wrapper', description: 'Construit les séries nécessaires aux vues de matrice et de hiérarchie.', code: '<chart type="heatmap" ...></chart>', types: 'heatmap, treemap' },
        { name: 'range-chart', type: '[range-chart]', source: 'Wrapper', description: 'Consomme une valeur Y sous forme de paire [min, max] et la rend comme zone ou barres d’intervalle.', code: '<chart type="rangeArea" ...></chart>', types: 'rangeArea, rangeBar, rangeColumn' },
      ],
    },
    {
      id: 'capabilities',
      title: 'Capacités transverses du wrapper',
      description: 'Les capacités communes sont disponibles avec ApexCharts ; les options propres au moteur restent dans config.options ou renderedOption.',
      example: `const nativeOption = {
  chart: { zoom: { enabled: true } },
  xaxis: { categories: ['Jan', 'Fév', 'Mar'] },
  series: [{ name: 'Option native', data: [4, 7, 5] }],
};

<chart
  [config]="config"
  [data]="rows"
  [renderedOption]="nativeOption"
  [organizer]="{ enabled: true }"
  group="sales"
  groupSync="all"
  [enablePivot]="true">
</chart>`,
      entries: [
        { name: 'renderedOption', type: 'unknown', source: 'Wrapper', description: 'Fusionne une option ApexCharts complète après les options construites depuis le provider. Les propriétés fournies ici prennent donc la priorité en cas de conflit.', code: '<chart [renderedOption]="nativeOption" ...></chart>' },
        { name: 'organizer / organizerState', type: 'OrganizerConfig / OrganizerState', source: 'Wrapper', description: 'Déduit les séries nommées et applique les visibilités contrôlées. Le menu visuel est fourni séparément par jquery-organizer.', code: '<chart [organizer]="{ enabled: true }" [organizerState]="state" ...></chart>', types: 'Séries nommées' },
        { name: 'group / groupSync', type: 'string / GroupSyncMode', source: 'Wrapper', description: 'Relaye les interactions tooltip et datazoom entre instances ApexCharts partageant le même groupe.', code: '<chart group="sales" groupSync="all" ...></chart>' },
        { name: 'enablePivot', type: 'boolean', source: 'Wrapper', description: 'Opt-in du pivot dans la toolbar. Il vaut false par défaut ; les familles funnel, pyramid et range restent non pivotables.', code: '<chart [enablePivot]="true" ...></chart>' },
        { name: 'drilldown', type: 'ChartDrilldownConfig', source: 'Wrapper', description: 'Affiche le fil d’Ariane et émet les demandes de niveau au parent, qui recharge les lignes et active le niveau voulu.', code: '<chart [drilldown]="drilldown" (drilldownRequest)="onRequest($event)" ...></chart>' },
        { name: 'snapshots / fullscreen', type: 'méthodes publiques', source: 'Wrapper', description: 'Le composant expose les exports, les snapshots visuels, applyVisualSnapshot() et toggleFullscreen() pour les intégrations applicatives.', code: 'chart.copyVisualSnapshot("Ventes");\nawait chart.toggleFullscreen();' },
      ],
    },
  ];

  readonly familyDemos: FamilyDemo[] = [
    {
      id: 'line',
      label: 'Ligne et zone',
      types: ['line', 'area'],
      currentType: 'line',
      config: {
        title: 'Temps de réponse API',
        subtitle: 'Deux séries construites par jquery-core',
        series: [
          { name: 'P50', data: { x: field('week'), y: field('p50') } },
          { name: 'P95', data: { x: field('week'), y: field('p95') } },
        ],
      },
      data: [
        { week: 'S1', p50: 120, p95: 340 },
        { week: 'S2', p50: 132, p95: 410 },
        { week: 'S3', p50: 101, p95: 280 },
        { week: 'S4', p50: 134, p95: 390 },
        { week: 'S5', p50: 90, p95: 260 },
      ],
    },
    {
      id: 'bar',
      label: 'Barres, colonnes et funnel',
      types: ['bar', 'column', 'funnel', 'pyramid'],
      currentType: 'column',
      config: {
        title: 'Tickets par priorité',
        series: [{ name: 'Tickets', data: { x: field('level'), y: field('count') } }],
      },
      data: [
        { level: 'P1', count: 42 },
        { level: 'P2', count: 68 },
        { level: 'P3', count: 96 },
        { level: 'P4', count: 124 },
      ],
    },
    {
      id: 'radial',
      label: 'Circulaires et radar',
      types: ['pie', 'donut', 'polar', 'radial', 'radar'],
      currentType: 'donut',
      config: {
        title: 'Répartition des clients',
        series: [{ name: 'Clients', data: { x: field('segment'), y: field('value') } }],
      },
      data: [
        { segment: 'Enterprise', value: 42 },
        { segment: 'Mid-Market', value: 28 },
        { segment: 'SMB', value: 18 },
        { segment: 'Public', value: 12 },
      ],
    },
    {
      id: 'matrix',
      label: 'Heatmap et treemap',
      types: ['heatmap', 'treemap'],
      currentType: 'heatmap',
      config: {
        title: 'Trafic par créneau',
        series: [{ name: field('day'), data: { x: field('hour'), y: field('value') } }],
      },
      data: [
        { hour: '00h', day: 'Lun', value: 12 },
        { hour: '08h', day: 'Lun', value: 42 },
        { hour: '16h', day: 'Lun', value: 35 },
        { hour: '00h', day: 'Mar', value: 10 },
        { hour: '08h', day: 'Mar', value: 45 },
        { hour: '16h', day: 'Mar', value: 38 },
      ],
    },
    {
      id: 'range',
      label: 'Plages min / max',
      types: ['rangeArea', 'rangeBar', 'rangeColumn'],
      currentType: 'rangeArea',
      config: {
        title: 'Températures mensuelles',
        series: [{ name: 'Température', data: { x: field('month'), y: rangeFields('min', 'max') } }],
      },
      data: [
        { month: 'Jan', min: 2, max: 9 },
        { month: 'Fév', min: 3, max: 11 },
        { month: 'Mar', min: 6, max: 15 },
        { month: 'Avr', min: 9, max: 19 },
        { month: 'Mai', min: 13, max: 23 },
      ],
    },
  ];

  readonly deploymentConfig: ChartProvider<string, number> = {
    title: 'Déploiements',
    series: [{ name: 'Déploiements', data: { x: field('day'), y: field('count') } }],
  };

  readonly toolbarConfig: ChartProvider<string, number> = {
    title: 'Toolbar du wrapper',
    subtitle: 'Les boutons custom sont gérés en interne par ChartComponent',
    showToolbar: true,
    series: [{ name: 'Déploiements', data: { x: field('day'), y: field('count') } }],
  };

  readonly toolbarData = [
    { day: 'Lun', count: 12 },
    { day: 'Mar', count: 18 },
    { day: 'Mer', count: 15 },
    { day: 'Jeu', count: 24 },
    { day: 'Ven', count: 21 },
  ];

  readonly nativeOptionsConfig: ChartProvider<string, number> = {
    title: 'Options ApexCharts natives',
    xtitle: 'Semaine',
    ytitle: 'Déploiements',
    series: [{ name: 'Déploiements', data: { x: field('week'), y: field('count') } }],
    options: {
      colors: ['#bc5b35'],
      stroke: { curve: 'smooth', width: 3 },
      markers: { size: 4 },
      dataLabels: { enabled: false },
      tooltip: { shared: true },
      chart: { animations: { enabled: true }, zoom: { enabled: true } },
    },
  };

  readonly nativeOptionsData = [
    { week: 'S1', count: 14 },
    { week: 'S2', count: 22 },
    { week: 'S3', count: 19 },
    { week: 'S4', count: 31 },
    { week: 'S5', count: 27 },
    { week: 'S6', count: 38 },
  ];

  readonly renderedOptionConfig: ChartProvider<string, number> = {
    title: 'Titre construit par le provider',
    series: [],
    options: {
      colors: ['#bc5b35'],
      stroke: { curve: 'straight', width: 1 },
      chart: { toolbar: { show: false } },
    },
  };
  readonly renderedOption: Record<string, unknown> = {
    chart: {
      type: 'line',
      zoom: { enabled: true },
      toolbar: {
        show: true,
        tools: { download: false, selection: false, zoom: true, zoomin: true, zoomout: true, pan: false, reset: true },
      },
    },
    colors: ['#2e9fe6'],
    title: { text: 'Option ApexCharts fournie directement' },
    xaxis: { categories: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'] },
    series: [{ name: 'Option native', data: [4, 7, 5, 9, 8, 11] }],
    stroke: { curve: 'smooth', width: 3 },
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
    title: 'Séries contrôlées par OrganizerState',
    series: [
      { name: 'Ventes', color: '#176b72', data: { x: field('month'), y: field('value') } },
      { name: 'Objectif', color: '#bc5b35', data: { x: field('month'), y: field('target') } },
    ],
  };
  readonly organizerSeries = [
    { name: 'Ventes', color: '#176b72' },
    { name: 'Objectif', color: '#bc5b35' },
  ];
  readonly organizerData = [
    { month: 'Jan', value: 120, target: 110 },
    { month: 'Fév', value: 145, target: 132 },
    { month: 'Mar', value: 172, target: 158 },
    { month: 'Avr', value: 188, target: 176 },
    { month: 'Mai', value: 214, target: 198 },
  ];
  private readonly completeOrganizerRows: CompleteOrganizerRow[] = [
    { month: 'Jan', week: 'S1', region: 'Nord', channel: 'En ligne', revenue: 120, orders: 18, margin: 32 },
    { month: 'Jan', week: 'S1', region: 'Sud', channel: 'Agence', revenue: 98, orders: 15, margin: 24 },
    { month: 'Jan', week: 'S1', region: 'Est', channel: 'En ligne', revenue: 86, orders: 13, margin: 22 },
    { month: 'Fév', week: 'S2', region: 'Nord', channel: 'Agence', revenue: 145, orders: 22, margin: 38 },
    { month: 'Fév', week: 'S2', region: 'Sud', channel: 'En ligne', revenue: 132, orders: 19, margin: 34 },
    { month: 'Fév', week: 'S2', region: 'Est', channel: 'Agence', revenue: 104, orders: 16, margin: 27 },
    { month: 'Mar', week: 'S3', region: 'Nord', channel: 'En ligne', revenue: 172, orders: 27, margin: 46 },
    { month: 'Mar', week: 'S3', region: 'Sud', channel: 'Agence', revenue: 158, orders: 24, margin: 41 },
    { month: 'Mar', week: 'S3', region: 'Est', channel: 'En ligne', revenue: 121, orders: 18, margin: 31 },
    { month: 'Avr', week: 'S4', region: 'Nord', channel: 'Agence', revenue: 188, orders: 29, margin: 51 },
    { month: 'Avr', week: 'S4', region: 'Sud', channel: 'En ligne', revenue: 176, orders: 26, margin: 47 },
    { month: 'Avr', week: 'S4', region: 'Est', channel: 'Agence', revenue: 139, orders: 21, margin: 36 },
  ];
  readonly completeOrganizerSeriesNames = ['Total', 'Nord', 'Sud', 'Est', 'En ligne', 'Agence'];
  readonly completeOrganizerSeriesColors: Record<string, string> = {
    Total: '#176b72',
    Nord: '#176b72',
    Sud: '#bc5b35',
    Est: '#48628b',
    'En ligne': '#7b5ea7',
    Agence: '#6e7f43',
  };
  completeOrganizerConfig: OrganizerMenuConfig = {
    fields: [
      { id: 'Total', label: 'Total', icon: 'functions', visible: true },
      { id: 'Nord', label: 'Nord', icon: 'north', visible: true },
      { id: 'Sud', label: 'Sud', icon: 'south', visible: true },
      { id: 'Est', label: 'Est', icon: 'east', visible: true },
      { id: 'En ligne', label: 'En ligne', icon: 'language', visible: true },
      { id: 'Agence', label: 'Agence', icon: 'storefront', visible: true },
    ],
    xFields: [
      { id: 'month', label: 'Mois' },
      { id: 'week', label: 'Semaine' },
      { id: 'region', label: 'Région' },
    ],
    yFields: [
      {
        id: 'revenue',
        label: 'Chiffre d’affaires',
        aggregates: [
          { id: 'sum', label: 'Somme' },
          { id: 'average', label: 'Moyenne' },
          { id: 'count', label: 'Nombre' },
          { id: 'min', label: 'Minimum' },
          { id: 'max', label: 'Maximum' },
        ],
      },
      {
        id: 'orders',
        label: 'Commandes',
        aggregates: [
          { id: 'sum', label: 'Somme' },
          { id: 'average', label: 'Moyenne' },
          { id: 'count', label: 'Nombre' },
          { id: 'min', label: 'Minimum' },
          { id: 'max', label: 'Maximum' },
        ],
      },
      {
        id: 'margin',
        label: 'Marge',
        aggregates: [
          { id: 'sum', label: 'Somme' },
          { id: 'average', label: 'Moyenne' },
          { id: 'count', label: 'Nombre' },
          { id: 'min', label: 'Minimum' },
          { id: 'max', label: 'Maximum' },
        ],
      },
    ],
    groups: [
      { id: 'region', label: 'Région', icon: 'public' },
      { id: 'channel', label: 'Canal', icon: 'sell' },
    ],
    slices: [
      { id: 'region-nord', label: 'Région Nord', icon: 'north' },
      { id: 'region-sud', label: 'Région Sud', icon: 'south' },
      { id: 'region-est', label: 'Région Est', icon: 'east' },
      { id: 'channel-online', label: 'Canal en ligne', icon: 'language' },
      { id: 'channel-agency', label: 'Canal agence', icon: 'storefront' },
    ],
    templates: [
      { id: 'monthly-revenue', label: 'CA mensuel', icon: 'bar_chart', xField: 'month', yField: 'revenue', yAggregate: 'sum', selectedSlices: [] },
      { id: 'regional-orders', label: 'Commandes par région', icon: 'public', xField: 'month', yField: 'orders', yAggregate: 'sum', groupBy: 'region', selectedSlices: [] },
      { id: 'online-margin', label: 'Marge en ligne', icon: 'language', xField: 'month', yField: 'margin', yAggregate: 'average', groupBy: 'channel', selectedSlices: ['channel-online'] },
    ],
    chartTypes: [
      { id: 'line', label: 'Courbe', icon: 'show_chart' },
      { id: 'area', label: 'Aire', icon: 'area_chart' },
      { id: 'bar', label: 'Barres', icon: 'insert_chart' },
      { id: 'column', label: 'Colonnes', icon: 'bar_chart' },
      { id: 'funnel', label: 'Entonnoir', icon: 'filter_alt' },
      { id: 'pyramid', label: 'Pyramide', icon: 'change_history' },
      { id: 'pie', label: 'Secteurs', icon: 'pie_chart' },
      { id: 'donut', label: 'Anneau', icon: 'donut_large' },
      { id: 'polar', label: 'Polaire', icon: 'track_changes' },
      { id: 'radar', label: 'Radar', icon: 'radar' },
      { id: 'radial', label: 'Radial', icon: 'adjust' },
      { id: 'heatmap', label: 'Heatmap', icon: 'grid_on' },
      { id: 'treemap', label: 'Treemap', icon: 'account_tree' },
      { id: 'rangeArea', label: 'Zone min / max', icon: 'stacked_line_chart' },
      { id: 'rangeBar', label: 'Barres min / max', icon: 'waterfall_chart' },
      { id: 'rangeColumn', label: 'Colonnes min / max', icon: 'candlestick_chart' },
    ],
    showExport: true,
    onExportVisual: () => this.exportCompleteOrganizerVisual(),
    onExportData: () => this.exportCompleteOrganizerData(),
    showActions: true,
    actions: { label: 'Actions du visuel', icon: 'more_horiz', showCopy: true, showFullscreen: true },
    onCopyVisual: () => this.copyCompleteOrganizerSnapshot(),
    onToggleFullscreen: () => this.toggleCompleteOrganizerFullscreen(),
    showPreferences: true,
    hasSavedPreferences: false,
    onPreferencesEdit: () => this.setCompleteOrganizerAction('Préférences prêtes à être éditées'),
    onPreferencesSave: () => this.saveCompleteOrganizerPreferences(),
    onPreferencesClear: () => this.clearCompleteOrganizerPreferences(),
    showReset: true,
    buttonLabel: 'Organizer complet',
    buttonIcon: 'tune',
    showButtonIcon: true,
    onFetchSliceData: (sliceId) => this.fetchCompleteOrganizerSliceData(sliceId),
    onSliceClick: () => this.setCompleteOrganizerAction('Filtre modifié'),
    switchView: {
      currentView: 'chart',
      onSwitch: (view) => this.switchCompleteOrganizerView(view),
    },
  };
  completeOrganizerMenuState: OrganizerMenuState = {
    viewMode: 'chart',
    visibleFields: [...this.completeOrganizerSeriesNames],
    selectedChartType: 'column',
    selectedX: 'month',
    selectedY: 'revenue',
    selectedYAggregate: 'sum',
    selectedSlices: [],
    selectedTemplate: 'monthly-revenue',
  };
  completeOrganizerState: ChartOrganizerState = {
    selectedFieldIds: ['Total'],
    groupByKey: null,
    dynamicSliceKeys: [],
  };
  completeOrganizerChartType: ChartType = 'column';
  completeOrganizerChartConfig: ChartProvider<any, any> = { series: [] };
  completeOrganizerChartData: CompleteOrganizerProjectedRow[] = [];
  completeOrganizerTableColumns: CompleteOrganizerTableColumn[] = [];
  completeOrganizerViewMode: 'chart' | 'table' = 'chart';
  completeOrganizerActionStatus = 'Aucune action exécutée';
  completeOrganizerIsFullscreen = false;
  completeOrganizerSnapshot: VisualSnapshotDraft | null = null;
  readonly group = 'apexcharts-api-sync';
  readonly syncLineConfig: ChartProvider<string, number> = {
    title: 'Ventes',
    showToolbar: true,
    series: [{ name: 'Ventes', data: { x: field('month'), y: field('value') } }],
    options: {
      tooltip: { shared: true, intersect: false },
      chart: {
        zoom: { enabled: true, type: 'x' },
        toolbar: { tools: { download: false, selection: false, zoom: true, zoomin: true, zoomout: true, pan: false, reset: true } },
      },
    },
  };
  readonly syncAreaConfig: ChartProvider<string, number> = {
    title: 'Ventes cumulées',
    showToolbar: true,
    series: [{ name: 'Ventes', data: { x: field('month'), y: field('value') } }],
    options: {
      tooltip: { shared: true, intersect: false },
      chart: {
        zoom: { enabled: true, type: 'x' },
        toolbar: { tools: { download: false, selection: false, zoom: true, zoomin: true, zoomout: true, pan: false, reset: true } },
      },
    },
  };
  readonly syncData = [
    { month: 'Jan', value: 14 },
    { month: 'Fév', value: 22 },
    { month: 'Mar', value: 19 },
    { month: 'Avr', value: 31 },
    { month: 'Mai', value: 27 },
    { month: 'Juin', value: 38 },
  ];
  readonly drilldownConfig: ChartDrilldownConfig = {
    levels: [
      { id: 'region', label: 'Régions', groupBy: 'region' },
      { id: 'site', label: 'Sites', groupBy: 'site' },
    ],
    activeLevel: 'region',
  };
  drilldown = { ...this.drilldownConfig };
  activeDrilldownConfig: ChartProvider<string, number> = this.createDrilldownConfig('region');
  private readonly drilldownRows = [
    { region: 'Nord', site: 'Lille', value: 42 },
    { region: 'Nord', site: 'Arras', value: 31 },
    { region: 'Sud', site: 'Toulouse', value: 27 },
    { region: 'Sud', site: 'Montpellier', value: 36 },
  ];
  drilldownData = this.createDrilldownRootData();
  readonly exportOrganizerConfig: OrganizerMenuConfig = {
    buttonLabel: 'Actions',
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
  snapshotDraft: VisualSnapshotDraft | null = null;
  lastSnapshot: VisualSnapshot | null = null;
  lastChartClick = 'Aucun clic capturé';
  lastRenderError = '';

  constructor() {
    this.refreshCompleteOrganizerChart();
  }

  isLoadingDemo = false;
  isEmptyDemo = false;
  stateData = this.toolbarData;

  setFamilyType(demo: FamilyDemo, type: ChartType): void {
    demo.currentType = type;
  }

  setState(state: 'ready' | 'loading' | 'empty'): void {
    this.isLoadingDemo = state === 'loading';
    this.isEmptyDemo = state === 'empty';
    this.stateData = state === 'ready' ? this.toolbarData : [];
  }

  onOrganizerChange(event: OrganizerButtonEvent): void {
    this.organizerMenuState = event.state;
    const selected = new Set(event.state.visibleFields ?? []);
    this.organizerState = {
      ...this.organizerState,
      selectedFieldIds: this.organizerSeries
        .map(series => series.name)
        .filter(name => selected.has(name)),
    };
  }

    onCompleteOrganizerChange(event: OrganizerButtonEvent): void {
      this.completeOrganizerMenuState = {
        ...this.completeOrganizerMenuState,
        ...event.state,
        visibleFields: event.state.visibleFields ?? this.completeOrganizerMenuState.visibleFields,
        selectedSlices: event.state.selectedSlices ?? this.completeOrganizerMenuState.selectedSlices,
      };
      this.completeOrganizerViewMode = this.completeOrganizerMenuState.viewMode ?? 'chart';
      this.completeOrganizerChartType = this.completeOrganizerMenuState.selectedChartType as ChartType ?? 'column';
      this.setCompleteOrganizerAction(this.completeOrganizerEventLabel(event.type));
      this.refreshCompleteOrganizerChart();
    }

    exportCompleteOrganizerVisual(): void {
      if (!this.completeOrganizerChart) {
        this.setCompleteOrganizerAction('Le graphique est encore en préparation');
        return;
      }
      this.completeOrganizerChart.exportImage('apexcharts-organizer-complet', 'png', 2);
      this.setCompleteOrganizerAction('Export visuel lancé');
    }

    exportCompleteOrganizerData(): void {
      if (!this.completeOrganizerChart) {
        this.setCompleteOrganizerAction('Le graphique est encore en préparation');
        return;
      }
      this.completeOrganizerChart.exportData('apexcharts-organizer-complet', ';');
      this.setCompleteOrganizerAction('Export des données lancé');
    }

    copyCompleteOrganizerSnapshot(): void {
      if (!this.completeOrganizerChart) {
        this.setCompleteOrganizerAction('Le graphique est encore en préparation');
        return;
      }
      this.completeOrganizerSnapshot = this.completeOrganizerChart.createVisualSnapshot('Organizer complet');
      this.completeOrganizerChart.copyVisualSnapshot('Organizer complet');
      this.setCompleteOrganizerAction('Snapshot visuel créé');
    }

    toggleCompleteOrganizerFullscreen(): void {
      if (!this.completeOrganizerChart) {
        this.setCompleteOrganizerAction('Le graphique est encore en préparation');
        return;
      }
      const wasFullscreen = this.completeOrganizerIsFullscreen;
      void this.completeOrganizerChart.toggleFullscreen().then(isFullscreen => {
        this.completeOrganizerIsFullscreen = isFullscreen;
        this.completeOrganizerConfig = { ...this.completeOrganizerConfig, isFullscreen };
        let status = 'Plein écran indisponible dans ce contexte';
        if (isFullscreen) status = 'Plein écran activé';
        else if (wasFullscreen) status = 'Plein écran quitté';
        this.setCompleteOrganizerAction(status);
      });
    }

    switchCompleteOrganizerView(view: 'chart' | 'table'): void {
      this.completeOrganizerViewMode = view;
      this.completeOrganizerMenuState = { ...this.completeOrganizerMenuState, viewMode: view };
      this.completeOrganizerConfig = {
        ...this.completeOrganizerConfig,
        switchView: {
          ...this.completeOrganizerConfig.switchView!,
          currentView: view,
        },
      };
      this.setCompleteOrganizerAction(view === 'table' ? 'Vue tableau activée' : 'Vue graphique activée');
    }

    saveCompleteOrganizerPreferences(): void {
      this.completeOrganizerConfig = { ...this.completeOrganizerConfig, hasSavedPreferences: true };
      this.setCompleteOrganizerAction('Préférences sauvegardées');
    }

    clearCompleteOrganizerPreferences(): void {
      this.completeOrganizerConfig = { ...this.completeOrganizerConfig, hasSavedPreferences: false };
      this.setCompleteOrganizerAction('Préférences réinitialisées');
    }

    getCompleteOrganizerLabel(kind: 'x' | 'y' | 'aggregate' | 'group' | 'chartType' | 'template', id?: string): string {
      if (!id) return 'Aucun';
      const sources: Partial<Record<'x' | 'y' | 'aggregate' | 'group' | 'chartType' | 'template', Array<{ id: string; label: string }>>> = {
        x: this.completeOrganizerConfig.xFields,
        y: this.completeOrganizerConfig.yFields,
        aggregate: this.completeOrganizerConfig.yFields?.flatMap(fieldConfig => fieldConfig.aggregates ?? []),
        group: this.completeOrganizerConfig.groups,
        chartType: this.completeOrganizerConfig.chartTypes,
        template: this.completeOrganizerConfig.templates,
      };
      const source = sources[kind];
      return source?.find(option => option.id === id)?.label ?? id;
    }

    getCompleteOrganizerSlicesLabel(): string {
      const selectedSlices = this.completeOrganizerMenuState.selectedSlices ?? [];
      if (!selectedSlices.length) return 'Aucun filtre';
      return selectedSlices
        .map(sliceId => this.completeOrganizerConfig.slices?.find(slice => slice.id === sliceId)?.label ?? sliceId)
        .join(', ');
    }

    getCompleteOrganizerProjectedSeriesLabel(): string {
      return this.completeOrganizerTableColumns.map(column => column.name).join(', ');
    }

    private refreshCompleteOrganizerChart(): void {
      const state = this.completeOrganizerMenuState;
      const xField = this.resolveCompleteOrganizerDimension(state.selectedX);
      const metric = this.resolveCompleteOrganizerMetric(state.selectedY);
      const aggregate = this.resolveCompleteOrganizerAggregate(state.selectedYAggregate);
      const groupBy = this.resolveCompleteOrganizerGroup(state.selectedGroupBy);
      const filteredRows = this.filterCompleteOrganizerRows(state.selectedSlices ?? []);
      const xValues = this.uniqueCompleteOrganizerValues(filteredRows, xField);
      const seriesNames = groupBy
        ? this.uniqueCompleteOrganizerValues(filteredRows, groupBy)
        : ['Total'];
      const projectedRows = xValues.map(xValue => {
        const projectedRow: CompleteOrganizerProjectedRow = { label: xValue };
        seriesNames.forEach(seriesName => {
          const sourceRows = filteredRows.filter(row => {
            const hasXValue = String(row[xField]) === xValue;
            const hasGroupValue = !groupBy || String(row[groupBy]) === seriesName;
            return hasXValue && hasGroupValue;
          });
          const valueKey = this.completeOrganizerValueKey(seriesName);
          projectedRow[valueKey] = this.aggregateCompleteOrganizerRows(sourceRows, metric, aggregate);
          if (this.isCompleteOrganizerRangeType()) {
            const metricValues = sourceRows.map(row => row[metric]);
            projectedRow[this.completeOrganizerRangeMinKey(seriesName)] = metricValues.length ? Math.min(...metricValues) : 0;
            projectedRow[this.completeOrganizerRangeMaxKey(seriesName)] = metricValues.length ? Math.max(...metricValues) : 0;
          }
        });
        return projectedRow;
      });
      const series = seriesNames.map((seriesName, index) => {
        const valueKey = this.completeOrganizerValueKey(seriesName);
        return {
          name: seriesName,
          color: this.completeOrganizerSeriesColors[seriesName] ?? ['#176b72', '#bc5b35', '#48628b'][index % 3],
          data: {
            x: field('label'),
            y: this.isCompleteOrganizerRangeType()
              ? rangeFields(this.completeOrganizerRangeMinKey(seriesName), this.completeOrganizerRangeMaxKey(seriesName))
              : field(valueKey),
          },
        };
      });

      const groupLabel = groupBy ? ` · ${this.getCompleteOrganizerLabel('group', groupBy)}` : '';
      this.completeOrganizerChartConfig = {
        title: `${this.getCompleteOrganizerLabel('y', metric)} · ${this.getCompleteOrganizerLabel('aggregate', aggregate)}`,
        subtitle: `${this.getCompleteOrganizerLabel('x', xField)}${groupLabel}`,
        height: 340,
        series,
        options: { tooltip: { shared: true, intersect: false } },
      };
      this.completeOrganizerChartData = projectedRows;
      this.completeOrganizerTableColumns = seriesNames.map(seriesName => ({
        name: seriesName,
        valueKey: this.completeOrganizerValueKey(seriesName),
      }));
      const visibleFields = new Set(state.visibleFields ?? this.completeOrganizerSeriesNames);
      this.completeOrganizerState = {
        selectedFieldIds: seriesNames.filter(seriesName => visibleFields.has(seriesName)),
        groupByKey: groupBy,
        dynamicSliceKeys: state.selectedSlices ?? [],
      };
    }

    private filterCompleteOrganizerRows(selectedSlices: string[]): CompleteOrganizerRow[] {
      const regionValues: Record<string, string> = {
        'region-nord': 'Nord',
        'region-sud': 'Sud',
        'region-est': 'Est',
      };
      const channelValues: Record<string, string> = {
        'channel-online': 'En ligne',
        'channel-agency': 'Agence',
      };
      const selectedRegions = selectedSlices.filter(sliceId => regionValues[sliceId]).map(sliceId => regionValues[sliceId]);
      const selectedChannels = selectedSlices.filter(sliceId => channelValues[sliceId]).map(sliceId => channelValues[sliceId]);
      return this.completeOrganizerRows.filter(row =>
        (!selectedRegions.length || selectedRegions.includes(row.region))
        && (!selectedChannels.length || selectedChannels.includes(row.channel))
      );
    }

    private fetchCompleteOrganizerSliceData(sliceId: string): Promise<CompleteOrganizerRow[]> {
      const sliceRows = this.filterCompleteOrganizerRows([sliceId]);
      return Promise.resolve(sliceRows);
    }

    private uniqueCompleteOrganizerValues(rows: CompleteOrganizerRow[], key: CompleteOrganizerDimension | CompleteOrganizerGroup): string[] {
      return [...new Set(rows.map(row => String(row[key])))];
    }

    private aggregateCompleteOrganizerRows(rows: CompleteOrganizerRow[], metric: CompleteOrganizerMetric, aggregate: CompleteOrganizerAggregate): number {
      if (aggregate === 'count') return rows.length;
      const values = rows.map(row => row[metric]);
      if (!values.length) return 0;
      if (aggregate === 'min') return Math.min(...values);
      if (aggregate === 'max') return Math.max(...values);
      const sum = values.reduce((total, value) => total + value, 0);
      return aggregate === 'average' ? sum / values.length : sum;
    }

    private resolveCompleteOrganizerDimension(fieldId?: string): CompleteOrganizerDimension {
      return fieldId === 'week' || fieldId === 'region' ? fieldId : 'month';
    }

    private resolveCompleteOrganizerMetric(fieldId?: string): CompleteOrganizerMetric {
      return fieldId === 'orders' || fieldId === 'margin' ? fieldId : 'revenue';
    }

    private resolveCompleteOrganizerGroup(fieldId?: string): CompleteOrganizerGroup | null {
      return fieldId === 'region' || fieldId === 'channel' ? fieldId : null;
    }

    private resolveCompleteOrganizerAggregate(aggregateId?: string): CompleteOrganizerAggregate {
      return aggregateId === 'average' || aggregateId === 'count' || aggregateId === 'min' || aggregateId === 'max'
        ? aggregateId
        : 'sum';
    }

    private isCompleteOrganizerRangeType(): boolean {
      return this.completeOrganizerChartType === 'rangeArea'
        || this.completeOrganizerChartType === 'rangeBar'
        || this.completeOrganizerChartType === 'rangeColumn';
    }

    private completeOrganizerValueKey(seriesName: string): string {
      return `value_${seriesName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
    }

    private completeOrganizerRangeMinKey(seriesName: string): string {
      return `${this.completeOrganizerValueKey(seriesName)}_min`;
    }

    private completeOrganizerRangeMaxKey(seriesName: string): string {
      return `${this.completeOrganizerValueKey(seriesName)}_max`;
    }

    private completeOrganizerEventLabel(eventType: OrganizerButtonEvent['type']): string {
      const labels: Record<OrganizerButtonEvent['type'], string> = {
        fieldToggled: 'Visibilité des séries modifiée',
        xSelected: 'Axe X modifié',
        ySelected: 'Mesure ou agrégat modifié',
        groupBySelected: 'Regroupement modifié',
        templateSelected: 'Template appliqué',
        sliceSelected: 'Filtre modifié',
        chartTypeSelected: 'Type de graphique modifié',
        reset: 'Configuration réinitialisée',
        viewSwitched: 'Vue modifiée',
      };
      return labels[eventType];
    }

    private setCompleteOrganizerAction(message: string): void {
      this.completeOrganizerActionStatus = message;
    }

  onChartClick(event: ChartClickEvent): void {
    this.lastChartClick = this.formatJson({ name: event.name, value: event.value });
  }

  onRenderError(event: ChartRenderError): void {
    this.lastRenderError = this.formatJson(event.error);
  }

  onSnapshotCreated(snapshot: VisualSnapshot): void {
    this.lastSnapshot = snapshot;
  }

  exportVisual(): void {
    this.exportChart?.exportImage('apexcharts-api', 'png', 2);
  }

  exportData(): void {
    this.exportChart?.exportData('apexcharts-api', ';');
  }

  copyExportSnapshot(): void {
    const chart = this.exportChart;
    if (!chart) return;
    this.snapshotDraft = chart.createVisualSnapshot('API ApexCharts');
    chart.copyVisualSnapshot('API ApexCharts');
  }

  toggleExportFullscreen(): void {
    void this.exportChart?.toggleFullscreen();
  }

  onDrilldownRequest(request: ChartDrilldownRequest): void {
    if (request.toLevel !== 'site') return;
    const region = typeof request.value === 'string' ? request.value : '';
    if (!region) return;
    this.drilldownData = this.drilldownRows.filter(row => row.region === region);
    this.drilldown = { ...this.drilldown, activeLevel: 'site' };
    this.activeDrilldownConfig = this.createDrilldownConfig('site');
  }

  onDrilldownNavigate(levelId: string): void {
    if (levelId !== 'region') return;
    this.drilldownData = this.createDrilldownRootData();
    this.drilldown = { ...this.drilldown, activeLevel: 'region' };
    this.activeDrilldownConfig = this.createDrilldownConfig('region');
  }

  formatJson(value: unknown): string {
    return JSON.stringify(value, null, 2) ?? '';
  }

  private createDrilldownConfig(level: 'region' | 'site'): ChartProvider<string, number> {
    return level === 'site'
      ? { title: 'Sites', series: [{ name: 'Valeur', data: { x: field('site'), y: field('value') } }] }
      : { title: 'Régions', series: [{ name: 'Valeur', data: { x: field('region'), y: field('value') } }] };
  }

  private createDrilldownRootData(): Array<{ region: string; site: string; value: number }> {
    const totals = new Map<string, number>();
    for (const row of this.drilldownRows) {
      totals.set(row.region, (totals.get(row.region) ?? 0) + row.value);
    }
    return [...totals].map(([region, value]) => ({ region, site: '', value }));
  }
}