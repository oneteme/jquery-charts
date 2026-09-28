import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  ChartGroupSyncEvent,
  ChartProvider,
  DataStats,
  FullscreenManager,
  GroupSyncAction,
  Interval,
  IntervalStrategy,
  OrganizerFieldDef,
  OrganizerState,
  PivotRow,
  VisualSnapshot,
  VisualSnapshotDraft,
  VisualSnapshotStorage,
  applyOrganizerStateToSeries,
  buildChart,
  buildSingleSerieChart,
  cloneSerializable,
  combineFields,
  combineProviders,
  computeDataStats,
  containsFunction,
  convertChartDataValues,
  convertUnitValue,
  createUnitConverter,
  defineLinearUnit,
  distinct,
  field,
  formatChartDataDates,
  formatChartDataValues,
  formatChartDate,
  formatChartValue,
  formatUnitValue,
  groupBy,
  groupByFiled,
  groupableOrganizerFields,
  initialOrganizerState,
  intervalCategories,
  intervalsByBreakpoints,
  intervalsByCount,
  intervalsFromData,
  isObject,
  isRecord,
  isVisualSnapshot,
  joinFields,
  joinProviders,
  mapChartDataFields,
  mapField,
  mergeDeep,
  naturalComparator,
  naturalFieldComparator,
  normalizeChartDate,
  organizerFieldDef,
  organizerFieldDefsFromChartSeries,
  pivotRows,
  publishChartGroupSync,
  rangeFields,
  registerChartGroupSync,
  resolveInterval,
  selectBestScale,
  sliceableOrganizerFields,
  values,
} from '@oneteme/jquery-core';

type ApiSource = 'Core' | 'Contrat TypeScript';

interface ApiEntry {
  name: string;
  type: string;
  source: ApiSource;
  description: string;
  code: string;
}

interface ApiSection {
  id: string;
  title: string;
  description: string;
  entries: ApiEntry[];
}

type CoreDemoKind =
  | 'providers'
  | 'transformations'
  | 'units'
  | 'intervals'
  | 'pivot'
  | 'helpers'
  | 'snapshots'
  | 'sync';

interface CoreDemo {
  id: string;
  kind: CoreDemoKind;
  title: string;
  description: string;
  code: string;
  copied?: boolean;
}

type IntervalDemoType = 'quartile' | 'quantile' | 'equal-width' | 'mean-stddev' | 'jenks';
type PivotAggregate = 'sum' | 'count' | 'min' | 'max';

interface CoreRow {
  month: string;
  region: string;
  team: string;
  sales: number;
  low: number;
  high: number;
  timestamp: string | null;
  amount: number | null;
  distanceM: number | null;
}

interface IntervalRow {
  label: string;
  score: number;
}

interface ProviderChartSummary {
  categories: string[];
  series: Array<{ name?: string; data: unknown[] }>;
  singleSeriesCount: number;
}

class DemoStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

@Component({
  selector: 'app-core-api',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './core-api.component.html',
  styleUrls: ['./core-api.component.scss'],
})
export class CoreApiComponent implements OnDestroy {
  readonly locales = ['fr-FR', 'en-US'];
  readonly timeZones = ['Europe/Paris', 'UTC', 'America/New_York'];

