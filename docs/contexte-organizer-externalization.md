# @oneteme/jquery-organizer — Contexte Technique

Date de mise à jour: 2026-06-22

---

## 1. Pourquoi cette librairie existe

Avant `jquery-organizer`, chaque composant graphique ou tableau gérait lui-même : la liste des indicateurs/groupes/filtres disponibles, l'état courant des sélections, le bouton de configuration, et le cycle de vie du panneau de filtre latéral. Code dupliqué, comportements incohérents, maintenance difficile.

`jquery-organizer` centralise cette logique dans deux composants réutilisables, totalement agnostiques du renderer (ECharts, Highcharts, ApexCharts, tableau HTML). Le parent fournit une configuration déclarative et réagit aux événements.

---

## 2. Architecture et dépendances

```
@oneteme/jquery-organizer
├── OrganizerButtonComponent  (standalone)  — bouton + menu mat-menu
├── OrganizerButtonModule                   — module NgModule
├── SlicePanelComponent       (standalone)  — panneau latéral de filtrage
└── Interfaces
    ├── OrganizerConfig / OrganizerState / OrganizerEvent / OrganizerSliceState
    ├── OrganizerViewField / OrganizerViewGroup / OrganizerViewStack / OrganizerViewSlice
    └── SliceConfig / SliceColumnDef / SliceCategory
```

**Règle d'or** : `jquery-organizer` n'importe **rien** des renderers. La dépendance va toujours dans l'autre sens :

```
jquery-table  ─┐
jquery-echarts ─┤──→ jquery-organizer ──→ jquery-core
jquery-highcharts ─┘                  └──→ @angular/material
```

`SlicePanelComponent` est hébergé dans `jquery-organizer` et **re-exporté** depuis `@oneteme/jquery-table` pour la rétrocompatibilité.

**Peer dependencies** : `@angular/core >= 16.1`, `@angular/material ^16.1`, `@oneteme/jquery-core ^0.0.32`

---

## 3. Contrat des composants

### OrganizerButtonComponent

```typescript
@Input()  config: OrganizerConfig          // configuration du menu
@Input()  state?: OrganizerState           // sélections courantes (pour affichage)
@Output() viewChange: EventEmitter<OrganizerEvent>            // toute interaction menu
@Output() sliceStateChange: EventEmitter<OrganizerSliceState | null>  // fetch filtre
```

### OrganizerConfig (champs clés)

```typescript
interface OrganizerConfig {
  indicators?: OrganizerViewField[];   // ex: Nombre d'appels, Temps moyen
  groups?: OrganizerViewGroup[];       // ex: Par heure, Par jour
  stacks?: OrganizerViewStack[];       // ex: Par statut, Par taille
  slices?: OrganizerViewSlice[];       // ex: Media, Host

  // Gestion automatique du slice-panel :
  // Le composant fetche les données et émet (sliceStateChange) sans code dans le parent
  onFetchSliceData?: (filterKey: string) => Observable<any[]> | Promise<any[]>;

  // Lazy-loading champ à la demande (résultat mis en cache automatiquement)
  onFetchFieldData?: (fieldId: string) => Promise<string[] | Record<string, any>[]>;

  buttonIcon?: string;      // défaut: 'tune'
  showReset?: boolean;      // défaut: true
  // ... export, préférences, positionnement
}
```

### OrganizerState / OrganizerEvent

```typescript
interface OrganizerState {
  selectedIndicator?: string;
  selectedGroup?: string;
  selectedStacks?: string[];
  selectedSlices?: string[];
  visibleFields?: string[];   // usage tableau
}

interface OrganizerEvent {
  type: 'fieldToggled' | 'indicatorSelected' | 'groupSelected'
      | 'stackSelected' | 'sliceSelected' | 'reset';
  state: OrganizerState;   // état complet après l'action
  source?: 'user' | 'api';
}
```

### OrganizerSliceState

```typescript
interface OrganizerSliceState {
  sliceConfigs: SliceConfig<any>[];  // → [sliceConfigs] de slice-panel
  tasks: any[];                       // → [data] de slice-panel
}
// null = filtre désélectionné, masquer le panneau
```

### SlicePanelComponent

