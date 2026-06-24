# Migration jquery-table vers @oneteme/jquery-organizer

## Vue d'ensemble

La transition de `jquery-table` vers `@oneteme/jquery-organizer` marque un changement architectural majeur : passage d'une gestion centralisée et dupliquée dans le composant tableau vers une **architecture décentralisée** où la logique de configuration (indicateurs, groupements, filtres, panneau latéral) est externalisée dans une bibliothèque autonome et réutilisable.

### Principaux gains

- **Réutilisabilité** : OrganizerButtonComponent et SlicePanelComponent fonctionnent avec tableaux, graphiques et dashboards KPI
- **Cohérence** : Interface unifiée pour tous les renderers (ECharts, Highcharts, ApexCharts, HTML Table)
- **Décentralisation** : Zéro dépendance sur les renderers ; la configuration provient du parent
- **Extensibilité** : Nouvelles fonctionnalités (lazy loading, filtres dynamiques, groupement) intégrées nativement

---

## Architecture

### Avant : jquery-table monolithique

```
jquery-table
├── Table Component (gère TOUT)
│   ├── Colonnes
│   ├── Groupement
│   ├── Filtres statiques (slice-panel intégré)
│   ├── "View Button" (menu de configuration)
│   └── État (activeColumns, activeGroup, activeFilters)
└── Logique dupliquée dans chaque page qui utilise une table
```

**Problèmes :**
- Slice-panel codé en dur dans TableComponent
- "View Button" n'existait que pour les tables
- Chaque graphique/dashboard réimplémentait la configuration manuellement
- Pas d'interface standardisée entre les composants

### Après : architecture décentralisée

```
@oneteme/jquery-core
└── Modèles purs (OrganizerState, OrganizerFieldDef, OrganizerEvent, helpers)
    ↑
    ├── jquery-organizer (composants UI autonomes)
    │   ├── OrganizerButtonComponent (configuration contextuelle)
    │   ├── SlicePanelComponent (filtres latéraux)
    │   └── Facades (OrganizerFacade, GroupByManager, LazyFieldManager)
    │
    ├── jquery-table (utilise organizer optionnellement)
    ├── jquery-echarts (utilise organizer optionnellement)
    ├── jquery-highcharts (utilise organizer optionnellement)
    └── jquery-apexcharts (utilise organizer optionnellement)
```

**Avantages :**
- Un seul set de composants pour tous les renderers
- Interface par configuration déclarative + événements
- Zéro dépendances circulaires
- Facile d'ajouter de nouveaux renderers

---

## Composants clés

### OrganizerButtonComponent

Bouton de configuration contextuel affichant un menu déroulant avec les options de sélection.

**Inputs :**
- `config: OrganizerConfig` — Options disponibles (indicateurs, groupements, stacks, filtres)
- `state: OrganizerState` — Sélections actuelles
- `hideMenuValues?: boolean` — Masquer les valeurs dans le menu

**Outputs :**
- `viewChange: OrganizerButtonEvent` — Émis lors d'une sélection (indicateur, groupe, stack, filtre)
- `sliceStateChange: OrganizerSliceState | null` — Émis après chargement des données de filtre

**Selector :** `<organizer-button>`

### SlicePanelComponent

Panneau latéral affichant les catégories de filtres avec multi-sélection.

**Inputs :**
- `sliceConfigs: SliceConfig[]` — Configuration des groupes de filtres
- `data: any[]` — Données source pour extraction des valeurs uniques (pour slices dynamiques)
- `showCounts?: boolean` — Afficher le nombre d'occurrences par catégorie
- `alwaysShow?: boolean` — Toujours afficher le panneau même vide

**Outputs :**
- `filterChange: Record<number, string[]>` — Sélections de filtres par clé de slice

**Selector :** `<slice-panel>`

### OrganizerFacade<T>

Gestionnaire d'état central pour les vues (remplace ViewFacade).

**Propriétés :**
- `fields: OrganizerFieldsState<T>` — Champs actifs et personnalisés
- `groupBy: OrganizerGroupByState` — État du groupement
- `sliceBy: OrganizerSliceByState<T>` — État des filtres dynamiques
- `enabled: boolean` — Utilisation du système d'organizer

**Méthodes :**
- `update(config)` — Met à jour l'état complet
- `setActiveFields(fields: T[])` — Change les colonnes actives
- `resetToDefaults()` — Réinitialise aux valeurs par défaut

---

## Exemples d'intégration