  readonly sections: ApiSection[] = [
    {
      id: 'data-providers',
      title: 'Providers et construction de séries',
      description: 'Reliez des lignes métier à un contrat de graphique sans écrire de boucle de projection spécifique à un moteur.',
      entries: [
        { name: 'field(name)', type: 'DataProvider<T>', source: 'Core', description: 'Lit une propriété de la ligne courante.', code: "data: { x: field('month'), y: field('sales') }" },
        { name: 'values(...items)', type: 'DataProvider<T>', source: 'Core', description: 'Retourne une valeur fixe selon l’index de la ligne.', code: 'y: values(10, 20, 30)' },
        { name: 'mapField(name, map)', type: 'DataProvider<T>', source: 'Core', description: 'Traduit une valeur de ligne via une Map.', code: "x: mapField('region', regionLabels)" },
        { name: 'rangeFields(min, max)', type: 'DataProvider<T[]>', source: 'Core', description: 'Construit une plage [min, max] et renvoie undefined si une borne manque.', code: "y: rangeFields('low', 'high')" },
        { name: 'joinFields / combineFields', type: 'DataProvider<T>', source: 'Core', description: 'Assemble plusieurs champs avec un séparateur ou une fonction métier.', code: "x: joinFields(' · ', 'region', 'team')" },
        { name: 'joinProviders / combineProviders', type: 'DataProvider<T>', source: 'Core', description: 'Compose plusieurs providers déjà résolus.', code: "x: joinProviders(' / ', field('region'), field('team'))" },
        { name: 'buildChart()', type: 'CommonChart<X, Y>', source: 'Core', description: 'Construit catégories et séries à partir des lignes et du ChartProvider.', code: 'const chart = buildChart(rows, provider);' },
        { name: 'buildSingleSerieChart()', type: 'CommonChart<X, Y>', source: 'Core', description: 'Prépare la variante où plusieurs providers sont fusionnés dans une seule série.', code: 'const chart = buildSingleSerieChart(rows, provider);' },
        { name: 'distinct / naturalComparator / naturalFieldComparator', type: 'T[] / Comparator<T>', source: 'Core', description: 'Déduplique des catégories et fournit un tri sur une valeur ou un champ.', code: "const regions = distinct(rows, [field('region')]);" },
        { name: 'groupBy / groupByFiled', type: 'Record<string, T[]>', source: 'Core', description: 'Regroupe des lignes par provider ou par nom de champ.', code: "const byRegion = groupBy(rows as [], field('region'));" },
      ],
    },
    {
      id: 'data-shaping',
      title: 'Transformations de données',
      description: 'Formate une copie des lignes avant le rendu tout en conservant le tableau source et ses valeurs nulles.',
      entries: [
        { name: 'mapChartDataFields()', type: 'Array<ReplaceChartDataFields<...>>', source: 'Core', description: 'Applique une fonction à plusieurs champs directs et clone chaque ligne.', code: "mapChartDataFields(rows, ['amount'], value => value == null ? null : value * 1.2)" },
        { name: 'formatChartDataDates()', type: 'Array<...>', source: 'Core', description: 'Formate les dates sélectionnées avec une locale et un fuseau explicites.', code: "formatChartDataDates(rows, ['timestamp'], { locale: 'fr-FR', timeZone: 'Europe/Paris' })" },
        { name: 'formatChartDataValues()', type: 'Array<...>', source: 'Core', description: 'Formate les nombres sélectionnés avec la précision et les options Intl demandées.', code: "formatChartDataValues(rows, ['amount'], { locale: 'fr-FR', precision: 2 })" },
        { name: 'convertChartDataValues()', type: 'Array<...>', source: 'Core', description: 'Convertit des champs numériques avec un convertisseur d’unités enregistré.', code: "convertChartDataValues(rows, ['distanceM'], units, 'm', 'km')" },
        { name: 'normalizeChartDate()', type: 'Date | null', source: 'Core', description: 'Normalise une Date, une chaîne ou un timestamp en clonant les objets Date.', code: "normalizeChartDate('2024-01-15T23:30:00Z')" },
        { name: 'formatChartDate() / formatChartNumber()', type: 'string | null', source: 'Core', description: 'Formate une valeur isolée et lève une erreur par défaut pour les entrées invalides.', code: "formatChartNumber('1234.5', { locale: 'fr-FR', precision: 1 })" },
      ],
    },
    {
      id: 'units',
      title: 'Unités et échelles',
      description: 'Déclarez les conversions autorisées et choisissez automatiquement une unité d’affichage adaptée à la magnitude des données.',
      entries: [
        { name: 'defineLinearUnit()', type: 'UnitDefinition<Unit>', source: 'Core', description: 'Définit une unité linéaire, y compris une unité affine avec offset comme Celsius/Fahrenheit.', code: "defineLinearUnit('km', { factor: 1000 })" },
        { name: 'createUnitConverter()', type: 'ChartUnitConverter<Unit>', source: 'Core', description: 'Construit un convertisseur fermé qui refuse les unités inconnues.', code: 'const units = createUnitConverter([meters, kilometres]);' },
        { name: 'convertUnitValue()', type: 'number', source: 'Core', description: 'Convertit une valeur unique entre deux unités enregistrées.', code: "convertUnitValue(2500, 'm', 'km', units)" },
        { name: 'selectBestScale()', type: 'SelectedUnitScale', source: 'Core', description: 'Sélectionne la première échelle dont le seuil couvre le maximum absolu.', code: 'const scale = selectBestScale(config, values);' },
        { name: 'formatChartValue() / formatUnitValue()', type: 'string', source: 'Core', description: 'Produit un affichage compact et cohérent pour les axes et tooltips.', code: "formatUnitValue(1250000, 'unités', { scale: 0.000001, unit: 'M' })" },
        { name: 'UnknownUnitError', type: 'Error', source: 'Core', description: 'Erreur dédiée lorsqu’une unité source ou cible n’a pas été enregistrée.', code: "catch (error) { error instanceof UnknownUnitError }" },
      ],
    },
    {
      id: 'intervals',
      title: 'Intervalles et statistiques',
      description: 'Classez des valeurs numériques ou des dates avec des bornes manuelles ou des stratégies statistiques pilotées par les données.',
      entries: [
        { name: 'intervalsByBreakpoints()', type: 'Interval<T>[]', source: 'Core', description: 'Crée n + 1 classes ouvertes à partir de seuils explicites.', code: 'intervalsByBreakpoints([10, 25, 50])' },
        { name: 'intervalsByCount()', type: 'Interval<T>[]', source: 'Core', description: 'Découpe une plage en classes de largeur égale.', code: 'intervalsByCount(0, 100, 4)' },
        { name: 'computeDataStats()', type: 'DataStats | null', source: 'Core', description: 'Calcule min, max, moyenne, médiane, écart-type, quartiles et percentiles.', code: "computeDataStats(rows, row => row.score)" },
        { name: 'intervalsFromData()', type: 'Interval<T>[]', source: 'Core', description: 'Applique quartile, quantile, equal-width, mean-stddev ou Jenks.', code: "intervalsFromData(rows, row => row.score, { type: 'jenks', count: 4 })" },
        { name: 'inInterval() / resolveInterval()', type: 'boolean / Interval | undefined', source: 'Core', description: 'Teste l’appartenance et retrouve la classe d’une valeur.', code: 'resolveInterval(row.score, intervals)?.label' },
        { name: 'intervalCategories()', type: 'Array<{ key, label, filter }>', source: 'Core', description: 'Adapte les intervalles au format de catégories filtrables de jquery-table.', code: 'intervalCategories(intervals, row => row.score)' },
      ],
    },
    {
      id: 'reshape',
      title: 'Reshape avec pivotRows()',
      description: 'Passe d’un format long à un format large en contrôlant l’agrégation, le remplissage et les noms de colonnes.',
      entries: [
        { name: 'index / columns / values', type: 'PivotRowsOptions<T>', source: 'Core', description: 'Définissent respectivement les lignes, les colonnes et les mesures du pivot.', code: "pivotRows(rows, { index: 'month', columns: 'metric', values: ['value'] })" },
        { name: 'aggregate', type: 'sum | count | min | max | function', source: 'Core', description: 'Agrège les valeurs de chaque cellule, avec une fonction personnalisée possible.', code: "aggregate: 'sum'" },
        { name: 'fill', type: 'PivotFill', source: 'Core', description: 'Valeur ou fonction utilisée pour les combinaisons absentes.', code: 'fill: 0' },
        { name: 'indexValues / columnValues', type: 'readonly ReshapeKey[]', source: 'Core', description: 'Impose un ordre et conserve les lignes ou colonnes attendues même sans données.', code: "columnValues: ['Consommation', 'Production', 'Prévision']" },
        { name: 'normalizeKey / missingKey', type: 'function / empty | skip | error', source: 'Core', description: 'Normalise les clés et définit le comportement pour les clés nulles ou absentes.', code: "missingKey: 'skip'" },
        { name: 'separator / indexName / columnName', type: 'string / string / function', source: 'Core', description: 'Personnalise la forme des noms de colonnes générés.', code: "separator: '.', indexName: 'mois'" },
      ],
    },
    {
      id: 'helpers',
      title: 'Helpers purs et contrats d’état',
      description: 'Quelques helpers sans DOM pour fusionner, cloner, inspecter et piloter des états de présentation.',
      entries: [
        { name: 'isObject() / mergeDeep()', type: 'boolean / object', source: 'Core', description: 'Teste un objet simple et fusionne récursivement des objets de configuration.', code: "mergeDeep({}, { chart: { type: 'line' } }, { chart: { title: 'Ventes' } })" },
        { name: 'cloneSerializable()', type: 'T', source: 'Core', description: 'Retourne une copie JSON en supprimant les fonctions non transportables.', code: 'cloneSerializable({ data, formatter })' },
        { name: 'containsFunction()', type: 'boolean', source: 'Core', description: 'Détecte une fonction dans un graphe d’objet, y compris dans les objets imbriqués.', code: 'containsFunction(config)' },
        { name: 'organizerFieldDef()', type: 'OrganizerFieldDef', source: 'Core', description: 'Décrit un champ affichable dans un Organizer.', code: "organizerFieldDef('Ventes', { optional: false })" },
        { name: 'groupableOrganizerFields() / sliceableOrganizerFields()', type: 'OrganizerFieldDef[]', source: 'Core', description: 'Filtre les champs utilisables pour un regroupement ou une slice.', code: 'groupableOrganizerFields(fields)' },
        { name: 'initialOrganizerState()', type: 'OrganizerState', source: 'Core', description: 'Sélectionne initialement les champs non optionnels.', code: 'initialOrganizerState(fields)' },
        { name: 'organizerFieldDefsFromChartSeries()', type: 'OrganizerFieldDef[]', source: 'Core', description: 'Dérive les champs Organizer à partir des séries nommées d’un ChartProvider.', code: 'organizerFieldDefsFromChartSeries(provider.series ?? [])' },
        { name: 'applyOrganizerStateToSeries()', type: 'ChartProvider', source: 'Core', description: 'Retourne un provider où la propriété visible suit l’état sélectionné sans muter la source.', code: 'applyOrganizerStateToSeries(provider, state)' },
      ],
    },
    {
      id: 'runtime-contracts',
      title: 'Contrats runtime du Core',
      description: 'Le Core porte aussi des contrats partagés pour la synchronisation, le plein écran et les snapshots persistés.',
      entries: [
        { name: 'registerChartGroupSync() / publishChartGroupSync()', type: 'unsubscribe / void', source: 'Core', description: 'Enregistre des listeners par groupe et relaie tooltip ou datazoom sans dépendre d’un moteur de graphique.', code: "registerChartGroupSync('dashboard', source, listener)" },
        { name: 'FullscreenManager.isSupported() / isActive() / toggle()', type: 'boolean / Promise<boolean>', source: 'Core', description: 'Teste le support, l’état et bascule le plein écran d’un Element.', code: 'await FullscreenManager.toggle(element)' },
        { name: 'VisualSnapshotStorage', type: 'class', source: 'Core', description: 'Crée, liste, renomme, remplace et supprime des snapshots versionnés dans un Storage.', code: "const storage = new VisualSnapshotStorage({ storageKey: 'charts' })" },
        { name: 'isVisualSnapshot() / isRecord()', type: 'type guard', source: 'Core', description: 'Valide les données reçues avant de les appliquer ou de les persister.', code: 'if (isVisualSnapshot(value) && isRecord(value.config)) restore(value)' },
        { name: 'VisualSnapshotDraft / VisualSnapshotCollection', type: 'interfaces', source: 'Contrat TypeScript', description: 'Types sérialisables pour préparer un snapshot et représenter une collection versionnée.', code: "const draft: VisualSnapshotDraft = { type: 'chart', ... }" },
        { name: 'VISUAL_SNAPSHOT_* / DuplicateVisualSnapshotLabelError', type: 'constants / Error', source: 'Core', description: 'Expose la version de schéma, la clé de stockage, la limite par défaut et l’erreur de label dupliqué.', code: 'VISUAL_SNAPSHOT_SCHEMA_VERSION' },
      ],
    },
  ];

