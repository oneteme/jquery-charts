import {
  Component, HostListener,
  ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  APEXCHARTS_SECTIONS,
  ECHARTS_DETAIL_SECTIONS,
  HIGHCHARTS_SECTIONS,
} from '../../pages/charts/chart-example-sections';

export interface SearchItem {
  label: string;
  sublabel?: string;
  route: string;
  category: string;
  keywords?: string[];
}

function createChartSearchItems(
  libraryLabel: string,
  route: string,
  sections: readonly { id: string; label: string }[]
): SearchItem[] {
  return sections.map(section => ({
    label: `${libraryLabel} — ${section.label}`,
    sublabel: 'Exemple détaillé',
    route: `${route}/${section.id}`,
    category: libraryLabel,
    keywords: [section.id, section.label, 'graphique', 'exemple'],
  }));
}

function normalizeSearchText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

const SEARCH_INDEX: SearchItem[] = [
  // Parcours principaux affichés dès l'ouverture de la recherche
  { label: 'Accueil', route: '/', category: 'Navigation' },
  { label: 'Démarrer', sublabel: 'Choisir une galerie, un composant ou une API', route: '/demarrer', category: 'Navigation', keywords: ['documentation', 'prise en main', 'commencer', 'installation'] },
  { label: 'Graphiques — Toutes les galeries', sublabel: 'ECharts, Highcharts et ApexCharts', route: '/charts', category: 'Graphiques', keywords: ['charts', 'exemples', 'renderer'] },
  { label: 'ECharts — Galerie', sublabel: 'Exemples et types disponibles', route: '/charts/echarts', category: 'ECharts', keywords: ['graphique', 'exemple'] },
  { label: 'Highcharts — Galerie', sublabel: 'Exemples et types disponibles', route: '/charts/highcharts', category: 'Highcharts', keywords: ['graphique', 'exemple'] },
  { label: 'ApexCharts — Galerie', sublabel: 'Exemples et types disponibles', route: '/charts/apexcharts', category: 'ApexCharts', keywords: ['graphique', 'exemple'] },
  { label: 'jquery-table — Galerie', sublabel: 'Démonstration du composant tableau', route: '/table', category: 'jquery-table', keywords: ['tableau', 'composant'] },
  { label: 'jquery-organizer — Démo', sublabel: 'Menus et états de vue', route: '/organizer', category: 'jquery-organizer', keywords: ['organiseur', 'composant'] },

  // Outils et écrans secondaires
  { label: 'Atelier', sublabel: 'Tester une configuration librement', route: '/atelier', category: 'Outils', keywords: ['atelier', 'configuration'] },
  { label: 'Snapshots visuels', sublabel: 'Copier et composer un dashboard', route: '/snapshots', category: 'Outils', keywords: ['snapshot', 'dashboard', 'copie'] },

  // APIs publiques
  { label: 'jquery-core — API', sublabel: 'Providers, transformations et utilitaires', route: '/api/core', category: 'API', keywords: ['data', 'provider', 'field', 'values'] },
  { label: 'jquery-organizer — API', sublabel: 'Configuration, état et événements', route: '/api/organizer', category: 'API' },
  { label: 'jquery-echarts — API', sublabel: 'Inputs, événements et capacités ECharts', route: '/api/echarts', category: 'API' },
  { label: 'jquery-highcharts — API', sublabel: 'Wrapper, options et intégration Highcharts', route: '/api/highcharts', category: 'API' },
  { label: 'jquery-apexcharts — API', sublabel: 'Types supportés et limites du wrapper', route: '/api/apexcharts', category: 'API' },
  { label: 'jquery-table — API', sublabel: 'Colonnes, recherche, vues et export', route: '/api/table', category: 'API' },

  // Sous-pages utiles, conservées pour les recherches ciblées
  { label: 'jquery-table — Comparatif', sublabel: 'mat-table vs jquery-table', route: '/table/comparatif', category: 'jquery-table', keywords: ['material', 'comparaison'] },
  { label: 'jquery-table — Slice + Graphique', sublabel: 'slice-panel standalone', route: '/table/slice-chart', category: 'jquery-table', keywords: ['slice', 'filtre', 'graphique'] },
  ...createChartSearchItems('ECharts', '/charts/echarts', ECHARTS_DETAIL_SECTIONS),
  ...createChartSearchItems('Highcharts', '/charts/highcharts', HIGHCHARTS_SECTIONS),
  ...createChartSearchItems('ApexCharts', '/charts/apexcharts', APEXCHARTS_SECTIONS),
];

@Component({
  selector: 'app-quick-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quick-search.component.html',
  styleUrls: ['./quick-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickSearchComponent {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  isOpen = false;
  query = '';
  results: SearchItem[] = [];
  activeIndex = 0;

  constructor(
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    // Ctrl+K ou Cmd+K
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.open();
      return;
    }
    if (!this.isOpen) return;

    if (event.key === 'Escape') { this.close(); return; }
    if (event.key === 'ArrowDown') { event.preventDefault(); this.moveDown(); return; }
    if (event.key === 'ArrowUp') { event.preventDefault(); this.moveUp(); return; }
    if (event.key === 'Enter') { this.selectActive(); }
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
      const normalizedQuery = normalizeSearchText(q.trim());
      this.results = SEARCH_INDEX.filter(item =>
        [item.label, item.sublabel, item.category, ...(item.keywords ?? [])]
          .filter((value): value is string => Boolean(value))
          .some(value => normalizeSearchText(value).includes(normalizedQuery))
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
    const escaped = this.query.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
    return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
  }
}
