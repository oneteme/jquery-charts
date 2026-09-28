import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TableComponent as JQueryTableComponent, TableProvider } from '@oneteme/jquery-table';

interface Task {
  taskId: string;
  summary: string;
  owner: string;
  status: 'À faire' | 'En cours' | 'Terminé';
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
    { taskId: 'T-1001', summary: 'Migration authentification SSO', owner: 'Amine',          status: 'Terminé', sprint: 'Sprint 7', updatedAt: '10 janvier 2026' },
    { taskId: 'T-1002', summary: 'Tableau de bord v2',            owner: 'Fufu',           status: 'En cours', sprint: 'Sprint 8', updatedAt: '12 janvier 2026' },
    { taskId: 'T-1003', summary: 'Correction de la pagination',   owner: 'Youssef Senior', status: 'Terminé', sprint: 'Sprint 7', updatedAt: '11 janvier 2026' },
    { taskId: 'T-1004', summary: 'Tests unitaires du module auth', owner: 'Amine',         status: 'À faire', sprint: 'Sprint 9', updatedAt: '14 janvier 2026' },
    { taskId: 'T-1005', summary: 'Déploiement de la recette',     owner: 'Youssef',        status: 'En cours', sprint: 'Sprint 8', updatedAt: '13 janvier 2026' },
    { taskId: 'T-1006', summary: 'Limitation de débit API',       owner: 'Youssef Senior', status: 'À faire', sprint: 'Sprint 9', updatedAt: '15 janvier 2026' },
    { taskId: 'T-1007', summary: 'Revue UX onboarding',            owner: 'Fufu',           status: 'Terminé', sprint: 'Sprint 7', updatedAt: '10 janvier 2026' },
    { taskId: 'T-1008', summary: 'Migration du schéma SQL',        owner: 'Amine',          status: 'En cours', sprint: 'Sprint 8', updatedAt: '13 janvier 2026' },
    { taskId: 'T-1009', summary: 'Mise en place du monitoring',    owner: 'Youssef',        status: 'À faire', sprint: 'Sprint 9', updatedAt: '16 janvier 2026' },
    { taskId: 'T-1010', summary: 'Documentation API',              owner: 'Youssef Senior', status: 'Terminé', sprint: 'Sprint 7', updatedAt: '11 janvier 2026' },
    { taskId: 'T-1011', summary: 'Refonte de la chaîne CI/CD',     owner: 'Fufu',           status: 'En cours', sprint: 'Sprint 8', updatedAt: '14 janvier 2026' },
    { taskId: 'T-1012', summary: 'Remédiation audit sécurité',     owner: 'Youssef',        status: 'À faire', sprint: 'Sprint 9', updatedAt: '17 janvier 2026' },
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
    search: { enabled: true, searchColumns: ['taskId', 'summary', 'owner', 'status', 'sprint'] },
    pagination: { enabled: true, pageSize: 5, pageSizeOptions: [5, 10] },
    view: { enabled: true, enableColumnRemoval: true, enableColumnDragDrop: true },
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
// + MatTableDataSource, MatSort, MatPaginator et leurs branchements.`;

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
  search: { enabled: true, searchColumns: ['taskId', 'summary', 'owner', 'status', 'sprint'] },
  pagination: { enabled: true, pageSize: 5, pageSizeOptions: [5, 10] },
  view: { enabled: true, enableColumnRemoval: true, enableColumnDragDrop: true },
  slices: [
    { title: 'Statut',      columnKey: 'status' },
    { title: 'Sprint',      columnKey: 'sprint' },
    { title: 'Développeur', columnKey: 'owner'  },
  ],
};

// component.html
<jquery-table [data]="tasks" [config]="tableConfig"></jquery-table>`;
}