### Exemple 1 : Tableau avec organizer

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { TableComponent, TableColumnProvider, col } from '@oneteme/jquery-table';
import { OrganizerConfig, OrganizerEvent, OrganizerState } from '@oneteme/jquery-organizer';

interface RequestRow {
  id: string;
  method: string;
  status: 'success' | 'error';
  duration: number;
  host: string;
}

@Component({
  selector: 'app-requests-table',
  template: `
    <div class="table-container">
      <organizer-button 
        [config]="organizerConfig" 
        [state]="organizerState"
        (viewChange)="onViewChange($event)">
      </organizer-button>
      
      <jquery-table
        [config]="tableConfig"
        [data]="rows"
        [isLoading]="isLoading">
      </jquery-table>
    </div>
  `
})
export class RequestsTableComponent implements OnInit {
  private readonly _requestService = inject(RequestService);

  rows: RequestRow[] = [];
  isLoading = false;

  organizerConfig: OrganizerConfig = {
    indicators: [
      { id: 'method', label: 'Méthode', state: 'ready' },
      { id: 'status', label: 'Statut', state: 'ready' }
    ],
    groups: [
      { id: 'byHost', label: 'Par hôte' },
      { id: 'byMethod', label: 'Par méthode' }
    ],
    slices: [
      { id: 'status', label: 'Statut' },
      { id: 'host', label: 'Hôte' }
    ],
    showReset: true,
    buttonIcon: 'tune'
  };

  organizerState: OrganizerState = {
    selectedIndicator: 'method',
    selectedGroup: 'byHost',
    selectedSlices: ['status']
  };

  tableConfig: TableProvider<RequestRow> = {
    title: 'Requêtes REST',
    columns: [
      col('method', 'Méthode', { sortable: true }),
      col('status', 'Statut', { sliceable: true }),
      col('duration', 'Durée (ms)', { sortable: true }),
      col('host', 'Hôte', { groupable: true })
    ],
    slices: [
      {
        title: 'Statut',
        columnKey: 'status',
        categories: [
          { key: 'success', label: 'Succès', filter: r => r.status === 'success' },
          { key: 'error', label: 'Erreur', filter: r => r.status === 'error' }
        ]
      }
    ]
  };

  ngOnInit() {
    this.loadRows();
  }

  onViewChange(event: OrganizerButtonEvent): void {
    // Mise à jour de l'état des sélections
    this.organizerState = event.state;
    
    // Rechargement des données en fonction de la nouvelle sélection
    if (event.type === 'indicatorSelected' || event.type === 'groupSelected') {
      this.loadRows();
    }
  }