```typescript
@Input()  sliceConfigs: SliceConfig<T>[]
@Input()  data: T[]
@Input()  showCounts: boolean          // défaut: true
@Input()  alwaysShow: boolean          // défaut: false
@Input()  collapsedByDefault: boolean  // défaut: false
@Output() filterChange: EventEmitter<(row: T) => boolean>
@Output() collapsedChange: EventEmitter<boolean>
// @HostBinding('class.collapsed') — permet au CSS parent de réduire la largeur
```

---

## 4. Cycle de vie du slice-panel (mode automatique)

1. L'utilisateur clique sur un filtre dans le menu (ex: "Media").
2. `OrganizerButtonComponent` appelle `onFetchSliceData('media')`.
3. L'Observable/Promise est souscrit en interne, avec `takeUntil(destroy$)`.
4. `(sliceStateChange)` émet `{ sliceConfigs, tasks }`.
5. Le parent passe ces données à `<slice-panel>` et relance son fetch de données.
6. Désélection → `(sliceStateChange)` émet `null` → le parent masque le panneau et remet les filtres à vide.

---

## 5. Pattern d'intégration avec un graphique

### Template

```html
<div class="kpi-chart-header">
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
  <chart type="column" [config]="chartProvider" [data]="chartData"></chart>
</div>
```

### CSS (panneau collapsible)

```scss
.chart-with-slice {
  display: flex; flex-direction: row; align-items: stretch;
  chart { flex: 1 1 0; min-width: 0; }
  slice-panel {
    flex: 0 0 260px;
    transition: flex-basis 200ms ease;
    &.collapsed { flex: 0 0 42px; }  // class ajoutée par @HostBinding
  }
}
```

### Composant TypeScript

```typescript
$statusOrganizer: { config: OrganizerConfig; state: OrganizerState };
$statusSlice: OrganizerSliceState | null = null;
$statusFilteredValues: any[] = [];

// Init
this.$statusOrganizer = {
  config: {
    indicators: [...], groups: [...], stacks: [...], slices: [...],
    onFetchSliceData: (key) => this._service.getFilterValues(key, this.params) as Observable<any[]>,
    showReset: false, buttonIcon: 'tune', showButtonIcon: true,
  },
  state: { selectedIndicator: 'count', selectedGroup: 'byDay' }
};

// Réaction à une interaction menu
onStatusViewChange(event: OrganizerEvent): void {
  this._applyOrganizerEvent(event, this.$statusChartConfig);
  this.$statusOrganizer = { config: this.$statusOrganizer.config, state: event.state };
  if (event.type !== 'sliceSelected') { this._fetchStatus(); }
}

// Réception données filtre (automatique via onFetchSliceData)
onStatusSliceChange(s: OrganizerSliceState | null): void {
  this.$statusSlice = s;
  if (!s) this.$statusFilteredValues = [];
  this._fetchStatus();
}

// Sélection d'une catégorie dans le panneau
onStatusFilterChange(filterFn: (row: any) => boolean): void {
  const key = this.$statusSlice?.sliceConfigs[0]?.columnKey;
  this.$statusFilteredValues = this.$statusSlice!.tasks.filter(filterFn).map(t => t[key]);
  this._fetchStatus();
}
```

---

## 6. Intégration jquery-table

`SlicePanelComponent` et ses modèles sont importables indifféremment depuis l'une ou l'autre librairie :

```typescript
import { SlicePanelComponent, SliceConfig } from '@oneteme/jquery-table';   // rétrocompat
import { SlicePanelComponent, SliceConfig } from '@oneteme/jquery-organizer'; // source
```

Pour les tableaux, `OrganizerButtonComponent` peut exposer la visibilité des colonnes via `event.state.visibleFields`.

---

## 7. Décisions structurantes (non révisables)

| Sujet | Décision |
|---|---|
| Dépendance renderer | `jquery-organizer` n'importe jamais un renderer |
| Configuration | 100% via `@Input()`, zéro service injecté, zéro auto-discovery |
| Lazy-loading | `onFetchFieldData` avec cache `Map<fieldId, any[]>` intégré |
| FieldState | `'ready' \| 'loading' \| 'error'` — contrôle l'affichage dans le menu |
| Template | `mat-menu` Angular Material (pas de dropdown custom) |
| Slice lifecycle | `onFetchSliceData` dans config → géré automatiquement par le composant |
| Rétrocompat table | Re-export `SlicePanelComponent` depuis `@oneteme/jquery-table` |


