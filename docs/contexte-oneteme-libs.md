# AGENT CONTEXT — oneteme core/highcharts

Updated: 2026-02-13
Purpose: quick operational memory for future tasks.
Scope:
- projects/oneteme/jquery-core
- projects/oneteme/jquery-highcharts

## 0. Mental model (must keep)
- jquery-core = data contract + transformation engine (renderer-agnostic).
- jquery-highcharts = Angular wrapper + runtime rendering with Highcharts.
- Rule: business/data shape changes start in core contract, then ensure highcharts compatibility.

## 1. High priority entry points
CORE:
- projects/oneteme/jquery-core/src/public-api.ts
- projects/oneteme/jquery-core/src/lib/jquery-core.model.ts
- projects/oneteme/jquery-core/src/lib/utils.ts
- projects/oneteme/jquery-core/src/lib/stream.ts (exists, not exported)

HIGHCHARTS:
- projects/oneteme/jquery-highcharts/src/public-api.ts
- projects/oneteme/jquery-highcharts/src/lib/component/chart.component.ts
- projects/oneteme/jquery-highcharts/src/lib/directive/chart.directive.ts
- projects/oneteme/jquery-highcharts/src/lib/directive/utils/config/chart-config-registry.ts
- projects/oneteme/jquery-highcharts/src/lib/directive/utils/config/map-config.ts
- projects/oneteme/jquery-highcharts/src/lib/directive/utils/loading.ts
- projects/oneteme/jquery-highcharts/src/lib/directive/utils/toolbar.ts
- projects/oneteme/jquery-highcharts/src/lib/directive/utils/highcharts-modules.ts

## 2. Public API snapshot
CORE exports:
- ./lib/jquery-core.model
- ./lib/utils

HIGHCHARTS exports:
- side-effect import: ./lib/directive/utils/highcharts-modules
- ./lib/directive/chart.directive
- ./lib/component/chart.component

## 3. Contract facts (core)
- ChartType is wide union + string fallback.
- ChartProvider includes:
  - title/subtitle/xtitle/ytitle
  - width/height
  - stacked, pivot, continue, xorder
  - series, options, showToolbar
  - mapEndpoint, mapParam, mapDefaultValue, mapColor, mapJoinBy
- SerieProvider supports provider/static values: name/stack/color/type/visible.

Core transformation functions:
- buildChart(...): main normalizer to CommonChart.
- buildSingleSerieChart(...): simple chart helper with merge/pivot behavior.
- distinct, naturalComparator, naturalFieldComparator.
- field/values/mapField/joinFields/combineFields/rangeFields.

## 4. Runtime facts (highcharts)
ChartComponent:
- standalone wrapper, selector: chart
- cycles chart types via custom events: previous/next
- toggles config.pivot on pivot event
- guards pivot capability by type

ChartDirective:
- owns chart lifecycle (create/update/destroy)
- async map loading path when type=map + mapEndpoint
- ResizeObserver -> chart.setSize on container resize
- loading/no-data/error states handled centrally

Build path:
1) updateChart
2) if map with endpoint -> createMapChartAsync (fetch GeoJSON)
3) buildChartOptions
4) Highcharts.chart or Highcharts.mapChart
5) toolbar + loading + validation rendering

## 5. Type conversion system (critical)
File: chart-config-registry.ts
- registry dispatches configure/enforce/transform by chart family:
  - polar, range, scatter, bubble, heatmap, treemap, map, simple charts
- central helpers:
  - applyChartConfigurations
  - enforceCriticalOptions
  - transformChartData
  - needsDataConversion
  - detectPreviousChartType

Implication:
- cross-type transitions should be implemented via registry, not ad-hoc in directive.

## 6. Map behavior (critical)
File: map-config.ts
- DEFAULT_MAP_JOINBY = ['code','code']
- buildMapUrl(endpoint, param='subdiv', default='region')
- loadGeoJSON via fetch
- code->name mapping extraction from GeoJSON properties
- standard<->map data conversion exists
- color presets: blue/green/purple/orange/grey

Directive interaction:
- if custom map is not provided in options.chart.map and GeoJSON loaded, inject loaded map.

## 7. Loading/toolbar behavior
loading.ts:
- updateChartLoadingState(chart, isLoading, hasData, hasValidationError)
- hides chart content while loading + no data
- controls no-data and validation messages

toolbar.ts:
- injects custom toolbar DOM in chart container
- emits previous/next/pivot
- uses SVG icons from assets

## 8. Packaging/dependency constraints
CORE package:
- @oneteme/jquery-core 0.0.26
- peer: @angular/common/core >=16.1
- sideEffects: false

HIGHCHARTS package:
- @oneteme/jquery-highcharts 0.0.11
- peers: angular >=16.1, highcharts ^11.4.3, @oneteme/jquery-core ^0.0.26
- sideEffects includes highcharts-modules.ts (required init)

ng-packagr:
- core -> dist/oneteme/jquery-core
- highcharts -> dist/oneteme/jquery-highcharts (+ assets styles/icons)

## 9. Fast decision tree for future tasks
If request is about...
- Data mapping / pivot / categories / xorder -> core jquery-core.model.ts first.
- Rendering issue / chart lifecycle / loading UI -> chart.directive.ts + loading.ts.
- Type-specific behavior -> chart-config-registry.ts + matching config/* file.
- Map endpoint/GeoJSON/joinBy/tooltip -> map-config.ts + map path in directive.
- Toolbar events or pivot button -> chart.component.ts + toolbar.ts.
- Missing Highcharts module feature -> highcharts-modules.ts + package sideEffects.

## 10. Known risk notes
- ChartType allows arbitrary string -> runtime guards important.
- stream.ts not in public API (verify intentional before using externally).
- stream.ts groupBy implementation looks suspicious; re-check before relying.
- map tooltips currently format values as population-like text in fr-FR.

## 11. Working rule for future edits
- Keep fixes minimal and local.
- Prefer registry-based extension for new chart types.
- Preserve public API unless task explicitly asks breaking change.
- After any chart option merge, preserve critical options enforcement.
