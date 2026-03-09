# Contexte Copilot — jquery-charts (oneteme)

> Fichier de contexte local. Non versionné (`.gitignore`).  
> Branch courante : `jquery-echarts-integration`  
> Objectif de la branch : intégration de la librairie **ECharts** comme nouveau renderer.

---

## Vue d'ensemble du monorepo

```
jquery-charts/
├── projects/oneteme/
│   ├── jquery-core/          ← Contrats de données + transformations (source of truth)
│   ├── jquery-highcharts/    ← Renderer Angular + Highcharts (le plus complet)
│   ├── jquery-apexcharts/    ← Renderer Angular + ApexCharts (plus simple)
│   └── jquery-table/         ← Composant table Material avec filtres/groupement
└── src/app/                  ← App de démo/documentation
```

### Dépendances inter-projets

```
jquery-core
  ├─→ jquery-highcharts   (imports: ChartProvider, buildChart, mergeDeep, ...)
  ├─→ jquery-apexcharts   (imports: ChartProvider, buildChart, mergeDeep, ...)
  └─→ jquery-table        (imports: DataProvider uniquement)
```

---

## PROJECT 1 : jquery-core

**Rôle** : Source of truth — définit les contrats de données et les transformations génériques.

### Types principaux (`jquery-core.model.ts`)

| Symbole | Nature | Description |
|---------|--------|-------------|
| `ChartType` | union type | Tous les types supportés : `pie`, `donut`, `funnel`, `pyramid`, `polar`, `radar`, `radarArea`, `radial`, `radialBar`, `bar`, `column`, `columnpyramid`, `line`, `area`, `spline`, `areaspline`, `scatter`, `bubble`, `treemap`, `heatmap`, `boxplot`, `columnrange`, `arearange`, `areasplinerange`, `rangeArea`, `rangeBar`, `rangeColumn`, `map`, `string` |
| `XaxisType` | type | `number \| string \| Date` |
| `YaxisType` | type | `number \| number[]` |
| `DataProvider<T>` | type | `(o: any, idx: number) => T` — fonction d'extraction/transformation |
| `Coordinate2D` | interface | `{x: XaxisType, y: YaxisType}` |
| `CoordinateProvider<X,Y>` | interface | `{x: DataProvider<X>, y: DataProvider<Y>}` |
| `Sort` | type | `'asc' \| 'desc'` |

#### `ChartProvider<X,Y>` (configuration entrée)

```typescript
{
  title?, subtitle?, xtitle?, ytitle?,
  width?, height?,
  stacked?,         // empiler les séries
  pivot?,           // transposer séries/catégories
  continue?,        // sortie [x,y] pairs au lieu d'indices
  xorder?: Sort,    // tri des catégories
  series: SerieProvider<X,Y>[],
  options?,         // options natives renderer (merge profond)
  showToolbar?,

  // Map uniquement :
  mapEndpoint?, mapParam?, mapDefaultValue?, mapColor?, mapJoinBy?
}
```

#### `SerieProvider<X,Y>`

```typescript
{
  data: any[],
  name?: DataProvider<string>,
  stack?: string,
  color?: string,
  type?: ChartType,
  visible?: boolean,
  unit?: string
}
```

#### `CommonChart<X,Y>` (sortie de `buildChart`)

```typescript
{
  series: CommonSerie<Y>[],
  categories: X[],
  title?, subtitle?, xtitle?, ytitle?,
  width?, height?,
  stacked?, pivot?, continue?,
  // + flags internes
}
```

#### `CommonSerie<Y>`

```typescript
{
  data: Y[],
  name?, stack?, color?, visible?
}
```

### Fonctions de DataProvider

| Fonction | Rôle |
|----------|------|
| `field(name)` | Extrait `obj[name]` |
| `values(...vals)` | Valeur statique par index |
| `mapField(name, map)` | Extrait puis passe dans un dictionnaire |
| `joinFields(sep, ...names)` | Concatène plusieurs champs |
| `combineFields(combiner, names)` | Combinaison custom |
| `joinProviders(sep, ...providers)` | Concatène les résultats de providers |
| `combineProviders(combiner, ...providers)` | Combine les résultats |
| `rangeFields(minName, maxName)` | Retourne `[min, max]` pour les ranges |

### Fonctions de construction

| Fonction | Rôle |
|----------|------|
| `buildChart(objects, provider, defaultValue?)` | Build principal — gère pivot, continue, xorder |
| `buildSingleSerieChart(objects, provider, defaultValue?)` | Pour pie/donut — fusionne en 1 série si pivot |
| `distinct(objects, providers)` | Valeurs uniques pour catégories |
| `groupBy(arr, fn)` | Groupement par fonction |
| `naturalComparator(sens)` | Comparateur naturel asc/desc |

