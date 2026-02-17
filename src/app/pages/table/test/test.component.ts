import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { TableComponent as JQueryTableComponent } from '@oneteme/jquery-table';

@Component({
  selector: 'app-table-columns-example',
  standalone: true,
  imports: [CommonModule, MatTableModule, JQueryTableComponent],
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss'],
})
export class TableColumnsExampleComponent {
  readonly apiRows: Record<string, unknown>[] = [
    {
      taskId: 'T-1024',
      summary: 'Créer un dashboard',
      owner: 'Amine',
      status: 'In Progress',
      sprint: 'Sprint 8',
      updatedAt: '2026-02-15 09:32',
    },
    {
      taskId: 'T-1025',
      summary: 'Corriger la pagination',
      owner: 'Fufu',
      status: 'Backlog',
      sprint: 'Sprint 9',
      updatedAt: '2026-02-16 10:11',
    },
    {
      taskId: 'T-1026',
      summary: 'Optimiser les perfs',
      owner: 'Thomas',
      status: 'Done',
      sprint: 'Sprint 8',
      updatedAt: '2026-02-16 17:04',
    },
  ];

  readonly classicColumns: string[] = this.apiRows.length
    ? Object.keys(this.apiRows[0])
    : [];

  readonly wrapperLabels: Record<string, string> = {
    taskId: 'Task ID',
    summary: 'Résumé',
    owner: 'Owner',
    status: 'Status',
    sprint: 'Sprint',
    updatedAt: 'Dernière mise à jour',
  };
}
