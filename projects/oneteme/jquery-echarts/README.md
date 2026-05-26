# @oneteme/jquery-echarts

Angular renderer for [Apache ECharts](https://echarts.apache.org/), built on top of [@oneteme/jquery-core](https://www.npmjs.com/package/@oneteme/jquery-core).

## Overview

This library provides an Angular component and directive to render interactive charts using Apache ECharts, with full integration with the `@oneteme/jquery-core` data model.

**Supported chart types:** `bar`, `columnpyramid`, `line`, `area`, `pie`, `donut`, `scatter`, `heatmap`, `radar`, `treemap`, `funnel`, `range`

## Installation

```bash
npm install @oneteme/jquery-echarts@beta
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
| `@oneteme/jquery-core`  | `^0.0.30`      |

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
  [isLoading]="isLoading">
</chart>
```

```typescript
import { ChartProvider } from '@oneteme/jquery-core';

chartConfig: ChartProvider<string, number> = {
  title: 'Monthly Sales',
  series: [
    { name: 'Revenue', field: 'revenue' }
  ]
};

chartData = [
  { month: 'Jan', revenue: 4200 },
  { month: 'Feb', revenue: 5800 },
  { month: 'Mar', revenue: 3900 }
];
```

### Inputs

| Input          | Type                        | Required | Default                         | Description                                      |
|----------------|-----------------------------|----------|---------------------------------|--------------------------------------------------|
| `type`         | `ChartType`                 | ✅       | —                               | Type of chart to render                          |
| `config`       | `ChartProvider<X, Y>`       | ✅       | —                               | Chart configuration from `@oneteme/jquery-core`  |
| `data`         | `any[]`                     | ✅       | —                               | Raw data array                                   |
| `isLoading`    | `boolean`                   |          | `false`                         | Shows a loading overlay                          |
| `view`         | `ViewConfig`                |          | —                               | Enables series visibility toggling (View panel)  |
| `theme`        | `string`                    |          | `null`                          | ECharts theme name                               |
| `renderer`     | `'svg' \| 'canvas'`         |          | `'svg'`                         | ECharts rendering mode                           |
| `loadingLabel` | `string`                    |          | `'Chargement des données...'`   | Label shown during loading                       |
| `noDataLabel`  | `string`                    |          | `'Aucune donnée'`               | Label shown when data is empty                   |
| `group`        | `string \| null`            |          | `null`                          | Group ID for chart synchronization               |
| `groupSync`    | `GroupSyncMode \| null`     |          | `null`                          | Synchronization mode within the group            |
| `debug`        | `boolean`                   |          | `false`                         | Logs ECharts option to the console               |

### Outputs

| Output        | Type                        | Description                              |
|---------------|-----------------------------|------------------------------------------|
| `customEvent` | `EventEmitter<ChartCustomEvent>` | Emitted on toolbar actions (`previous`, `next`, `pivot`) |

### Chart synchronization

Charts sharing the same `group` ID can be synchronized:

```html
<chart type="line" [config]="config1" [data]="data1" group="my-group" groupSync="all"></chart>
<chart type="bar"  [config]="config2" [data]="data2" group="my-group" groupSync="all"></chart>
```

**`groupSync` values:**
- `'all'` — Full sync via `echarts.connect()` (zoom + tooltip + legend)
- `'datazoom'` — Zoom only
- `'tooltip'` — Tooltip only
- `['datazoom', 'tooltip']` — Combined manual sync

### View panel (series visibility)

Pass a `ViewConfig` to enable the series toggle panel:

```html
<chart [type]="'line'" [config]="config" [data]="data" [view]="viewConfig"></chart>
```

```typescript
import { ViewConfig } from '@oneteme/jquery-core';

viewConfig: ViewConfig = {
  fields: [
    { key: 'revenue', label: 'Revenue' },
    { key: 'cost',    label: 'Cost' }
  ]
};
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
