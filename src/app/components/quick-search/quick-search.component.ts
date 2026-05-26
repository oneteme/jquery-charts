import {
  Component, OnInit, OnDestroy, HostListener,
  ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export interface SearchItem {
  label: string;
  sublabel?: string;
  route: string;
  category: string;
  keywords?: string[];
}

const SEARCH_INDEX: SearchItem[] = [
  // Accueil
  { label: 'Accueil', route: '/', category: 'Navigation' },

  // jquery-table
  { label: 'jquery-table — Démo',              sublabel: 'Tableau avec 100 posts',       route: '/table',                category: 'jquery-table' },
  { label: 'jquery-table — Comparatif',        sublabel: 'mat-table vs jquery-table',     route: '/table/comparatif',     category: 'jquery-table' },
  { label: 'jquery-table — Slice + Graphique', sublabel: 'slice-panel standalone',        route: '/table/slice-chart',    category: 'jquery-table' },
  { label: 'jquery-table — Documentation',     sublabel: 'Référence API complète',        route: '/table/documentation',  category: 'jquery-table' },

  // Graphiques — ECharts
  { label: 'ECharts — Tous les types',  route: '/charts/echarts',    category: 'ECharts'    },
  { label: 'ECharts — Bar',             route: '/charts/echarts',    category: 'ECharts',    keywords: ['bar', 'horizontal'] },
  { label: 'ECharts — Line',            route: '/charts/echarts',    category: 'ECharts',    keywords: ['line', 'ligne'] },
  { label: 'ECharts — Pie / Donut',     route: '/charts/echarts',    category: 'ECharts',    keywords: ['pie', 'donut', 'camembert'] },
  { label: 'ECharts — Heatmap',         route: '/charts/echarts',    category: 'ECharts',    keywords: ['heatmap', 'chaleur'] },
  { label: 'ECharts — Treemap',         route: '/charts/echarts',    category: 'ECharts',    keywords: ['treemap', 'arbre'] },

  // Graphiques — Highcharts
  { label: 'Highcharts — Tous les types', route: '/charts/highcharts',       category: 'Highcharts' },
  { label: 'Highcharts — Pie',            route: '/charts/highcharts/pie',   category: 'Highcharts', keywords: ['pie', 'donut'] },
  { label: 'Highcharts — Bar',            route: '/charts/highcharts/bar',   category: 'Highcharts', keywords: ['bar', 'barre'] },
  { label: 'Highcharts — Line',           route: '/charts/highcharts/line',  category: 'Highcharts', keywords: ['line', 'ligne'] },
  { label: 'Highcharts — Scatter',        route: '/charts/highcharts/scatter',  category: 'Highcharts' },
  { label: 'Highcharts — Heatmap',        route: '/charts/highcharts/heatmap',  category: 'Highcharts' },
  { label: 'Highcharts — Treemap',        route: '/charts/highcharts/treemap',  category: 'Highcharts' },
  { label: 'Highcharts — Funnel',         route: '/charts/highcharts/funnel',   category: 'Highcharts' },
  { label: 'Highcharts — Map',            route: '/charts/highcharts/map',      category: 'Highcharts' },

  // Graphiques — ApexCharts
  { label: 'ApexCharts — Tous les types', route: '/charts/apexcharts',     category: 'ApexCharts' },
  { label: 'ApexCharts — Bar',            route: '/charts/apexcharts',     category: 'ApexCharts', keywords: ['bar'] },
  { label: 'ApexCharts — Pie',            route: '/charts/apexcharts',     category: 'ApexCharts', keywords: ['pie'] },

  // Documentation
  { label: 'Documentation — Démarrage',    route: '/documentation/getting-started', category: 'Documentation' },
  { label: 'Documentation — Types',        route: '/documentation/graph-types',     category: 'Documentation' },
];

@Component({
  selector: 'app-quick-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quick-search.component.html',
  styleUrls: ['./quick-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickSearchComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  isOpen = false;
  query = '';
  results: SearchItem[] = [];
  activeIndex = 0;

  constructor(
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {}
  ngOnDestroy() {}

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    // Ctrl+K ou Cmd+K
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.open();
      return;
    }
    if (!this.isOpen) return;

    if (event.key === 'Escape')      { this.close(); return; }
    if (event.key === 'ArrowDown')   { event.preventDefault(); this.moveDown(); return; }
    if (event.key === 'ArrowUp')     { event.preventDefault(); this.moveUp(); return; }
    if (event.key === 'Enter')       { this.selectActive(); return; }
  }

  open() {
    this.isOpen = true;
    this.query = '';
    this.results = SEARCH_INDEX.slice(0, 8);
    this.activeIndex = 0;
    this.cdr.markForCheck();
    setTimeout(() => this.searchInput?.nativeElement?.focus(), 50);
  }

  close() {
    this.isOpen = false;
    this.query = '';
    this.results = [];
    this.cdr.markForCheck();
  }

  onQuery(q: string) {
    this.query = q;
    this.activeIndex = 0;
    if (!q.trim()) {
      this.results = SEARCH_INDEX.slice(0, 8);
    } else {
      const lower = q.toLowerCase();
      this.results = SEARCH_INDEX.filter(item =>
        item.label.toLowerCase().includes(lower) ||
        item.sublabel?.toLowerCase().includes(lower) ||
        item.category.toLowerCase().includes(lower) ||
        item.keywords?.some(k => k.includes(lower))
      ).slice(0, 10);
    }
    this.cdr.markForCheck();
  }

  select(item: SearchItem) {
    this.router.navigate([item.route]);
    this.close();
  }

  selectActive() {
    if (this.results[this.activeIndex]) {
      this.select(this.results[this.activeIndex]);
    }
  }

  moveDown() {
    this.activeIndex = Math.min(this.activeIndex + 1, this.results.length - 1);
    this.cdr.markForCheck();
  }

  moveUp() {
    this.activeIndex = Math.max(this.activeIndex - 1, 0);
    this.cdr.markForCheck();
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('qs-backdrop')) {
      this.close();
    }
  }

  highlightMatch(text: string): string {
    if (!this.query) return text;
    const escaped = this.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
  }
}
