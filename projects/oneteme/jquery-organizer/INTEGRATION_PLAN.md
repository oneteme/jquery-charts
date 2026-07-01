# Plan d'intégration — jquery-organizer v1 Rework

**Date**: 2026-06-29  
**Branch**: jquery-echarts-integration  
**Testeur**: `/kpi-test/request/rest`

---

## Objectif

Remplacer les menus `Indicateur / Grouper par / Stack / Filtrer par` par :
- **Champs** — axe X (single-select) + axe Y (avec agrégats ou stacks selon le champ)
- **Grouper par** — champs catégoriels (non-numériques), définissables par le dev
- **Filtrer par** — inchangé fonctionnellement
- **Template** — configurations prédéfinies par le dev

Objectif secondaire : unifier la logique du bouton entre charts et tables pour simplifier `ViewButtonComponent` dans `jquery-table`.

---

## Fichiers à modifier

| Fichier | Statut |
|---|---|
| `jquery-organizer/src/lib/models/organizer-config.interface.ts` | ⬜ |
| `jquery-organizer/src/lib/models/organizer-menu.model.ts` | ⬜ |
| `jquery-organizer/src/lib/organizer-button/organizer-button.component.ts` | ⬜ |
| `jquery-organizer/src/lib/organizer-button/organizer-button.component.html` | ⬜ |
| `jquery-organizer/src/lib/organizer-button/organizer-button.component.scss` | ⬜ |
| `jquery-organizer/src/public-api.ts` | ⬜ |
| `inspect-app/views/kpi/kpi.config.ts` | ⬜ |
| `inspect-app/views/kpi-test/request/rest/rest.component.ts` | ⬜ |
| `inspect-app/views/kpi-test/request/rest/rest.component.html` | ⬜ |
| `jquery-table/src/lib/component/organizer-button/organizer-button.component.ts` | ⬜ |
| `jquery-table/src/lib/component/table.component.ts` | ⬜ |
| `jquery-table/src/lib/component/table.component.html` | ⬜ |

---

## Étape 1 — Modèles : `organizer-config.interface.ts`

**Statut**: ⬜

### Suppressions
- `OrganizerViewField` (remplacé par `OrganizerXField` + `OrganizerYField`)
- `OrganizerViewStack` (intégré dans `OrganizerYField.stacks`)
- `OrganizerConfig.indicators`
- `OrganizerConfig.stacks`
- `OrganizerState.selectedIndicator`
- `OrganizerState.selectedGroup`
- `OrganizerState.selectedStacks`
- `OrganizerButtonEvent.type` : retirer `indicatorSelected | groupSelected | stackSelected`

### Ajouts

```typescript
export interface OrganizerXField {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface OrganizerYAggregate {
  id: string;    // 'max' | 'min' | 'avg' | 'p50' | 'p90' | 'p95' | ...
  label: string;
}

export interface OrganizerYField {
  id: string;
  label: string;
  aggregates?: OrganizerYAggregate[];  // si défini → sous-menu agrégats
  stacks?: OrganizerViewStack2[];       // si défini → sous-menu stacks (Count → par statut...)
  disabled?: boolean;
}

// Renommé depuis OrganizerViewStack (sans l'interface "View" qui n'apporte rien)
export interface OrganizerStack {
  id: string;
  label: string;
}

export interface OrganizerTemplate {
  id: string;
  label: string;
  icon?: string;
  xField?: string;
  yField?: string;
  yAggregate?: string;
  yStack?: string;
  groupBy?: string;
}
```

### `OrganizerConfig` après
```typescript
export interface OrganizerConfig {
  // Charts : axe X et axe Y
  xFields?: OrganizerXField[];
  yFields?: OrganizerYField[];

  // Tables : toggle visibilité colonnes
  fields?: OrganizerViewField[];   // conservé pour les tables UNIQUEMENT

  // Grouper par (catégoriels)
  groups?: OrganizerViewGroup[];

  // Filtrer par
  slices?: OrganizerViewSlice[];

  // Templates prédéfinis
  templates?: OrganizerTemplate[];

  // callbacks + options inchangés
  onFetchFieldData?: ...
  onFetchSliceData?: ...
  onSliceClick?: ...
  showExport?: boolean;
  onExport?: ...
  showPreferences?: boolean;
  ...
}
```

