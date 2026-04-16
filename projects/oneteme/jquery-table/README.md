# @oneteme/jquery-table

Bibliothèque Angular qui encapsule Angular Material Table avec une API orientée configuration runtime.

## Features

- Configuration déclarative du tableau via `TableProvider`
- Colonnes optionnelles ajoutables/supprimables à l'exécution via menu View
- Réordonnancement des colonnes par glisser-déposer
- Tri natif Material par colonne
- Recherche textuelle temps réel
- Pagination standard et pagination par groupe
- **Group by** : regroupement des lignes par colonne, groupes pliables/dépliables, pagination indépendante par groupe
- **Slice panel** : filtres catégoriels latéraux, statiques (prédéfinis) ou dynamiques (colonne  valeurs uniques), multi-sélection configurable
- **Chargement paresseux** (lazy) de cellules via Observable par colonne
- Rendus de cellule personnalisés via directive `jqtCellDef`
- État de chargement (`isLoading`) et état vide configurable
- Événement de clic sur ligne (`rowSelected`)
- CSS variables pour la personnalisation visuelle complète
- Compatible mode allégé : `[dataSource]` + `[displayedColumns]` sans `config`
- Intégration `@oneteme/jquery-core` (`DataProvider`)

## Installation

```bash
npm install @oneteme/jquery-core @oneteme/jquery-table @angular/material @angular/cdk
```

---

## Utilisation rapide

```ts
import { TableComponent, TableProvider, col } from '@oneteme/jquery-table';

interface Row {
  id: number;
  name: string;
  status: 'active' | 'inactive';
  team: string;
}

@Component({
  imports: [TableComponent],
  template: `<jquery-table [config]="table" [data]="rows" (rowSelected)="onRow($event)"></jquery-table>`,
})
export class DemoComponent {
  rows: Row[] = [];

  table: TableProvider<Row> = {
    title: 'Utilisateurs',
    columns: [
      col('id',     'ID'),
      col('name',   'Nom',    { sortable: true }),
      col('status', 'Statut', { sliceable: true }),
      col('team',   'Équipe', { groupable: true, optional: true }),
    ],
    slices: [
      {
        title: 'Statut',
        columnKey: 'status',
        categories: [
          { key: 'active',   label: 'Actif',   filter: r => r.status === 'active' },
          { key: 'inactive', label: 'Inactif', filter: r => r.status === 'inactive' },
        ],
      },
    ],
    search:     { enabled: true },
    pagination: { enabled: true, pageSize: 20 },
    view:       { enabled: true, enableColumnDragDrop: true },
    export:     { enabled: true, filename: 'utilisateurs' },
  };

  onRow(row: Row) { console.log(row); }
}
```

---

## Mode allégé  compatibilité `dataSource` / `displayedColumns`

Pour une migration minimale depuis une `mat-table` existante :

```html
<jquery-table
  [dataSource]="rows"
  [displayedColumns]="['id', 'name', 'status']"
  [columnLabels]="{ id: 'ID', name: 'Nom', status: 'Statut' }"
  [isLoading]="loading"
></jquery-table>
```

Le `config` complet reste disponible pour activer les fonctionnalités avancées.

---

## API  `TableComponent`

### Inputs

| Propriété | Type | Description |
|-----------|------|-------------|
| `config` | `TableProvider<T>` | Configuration principale (colonnes, données, comportements) |
| `data` | `T[]` | Données en entrée directe (remplace `config.data`) |
| `dataSource` | `T[] \| { data: T[] }` | Alias compatibilité Material |
| `displayedColumns` | `string[]` | Alias compatibilité Material  clés de colonnes à afficher |
| `columnsConfig` | `TableColumnProvider<T>[]` | Configuration des colonnes (remplace `config.columns`) |
| `columnLabels` | `Record<string, string>` | Labels des colonnes pour le mode allégé |
| `isLoading` | `boolean` | Affiche l'état de chargement (défaut : `false`) |
| `view` | `TableViewConfig` | Surcharge `config.view` si défini (mode HTML) |

### Outputs