  private loadRows(): void {
    this.isLoading = true;
    const params = {
      indicator: this.organizerState.selectedIndicator,
      groupBy: this.organizerState.selectedGroup,
      filters: this.organizerState.selectedSlices
    };
    
    this._requestService.getRequests(params)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe(rows => this.rows = rows);
  }
}
```

### Exemple 2 : Graphique ECharts avec organizer et slice-panel

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { ChartComponent } from '@oneteme/jquery-echarts';
import { 
  OrganizerConfig, 
  OrganizerEvent, 
  OrganizerSliceState, 
  OrganizerViewField 
} from '@oneteme/jquery-organizer';
import { ChartProvider, field } from '@oneteme/jquery-core';

@Component({
  selector: 'app-rest-status-chart',
  template: `
    <div class="chart-card">
      <div class="chart-header">
        <div class="chart-title">Statut des requêtes</div>
        <organizer-button 
          [config]="organizerConfig" 
          [state]="organizerState"
          [hideMenuValues]="true"
          (viewChange)="onViewChange($event)"
          (sliceStateChange)="onSliceStateChange($event)">
        </organizer-button>
      </div>

      <div class="chart-body">
        <slice-panel
          *ngIf="sliceState"
          [sliceConfigs]="sliceState.sliceConfigs"
          [data]="sliceState.tasks"
          [showCounts]="false"
          [alwaysShow]="true"
          (filterChange)="onFilterChange($event)">
        </slice-panel>

        <chart
          type="column"
          [config]="chartProvider"
          [data]="chartData"
          [isLoading]="isLoading">
        </chart>
      </div>
    </div>
  `
})
export class RestStatusChartComponent implements OnInit {
  private readonly _restService = inject(RestRequestService);

  organizerConfig: OrganizerConfig = {
    indicators: [
      { id: 'count', label: 'Nombre de requêtes', state: 'ready' },
      { id: 'elapsed_p50', label: 'Temps médian (P50)', state: 'ready' },
      { id: 'elapsed_p95', label: 'Temps 95e percentile (P95)', state: 'ready' }
    ],
    groups: [
      { id: 'byHour', label: 'Par heure' },
      { id: 'byDay', label: 'Par jour' }
    ],
    slices: [
      { id: 'host', label: 'Hôte' },
      { id: 'method', label: 'Méthode HTTP' },
      { id: 'status_code', label: 'Code HTTP' }
    ],
    buttonIcon: 'tune'
  };

  organizerState = {
    selectedIndicator: 'count',
    selectedGroup: 'byHour',
    selectedSlices: []
  };

  chartProvider: ChartProvider<string, number> = {
    stacked: true,
    series: [
      { data: { x: field('period'), y: field('count') } }
    ],
    options: {
      grid: { top: 16, bottom: 48, left: 8, right: 16, containLabel: true },
      xAxis: { type: 'category', axisLabel: { rotate: 30, width: 120 } },
      yAxis: { type: 'value', axisLabel: { formatter: (v: number) => v.toLocaleString('fr-FR') } }
    }
  };

  chartData: any[] = [];
  sliceState: OrganizerSliceState | null = null;
  isLoading = false;
  private selectedFilters: Record<number, string[]> = {};

  ngOnInit() {
    this.loadData();
  }

  onViewChange(event: OrganizerButtonEvent): void {
    this.organizerState = event.state;
    
    // Mise à jour du provider si l'indicateur a changé
    if (event.type === 'indicatorSelected') {
      this.updateChartProvider();
    }
    
    if (event.type !== 'sliceSelected') {
      this.loadData();
    }
  }

  onSliceStateChange(sliceState: OrganizerSliceState | null): void {
    this.sliceState = sliceState;
  }

  onFilterChange(filters: Record<number, string[]>): void {
    this.selectedFilters = filters;
    this.loadData();
  }

  private updateChartProvider(): void {
    const indicatorKey = this.organizerState.selectedIndicator || 'count';
    this.chartProvider.series = [
      { data: { x: field('period'), y: field(indicatorKey) } }
    ];
  }

  private loadData(): void {
    this.isLoading = true;
    const params = {
      indicator: this.organizerState.selectedIndicator || 'count',
      groupBy: this.organizerState.selectedGroup || 'byHour',
      filters: this.selectedFilters,
      period: { start: new Date('2026-06-24'), end: new Date('2026-06-25') }
    };

    this._restService.getStatusChart(params)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe(data => this.chartData = data);
  }
}
```

### Exemple 3 : Intégration dans la page de test (/kpi-test/request/rest)

Extrait du composant RestKpiTestComponent qui montre l'intégration réelle avec 4 charts distincts :

```typescript
// Configuration centralisée convertie en OrganizerConfig
function toOrganizerConfig(
  chartConfig: ChartConfig, 
  onFetchSliceData?: OrganizerConfig['onFetchSliceData']
): OrganizerConfig {
  const activeIndicator = chartConfig?.indicators?.items?.find(i => i.selected);
  return {
    indicators: chartConfig?.indicators?.items?.map(i => ({
      id: i.key,
      label: i.menu.label || i.key,
      state: 'ready' as FieldState,
    })) || [],
    groups: chartConfig?.groups?.items?.map(g => ({
      id: g.key,
      label: g.menu.label || g.key,
    })) || [],
    stacks: activeIndicator?.extra?.stacks?.items?.map(s => ({
      id: s.key,
      label: s.menu.label || s.key,
    })) || [],
    slices: chartConfig?.filters?.items?.map(f => ({
      id: f.key,
      label: f.menu.label || f.key,
    })) || [],
    buttonIcon: 'tune',
    onFetchSliceData,
  };
}

// Handlers pour chaque chart
onStatusViewChange(event: OrganizerButtonEvent): void {
  // Mise à jour de la config locale en fonction de l'événement
  applyOrganizerEvent(event, this.$statusRepartition.chartConfig);
  
  // Mise à jour de l'état affiché
  this.$statusOrganizer = { config: this.$statusOrganizer.config, state: event.state };
  
  // Rechargement des données si ce n'est pas une sélection de filtre
  if (event.type !== 'sliceSelected') {
    this._fetchStatus();
  }
}

onStatusSliceChange(sliceState: OrganizerSliceState | null): void {
  this.$statusSlice = sliceState;
  if (!sliceState) {
    this.$statusFilteredValues = [];
  }
  this._fetchStatus();
}

// Template avec organizer-button
<organizer-button
  [config]="$statusOrganizer.config"
  [state]="$statusOrganizer.state"
  [hideMenuValues]="true"
  (viewChange)="onStatusViewChange($event)"
  (sliceStateChange)="onStatusSliceChange($event)">
</organizer-button>

<slice-panel
  *ngIf="$statusSlice"
  [sliceConfigs]="$statusSlice!.sliceConfigs"
  [data]="$statusSlice!.tasks"
  [showCounts]="false"
  [alwaysShow]="true"
  (filterChange)="onStatusFilterChange($event)">
</slice-panel>

<chart type="column"
       [config]="$statusRepartition.chartProvider || {series: []}"
       [data]="$statusRepartition.data"
       [isLoading]="$statusRepartition.loading">
</chart>
```

