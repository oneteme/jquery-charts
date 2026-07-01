# Audit — `@oneteme/jquery-organizer`

> Date : 30 juin 2026  
> Périmètre : `jquery-organizer` (lib), intégration `jquery-table`, intégration `jquery-echarts` via `inspect-app`  
> Objectif stratégique : homogénéiser chart ↔ table, simplifier l'intégration développeur, rendre la lib production-ready

---

## Table des matières

1. [Vue d'ensemble architecturale](#1-vue-densemble-architecturale)
2. [Qualité du code](#2-qualité-du-code)
3. [API publique & typage](#3-api-publique--typage)
4. [Fonctionnalités manquantes ou incomplètes](#4-fonctionnalités-manquantes-ou-incomplètes)
5. [Intégration jquery-table](#5-intégration-jquery-table)
6. [Intégration jquery-echarts (inspect-app)](#6-intégration-jquery-echarts-inspect-app)
7. [Feuille de route — Chart ↔ Table switching](#7-feuille-de-route--chart--table-switching)
8. [Récapitulatif priorisé](#8-récapitulatif-priorisé)

---

## 1. Vue d'ensemble architecturale

### Ce qui existe

```
@oneteme/jquery-organizer
├── organizer-button/           ← composant UI principal (menu + sous-menus)
├── slice-panel/                ← panneau de filtres latéral
├── models/
│   ├── organizer-config.interface.ts   ← types OrganizerConfig / State / Event
│   ├── organizer-menu.model.ts         ← constantes labels/icônes
│   ├── organizer-utils.ts              ← buildYFields, resolveYKey
│   └── organizer-chart-adapter.ts      ← bridge ChartConfig ↔ OrganizerConfig
├── organizer-facade/           ← logique métier partagée (table)
├── group-by-manager/           ← collapse/expand groupes
└── lazy-field-manager/         ← chargement différé colonnes
```

### Flux de données

```
ChartConfig (app)
    ↓ chartConfigToOrganizer()
OrganizerConfig ──→ OrganizerButtonComponent ──→ [UI Menu]
OrganizerState  ←── OrganizerButtonEvent     ←── [User click]
    ↓ applyOrganizerEventToChart()
ChartConfig muté ──→ API query
```

### Problème structurel fondamental

`OrganizerConfig` porte deux modes dans un seul objet plat :

| Champ | Mode |
|---|---|
| `fields` | Table uniquement |
| `xFields`, `yFields` | Chart uniquement |
| `groups`, `slices` | Commun |

Il n'existe pas de champ `mode: 'table' \| 'chart'` explicite. Le composant infère le mode via `hasChartFields()` et `hasTableFields()`. Cette ambiguïté est une source de bugs silencieux et rend impossible une bascule chart/table propre.

---

## 2. Qualité du code

### 2.1 SCSS — Dead code massif

Le fichier `organizer-button.component.scss` contient deux systèmes de styles superposés :

**Problème 1 — Variables CSS jamais alimentées**

```scss
// Ces variables sont définies dans les règles mais jamais déclarées sur :host ou :root
--organizer-primary
--organizer-accent
--organizer-text-color
--organizer-hover-bg
--organizer-selected-bg
--organizer-border-color
--organizer-menu-max-height
```
Résultat : tous les composants utilisant ces variables tombent silencieusement sur `inherit` ou `initial`. Ce code est mort.

**Problème 2 — Double système de menu**

Le fichier contient deux blocs concurrents :
- L'ancien : `.organizer-menu` (utilisé par aucun élément HTML actuel)
- Le nouveau : `:has(.organizer-menu-label)` (actif)

Le CSS généré est ~2× plus volumineux que nécessaire.

**Recommandation** : supprimer tout le bloc `// Menu customizations (mat-menu)` (~80 lignes) et les variables CSS mortes.

---

### 2.2 `::ng-deep` — API dépréciée

`::ng-deep` est officiellement déprécié depuis Angular 7 et sera supprimé dans une future version. Le fichier SCSS l'utilise ~30 fois.

**Alternative correcte** : passer à `ViewEncapsulation.None` sur le composant organizer-button, et encapsuler tous les styles dans un sélecteur racine `.organizer-btn-root { ... }` pour éviter les fuites globales.

---

### 2.3 `applyOrganizerEventToChart` — Complexité cognitive

La fonction a une complexité cognitive de **25** (seuil SonarQube : 15). Elle :
- Nettoie les synthétiques
- Gère X (2 branches : group réel / stack→synthetic)
- Gère Y (avec resolveYKey)
- Gère GroupBy (4 branches : stack réel / group→synthetic / conflit X=GroupBy / déselection)
- Gère les slices

**Recommandation** : décomposer en fonctions privées :

```typescript
function _applyXSelection(state, chartConfig): void
function _applyYSelection(state, chartConfig): void
function _applyGroupBySelection(state, chartConfig): void
function _applySliceSelection(state, chartConfig): void
function _cleanSynthetics(chartConfig): void
```

---

### 2.4 Pattern `__synthetic` — Fragile

Le flag `extra.__synthetic` est un booléen posé sur l'objet `extra` du `ChartItem`. C'est une convention implicite qui :
- N'est pas dans le type `extra?: { ... }` — il est ajouté via `as any`
- Peut être écrasé si l'app définit son propre champ `__synthetic`
- Rend le `ChartConfig` muté (statefull) entre les appels

**Recommandation** : remplacer par une `WeakSet<OrganizerChartItem>` statique dans le module adapter :

```typescript
const _syntheticItems = new WeakSet<OrganizerChartItem>();

// Création
_syntheticItems.add(syntheticItem);

// Nettoyage
chartConfig.groups.items = chartConfig.groups.items.filter(g => !_syntheticItems.has(g));
```

Plus propre, zéro mutation du type, pas de conflit de noms.

---

### 2.5 `ngOnInit() {}` vide

Présent dans `organizer-button.component.ts` et `rest.component.ts`. Déclenche des avertissements SonarQube. À supprimer ou implémenter.

---

### 2.6 Imports inutilisés dans le composant

```typescript
// organizer-button.component.ts
import { OrganizerYField, OrganizerTemplate } from '...'; // jamais utilisés dans le TS
```

---

## 3. API publique & typage

### 3.1 `OrganizerChartItem.jquery` — Abstraction qui fuit

L'interface `OrganizerChartItem` dans `organizer-chart-adapter.ts` expose :

```typescript
jquery?: {
  value: (s?: string) => string;
  buildAlias: (s?: string) => string;
  buildName?: (item: any, value?: string) => string;
  buildColor?: (value?: string) => string;
};
```

C'est la structure interne de `kpi.config.ts` (spécifique à `inspect-app`). La lib connaît trop de détails du modèle métier de l'application consommatrice.

**Impact** : tout développeur intégrant `jquery-organizer` dans un autre projet devra adapter son modèle à ce contrat, même s'il n'a pas de concept `jquery`.

**Recommandation** : remplacer par une interface générique à 2 champs obligatoires :

```typescript
export interface OrganizerChartItemQuery {
  /** Nom du champ API tel qu'utilisé dans la requête (ex: 'status', 'date') */
  fieldName: string;
  /** Alias du champ dans la réponse API (ex: 'status', 'count') */
  fieldAlias: string;
}
```

Le bridge crée les synthétiques avec `fieldName`/`fieldAlias` uniquement. L'app mappera vers ses propres structures.

---

### 3.2 `groups` ambigu dans `OrganizerConfig`

```typescript
// En mode table : GroupBy options (colonnes groupables)
// En mode chart : pool X + stacks (fusionné)
groups?: OrganizerViewGroup[];
```

Le même champ porte deux sémantiques différentes selon le contexte. Le composant HTML fait la même chose dans les deux cas (un sous-menu de sélection unique avec toggle), mais les conséquences métier sont totalement différentes.

**Recommandation** : garder `groups` pour "Grouper par" et ajouter un champ `xFields` séparé pour les dimensions X. Ce qui est déjà le cas dans l'interface mais pas dans l'adapter (qui assigne le même tableau aux deux).

---

### 3.3 Typage strict : `ChartConfig | undefined`

Dans `rest.component.ts`, `$statusRepartition.chartConfig` est typé `ChartConfig | undefined` (via `Partial<{...}>`). Les appels vers `chartConfigToOrganizer()` et `applyOrganizerEventToChart()` génèrent des erreurs TypeScript car ces fonctions attendent un type non-nullable.

Le code runtime fonctionne car `chartConfig` est toujours initialisé avant les appels, mais c'est fragile.

**Recommandation** : `applyOrganizerEventToChart` et `chartConfigToOrganizer` devraient accepter `OrganizerChartConfig | null | undefined` avec un guard en entrée :

```typescript
export function applyOrganizerEventToChart(
  event: OrganizerButtonEvent,
  chartConfig: OrganizerChartConfig | null | undefined
): void {
  if (!chartConfig) return;
  // ...
}
```

---

### 3.4 Nommage incohérent des interfaces

| Interface | Préfixe | Usage |
|---|---|---|
| `OrganizerViewField` | View | Champ table |
| `OrganizerXField` | (rien) | Champ chart X |
| `OrganizerViewGroup` | View | GroupBy |
| `OrganizerViewSlice` | View | Filtre |
| `OrganizerChartItem` | Chart | Item interne adapter |

Pas de convention uniforme. Propositions :

```typescript
// Convention : OrganizerField<Context><Type>
OrganizerTableField      // ex-OrganizerViewField
OrganizerChartAxisField  // ex-OrganizerXField
OrganizerGroupField      // ex-OrganizerViewGroup
OrganizerSliceField      // ex-OrganizerViewSlice
```

---

## 4. Fonctionnalités manquantes ou incomplètes

### 4.1 Reset non implémenté

`showReset: true` est configurable dans `OrganizerConfig` et `OrganizerButtonEvent` porte un type `'reset'`, mais aucun bouton "Réinitialiser" n'est rendu dans le HTML du composant.

---

### 4.2 Déselection de l'axe X impossible

En mode chart, le GroupBy se désélectionne au second clic (toggle implémenté). L'axe X en revanche ne peut pas être désélectionné — une fois choisi, l'utilisateur ne peut que le remplacer.

**Recommandation** : même comportement toggle pour X :

```typescript
onXFieldSelect(fieldId: string): void {
  const current = this.state.selectedX;
  this.emitChange('xSelected', { selectedX: current === fieldId ? undefined : fieldId });
}
```

---

### 4.3 `onFetchFieldData` non branché

L'interface déclare `onFetchFieldData?: (fieldId: string) => Promise<...>` pour le lazy-loading des valeurs de champs. Le callback existe dans la config mais aucun appel n'est effectué dans le composant. La propriété `state?: FieldState` sur `OrganizerViewField` existe également sans implémentation UI (aucune icône loading/error n'est affichée).

---

### 4.4 X axis : pas de rebuild des options GroupBy après changement

Quand l'utilisateur change l'axe X, les options disponibles dans "Grouper par" ne sont pas recalculées. Si X = Statut (un stack utilisé comme X), ce stack ne devrait plus apparaître dans GroupBy. Actuellement, c'est géré côté applicatif par `effectiveGroupBy` mais pas côté UI (le menu affiche toujours l'option).

**Recommandation** : émettre un événement de type `'xSelected'` qui déclenche aussi un rebuild complet de l'OrganizerConfig dans `_rebuildOrganizerConfigs`, comme c'est déjà fait pour `'ySelected'`.

---

### 4.5 `hideMenuValues` non documenté

L'input `hideMenuValues` existe dans le composant (masque les valeurs actives dans le menu principal) mais n'est pas documenté dans l'interface `OrganizerConfig`. Il devrait y avoir `hideMenuValues?: boolean` dans la config.

---

### 4.6 Export non branché sur 3 des 4 charts

Dans `rest.component.ts`, seul le chart "Disponibilité" (`$statusChart`) a ses exports branchés sur `exportImage`/`exportData`. Les 3 autres (performance, volumétry, latency) utilisent encore `console.log(...)`.

---

### 4.7 Pas d'export Excel

L'export CSV est implémenté mais pas Excel. Pour un usage professionnel, l'export `.xlsx` (via `ExcelJS` ou `SheetJS`) est souvent attendu.

---

### 4.8 Templates — Fonctionnalité embryonnaire

L'interface `OrganizerTemplate` existe avec `xField`, `yField`, `yAggregate`, `groupBy` mais :
- Aucun template n'est défini dans les configs inspect-app
- Pas de template de type "réinitialiser à zéro" possible (il faudrait `xField: null`)
- Pas de prévisualisation ou de description dans l'UI

---

## 5. Intégration jquery-table

### 5.1 Ce qui fonctionne bien

- `organizerConfig` getter reconstruit la config à chaque cycle Angular via la facade ✓
- `organizerState` getter reflète les sélections courantes ✓
- `onOrganizerViewChange()` dispatch les événements correctement ✓
- Icons sur les champs, groupBy et slices ✓

### 5.2 Rebuild complet à chaque cycle — Performance

`organizerConfig` est un getter Angular recalculé à chaque cycle de détection de changements. Il crée de nouveaux tableaux (`allCols.map(...)`) et de nouveaux objets à chaque appel. Avec `ChangeDetectionStrategy.Default` (qui est le cas de `table.component.ts`), cela produit des allocations mémoire excessives.

**Recommandation** : mémoïser le résultat ou passer à un champ `_organizerConfig` mis à jour manuellement uniquement quand les colonnes changent.

---

### 5.3 `OrganizerSliceState` — Couplage fort avec `SlicePanel`

La table émet un `OrganizerSliceState` qui contient `sliceConfigs: SliceConfig<any>[]`. Ce type provient du `slice-panel` interne à `jquery-organizer`. Si l'app veut gérer ses propres slices sans slice-panel, elle doit quand même connaître `SliceConfig`.

**Recommandation** : découpler `OrganizerSliceState` de `SliceConfig`. Émettre uniquement les clés sélectionnées et laisser l'app construire ses `SliceConfig`.

---

### 5.4 Rebuild organizer config seulement sur `ySelected`

Dans `rest.component.ts`, le `config` de l'organizer est recalculé uniquement quand `event.type === 'ySelected'`. Mais un changement de X peut aussi rendre certains GroupBy invalides (si le pool change). Ce rebuild incomplet peut laisser des options obsolètes dans le menu.

---

## 6. Intégration jquery-echarts (inspect-app)

### 6.1 `OrganizerChartConfig` trop couplé à `kpi.config.ts`

La structure attendue par `applyOrganizerEventToChart` (notamment `extra.stacks.items[].jquery`) est très spécifique au modèle de `kpi.config.ts`. Un autre projet avec un modèle de données différent devra écrire son propre adapter.

**Piste** : fournir un adapter générique basé sur une interface minimale (`fieldName + fieldAlias`) et laisser l'app définir comment mapper ses types vers cet adapter.

---

### 6.2 ChartComponent — Pas de référence ViewChild generalisée

Pour brancher l'export, il faut déclarer `@ViewChild('statusChart')` dans chaque composant consommateur. Si un chart change de template reference, les exports sont silencieusement cassés.

**Recommandation** : fournir un service ou un callback direct dans `OrganizerChartBridgeOptions` :

```typescript
export interface OrganizerChartBridgeOptions {
  chartRef?: ChartComponent<any, any>; // référence directe au composant chart
  onExportVisual?: () => void;         // override manuel optionnel
  onExportData?: () => void;           // override manuel optionnel
}
```

Si `chartRef` est fourni, `chartConfigToOrganizer` câble automatiquement `onExportVisual = () => chartRef.exportImage()` et `onExportData = () => chartRef.exportData()`.

---

### 6.3 Renderer SVG vs Canvas — Confusion export

Le renderer SVG (défaut) exporte des `.svg`, le renderer canvas des `.png`. L'utilisateur final ne voit que "Visuel" sans savoir quel format il obtiendra. Il faudrait afficher dynamiquement le format : `Visuel (SVG)` vs `Visuel (PNG)`.

---

### 6.4 Export CSV — Colonnes brutes, pas de mapping métier

L'export CSV via `ChartDirective.exportData()` exporte les données brutes (clés API comme `date`, `count`, `status`). L'utilisateur final verra des noms techniques, pas des libellés métier.

**Recommandation** : ajouter un paramètre `columnLabels?: Record<string, string>` optionnel à `exportData()` :

```typescript
directive.exportData('chart', ';', {
  date: 'Date',
  count: "Nombre d'Appels",
  status: 'Code Statut'
});
```

---

## 7. Feuille de route — Chart ↔ Table switching

C'est le sujet le plus stratégique du projet. Voici la vision et les étapes recommandées.

### 7.1 Concept "Vue unifiée"

Un même jeu de données, deux représentations :

```
┌─────────────────────────────────────────┐
│  [⚙]  Organizer                         │
│   Indicateur: Nombre d'Appel            │
│   Axe X / Grouper: Date                 │
│   Grouper par: Statut                   │
│  [📊 Chart] [📋 Table]  ← switch        │
└─────────────────────────────────────────┘
```

### 7.2 Modèle d'état unifié

Créer un `UnifiedViewState` qui est valide pour les deux modes :

```typescript
export interface UnifiedViewState {
  viewMode: 'chart' | 'table';

  // Dimensions (colonnes en table, X en chart)
  dimensions: string[];       // clés des colonnes/axes actifs
  primaryDimension: string;   // axe X en chart = colonne de tri en table

  // Métriques (colonnes numériques en table, Y en chart)
  metric: string;
  metricAggregate?: string;

  // Décomposition (groupBy en table = stacking en chart)
  breakdown?: string;

  // Filtres
  filters: string[];
}
```

### 7.3 Mapping Chart → Table

| Concept chart | Concept table |
|---|---|
| Axe X (`selectedX`) | Colonne de regroupement / tri |
| Indicateur Y (`selectedY`) | Colonne métrique visible |
| GroupBy / Stack (`selectedGroupBy`) | `groupBy` de la table |
| Slices | Filtres actifs |

### 7.4 Modifications nécessaires dans `OrganizerConfig`

```typescript
export interface OrganizerConfig {
  // ... existant ...

  /** Active le bouton de bascule chart/table */
  switchView?: {
    enabled: boolean;
    currentView: 'chart' | 'table';
    availableViews?: Array<'chart' | 'table'>;
    onSwitch: (newView: 'chart' | 'table') => void;
  };
}
```

Et dans `OrganizerButtonEvent` :

```typescript
type: '...' | 'viewSwitched';
// event.state.viewMode: 'chart' | 'table'
```

### 7.5 `OrganizerState` — Ajout du mode

```typescript
export interface OrganizerState {
  // ... existant ...
  viewMode?: 'chart' | 'table';  // nouveau
}
```

### 7.6 Côté composant consommateur

```typescript
// Un seul OrganizerConfig, deux rendus conditionnels
onViewChange(event: OrganizerButtonEvent): void {
  if (event.type === 'viewSwitched') {
    this.currentView = event.state.viewMode;  // 'chart' | 'table'
    this.cdr.detectChanges();
    return;
  }
  // ... logique existante
}
```

```html
<!-- Template unique avec bascule -->
<chart *ngIf="currentView === 'chart'" ...></chart>
<jquery-table *ngIf="currentView === 'table'" ...></jquery-table>

<organizer-button
  [config]="$organizer.config"
  [state]="$organizer.state"
  (viewChange)="onViewChange($event)">
</organizer-button>
```

### 7.7 Prérequis avant implémentation

Avant de faire le switch chart/table, il faut :

1. **Résoudre l'ambiguïté `groups`** — clarifier que `groups` = GroupBy pour les deux modes
2. **Introduire `viewMode` dans `OrganizerState`**
3. **Unifier les données brutes** — un seul `data: any[]` partagé entre chart et table
4. **Aligner les `ChartConfig` et les colonnes table** — le même `key` sert en chart (X axis) et en table (column key)

---

## 8. Récapitulatif priorisé

### 🔴 Critique (bloquant ou risque de régression)

| # | Action | Fichier(s) |
|---|---|---|
| C1 | Typage strict `OrganizerChartConfig \| null \| undefined` dans l'adapter | `organizer-chart-adapter.ts` |
| C2 | Rebuild organizer config sur `xSelected` en plus de `ySelected` | `rest.component.ts` |
| C3 | Brancher exports sur les 4 charts (pas seulement Disponibilité) | `rest.component.ts` |

### 🟠 Important (dette technique significative)

| # | Action | Fichier(s) |
|---|---|---|
| I1 | Supprimer le dead CSS (variables non alimentées + ancien bloc `.organizer-menu`) | `organizer-button.component.scss` |
| I2 | Remplacer `__synthetic` flag par `WeakSet` | `organizer-chart-adapter.ts` |
| I3 | Décomposer `applyOrganizerEventToChart` (complexité > 15) | `organizer-chart-adapter.ts` |
| I4 | Retirer `jquery` de `OrganizerChartItem` — trop couplé à l'app | `organizer-chart-adapter.ts` |
| I5 | Mémoïser `organizerConfig` getter dans jquery-table | `table.component.ts` |
| I6 | Migrer `::ng-deep` vers `ViewEncapsulation.None` | `organizer-button.component.scss` |

### 🟡 Améliorations (UX ou DX)

| # | Action | Fichier(s) |
|---|---|---|
| A1 | Implémenter le bouton Reset | `organizer-button.component.html/.ts` |
| A2 | Ajouter toggle déselection sur axe X | `organizer-button.component.ts` |
| A3 | Ajouter `columnLabels` à `exportData()` (labels métier en CSV) | `chart.directive.ts` |
| A4 | Afficher le format dans le menu export ("Visuel SVG" vs "Visuel PNG") | `organizer-button.component.html` |
| A5 | Documenter `hideMenuValues` dans `OrganizerConfig` | `organizer-config.interface.ts` |
| A6 | Implémenter `onFetchFieldData` + états loading/error sur `OrganizerViewField` | composant HTML/TS |
| A7 | `chartRef` dans `OrganizerChartBridgeOptions` (auto-câblage export) | `organizer-chart-adapter.ts` |

### 🟢 Stratégique (vision long terme)

| # | Action | Fichier(s) |
|---|---|---|
| S1 | Ajouter `viewMode` dans `OrganizerState` + event `'viewSwitched'` | `organizer-config.interface.ts` |
| S2 | Ajouter `switchView` dans `OrganizerConfig` | `organizer-config.interface.ts` |
| S3 | Unifier `UnifiedViewState` (chart + table même état) | nouveau fichier |
| S4 | Aligner clés `ChartConfig.groups` avec clés colonnes `TableColumnProvider` | `kpi.config.ts` / `rest.component.ts` |
| S5 | Harmoniser nommage des interfaces (`OrganizerTableField`, `OrganizerChartAxisField`…) | `organizer-config.interface.ts` |
| S6 | Export Excel (`.xlsx`) via SheetJS/ExcelJS | `chart.directive.ts` |

---

*Audit rédigé sur la base de l'analyse du code source à la date indiquée. Toute modification majeure de l'architecture devrait être précédée d'une mise à jour de ce document.*