### Patterns clés

**DataProvider pattern** : toutes les fonctions prennent `(object, index)` → valeur. Composables via `combineProviders()`.

**buildChart pipeline** :
1. Extrait les catégories depuis `distinct(objects, providers)`
2. Pour chaque objet → mappe vers les séries
3. Si `pivot=true` → transpose séries/catégories
4. Si `continue=true` → sortie `[x,y]` au lieu d'indices
5. Si `xorder` → trie les catégories

**Fichiers** :
- `src/lib/jquery-core.model.ts` — tout le contrat + fonctions
- `src/lib/utils.ts` — `isObject()`, `mergeDeep()`
- `src/lib/stream.ts` — NON exporté dans `public-api.ts`

---

## PROJECT 2 : jquery-highcharts

**Rôle** : Renderer Angular + Highcharts. Le plus complet et le plus complexe.

### Composants exportés

#### `ChartComponent<X,Y>` (`<chart>`)

| Input | Type | Rôle |
|-------|------|------|
| `type` | `ChartType` | Type courant |
| `config` | `ChartProvider<X,Y>` | Configuration |
| `data` | `any[]` | Données brutes |
| `possibleTypes` | `ChartType[]` | Types disponibles pour le cycle |
| `debug` | `boolean` | Console logging |
| `isLoading` | `boolean` | État loading |
| `enablePivot` | `boolean` | Activer le pivot UI |

| Output | Type | Rôle |
|--------|------|------|
| `customEvent` | `EventEmitter<'previous'\|'next'\|'pivot'>` | Actions toolbar |

**Logique** : contient la map `_charts` (type → {possibleTypes[], canPivot?}). `change(event)` cycle les types ou bascule le pivot.

#### `ChartDirective<X,Y>` (`[chart-directive]`)

Orchestrateur principal. Cycle de vie :
1. `ngOnChanges` → `updateChart()` → `destroyChart()` + `createChart()`
2. Pour les maps : `loadGeoJSON()` async
3. Build des options : `buildChartOptions()` → registry → `enforceCriticalOptions()`
4. Rendu : `Highcharts.chart()` ou `Highcharts.mapChart()`

### Architecture des fichiers

```
lib/
├── component/
│   └── chart.component.ts          ← Wrapper avec cycle de types
└── directive/
    ├── chart.directive.ts           ← Orchestrateur principal
    └── utils/
        ├── types.ts                 ← PLOTOPTIONS_MAPPING + types internes
        ├── toolbar.ts               ← Toolbar custom + events
        ├── loading.ts               ← États loading/error/no-data
        ├── data-aggregation.ts      ← Multi-series → single-series
        ├── chart-data-validator.ts  ← Validation + détection anomalies
        ├── axis-utils.ts            ← Calcul offsets/rounding Y-axis
        ├── dimensions.ts            ← Sanitisation taille du chart
        ├── donut-utils.ts           ← Étiquette centrale donut
        ├── radial-bar-utils.ts      ← Tracks + hover radialBar
        ├── highcharts-modules.ts    ← ⚠ SIDE EFFECTS : init modules Highcharts
        └── config/
            ├── chart-config-registry.ts  ← Pattern Registry (dispatcher)
            ├── polar-config.ts           ← polar, radar, radarArea, radialBar
            ├── range-config.ts           ← columnrange, arearange, areasplinerange
            ├── scatter-config.ts         ← scatter marker enforcement
            ├── bubble-config.ts          ← bubble z + transformations
            ├── heatmap-config.ts         ← heatmap matrix ↔ séries
            ├── treemap-config.ts         ← treemap plat ↔ hiérarchique
            ├── simple-chart-config.ts    ← pie, donut, funnel, pyramid
            ├── simple-chart-transforms.ts← Conversions format simple ↔ standard
            ├── map-config.ts             ← Map : URL, GeoJSON, tooltips
            ├── memory-symbols.ts         ← Symboles backup + historique transforms
            └── data-validation.ts        ← Helpers validation valeurs
```

### Pattern Registry (chart-config-registry.ts)

```typescript
interface ChartTypeConfigurator {
  isChartType: (type: ChartType) => boolean
  configure?: (options, type, config?) => void
  enforceCritical?: (options, type) => void
  transformData?: (series, targetIsFormat, categories?) => any[]
}

// Usage :
applyChartConfigurations(options, type, config)  // configure()
enforceCriticalOptions(options, type)             // enforceCritical()
transformChartData(series, fromType, toType)      // transformData()
```

