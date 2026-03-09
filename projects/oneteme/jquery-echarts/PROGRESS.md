# Avancement — @oneteme/jquery-echarts

> Mis à jour en continu à chaque modification.

---

## Statut global : 🟢 Phase 6 terminée — Page de démo `/echarts` ✅ — Renderer SVG par défaut

---

## Étapes

### ✅ Phase 1 — Setup projet
- [x] `ng-package.json` — configuration ng-packagr
- [x] `package.json` — peerDependencies (echarts, @angular/core, @oneteme/jquery-core)
- [x] `tsconfig.lib.json` / `tsconfig.lib.prod.json` / `tsconfig.spec.json`
- [x] Enregistrement dans `angular.json` (projet `@oneteme/jquery-echarts`)
- [x] Path mapping dans `tsconfig.json` (`@oneteme/jquery-echarts` → `dist/oneteme/jquery-echarts`)
- [x] Script `b4` / `cb4` / `watch-b4` dans `package.json` racine

### ✅ Phase 2 — Infrastructure lib
- [x] `src/public-api.ts` — exports publics
- [x] `utils/echarts-init.ts` — import echarts global
- [x] `utils/types.ts` — `EChartsOption`, `ChartCustomEvent`, `ECHARTS_ICONS`, `DEFAULT_LOADING_OPTION`, `ChartFamily`
- [x] `utils/chart-utils.ts` — `buildBaseOption`, `applyCommonConfig`, `buildNoDataGraphic`, `getXAxisType`, `resolveXAxisType`

### ✅ Phase 3 — Registry + Configurateurs par type
- [x] `config/chart-config-registry.ts` — `EChartTypeConfigurator` + `resolveConfigurator()`
- [x] `config/bar-config.ts` — bar, column, columnpyramid
- [x] `config/line-config.ts` — line, spline, area, areaspline
- [x] `config/pie-config.ts` — pie, donut (buildSingleSerieChart)
- [x] `config/scatter-config.ts` — scatter, bubble (symbolSize dynamique)
- [x] `config/heatmap-config.ts` — heatmap + visualMap
- [x] `config/treemap-config.ts` — treemap (plat + multi-séries)
- [x] `config/funnel-config.ts` — funnel, pyramid (tri directionnel)
- [x] `config/radar-config.ts` — radar, radarArea
- [x] `config/range-config.ts` — rangeBar, rangeColumn, arearange, areasplinerange, columnrange

### ✅ Phase 4 — Directive + Composant
- [x] `directive/chart.directive.ts` — directive unique orchestratrice
  - Init ECharts après `ngAfterViewInit` via `asapScheduler`
  - `setOption` synchrone pour toutes les mises à jour
  - `showLoading` / `hideLoading` natifs ECharts
  - `graphic` natif ECharts pour "Aucune donnée"
  - `ResizeObserver` pour l'auto-resize
  - Input `theme` pour les thèmes ECharts natifs
- [x] `component/chart.component.ts` — wrapper `<echarts-chart>`
  - Map `_families` : cycle de types + `canPivot` par famille
  - Gestion `change()` : previous / next / pivot
  - Input `theme` propagé à la directive
- [x] `component/chart.component.html` — délègue à la directive

---

## 🔜 Phase 5 — Validation compilation ✅
- [x] `ng build @oneteme/jquery-core` — ✅ pass
- [x] `ng build @oneteme/jquery-echarts` — ✅ pass (6199ms)
- [x] Correction erreur TS2322 dans `line-config.ts` (cast `as any` sur `xAxis.type` et `series.data`)

## 🔜 Phase 6 — Page de démo ✅
- [x] `src/app/data/chart/echarts-examples.data.ts` — données pour les 16 types
- [x] `src/app/pages/echarts/echarts.component.ts` — composant standalone
- [x] `src/app/pages/echarts/echarts.component.html` — grille + bouton code-view par carte
- [x] `src/app/pages/echarts/echarts.component.scss` — styles identiques au pattern /charts
- [x] Route `/echarts` enregistrée dans `app-routing.module.ts`
- [x] Path `@oneteme/jquery-echarts` ajouté dans `tsconfig.json`
- [x] Projet enregistré dans `angular.json`
- [x] Build app ✅ (warnings budget + CommonJS Highcharts préexistants — non bloquants)

## 🔜 Phase 7 — Tests supplémentaires
- [ ] Vérifier comportement `pivot` sur bar / column
- [ ] Vérifier `continue: true` sur line (dates)
- [ ] Vérifier cycle de types (previous/next toolbar)
- [ ] Vérifier thème dark

## 🔜 Phase 8 — Types manquants (scope futur)
- [ ] `polar` (ECharts polar coordinate system)
- [ ] `radialBar` / `radial` (jauge ECharts)
- [ ] `map` (ECharts Map avec GeoJSON)
- [ ] `boxplot`

---

## Décisions d'architecture notables

| Décision | Raison |
|----------|--------|
| **1 directive unique** au lieu de N directives spécialisées | ECharts API unifiée `setOption`, pas de ré-init nécessaire au changement de type |
| **`showLoading` natif ECharts** | Pas de DOM manipulation manuelle |
| **`graphic` pour no-data** | Natif ECharts, pas de surcouche HTML |
| **`ResizeObserver`** pour resize | Plus robuste que `window:resize`, scope limité au container |
| **Toolbox `feature.myTool`** | Boutons toolbar natifs ECharts (pas de DOM externe) |
| **`notMerge: true`** lors du changement de type | Évite la pollution des options de l'ancien type |
| **`mergeDeep` sur `config.options`** | Permet à l'utilisateur d'écraser n'importe quelle option ECharts native |

---

## Historique des modifications

| Date | Modification |
|------|-------------|
| 23/03/2026 | Création initiale du projet — structure complète, tous les configurateurs, directive + composant |
| 23/03/2026 | Correction TS2322 `line-config.ts` — cast `as any` sur xAxis.type et series.data (types ECharts trop stricts) |
| 23/03/2026 | Phase 6 — page démo `/echarts` avec 16 graphiques + bouton code-view |
| 23/03/2026 | Suppression type-nav dans la page démo |
| 23/03/2026 | Input `renderer: 'svg' \| 'canvas'` sur directive + composant, SVG par défaut |
| 23/03/2026 | `ChartComponent` simplifié — suppression cycle de types, pivot, `_families` ; re-émet `customEvent` directement |