  readonly demos: CoreDemo[] = [
    {
      id: 'providers-demo',
      kind: 'providers',
      title: 'Décrire une série sans écrire de projection',
      description: 'Les providers lisent les lignes, composent les libellés et construisent un résultat commun. Le moteur de graphique n’intervient pas dans cette étape.',
      code: `const provider: ChartProvider<string, number> = {
  series: [{
    name: 'Ventes',
    data: { x: field('month'), y: field('sales') },
  }],
};

const chart = buildChart(rows, provider);`,
    },
    {
      id: 'transformations-demo',
      kind: 'transformations',
      title: 'Transformer une copie, garder la donnée source',
      description: 'La locale, le fuseau et la précision modifient uniquement la représentation. Les valeurs nulles restent nulles et les lignes d’origine ne sont pas mutées.',
      code: `const displayRows = formatChartDataDates(rows, ['timestamp'], {
  locale: 'fr-FR',
  timeZone: 'Europe/Paris',
});
const numbers = formatChartDataValues(rows, ['amount'], {
  locale: 'fr-FR',
  precision: 2,
});`,
    },
    {
      id: 'units-demo',
      kind: 'units',
      title: 'Déclarer les conversions et choisir une échelle',
      description: 'Une unité doit être enregistrée avant d’être utilisée. Les échelles d’affichage sont choisies à partir du maximum absolu de la série.',
      code: `const units = createUnitConverter([
  defineLinearUnit('m', { factor: 1 }),
  defineLinearUnit('km', { factor: 1000 }),
]);
const kilometres = convertUnitValue(2500, 'm', 'km', units);
const scale = selectBestScale(config, values);`,
    },
    {
      id: 'intervals-demo',
      kind: 'intervals',
      title: 'Classer des valeurs selon leur distribution',
      description: 'Comparez les stratégies quartile, quantile, largeur égale, moyenne-écart-type et Jenks sur le même jeu de valeurs.',
      code: `const stats = computeDataStats(rows, row => row.score);
const intervals = intervalsFromData(
  rows,
  row => row.score,
  { type: 'jenks', count: 4 },
);
const bucket = resolveInterval(row.score, intervals);`,
    },
    {
      id: 'pivot-demo',
      kind: 'pivot',
      title: 'Passer du format long au format large',
      description: 'pivotRows regroupe les lignes par mois, transforme les métriques en colonnes et remplit les combinaisons absentes.',
      code: `const wideRows = pivotRows(rows, {
  index: 'month',
  columns: 'metric',
  values: ['value'],
  aggregate: 'sum',
  fill: 0,
});`,
    },
    {
      id: 'helpers-demo',
      kind: 'helpers',
      title: 'Préparer des configurations transportables',
      description: 'Les helpers purs rendent explicite la différence entre une configuration sérialisable, une configuration contenant des callbacks et un état Organizer.',
      code: `const merged = mergeDeep({}, base, overrides);
const serializable = cloneSerializable(config);
const hasCallback = containsFunction(config);
const visibleProvider = applyOrganizerStateToSeries(provider, state);`,
    },
    {
      id: 'snapshots-demo',
      kind: 'snapshots',
      title: 'Persister un snapshot validé',
      description: 'Un draft décrit la configuration, l’état, les données et les avertissements. Le stockage ajoute l’identifiant, la version et les dates, puis protège les labels dupliqués.',
      code: `const storage = new VisualSnapshotStorage();
const snapshot = storage.create({
  type: 'chart',
  label: 'Ventes filtrées',
  config: { ... },
  state: { ... },
  data: rows,
  warnings: [],
});`,
    },
    {
      id: 'sync-demo',
      kind: 'sync',
      title: 'Relayer une interaction entre instances',
      description: 'La synchronisation de groupe est un petit bus mémoire : les wrappers peuvent y brancher tooltip et datazoom, mais le Core ne dépend d’aucun DOM.',
      code: `const stop = registerChartGroupSync('sales', source, event => {
  console.log(event.action, event.payload);
});
publishChartGroupSync({
  group: 'sales',
  action: 'tooltip',
  source,
  payload: { xValue: 'Mars' },
});`,
    },
  ];

