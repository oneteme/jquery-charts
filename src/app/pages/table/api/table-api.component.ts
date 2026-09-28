import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { TableColumnProvider, TableComponent, TableProvider, JqtCellDefDirective, col } from '@oneteme/jquery-table';
import { VisualSnapshot, VisualSnapshotDraft } from '@oneteme/jquery-core';

type ApiSource = 'Wrapper' | 'Core' | 'Angular Material';

interface ApiEntry {
  name: string;
  type: string;
  source: ApiSource;
  description: string;
  code: string;
  types?: string;
}

interface ApiSection {
  id: string;
  title: string;
  description: string;
  example: string;
  entries: ApiEntry[];
}

type Status = 'Ouvert' | 'En cours' | 'Terminé';
type Priority = 'Haute' | 'Normale' | 'Basse';

interface TableApiRow {
  id: number;
  reference: string;
  team: string;
  status: Status;
  priority: Priority;
  duration: number;
  updatedAt: string;
}

type DemoCodeTab = 'ts' | 'html' | 'scss';

@Component({
  selector: 'app-table-api',
  standalone: true,
  imports: [CommonModule, RouterLink, TableComponent, JqtCellDefDirective],
  templateUrl: './table-api.component.html',
  styleUrls: ['./table-api.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableApiComponent {
  readonly sections: ApiSection[] = [
    {
      id: 'component',
      title: 'Composant <jquery-table>',
      description: 'Inputs, outputs et méthodes du composant standalone exporté par jquery-table.',
      example: `<jquery-table
  [config]="config"
  [data]="rows"
  [isLoading]="loading"
  (rowSelected)="onRow($event)"
  (searchChange)="onSearch($event)">
</jquery-table>`,
      entries: [
        { name: 'config', type: 'TableProvider<T>', source: 'Wrapper', description: 'Configuration déclarative des colonnes, de la recherche, de la pagination, des vues, des slices, de l’export et des préférences.', code: '<jquery-table [config]="config" ...></jquery-table>' },
        { name: 'data', type: 'T[]', source: 'Wrapper', description: 'Données brutes fournies séparément de la configuration. Le composant reconstruit sa vue lorsqu’elles changent.', code: '<jquery-table [data]="rows" ...></jquery-table>' },
        { name: 'dataSource', type: 'T[] | { data: T[] }', source: 'Wrapper', description: 'Mode de compatibilité pour migrer depuis une table Material existante.', code: '<jquery-table [dataSource]="dataSource" ...></jquery-table>' },
        { name: 'displayedColumns / columnsConfig', type: 'string[] / TableColumnProvider<T>[]', source: 'Wrapper', description: 'Entrées de compatibilité pour déclarer les colonnes sans passer par config.columns.', code: '<jquery-table [displayedColumns]="columns" [columnsConfig]="columnsConfig"></jquery-table>' },
        { name: 'columnLabels', type: 'Record<string, string>', source: 'Wrapper', description: 'Libellés utilisés par le mode allégé dataSource/displayedColumns.', code: '<jquery-table [columnLabels]="{ id: \'ID\' }" ...></jquery-table>' },
        { name: 'isLoading', type: 'boolean', source: 'Wrapper', description: 'Affiche le message de chargement configuré au-dessus du tableau.', code: '<jquery-table [isLoading]="loading" ...></jquery-table>' },
        { name: 'view / clearSearchInput / copyFeedback', type: 'TableViewConfig / string | number | boolean / VisualCopyFeedbackConfig', source: 'Wrapper', description: 'Surcharge le menu View, réinitialise la recherche lorsqu’une valeur truthy change et configure le feedback de snapshot.', code: '<jquery-table [view]="view" [clearSearchInput]="resetToken" [copyFeedback]="feedback"></jquery-table>' },
      ],
    },
    {
      id: 'provider',
      title: 'TableProvider<T>',
      description: 'Le contrat de configuration principal du tableau.',
      example: `const config: TableProvider<Row> = {
  title: 'Interventions',
  columns: [col('reference', 'Référence', { sortable: true })],
  search: { enabled: true, searchColumns: ['reference', 'team'] },
  pagination: { enabled: true, pageSize: 10 },
  view: { enabled: true, enableColumnDragDrop: true },
  export: { enabled: true, filename: 'interventions' },
  preferences: { enabled: true, tableId: 'interventions' },
};`,
      entries: [
        { name: 'title', type: 'string', source: 'Wrapper', description: 'Titre affiché dans la toolbar du tableau.', code: "title: 'Interventions'" },
        { name: 'search', type: 'TableSearchConfig', source: 'Wrapper', description: 'Active la recherche texte, son terme initial et la liste de colonnes interrogées.', code: "search: { enabled: true, searchColumns: ['reference', 'team'] }" },
        { name: 'pagination', type: 'TablePaginationConfig', source: 'Angular Material', description: 'Configure la pagination générale et les tailles spécifiques au mode Group by.', code: 'pagination: { enabled: true, pageSize: 10, pageSizeOptions: [5, 10, 20] }' },
        { name: 'view', type: 'TableViewConfig', source: 'Wrapper', description: 'Active le menu View : Champs, Group by et Slice by. Le drag & drop des colonnes est optionnel.', code: 'view: { enabled: true, enableColumnDragDrop: true }' },
        { name: 'slices', type: 'SliceConfig<T>[]', source: 'Wrapper', description: 'Ajoute des filtres statiques à catégories manuelles ou déduites depuis columnKey.', code: "slices: [{ title: 'Statut', columnKey: 'status' }]" },
        { name: 'defaultSort / defaultGroupBy', type: 'sort config / string | null', source: 'Wrapper', description: 'Définit le tri et le regroupement initiaux sans les réappliquer à chaque changement de données.', code: "defaultSort: { active: 'updatedAt', direction: 'desc' }" },
        { name: 'labels', type: 'TableLabelsConfig', source: 'Wrapper', description: 'Personnalise les messages vide et chargement du tableau.', code: "labels: { empty: 'Aucun ticket', loading: 'Chargement...' }" },
        { name: 'export', type: 'TableExportConfig<T>', source: 'Wrapper', description: 'Active l’export CSV des lignes filtrées et des colonnes visibles, avec transformation optionnelle.', code: "export: { enabled: true, filename: 'tickets' }" },
        { name: 'preferences', type: 'TablePreferencesConfig', source: 'Wrapper', description: 'Active le mode édition et la persistance localStorage sous la clé jqt_prefs_<tableId>.', code: "preferences: { enabled: true, tableId: 'tickets' }" },
        { name: 'showActions / onCopyVisual / onToggleFullscreen', type: 'boolean / () => void', source: 'Wrapper', description: 'Expose les actions de copie visuelle et de plein écran dans le menu lorsque les callbacks sont fournis.', code: 'showActions: true' },
        { name: 'rowClass / onRowSelected', type: 'callbacks', source: 'Wrapper', description: 'Calcule les classes de ligne et propose un callback de sélection en complément des outputs Angular.', code: "rowClass: row => ({ 'is-urgent': row.priority === 'Haute' })" },
      ],
    },
    {
      id: 'columns',
      title: 'TableColumnProvider<T> et col()',
      description: 'Déclaration des champs visibles, de leur rendu, du tri, de la recherche et du chargement différé.',
      example: `columns: [
  col('reference', 'Référence', { sortable: true }),
  {
    key: 'duration',
    header: 'Durée',
    value: row => row.duration + ' min',
    sortValue: row => row.duration,
    optional: true,
  },
  {
    key: 'details',
    header: 'Détails',
    lazy: { fetchFn: () => details$ },
  },
];`,
      entries: [
        { name: 'key / header / icon', type: 'string', source: 'Wrapper', description: 'Identifie la colonne et définit son en-tête et son icône Material éventuelle.', code: "col('reference', 'Référence', { icon: 'fingerprint' })" },
        { name: 'value / sortValue / searchValue', type: 'DataProvider', source: 'Core', description: 'Sépare la valeur affichée, la valeur de tri et la valeur utilisée par la recherche plein texte.', code: "{ value: row => row.duration + ' min', sortValue: row => row.duration }" },
        { name: 'sortable / removable / optional', type: 'boolean', source: 'Wrapper', description: 'Contrôle le tri, la suppression et l’activation initiale de la colonne dans le menu View.', code: '{ sortable: true, optional: true, removable: true }' },
        { name: 'groupable / sliceable', type: 'boolean', source: 'Wrapper', description: 'Rend la colonne disponible respectivement pour Group by ou Slice by dynamique.', code: '{ groupable: true, sliceable: true }' },
        { name: 'width', type: 'string', source: 'Wrapper', description: 'Largeur CSS déclarative. Les largeurs en pixels participent aussi au calcul de la largeur minimale.', code: "{ width: '140px' }" },
        { name: 'lazy', type: '{ fetchFn: () => Observable<any[]> }', source: 'Wrapper', description: 'Déclenche un chargement différé de valeurs dans le même ordre que les lignes et gère les états idle, loading, loaded et error.', code: "lazy: { fetchFn: () => this.api.loadDetails() }" },
        { name: 'col()', type: '(key, header, overrides?) => TableColumnProvider', source: 'Wrapper', description: 'Raccourci exporté pour les colonnes simples ; tous les champs de TableColumnProvider restent surchargeables.', code: "col<Row>('name', 'Nom', { sortable: true })" },
      ],
    },
    {
      id: 'outputs',
      title: 'Outputs Angular',
      description: 'Événements utiles pour piloter l’URL, une sélection, une persistance externe ou un écran voisin.',
      example: `<jquery-table
  (rowSelected)="selected = $event"
  (sortChange)="sort = $event"
  (pageChange)="page = $event"
  (columnsChange)="visibleColumns = $event"
  (visualCopied)="snapshot = $event">
</jquery-table>`,
      entries: [
        { name: 'rowSelected', type: 'EventEmitter<T>', source: 'Wrapper', description: 'Émet la ligne brute lors d’un clic sur une ligne normale.', code: '(rowSelected)="onRow($event)"' },
        { name: 'sortChange', type: 'EventEmitter<{ active; direction }>', source: 'Angular Material', description: 'Émet chaque changement de colonne et de direction de tri.', code: '(sortChange)="sort = $event"' },
        { name: 'pageChange', type: 'EventEmitter<{ pageIndex; pageSize }>', source: 'Angular Material', description: 'Émet chaque changement de page ou de taille de page.', code: '(pageChange)="page = $event"' },
        { name: 'searchChange', type: 'EventEmitter<string>', source: 'Wrapper', description: 'Émet la valeur de la recherche à chaque frappe.', code: '(searchChange)="query = $event"' },
        { name: 'groupByChange', type: 'EventEmitter<string | null>', source: 'Wrapper', description: 'Émet la clé du regroupement actif ou null lorsque le regroupement est retiré.', code: '(groupByChange)="group = $event"' },
        { name: 'columnsChange', type: 'EventEmitter<string[]>', source: 'Wrapper', description: 'Émet les clés des colonnes visibles dans leur ordre courant.', code: '(columnsChange)="visibleColumns = $event"' },
        { name: 'columnAdded / columnRemoved', type: 'EventEmitter<TableColumnProvider<T>>', source: 'Wrapper', description: 'Signale l’ajout ou le retrait d’une colonne depuis View > Champs.', code: '(columnAdded)="onColumnAdded($event)"' },
        { name: 'categorySelected / addRequested', type: 'EventEmitter<string> / EventEmitter<void>', source: 'Wrapper', description: 'Relaye une catégorie de filtre sélectionnée ou la demande d’ajout d’une colonne.', code: '(categorySelected)="category = $event"' },
        { name: 'visualCopied', type: 'EventEmitter<VisualSnapshot>', source: 'Core', description: 'Émet le snapshot persistant créé par copyVisualSnapshot().', code: '(visualCopied)="snapshot = $event"' },
      ],
    },
    {
      id: 'methods',
      title: 'Méthodes publiques et snapshot',
      description: 'Méthodes disponibles depuis une référence Angular au composant.',
      example: `@ViewChild('table') table!: TableComponent<Row>;

table.onExport();
const draft = table.createVisualSnapshot('Tickets');
const saved = table.copyVisualSnapshot('Tickets filtrés');
await table.toggleFullscreen();`,
      entries: [
        { name: 'onExport()', type: 'void', source: 'Wrapper', description: 'Déclenche l’export CSV configuré. Le fichier contient les données filtrées et les colonnes visibles.', code: 'table.onExport();' },
        { name: 'createVisualSnapshot()', type: '() => VisualSnapshotDraft', source: 'Core', description: 'Prépare une copie autonome de la configuration sérialisable, de l’état visible et des lignes filtrées.', code: "const draft = table.createVisualSnapshot('Tickets');" },
        { name: 'copyVisualSnapshot()', type: '(label?) => VisualSnapshot | null', source: 'Core', description: 'Crée le snapshot, le persiste via VisualSnapshotStorage, émet visualCopied et affiche le feedback configuré.', code: "table.copyVisualSnapshot('Tickets filtrés');" },
        { name: 'applyVisualSnapshot()', type: '(snapshot) => VisualSnapshotApplyResult', source: 'Core', description: 'Restaure les colonnes compatibles, la recherche, le group by et les largeurs ; retourne aussi les clés ignorées.', code: 'const result = table.applyVisualSnapshot(snapshot);' },
        { name: 'toggleFullscreen()', type: '() => Promise<void>', source: 'Core', description: 'Utilise FullscreenManager sur l’élément jquery-table et maintient l’état visuel du menu.', code: 'await table.toggleFullscreen();' },
      ],
    },
    {
      id: 'templates-i18n',
      title: 'Templates de cellule et i18n',
      description: 'Deux extensions exportées pour personnaliser le rendu et les textes sans modifier le composant.',
      example: `<ng-template jqtCellDef="status" let-row>
  <span class="status-chip">{{ row.status }}</span>
</ng-template>

providers: [
  { provide: JQT_I18N, useValue: { emptyState: 'Aucun résultat' } },
];`,
      entries: [
        { name: 'JqtCellDefDirective', type: '[jqtCellDef]', source: 'Wrapper', description: 'Associe un ng-template à une clé de colonne. Le contexte expose la ligne brute via $implicit et son index global.', code: '<ng-template jqtCellDef="status" let-row>...</ng-template>' },
        { name: 'JQT_I18N', type: 'InjectionToken<Partial<JqtI18n>>', source: 'Wrapper', description: 'Permet de remplacer tout ou partie des 31 labels de l’interface : recherche, View, filtres, export, préférences et états.', code: "{ provide: JQT_I18N, useValue: { searchPlaceholder: 'Search...' } }" },
      ],
    },
  ];

  readonly rows: TableApiRow[] = [
    { id: 1, reference: 'INT-2401', team: 'Raccordement', status: 'En cours', priority: 'Haute', duration: 42, updatedAt: '2024-04-08' },
    { id: 2, reference: 'INT-2402', team: 'Maintenance', status: 'Terminé', priority: 'Normale', duration: 18, updatedAt: '2024-04-09' },
    { id: 3, reference: 'INT-2403', team: 'Dépannage', status: 'Ouvert', priority: 'Haute', duration: 73, updatedAt: '2024-04-10' },
    { id: 4, reference: 'INT-2404', team: 'Raccordement', status: 'Terminé', priority: 'Basse', duration: 26, updatedAt: '2024-04-11' },
    { id: 5, reference: 'INT-2405', team: 'Maintenance', status: 'En cours', priority: 'Normale', duration: 54, updatedAt: '2024-04-12' },
    { id: 6, reference: 'INT-2406', team: 'Dépannage', status: 'Ouvert', priority: 'Haute', duration: 91, updatedAt: '2024-04-13' },
    { id: 7, reference: 'INT-2407', team: 'Raccordement', status: 'Terminé', priority: 'Normale', duration: 33, updatedAt: '2024-04-14' },
    { id: 8, reference: 'INT-2408', team: 'Maintenance', status: 'En cours', priority: 'Basse', duration: 47, updatedAt: '2024-04-15' },
    { id: 9, reference: 'INT-2409', team: 'Dépannage', status: 'Ouvert', priority: 'Normale', duration: 64, updatedAt: '2024-04-16' },
    { id: 10, reference: 'INT-2410', team: 'Raccordement', status: 'Terminé', priority: 'Haute', duration: 22, updatedAt: '2024-04-17' },
  ];

  readonly tableConfig: TableProvider<TableApiRow> = {
    title: 'Interventions réseau',
    search: { enabled: true, searchColumns: ['reference', 'team', 'status', 'priority'] },
    pagination: { enabled: true, pageSize: 5, pageSizeOptions: [5, 10], pageSizeOptionsGroupBy: [5, 10] },
    view: { enabled: true, enableColumnRemoval: true, enableColumnDragDrop: true },
    defaultSort: { active: 'updatedAt', direction: 'desc' },
    labels: { empty: 'Aucune intervention', loading: 'Chargement des interventions...' },
    slices: [
      { title: 'Statut', columnKey: 'status', multiSelect: true },
      {
        title: 'Priorité',
        categories: [
          { key: 'high', label: 'Haute', filter: row => row.priority === 'Haute' },
          { key: 'normal', label: 'Normale', filter: row => row.priority === 'Normale' },
          { key: 'low', label: 'Basse', filter: row => row.priority === 'Basse' },
        ],
      },
    ],
    export: {
      enabled: true,
      filename: 'interventions-api',
      transform: row => ({
        reference: row.reference,
        equipe: row.team,
        statut: row.status,
        priorite: row.priority,
        duree: String(row.duration),
        mise_a_jour: row.updatedAt,
      }),
    },
    preferences: { enabled: true, tableId: 'jquery-table-api-page' },
    rowClass: row => ({ 'row-priority-high': row.priority === 'Haute' }),
    columns: [
      col<TableApiRow>('reference', 'Référence', { sortable: true, width: '130px' }),
      col<TableApiRow>('team', 'Équipe', { sortable: true, groupable: true, sliceable: true }),
      col<TableApiRow>('status', 'Statut', { sortable: true, groupable: true, sliceable: true }),
      col<TableApiRow>('priority', 'Priorité', { sortable: true, groupable: true, optional: true }),
      {
        key: 'duration',
        header: 'Durée',
        sortable: true,
        optional: true,
        value: row => `${row.duration} min`,
        sortValue: row => row.duration,
        searchValue: row => String(row.duration),
      },
      {
        key: 'updatedAt',
        header: 'Mise à jour',
        sortable: true,
        optional: true,
        value: row => new Date(row.updatedAt).toLocaleDateString('fr-FR'),
        sortValue: row => row.updatedAt,
      },
      {
        key: 'details',
        header: 'Détails lazy',
        sortable: false,
        optional: true,
        lazy: { fetchFn: () => of(this.rows.map(row => `${row.team} · ${row.duration} min`)).pipe(delay(500)) },
      },
    ],
  };

  readonly demoCode: Record<DemoCodeTab, string> = {
    ts: `import { col, TableProvider } from '@oneteme/jquery-table';

interface Row {
  reference: string;
  team: string;
  status: string;
}

readonly rows: Row[] = [
  { reference: 'INT-2410', team: 'Raccordement', status: 'Terminé' },
];

readonly tableConfig: TableProvider<Row> = {
  title: 'Interventions réseau',
  search: { enabled: true, searchColumns: ['reference', 'team', 'status'] },
  pagination: { enabled: true, pageSize: 5 },
  view: { enabled: true, enableColumnRemoval: true },
  columns: [
    col('reference', 'Référence', { sortable: true }),
    col('team', 'Équipe', { sortable: true }),
    col('status', 'Statut', { sortable: true }),
  ],
};`,
    html: `<jquery-table
  #apiTable
  [config]="tableConfig"
  [data]="rows"
  [isLoading]="isLoadingDemo"
  (rowSelected)="onRowSelected($event)"
  (searchChange)="lastSearch = $event">
  <ng-template jqtCellDef="status" let-row>
    <span class="status-chip" [attr.data-status]="row.status">
      {{ row.status }}
    </span>
  </ng-template>
</jquery-table>`,
    scss: `.table-demo-surface {
  padding: .85rem;
  border: 1px solid #d7e3e3;
  background: #f7faf9;
}

.api-table-component {
  display: block;
  height: 420px;
  min-height: 420px;
}

.status-chip {
  display: inline-flex;
  min-height: 24px;
  padding: .15rem .45rem;
  border-radius: 12px;
}`,
  };

  isLoadingDemo = false;
  activeCodeTab: DemoCodeTab = 'ts';
  clearSearchToken = 0;
  selectedRow: TableApiRow | null = null;
  lastSearch = '';
  lastSort = '';
  lastPage = '';
  lastGroupBy = 'Aucun';
  lastColumns = '';
  lastCategory = '';
  snapshotDraft: VisualSnapshotDraft | null = null;
  lastSnapshot: VisualSnapshot | null = null;

  setCodeTab(tab: DemoCodeTab): void {
    this.activeCodeTab = tab;
  }

  toggleLoading(): void {
    this.isLoadingDemo = !this.isLoadingDemo;
  }

  resetSearch(): void {
    this.clearSearchToken += 1;
  }

  onRowSelected(row: TableApiRow): void {
    this.selectedRow = row;
  }

  onSortChange(event: { active: string; direction: 'asc' | 'desc' | '' }): void {
    this.lastSort = event.direction ? `${event.active} · ${event.direction}` : 'Aucun tri';
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.lastPage = `page ${event.pageIndex + 1} · ${event.pageSize} lignes`;
  }

  onGroupByChange(key: string | null): void {
    this.lastGroupBy = key || 'Aucun';
  }

  onColumnsChange(keys: string[]): void {
    this.lastColumns = keys.join(', ');
  }

  onColumnAdded(column: TableColumnProvider<TableApiRow>): void {
    this.lastColumns = `Ajout : ${column.key}`;
  }

  onColumnRemoved(column: TableColumnProvider<TableApiRow>): void {
    this.lastColumns = `Retrait : ${column.key}`;
  }

  prepareSnapshot(table: TableComponent<TableApiRow>): void {
    this.snapshotDraft = table.createVisualSnapshot('Interventions API');
  }

  onSnapshotCreated(snapshot: VisualSnapshot): void {
    this.lastSnapshot = snapshot;
  }

  formatJson(value: unknown): string {
    return JSON.stringify(value, null, 2);
  }
}