**Pourquoi** : élimine les switch-case en `chart.directive.ts`. Chaque type est auto-contenu. Nouveau type = nouvel objet dans le tableau.

### Pipeline de transformation des données

```
any[] + ChartProvider
  ↓ buildChart() [jquery-core]
CommonChart {series, categories}
  ↓ needsDataConversion() — détecte range, bubble, heatmap, treemap, map
  ↓ transformChartData(fromType, toType)
     1. fromType.transformData(series, false) — extrait le format précédent
     2. toType.transformData(series, true)    — convertit au format cible
  ↓ Gestion spéciale directive :
     - Map   → buildMapSeries() + replaceCodesWithNames()
     - Simple → aggregateMultiSeriesData() si multi-séries
     - Donut → applyDonutCenterLogic()
  ↓ Highcharts.Options → render
```

**Formats spéciaux requis par type** :
| Type | Format attendu |
|------|----------------|
| columnrange, arearange | `[low, high]` ou `{low, high}` |
| bubble | `[x, y, z]` ou `{x, y, z}` |
| heatmap | `[x, y, value]` ou `{x, y, value}` |
| treemap | `{id, parent?, value}` hiérarchique |
| map | `{code, value}` ou `[code, value]` |

**Memory Symbols** : `ORIGINAL_DATA_SYMBOL` sauvegarde les données pré-transformation → permet de revenir en arrière lors du changement de type.

### Machine d'états loading (loading.ts)

```
(isLoading=true)             → showLoading()     + hideChartContent()
(isLoading=false, pas data)  → showNoDataMessage() + hideChartContent()
(isLoading=false, data ok)   → hideLoading()     + showChartContent()
(validationError)            → showValidationError() + showChartContent()
```

### Toolbar (toolbar.ts)

```
config.showToolbar = true → setupToolbar()
  ↓ Crée <div class="highcharts-custom-toolbar">
    - <button> Previous → customEvent.emit('previous')
    - <button> Next     → customEvent.emit('next')
    - <button> Pivot    → customEvent.emit('pivot') [si canPivot=true]
  ↓ ChartComponent.change('previous') → cycle _type dans possibleTypes
```

### Workflow Map

```
config.mapEndpoint + mapParam + mapDefaultValue
  ↓ buildMapUrl(endpoint, param, defaultValue)
  ↓ loadGeoJSON(url) → fetch → json
  ↓ extractCodeToNameMapping(geoJSON) → Map<code, name>
  ↓ buildMapSeries(data, config, joinBy)
  ↓ Injection chart.map = loadedMapData (Highmaps)
  ↓ createMapTooltipFormatter() pour tooltip custom
```

---

## PROJECT 3 : jquery-apexcharts

**Rôle** : Renderer Angular + ApexCharts. Plus simple que Highcharts.

### Architecture

`ChartComponent` route vers des **directives spécialisées** par type via `*ngIf` :

| Directive | Types couverts | Particularités |
|-----------|----------------|----------------|
| `BarChartDirective` | bar, column, funnel, pyramid | Trie funnel asc, pyramid desc |
| `LineChartDirective` | line, area | `continue=true` pour données continues |
| `PieChartDirective` | pie, donut, polar, radar, radial | Radar : multi-séries as-is, single → flatten |
| `RangeChartDirective` | rangeArea, rangeBar, rangeColumn | Gère l'orientation |
| `TreemapChartDirective` | treemap, heatmap | Transformation minimale |

### Cycle de vie des directives

```
init() → ApexCharts(element, options)
ngOnChanges() → hydrate() → updateData()
updateData() → buildChart() → transformSeriesVisibility() → updateOptions()
ngOnDestroy() → destroyChart()
```

### Différences vs Highcharts

| Aspect | Highcharts | ApexCharts |
|--------|-----------|------------|
| Architecture | Directive unique + Registry | Directives spécialisées par type |
| Complexité options | Élevée | Modérée |
| Series visibility | `visible` | `hidden` |
| SVG IDs | N/A | `fixToolbarSvgIds()` workaround nécessaire |
| Scroll | N/A | `setupScrollPrevention()` pour éviter conflits |
| Modules init | `highcharts-modules.ts` side effects | Pas de modules nécessaires |

### `utils.ts` (ApexCharts)

| Fonction | Rôle |
|----------|------|
| `customIcons()` | Icônes toolbar custom |
| `initCommonChartOptions()` | Options de base communes |
| `updateCommonOptions()` | Mise à jour options communes |
| `fixToolbarSvgIds()` | Fix doublons IDs SVG toolbar |
| `setupScrollPrevention()` | Désactive wheel zoom conflictuel |

