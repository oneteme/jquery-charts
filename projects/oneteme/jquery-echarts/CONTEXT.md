# Contexte — @oneteme/jquery-echarts

> Fichier de contexte local du projet `jquery-echarts`.  
> Branche : `jquery-echarts-integration`

---

## Rôle du projet

Renderer Angular pour la librairie **Apache ECharts** (v5/v6).  
Implémente la même interface utilisateur que `jquery-apexcharts` et `jquery-highcharts` en s'appuyant sur `@oneteme/jquery-core` pour les contrats de données.

---

## Architecture

```
projects/oneteme/jquery-echarts/src/lib/
├── component/
│   ├── chart.component.ts        ← Composant public <echarts-chart>
│   └── chart.component.html      ← Route vers la directive
└── directive/
    ├── chart.directive.ts        ← Orchestrateur unique (1 directive pour tous les types)
    └── utils/
        ├── echarts-init.ts       ← Import + re-export de l'instance echarts globale
        ├── types.ts              ← EChartsOption, ChartCustomEvent, ECHARTS_ICONS, DEFAULT_LOADING_OPTION
        ├── chart-utils.ts        ← buildBaseOption, applyCommonConfig, buildNoDataGraphic, getXAxisType
        └── config/
            ├── chart-config-registry.ts  ← Interface EChartTypeConfigurator + resolveConfigurator()
            ├── bar-config.ts             ← bar, column, columnpyramid
            ├── line-config.ts            ← line, spline, area, areaspline
            ├── pie-config.ts             ← pie, donut
            ├── scatter-config.ts         ← scatter, bubble
            ├── heatmap-config.ts         ← heatmap
            ├── treemap-config.ts         ← treemap (plat et multi-niveaux)
            ├── funnel-config.ts          ← funnel, pyramid
            ├── radar-config.ts           ← radar, radarArea
            └── range-config.ts           ← rangeBar, rangeColumn, arearange, areasplinerange, columnrange
```

---

## Choix d'architecture : 1 directive unique vs directives spécialisées

Contrairement à `jquery-apexcharts` (5 directives spécialisées), le renderer ECharts utilise **une seule directive** pour tous les types.

**Raisons :**
- ECharts expose une API unifiée `setOption()` : pas besoin de re-initialiser pour changer de type
- ECharts gère nativement `showLoading` / `hideLoading` : pas de DOM manuel
- ECharts est **synchrone** pour `setOption` : pas besoin de `fromPromise` + `asapScheduler` sur la promesse de rendu
- Le pattern Registry permet d'isoler la logique par type sans dupliquer la directive

---

## Avantages ECharts exploités

| Fonctionnalité ECharts | Implémentation jquery-echarts |
|------------------------|-------------------------------|
| `showLoading` / `hideLoading` | `_applyLoadingState()` — sans DOM |
| `setOption({ graphic })` | `_showNoData()` / `_hideNoData()` — texte "Aucune donnée" natif |
| `setOption(..., { notMerge })` | Force recalcul complet lors du changement de type |
| `chart.resize()` | `ResizeObserver` sur le conteneur |
| `toolbox.feature.myTool` | Boutons previous / next / pivot natifs ECharts |
| API synchrone | Pas de promesses dans le cycle de vie |
| Thèmes (`echarts.init(dom, theme)`) | Input `theme` sur `ChartComponent` et `ChartDirective` |
| `lazyUpdate` | Possibilité de batching si besoin futur |

---

## Contrat interface (identique aux autres renderers)

```typescript
// Utilisation identique à jquery-apexcharts / jquery-highcharts
<echarts-chart
  type="bar"
  [config]="myChartProvider"
  [data]="myData"
  [isLoading]="loading"
  [debug]="false"
  [theme]="'dark'"
  (customEvent)="onToolbarEvent($event)">
</echarts-chart>
```

Le `ChartProvider` est identique à celui utilisé avec les autres renderers.

---

## Types supportés

| ChartType (core) | Configurateur | Notes |
|-----------------|---------------|-------|
| `bar` | barConfigurator | Horizontal |
| `column` | barConfigurator | Vertical |
| `columnpyramid` | barConfigurator | Barres verticales (alias) |
| `line` | lineConfigurator | |
| `spline` | lineConfigurator | `smooth: true` |
| `area` | lineConfigurator | `areaStyle: {}` |
| `areaspline` | lineConfigurator | Smooth + area |
| `pie` | pieConfigurator | `buildSingleSerieChart` |
| `donut` | pieConfigurator | `radius: ['40%', '70%']` |
| `scatter` | scatterConfigurator | `continue: true` |
| `bubble` | scatterConfigurator | `symbolSize` basé sur z |
| `heatmap` | heatmapConfigurator | + `visualMap` |
| `treemap` | treemapConfigurator | Plat ou multi-niveaux |
| `funnel` | funnelConfigurator | `buildSingleSerieChart` |
| `pyramid` | funnelConfigurator | `sort: 'ascending'` |
| `radar` | radarConfigurator | `indicator` depuis catégories |
| `radarArea` | radarConfigurator | + `areaStyle` |
| `rangeBar` | rangeConfigurator | 2 séries bar empilées |
| `rangeColumn` | rangeConfigurator | 2 séries bar empilées |
| `arearange` | rangeConfigurator | 2 séries line |
| `areasplinerange` | rangeConfigurator | 2 séries line smooth |
| `columnrange` | rangeConfigurator | 2 séries bar |

---

## Registre des configurateurs (chart-config-registry.ts)

```typescript
export interface EChartTypeConfigurator {
  supports: (type: ChartType) => boolean;
  buildChartData: (data, config, type) => CommonChart<any, any>;   // buildChart ou buildSingleSerieChart
  buildOption: (chart, type, config) => EChartsOption;             // option spécifique au type
  tooltipTrigger: 'axis' | 'item';
}
```

Ordre de résolution : heatmap → treemap → funnel → radar → scatter → range → pie → line → bar (fallback)

---

## Pipeline de rendu

```
Angular inputs change
  ↓ ngOnChanges (asapScheduler.schedule)
  ↓ _render(changes)
  ↓
  Si isLoading  → showLoading() natif ECharts
  Si !data      → setOption({ graphic: noData }) + series: []
  Sinon :
    ↓ resolveConfigurator(type)
    ↓ configurator.buildChartData(data, config, type)
       → buildChart() ou buildSingleSerieChart() depuis @oneteme/jquery-core
    ↓ buildBaseOption(config, canPivot, onEvent)
       → title, legend, grid, toolbox (previous/next/pivot)
    ↓ configurator.buildOption(commonChart, type, config)
       → xAxis, yAxis, series, ...spécifique
    ↓ applyCommonConfig(merged, config)
       → mergeDeep avec config.options (options natives ECharts user)
    ↓ chart.setOption(option, { notMerge, lazyUpdate: false })
```

---

## Commandes

```bash
# Build
ng build @oneteme/jquery-echarts

# Build avec core
npm run cb4

# Dev watch
npm run watch-b4
```
