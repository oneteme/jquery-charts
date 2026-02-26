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
  enableSearchBar: true,
  enableViewButton: true,
  enableColumnDragDrop: true,
  allowColumnRemoval: true,
  enablePagination: true,
  pageSize: 5,
  pageSizeOptions: [5, 10, 20],
  columns: [
    col<RepoRow>('issue',  'Issue'),
    col<RepoRow>('status', 'Status'),
    col<RepoRow>('owner',  'Owner'),
    { ...col<RepoRow>('priority',  'Priorité'),              optional: true },
    { ...col<RepoRow>('team',      'Équipe'),                optional: true },
    { ...col<RepoRow>('updatedAt', 'Dernière mise à jour'),  optional: true },
  ],
  slices: [
    { title: 'Status', columnKey: 'status', showAll: false },
  ],
  rowClass: (row) => {
    if (row.status === 'Done')        return 'row-done';
    if (row.status === 'In Progress') return 'row-in-progress';
    return '';
  },
  emptyStateLabel: 'Aucun résultat',
  loadingStateLabel: 'Chargement...',
  data: rows,
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
    { ...col<RepoRow>('priority', 'Priorité'), optional: true },
    { ...col<RepoRow>('team', 'Équipe'), optional: true },
    { ...col<RepoRow>('updatedAt', 'Dernière mise à jour'), optional: true },
  ];

  tableConfig: TableProvider<RepoRow> = {
    title: 'Ticket board',
    enableSearchBar: true,
    enableViewButton: true,
    enableColumnDragDrop: true,
    allowColumnRemoval: true,
    enablePagination: true,
    pageSize: 5,
    pageSizeOptions: [5, 10, 20],
    columns: [
      col<RepoRow>('issue',  'Issue'),
      col<RepoRow>('status', 'Status'),
      col<RepoRow>('owner',  'Owner'),
      { ...col<RepoRow>('priority',  'Priorité'), optional: true },
      { ...col<RepoRow>('team',      'Équipe'), optional: true },
      { ...col<RepoRow>('updatedAt', 'Dernière mise à jour'), optional: true },
    ],
    slices: [
      { title: 'Status', columnKey: 'status', showAll: false },
    ],
    rowClass: (row) => {
      if (row.status === 'Done')        return 'row-done';
      if (row.status === 'In Progress') return 'row-in-progress';
      return '';
    },
    emptyStateLabel: 'Aucun résultat',
    loadingStateLabel: 'Chargement...',
    data: this.tableData,
  };

  onRowSelected(row: RepoRow): void {
    this.selectedRow = row;
  }

  toggleCodeVisibility(): void {
    this.isCodeVisible = !this.isCodeVisible;
  }
}
