# jQuery-Table

Bibliothèque Angular qui encapsule Angular Material Table avec une API orientée configuration runtime.

## Features

- Colonnes dynamiques (ajout/retrait à l'exécution)
- Liste de colonnes optionnelles ajoutables via bouton `+`
- Slice catégories à gauche (ex: status)
- Filtrage temps réel selon la catégorie sélectionnée
- Settings par colonne (⋯): filter by values + actions custom
- Actions utilitaires custom par colonne (événements)
- Intégration avec `@oneteme/jquery-core` (`field`, `DataProvider`)

## Installation

```bash
npm install @oneteme/jquery-core @oneteme/jquery-table @angular/material @angular/cdk
```

## Utilisation rapide

```ts
import { Component } from '@angular/core';
import { TableComponent, TableProvider, col } from '@oneteme/jquery-table';

interface Row {
	issue: string;
	status: 'Backlog' | 'In Progress' | 'Done';
	owner: string;
	priority: 'Low' | 'Medium' | 'High';
}

@Component({
	standalone: true,
	imports: [TableComponent],
	template: `
		<jquery-table
			[config]="tableConfig"
			(columnAdded)="onColumnAdded($event)"
			(columnRemoved)="onColumnRemoved($event)"
			(categorySelected)="onCategorySelected($event)"
		></jquery-table>
	`,
})
export class DemoComponent {
	tableConfig: TableProvider<Row> = {
		title: 'Ticket board',
		showAddColumnButton: true,
		allowColumnRemoval: true,
		columns: [col<Row>('issue', 'Issue'), col<Row>('status', 'Status')],
		availableColumns: [col<Row>('owner', 'Owner'), col<Row>('priority', 'Priority')],
		categorySlice: {
			title: 'Status',
			allLabel: 'Tous',
			categories: [
				{ key: 'backlog', label: 'Backlog', filter: (row) => row.status === 'Backlog' },
				{ key: 'in-progress', label: 'In Progress', filter: (row) => row.status === 'In Progress' },
				{ key: 'done', label: 'Done', filter: (row) => row.status === 'Done' },
			],
		},
		data: [
			{ issue: 'Fix auth', status: 'In Progress', owner: 'Anna', priority: 'High' },
			{ issue: 'Improve docs', status: 'Backlog', owner: 'Leo', priority: 'Low' },
		],
	};

	onColumnAdded() {}
	onColumnRemoved() {}
	onCategorySelected() {}
}
```

## Migration minimale depuis Angular Material Table

Si votre composant utilise déjà `dataSource` et `displayedColumns`, vous pouvez migrer avec très peu de changements:

```html
<!-- Avant -->
<!-- <table mat-table [dataSource]="dataSource"> ... -->

<!-- Après -->
<jquery-table
	[dataSource]="dataSource"
	[displayedColumns]="displayedColumns"
	[columnLabels]="columnLabels"
></jquery-table>
```

```ts
displayedColumns = ['issue', 'status', 'owner'];

columnLabels = {
	issue: 'Issue',
	status: 'Status',
	owner: 'Owner',
};
```

Le `config` complet reste disponible pour activer les fonctionnalités avancées (slice catégories, ajout/retrait de colonnes, menu d’options).

## API

### Inputs

- `dataSource`: alias compatible Material (`T[]` ou `{ data: T[] }`)
- `displayedColumns`: alias compatible Material (`string[]`)
- `columnLabels`: labels optionnels pour `displayedColumns`
- `config.showColumnSettings`: active les menus `⋯` en header de colonne
- `config.maxFilterValuesPerColumn`: limite le nombre de valeurs proposées dans `Filter by values`
- `config.columnUtilityActions`: actions custom globales par colonne
- `config.columns`: colonnes initiales visibles
- `config.optionalColumns` (ou `config.availableColumns`): colonnes optionnelles ajoutables via `+`
- `config.showAddColumnButton`: active/désactive le bouton `+`
- `config.showOptionsButton`: active/désactive le bouton `Options`
- `config.bottomActionsLabel`: libellé des actions dockées en bas-gauche
- `config.allowColumnRemoval`: autorise la suppression des colonnes
- `config.categorySlice`: configuration du panel de catégories à gauche
- `config.data`: dataset source

### Smart adaptation (intelligence data-driven)
Le wrapper est volontairement simple: pas de système d'inférence automatique complexe.
Le développeur fournit explicitement les colonnes de base, les colonnes optionnelles et les filtres.

### Outputs

- `columnAdded`: émis après ajout effectif d'une colonne
- `columnRemoved`: émis après suppression effective d'une colonne
- `categorySelected`: émis au changement de catégorie
- `columnSettingSelected`: émis au clic sur une action de menu colonne (built-in ou custom)
- `optionSelected`: émis depuis le menu d'options

### Exemple settings colonne

```ts
tableConfig = {
	showColumnSettings: true,
	maxFilterValuesPerColumn: 12,
	columnUtilityActions: [
		{ action: 'utility:copyColumnKey', label: 'Copy column key' },
	],
};
```

## Build

```bash
ng build @oneteme/jquery-table
```

## Publishing

```bash
cd dist/oneteme/jquery-table
npm publish
```
