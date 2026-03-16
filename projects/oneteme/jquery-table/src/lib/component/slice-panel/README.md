# `<slice-panel>`

Panneau de filtrage par catégories, standalone Angular. Utilisable avec n'importe quelle collection de données : **table, graphique, liste…**

---

## Intégration

```typescript
import { SlicePanelComponent } from '@oneteme/jquery-table';
```

```html
<slice-panel
  [sliceConfigs]="slices"
  [data]="rows"
  (filterChange)="onFilter($event)"
/>
```

---

## Inputs

| Input | Type | Défaut | Description |
|---|---|---|---|
| `sliceConfigs` | `SliceConfig<T>[]` | `[]` | Définition des slices. Peut auto-générer les catégories via `columnKey`. |
| `data` | `T[]` | `[]` | Données source. Sert aux catégories auto et aux compteurs. |
| `columns` | `TableColumnProvider<T>[]` | `[]` | **Optionnel.** Requis uniquement pour le mode lazy ou les slices dynamiques (fonctionnalités table). Dans un contexte graphique, ne pas le passer. |
| `lazyData` | `Map<string, Map<any, any>>` | `new Map()` | Données lazy par colonne puis par ligne. Toujours passer une **nouvelle instance**. |
| `lazyStatus` | `Map<string, 'idle'\|'loading'\|'loaded'\|'error'>` | `new Map()` | Statut de chargement par colonne. Toujours passer une **nouvelle instance**. |
| `showToggle` | `boolean` | `true` | Affiche le bouton collapse du panneau. |
| `showCounts` | `boolean` | `true` | Affiche le compteur sur chaque catégorie. Mettre à `false` pour les graphiques. |
| `collapsedByDefault` | `boolean` | `false` | Panneau replié à l'ouverture. |
| `alwaysShow` | `boolean` | `false` | Affiche le panneau même si `data` est vide. |

---

## Outputs

| Output | Type | Description |
|---|---|---|
| `filterChange` | `(row: T) => boolean` | Prédicat combiné. AND entre les slices, OR au sein d'une slice. Pour les tables. |
| `activeKeysChange` | `string[][]` | Clés actives par slice (index 0 = première slice). Pour les graphiques. |
| `dynamicSliceKeysChange` | `string[]` | `columnKey` des slices dynamiques dans l'ordre. |

---

## Interfaces

```typescript
interface SliceConfig<T = any> {
  title?: string;
  multiSelect?: boolean;   // true par défaut — false = sélection exclusive
  columnKey?: string;      // auto-génère les catégories depuis les valeurs distinctes
  categories?: SliceCategory<T>[];
}

interface SliceCategory<T = any> {
  key: string;
  label: string;
  filter: (row: T) => boolean;
}

interface TableColumnProvider<T = any> {
  key: string;
  header?: string;
  lazy?: boolean;
  fetchFn?: () => Observable<any[]>;
}
```

> `TableCategorySliceProvider`, `TableCategoryProvider` et `TableColumnProvider` sont des alias de ces interfaces — aucune rétrocompatibilité cassée.

---

## Exemple — Table

```typescript
slices: SliceConfig<Order>[] = [
  { title: 'Statut', columnKey: 'status' },
  {
    title: 'Montant', multiSelect: false,
    categories: [
      { key: 'low',  label: '< 100 €',  filter: r => r.amount < 100 },
      { key: 'high', label: '≥ 100 €',  filter: r => r.amount >= 100 },
    ],
  },
];

onFilter(pred: (row: Order) => boolean) {
  this.displayed = this.all.filter(pred);
}
```

```html
<slice-panel [sliceConfigs]="slices" [data]="all" (filterChange)="onFilter($event)" />
```

---

## Exemple — Graphique

Pas de prédicat nécessaire : utiliser `activeKeysChange` pour obtenir les catégories sélectionnées.

```typescript
slices: SliceConfig[] = [
  { title: 'Région', categories: [
    { key: 'nord', label: 'Nord', filter: () => true },
    { key: 'sud',  label: 'Sud',  filter: () => true },
  ]},
];

onActiveKeys(keys: string[][]) {
  const selectedRegions = keys[0]; // ex: ['nord', 'sud']
  this.refreshChart(selectedRegions);
}
```

```html
<slice-panel
  [sliceConfigs]="slices"
  [showCounts]="false"
  [alwaysShow]="true"
  (activeKeysChange)="onActiveKeys($event)"
/>
```

---

## Comportement

| Situation | Comportement |
|---|---|
| `data` vide | Panneau masqué (sauf `alwaysShow = true`) |
| 1 seule slice | Ouverte par défaut ; cliquer la referme |
| Plusieurs slices | Accordéon exclusif (une seule ouverte à la fois) |
| Slice lazy en chargement | Skeleton affiché à la place des catégories |
| Aucune catégorie sélectionnée | Slice neutralisée (tout passe) |

---

## Notes

- Utiliser `[style.display]` plutôt que `*ngIf` pour masquer sans détruire l'état de sélection.
- `lazyData` et `lazyStatus` doivent toujours être de **nouvelles instances de `Map`** (pas de `.set()` en place — `OnPush` ne détecterait pas le changement).