---

## Principales modifications

### 1. Imports

**Avant :**
```typescript
import { TableComponent, ViewButtonComponent, SlicePanelComponent } from '@oneteme/jquery-table';
```

**Après :**
```typescript
import { TableComponent } from '@oneteme/jquery-table';
import { 
  OrganizerButtonComponent, 
  SlicePanelComponent, 
  OrganizerConfig, 
  OrganizerButtonEvent,
  OrganizerState 
} from '@oneteme/jquery-organizer';
```

### 2. Modèles de données (jquery-core)

Ces modèles sont maintenant nommés avec le préfixe "Organizer" pour une cohérence globale :

| Ancien | Nouveau (jquery-core) |
|---|---|
| `ViewField` | `OrganizerFieldDef` |
| `ViewState` | `OrganizerState` |
| `ViewEvent` | `OrganizerEvent` |
| `ViewConfig` | `OrganizerConfig` |
| `viewField()` | `organizerFieldDef()` |
| `initialViewState()` | `initialOrganizerState()` |
| `groupableViewFields()` | `groupableOrganizerFields()` |
| `sliceableViewFields()` | `sliceableOrganizerFields()` |
| `viewFieldsFromChartSeries()` | `organizerFieldDefsFromChartSeries()` |
| `applyViewStateToSeries()` | `applyOrganizerStateToSeries()` |

### 3. Modèles spécifiques au composant (jquery-organizer)

Le composant bouton émet son propre événement pour éviter les collisions :

| Type | Usage |
|---|---|
| `OrganizerButtonEvent` | Événement du composant bouton (type: 'fieldToggled' \| 'indicatorSelected' \| 'groupSelected' \| 'stackSelected' \| 'sliceSelected' \| 'reset') |
| `OrganizerViewField` | Champ dans OrganizerConfig (pour le menu du bouton) |
| `OrganizerViewGroup` | Option de groupement |
| `OrganizerViewStack` | Option de stack/catégorisation |
| `OrganizerViewSlice` | Option de filtre |

### 4. Intégration template

**Avant :**
```html
<view-button 
  [config]="config"
  (viewChange)="onViewChange($event)">
</view-button>
<jquery-table [config]="tableConfig" [data]="rows"></jquery-table>
```

**Après :**
```html
<organizer-button 
  [config]="organizerConfig"
  [state]="organizerState"
  (viewChange)="onViewChange($event)"
  (sliceStateChange)="onSliceStateChange($event)">
</organizer-button>

<slice-panel
  *ngIf="sliceState"
  [sliceConfigs]="sliceState.sliceConfigs"
  [data]="sliceState.tasks"
  (filterChange)="onFilterChange($event)">
</slice-panel>

<jquery-table [config]="tableConfig" [data]="rows"></jquery-table>
```

### 5. Gestion d'état

**Avant :** État englobé dans le tableau
```typescript
table.activeColumns = [...];
table.activeGroup = 'byHost';
table.activeFilters = {0: ['success']};
```

**Après :** État externalisé dans le composant parent (OrganizerState de jquery-core)
```typescript
organizerState: OrganizerState = {
  selectedFieldIds: ['id', 'name', 'status'],
  groupByKey: 'byHost',
  dynamicSliceKeys: ['host', 'status']
};
```

Pour les graphiques avec le composant bouton :
```typescript
organizerButtonState = {
  selectedIndicator: 'count',
  selectedGroup: 'byHour',
  selectedStacks: [],
  selectedSlices: ['status']
};
```

---

## Fonctionnalités nouvelles

### Lazy Loading (chargement paresseux)

Les colonnes/champs peuvent charger leurs données de manière asynchrone :

```typescript
const config: TableProvider<Row> = {
  columns: [
    {
      key: 'id',
      header: 'ID',
      lazy: {
        fetchFn: () => this.fetchColumnData('id')
      }
    }
  ]
};
```

