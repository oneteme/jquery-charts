# Contexte — Projet jquery-organizer

Statut : Opérationnel (intégration validée dans inspect-app)
Référence : ../../docs/contexte-organizer-externalization.md

## Vision stratégique

`jquery-organizer` est une librairie Angular autonome extraite du concept "View Button" qui était auparavant codé en dur dans `jquery-table`. Elle centralise toute la logique de configuration d'un graphique ou tableau (indicateurs, groupes, stacks, filtres, panneau de filtre latéral) dans deux composants réutilisables, totalement agnostiques du renderer.

### Objectif à long terme

> Un développeur peut intégrer jquery-organizer avec jquery-echarts sans effort supplémentaire

### Contraintes fondamentales (non négociables)

1. **Zéro dépendance sur les renderers**
   — jquery-organizer n'importe rien de jquery-table, jquery-highcharts, jquery-apexcharts, jquery-echarts.
   — Dépendances UI autorisées : uniquement `@angular/core`, `@angular/material`, `@oneteme/jquery-core`.

2. **Configuration par injection**
   — Aucune auto-découverte des champs ou valeurs disponibles.
   — Le parent passe toujours un `OrganizerConfig` explicite via `@Input()`.

3. **Interface par événements uniquement**
   — Toutes les interactions passent par `@Output() EventEmitter`, jamais par des appels de méthodes impératifs.

4. **Agnosticisme contextuel**
   — Fonctionne sur un tableau, un graphique, un dashboard KPI ou une page custom.
   — Aucune hypothèse sur la structure des données du parent.

---

## Pourquoi ne pas fusionner avec jquery-core ?

`jquery-core` contient deux catégories : des modèles de données purs (`ViewState`, `ViewField`, `ViewEvent`, etc.) et des helpers de transformation (`pivotByStack`, `buildSeries`, etc.). Ces éléments sont **déjà utilisés directement** par les renderers (`jquery-echarts`, `jquery-highcharts`, `jquery-table`) indépendamment de `jquery-organizer`. Si on les déplaçait dans `jquery-organizer`, tous les renderers dépendraient d'une librairie UI avec Angular Material juste pour accéder à des utilitaires de données — ce qui est exactement l'inverse du principe fondateur.

La séparation actuelle est la bonne :

```
jquery-core         = logique pure, zéro UI
jquery-organizer    = UI shell, consomme jquery-core
renderers           = consomment jquery-core directement + jquery-organizer optionnellement
```

---

## Structure du projet

```
projects/oneteme/jquery-organizer/
├── src/
│   ├── lib/
│   │   ├── organizer-button/
│   │   │   ├── organizer-button.component.ts       (composant principal)
│   │   │   ├── organizer-button.component.html     (template mat-menu)
│   │   │   ├── organizer-button.component.scss     (styles + tokens CSS)
│   │   │   └── organizer-button.module.ts          (module NgModule)
│   │   ├── slice-panel/
│   │   │   ├── slice-panel.component.ts            (migré depuis jquery-table)
│   │   │   ├── slice-panel.component.html
│   │   │   ├── slice-panel.component.scss
│   │   │   └── slice-panel.model.ts                (SliceConfig, SliceColumnDef, SliceCategory)
│   │   ├── models/
│   │   │   ├── organizer-config.interface.ts       (OrganizerConfig, OrganizerSliceState, ...)
│   │   │   ├── organizer-menu.model.ts             (types menu)
│   │   │   └── index.ts
│   │   └── index.ts
│   └── public-api.ts                               (point d'entrée public)
├── package.json
├── ng-package.json
├── tsconfig.lib.json
├── README.md                                        (documentation utilisateur)
└── CONTEXT.md                                       (ce fichier)
```

---

## Dépendances

### Peer dependencies
- `@angular/core` (>=16.1.0)
- `@angular/common` (>=16.1.0)
- `@angular/material` (^16.1.0)
- `@angular/cdk` (^16.1.0)
- `rxjs` (~7.5.0)

### Dépendances directes
- `@oneteme/jquery-core` (^0.0.32) — modèles ViewState, ViewField, ViewEvent, helpers de transformation
- `tslib` (^2.3.0)

---

## Relations avec les autres librairies

```
@oneteme/jquery-organizer
        ↑
        │  importe (optionnel)
        │
jquery-table ──→ jquery-organizer  (re-exporte SlicePanelComponent pour rétrocompatibilité)
jquery-echarts ──→ jquery-organizer  (à venir : intégration optionnelle)
jquery-highcharts ──→ jquery-organizer
```

**jquery-table** : re-exporte `SlicePanelComponent`, `SliceConfig`, `SliceColumnDef`, `SliceCategory` depuis `@oneteme/jquery-organizer`. Rétrocompatibilité totale, les consommateurs existants n'ont rien à changer.

---

## Intégration sur `/kpi-test/request/rest` vs `/kpi/request/rest`

