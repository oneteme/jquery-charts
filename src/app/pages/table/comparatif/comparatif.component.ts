import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TableComponent as JQueryTableComponent, TableProvider } from '@oneteme/jquery-table';

interface Task {
  taskId: string;
  summary: string;
  owner: string;
  status: 'Backlog' | 'In Progress' | 'Done';
  sprint: string;
  updatedAt: string;
}

@Component({
  selector: 'app-table-comparatif',
  standalone: true,
  imports: [CommonModule, RouterLink, JQueryTableComponent],
  templateUrl: './comparatif.component.html',
  styleUrls: ['./comparatif.component.scss'],
})
export class TableComparatifComponent {

  readonly tasks: Task[] = [
    { taskId: 'T-1001', summary: 'Auth SSO migration',         owner: 'Amine',          status: 'Done',        sprint: 'Sprint 7', updatedAt: '2026-01-10 14:00' },
    { taskId: 'T-1002', summary: 'Dashboard v2',                owner: 'Fufu',           status: 'In Progress', sprint: 'Sprint 8', updatedAt: '2026-01-12 09:15' },
    { taskId: 'T-1003', summary: 'Fix pagination bug',          owner: 'Youssef Senior', status: 'Done',        sprint: 'Sprint 7', updatedAt: '2026-01-11 11:45' },
    { taskId: 'T-1004', summary: 'Unit tests auth module',      owner: 'Amine',          status: 'Backlog',     sprint: 'Sprint 9', updatedAt: '2026-01-14 08:00' },
    { taskId: 'T-1005', summary: 'Deploy staging env',          owner: 'Youssef',        status: 'In Progress', sprint: 'Sprint 8', updatedAt: '2026-01-13 16:30' },
    { taskId: 'T-1006', summary: 'API gateway rate limiting',   owner: 'Youssef Senior', status: 'Backlog',     sprint: 'Sprint 9', updatedAt: '2026-01-15 10:00' },
    { taskId: 'T-1007', summary: 'UX review onboarding',        owner: 'Fufu',           status: 'Done',        sprint: 'Sprint 7', updatedAt: '2026-01-10 17:20' },
    { taskId: 'T-1008', summary: 'DB schema migration',         owner: 'Amine',          status: 'In Progress', sprint: 'Sprint 8', updatedAt: '2026-01-13 14:00' },
    { taskId: 'T-1009', summary: 'Monitoring Grafana setup',    owner: 'Youssef',        status: 'Backlog',     sprint: 'Sprint 9', updatedAt: '2026-01-16 09:00' },
    { taskId: 'T-1010', summary: 'API documentation',           owner: 'Youssef Senior', status: 'Done',        sprint: 'Sprint 7', updatedAt: '2026-01-11 15:00' },
    { taskId: 'T-1011', summary: 'CI/CD pipeline refactor',     owner: 'Fufu',           status: 'In Progress', sprint: 'Sprint 8', updatedAt: '2026-01-14 11:00' },
    { taskId: 'T-1012', summary: 'Security audit remédiation',  owner: 'Youssef',        status: 'Backlog',     sprint: 'Sprint 9', updatedAt: '2026-01-17 08:30' },
  ];

  // ── mat-table : colonnes à gérer manuellement ──────────────────────────────
  readonly matColumns: string[] = ['taskId', 'summary', 'owner', 'status', 'sprint', 'updatedAt'];

  // ── jquery-table : tout dans un seul objet de config ──────────────────────
  readonly tableConfig: TableProvider<Task> = {
    title: 'Backlog de sprint',
    columns: [
      { key: 'taskId',    header: 'ID' },
      { key: 'summary',   header: 'Résumé' },
      { key: 'owner',     header: 'Développeur' },
      { key: 'status',    header: 'Statut' },
      { key: 'sprint',    header: 'Sprint' },
      { key: 'updatedAt', header: 'Mis à jour le' },
    ],
    search: { enabled: true },
    pagination: { enabled: true, pageSize: 5, pageSizeOptions: [5, 10] },
    view: { enableColumnRemoval: true, enableColumnDragDrop: true },
    slices: [
      { title: 'Statut',       columnKey: 'status' },
      { title: 'Sprint',       columnKey: 'sprint' },
      { title: 'Développeur',  columnKey: 'owner'  },
    ],
  };

  // ── Blocs de code affichés (stockés en TS pour éviter l'interpolation Angular)
  readonly matCode = `// component.ts
readonly columns = ['taskId','summary','owner','status','sprint','updatedAt'];
filteredRows = [...this.data];
searchTerm = '';

applySearch() {
  this.filteredRows = this.data.filter(r =>
    Object.values(r).some(v =>
      String(v).toLowerCase().includes(this.searchTerm.toLowerCase())
    )
  );
}

// component.html
<input (input)="applySearch()" [(ngModel)]="searchTerm" />

<table mat-table [dataSource]="filteredRows" matSort>
  <ng-container *ngFor="let c of columns" [matColumnDef]="c">
    <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ c }}</th>
    <td mat-cell *matCellDef="let row">{{ row[c] }}</td>
  </ng-container>
  <tr mat-header-row *matHeaderRowDef="columns"></tr>
  <tr mat-row *matRowDef="let row; columns: columns"></tr>
</table>

<mat-paginator [pageSizeOptions]="[5,10]"></mat-paginator>
// + DataSource, sort/paginator binding, OnInit, etc.`;

  readonly jqCode = `// component.ts
readonly tableConfig: TableProvider<Task> = {
  title: 'Backlog de sprint',
  columns: [
    { key: 'taskId',    header: 'ID' },
    { key: 'summary',   header: 'Résumé' },
    { key: 'owner',     header: 'Développeur' },
    { key: 'status',    header: 'Statut' },
    { key: 'sprint',    header: 'Sprint' },
    { key: 'updatedAt', header: 'Mis à jour le' },
  ],
  search: { enabled: true },
  pagination: { enabled: true, pageSize: 5, pageSizeOptions: [5, 10] },
  view: { enableColumnRemoval: true, enableColumnDragDrop: true },
  slices: [
    { title: 'Statut',      columnKey: 'status' },
    { title: 'Sprint',      columnKey: 'sprint' },
    { title: 'Développeur', columnKey: 'owner'  },
  ],
};

// component.html
<jquery-table [data]="tasks" [config]="tableConfig"></jquery-table>`;
}