  readonly sourceRows: CoreRow[] = [
    { month: 'Jan', region: 'Nord', team: 'B2B', sales: 1200, low: 1000, high: 1400, timestamp: '2024-01-15T23:30:00.000Z', amount: 1234.567, distanceM: 2500 },
    { month: 'Fév', region: 'Nord', team: 'Retail', sales: 1450, low: 1200, high: 1600, timestamp: null, amount: null, distanceM: null },
    { month: 'Mar', region: 'Sud', team: 'B2B', sales: 1720, low: 1500, high: 1900, timestamp: '2024-03-15T12:00:00.000Z', amount: 9876.5, distanceM: 3200 },
  ];

  readonly providerRows = [
    { month: 'Jan', region: 'Nord', team: 'B2B', sales: 1200, low: 1000, high: 1400 },
    { month: 'Fév', region: 'Nord', team: 'Retail', sales: 1450, low: 1200, high: 1600 },
    { month: 'Mar', region: 'Sud', team: 'B2B', sales: 1720, low: 1500, high: 1900 },
  ];

  readonly providerConfig: ChartProvider<string, number> = {
    title: 'Ventes mensuelles',
    xtitle: 'Mois',
    ytitle: 'Montant',
    series: [
      { name: 'Ventes', data: { x: field('month'), y: field('sales') } },
      { name: 'Prévision', color: '#d97732', data: { x: field('month'), y: field('high') } },
    ],
  };