### Filtres dynamiques

Le slice-panel génère automatiquement les catégories à partir des données :

```typescript
const sliceConfig: SliceConfig = {
  title: 'Hôtes',
  columnKey: 'host',
  categories: [], // Vide → catégories générées dynamiquement
  dynamic: true
};
```

### GroupByManager et LazyFieldManager

Gestionnaires spécialisés pour le groupement et le lazy loading :

```typescript
const groupByMgr = new GroupByManager<T>();
const lazyFieldMgr = new LazyFieldManager<T>();
```

---

## Compatibilité

### Rétrocompatibilité jquery-table

`jquery-table` ré-exporte les composants et interfaces d'`@oneteme/jquery-organizer` :

```typescript
// Les deux imports sont équivalentes
import { SlicePanelComponent, OrganizerViewField } from '@oneteme/jquery-table';
import { SlicePanelComponent, OrganizerViewField } from '@oneteme/jquery-organizer';
```

**Zéro breaking change** pour les consommateurs existants.

### Graphiques (jquery-echarts, jquery-highcharts)

Intégration optionnelle et progressive. Chaque renderer peut utiliser `@oneteme/jquery-organizer` indépendamment.

---

## Résumé pour la PR

### Titre

**Externalisation de la logique de configuration dans @oneteme/jquery-organizer avec refactor des modèles jquery-core**

### Description

Cette PR implémente la transition majeure de la gestion des vues dans `jquery-table` vers une architecture décentralisée via `@oneteme/jquery-organizer`, avec une normalisation de la nomenclature dans jquery-core.

#### Points clés

1. **Nouveaux composants réutilisables**
   - `OrganizerButtonComponent` : bouton de configuration contextuel pour tous les renderers
   - `SlicePanelComponent` (migré depuis jquery-table) : panneau latéral de filtrage

2. **Façades d'état**
   - `OrganizerFacade<T>` : gestionnaire central d'état (remplace ViewFacade)
   - `GroupByManager<T>` : gestion du groupement
   - `LazyFieldManager<T>` : gestion du lazy loading

3. **Refactor des modèles jquery-core**
   - `ViewField` → `OrganizerFieldDef` : descripteur générique de champ
   - `ViewState` → `OrganizerState` : snapshot d'état des vues
   - `ViewEvent` → `OrganizerEvent` : événements génériques du système
   - `ViewConfig` → `OrganizerConfig` : configuration générique des vues
   - Helpers renommés : `viewField()` → `organizerFieldDef()`, etc.

4. **Modèles spécifiques jquery-organizer**
   - `OrganizerButtonEvent` : événement du composant bouton (distinct de OrganizerEvent)
   - `OrganizerViewField`, `OrganizerViewGroup`, `OrganizerViewStack`, `OrganizerViewSlice` : configuration du menu

5. **Intégration dans jquery-table**
   - `OrganizerButtonWrapperComponent` : adapter pour la rétrocompatibilité
   - Re-export des composants organizer pour access transparent
   - Support du lazy loading et des filtres dynamiques

6. **Intégration dans inspect-app**
   - Page de test `/kpi-test/request/rest` : 4 charts avec organizer et slice-panel
   - Support complet des indicateurs, groupements, stacks et filtres

#### Bénéfices

- **Cohérence** : Interface unifiée pour tableaux, graphiques et dashboards
- **Réutilisabilité** : Composants indépendants des renderers
- **Extensibilité** : Facile d'ajouter de nouveaux renderers ou fonctionnalités
- **Nomenclature claire** : Distinction nette entre modèles génériques (jquery-core) et composants UI (jquery-organizer)
- **Zéro breaking change** : Rétrocompatibilité totale avec jquery-table existant

#### Tests validés

- Builds sans erreur TypeScript (jquery-core, jquery-organizer, jquery-table, 3 renderers)
- Intégration fonctionnelle dans 4 charts KPI (statut, performance, volumétrie, latence)
- Persistence des filtres et restauration après rechargement
- Support du lazy loading et des données asynchrones
- Gestion correcte du groupement et des stacks
- Nomenclature cohérente dans toute la stack (jquery-core → jquery-organizer → renderers)

---

## Liens et références

- **jquery-organizer** : `projects/oneteme/jquery-organizer/`
- **jquery-table** : `projects/oneteme/jquery-table/`
- **inspect-app** : `inspect-app/src/app/views/kpi-test/request/rest/`
- **Documentation** : [jquery-organizer README](projects/oneteme/jquery-organizer/README.md)