### Contexte : deux pages, deux états d'avancement

| Page | Chemin | Rôle | Statut organizer |
|---|---|---|---|
| Page de test | `/kpi-test/request/rest` | Bac à sable, pas en production | ✅ Intégré complètement |
| Page de production | `/kpi/request/rest` | Dashboard utilisé en production | ❌ Pas encore migré (menu ad-hoc hardcodé) |

---

### Avant — Architecture sur `/kpi/request/rest` (état de référence)

La page de production utilisait une gestion des sélections complètement ad-hoc :

**Template** : chaque graphique avait ses propres `<mat-button-toggle-group>` ou `<mat-select>` codés en dur pour choisir l'indicateur et le groupe. Le bouton de configuration n'était pas un composant partagé.

**Composant TypeScript** : chaque chart déclarait ses propres variables `selectedIndicator`, `selectedGroup`, `selectedStack` avec des handlers `onIndicatorChange()`, `onGroupChange()` appelant directement la méthode fetch. Duplication massive entre les 4 charts.

**Pas de panneau de filtre latéral** : aucun `SlicePanelComponent`, la notion de "filtre de tranche" n'existait pas. Les filtres disponibles (par host, par media, par statut) n'étaient pas exposés dans l'UI.

**Appel API** : le fetch reconstruisait ses paramètres directement depuis les variables locales, sans notion de `ChartConfig` centralisée.

---

### Après — Architecture sur `/kpi-test/request/rest` (nouvelle approche)

#### Phase 1 : `ChartConfig` centralisée

Chaque chart a une `ChartConfig` déclarative définie dans `kpi.config.ts` :

```typescript
export function REST_STATUS_CHART_CONFIG(groupedBy: string): ChartConfig {
  return {
    indicators: { items: [
      { key: 'count',      selected: true, menu: { label: 'Nb appels' }, ... },
      { key: 'elapsedP50',                 menu: { label: 'Temps médian (P50)' }, ... },
    ]},
    groups: { items: [
      { key: groupedBy, selected: true, menu: { label: 'Par période' } },
      { key: 'byHour',                  menu: { label: 'Par heure' } },
    ]},
    series: { items: [...] },
    filters: { items: [
      { key: 'status', menu: { label: 'Statut' } },
      { key: 'media',  menu: { label: 'Media' } },
    ]},
  };
}
```

Cette `ChartConfig` est la source de vérité unique. Elle est initialisée dans le setter `queryParams` et mutée par `applyOrganizerEvent()`.

#### Phase 2 : `OrganizerButtonComponent` comme façade UI

Trois fonctions utilitaires locales font le pont entre `ChartConfig` et `OrganizerConfig` :

```typescript
// Génère le menu organizer depuis la config du graphique
function toOrganizerConfig(chartConfig: ChartConfig, onFetchSliceData?): OrganizerConfig { ... }

// Reflète les sélections courantes dans l'état organizer (pour highlight du menu)
function toOrganizerState(chartConfig: ChartConfig): OrganizerState { ... }

// Applique un événement organizer à la ChartConfig (mutation en place)
function applyOrganizerEvent(event: OrganizerEvent, chartConfig: ChartConfig): void { ... }
```

Chaque chart déclare un état organizer isolé :

```typescript
$statusOrganizer: { config: OrganizerConfig; state: OrganizerState };
$statusSlice: OrganizerSliceState | null = null;
$statusFilteredValues: any[] = [];
```

Le template lie l'organizer au chart :

```html
<organizer-button
  [config]="$statusOrganizer.config"
  [state]="$statusOrganizer.state"
  (viewChange)="onStatusViewChange($event)"
  (sliceStateChange)="onStatusSliceChange($event)">
</organizer-button>
```

#### Phase 3 : Cycle de vie complet d'un événement menu

Quand l'utilisateur change d'indicateur (ex: "Nb appels" → "Temps médian") :

1. `OrganizerButtonComponent` émet `(viewChange)` avec `{ type: 'indicatorSelected', state: { selectedIndicator: 'elapsedP50', ... } }`
2. `onStatusViewChange(event)` appelle `applyOrganizerEvent(event, chartConfig)` — mute la config
3. `$statusOrganizer` est reconstruit (immutable pour Angular change detection)
4. `event.type !== 'sliceSelected'` → `_fetchStatus()` est appelé
5. `_fetchStatus()` lit les sélections depuis `chartConfig` et appelle l'API

L'événement `sliceSelected` est exclu du refetch car c'est `(sliceStateChange)` qui pilote le panneau de filtre, pas le refetch principal.

#### Phase 4 : Cycle de vie du `SlicePanelComponent` (automatique)

Quand l'utilisateur sélectionne le filtre "Statut" dans le menu :

