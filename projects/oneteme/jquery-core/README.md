# @oneteme/jquery-core

`@oneteme/jquery-core` fournit les contrats de donnees et les transformations partages par les bibliotheques `@oneteme/jquery-echarts`, `@oneteme/jquery-highcharts`, `@oneteme/jquery-apexcharts` et `@oneteme/jquery-table`. Le package ne rend aucun composant : il centralise les providers, la preparation de donnees, l'etat Organizer, les snapshots et les utilitaires associes.

> **Documentation et démonstrations** : [ouvrir l'application de documentation](https://oneteme.github.io/jquery-charts/)
>
> L'application présente les contrats communs en situation, avec des exemples de graphiques, de tableaux, d'Organizer, de synchronisation, de drilldown et de snapshots visuels.

## Nouveautés intégrées

Les contrats transverses couvrent désormais les fonctionnalités utilisées par les renderers :

- synchronisation de groupe des tooltips et du zoom via `GroupSyncMode` ;
- navigation hiérarchique avec `ChartDrilldownConfig`, `ChartDrilldownRequest` et `ChartDrilldownState` ;
- snapshots visuels sérialisables avec `VisualSnapshotStorage` ;
- copie/restauration de configuration et gestion du plein écran via `FullscreenManager` ;
- transformations de dates, nombres et unités conservant un comportement explicite pour les valeurs invalides.

## Installation

```bash
npm install @oneteme/jquery-core
```

Le package declare `@angular/core` et `@angular/common` en peer dependencies (`>=16.1.0`) pour rester compatible avec les bibliotheques Angular de la suite.

## Graphiques

Un `ChartProvider` decrit le titre, les axes, la synchronisation optionnelle et les series. Une serie utilise un `CoordinateProvider` pour extraire ses valeurs X et Y de chaque ligne.

```typescript
import { ChartProvider, field } from '@oneteme/jquery-core';

const data = [
	{ month: 'Jan', revenue: 4200 },
	{ month: 'Feb', revenue: 5800 },
];

const config: ChartProvider<string, number> = {
	title: 'Chiffre d affaires mensuel',
	ytitle: 'EUR',
	series: [
		{
			name: 'Revenu',
			data: { x: field('month'), y: field('revenue') },
		},
	],
};
```

Les propriétés principales de `ChartProvider` sont `title`, `subtitle`, `xtitle`, `ytitle`, `stacked`, `pivot`, `continue`, `xorder`, `series`, `options`, `group`, `groupSync` et `yUnit`. Une `SerieProvider` peut aussi définir `name`, `stack`, `color`, `type`, `visible`, `unit`, `yAxisIndex` et `yAxisConfig`.

### Coordonnees et persistance JSON

Deux formes de coordonnées sont acceptées :

```typescript
// Provider TypeScript, pour une projection calculée.
data: { x: field('month'), y: field('revenue') }

// Configuration sérialisable, pour une API ou localStorage.
data: { xField: 'month', yField: 'revenue' }
```

`xField` et `yField` doivent être des chaînes non vides. Elles sont transformées en providers au moment de construire le graphique. Les fonctions ne doivent pas être enregistrées avec `JSON.stringify` : elles sont supprimées pendant la sérialisation.

### Providers de données

Un `DataProvider<T>` a la signature `(row, index) => T`. Les helpers suivants couvrent les cas courants :

```typescript
import {
	combineFields,
	combineProviders,
	field,
	joinFields,
	joinProviders,
	mapField,
	rangeFields,
	values,
} from '@oneteme/jquery-core';

field<number>('revenue');
values('Jan', 'Feb', 'Mar');
mapField('status', new Map([['ok', 'Disponible']]));
joinFields(' / ', 'region', 'site');
rangeFields<number>('minimum', 'maximum');
combineFields(parts => parts.join('-'), ['region', 'site']);
joinProviders(' ', field('firstName'), field('lastName'));
combineProviders(values => values.reduce((total, value) => total + value, 0), field<number>('a'), field<number>('b'));
```

`rangeFields(min, max)` produit un tableau `[min, max]` adapté aux graphiques de plage. `values(...)` sélectionne une valeur par index. `distinct`, `groupBy`, `naturalComparator` et `naturalFieldComparator` restent disponibles pour les traitements de données avancés.

### Construction des données de rendu

Les moteurs de graphiques appellent généralement ces deux fonctions ; elles sont exposées pour les intégrations personnalisées :

```typescript
import { buildChart, buildSingleSerieChart } from '@oneteme/jquery-core';

const chart = buildChart(data, config);
const singleSeriesChart = buildSingleSerieChart(data, config);
```

`buildChart` retourne des catégories et des séries normalisées. `buildSingleSerieChart` fusionne les séries lorsque le type de graphique attend une série unique. Les options `pivot`, `continue` et `xorder` du provider sont prises en compte.

### Axes et unités

`ytitle` accepte une chaîne ou un tableau pour les graphiques à axes multiples. La propriété `yUnit` accepte une chaîne simple ou un `UnitConfig` avec des échelles de conversion :

```typescript
const config: ChartProvider<string, number> = {
	yUnit: {
		baseUnit: 's',
		scales: [
			{ unit: 'ms', scale: 1000, threshold: 0 },
			{ unit: 's', scale: 1, threshold: 1 },
		],
	},
	series: [],
};
```

Chaque `ScaleConfig` définit `unit`, `scale`, `threshold` et, optionnellement, un formatage personnalisé via `UnitConfig.formatter`.

## Transformation de données

`pivotRows` convertit des lignes longues en lignes pivotées. Il agrège les doublons et complète les combinaisons absentes.

```typescript
import { pivotRows } from '@oneteme/jquery-core';

const rows = [
	{ usage: 'Eclairage', authorization: 'beneficiaire', consumption: 120 },
	{ usage: 'Eclairage', authorization: 'titulaire', consumption: 80 },
];

const pivoted = pivotRows(rows, {
	index: 'usage',
	columns: 'authorization',
	values: ['consumption'],
	aggregate: 'sum',
	columnValues: ['beneficiaire', 'titulaire'],
	fill: 0,
});

// [{ usage: 'Eclairage', consumption_beneficiaire: 120, consumption_titulaire: 80 }]
```

`aggregate` accepte `sum`, `count`, `min`, `max` ou une fonction. `indexValues` et `columnValues` imposent les valeurs attendues. `missingKey` contrôle les clés absentes (`empty`, `skip`, `error`) et `columnName` personnalise les noms de colonnes générés.

## Intervalles et catégories

Les helpers d'intervalles classent des valeurs numériques ou des dates et peuvent produire directement des catégories de découpage.

```typescript
import {
	intervalCategories,
	intervalsByBreakpoints,
	intervalsFromData,
	resolveInterval,
} from '@oneteme/jquery-core';

const intervals = intervalsByBreakpoints([100, 300, 500]);
const current = resolveInterval(340, intervals);
const categories = intervalCategories(intervals, row => row.duration);
```

`intervalsByCount` crée des classes de largeur égale. `intervalsFromData` calcule des classes depuis les données avec les stratégies `quartile`, `quantile`, `equal-width`, `mean-stddev` ou `jenks`. `computeDataStats` retourne les statistiques utilisées pour ces stratégies : min, max, moyenne, médiane, quartiles, écart-type et percentiles.

## Utilitaires de donnees de graphiques

Les utilitaires de donnees sont purs et ne dependent pas du navigateur. Les dates utilisent `Intl.DateTimeFormat` avec une locale et un fuseau configurables ; le fuseau par defaut est `UTC` pour eviter une dependance implicite a l'environnement.

```typescript
import {
  convertChartDataValues,
  createUnitConverter,
  defineLinearUnit,
  formatChartDataDates,
  formatChartDataValues,
} from '@oneteme/jquery-core';

const units = createUnitConverter([
  defineLinearUnit('m', { factor: 1 }),
  defineLinearUnit('km', { factor: 1000 }),
]);

const displayData = formatChartDataDates(rows, ['date'], {
  locale: 'fr-FR',
  timeZone: 'Europe/Paris',
  format: { day: '2-digit', month: '2-digit', year: 'numeric' },
});
const formattedValues = formatChartDataValues(rows, ['value'], {
  locale: 'fr-FR',
  precision: 2,
});
const convertedValues = convertChartDataValues(rows, ['value'], units, 'm', 'km');
```

`normalizeChartDate`, `formatChartDate` et `formatChartNumber` traitent les valeurs nulles en les conservant. Les dates, nombres invalides et valeurs non finies lèvent une erreur par défaut ; les options `invalidDate: 'null'` et `invalidNumber: 'null'` permettent un comportement explicite. `convertChartDataValues` exige des unites enregistrees et des nombres finis : une unite inconnue ne declenche aucun fallback silencieux. Les transformations retournent un nouveau tableau et de nouvelles lignes superficielles.

## Organizer

Les contrats Organizer sont indépendants des composants visuels. Ils servent à décrire les champs disponibles et à appliquer la visibilité de séries de manière immuable.

```typescript
import {
	applyOrganizerStateToSeries,
	initialOrganizerState,
	organizerFieldDef,
} from '@oneteme/jquery-core';

const fields = [
	organizerFieldDef('Production'),
	organizerFieldDef('Prevision', { optional: true }),
];
const state = initialOrganizerState(fields);
const visibleConfig = applyOrganizerStateToSeries(config, state);
```

`OrganizerState` contient `selectedFieldIds`, `groupByKey` et `dynamicSliceKeys`. `organizerFieldDefsFromChartSeries`, `groupableOrganizerFields` et `sliceableOrganizerFields` permettent de construire et filtrer les champs d'une interface Organizer.

## Capacités communes des graphiques

Les wrappers ECharts et Highcharts partagent les contrats `ChartClickEvent`, `ChartRenderError`, `ChartDrilldownConfig`, `ChartDrilldownRequest`, `ChartDrilldownState`, `GroupSyncMode` et `ChartExportImageType`. Les applications peuvent donc brancher les événements, le drilldown, la synchronisation de groupe (`datazoom`, `tooltip`) et les exports sans dépendre du moteur de rendu.

## Snapshots visuels

`VisualSnapshotStorage` stocke des copies sérialisables de tableaux ou graphiques dans `localStorage` par défaut. L'application reste responsable de convertir ses propres configurations en JSON transportable.

```typescript
import { VisualSnapshotStorage } from '@oneteme/jquery-core';

const storage = new VisualSnapshotStorage({ storageKey: 'dashboard:snapshots' });
const snapshot = storage.create({
	type: 'chart',
	label: 'Consommation mensuelle',
	config: { type: 'line' },
	state: {},
	data: [{ month: 'Jan', usage: 112 }],
	warnings: [],
});

storage.list();
storage.rename(snapshot.id, 'Consommation');
storage.remove(snapshot.id);
```

Les méthodes disponibles sont `list`, `get`, `create`, `replace`, `rename`, `remove`, `clear` et `isLabelAvailable`. `DuplicateVisualSnapshotLabelError` signale un libellé déjà utilisé. Le format est versionné avec `schemaVersion: 1`; `isVisualSnapshot` permet de valider une donnée restaurée.

## Plein écran et sérialisation

```typescript
import { cloneSerializable, containsFunction, FullscreenManager } from '@oneteme/jquery-core';

const serializable = cloneSerializable(config);
const hasCallbacks = containsFunction(config);
const supported = FullscreenManager.isSupported(element);
await FullscreenManager.toggle(element);
```

`cloneSerializable` produit une copie JSON et retire les fonctions. `containsFunction` détecte les callbacks dans les objets, y compris en présence de références cycliques. `FullscreenManager` expose `isSupported`, `isActive` et `toggle` autour de la Fullscreen API du navigateur.

## Développement et publication

Depuis la racine du workspace :

```bash
npm run cb4
```

Cette commande construit `jquery-core` puis `jquery-echarts`. Pour publier Core seul :

```bash
ng build @oneteme/jquery-core
cd dist/oneteme/jquery-core
npm publish
```

Publiez `@oneteme/jquery-core` avant les packages qui déclarent une nouvelle peer dependency vers cette version.