| Événement | Payload | Description |
|-----------|---------|-------------|
| `rowSelected` | `T` | Ligne cliquée |
| `columnAdded` | `TableColumnProvider<T>` | Colonne ajoutée aux colonnes actives |
| `columnRemoved` | `TableColumnProvider<T>` | Colonne retirée des colonnes actives |
| `categorySelected` | `string` | Catégorie de slice sélectionnée |
| `addRequested` | `void` | Clic sur le bouton d'ajout de colonne |

---

## API — `TableProvider<T>`

```ts
interface TableProvider<T = any> {
  columns?:      TableColumnProvider<T>[];
  title?:        string;

  slices?:            SliceConfig<T>[];    // Filtres catégoriels (slice panel)
  enableSliceToggle?: boolean;             // Défaut : true

  search?:       TableSearchConfig;
  pagination?:   TablePaginationConfig;
  view?:         TableViewConfig;
  labels?:       TableLabelsConfig;
  export?:       TableExportConfig<T>;

  defaultSort?:   { active: string; direction: 'asc' | 'desc' };
  rowClass?:      (row: T, index: number) => string | string[] | Record<string, boolean>;
}
```

> **Note** : les données (`data`) et l’état de chargement (`isLoading`) sont des `@Input` séparés
> sur le composant, pas des champs de `TableProvider`.

---

## API — `TableColumnProvider<T>`

```ts
interface TableColumnProvider<T = any> {
  key:        string;
  header?:    string;                  // Label de l'entête
  icon?:      string;                  // Icône Material (affiché dans l'entête)
  value?:     DataProvider<any>;       // (row, index) => valeur affichée
  sortValue?: DataProvider<any>;       // Valeur pour le tri si différente de value
  sortable?:  boolean;
  width?:     string;                  // Largeur CSS en px uniquement pour le calcul min-width (ex: '120px')
                                       // Les unités %, em, rem sont ignorées dans le calcul de tableMinWidth

  optional?:  boolean;                 // Colonne masquée par défaut, ajoutables via View menu
  removable?: boolean;                 // Peut être retirée manuellement

  groupable?: boolean;                 // Disponible comme critère de regroupement dans View menu
  sliceable?: boolean;                 // Disponible comme slice dynamique dans View menu
  searchValue?: DataProvider<string>;  // Valeur utilisée par la recherche texte (si différente de value)

  lazy?: {
    fetchFn: () => Observable<any[]>;  // Retourne un tableau dans le même ordre que les lignes
  };
}
```

---

## Helper `col()`

Raccourci pour déclarer une colonne sans verbosité :

```ts
import { col } from '@oneteme/jquery-table';

columns: [
  col('name',   'Nom'),
  col('status', 'Statut', { sortable: false, groupable: true }),
  col('team',   'Équipe', { optional: true }),
]
```

---

## API — Sous-configurations

### `TableSearchConfig`

```ts
interface TableSearchConfig {
  enabled?:       boolean;
  initialQuery?:  string;     // Terme de recherche pré-rempli au chargement
  searchColumns?: string[];   // Restreint la recherche à ces clés de colonnes
}
```

### `TablePaginationConfig`

```ts
interface TablePaginationConfig {
  enabled?:                boolean;
  pageSize?:               number;
  pageSizeOptions?:        number[];
  pageSizeOptionsGroupBy?: number[];   // Options spécifiques au mode Group by
}
```

### `TableViewConfig`

```ts
interface TableViewConfig {
  enabled?:              boolean;   // Défaut : false  active le bouton View
  enableColumnRemoval?:  boolean;   // Défaut : true   autorise la suppression de colonnes
  enableColumnDragDrop?: boolean;   // Défaut : false  active le réordonnancement drag & drop
}
```

### `TableLabelsConfig`

```ts
interface TableLabelsConfig {
  empty?:   string;   // Défaut : 'Aucune donnée' (ou la valeur i18n injectée)
  loading?: string;   // Défaut : 'Chargement des données...' (ou la valeur i18n injectée)
}
```

### `TableExportConfig<T>`

```ts
interface TableExportConfig<T = any> {
  enabled?:   boolean;                             // Affiche le bouton Export
  filename?:  string;                              // Nom du fichier sans extension (défaut : 'export')
  transform?: (row: T) => Record<string, string>;  // Transforme chaque ligne avant export
}
```