---

## PROJECT 4 : jquery-table

**Rôle** : Table Material Angular avec recherche, pagination, tri, groupement, slices (filtres multi-dimensionnels), lazy loading, export CSV, i18n injectable, templates custom.

### Interfaces principales (`jquery-table.model.ts`)

#### `TableColumnProvider<T>`

```typescript
{
  key: string,
  header?: string,
  icon?: string,
  value?: DataProvider<any>,       // extrait la valeur à afficher
  sortValue?: DataProvider<any>,   // valeur pour le tri
  searchValue?: DataProvider<string>, // valeur pour la recherche texte
  sortable?: boolean,
  removable?: boolean,
  optional?: boolean,
  width?: string,                  // px uniquement pour tableMinWidth
  groupable?: boolean,
  sliceable?: boolean,
  lazy?: {
    fetchFn: () => Observable<any[]>  // fetch asynchrone par colonne
  }
}
```

#### `TableProvider<T>` (master config)

> `data` et `isLoading` sont des `@Input` sur le composant, **pas** des champs de `TableProvider`.

```typescript
{
  columns: TableColumnProvider<T>[],
  title?: string,
  slices?: SliceConfig<T>[],
  enableSliceToggle?: boolean,
  search?: TableSearchConfig,         // { enabled, initialQuery, searchColumns }
  pagination?: TablePaginationConfig, // { enabled, pageSize, pageSizeOptions, pageSizeOptionsGroupBy }
  view?: TableViewConfig,             // { enabled, enableColumnRemoval, enableColumnDragDrop }
  labels?: TableLabelsConfig,         // { empty, loading } — prend le dessus sur JQT_I18N
  export?: TableExportConfig,         // { enabled, filename, transform }
  defaultSort?: { active: string; direction: 'asc' | 'desc' },
  rowClass?: (row: T, index: number) => string | string[] | Record<string, boolean>
}
```

#### `TableExportConfig<T>` (nouveau)

```typescript
{
  enabled?: boolean,
  filename?: string,                           // sans extension, défaut 'export'
  transform?: (row: T) => Record<string, string>  // si absent : valeurs affichées
}
```

L’export porte uniquement sur les données **filtrées** (slice + recherche) et les **colonnes visibles**.
BOM UTF-8 pour compatibilité Excel.

#### Helper `col()` (nouveau)

```typescript
col<T>('key', 'Label', { optional: true })  // raccourci TableColumnProvider
```

Exporté depuis `public-api.ts`.

### `TableComponent<T>` (`<jquery-table>`)

**Inputs** : `config`, `data`, `isLoading`, `view`, `dataSource` (émut), `displayedColumns` (émut), `columnsConfig` (émut), `columnLabels` (émut)  
**Outputs** : `rowSelected`, `columnAdded`, `columnRemoved`, `addRequested`, `sortChange`, `pageChange`, `searchChange`, `groupByChange`, `columnsChange`

### i18n injectable (`jqt-i18n.token.ts`) (nouveau)

```typescript
// InjectionToken<Partial<JqtI18n>>
export const JQT_I18N = new InjectionToken<Partial<JqtI18n>>('JQT_I18N');

// Défaults : JQT_I18N_DEFAULTS (français)
// Ordre priorité : config.labels > JQT_I18N > JQT_I18N_DEFAULTS
```

I18n couvre 24 labels : placeholder recherche, état vide, chargement, sous-menus View, Group by, Slice by, lazy retry, cellEmpty, export, filtre panel...

SlicePanelComponent utilise aussi JQT_I18N.

#### Pipeline `refreshViewModel()`

```
ngOnChanges() ou interaction (search, filter, groupBy, sort)
  ↓ refreshViewModel()
  1. Résolution données : data / dataSource.data / []
  2. Filtre search : filter() par searchQuery
  3. Filtre slices : filter() par activeSliceFilter
  4. Cache → _allFilteredRows
  5. Si activeGroupByKey :
     - Groupe par valeur colonne
     - Construit [headerRow, dataRow1, ..., nextGroup...]
     - Pagination par groupe
  6. Tri via MatSort
  7. Pagination slice [page*pageSize, (page+1)*pageSize]
  8. → tableDataSource.data
  9. _cdr.markForCheck()
```

#### Lazy Loading des colonnes

