# @oneteme/jquery-organizer

Bibliothèque Angular autonome pour la gestion décentralisée des configurations de graphiques et tableaux. Elle fournit :

- **OrganizerButtonComponent** — Bouton configurable pour sélectionner indicateurs, regroupements et filtres
- **SlicePanelComponent** — Panneau latéral collapsible pour le filtrage par catégories
- **Adapters** — Fonctions de conversion ChartConfig ↔ OrganizerConfig avec auto-détection d'unités
- **Facade** — Gestion centralisée d'état pour les champs visibles, regroupements, filtres

> **v0.0.43+**: Support complet pour **UnitConfig avec auto-scaling intelligent** des unités Y (ms → µs → s, etc.)

---

## 🚀 Quick Start

### Import

```typescript
import { OrganizerButtonModule } from '@oneteme/jquery-organizer';
import { OrganizerConfig, OrganizerState, OrganizerButtonEvent } from '@oneteme/jquery-organizer';

@NgModule({
  imports: [OrganizerButtonModule]
})
export class MyModule {}
```

### Template

```html
<organizer-button 
  [config]="organizerConfig"
  [state]="organizerState"
  (viewChange)="onOrganizerChange($event)"
  (sliceStateChange)="onSliceStateChange($event)">
</organizer-button>

<slice-panel
  *ngIf="sliceState"
  [sliceConfigs]="sliceState.sliceConfigs"
  [data]="sliceState.tasks"
  (filterChange)="onFilterChange($event)">
</slice-panel>
```

---

## 📋 Sommaire