L’export ne porte que sur les **données filtrées** (slice + recherche) et les **colonnes visibles**.
Le fichier est généré avec un BOM UTF-8 pour une compatibilité Excel correcte.

---

## i18n

Tous les labels de l’interface sont personnalisables via un `InjectionToken` :

```ts
import { JQT_I18N } from '@oneteme/jquery-table';

// Dans AppModule ou un provider racine
providers: [
  {
    provide: JQT_I18N,
    useValue: {
      searchPlaceholder: 'Search…',
      emptyState:        'No data',
      loadingState:      'Loading…',
      viewNoneSelected:  'None',
      groupRemove:       'Remove grouping',
      exportButtonLabel: 'Export',
    },
  },
]
```

Seuls les champs fournis écrasent les défauts français. Voir `JqtI18n` pour la liste complète (24 labels).

---

## Fonctionnalité — Group by

Le regroupement s'active en ajoutant `groupable: true` sur une ou plusieurs colonnes. L'utilisateur choisit ensuite la colonne de regroupement depuis le menu View.

```ts
columns: [
  { key: 'team',   header: 'Équipe',  groupable: true },
  { key: 'status', header: 'Statut',  groupable: true },
  { key: 'name',   header: 'Nom' },
],
view:       { enabled: true },
pagination: {
  enabled: true,
  pageSizeOptionsGroupBy: [5, 10, 25],
},
```

Comportements inclus :
- Groupes pliables/dépliables individuellement
- Pagination indépendante par groupe
- Tri des entêtes de groupe (asc / desc)
- Scroll automatique vers l'entête du groupe actif

---

## Fonctionnalité — Slice panel

Le slice panel est un panneau latéral de filtres catégoriels.

### Slices statiques (catégories prédéfinies)

```ts
slices: [
  {
    title:     'Statut',
    icon:      'circle',
    columnKey: 'status',
    categories: [
      { key: 'active',   label: 'Actif',   filter: r => r.status === 'active' },
      { key: 'inactive', label: 'Inactif', filter: r => r.status === 'inactive' },
    ],
  },
  {
    title:       'Priorité',
    columnKey:   'priority',
    multiSelect: true,
    bucket:      r => r.priority,   // Auto-génère les catégories depuis les valeurs uniques
  },
],
```

### Slices dynamiques (depuis le menu View)

Une colonne avec `sliceable: true` peut être ajoutée dynamiquement comme slice depuis le menu View.

```ts
columns: [
  { key: 'team', header: 'Équipe', sliceable: true },
],
view: { enabled: true },
```

### `SliceConfig<T>`

```ts
interface SliceConfig<T = any> {
  title?:       string;
  icon?:        string;
  columnKey?:   string;
  multiSelect?: boolean;                     // Défaut : false
  hidden?:      boolean;                     // Masqué par défaut dans le panel
  categories?:  SliceCategory<T>[];
  bucket?:      (row: T) => string;          // Auto-génère les catégories (ignoré si categories défini)
}

interface SliceCategory<T = any> {
  key:    string;
  label:  string;
  filter: (row: T) => boolean;
}
```

---

## Fonctionnalité — lazy columns

```ts
columns: [
  {
    key:    'details',
    header: 'Détails',
    lazy: {
      fetchFn: () => this.api.getDetails(),
    },
  },
],
```

Le composant gère l'état `idle | loading | loaded | error` par colonne, avec possibilité de relancer la requête en cas d'erreur.

---

## Fonctionnalité — Cellules personnalisées (`jqtCellDef`)

```html
<jquery-table [config]="table">

  <ng-template jqtCellDef="status" let-row>
    <span [class]="'badge badge-' + row.status">{{ row.status }}</span>
  </ng-template>

  <ng-template jqtCellDef="actions" let-row let-index="index">
    <button (click)="edit(row)">Éditer</button>
  </ng-template>

</jquery-table>
```

Contexte du template :
- `$implicit`  la ligne brute (`T`)
- `index`  index global de la ligne

---

## Fonctionnalité — Clic sur ligne