### `OrganizerState` après
```typescript
export interface OrganizerState {
  visibleFields?: string[];     // tables

  selectedX?: string;
  selectedY?: string;
  selectedYAggregate?: string;
  selectedYStack?: string;
  selectedGroupBy?: string;     // remplace selectedGroup
  selectedSlices?: string[];
  selectedTemplate?: string;
}
```

### `OrganizerButtonEvent` après
```typescript
export interface OrganizerButtonEvent {
  type: 'fieldToggled' | 'xSelected' | 'ySelected' | 'groupBySelected' | 'templateSelected' | 'sliceSelected' | 'reset';
  state: OrganizerState;
  source?: 'user' | 'api';
}
```

---

## Étape 2 — `organizer-menu.model.ts`

**Statut**: ⬜

### Modifications
- `MenuSection` : retirer `'indicators'`, `'stacks'` ; ajouter `'champs'` (X+Y), `'templates'`
- Mettre à jour `DEFAULT_MENU_SECTIONS`, `DEFAULT_MENU_LABELS`, `DEFAULT_MENU_ICONS`

```typescript
export type MenuSection = 'fields' | 'champs' | 'groups' | 'slices' | 'templates' | 'custom';

DEFAULT_MENU_LABELS = {
  fields:    'Champs',         // tables
  champs:    'Champs',         // charts (X + Y)
  groups:    'Grouper par',
  slices:    'Filtrer par',
  templates: 'Template',
  custom:    'Options'
};
```

---

## Étape 3 — `organizer-button.component.ts`

**Statut**: ⬜

### Suppressions
- `onIndicatorSelect()`
- `onStackSelect()`
- `activeIndicatorLabel()`
- `activeStackLabel()`
- `activeGroupLabel()` → remplacer par `activeGroupByLabel()`

### Ajouts
```typescript
onXFieldSelect(fieldId: string): void
onYFieldSelect(fieldId: string): void           // Y simple (Count sans stack/agrégat)
onYAggregateSelect(yFieldId: string, aggId: string): void
onYStackSelect(yFieldId: string, stackId: string): void
onGroupBySelect(groupId: string): void          // renommé (même logique)
onTemplateSelect(templateId: string): void      // applique xField+yField+groupBy

// Helpers label résumé
activeXLabel(): string
activeYLabel(): string     // inclut agrégat ou stack si sélectionné
activeGroupByLabel(): string
activeTemplateLabel(): string

// Détection mode
hasChartFields(): boolean  // config.xFields?.length > 0
hasTableFields(): boolean  // config.fields?.length > 0 && !hasChartFields()
```

---

## Étape 4 — `organizer-button.component.html`

**Statut**: ⬜

### Structure cible

```
mat-menu principal
  ├── [si xFields || yFields]   "Champs"      → champsSubMenu
  ├── [si fields (tables)]      "Champs"      → fieldsSubMenu (existant)
  ├── [si groups]               "Grouper par" → groupsSubMenu
  ├── [si slices]               "Filtrer par" → slicesSubMenu
  └── [si templates]            "Template"    → templateSubMenu

champsSubMenu (stop propagation → menu reste ouvert)
  └── div.organizer-champs-wrapper
      ├── div.organizer-champs-block
      │   ├── span.organizer-champs-block-title  "X"
      │   └── items xFields (single-select, radio-like)
      ├── mat-divider
      └── div.organizer-champs-block
          ├── span.organizer-champs-block-title  "Y"
          └── items yFields
              ├── si !aggregates && !stacks → bouton simple (onYFieldSelect)
              ├── si aggregates → bouton + [matMenuTriggerFor]="yAggSubMenu" [matMenuTriggerData]="{yField}"
              └── si stacks     → bouton + [matMenuTriggerFor]="yStackSubMenu" [matMenuTriggerData]="{yField}"

yAggSubMenu (matMenuContent: let-data)
  └── items data.yField.aggregates → onYAggregateSelect(data.yField.id, agg.id)

yStackSubMenu (matMenuContent: let-data)
  └── items data.yField.stacks → onYStackSelect(data.yField.id, stack.id)

templateSubMenu
  └── items templates → onTemplateSelect(template.id), icône optionnelle
```

---

## Étape 5 — `organizer-button.component.scss`

**Statut**: ⬜

Nouveaux styles :
- `.organizer-champs-panel` : largeur min 240px, padding 8px
- `.organizer-champs-wrapper` : display flex, flex-direction column, gap 4px
- `.organizer-champs-block` : display flex, flex-direction column
- `.organizer-champs-block-title` : font-weight 600, font-size 11px, color token, padding 4px 8px, text-transform uppercase