  readonly dateSource = this.sourceRows.map(({ month, timestamp }) => ({ month, timestamp }));
  readonly amountSource = this.sourceRows.map(({ month, amount }) => ({ month, amount }));
  readonly distanceConverter = createUnitConverter([
    defineLinearUnit('m', { factor: 1 }),
    defineLinearUnit('km', { factor: 1000 }),
  ] as const);
  readonly temperatureConverter = createUnitConverter([
    defineLinearUnit('C', { factor: 1 }),
    defineLinearUnit('F', { factor: 5 / 9, offset: 32 }),
  ] as const);
  readonly unitConfig = {
    baseUnit: 'unités',
    scales: [
      { unit: 'unités', scale: 1, threshold: 999 },
      { unit: 'k', scale: 0.001, threshold: 999_999 },
      { unit: 'M', scale: 0.000001, threshold: Infinity },
    ],
  };

  selectedLocale = 'fr-FR';
  selectedTimeZone = 'Europe/Paris';
  precision = 2;

  intervalType: IntervalDemoType = 'quantile';
  intervalCount = 4;
  readonly intervalRows: IntervalRow[] = [
    { label: 'A', score: 4 },
    { label: 'B', score: 7 },
    { label: 'C', score: 8 },
    { label: 'D', score: 12 },
    { label: 'E', score: 18 },
    { label: 'F', score: 19 },
    { label: 'G', score: 24 },
    { label: 'H', score: 38 },
    { label: 'I', score: 42 },
    { label: 'J', score: 61 },
  ];