```
column.lazy.fetchFn() → Observable
  ↓ LazyColumnManager.fetch() → status: 'loading'
  ↓ values[] → _lazyColumnData Map<row, value>
  ↓ status: 'loaded'
  ↓ Rendu cellule : lookup via map (LAZY_LOADING_VALUE / LAZY_ERROR_VALUE)
  ↓ Si erreur → retry possible
```

**Constantes sentinel** : toutes dans `table.constants.ts` — ne jamais dupliquer inline dans `.ts` ou `.html`.

### `SlicePanelComponent<T>` (`<slice-panel>`)

Filtrage multi-dimensionnel. Deux modes de slices :

| Mode | Source | Comportement |
|------|--------|--------------|
| Static | `config.slices[]` | Groupes de filtres prédéfinis |
| Dynamic | Ajouté par l'utilisateur via UI | Généré depuis les valeurs distinctes d'une colonne |

**`SliceConfig<T>`** :
```typescript
{
  title: string,
  columnKey?: string,           // Mode auto : extrait les valeurs distinctes
  bucket?: (row) => string,     // Bucketing custom
  multiSelect?: boolean,        // false = radio (1 seule sélection)
  categories?: [                // Mode explicite
    { key, label, filter: (row) => boolean }
  ]
}
```

**Composition des filtres** :
```typescript
// Émis dans filterChange :
(row) => slices.every(slice => {
  const activeKeys = activeKeysBySlice.get(index) ?? allKeys
  return activeKeys.some(key =>
    slice.categories.find(c => c.key === key).filter(row)
  )
})
```

### `JqtCellDefDirective` (`[jqtCellDef]`)

```html
<jquery-table [config]="config">
  <ng-template jqtCellDef="maColonne" let-row let-index="index">
    {{ row.monChamp }}
  </ng-template>
</jquery-table>
```

### Utilitaires (`table.utils.ts`)

| Fonction | Rôle |
|----------|------|
| `getFrenchPaginatorIntl()` | Traductions FR MatPaginator |
| `normalizeCellValue(value)` | Date → locale navigateur, Array → join, null → '' |
| `humanizeKey(key)` | `camelCase` → `Camel case`, `snake_case` → `Snake case` |

---

## Objectif : intégration jquery-echarts

### Contraintes à respecter

1. **Ne pas casser le contrat** `ChartProvider` / `SerieProvider` de `@oneteme/jquery-core`
2. **Utiliser `buildChart()` / `buildSingleSerieChart()`** depuis le core
3. **S'inspirer de `jquery-highcharts`** comme référence d'implémentation complète
4. **S'inspirer de `jquery-apexcharts`** si une approche par directives spécialisées est plus adaptée
5. **Exporter depuis `public-api.ts`** : au minimum `ChartComponent` + `ChartModule`
6. **Modules ECharts** : initialiser les modules via un fichier dédié (pattern `highcharts-modules.ts`)
7. **Registry pattern recommandé** si plusieurs transformations de type
8. **`mergeDeep()`** du core pour fusionner les options utilisateur

### Structure cible suggérée

```
projects/oneteme/jquery-echarts/
├── ng-package.json
├── package.json
├── tsconfig.lib.json
├── tsconfig.lib.prod.json
├── tsconfig.spec.json
└── src/
    ├── public-api.ts
    └── lib/
        ├── component/
        │   └── chart.component.ts        ← Wrapper + cycle de types
        └── directive/
            ├── chart.directive.ts        ← Orchestrateur principal
            └── utils/
                ├── types.ts              ← Types internes
                ├── loading.ts            ← États loading/error/no-data
                ├── toolbar.ts            ← Toolbar + events
                ├── echarts-modules.ts    ← Init modules ECharts
                └── config/
                    └── chart-config-registry.ts
```

### ChartType mapping ECharts attendu

| ChartType (core) | ECharts type |
|-----------------|--------------|
| bar | bar (horizontal) |
| column | bar (vertical) |
| line | line |
| spline | line (smooth) |
| area | line + areaStyle |
| areaspline | line (smooth) + areaStyle |
| pie | pie |
| donut | pie + radius inner |
| scatter | scatter |
| bubble | scatter (symbolSize = z) |
| heatmap | heatmap + visualMap |
| treemap | treemap |
| funnel | funnel |
| radar | radar |
| map | map |
| rangeBar / rangeColumn | custom / bar (avec stack min/max) |

---

## Commandes utiles

```bash
# Build jquery-core
ng build @oneteme/jquery-core

# Build jquery-highcharts
ng build @oneteme/jquery-highcharts

# Build jquery-apexcharts
ng build @oneteme/jquery-apexcharts

# Build jquery-table
ng build @oneteme/jquery-table

# App de démo
ng serve

# Tests
ng test
```
