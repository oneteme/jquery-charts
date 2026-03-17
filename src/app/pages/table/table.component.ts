import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TableComponent, TableColumnProvider, TableProvider } from '@oneteme/jquery-table';

interface RepoRow {
  issue: string;
  status: 'Backlog' | 'In Progress' | 'Done';
  owner: string;
  priority: 'Low' | 'Medium' | 'High';
  team: string;
  updatedAt: string;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, TableComponent, RouterLink],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
})
export class TableExempleComponent {
  isLoading = false;
  selectedRow: RepoRow | null = null;
  isCodeVisible = false;

  readonly tableTemplateCode = `<jquery-table
  [config]="tableConfig"
  [data]="tableData"
  [isLoading]="isLoading"
  (rowSelected)="onRowSelected($event)"
></jquery-table>`;

  readonly tableConfigCode = `tableConfig: TableProvider<RepoRow> = {
  title: 'Ticket board',
  search: { enabled: true },
  view: { enabled: true, enableColumnRemoval: true, enableColumnDragDrop: true },
  pagination: { enabled: true, pageSize: 5, pageSizeOptions: [5, 10, 20] },
  labels: { empty: 'Aucun résultat', loading: 'Chargement...' },
  columns: [
    { key: 'issue',     header: 'Issue' },
    { key: 'status',    header: 'Status' },
    { key: 'owner',     header: 'Owner' },
    { key: 'priority',  header: 'Priorité',             optional: true },
    { key: 'team',      header: 'Équipe',               optional: true },
    { key: 'updatedAt', header: 'Dernière mise à jour', optional: true },
  ],
  slices: [
    { title: 'Status', columnKey: 'status' },
  ],
  rowClass: (row) => {
    if (row.status === 'Done')        return 'row-done';
    if (row.status === 'In Progress') return 'row-in-progress';
    return '';
  },
};`;

  get tableDataCode(): string {
    return `const tableData: RepoRow[] = ${JSON.stringify(this.tableData, null, 2)};`;
  }

  readonly tableData: RepoRow[] = [
    {
      issue: 'Présentation IA',
      status: 'In Progress',
      owner: 'Youssef Senior',
      priority: 'High',
      team: 'Backend',
      updatedAt: '2026-02-12 15:42',
    },
    {
      issue: 'Pulse',
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
      issue: 'Jquery-Table',
      status: 'Backlog',
      owner: 'Youssef',
      priority: 'Low',
      team: 'Backend',
      updatedAt: '2026-02-08 11:54',
    },
  ];

  private readonly dynamicColumns: TableColumnProvider<RepoRow>[] = [
    { key: 'priority', header: 'Priorité', optional: true },
    { key: 'team', header: 'Équipe', optional: true },
    { key: 'updatedAt', header: 'Dernière mise à jour', optional: true },
  ];

  tableConfig: TableProvider<RepoRow> = {
    title: 'Ticket board',
    search: { enabled: true },
    view: { enabled: true, enableColumnRemoval: true, enableColumnDragDrop: true },
    pagination: { enabled: true, pageSize: 5, pageSizeOptions: [5, 10, 20] },
    labels: { empty: 'Aucun résultat', loading: 'Chargement...' },
    columns: [
      { key: 'issue',     header: 'Issue' },
      { key: 'status',    header: 'Status' },
      { key: 'owner',     header: 'Owner' },
      { key: 'priority',  header: 'Priorité',              optional: true },
      { key: 'team',      header: 'Équipe',                optional: true },
      { key: 'updatedAt', header: 'Dernière mise à jour',  optional: true },
    ],
    slices: [
      { title: 'Status', columnKey: 'status' },
    ],
    rowClass: (row) => {
      if (row.status === 'Done')        return 'row-done';
      if (row.status === 'In Progress') return 'row-in-progress';
      return '';
    },
  };

  onRowSelected(row: RepoRow): void {
    this.selectedRow = row;
  }

  toggleCodeVisibility(): void {
    this.isCodeVisible = !this.isCodeVisible;
  }
}