  pivotAggregate: PivotAggregate = 'sum';
  readonly pivotSourceRows = [
    { month: 'Jan', metric: 'Consommation', value: 120 },
    { month: 'Jan', metric: 'Production', value: 95 },
    { month: 'Fév', metric: 'Consommation', value: 145 },
    { month: 'Fév', metric: 'Production', value: 112 },
    { month: 'Fév', metric: 'Production', value: 8 },
    { month: 'Mar', metric: 'Consommation', value: 160 },
    { month: 'Mar', metric: 'Prévision', value: 150 },
  ];

  readonly organizerFields: OrganizerFieldDef[] = [
    organizerFieldDef('Ventes', { label: 'Ventes', groupable: true, sliceable: true }),
    organizerFieldDef('Prévision', { label: 'Prévision', groupable: true, sliceable: true }),
    organizerFieldDef('Marge', { label: 'Marge', optional: true, groupable: false, sliceable: true }),
  ];
  organizerState: OrganizerState = initialOrganizerState(this.organizerFields);

  snapshotLabel = 'Démonstration Core';
  snapshotFeedback = 'Aucun snapshot créé';
  readonly snapshotStorage = new VisualSnapshotStorage({
    storage: new DemoStorage(),
    storageKey: 'jquery-core-api-demo',
  });

  readonly syncGroupName = 'jquery-core-api-demo';
  readonly syncEvents: ChartGroupSyncEvent[] = [];
  fullscreenStatus = 'Le bouton testera le support du navigateur.';

  private readonly syncPublisherSource = Symbol('core-api-publisher');
  private readonly syncListenerSource = Symbol('core-api-listener');
  private readonly unregisterSync: () => void;

  constructor() {
    this.unregisterSync = registerChartGroupSync(
      this.syncGroupName,
      this.syncListenerSource,
      event => {
        this.syncEvents.unshift(event);
        this.syncEvents.splice(3);
      },
    );
  }

  ngOnDestroy(): void {
    this.unregisterSync();
  }

  get dateOptions() {
    return {
      locale: this.selectedLocale,
      timeZone: this.selectedTimeZone,
      format: { day: '2-digit', month: 'short', year: 'numeric' } as const,
    };
  }

  get formattedDateRows() {
    return formatChartDataDates(this.dateSource, ['timestamp'] as const, this.dateOptions);
  }

  get formattedAmountRows() {
    return formatChartDataValues(this.amountSource, ['amount'] as const, {
      locale: this.selectedLocale,
      precision: this.validPrecision,
    });
  }

  get mappedAmountRows() {
    return mapChartDataFields(this.amountSource, ['amount'] as const, value => value == null ? null : value * 1.2);
  }

  get convertedDistanceRows() {
    return convertChartDataValues(
      this.sourceRows,
      ['distanceM'] as const,
      this.distanceConverter,
      'm',
      'km',
    );
  }

  get validPrecision(): number {
    const value = Number(this.precision);
    return Number.isInteger(value) && value >= 0 && value <= 10 ? value : 2;
  }

  get normalizedInstant(): string {
    return normalizeChartDate(this.sourceRows[0].timestamp)?.toISOString() ?? 'null';
  }

  get formattedInstant(): string {
    return formatChartDate(this.sourceRows[0].timestamp, this.dateOptions) ?? 'null';
  }

  get providerOutput(): Record<string, unknown> {
    const sample = this.providerRows[0];
    const labels = new Map([
      ['Nord', 'Nord de la France'],
      ['Sud', 'Sud de la France'],
    ]);
    const range = rangeFields<number>('low', 'high')(sample, 0);
    const joined = joinFields(' · ', 'region', 'team')(sample, 0);
    const combined = combineFields(values => values.join(' / '), ['region', 'team'])(sample, 0);
    const joinedProviders = joinProviders(' / ', field<string>('region'), field<string>('team'))(sample, 0);
    const combinedProviders = combineProviders<string, string>(values => values.join(' + '), field<string>('region'), field<string>('team'))(sample, 0);
    const mapped = mapField<string>('region', labels)(sample, 0);
    const fixed = values<number>(10, 20, 30)(sample, 1);
    const grouped = groupBy(this.providerRows as [], field<string>('region'));
    const groupedByField = groupByFiled(this.providerRows as [], 'region');
    const sortedMonths = [...distinct(this.providerRows, [field<string>('month')])]
      .sort(naturalComparator('desc'));
    const sortedRows = [...this.providerRows].sort(naturalFieldComparator('asc', field<number>('sales')));

    return {
      field: field<number>('sales')(sample, 0),
      mapField: mapped,
      valuesAtIndex1: fixed,
      rangeFields: range,
      joinFields: joined,
      combineFields: combined,
      joinProviders: joinedProviders,
      combineProviders: combinedProviders,
      groupByKeys: Object.keys(grouped),
      groupByFiledKeys: Object.keys(groupedByField),
      distinctThenDesc: sortedMonths,
      naturalFieldComparatorFirst: sortedRows[0].month,
    };
  }

