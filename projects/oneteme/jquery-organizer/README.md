# @oneteme/jquery-organizer

Bibliothèque Angular autonome pour la gestion décentralisée des vues dans les pages KPI, les graphiques et les tableaux. Elle fournit deux composants principaux : `OrganizerButtonComponent`, un bouton de configuration contextuel, et `SlicePanelComponent`, un panneau de filtre latéral.

> **Status Update (v0.0.42+)**: jquery-organizer est maintenant **totalement indépendant** et **correctement intégré** dans tous les renderers. Voir [PROJECT_COMPLETION_SUMMARY.md](../../PROJECT_COMPLETION_SUMMARY.md) pour un aperçu complet.

---

## 🚀 Quick Start

### Table
```typescript
import { TableComponent, ViewButtonComponent } from '@oneteme/jquery-table';

<view-button [config]="organizerConfig" (viewChange)="onViewChange($event)"></view-button>
<jquery-table [data]="data"></jquery-table>
```

### Chart
```typescript
import { ChartComponent, OrganizerButtonComponent } from '@oneteme/jquery-organizer';

<organizer-button [config]="organizerConfig" (viewChange)="onViewChange($event)"></organizer-button>
<chart [data]="transformedData"></chart>
```

---

## Sommaire

- [Contexte et problème résolu](#contexte-et-problème-résolu)
- [Architecture](#architecture)
- [Dépendances](#dépendances)
- [Installation](#installation)
- [OrganizerButtonComponent](#organizerbuttoncomponent)
  - [Inputs / Outputs](#inputs--outputs)
  - [OrganizerConfig](#organizerconfig)
  - [OrganizerState et OrganizerEvent](#organizerstate-et-organizerevent)
- [SlicePanelComponent](#slicepanelcomponent)
  - [Inputs / Outputs](#inputs--outputs-1)
  - [SliceConfig](#sliceconfig)
- [Intégration avec un graphique ECharts](#intégration-avec-un-graphique-echarts)
- [Intégration avec un tableau (jquery-table)](#intégration-avec-un-tableau-jquery-table)
- [Gestion automatique du slice-panel via onFetchSliceData](#gestion-automatique-du-slice-panel-via-onfetchslicedata)
- [Référence complète des interfaces](#référence-complète-des-interfaces)

---

## Contexte et problème résolu

Avant l'introduction de `jquery-organizer`, chaque composant graphique ou tableau devait gérer lui-même :

- la liste des indicateurs, groupes, catégories et filtres disponibles,
- l'état courant des sélections (indicateur actif, groupe actif, filtre actif),
- l'affichage d'un bouton de configuration et d'un menu déroulant,
- le cycle de vie du panneau de filtre latéral (fetch des données, affichage, réinitialisation).

Ce travail répétitif produisait du code dupliqué difficile à maintenir et des comportements incohérents d'un composant à l'autre.

`jquery-organizer` centralise cette logique dans deux composants réutilisables, totalement agnostiques du renderer (ECharts, Highcharts, ApexCharts, tableau HTML). Le composant parent se contente de fournir une configuration déclarative et de réagir aux événements.

---

## Architecture

```
@oneteme/jquery-organizer
├── OrganizerButtonComponent   (standalone)  — bouton + menu de configuration
├── OrganizerButtonModule                    — module NgModule pour import facile
├── SlicePanelComponent        (standalone)  — panneau latéral de filtrage
└── Interfaces
    ├── OrganizerConfig        — configuration du bouton
    ├── OrganizerState         — état courant des sélections
    ├── OrganizerEvent         — événement émis lors d'une interaction
    ├── OrganizerSliceState    — état émis lors d'un fetch de filtre
    ├── OrganizerViewField     — définition d'un indicateur ou champ
    ├── OrganizerViewGroup     — option de regroupement
    ├── OrganizerViewStack     — option de catégorisation (stack)
    ├── OrganizerViewSlice     — option de filtre
    ├── SliceConfig            — configuration d'un groupe de filtres
    ├── SliceColumnDef         — définition d'une colonne pour le slice
    └── SliceCategory          — catégorie individuelle dans un slice
```

`SlicePanelComponent` et ses modèles (`SliceConfig`, `SliceColumnDef`, `SliceCategory`) sont désormais hébergés dans `jquery-organizer` et **re-exportés** depuis `@oneteme/jquery-table` pour garantir la rétrocompatibilité.

---

## Dépendances

| Dépendance | Version | Rôle |
|---|---|---|
| `@angular/core` | >= 16.1.0 | Framework Angular |
| `@angular/common` | >= 16.1.0 | Directives communes |
| `@angular/material` | ^16.1.0 | MatMenu, MatButton, MatIcon |
| `@angular/cdk` | ^16.1.0 | Overlay (requis par Material) |
| `@oneteme/jquery-core` | ^0.0.32 | `DataProvider` utilisé dans `SliceColumnDef` |

---

## Installation

```bash
npm install @oneteme/jquery-organizer
```

Dans un contexte de développement en monorepo, pointez directement vers le dossier de build :

```json
{
  "dependencies": {
    "@oneteme/jquery-organizer": "file:../jquery-charts/dist/oneteme/jquery-organizer"
  }
}
```

---

## OrganizerButtonComponent

`OrganizerButtonComponent` est un composant standalone qui affiche un bouton ouvrant un menu Material. Ce menu expose les options de configuration : indicateur actif, regroupement, catégorisation, filtres. Il gère également le lazy-loading des données de champ et le cycle de vie du slice-panel.

### Import

```typescript
// Via NgModule
import { OrganizerButtonModule } from '@oneteme/jquery-organizer';

@NgModule({
  imports: [OrganizerButtonModule]
})
export class ViewsModule {}
```

```typescript
// Via standalone
import { OrganizerButtonComponent } from '@oneteme/jquery-organizer';

@Component({
  standalone: true,
  imports: [OrganizerButtonComponent]
})
export class MyComponent {}
```

### Inputs / Outputs

| Nom | Type | Description |
|---|---|---|
| `[config]` | `OrganizerConfig` | Configuration complète du bouton et du menu |
| `[state]` | `OrganizerState` | État courant des sélections (indicateur, groupe, filtres…) |
| `(viewChange)` | `EventEmitter<OrganizerEvent>` | Émis à chaque interaction utilisateur |
| `(sliceStateChange)` | `EventEmitter<OrganizerSliceState \| null>` | Émis après un fetch de données de filtre, ou `null` à la désélection |

### OrganizerConfig

```typescript
export interface OrganizerConfig {
  // Options disponibles dans le menu
  indicators?: OrganizerViewField[];   // Indicateurs (ex: Nombre d'appels, Temps moyen)
  groups?: OrganizerViewGroup[];       // Regroupements (ex: Par heure, Par jour)
  stacks?: OrganizerViewStack[];       // Catégories (ex: Par statut, Par taille)
  slices?: OrganizerViewSlice[];       // Filtres (ex: Par media, Par host)
  fields?: OrganizerViewField[];       // Champs visibles (usage tableau)

  // Callbacks optionnels
  onFetchFieldData?: (fieldId: string) => Promise<string[] | Record<string, any>[]>;
  // Chargement lazy des valeurs d'un champ — résultat mis en cache automatiquement

  onFetchSliceData?: (filterKey: string) => Observable<any[]> | Promise<any[]>;
  // Appelé quand l'utilisateur sélectionne un filtre.
  // Le composant fetche les données et émet (sliceStateChange) avec le résultat.

  onSliceClick?: () => void;
  // Callback alternatif si la gestion du panneau est assurée manuellement par le parent

  // Export
  showExport?: boolean;
  onExport?: () => void;

  // Préférences utilisateur
  showPreferences?: boolean;
  hasSavedPreferences?: boolean;
  onPreferencesEdit?: () => void;
  onPreferencesSave?: () => void;
  onPreferencesClear?: () => void;

  // Affichage du bouton
  showReset?: boolean;         // Affiche le bouton "Réinitialiser" (défaut: true)
  buttonLabel?: string;        // Label du bouton (défaut: vide)
  buttonIcon?: string;         // Icône Material (défaut: 'tune')
  showButtonIcon?: boolean;    // Affiche l'icône (défaut: true)
  menuPosition?: 'above' | 'below';
  menuClass?: string;
}
```

### OrganizerState et OrganizerEvent

`OrganizerState` représente l'état courant des sélections. Il est passé en `[state]` au composant pour qu'il puisse afficher les options actives dans le menu.

```typescript
export interface OrganizerState {
  visibleFields?: string[];       // IDs des champs visibles (usage tableau)
  selectedIndicator?: string;     // ID de l'indicateur actif
  selectedGroup?: string;         // ID du regroupement actif
  selectedStacks?: string[];      // IDs des catégories actives
  selectedSlices?: string[];      // IDs des filtres actifs
}
```

`OrganizerEvent` est émis par `(viewChange)` à chaque action utilisateur :

```typescript
export interface OrganizerEvent {
  type: 'fieldToggled' | 'indicatorSelected' | 'groupSelected'
      | 'stackSelected' | 'sliceSelected' | 'reset';
  state: OrganizerState;  // Nouvel état complet après l'interaction
  source?: 'user' | 'api';
}
```

Le parent doit appliquer `event.state` à sa propre logique (mise à jour de la config du graphique, refetch des données, etc.).

---

## SlicePanelComponent

`SlicePanelComponent` est un panneau latéral collapsible qui permet à l'utilisateur de filtrer les données affichées en cliquant sur des catégories. Il peut être utilisé indépendamment ou piloté automatiquement via `onFetchSliceData`.

### Import

```typescript
import { SlicePanelComponent } from '@oneteme/jquery-organizer';
// ou, pour la rétrocompatibilité :
import { SlicePanelComponent } from '@oneteme/jquery-table';
```

### Inputs / Outputs

| Nom | Type | Défaut | Description |
|---|---|---|---|
| `[sliceConfigs]` | `SliceConfig<T>[]` | `[]` | Définition des groupes de filtres |
| `[data]` | `T[]` | `[]` | Données brutes à filtrer |
| `[columns]` | `SliceColumnDef<T>[]` | `[]` | Colonnes pour le mode dynamique |
| `[showCounts]` | `boolean` | `true` | Affiche le nombre d'éléments par catégorie |
| `[showToggle]` | `boolean` | `true` | Affiche le bouton replier/déplier |
| `[collapsedByDefault]` | `boolean` | `false` | Panneau replié à l'initialisation |
| `[alwaysShow]` | `boolean` | `false` | Affiche même sans filtre actif |
| `(filterChange)` | `EventEmitter<(row: T) => boolean>` | — | Prédicat de filtre émis à chaque sélection |
| `(activeKeysChange)` | `EventEmitter<string[][]>` | — | Clés actives par groupe de filtre |
| `(collapsedChange)` | `EventEmitter<boolean>` | — | État replié/déplié |

Quand le panneau est replié, la classe CSS `collapsed` est automatiquement ajoutée sur l'élément hôte via `@HostBinding`, ce qui permet au parent de réduire sa largeur en CSS.

### SliceConfig

```typescript
export interface SliceConfig<T = any> {
  title?: string;         // Titre du groupe de filtres
  icon?: string;          // Icône Material optionnelle
  multiSelect?: boolean;  // Sélection multiple (défaut: false)
  columnKey?: string;     // Nom de la colonne — les catégories sont générées automatiquement
  hidden?: boolean;       // Masque ce groupe
  bucket?: (row: T) => string;  // Fonction de regroupement personnalisée
  categories?: SliceCategory<T>[];  // Catégories explicites (mode manuel)
}

export interface SliceCategory<T = any> {
  key: string;
  label: string;
  filter?: (row: T) => boolean;  // Prédicat de filtrage local
}
```

---

## Intégration avec un graphique ECharts

L'intégration suit un pattern en trois étapes : configuration initiale, réaction aux événements, refetch des données.

### Template

```html
<div class="kpi-chart-card">
  <div class="kpi-chart-header">
    <span class="kpi-chart-title">Statut</span>
    <organizer-button
      [config]="$statusOrganizer.config"
      [state]="$statusOrganizer.state"
      (viewChange)="onStatusViewChange($event)"
      (sliceStateChange)="onStatusSliceChange($event)">
    </organizer-button>
  </div>

  <div class="kpi-chart-body chart-with-slice">
    <slice-panel
      *ngIf="$statusSlice"
      [sliceConfigs]="$statusSlice.sliceConfigs"
      [data]="$statusSlice.tasks"
      [showCounts]="false"
      [alwaysShow]="true"
      (filterChange)="onStatusFilterChange($event)">
    </slice-panel>
    <chart type="column"
           [config]="$statusChartProvider"
           [data]="$statusData"
           [isLoading]="$statusLoading">
    </chart>
  </div>
</div>
```

### CSS (composant parent)

```scss
.chart-with-slice {
  display: flex;
  flex-direction: row;
  align-items: stretch;

  chart {
    flex: 1 1 0;
    min-width: 0;
  }

  slice-panel {
    flex: 0 0 260px;
    transition: flex-basis 200ms ease, width 200ms ease;

    &.collapsed {
      flex: 0 0 42px;  // Largeur réduite à l'icône seule
    }
  }
}
```

### Composant TypeScript

```typescript
import { OrganizerConfig, OrganizerEvent, OrganizerSliceState, OrganizerState } from '@oneteme/jquery-organizer';

// État
$statusOrganizer: { config: OrganizerConfig; state: OrganizerState } = { config: {}, state: {} };
$statusSlice: OrganizerSliceState | null = null;
$statusFilteredValues: any[] = [];

// Initialisation (à appeler après réception des queryParams)
private _initOrganizerConfig(): void {
  this.$statusOrganizer = {
    config: {
      indicators: [
        { id: 'count', label: 'Nombre d\'appels', state: 'ready' },
        { id: 'elapsed', label: 'Temps de réponse', state: 'ready' },
      ],
      groups: [
        { id: 'byHour', label: 'Par heure' },
        { id: 'byDay', label: 'Par jour' },
      ],
      stacks: [
        { id: 'status', label: 'Par statut' },
      ],
      slices: [
        { id: 'media', label: 'Media' },
        { id: 'host', label: 'Host' },
      ],
      onFetchSliceData: (filterKey) =>
        this._myService.getFilterValues(filterKey, this.params) as Observable<any[]>,
      showReset: false,
      buttonIcon: 'tune',
      showButtonIcon: true,
    },
    state: {
      selectedIndicator: 'count',
      selectedGroup: 'byDay',
    }
  };
}

// Réaction à un changement de vue
onStatusViewChange(event: OrganizerEvent): void {
  // Appliquer l'événement à la config métier
  this._applyOrganizerEvent(event, this.$statusChartConfig);
  // Mettre à jour l'état affiché dans le bouton
  this.$statusOrganizer = { config: this.$statusOrganizer.config, state: event.state };
  // Refetch seulement si ce n'est pas une sélection de filtre (le slice gère son propre fetch)
  if (event.type !== 'sliceSelected') {
    this._fetchStatus();
  }
}

// Réception des données de filtre (émis automatiquement par organizer-button)
onStatusSliceChange(sliceState: OrganizerSliceState | null): void {
  this.$statusSlice = sliceState;
  if (!sliceState) {
    this.$statusFilteredValues = [];
  }
  this._fetchStatus();
}

// Réaction à la sélection d'une catégorie dans le slice-panel
onStatusFilterChange(filterFn: (row: any) => boolean): void {
  if (!this.$statusSlice) return;
  const columnKey = this.$statusSlice.sliceConfigs[0]?.columnKey;
  this.$statusFilteredValues = this.$statusSlice.tasks
    .filter(filterFn)
    .map(t => t[columnKey]);
  this._fetchStatus();
}

// Fetch avec les valeurs filtrées
private _fetchStatus(): void {
  this._myService.getData({
    filters: this.$statusFilteredValues.length ? this.$statusFilteredValues : undefined
  }).subscribe(data => {
    // Mettre à jour les données du graphique
  });
}
```

---

## Intégration avec un tableau (jquery-table)

`SlicePanelComponent` étant désormais exporté depuis `@oneteme/jquery-table` par rétrocompatibilité, le code existant des composants tableau n'a pas à changer.

```typescript
// Avant (toujours fonctionnel)
import { SlicePanelComponent, SliceConfig } from '@oneteme/jquery-table';

// Ou directement depuis la source
import { SlicePanelComponent, SliceConfig } from '@oneteme/jquery-organizer';
```

L'`OrganizerButtonComponent` peut également être ajouté dans l'en-tête d'un tableau pour permettre à l'utilisateur de changer les colonnes visibles, le regroupement ou le tri :

```html
<div class="table-toolbar">
  <organizer-button
    [config]="tableOrganizerConfig"
    [state]="tableOrganizerState"
    (viewChange)="onTableViewChange($event)">
  </organizer-button>
</div>

<jqt-table [columns]="visibleColumns" [data]="tableData"></jqt-table>
```

```typescript
onTableViewChange(event: OrganizerEvent): void {
  // event.state.visibleFields contient les IDs des colonnes à afficher
  this.visibleColumns = this.allColumns.filter(c =>
    event.state.visibleFields?.includes(c.key)
  );
}
```

---

## Gestion automatique du slice-panel via onFetchSliceData

La propriété `onFetchSliceData` de `OrganizerConfig` permet à `OrganizerButtonComponent` de gérer **automatiquement** le cycle de vie du panneau de filtre :

1. L'utilisateur clique sur un filtre dans le menu (ex: "Media").
2. `OrganizerButtonComponent` appelle `onFetchSliceData('media')`.
3. Le résultat (Observable ou Promise) est souscrit en interne.
4. `(sliceStateChange)` est émis avec `{ sliceConfigs, tasks }` — prêt à être passé à `<slice-panel>`.
5. Si l'utilisateur désélectionne le filtre, `(sliceStateChange)` émet `null`.

Sans `onFetchSliceData`, `(sliceStateChange)` n'est jamais émis. Le parent peut alors gérer manuellement le panneau via `onSliceClick`.

```typescript
// Gestion automatique (recommandée)
config: {
  slices: [{ id: 'media', label: 'Media' }],
  onFetchSliceData: (filterKey) => this._service.getFilterValues(filterKey, this.params)
}

// Gestion manuelle (cas avancés)
config: {
  slices: [{ id: 'media', label: 'Media' }],
  onSliceClick: () => this._openCustomFilterDialog()
}
```

---

## Référence complète des interfaces

### OrganizerViewField

```typescript
export interface OrganizerViewField {
  id: string;
  label: string;
  visible?: boolean;
  state?: 'ready' | 'loading' | 'error';  // FieldState
  indicator?: 'count' | 'sum' | 'min' | 'max' | 'avg' | string;
  subFields?: OrganizerViewField[];
}
```

`state` contrôle l'affichage dans le menu :
- `undefined` : champ déclaré mais non chargé (grisé, inactif)
- `'loading'` : spinner affiché
- `'ready'` : cliquable et actif
- `'error'` : état d'erreur affiché

### OrganizerSliceState

```typescript
export interface OrganizerSliceState {
  sliceConfigs: SliceConfig<any>[];  // À passer à [sliceConfigs] de slice-panel
  tasks: any[];                       // À passer à [data] de slice-panel
}
```

### SliceColumnDef

```typescript
export interface SliceColumnDef<T = any> {
  key: string;
  header?: string;
  icon?: string;
  value?: DataProvider<any>;        // DataProvider de @oneteme/jquery-core
  lazy?: {
    fetchFn: () => Observable<any[]>;
  };
}
```


## Overview

`jquery-organizer` is a standalone Angular library that provides a flexible, reusable Organizer Button component for managing view state across **any context**: tables, charts (ECharts, Highcharts, ApexCharts), KPI dashboards, or custom pages.

### Key Features

- ✅ **Zero Dependencies on Renderers** — Works with any chart library, table, or custom context
- ✅ **Configuration via @Input** — Explicit, declarative configuration (no auto-discovery magic)
- ✅ **Events via @Output** — Pure RxJS observables for loose coupling
- ✅ **Support for Dynamic Series** — Async callbacks for runtime data discovery
- ✅ **Fully Customizable UI** — CSS tokens for theming, optional Material Design
- ✅ **TypeScript-First** — Full type safety with interfaces from `@oneteme/jquery-core`

## Installation

Since this is part of the jquery-charts monorepo, reference it via the workspace package resolution:

```bash
npm install @oneteme/jquery-organizer
```

Or in your `package.json` during development:

```json
{
  "dependencies": {
    "@oneteme/jquery-organizer": "file:../jquery-charts/dist/oneteme/jquery-organizer"
  }
}
```

## Quick Start

### 1. Import Module

```typescript
import { OrganizerButtonModule } from '@oneteme/jquery-organizer';

@NgModule({
  imports: [
    OrganizerButtonModule,
    // ... other imports
  ]
})
export class AppModule {}
```

### 2. Use in Template

```html
<organizer-button 
  [config]="organizerConfig"
  [viewState]="currentViewState"
  (viewChange)="onViewChange($event)">
</organizer-button>
```

### 3. Handle View Changes

```typescript
export class MyComponent {
  organizerConfig: OrganizerConfig = {
    viewConfig: {
      fields: [
        { id: 'name', label: 'Name', visible: true },
        { id: 'age', label: 'Age', visible: true }
      ],
      groups: [
        { id: 'byDept', label: 'By Department' },
        { id: 'byTeam', label: 'By Team' }
      ]
    }
  };

  currentViewState: ViewState;

  onViewChange(event: OrganizerEvent): void {
    // Apply the new view state to your data/rendering
    this.currentViewState = event.viewState;
    this.applyFiltersAndGrouping();
  }
}
```

## Usage Patterns

### Table Integration

```html
<!-- In a table component template -->
<organizer-button 
  [config]="tableOrganizerConfig"
  (viewChange)="onTableViewChange($event)">
</organizer-button>

<table>
  <thead>
    <tr>
      <th *ngFor="let field of visibleFields">{{ field.label }}</th>
    </tr>
  </thead>
  <tbody>
    <!-- table body -->
  </tbody>
</table>
```

### Chart Integration (ECharts, Highcharts, ApexCharts)

```html
<!-- In a chart component template -->
<organizer-button 
  [config]="chartOrganizerConfig"
  (viewChange)="onChartViewChange($event)">
</organizer-button>

<div echarts [options]="chartOptions"></div>
```

### KPI Dashboard

```html
<!-- In a KPI page -->
<organizer-button 
  [config]="kpiOrganizerConfig"
  [viewState]="currentViewState"
  (viewChange)="onKpiViewChange($event)">
</organizer-button>

<div class="kpi-metrics">
  <div *ngFor="let metric of visibleMetrics">
    <h3>{{ metric.label }}</h3>
    <p>{{ metric.value }}</p>
  </div>
</div>
```

## Configuration

### OrganizerConfig Interface

```typescript
interface OrganizerConfig {
  // ViewConfig from jquery-core (required)
  viewConfig: ViewConfig;

  // Optional callback for dynamic series loading
  onSeriesNeeded?: (fieldId: string) => Promise<any[]>;

  // Optional callback when user clicks "Slice/Filter"
  onSliceClick?: () => void;

  // UI options
  showReset?: boolean;              // Default: true
  menuPosition?: 'above' | 'below'; // Default: 'below'
  menuClass?: string;               // Custom CSS class for menu
  buttonLabel?: string;             // Default: 'View'
  buttonIcon?: string;              // Material icon name, default: 'tune'
  showButtonIcon?: boolean;         // Default: true
}
```

### ViewConfig Interface (from jquery-core)

```typescript
interface ViewConfig {
  fields?: ViewField[];           // Available fields/columns
  indicators?: ViewField[];       // Available indicators (count, sum, etc.)
  groups?: ViewField[];           // Available grouping options
  stacks?: ViewField[];           // Available stacking options
  slices?: ViewField[];           // Available filters
}

interface ViewField {
  id: string;
  label: string;
  visible?: boolean;
  indicator?: 'count' | 'sum' | 'min' | 'max' | 'avg' | string;
  subCategories?: ViewField[];    // For hierarchical menus
}
```

## Events

### viewChange Output

Emitted when user interacts with the menu:

```typescript
@Output() viewChange = new EventEmitter<OrganizerEvent>();

interface OrganizerEvent extends ViewEvent {
  type: string;
  viewState: ViewState;
  metadata?: {
    fieldChanged?: boolean;
    indicatorChanged?: boolean;
    groupByChanged?: boolean;
    stackChanged?: boolean;
    filterChanged?: boolean;
    resetTriggered?: boolean;
  };
  source?: 'user' | 'api' | 'programmatic';
  timestamp?: Date;
}
```

### menuToggle Output

Emitted when menu opens/closes:

```typescript
@Output() menuToggle = new EventEmitter<boolean>();

// Usage
(menuToggle)="onMenuToggle($event)"
```

## Theming

### CSS Tokens

Customize the appearance via CSS variables:

```scss
// In your global styles or component
:host {
  --organizer-primary: #007bff;           // Main color
  --organizer-accent: #ff6b35;            // Accent color
  --organizer-hover-bg: #f5f5f5;          // Hover background
  --organizer-selected-bg: #e0e0e0;       // Selected background
  --organizer-border-color: #e0e0e0;      // Border color
  --organizer-text-color: #333333;        // Text color
  --organizer-button-size: 40px;          // Button height
  --organizer-menu-max-height: 400px;     // Menu max height
  --organizer-z-index: 1000;              // Z-index for dropdown
}
```

### Material Design Dependencies

This component uses Angular Material for icons and styling. Make sure `@angular/material` is installed:

```bash
npm install @angular/material @angular/cdk
```

## Architecture Constraints

For successful decentralization, the following constraints **must** be maintained:

### 1. Zero Dependencies on Renderers
- ❌ `jquery-organizer` must NEVER import from `jquery-table`, `jquery-highcharts`, `jquery-apexcharts`, or `jquery-echarts`
- ✅ Dependencies go ONLY to `@angular/core`, `@angular/material` (optional), and `jquery-core`

### 2. Configuration by Injection, Not Auto-Discovery
- ❌ Component never auto-detects available fields or values
- ✅ Parent ALWAYS passes explicit `OrganizerConfig`

### 3. Events, Not Imperative Callbacks
- ❌ No direct method calls to parent component
- ✅ All interaction via `@Output()` events with proper typing

### 4. No Service Injection from Context
- ❌ Never inject `ViewFacade` or context-specific services
- ✅ All logic parameterized via `@Input()` and callbacks

## Integration Examples

### With jquery-echarts

```typescript
import { OrganizerButtonModule } from '@oneteme/jquery-organizer';

@Component({
  selector: 'app-echarts-with-organizer',
  template: `
    <organizer-button 
      [config]="organizerConfig"
      (viewChange)="onViewChange($event)">
    </organizer-button>
    <div echarts [options]="chartOptions"></div>
  `,
  standalone: true,
  imports: [OrganizerButtonModule]
})
export class EchartsWithOrganizerComponent {
  organizerConfig: OrganizerConfig = { /* ... */ };
  chartOptions: any;

  onViewChange(event: OrganizerEvent): void {
    // Rebuild chart options based on new viewState
    this.chartOptions = this.buildChartOptions(event.viewState);
  }

  private buildChartOptions(viewState: ViewState): any {
    // Transform viewState to ECharts options
    return { /* ... */ };
  }
}
```

### With KPI Dashboards

```typescript
@Component({
  selector: 'app-kpi-dashboard',
  template: `
    <organizer-button 
      [config]="kpiOrganizerConfig"
      [viewState]="viewState"
      (viewChange)="onKpiViewChange($event)">
    </organizer-button>
    
    <div class="kpi-grid">
      <kpi-card *ngFor="let card of visibleCards" [data]="card"></kpi-card>
    </div>
  `
})
export class KpiDashboardComponent {
  kpiOrganizerConfig: OrganizerConfig;
  viewState: ViewState;
  visibleCards: any[];

  onKpiViewChange(event: OrganizerEvent): void {
    this.viewState = event.viewState;
    this.applyViewToKpis();
  }

  private applyViewToKpis(): void {
    // Filter, group, and reorganize KPI cards
  }
}
```

## Dependencies

### Peer Dependencies (Provided by Application)

- `@angular/core` (>=16.1.0)
- `@angular/common` (>=16.1.0)
- `@angular/material` (^16.1.0) — Optional, for Material Design
- `@angular/cdk` (^16.1.0) — Optional, for CDK utilities

### Direct Dependencies

- `@oneteme/jquery-core` (^0.0.32) — For ViewState, ViewField, ViewEvent interfaces
- `tslib` (^2.3.0) — Utility library

## Testing

### Unit Tests

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrganizerButtonComponent, OrganizerButtonModule } from '@oneteme/jquery-organizer';

describe('OrganizerButtonComponent', () => {
  let component: OrganizerButtonComponent;
  let fixture: ComponentFixture<OrganizerButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizerButtonModule]
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizerButtonComponent);
    component = fixture.componentInstance;
  });

  it('should emit viewChange on field toggle', (done) => {
    component.config = {
      viewConfig: {
        fields: [{ id: 'field1', label: 'Field 1', visible: true }]
      }
    };

    component.viewChange.subscribe((event) => {
      expect(event.metadata?.fieldChanged).toBe(true);
      done();
    });

    component.onFieldToggle('field1', false);
  });
});
```

## Documentation

For complete documentation on ViewState, ViewField, ViewEvent, and ViewConfig, refer to:
- `@oneteme/jquery-core` documentation
- `docs/contexte-organizer-externalization.md` — Architecture context
- `docs/pilotage-organizer-externalization.md` — Implementation roadmap

## License

Part of the jquery-charts monorepo. See LICENSE in the repository root.

## Contributing

Contributions are welcome! Please follow the contribution guidelines in the main repository.

## Support

For issues, questions, or feature requests, use the GitHub Issues in the jquery-charts repository.
