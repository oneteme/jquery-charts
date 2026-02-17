import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  TableComponent,
  TableColumnProvider,
  TableProvider,
  col,
} from '@oneteme/jquery-table';

interface RepoRow {
  issue: string;
  status: 'Backlog' | 'In Progress' | 'Done';
  owner: string;
  priority: 'Low' | 'Medium' | 'High';
  team: string;
  updatedAt: string;
}

@Component({
  selector: 'app-table-test',
  standalone: true,
  imports: [CommonModule, TableComponent, RouterLink],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
})
export class TableTestComponent {
  isLoading = false;
  selectedRow: RepoRow | null = null;
  isCodeVisible = false;

  readonly tableTemplateCode = `<jquery-table
  [config]="tableConfig"
  [isLoading]="isLoading"
  (rowSelected)="onRowSelected($event)"
></jquery-table>`;

  readonly tableConfigCode = `tableConfig: TableProvider<RepoRow> = {
  title: 'Ticket board',
  showAddColumnButton: true,
  addColumnLabel: 'Ajouter une colonne',
  enableColumnDragDrop: true,
  enablePagination: true,
  pageSize: 5,
  columns: [
    col<RepoRow>('issue', 'Issue'),
    col<RepoRow>('status', 'Status'),
    col<RepoRow>('owner', 'Owner'),
  ],
  optionalColumns: [
    col<RepoRow>('priority', 'Priorité'),
    col<RepoRow>('team', 'Équipe'),
    col<RepoRow>('updatedAt', 'Dernière mise à jour'),
  ],
  categorySlice: {
    title: 'Status',
    allLabel: 'Tous',
    categories: [
      { key: 'backlog', label: 'Backlog', filter: (row) => row.status === 'Backlog' },
      { key: 'in-progress', label: 'In Progress', filter: (row) => row.status === 'In Progress' },
      { key: 'done', label: 'Done', filter: (row) => row.status === 'Done' },
    ],
  },
  data: this.tableData,
};`;

  get tableDataCode(): string {
    return `const tableData: RepoRow[] = ${JSON.stringify(this.tableData, null, 2)};`;
  }

  private readonly tableData: RepoRow[] = [
    {
      issue: 'Faire la doc',
      status: 'In Progress',
      owner: 'Youssef Senior',
      priority: 'High',
      team: 'Backend',
      updatedAt: '2026-02-12 15:42',
    },
    {
      issue: 'Faire des tickets',
      status: 'Backlog',
      owner: 'Fufu',
      priority: 'Medium',
      team: 'Backend',
      updatedAt: '2026-02-10 09:18',
    },
    {
      issue: 'KPIs',
      status: 'Done',
      owner: 'Youssef Junior',
      priority: 'High',
      team: 'Backend',
      updatedAt: '2026-02-09 18:03',
    },
    {
      issue: 'Raven',
      status: 'In Progress',
      owner: 'Amine',
      priority: 'High',
      team: 'Backend',
      updatedAt: '2026-02-13 08:27',
    },
    {
      issue: 'Deploy Oraccle',
      status: 'Backlog',
      owner: 'Thomas',
      priority: 'Low',
      team: 'Backend',
      updatedAt: '2026-02-08 11:54',
    },
  ];

  private readonly dynamicColumns: TableColumnProvider<RepoRow>[] = [
    col<RepoRow>('priority', 'Priorité'),
    col<RepoRow>('team', 'Équipe'),
    col<RepoRow>('updatedAt', 'Dernière mise à jour'),
  ];

  tableConfig: TableProvider<RepoRow> = {
    title: 'Ticket board',
    showAddColumnButton: true,
    addColumnLabel: 'Ajouter une colonne',
    enableColumnDragDrop: true,
    allowColumnRemoval: true,
    enablePagination: true,
    pageSize: 5,
    pageSizeOptions: [5, 10, 20],
    columns: [
      col<RepoRow>('issue', 'Issue'),
      col<RepoRow>('status', 'Status'),
      col<RepoRow>('owner', 'Owner'),
    ],
    optionalColumns: this.dynamicColumns,
    categorySlice: {
      title: 'Status',
      allLabel: 'Tous',
      categories: [
        { key: 'backlog', label: 'Backlog', filter: (row) => row.status === 'Backlog' },
        { key: 'in-progress', label: 'In Progress', filter: (row) => row.status === 'In Progress' },
        { key: 'done', label: 'Done', filter: (row) => row.status === 'Done' },
      ],
    },
    data: this.tableData,
  };

  onRowSelected(row: RepoRow): void {
    this.selectedRow = row;
  }

  toggleCodeVisibility(): void {
    this.isCodeVisible = !this.isCodeVisible;
  }
}
