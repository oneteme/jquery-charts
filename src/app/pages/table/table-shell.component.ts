import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';

interface TableTab {
  label: string;
  path: string;
  exact: boolean;
  icon: string;
}

@Component({
  selector: 'app-table-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgFor, NgIf],
  templateUrl: './table-shell.component.html',
  styleUrls: ['./table-shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableShellComponent {
  readonly tabs: TableTab[] = [
    { label: 'Démo',               path: '/table',                exact: true,  icon: 'demo'  },
    { label: 'Comparatif',         path: '/table/comparatif',     exact: false, icon: 'comp'  },
    { label: 'Slice + Graphique',  path: '/table/slice-chart',    exact: false, icon: 'slice' },
    { label: 'Documentation',      path: '/table/documentation',  exact: false, icon: 'doc'   },
  ];

  constructor(private readonly router: Router) {}

  get isPresentation(): boolean {
    return this.router.url.startsWith('/table/presentation');
  }
}