---

## Étape 6 — Build `jquery-organizer`

**Statut**: ⬜

```
cd jquery-charts
npm run b5
```
Objectif : 0 erreurs TypeScript, 0 warnings cassants.

---

## Étape 7 — `kpi.config.ts` (inspect-app)

**Statut**: ⬜

Mapping depuis `ChartConfig` vers `OrganizerConfig` avec nouveaux types :

| Ancienne source | Nouveau champ |
|---|---|
| `groups.items` | `xFields` |
| `indicators.items` | `yFields` (avec stacks/aggregates) |
| `filters.items` | `slices` |
| (absent) | `templates` (à créer par chart) |

Ajouter export des fonctions `toOrganizerConfig`, `toOrganizerState`, `applyOrganizerEvent` dans `kpi.config.ts` (ou fichier dédié) pour éviter la duplication si d'autres composants en ont besoin.

---

## Étape 8 — `rest.component.ts` (inspect-app)

**Statut**: ⬜

Remplacer les 3 fonctions bridge locales par la version mise à jour :

```typescript
// AVANT                              APRÈS
toOrganizerConfig(...)             → xFields/yFields/slices/templates
toOrganizerState(...)              → selectedX/selectedY/selectedYStack/.../
applyOrganizerEvent(...)           → xSelected/ySelected/groupBySelected/templateSelected
```

Mettre à jour les event handlers :
- `onStatusViewChange` : gérer `xSelected`, `ySelected`, `groupBySelected`, `templateSelected`
- idem pour `onPerformanceViewChange`, `onVolumetryViewChange`, `onLatencyViewChange`

---

## Étape 9 — `rest.component.html` (inspect-app)

**Statut**: ⬜

- Breadcrumb header : utiliser `selectedX` / `selectedY` / `selectedYAggregate` / `selectedYStack` à la place de `activeIndicatorLabel` / `activeStackLabel`
- Aucun changement de structure nécessaire côté `<organizer-button>` (les inputs/outputs restent les mêmes)

---

## Étape 10 — `jquery-table` wrapper

**Statut**: ⬜

- `table.component.ts` : construire `OrganizerConfig` avec `fields` + `groups` + `slices` (pas de `xFields`/`yFields`)
- `table.component.html` : vérifier que `<table-organizer-button>` (ou `<organizer-button>` direct) fonctionne
- `OrganizerButtonWrapperComponent` : passthrough pur, aucun changement nécessaire
- `OrganizerButtonEvent` types : mettre à jour les handlers dans `table.component.ts` pour les nouveaux event types

---

## Étape 11 — Validation finale

**Statut**: ⬜

- [ ] Build jquery-organizer : 0 erreurs
- [ ] Build jquery-table : 0 erreurs
- [ ] `/kpi-test/request/rest` : 4 menus présents (Champs / Grouper par / Filtrer par / Template)
- [ ] Champs/X : single-select, menu reste ouvert
- [ ] Champs/Y Count : sélection directe
- [ ] Champs/Y avec stacks (ex: par statut / par tranche) : sous-menu s'ouvre
- [ ] Champs/Y avec agrégats (ex: Durée P50/Max/Min) : sous-menu s'ouvre
- [ ] Grouper par : fonctionne (champs catégoriels uniquement)
- [ ] Filtrer par : fonctionne (slice-panel s'affiche)
- [ ] Template : sélection applique X + Y + groupBy en une action
- [ ] Table dans inspect-app : aucune régression

---

## Notes et décisions

- **Pas de deprecated** : suppression nette de `indicators`, `stacks`, `selectedIndicator`, `selectedGroup`, `selectedStacks` et handlers associés.
- **Mode détection** : `xFields` → mode chart ; `fields` → mode table. Un même config peut avoir les deux uniquement si le contexte l'exige (peu probable).
- **Menu reste ouvert** pour "Champs" : `stopPropagation` déjà appliqué dans tous les sous-menus, pattern conservé.
- **`matMenuTriggerData`** : nécessaire pour passer `yField` aux sous-menus agrégats/stacks dynamiques. Pattern Angular Material supporté via `[matMenuTriggerData]` + `ng-template matMenuContent let-data`.
- **`OrganizerViewField`** : conservé uniquement pour le mode table (`fields`). Renommage en `OrganizerTableField` possible en v2.
- **`OrganizerViewGroup` / `OrganizerViewSlice`** : conservés tels quels, sémantiquement corrects.
