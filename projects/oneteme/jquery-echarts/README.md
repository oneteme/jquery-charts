# @oneteme/jquery-echarts

Angular renderer for [Apache ECharts](https://echarts.apache.org/), built on top of [@oneteme/jquery-core](https://www.npmjs.com/package/@oneteme/jquery-core).

> **Documentation et démonstrations** : [ouvrir l'application de documentation](https://oneteme.github.io/jquery-charts/)
>
> La documentation interactive permet de comparer les types ECharts, les états de chargement et d'absence de données, l'Organizer et la synchronisation entre graphiques.

## Overview

This library provides an Angular component and directive to render interactive charts using Apache ECharts, with full integration with the `@oneteme/jquery-core` data model.

**Supported chart types:** `bar`, `column`, `columnpyramid`, `line`, `spline`, `area`, `areaspline`, `mixed`, `pie`, `donut`, `scatter`, `bubble`, `heatmap`, `radar`, `radarArea`, `treemap`, `funnel`, `pyramid`, `rangeBar`, `rangeColumn`, `arearange`, `areasplinerange`, `columnrange`

## Fonctionnalités intégrées

- **Renderer configurable** : SVG par défaut, ou Canvas via `[renderer]`.
- **Thème ECharts** : le thème est fourni à la création de l'instance via `[theme]`.
- **Options natives** : `[renderedOption]` permet de fournir une option ECharts déjà construite ; les événements et états du wrapper restent actifs.
- **Synchronisation** : `[group]` et `[groupSync]` synchronisent le tooltip et/ou le zoom avec d'autres graphiques, y compris avec les renderers de la suite.
- **Organizer contrôlé** : `[organizer]` et `[organizerState]` pilotent la visibilité des séries sans coupler le composant à l'interface Organizer.
- **Drilldown, export et snapshots** : les événements de navigation, `exportImage`, `exportData`, `createVisualSnapshot` et `applyVisualSnapshot` sont disponibles sur `ChartComponent`.

## Installation

```bash
npm install @oneteme/jquery-echarts
```

> **Note:** This package requires `echarts` as a peer dependency. It is installed automatically with npm v7+. If not, install it manually:
> ```bash
> npm install echarts
> ```

## Requirements

| Peer dependency         | Version        |
|-------------------------|----------------|
| `@angular/core`         | `>= 16.1.0`    |
| `@angular/common`       | `>= 16.1.0`    |
| `echarts`               | `^6.0.0`       |
| `@oneteme/jquery-core`  | `^0.0.36`      |

## Usage

### Import

Import `ChartComponent` in your Angular module or standalone component:

```typescript
import { ChartComponent } from '@oneteme/jquery-echarts';

@NgModule({
  imports: [ChartComponent]
})
export class AppModule {}
```

### Basic example

```html
<chart
  [type]="'bar'"
  [config]="chartConfig"
  [data]="chartData"
  [isLoading]="isLoading"
  (renderError)="handleChartError($event)">
</chart>
```

```typescript
import { ChartProvider, field } from '@oneteme/jquery-core';

chartConfig: ChartProvider<string, number> = {
  title: 'Monthly Sales',
  series: [
    { name: 'Revenue', data: { x: field('month'), y: field('revenue') } }
  ]
};

chartData = [
  { month: 'Jan', revenue: 4200 },
  { month: 'Feb', revenue: 5800 },
  { month: 'Mar', revenue: 3900 }
];

handleChartError(event: ChartRenderError): void {
  console.error('Le graphique ne peut pas etre rendu', event.error);
}
```

Pour les configurations persistees, les coordonnees peuvent aussi etre definies sans fonction : `data: { xField: 'month', yField: 'revenue' }`.

### Inputs

| Input          | Type                        | Required | Default                         | Description                                      |
|----------------|-----------------------------|----------|---------------------------------|--------------------------------------------------|
| `type`         | `ChartType`                 | ✅       | —                               | Type of chart to render                          |
| `config`       | `ChartProvider<X, Y>`       | ✅       | —                               | Chart configuration from `@oneteme/jquery-core`  |
| `data`         | `any[]`                     | ✅       | —                               | Raw data array                                   |
| `isLoading`    | `boolean`                   |          | `false`                         | Shows a loading overlay                          |
| `organizer`    | `OrganizerConfig`           |          | —                               | Enables series visibility toggling               |
| `organizerState` | `OrganizerState`           |          | —                               | Controlled series visibility state from `jquery-core` |
| `theme`        | `string`                    |          | `null`                          | ECharts theme name; set at instance creation     |
| `renderer`     | `'svg' \| 'canvas'`         |          | `'svg'`                         | Rendering mode; set at instance creation         |
| `loadingLabel` | `string`                    |          | `'Chargement des données...'`   | Label shown during loading                       |
| `noDataLabel`  | `string`                    |          | `'Aucune donnée'`               | Label shown when data is empty                   |
| `group`        | `string \| null`            |          | `null`                          | Group ID; set at instance creation               |
| `groupSync`    | `GroupSyncMode \| null`     |          | `null`                          | Synchronization mode; set at instance creation   |
| `debug`        | `boolean`                   |          | `false`                         | Logs ECharts option to the console               |

### Outputs

| Output        | Type                        | Description                              |
|---------------|-----------------------------|------------------------------------------|
| `customEvent` | `EventEmitter<ChartCustomEvent>` | Emitted on toolbar actions (`previous`, `next`, `pivot`) |
| `chartClick`   | `EventEmitter<any>`             | Emitted when a chart datum is clicked             |
| `renderError`  | `EventEmitter<ChartRenderError>` | Emitted when configuration construction or ECharts rendering fails |

`theme`, `renderer`, `group` and `groupSync` are applied when the ECharts instance is created. Recreate the component to change them. Group events are exchanged through the shared `jquery-core` synchronization contract, so an ECharts chart can synchronize with a Highcharts chart using the same group ID.

### Chart synchronization

Charts sharing the same `group` ID can be synchronized:

```html
<chart type="line" [config]="config1" [data]="data1" group="my-group" groupSync="all"></chart>
<chart type="bar"  [config]="config2" [data]="data2" group="my-group" groupSync="all"></chart>
```

**`groupSync` values:**
- `'all'` — Zoom and tooltip synchronization
- `'datazoom'` — Zoom only
- `'tooltip'` — Tooltip only
- `['datazoom', 'tooltip']` — Combined manual sync

When `datazoom` is enabled, the wrapper provides an ECharts inside/slider dataZoom control for cartesian charts. Series legends remain local to each chart instance.

### View panel (series visibility)

Pass an `OrganizerConfig` to enable the series toggle panel:

```html
<chart [type]="'line'" [config]="config" [data]="data" [organizer]="organizerConfig"></chart>
```

```typescript
import { OrganizerConfig } from '@oneteme/jquery-core';

organizerConfig: OrganizerConfig = {
  enabled: true,
  enableFieldRemoval: true,
  enableFieldDragDrop: true
};
```

`organizerState` is optional and uses the `OrganizerState` contract from `@oneteme/jquery-core` (`selectedFieldIds`, `groupByKey`, `dynamicSliceKeys`). It controls the visibility of available chart series. This contract is intentionally separate from the state emitted by `@oneteme/jquery-organizer`, whose UI state can cover additional actions such as field selection and slices.

### Mixed charts and double Y axes

Use `type: 'mixed'` to combine columns, bars and lines. Set `yAxisIndex` to attach each series to the left axis (`0`) or right axis (`1`). A maximum of two Y axes is supported.

```typescript
import { ChartProvider, field } from '@oneteme/jquery-core';

mixedConfig: ChartProvider<string, number> = {
  title: 'Production et température',
  ytitle: ['Production (MWh)', 'Température (°C)'],
  series: [
    {
      name: 'Production',
      type: 'column',
      unit: 'MWh',
      yAxisIndex: 0,
      data: { x: field('month'), y: field('production') }
    },
    {
      name: 'Température',
      type: 'line',
      unit: '°C',
      yAxisIndex: 1,
      data: { x: field('month'), y: field('temperature') }
    }
  ]
};
```

`yAxisConfig` permet de personnaliser chaque axe (`min`, `max`, `splitNumber`, `offset`, `alignTicks`, `axisLine`, `axisLabel`, `splitLine`). Les séries rattachées au même axe partagent sa configuration.

### Pivot de données avec `pivotRows`

`pivotRows` appartient à `@oneteme/jquery-core` et prépare des données longues avant leur rendu ECharts. Les doublons sont agrégés et les combinaisons absentes sont remplies avec `fill`.

```typescript
import { field, pivotRows } from '@oneteme/jquery-core';

const rows = [
  { usage: 'Eclairage', authorization: 'beneficiaire', consumption: 120 },
  { usage: 'Eclairage', authorization: 'beneficiaire', consumption: 30 },
  { usage: 'Eclairage', authorization: 'titulaire', consumption: 80 }
];

const data = pivotRows(rows, {
  index: 'usage',
  columns: 'authorization',
  values: ['consumption'],
  aggregate: 'sum',
  columnValues: ['beneficiaire', 'titulaire', 'absent'],
  fill: 0
});

chartData = data;
chartConfig = {
  title: 'Consommation par usage',
  series: [
    { name: 'Bénéficiaire', data: { x: field('usage'), y: field('consumption_beneficiaire') } },
    { name: 'Titulaire', data: { x: field('usage'), y: field('consumption_titulaire') } }
  ]
};
```

Options complémentaires : `indexValues` force des lignes attendues, `missingKey` vaut `empty`, `skip` ou `error`, `normalizeKey` normalise les clés et `columnName` personnalise les noms générés. Les agrégations `sum`, `min` et `max` nécessitent des valeurs numériques ; `count` compte les valeurs non nulles.

### Export

Le composant expose deux méthodes publiques :

```typescript
@ViewChild(ChartComponent) chart?: ChartComponent<any, any>;

exportPng(): void {
  this.chart?.exportImage('rapport', 'png', 2);
}

exportCsv(): void {
  this.chart?.exportData('rapport.csv', ';');
}
```

### Low-level directive

For advanced use cases, the `ChartDirective` is also exported and can be used directly on any `div`:

```html
<div echarts-chart
     [type]="'pie'"
     [config]="config"
     [data]="data">
</div>
```

## Additional Documentation

For more information, examples and the full data model reference, see the [main project documentation](https://github.com/oneteme/jquery-charts).