1. `OrganizerButtonComponent` détecte `onFetchSliceData` dans la config
2. Il appelle `onFetchSliceData('status')` → retourne un `Observable<any[]>` depuis `RestRequestService`
3. Il souscrit en interne avec `takeUntil(destroy$)` — pas de gestion de souscription dans le parent
4. Il émet `(sliceStateChange)` avec `{ sliceConfigs: [{ title: 'Statut', columnKey: 'status' }], tasks: [...] }`
5. `onStatusSliceChange(sliceState)` stocke `$statusSlice = sliceState` → le panneau apparaît
6. `_fetchStatus()` est rappelé (les `$statusFilteredValues` sont vides à ce stade → pas de filtre actif encore)

Quand l'utilisateur clique sur une catégorie dans le panneau (ex: "200") :

1. `SlicePanelComponent` émet `(filterChange)` avec la fonction de filtre `(row) => row.status === '200'`
2. `onStatusFilterChange(filterFn)` extrait les valeurs filtrées :
   ```typescript
   this.$statusFilteredValues = this.$statusSlice.tasks
     .filter(filterFn)
     .map(t => t['status']); // → ['200']
   ```
3. `_fetchStatus()` transmet `filters: ['200']` à l'API
4. Le graphique se met à jour avec uniquement les appels avec statut 200

Désélection du filtre (re-clic sur "Statut" → toggle off) :

1. `OrganizerButtonComponent` émet `(sliceStateChange)` avec `null`
2. `onStatusSliceChange(null)` : `$statusSlice = null` (panneau masqué) + `$statusFilteredValues = []`
3. `_fetchStatus()` rappelé sans filtre → retour à la vue complète

#### Phase 5 : Layout CSS avec panneau collapsible

Le `SlicePanelComponent` comporte `@HostBinding('class.collapsed')` déclenché par son bouton interne. Le parent contrôle la largeur via CSS :

```scss
.chart-body-with-organizer {
  display: flex; flex-direction: row; align-items: stretch;

  chart { flex: 1 1 0; min-width: 0; }

  slice-panel {
    flex: 0 0 260px;
    transition: flex-basis 200ms ease;
    &.collapsed { flex: 0 0 42px; }  // class ajoutée par @HostBinding
  }
}
```

Quand l'utilisateur replie le panneau, `.collapsed` est ajouté automatiquement et la largeur se réduit à 42px (icône seule) avec une transition CSS fluide.

---

### Prochaine étape : migration de `/kpi/request/rest`

La page de production doit être migrée selon le même pattern :

1. Créer les `ChartConfig` dans `kpi.config.ts` (probablement partiellement présentes)
2. Réutiliser les fonctions `toOrganizerConfig`, `toOrganizerState`, `applyOrganizerEvent` — les centraliser dans un utilitaire partagé si les deux pages coexistent
3. Remplacer les `<mat-button-toggle-group>` codés en dur par `<organizer-button>`
4. Ajouter le `SlicePanelComponent` + les handlers `onXxxSliceChange` et `onXxxFilterChange`
5. Ajouter la classe CSS `.chart-body-with-organizer` dans le SCSS de la page

---

## Conventions de code

### État par graphique — jamais de state global partagé entre charts

```typescript
$xxxOrganizer: { config: OrganizerConfig; state: OrganizerState };
$xxxSlice: OrganizerSliceState | null = null;
$xxxFilteredValues: any[] = [];
```

### Pas d'injection de service dans le composant

```typescript
// ❌ À ne pas faire
constructor(private viewFacade: ViewFacade) {}

// ✅ À faire
@Input() config: OrganizerConfig;
```

### `onFetchSliceData` — le seul callback autorisé dans OrganizerConfig

```typescript
onFetchSliceData: (key) => this._service.getFilterValues(key, this.params) as Observable<any[]>
```

Ce pattern est autorisé car c'est le parent qui fournit le callback — le composant ne dépend pas du service.


> Un développeur peut intégrer jquery-organizer avec jquery-echarts sans effort supplémentaire

A developer can integrate jquery-organizer with jquery-echarts (or any other renderer) with **zero extra effort**.

### Core Constraints (Non-Negotiable)

1. **Zero Dependency on Renderers**
   - jquery-organizer imports NOTHING from jquery-table, jquery-highcharts, jquery-apexcharts, or jquery-echarts
   - Dependencies: only @angular/core, @angular/material (optional), @oneteme/jquery-core

2. **Configuration by Injection**
   - No auto-discovery of available fields or values
   - Parent ALWAYS passes explicit OrganizerConfig via @Input()

3. **Events-Only Interface**
   - All interaction via @Output() EventEmitter, not imperative method calls
   - Pure RxJS observables or EventEmitter

4. **Agnosticisme contextuel**
   — Fonctionne sur un tableau, un graphique, un dashboard KPI ou une page custom.
   — Aucune hypothèse sur la structure des données du parent.

---

## Références

- Contexte global : ../../docs/contexte-organizer-externalization.md
- Pilotage / backlog : ../../docs/pilotage-organizer-externalization.md
- Documentation utilisateur : README.md