  get providerChartSummary(): ProviderChartSummary {
    const chart = buildChart(this.providerRows, this.providerConfig);
    const singleSeriesChart = buildSingleSerieChart(this.providerRows, this.providerConfig);
    return {
      categories: (chart.categories ?? []) as string[],
      series: chart.series.map(series => ({ name: series.name, data: series.data })),
      singleSeriesCount: singleSeriesChart.series.length,
    };
  }

  get sourceIsUnchanged(): boolean {
    return Math.abs((this.sourceRows[0].amount ?? 0) - 1234.567) < Number.EPSILON
      && this.sourceRows[0].distanceM === 2500
      && this.sourceRows[0].timestamp === '2024-01-15T23:30:00.000Z';
  }

  get distanceConversion(): string {
    return `${formatChartValue(convertUnitValue(2500, 'm', 'km', this.distanceConverter))} km`;
  }

  get temperatureConversion(): string {
    return `${formatChartValue(convertUnitValue(20, 'C', 'F', this.temperatureConverter), 1)} °F`;
  }

  get selectedUnitScale() {
    return selectBestScale(this.unitConfig, [999, 1_250_000]);
  }

  get unitExamples(): Array<{ source: string; output: string; unit: string }> {
    return [999, 1234.567, 1_250_000].map(value => {
      const scale = selectBestScale(this.unitConfig, [value]);
      return {
        source: formatChartValue(value),
        output: formatUnitValue(value, this.unitConfig.baseUnit, scale),
        unit: scale.unit,
      };
    });
  }

  get unitError(): string {
    return this.captureError(() => this.distanceConverter.convert(1, 'm', 'mile' as 'm' | 'km'));
  }

  get activeIntervalStrategy(): IntervalStrategy {
    const count = Math.max(2, Math.min(8, Number(this.intervalCount) || 4));
    switch (this.intervalType) {
      case 'quartile':
        return { type: 'quartile' };
      case 'equal-width':
        return { type: 'equal-width', count };
      case 'mean-stddev':
        return { type: 'mean-stddev', sigmas: [-2, -1, 0, 1, 2] };
      case 'jenks':
        return { type: 'jenks', count };
      case 'quantile':
      default:
        return { type: 'quantile', count };
    }
  }

  get intervalStats(): DataStats | null {
    return computeDataStats(this.intervalRows, row => row.score);
  }

  get generatedIntervals(): Interval<number>[] {
    return intervalsFromData(
      this.intervalRows,
      row => row.score,
      this.activeIntervalStrategy,
      {
        labelFn: (min, max) => {
          if (min === null) return `< ${formatChartValue(max!)}`;
          if (max === null) return `≥ ${formatChartValue(min)}`;
          return `${formatChartValue(min)} – ${formatChartValue(max)}`;
        },
      },
    );
  }

  get intervalAssignments(): Array<{ label: string; score: number; bucket: string }> {
    return this.intervalRows.map(row => ({
      ...row,
      bucket: resolveInterval(row.score, this.generatedIntervals)?.label ?? 'Hors intervalle',
    }));
  }

  get fixedIntervals(): Interval<number>[] {
    return intervalsByBreakpoints([10, 25, 50]);
  }

  get equalWidthIntervals(): Interval<number>[] {
    return intervalsByCount(0, 100, 4);
  }

  get intervalCategoryCounts(): Array<{ label: string; count: number; key: string }> {
    const categories = intervalCategories(this.generatedIntervals, row => row.score);
    return categories.map(category => ({
      key: category.key,
      label: category.label,
      count: this.intervalRows.filter(row => category.filter(row)).length,
    }));
  }

  get pivotOutput(): PivotRow[] {
    return pivotRows(this.pivotSourceRows, {
      index: 'month',
      columns: 'metric',
      values: ['value'],
      aggregate: this.pivotAggregate,
      fill: 0,
      columnValues: ['Consommation', 'Production', 'Prévision'],
      indexName: 'mois',
    });
  }

  get utilityOutput(): Record<string, unknown> {
    const base = { chart: { type: 'line' }, meta: { version: 1 } };
    const merged = mergeDeep({}, base, { chart: { title: 'Ventes' }, meta: { owner: 'Core' } });
    const withFunction = { ...merged, formatter: () => 'format' };
    const serializable = cloneSerializable(withFunction);
    return {
      isObject: Boolean(isObject(merged)),
      merged,
      containsFunctionBeforeClone: containsFunction(withFunction),
      containsFunctionAfterClone: containsFunction(serializable),
      serializable,
    };
  }

  get organizerSeriesFromProvider(): OrganizerFieldDef[] {
    return organizerFieldDefsFromChartSeries(this.providerConfig.series ?? []);
  }