Date de référence: 2026-06-18
**Update post-revue REVUE-CRITIQUE**: Clarification de l'architecture Phase 0-bis
Scope principal: projects/oneteme/jquery-organizer (NEW), projects/oneteme/jquery-core (models), projects/oneteme/jquery-table (future integration)

## 1) Objectif produit

Externaliser la gestion complète du "Organizer Button" (composant UI indépendant):
- Bouton "View" cliquable
- Menu déroulant avec options (Fields, Indicators, Groups, Stacks, Slices)
- Optimisation lazy-loading des requêtes
- Zero dépendance sur renderers (table, chart, KPI, etc.)
- Réutilisable sur tout contexte

Objectif final:
- Développeur peut intégrer jquery-organizer avec n'importe quel contexte (jquery-echarts, KPI, table, etc.)
- Comportement cohérent partout
- Zéro sur-engineering, code simple et performant
- Lazy-loading intelligent pour optimiser API calls

## 2) État actuel et constat (Phase 0-bis.3)

- **Phase 1-4**: Externalisation "View" dans jquery-table COMPLÉTÉE ✅
- **Phase 0-bis.1-2**: Structure projet jquery-organizer créée ✅
- **Phase 0-bis.3**: Component logic COMPLÉTÉE - BUILD SUCCESS ✅ (2026-06-18)
  - OrganizerButtonComponent implémenté (200+ lignes logique métier)
  - Interfaces finalisées: OrganizerConfig, OrganizerState, OrganizerEvent (INDÉPENDANTES de ViewConfig)
  - FieldState enum: 'ready' | 'loading' | 'error' (UI rendering clair)
  - onFetchFieldData callback: Promise<string[] | Record<string, any>[]> typé
  - mat-menu implémenté: bouton + 6 sections (Fields, Indicators, Groups, Stacks, Slices, Reset)
  - Intelligent caching: Map<fieldId, any[]> pour éviter re-fetch
  - Error handling: try/catch avec FieldState='error' display
  - Build: `npm run b5` EXIT 0 en 4.094s
- **Phase 0-bis.4**: Validation et intégration (NEXT)

## 3) Décision d'architecture (NOUVELLE - Phase 0-bis)

### Séparation des responsabilités

- **jquery-core**:
  - Modèles et contrats PURS: ViewConfig, ViewState, ViewField, ViewEvent
  - Zéro dépendance Angular/UI
  - Stable, réutilisable par tous

