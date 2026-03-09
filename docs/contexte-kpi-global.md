# Contexte — branche kpi-global (inspect-app)

> Analyse de la branche `kpi-global` du dépôt `oneteme/inspect-app`.
> Auteur principal : YoussefDahi (+ antonin77).
> Objectif : comprendre le travail fait pour remplacer son code spécifique par le View généraliste.
> Référence branche : https://github.com/oneteme/inspect-app/tree/kpi-global

---

## 1. Ce que la branche kpi-global apporte

La branche ajoute une **nouvelle section "statistic"** dans l'app, avec des graphiques KPI configurables dynamiquement via un menu inline (bouton `tune`). Ce menu joue exactement le même rôle que le futur **View externalisé pour les charts**.

Fichiers clés :
- `src/app/views/statistic/` — nouvelle section KPI
- `src/app/views/statistic/_component/dynamic-chart/` — composant central chart + menu
- `src/app/views/statistic/_component/repartition-type-card/` — version antérieure similaire
- `src/app/views/statistic/request/statistic-request.view.*` — vue hôte consommant dynamic-chart via résolution dynamique de composants

---

## 2. Architecture du composant dynamic-chart

### Sélecteur
```
<dynamic-chart [menuConfig]="..." [data]="..." [isLoading]="..." (chartEmitter)="...">
```

### Interface de configuration : RepartitionTypeCardConfig
```typescript
interface RepartitionTypeCardConfig {
  title: string;
  indicators: { label: string, value: string }[];   // Indicateur à mesurer (count, sum...)
  groups:     { label: string, value: string, group?: (row) => string, properties?: string[] }[];  // Axe X
  slices:     { label: string, value: string }[];   // Filtrage par clé (affiche une dynamic-table à côté)
  series:     { label: string, value: string }[];   // Décomposition des séries (axe Y multiple)
  groupColumns?:  { [key: string]: { column, order? } };
  sliceColumns?:  { [key: string]: { selector, query, name } };
  seriesColumns?: { [key: string]: { selector, query: (indicateur) => string, name, color }[] };
  chartProvider?: ChartProvider<string, number>;
}
```

### Menu (HTML)
- Bouton `<mat-icon>tune</mat-icon>` déclenche un `matMenu` à 4 sous-menus :
  - **Indicateur** — radio-like, sélection unique
  - **Group** — axe X du graphique, sélection unique
  - **Slice** — affiche une `dynamic-table` latérale au clic pour filtrer
  - **Series** — décomposition des séries (multi-valeurs dynamiques)
- Rendu : `(click)` standard sur `<a mat-menu-item>` (dans les `mat-menu-item` natifs Angular Material, le click fonctionne car ce ne sont pas des boutons custom dans un div avec stopPropagation)

### Logique TS
- `config = { selectedIndicator, selectedGroup, selectedSlice, selectedSerie }` — état courant
- À chaque sélection → `chartEmitter.emit({ type, config, sliceFilter? })` vers le parent
- `generateDynamicSeries(data, fieldName)` — reconstruit les `ChartProvider.series` à la volée en extrayant les valeurs uniques du champ sélectionné + assignation de couleurs depuis `colorPalette[]`
- `processDataByValue(data, fieldName)` — regroupe les données par `groupKey` et pivote les valeurs uniques en colonnes (pattern pivot local côté client)

### Rendu
```html
<chart type="column" [config]="chartProvider" [data]="_data" [isLoading]="isLoading">
```
Utilise directement le composant `chart` de `@oneteme/jquery-apexcharts` (ou highcharts selon le renderer configuré).

---

## 3. Différences avec l'approche View externalisée

| Dimension | dynamic-chart (kpi-global) | View externalisé (projet en cours) |
|---|---|---|
| Granularité | 1 config par instance de chart | Contrat générique dans jquery-core |
| Portée | Spécifique à la vue statistic | Tout chart (highcharts, apexcharts) |
| State management | Local dans le composant | ViewFacade / ViewState dans jquery-core |
| Config | TypeScript inline dans la vue hôte | `[view]="{ ... }"` sur le composant chart |
| Séries dynamiques | Génération client (pivot local) | `applyViewStateToSeries()` helper core |
| Slice | dynamic-table latérale spécifique | SlicePanelComponent (déjà externalisé) |
| Réutilisabilité | Zéro (composant ad-hoc) | Totale (jquery-core contrat partagé) |
| Events | `chartEmitter: EventEmitter<{ type, config, sliceFilter }>` | `ViewEvent` Observable (RxJS) |

---

## 4. Ce que View externalisé permettra de remplacer