```html
<jquery-table [config]="table" (rowSelected)="onRow($event)"></jquery-table>
```

La ligne brute `T` est émise via l'Output `(rowSelected)`. Pour appliquer une classe conditionnelle aux lignes, utiliser `rowClass` dans `config` :

```ts
config: TableProvider<Row> = {
  rowClass: (row) => row.status === 'error' ? 'row-error' : '',
};
```

---

## Usage standalone — `SlicePanelComponent`

`SlicePanelComponent` est exporté et utilisable indépendamment du tableau, par exemple pour filtrer les données d'un graphique :

```html
<jqt-slice-panel
  [sliceConfigs]="slices"
  [columns]="columns"
  [data]="rows"
  [showCounts]="true"
  (filterChange)="applyFilter($event)"
></jqt-slice-panel>
```

### Inputs `SlicePanelComponent`

| Propriété | Type | Description |
|-----------|------|-------------|
| `sliceConfigs` | `SliceConfig<T>[]` | Configurations des slices |
| `columns` | `SliceColumnDef<T>[]` | Définitions des colonnes pour la résolution des valeurs |
| `data` | `T[]` | Données source |
| `lazyData` | `Map<string, Map<any,any>>` | Valeurs lazy chargées |
| `lazyStatus` | `Map<string, 'idle'\|'loading'\|'loaded'\|'error'>` | État par colonne lazy |
| `showToggle` | `boolean` | Affiche le bouton collapse du panel (défaut : `true`) |
| `showCounts` | `boolean` | Affiche le nombre de lignes par catégorie (défaut : `true`) |
| `collapsedByDefault` | `boolean` | Les slices démarrent repliés (défaut : `false`) |
| `alwaysShow` | `boolean` | Affiche le panel même si vide (défaut : `false`) |

### Outputs `SlicePanelComponent`

| Événement | Payload | Description |
|-----------|---------|-------------|
| `filterChange` | `(row: T) => boolean` | Prédicat de filtre à appliquer |
| `activeKeysChange` | `string[][]` | Clés actives par slice |
| `dynamicSliceKeysChange` | `string[]` | Clés des slices dynamiques actives |
| `collapsedChange` | `boolean` | État replié/déplié du panel |

---

## Personnalisation visuelle — CSS variables

```scss
jquery-table {
  /* Texte */
  --jqt-title-color:       #1f2937;
  --jqt-text-color:        #111827;
  --jqt-text-secondary:    #6b7280;
  --jqt-text-muted:        #9ca3af;

  /* Surfaces */
  --jqt-surface-color:     #ffffff;
  --jqt-surface-alt-color: #f9fafb;
  --jqt-row-hover-bg:      #f3f4f6;

  /* Bordures */
  --jqt-border-color:      #e5e7eb;

  /* Group by */
  --jqt-group-bg:          #eef2f7;
  --jqt-group-bg-hover:    #e4ecf4;
  --jqt-group-accent:      #94a3b8;
  --jqt-group-border:      #d1d9e4;

  /* Accent & danger */
  --jqt-primary-color:     #1d4ed8;
  --jqt-danger-color:      #dc2626;
}
```

---

## Utilitaires exportés

```ts
import { normalizeCellValue, humanizeKey, getFrenchPaginatorIntl } from '@oneteme/jquery-table';
```

| Fonction | Description |
|----------|-------------|
| `normalizeCellValue(value)` | Convertit n'importe quelle valeur de cellule en string affichable (gère `null`, `Date`, `Array`, objet `{label}` / `{name}`) |
| `humanizeKey(key)` | Transforme `camelCase` / `snake_case` en label lisible (`createdAt` → `"Created at"`) |
| `col(key, header, overrides?)` | Raccourci pour créer un `TableColumnProvider` en une ligne |
| `getFrenchPaginatorIntl()` | Retourne un `MatPaginatorIntl` avec les labels en français |

> **`normalizeCellValue`** utilise la locale navigateur (et non fr-FR) pour les dates.

---

## Build

```bash
ng build @oneteme/jquery-table
```

## Publishing

```bash
cd dist/oneteme/jquery-table
npm publish
```