- [Architecture](#architecture)
- [Dépendances](#dépendances)
- [OrganizerButtonComponent](#organizerbuttoncomponent)
  - [Inputs / Outputs](#inputs--outputs)
  - [OrganizerConfig](#organizerconfig)
  - [OrganizerState et OrganizerEvent](#organizerstate-et-organizerevent)
- [SlicePanelComponent](#slicepanelcomponent)
- [Système d'Unités avec Auto-Scaling](#système-dunités-avec-auto-scaling)
- [Chart Adapter](#chart-adapter)
- [Intégration avec jquery-echarts](#intégration-avec-jquery-echarts)
- [Intégration avec jquery-table](#intégration-avec-jquery-table)

---

## Architecture

```
@oneteme/jquery-organizer
├── organizer-button/
│   ├── organizer-button.component.ts    (standalone)
│   └── organizer-button.module.ts
├── slice-panel/
│   ├── slice-panel.component.ts         (standalone)
│   └── slice-panel.model.ts
├── models/
│   ├── organizer-config.interface.ts    (OrganizerConfig, OrganizerState, OrganizerEvent)
│   ├── organizer-chart-adapter.ts       (chartConfigToOrganizer, resolveYUnit, etc.)
│   ├── organizer-utils.ts               (buildYFields, resolveYKey)
│   └── organizer-menu.model.ts
├── organizer-facade/
│   └── organizer-facade.ts              (Gestion centralisée d'état)
└── public-api.ts                        (Exports publics)
```

---

## Dépendances

| Dépendance | Version | Rôle |
|---|---|---|
| `@angular/core` | >= 16.1.0 | Framework Angular |
| `@angular/material` | ^16.1.0 | MatMenu, MatIcon (optionnel) |
| `@oneteme/jquery-core` | ^0.0.32+ | UnitConfig, ScaleConfig, DataProvider |

---

## OrganizerButtonComponent

Composant standalone qui affiche un bouton ouvrant un menu Material. Le menu expose les options de configuration et gère le lazy-loading des données.

### Inputs / Outputs

| Prop | Type | Description |
|---|---|---|
| `[config]` | `OrganizerConfig` | Configuration du bouton et menu |
| `[state]` | `OrganizerState` | État courant des sélections |
| `(viewChange)` | `EventEmitter<OrganizerEvent>` | Émis à chaque interaction utilisateur |
| `(sliceStateChange)` | `EventEmitter<OrganizerSliceState \| null>` | Données de filtre après fetch |

### OrganizerConfig

```typescript
export interface OrganizerConfig {
  // Champs/Indicateurs/Groupements disponibles
  xFields?: OrganizerXField[];           // Dimensions (ex: date, host)
  yFields?: OrganizerYField[];           // Indicateurs (ex: count, elapsed_avg)
  groups?: OrganizerViewGroup[];         // Options de regroupement
  slices?: OrganizerViewSlice[];         // Options de filtre

  // Callbacks
  onFetchFieldData?: (fieldId: string) => Promise<any[]>;
  onFetchSliceData?: (filterKey: string) => Observable<any[]> | Promise<any[]>;
  onSliceClick?: () => void;

  // Export & Préférences
  showExport?: boolean;
  onExport?: () => void;
  showPreferences?: boolean;
  onPreferencesEdit?: () => void;
  onPreferencesSave?: () => void;
  onPreferencesClear?: () => void;

  // UI
  showReset?: boolean;                   // Défaut: true
  buttonLabel?: string;
  buttonIcon?: string;                   // Icône Material
  showButtonIcon?: boolean;
  menuPosition?: 'above' | 'below';
  menuClass?: string;

  switchView?: {
    currentView: 'chart' | 'table';
    onSwitch: (newView: 'chart' | 'table') => void;
  };
}
```

### OrganizerState et OrganizerEvent

```typescript
export interface OrganizerState {
  viewMode?: 'chart' | 'table';
  visibleFields?: string[];             // Champs visibles en table
  selectedX?: string;                   // Dimension X (ex: 'date')
  selectedY?: string;                   // Indicateur Y (ex: 'count')
  selectedYAggregate?: string;           // Agrégat si applicable
  selectedGroupBy?: string;              // Regroupement actif
  selectedSlices?: string[];             // Filtres actifs
}

export interface OrganizerButtonEvent {
  type: 'fieldToggled' | 'xSelected' | 'ySelected' | 'groupBySelected' 
      | 'sliceSelected' | 'reset' | 'viewSwitched';
  state: OrganizerState;                 // État complet après action
  source?: 'user' | 'api';
  resolvedYUnit?: string | UnitConfig;   // Unité auto-détectée (voir Auto-Scaling)
}
```

---

## SlicePanelComponent

Panneau latéral collapsible pour filtrer les données par catégories.

### Inputs / Outputs

| Prop | Type | Défaut | Description |
|---|---|---|---|
| `[sliceConfigs]` | `SliceConfig<T>[]` | `[]` | Définition des groupes de filtres |
| `[data]` | `T[]` | `[]` | Données brutes à filtrer |
| `[showCounts]` | `boolean` | `true` | Affiche comptage par catégorie |
| `[showToggle]` | `boolean` | `true` | Affiche bouton replier/déplier |
| `[alwaysShow]` | `boolean` | `false` | Affiche même sans données |
| `(filterChange)` | `EventEmitter<(row: T) => boolean>` | — | Prédicat de filtre |
| `(collapsedChange)` | `EventEmitter<boolean>` | — | État replié |

---

## Système d'Unités avec Auto-Scaling

### UnitConfig — Configuration Intelligente

Au lieu d'une simple string `unit: 'ms'`, `UnitConfig` permet l'auto-détection du meilleur format selon l'ordre de grandeur des données :

```typescript
interface UnitConfig {
  baseUnit: string;              // Unité source ('s', 'o', etc.)
  scales: ScaleConfig[];         // Formats disponibles (µs, ms, s)
  precision?: number;
  formatter?: (v: number, selectedUnit: string) => string;
}

interface ScaleConfig {
  unit: string;                  // Unité affichée ('µs', 'ms', 's')
  scale: number;                 // Facteur de conversion (1000 pour s→ms)
  threshold?: number;            // Utiliser si max(données) > threshold
}
```

### Exemple: Latence avec Auto-Scaling

```typescript
{
  key: 'avg',
  selected: true,
  unit: {
    baseUnit: 's',
    scales: [
      { unit: 'µs', scale: 1000000, threshold: 0.001 },  // < 1ms
      { unit: 'ms', scale: 1000,    threshold: 1 },      // < 1s  (DEFAULT)
      { unit: 's',  scale: 1,       threshold: Infinity } // >= 1s
    ]
  }
}
```

**Résultat :**
- Données `[0.0001, 0.0005]` → Affiche en **µs** (`100 µs`, `500 µs`)
- Données `[0.05, 0.2, 0.8]` → Affiche en **ms** (`50 ms`, `200 ms`, `800 ms`)
- Données `[1.5, 3.2, 5.1]` → Affiche en **s** (`1,5 s`, `3,2 s`, `5,1 s`)

### Affichage Adaptatif de la Précision

Les nombres sont formatés avec une précision qui s'ajuste à l'ordre de grandeur :

```
Valeur        Format         Raison
0.000123   → "0,000123"     6 décimales (très petit)
0.05       → "0,05"        2 décimales
1234       → "1 234"       0 décimale (entier avec séparateur)
50000      → "50 000"      0 décimale
```

---

## Chart Adapter

Les fonctions `organizer-chart-adapter.ts` convertissent entre `ChartConfig` (métier) et `OrganizerConfig` (UI) :

```typescript
// ChartConfig → OrganizerConfig
export function chartConfigToOrganizer(
  chartConfig: any,
  options?: OrganizerChartBridgeOptions
): OrganizerConfig

// ChartConfig → OrganizerState
export function chartConfigToState(chartConfig: any): OrganizerState

// ChartConfig → Événement + État unifié
export function chartConfigToUnifiedState(
  chartConfig: any,
  viewMode?: 'chart' | 'table'
): OrganizerUnifiedState

// Applique un OrganizerEvent à ChartConfig
export function applyOrganizerEventToChart(
  event: OrganizerButtonEvent,
  chartConfig: any
): void

// Résout l'unité Y pour l'événement
export function resolveYUnit(
  chartConfig: any,
  selectedY?: string,
  selectedYAggregate?: string
): string | UnitConfig | undefined
```

---

## Intégration avec jquery-echarts

### Pattern 3-étapes

1. **Initialisation** : Construire OrganizerConfig depuis ChartConfig
2. **Réaction aux événements** : Appliquer OrganizerEvent à ChartConfig
3. **Refetch** : Recharger les données avec la nouvelle config

### Exemple Complet

```typescript
import { OrganizerButtonEvent, OrganizerSliceState } from '@oneteme/jquery-organizer';
import { chartConfigToOrganizer, chartConfigToState, applyOrganizerEventToChart } from '@oneteme/jquery-organizer';

@Component({
  selector: 'app-kpi',
  template: `
    <organizer-button
      [config]="$latency.config"
      [state]="$latency.state"
      (viewChange)="onLatencyViewChange($event)"
      (sliceStateChange)="onLatencySliceChange($event)">
    </organizer-button>
    <chart [config]="$latency.chartProvider" [data]="$latency.data"></chart>
  `
})
export class KpiComponent {
  $latency = {
    config: {},
    state: {},
    chartConfig: REST_LATENCY_CHART_CONFIG('day'),
    chartProvider: {},
    data: []
  };

  ngOnInit() {
    // Initialisation
    this.$latency.config = chartConfigToOrganizer(this.$latency.chartConfig);
    this.$latency.state = chartConfigToState(this.$latency.chartConfig);
    this._fetchLatency();
  }

  onLatencyViewChange(event: OrganizerButtonEvent): void {
    // Appliquer l'événement → met à jour ChartConfig
    applyOrganizerEventToChart(event, this.$latency.chartConfig);
    
    // Mettre à jour la UI du button
    this.$latency.state = event.state;
    
    // Refetch
    this._fetchLatency();
  }

  private _fetchLatency(): void {
    const cfg = this.$latency.chartConfig;
    const ind = cfg.indicators.items.find(i => i.selected);
    
    this._httpService.getLatency({ indicator: ind, ... }).subscribe(data => {
      const series = buildSeries(cfg.series.items, ind, cfg.groups.items[0], null, data);
      
      // Injection de l'unité (simple string ou UnitConfig)
      this.$latency.chartProvider = {
        ...this.BASE_CHART_PROVIDER,
        series,
        yUnit: ind?.unit  // ← string | UnitConfig
      };
      
      this.$latency.data = data;
    });
  }
}
```

---

## Intégration avec jquery-table

```typescript
import { TableComponent } from '@oneteme/jquery-table';
import { OrganizerButtonModule } from '@oneteme/jquery-organizer';

@Component({
  imports: [TableComponent, OrganizerButtonModule]
})
export class TableWithOrganizerComponent {
  @ViewChild(TableComponent) table: TableComponent;

  onOrganizerViewChange(event: OrganizerButtonEvent): void {
    // Le tableau gère automatiquement les colonnes visibles
    if (event.type === 'fieldToggled') {
      this.table.applyVisibleColumns(event.state.visibleFields);
    }
    if (event.type === 'groupBySelected') {
      this.table.applyGroupBy(event.state.selectedGroupBy);
    }
  }
}
```

---

## API Exports

Depuis `@oneteme/jquery-organizer` :

```typescript
// Composants
export { OrganizerButtonComponent } from './organizer-button.component';
export { OrganizerButtonModule } from './organizer-button.module';
export { SlicePanelComponent } from './slice-panel.component';

// Interfaces
export { OrganizerConfig, OrganizerState, OrganizerButtonEvent, OrganizerSliceState } from './organizer-config.interface';
export { SliceConfig, SliceColumnDef, SliceCategory } from './slice-panel.model';

// Adapters
export {
  chartConfigToOrganizer,
  chartConfigToState,
  chartConfigToUnifiedState,
  applyOrganizerEventToChart,
  resolveYUnit
} from './organizer-chart-adapter';

// Utilitaires
export { buildYFields, resolveYKey } from './organizer-utils';

// Facade
export { OrganizerFacade } from './organizer-facade/organizer-facade';
```

---

## Changelog

### v0.0.43+
- ✅ Ajout du support **UnitConfig** avec auto-scaling intelligent
- ✅ Exportes les adapters (chartConfigToOrganizer, resolveYUnit, etc.)
- ✅ Renommage des propriétés OrganizerFacade (Column → Field)
- ✅ Support des `ScaleConfig` pour conversion dynamique d'unités
- ✅ Formatage adaptatif de la précision (smartFormatY)

### v0.0.42
- Refactoring des exports publics
- Consolidation de SlicePanelComponent

---

## Support

Pour des questions ou des bugs, ouvrir une issue dans le repository jquery-charts.

License: Voir LICENSE in the root.