### Dans dynamic-chart :
- Le bouton `tune` + les 4 `mat-menu` → remplacé par le bouton **View** de jquery-highcharts/apexcharts avec ses sous-menus **Champs / Group / Slice** (en ajoutant "Indicateur" )
- `generateDynamicSeries()` → remplacé par `applyViewStateToSeries(provider, viewState)` (déjà dans jquery-core)
- `config.selectedGroup` (axe X) → `ViewState.groupBy`
- `config.selectedSerie` (series) → `ViewState.selectedFields`
- `config.selectedSlice` + dynamic-table → `ViewState.sliceBy` + `SlicePanelComponent`
- `chartEmitter.emit({ type, config })` → `ViewEvent` Observable (fieldsChanged, groupByChanged...)

### Ce qui restera spécifique à la vue hôte :
- La construction de la `RepartitionTypeCardConfig` depuis les données métier (indicateurs, groups disponibles)
- L'appel API déclenché par les changements View (abonnement aux ViewEvents pour refetch)
- `processDataByValue()` si le pivot reste côté client

---

## 5. Intégration cible (vision)

### Avant (kpi-global pattern ad-hoc) :
```html
<dynamic-chart
  [menuConfig]="myRepartitionConfig"
  [data]="data"
  (chartEmitter)="onChartEvent($event)">
</dynamic-chart>
```

### Après (avec View externalisé) :
```html
<chart
  [config]="myChartProvider"
  [view]="{ enabled: true, fields: viewFields, groupBy: { fields: groupFields } }"
  [data]="data"
  (viewChange)="onViewChange($event)">
</chart>
```
Où `onViewChange` reçoit un `ViewEvent` standard et déclenche le rechargement des données si nécessaire.

---

## 6. Points d'attention pour l'intégration

### A — "Indicateur" n'existe pas encore dans ViewState
`ViewState` actuel : `selectedFields`, `groupBy`, `sliceBy`.
L'indicateur (count, sum, avg...) est une notion supplémentaire absente du contrat core.
→ **À évaluer** : ajouter `indicator` dans `ViewState` ou laisser la vue hôte gérer cela en dehors du View.

### B — Series dynamiques (pivot client)
`processDataByValue()` reconstruit les données en pivotant les valeurs uniques en colonnes.
`applyViewStateToSeries()` dans jquery-core applique des `visible` flags sur des séries **statiques définies à l'avance**.
→ Pour les séries **100% dynamiques** (valeurs inconnues à la config), le helper core devra être enrichi.

### C — dynamic-table latérale (slice)
La dynamic-table latérale n'est pas le `SlicePanelComponent` de jquery-table.
C'est une table simple qui affiche les données brutes d'un slice et permet de cliquer une ligne pour filtrer.
→ Ce comportement n'est pas couvert par le View actuel. C'est un pattern "drill-down" à évaluer séparément.

### D — Event model
`chartEmitter` émet des structures ad-hoc `{ type: 'group'|'indicator'|'slice'|'series'|'sliceClick', config, columns?, sliceFilter? }`.
Le `ViewEvent` actuel émet `{ type: 'fieldsChanged', fieldIds }`.
→ Les types d'events devront être enrichis (groupByChanged, sliceChanged) pour couvrir les usages de dynamic-chart.

---

## 7. Prochaines étapes suggérées pour l'intégration

| Étape | Action | Ticket Phase |
|-------|--------|-------------|
| 1 | Vérifier que `ViewState.groupBy` peut remplacer `config.selectedGroup` dans dynamic-chart | Phase 4 — extension |
| 2 | Évaluer si `indicator` (count/sum/avg) doit entrer dans `ViewState` ou rester côté vue | Phase 4 — décision |
| 3 | Enrichir `ViewEvent` avec `groupByChanged` + `indicatorChanged` | Phase 4 — évolution contrat |
| 4 | Tester remplacement de `dynamic-chart` par `<chart [view]="...">` sur une vue statistic | Phase 5 — validation |
| 5 | Traiter le cas drill-down (dynamic-table latérale) séparément ou via SlicePanelComponent étendu | Post Phase 5 |

---

## 8. Résumé

Le travail de kpi-global est une **implémentation ad-hoc valide** qui prouve que le besoin d'un menu View sur les charts existe et est utilisé. Le composant `dynamic-chart` gère localement tout ce que le View externalisé doit fournir de façon générique : sélection de groupement, de séries, de slice, indicateur, rendu chart.

La **vraie valeur ajoutée du View externalisé** pour ce travail sera :
1. Supprimer la duplication de la logique menu/état entre tous les composants statistic
2. Unifier l'expérience UX menu View sur tables et charts
3. Rendre la configuration déclarative (`[view]="..."`) au lieu de programmatique (TypeScript inline)