  get groupableFields(): OrganizerFieldDef[] {
    return groupableOrganizerFields(this.organizerFields);
  }

  get sliceableFields(): OrganizerFieldDef[] {
    return sliceableOrganizerFields(this.organizerFields);
  }

  get appliedOrganizerProvider(): ChartProvider<string, number> {
    return applyOrganizerStateToSeries(this.providerConfig, this.organizerState);
  }

  get snapshotDraft(): VisualSnapshotDraft {
    return {
      type: 'chart',
      label: this.snapshotLabel.trim() || 'Démonstration Core',
      config: { provider: this.providerConfig.title, locale: this.selectedLocale },
      state: { selectedFields: this.organizerState.selectedFieldIds },
      data: [...this.sourceRows],
      warnings: [],
    };
  }

  get snapshots(): VisualSnapshot[] {
    return this.snapshotStorage.list();
  }

  toggleOrganizerField(id: string): void {
    const selected = new Set(this.organizerState.selectedFieldIds);
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    this.organizerState = {
      ...this.organizerState,
      selectedFieldIds: this.organizerFields
        .filter(fieldDefinition => selected.has(fieldDefinition.id))
        .map(fieldDefinition => fieldDefinition.id),
    };
  }

  isOrganizerFieldSelected(id: string): boolean {
    return this.organizerState.selectedFieldIds.includes(id);
  }

  createSnapshot(): void {
    try {
      const snapshot = this.snapshotStorage.create(this.snapshotDraft);
      this.snapshotFeedback = `Snapshot valide : ${snapshot.label} (${snapshot.schemaVersion})`;
    } catch (error: unknown) {
      this.snapshotFeedback = this.describeValue(error);
    }
  }

  renameLatestSnapshot(): void {
    const latest = this.snapshots[0];
    if (!latest) {
      this.snapshotFeedback = 'Aucun snapshot à renommer';
      return;
    }
    try {
      this.snapshotStorage.rename(latest.id, this.snapshotLabel);
      this.snapshotFeedback = `Snapshot renommé : ${this.snapshotLabel.trim()}`;
    } catch (error: unknown) {
      this.snapshotFeedback = this.describeValue(error);
    }
  }

  removeLatestSnapshot(): void {
    const latest = this.snapshots[0];
    if (!latest) {
      this.snapshotFeedback = 'Aucun snapshot à supprimer';
      return;
    }
    this.snapshotStorage.remove(latest.id);
    this.snapshotFeedback = `Snapshot supprimé : ${latest.label}`;
  }

  clearSnapshots(): void {
    this.snapshotStorage.clear();
    this.snapshotFeedback = 'Stockage vidé';
  }

  isStoredSnapshot(value: unknown): boolean {
    return isVisualSnapshot(value) && isRecord(value.config);
  }

  publishSync(action: GroupSyncAction): void {
    publishChartGroupSync({
      group: this.syncGroupName,
      action,
      source: this.syncPublisherSource,
      payload: action === 'tooltip'
        ? { xValue: 'Mar', startValue: 'Mar' }
        : { start: 1, end: 3, xAxisIndex: 0 },
    });
  }

  async toggleFullscreen(element: HTMLElement): Promise<void> {
    if (!FullscreenManager.isSupported(element)) {
      this.fullscreenStatus = 'Fullscreen API indisponible dans ce navigateur ou ce contexte.';
      return;
    }
    try {
      const active = await FullscreenManager.toggle(element);
      this.fullscreenStatus = active ? 'Zone en plein écran.' : 'Plein écran quitté.';
    } catch (error: unknown) {
      this.fullscreenStatus = this.describeValue(error);
    }
  }

  formatJson(value: unknown): string {
    try {
      return JSON.stringify(value, null, 2) ?? '';
    } catch {
      return this.describeValue(value);
    }
  }

  captureError(operation: () => unknown): string {
    try {
      operation();
      return 'Aucune erreur';
    } catch (error: unknown) {
      return this.describeValue(error);
    }
  }

  async copyCode(demo: CoreDemo): Promise<void> {
    await navigator.clipboard?.writeText(demo.code);
    demo.copied = true;
    window.setTimeout(() => demo.copied = false, 1500);
  }

  getSectionExample(section: ApiSection): string {
    return section.entries
      .map(entry => `// ${entry.name}\n${entry.code}`)
      .join('\n\n');
  }

  private describeValue(value: unknown): string {
    if (value instanceof Error) return value.message;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
      try {
        return JSON.stringify(value) ?? '<valeur non sérialisable>';
      } catch {
        return '<valeur non sérialisable>';
      }
    }
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'symbol') return value.toString();
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
      return value.toString();
    }
    return '<valeur non sérialisable>';
  }
}