- **jquery-organizer** (NOUVELLE):
  - UI Component: OrganizerButtonComponent
  - Menu rendering avec Material Design
  - Lazy-loading logic + field data caching
  - Configuration par @Input (pas de services, pas d'auto-discovery)
  - Events-only interface (@Output())
  - Thémage via CSS tokens

- **jquery-table / jquery-echarts / etc** (future):
  - Intègrent jquery-organizer par simple @Component import
  - Passent config + callbacks
  - Écoutent events pour mettre à jour leur état
  - Zéro modification de jquery-organizer

### Justification

- **Décentralisé**: jquery-organizer n'importe RIEN des renderers
- **Explicite**: Configuration par @Input, pas de magic
- **Testable**: Composant isolé, facile à unit-test
- **Performant**: Lazy-loading optimise les requêtes API
- **Maintenable**: Code simple, zéro feature creep

## 4) Contrat fonctionnel

### 4.1 Configuration (@Input)

```typescript
@Input() config: OrganizerConfig = {
  // UI Elements - déclarés directement (pas d'imbrication ViewConfig)
  fields?: OrganizerViewField[];     // Champs visibles/toggleables
  indicators?: OrganizerViewField[]; // Indicateurs sélectionnables
  groups?: OrganizerViewGroup[];     // Groupements
  stacks?: OrganizerViewStack[];     // Stacks/sous-catégories
  slices?: OrganizerViewSlice[];     // Filtres/slices
  
  // Callbacks et options
  onFetchFieldData?: (fieldId) => Promise<string[] | Record<string, any>[]>; // Lazy-load
  onSliceClick?: () => void;        // Slice panel trigger
  showReset?: boolean;              // Feature flag
  menuPosition?: 'above' | 'below'; // Positioning
  menuClass?: string;               // CSS class
  buttonLabel?: string;             // Button text
  buttonIcon?: string;              // Material icon name
  showButtonIcon?: boolean;         // Icon visibility
}
```

**Note**: OrganizerConfig est **INDÉPENDANT** de jquery-core's ViewConfig. Pas d'imbrication, pas de couplage. jquery-organizer expose sa propre structure UI riche.

### 4.2 État (@Input)

```typescript
@Input() state?: OrganizerState;  // État actuel de la sélection

export interface OrganizerState {
  visibleFields?: string[];      // IDs des champs visibles
  selectedIndicator?: string;    // ID indicateur sélectionné
  selectedGroup?: string;        // ID groupe sélectionné
  selectedStacks?: string[];     // IDs stacks sélectionnés
  selectedSlices?: string[];     // IDs slices sélectionnés
}
```

### 4.3 Événements (@Output)

```typescript
@Output() viewChange: EventEmitter<OrganizerEvent> = new EventEmitter();

export interface OrganizerEvent {
  type: 'fieldToggled' | 'indicatorSelected' | 'groupSelected' | 'stackSelected' | 'sliceSelected' | 'reset';
  state: OrganizerState;        // État complet après action
  source?: 'user' | 'api';      // Distinction user-driven vs programmatic
}
```

**Avantage**: Emetteur reçoit l'état complet après chaque action, peut réagir immédiatement sans re-query le composant.

### 4.4 FieldState Enum (NEW post-revue)

```typescript
type FieldState = 'ready' | 'loading' | 'error';

// Clarifies field state in menu:
// - 'ready': Data available, field active/clickable
// - 'loading': Fetch in progress, spinner displayed
// - 'error': Fetch failed, error message displayed
// - undefined: Not fetched yet, field grayed/inert
```

## 5) Lazy-Loading Pattern (Key Innovation)

### Concept

1. **Init**: Requête légère (charger seulement champs visibles par défaut)
2. **Declare**: Config passe TOUS les champs (même non-peuplés)
3. **On-demand**: Au clic utilisateur, fetch données manquantes via callback
4. **Cache**: Une fois fetchées, re-utiliser (pas de re-fetch)

### Exemple (Tableau KPI)

```
Requête initiale: SELECT id, name, email FROM users
↓
OrganizerConfig = {
  fields: [
    { id: 'name', label: 'Name', state: 'ready' },      // déjà peuplé
    { id: 'email', label: 'Email', state: 'ready' },    // déjà peuplé
    { id: 'phone', label: 'Phone', state: undefined },  // pas peuplé
    { id: 'address', label: 'Address', state: undefined } // pas peuplé
  ],
  onFetchFieldData: async (fieldId) => {
    // Fetch données manquantes à la demande
    return await api.get(`/fields/${fieldId}/values`);
  }
}
↓
Utilisateur clique "Phone"
↓
OrganizerButtonComponent détecte state: undefined
↓
Appelle onFetchFieldData('phone')
↓
Affiche spinner, fetch en cours
↓
Données reçues, cache, state: 'ready'
↓
Affichage colonne Phone
```

### Avantage

- **Performance**: API init plus légère, requêtes secondaires à la demande
- **Intelligence**: Composant sait quand il manque des données
- **Contrôle**: Parent décide si fetcher ou pas
- **Scalabilité**: N'importe le nombre de champs optionnels

## 6) Décisions Post-Revue-CRITIQUE (Simplifications)

1. **OrganizerEvent**: Simplifié (juste type, viewState, source) ✅
2. **FieldState Enum**: Introduit pour clarté template ✅
3. **onFetchFieldData**: Renommé de onDataNeeded pour clarté ✅
4. **mat-menu**: Utiliser au lieu de custom dropdown ✅
5. **ViewField**: Garder minimal, pas enrichissement excessif ✅

## 7) Contrats à Ne PAS Modifier

- ViewConfig, ViewState, ViewEvent dans jquery-core: **STABLES**
- OrganizerButtonComponent interface: **STABLE** (config, viewState, viewChange)
- FieldState enum: **STABLE**

## 8) Prochaines Étapes

- **Phase 0-bis.3**: Implémenter buildMenuStructure() avec FieldState support
- **Phase 0-bis.4**: Validation + benchmark (100+ fields scenario)
- **Phase 1**: Integration avec jquery-table via wrapper
- **Phase 2+**: Rollout à autres contextes (echarts, KPI, etc.)
- API backward compatible.
- Defaults explicites et deterministes.

## 5) Plan d'action concret

## Phase 0 - Cadrage et inventaire (court)

1. Cartographier les points View actuels dans jquery-table:
   - bouton
   - panel
   - sources des fields
   - group/slice logic
   - positionnement dynamique
2. Lister les dependances implicites (services, modele, lifecycle).
3. Formaliser les invariants de comportement a ne pas casser.

Livrable: matrice "comportement actuel" + "cible".

## Phase 1 - Stabilisation interne jquery-table

1. Isoler la logique View dans une facade interne (ex: ViewFacade).
2. Garder le rendu existant mais centraliser l'etat et les events.
3. Rebrancher jquery-table sur cette facade.
4. Valider parite fonctionnelle complete (avant/apres).

Livrable: jquery-table inchange visuellement et fonctionnellement, architecture preperee a l'extraction.

## Phase 2 - Extraction du contrat vers jquery-core

1. Introduire les interfaces et helpers purs (ViewConfig/ViewState/ViewField).
2. Deplacer la logique metier genericable dans jquery-core.
3. Garder les adaptateurs renderer-specifiques dans jquery-table.

Livrable: contrat View partage et stable.

## Phase 3 - Mode d'integration unifie

1. Ajouter integration par config:
   - view: { ... }
2. Ajouter integration par HTML:
   - ligne dediee pour activer/monter View
3. Garantir equivalence de comportement entre les deux modes.

Livrable: experience d'integration simple, explicite et reproductible.

## Phase 4 - Generalisation charts

1. Implementer l'adaptateur jquery-highcharts.
2. Implementer l'adaptateur jquery-apexcharts.
3. Mapper ViewState vers categories/series/grouping selon chaque renderer.
4. Verifier coherence avec pivot/toolbar/type switch existants.

Livrable: View reutilisable sur charts sans casser les contrats chart existants.

## Phase 5 - Validation finale et documentation

1. Tests unitaires:
   - contrat et helpers core
   - facade table
   - adaptateurs chart
2. Tests d'integration:
   - non-regression table
   - scenarios chart critiques
3. Documentation usage:
   - activation via config
   - activation via HTML
   - limites et contraintes connues

Livrable: socle maintenable + guide de migration.

## 6) Points d'attention a traiter explicitement

- Positionnement dynamique du bouton View:
  - ancrage, resize, scroll, responsive
- Peuplement des fields:
  - source de verite
  - mapping type-safe
  - synchro avec le dataset
- Recuperation d'informations:
  - API claire pour alimenter View
  - events standardises
- Cycle de vie:
  - initialisation
  - update des donnees
  - reset
  - destruction
- Cas limites:
  - zero data
  - colonnes dynamiques
  - fields non groupables/non sliceables

## 7) Definition of Done (globale)

Le chantier est considere termine si:
1. View complet est activable sans code specifique table cache.
2. jquery-table reste strictement compatible fonctionnellement.
3. jquery-highcharts et jquery-apexcharts consomment le meme contrat View.
4. La configuration View est possible via config ou via HTML.
5. Les tests critiques passent et la documentation est a jour.

## 8) Contexte de reprise pour prochaines conversations

Prompt de reprise recommande:

"On reprend le chantier d'externalisation Organizer.
Utilise docs/contexte-organizer-externalization.md comme reference source.
Objectif courant: [phase/ticket en cours].
Contraintes: backward compatibility jquery-table + contrat partage core + integration config/html + décentralisation complète (zéro dépendance vers renderers)."
