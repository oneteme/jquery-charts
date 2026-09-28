import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { JqtCellDefDirective, TableComponent, TableProvider, col } from '@oneteme/jquery-table';

type DemoStatus = 'Ouvert' | 'En cours' | 'Terminé';
type DemoPriority = 'Haute' | 'Normale' | 'Basse';

interface DemoRow {
  reference: string;
  subject: string;
  team: string;
  status: DemoStatus;
  priority: DemoPriority;
  duration: number;
  updatedAt: string;
}

type CodeTab = 'ts' | 'html' | 'scss';

interface ExampleCode {
  ts: string;
  html: string;
  scss: string;
}

interface TableExample {
  id: string;
  index: string;
  title: string;
  description: string;
  tags: string[];
  config: TableProvider<DemoRow>;
  code: ExampleCode;
  activeCodeTab: CodeTab;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, TableComponent, JqtCellDefDirective],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableExempleComponent {
  readonly codeTabs: { key: CodeTab; label: string }[] = [
    { key: 'ts', label: 'TS' },
    { key: 'html', label: 'HTML' },
    { key: 'scss', label: 'SCSS' },
  ];

  readonly rows: DemoRow[] = [
    { reference: 'INT-2410', subject: 'Mise en service compteur', team: 'Raccordement', status: 'Terminé', priority: 'Haute', duration: 22, updatedAt: '17 avril 2024' },
    { reference: 'INT-2409', subject: 'Diagnostic armoire', team: 'Dépannage', status: 'Ouvert', priority: 'Normale', duration: 64, updatedAt: '16 avril 2024' },
    { reference: 'INT-2408', subject: 'Contrôle réseau HTA', team: 'Maintenance', status: 'En cours', priority: 'Basse', duration: 47, updatedAt: '15 avril 2024' },
    { reference: 'INT-2407', subject: 'Raccordement photovoltaïque', team: 'Raccordement', status: 'Terminé', priority: 'Normale', duration: 33, updatedAt: '14 avril 2024' },
    { reference: 'INT-2406', subject: 'Dépannage câble souterrain', team: 'Dépannage', status: 'Ouvert', priority: 'Haute', duration: 91, updatedAt: '13 avril 2024' },
    { reference: 'INT-2405', subject: 'Remplacement disjoncteur', team: 'Maintenance', status: 'En cours', priority: 'Normale', duration: 54, updatedAt: '12 avril 2024' },
    { reference: 'INT-2404', subject: 'Branchement collectif', team: 'Raccordement', status: 'Terminé', priority: 'Basse', duration: 26, updatedAt: '11 avril 2024' },
    { reference: 'INT-2403', subject: 'Recherche de défaut', team: 'Dépannage', status: 'Ouvert', priority: 'Haute', duration: 73, updatedAt: '10 avril 2024' },
    { reference: 'INT-2402', subject: 'Thermographie poste source', team: 'Maintenance', status: 'Terminé', priority: 'Normale', duration: 18, updatedAt: '9 avril 2024' },
    { reference: 'INT-2401', subject: 'Étude raccordement maison', team: 'Raccordement', status: 'En cours', priority: 'Normale', duration: 42, updatedAt: '8 avril 2024' },
  ];

  readonly overviewConfig: TableProvider<DemoRow> = {
    title: 'Interventions réseau',
    search: { enabled: true, searchColumns: ['reference', 'subject', 'team', 'status'] },
    pagination: { enabled: true, pageSize: 5, pageSizeOptions: [5, 10] },
    view: { enabled: true, enableColumnRemoval: true, enableColumnDragDrop: true },
    organizer: { buttonLabel: 'Vue', buttonIcon: 'tune', showButtonIcon: true },
    slices: [
      { title: 'Statut', columnKey: 'status', multiSelect: true },
    ],
    columns: [
      col<DemoRow>('reference', 'Référence', { width: '130px', sortable: false, groupable: false, sliceable: false }),
      col<DemoRow>('subject', 'Intervention', { groupable: false, sliceable: false }),
      col<DemoRow>('team', 'Équipe'),
      col<DemoRow>('status', 'Statut'),
      col<DemoRow>('updatedAt', 'Mise à jour', { sortable: false, groupable: false, sliceable: false }),
    ],
  };

  readonly viewConfig: TableProvider<DemoRow> = {
    title: 'Interventions par équipe',
    search: { enabled: true, searchColumns: ['subject', 'team', 'status', 'priority'] },
    pagination: { enabled: true, pageSize: 5, pageSizeOptions: [5, 10], pageSizeOptionsGroupBy: [5, 10] },
    view: { enabled: true, enableColumnRemoval: true, enableColumnDragDrop: true },
    defaultGroupBy: 'team',
    export: { enabled: true, filename: 'interventions' },
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
    columns: [
      col<DemoRow>('reference', 'Référence', { sortable: true, width: '130px' }),
      col<DemoRow>('subject', 'Intervention', { sortable: true }),
      col<DemoRow>('team', 'Équipe', { sortable: true, groupable: true, sliceable: true }),
      col<DemoRow>('status', 'Statut', { sortable: true, groupable: true, sliceable: true }),
      col<DemoRow>('priority', 'Priorité', { sortable: true, optional: true }),
    ],
  };

  readonly customConfig: TableProvider<DemoRow> = {
    title: 'Cellules personnalisées et colonne différée',
    pagination: { enabled: true, pageSize: 5, pageSizeOptions: [5, 10] },
    columns: [
      col<DemoRow>('reference', 'Référence', { sortable: true, width: '130px' }),
      col<DemoRow>('status', 'Statut', { sortable: true }),
      col<DemoRow>('priority', 'Priorité', { sortable: true }),
      {
        key: 'duration',
        header: 'Durée',
        sortable: true,
        value: row => `${row.duration} min`,
        sortValue: row => row.duration,
      },
      {
        key: 'details',
        header: 'Détails chargés',
        lazy: {
          fetchFn: () => of(this.rows.map(row => row.duration > 60 ? 'Intervention longue' : 'Intervention standard')).pipe(delay(450)),
        },
      },
    ],
  };

  readonly examples: TableExample[] = [
    {
      id: 'overview',
      index: '01',
      title: 'Recherche, tri et pagination + stylisation des différents éléments',
      description: 'Le socle d’un tableau métier : recherche ciblée, organizer configurable et règles SCSS pour compacter le header et le footer.',
      tags: ['search', 'sort', 'pagination', 'style', 'organizer'],
      config: this.overviewConfig,
      code: {
        ts: `const config: TableProvider<Intervention> = {
  view: { enabled: true, enableColumnRemoval: true, enableColumnDragDrop: true },
  organizer: { buttonLabel: 'Vue', buttonIcon: 'tune', showButtonIcon: true },
  slices: [{ title: 'Statut', columnKey: 'status', multiSelect: true }],
  search: { enabled: true, searchColumns: ['subject', 'team'] },
  pagination: { enabled: true, pageSize: 5 },
  columns: [
    col('reference', 'Référence', { sortable: false, groupable: false, sliceable: false }),
    col('subject', 'Intervention', { groupable: false, sliceable: false }),
    col('team', 'Équipe'),
    col('status', 'Statut'),
    col('updatedAt', 'Mise à jour', { sortable: false, groupable: false, sliceable: false }),
  ],
};`,
        html: `<jquery-table
  class="demo-table demo-table--styled"
  [config]="config"
  [data]="rows">
</jquery-table>`,
        scss: `:host {
  display: block;
  height: 420px;
}

.demo-table {
  display: block;
  height: 100%;
}

.demo-table--styled {
  --jqt-primary-color: #176b72;
  --jqt-header-bg: #e8f3f1;
  --jqt-header-text-color: #175b61;
  --jqt-footer-bg: #f6f8f8;
  --jqt-footer-text-color: #526b73;
  --jqt-footer-icon-color: #176b72;
  --jqt-border-color: #c7d9d8;
  --jqt-header-height: 40px;
  --jqt-header-cell-padding-y: 0px;
  --jqt-footer-height: 40px;
  --jqt-organizer-button-height: 30px;
  --jqt-organizer-button-radius: 4px;
  --jqt-organizer-button-border-color: #176b72;
  --jqt-organizer-button-background: #e8f3f1;
  --jqt-organizer-button-hover-border-color: #bc5b35;
  --jqt-organizer-button-hover-background: #fff5ef;
  --jqt-organizer-button-icon-color: #176b72;
}`,
      },
      activeCodeTab: 'ts',
    },
    {
      id: 'view',
      index: '02',
      title: 'View, Group by, Slice by et export',
      description: 'Le menu View rassemble les colonnes, le regroupement et les filtres ; l’export CSV reste accessible depuis la toolbar.',
      tags: ['view', 'group by', 'slice by', 'export CSV'],
      config: this.viewConfig,
      code: {
        ts: `const config: TableProvider<Intervention> = {
  view: { enabled: true, enableColumnDragDrop: true },
  defaultGroupBy: 'team',
  slices: [{ title: 'Statut', columnKey: 'status' }],
  export: { enabled: true, filename: 'interventions' },
  columns: [
    col('team', 'Équipe', { groupable: true, sliceable: true }),
    col('status', 'Statut', { groupable: true, sliceable: true }),
  ],
};`,
        html: `<jquery-table
  class="demo-table"
  [config]="config"
  [data]="rows">
</jquery-table>`,
        scss: `:host {
  display: block;
  height: 420px;
}

.demo-table {
  display: block;
  height: 100%;
}`,
      },
      activeCodeTab: 'ts',
    },
    {
      id: 'custom',
      index: '03',
      title: 'Cellules personnalisées et données différées',
      description: 'Un template Angular personnalise les badges, tandis qu’une colonne lazy simule une donnée chargée après le rendu initial.',
      tags: ['jqtCellDef', 'value / sortValue', 'lazy'],
      config: this.customConfig,
      code: {
        ts: `columns: [{
  key: 'duration',
  header: 'Durée',
  value: row => row.duration + ' min',
  sortValue: row => row.duration,
}, {
  key: 'details',
  header: 'Détails chargés',
  lazy: { fetchFn: () => details$ },
}];`,
        html: `<jquery-table
  class="demo-table"
  [config]="config"
  [data]="rows">
  <ng-template jqtCellDef="status" let-row>
    <span class="status-chip">{{ row.status }}</span>
  </ng-template>
</jquery-table>`,
        scss: `:host {
  display: block;
  height: 420px;
}

.demo-table {
  display: block;
  height: 100%;
}`,
      },
      activeCodeTab: 'ts',
    },
  ];

  selectedReference = 'Aucune ligne sélectionnée';

  onRowSelected(row: DemoRow): void {
    this.selectedReference = row.reference;
  }

  selectCodeTab(example: TableExample, tab: CodeTab): void {
    example.activeCodeTab = tab;
  }

  codeFor(example: TableExample): string {
    return example.code[example.activeCodeTab];
  }
}
