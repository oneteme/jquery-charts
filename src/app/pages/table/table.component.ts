import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { col, TableProvider, TableComponent } from '@oneteme/jquery-table';

/** Post JSONPlaceholder enrichi avec les infos auteur. */
interface Post {
  id: number;
  title: string;
  authorName: string;
  authorCompany: string;
  authorCity: string;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, TableComponent, RouterLink],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
})
export class TableExempleComponent implements OnInit {
  private readonly http = inject(HttpClient);

  isLoading = true;
  tableData: Post[] = [];
  selectedRow: Post | null = null;
  isCodeVisible = false;

  // État des outputs
  lastSort: { active: string; direction: string } | null = null;
  lastPage: { pageIndex: number; pageSize: number } | null = null;
  lastSearch = '';
  lastGroupBy: string | null = null;
  visibleColumns: string[] = [];

  // Strings de code affichées dans la démo (sans backtick imbriqué)
  readonly tableTemplateCode = [
    '<jquery-table',
    '  [config]="tableConfig"',
    '  [data]="tableData"',
    '  [isLoading]="isLoading"',
    '  (rowSelected)="onRowSelected($event)"',
    '  (sortChange)="lastSort = $event"',
    '  (pageChange)="lastPage = $event"',
    '  (searchChange)="lastSearch = $event"',
    '  (groupByChange)="lastGroupBy = $event"',
    '  (columnsChange)="visibleColumns = $event"',
    '></jquery-table>',
  ].join('\n');

  readonly tableConfigCode = [
    "import { col, TableProvider } from '@oneteme/jquery-table';",
    "import { forkJoin } from 'rxjs';",
    '',
    'tableConfig: TableProvider<Post> = {',
    "  title: 'JSONPlaceholder — Posts (100 lignes)',",
    "  search:     { enabled: true, searchColumns: ['title', 'authorName', 'authorCompany'] },",
    '  view:       { enabled: true, enableColumnRemoval: true, enableColumnDragDrop: true },',
    "  pagination: { enabled: true, pageSize: 10, pageSizeOptions: [10, 25, 50] },",
    "  export:     { enabled: true, filename: 'posts' },",
    "  defaultSort: { active: 'authorName', direction: 'asc' },",
    '  columns: [',
    "    col('title',         'Titre',   { sortable: true }),",
    "    col('authorName',    'Auteur',  { sortable: true, groupable: true }),",
    "    col('authorCompany', 'Société', { sortable: true, groupable: true }),",
    "    col('authorCity',    'Ville',   { optional: true }),",
    "    { key: 'comments', header: 'Commentaires', sortable: true, optional: true,",
    "      lazy: { fetchFn: () => http.get('/comments').pipe(map(...)) },",
    '    },',
    '  ],',
    '  slices: [',
    "    { title: 'Société', columnKey: 'authorCompany' },",
    "    { title: 'Auteur',  columnKey: 'authorName' },",
    '  ],',
    '};',
  ].join('\n');

  readonly tableDataCode = [
    'forkJoin({',
    "  users: http.get<any[]>('https://jsonplaceholder.typicode.com/users'),",
    "  posts: http.get<any[]>('https://jsonplaceholder.typicode.com/posts'),",
    '}).pipe(',
    '  map(({ users, posts }) => {',
    '    const userMap = new Map(users.map(u => [u.id, u]));',
    '    return posts.map(p => ({',
    '      id: p.id, title: p.title,',
    "      authorName:    userMap.get(p.userId)?.name           ?? '',",
    "      authorCompany: userMap.get(p.userId)?.company?.name  ?? '',",
    "      authorCity:    userMap.get(p.userId)?.address?.city  ?? '',",
    '    }));',
    '  })',
    ').subscribe({',
    '  next: posts => { this.tableData = posts; this.isLoading = false; },',
    '  error: ()    => { this.isLoading = false; },',
    '});',
  ].join('\n');

  tableConfig: TableProvider<Post> = {
    title: 'JSONPlaceholder — Posts (100 lignes)',
    search:      { enabled: true, searchColumns: ['title', 'authorName', 'authorCompany'] },
    view:        { enabled: true, enableColumnRemoval: true, enableColumnDragDrop: false },
    pagination:  { enabled: true, pageSize: 10, pageSizeOptions: [10, 25, 50] },
    export:      { enabled: true, filename: 'posts' },
    preferences: { enabled: true, tableId: 'demo-posts-table' },
    defaultSort: { active: 'authorName', direction: 'asc' },
    columns: [
      col('title',         'Titre',   { sortable: true }),
      col('authorName',    'Auteur',  { sortable: true, groupable: true }),
      col('authorCompany', 'Société', { sortable: true, groupable: true }),
      col('authorCity',    'Ville',   { optional: true }),
      {
        key: 'comments',
        header: 'Commentaires',
        sortable: true,
        optional: true,
        lazy: {
          fetchFn: () => this.http.get<any[]>('https://jsonplaceholder.typicode.com/comments').pipe(
            map(comments => {
              const counts = new Map<number, number>();
              comments.forEach((c: any) => counts.set(c.postId, (counts.get(c.postId) || 0) + 1));
              return this.tableData.map(p => counts.get(p.id) ?? 0);
            })
          ),
        },
      },
    ],
    slices: [
      { title: 'Société', columnKey: 'authorCompany' },
      { title: 'Auteur',  columnKey: 'authorName' },
    ],
  };

  ngOnInit(): void {
    this.isLoading = true;
    forkJoin({
      users: this.http.get<any[]>('https://jsonplaceholder.typicode.com/users'),
      posts: this.http.get<any[]>('https://jsonplaceholder.typicode.com/posts'),
    }).pipe(
      map(({ users, posts }) => {
        const userMap = new Map(users.map((u: any) => [u.id, u]));
        return posts.map((p: any) => {
          const u: any = userMap.get(p.userId) ?? {};
          return {
            id: p.id,
            title: p.title,
            authorName:    u.name          ?? '',
            authorCompany: u.company?.name ?? '',
            authorCity:    u.address?.city ?? '',
          } as Post;
        });
      })
    ).subscribe({
      next: posts => { this.tableData = posts; this.isLoading = false; },
      error: ()    => { this.isLoading = false; },
    });
  }

  onRowSelected(row: Post): void {
    this.selectedRow = row;
  }

  onSortChange(event: { active: string; direction: string }): void {
    this.lastSort = event;
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.lastPage = event;
  }

  onSearchChange(query: string): void {
    this.lastSearch = query;
  }

  onGroupByChange(key: string | null): void {
    this.lastGroupBy = key;
  }

  onColumnsChange(keys: string[]): void {
    this.visibleColumns = keys;
  }

  toggleCodeVisibility(): void {
    this.isCodeVisible = !this.isCodeVisible;
  }
}

