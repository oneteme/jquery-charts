import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  PIE_CHART_DATA,
  BAR_CHART_DATA,
  LINE_CHART_DATA,
  TREEMAP_CHART_DATA,
  HEATMAP_CHART_DATA,
  RANGE_CHART_DATA,
  FUNNEL_CHART_DATA,
} from './data/_index';
import hljs from 'highlight.js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  showSidebar = true;
  selectedChartType: string = 'Pie Chart';

  chartTypes = [
    'Pie Chart',
    'Bar Chart',
    'Line Chart',
    'Treemap Chart',
    'Heatmap Chart',
    'Range Chart',
    'Funnel Chart',
  ];

  // Pie Charts
  pieExample = PIE_CHART_DATA.pieExample;
  pieExample2 = PIE_CHART_DATA.pieExample2;
  pieExample3 = PIE_CHART_DATA.pieExample3;
  pieExample4 = PIE_CHART_DATA.pieExample4;
  pieExample5 = PIE_CHART_DATA.pieExample5;
  pieExample6 = PIE_CHART_DATA.pieExample6;
  pieExample7 = PIE_CHART_DATA.pieExample7;
  pieExample8 = PIE_CHART_DATA.pieExample8;
  pieExample9 = PIE_CHART_DATA.pieExample9;

  // Bar Charts
  barExample = BAR_CHART_DATA.barExample;
  barExample2 = BAR_CHART_DATA.barExample2;
  barExample3 = BAR_CHART_DATA.barExample3;
  barExample4 = BAR_CHART_DATA.barExample4;
  barExample5 = BAR_CHART_DATA.barExample5;
  barExample6 = BAR_CHART_DATA.barExample6;
  barExample7 = BAR_CHART_DATA.barExample7;
  barExample8 = BAR_CHART_DATA.barExample8;
  barExample9 = BAR_CHART_DATA.barExample9;
  barExample10 = BAR_CHART_DATA.barExample10;

  // Line Charts
  lineExample = LINE_CHART_DATA.lineExample;
  lineExample2 = LINE_CHART_DATA.lineExample2;
  lineExample3 = LINE_CHART_DATA.lineExample3;
  lineExample4 = LINE_CHART_DATA.lineExample4;
  lineExample5 = LINE_CHART_DATA.lineExample5;
  lineExample6 = LINE_CHART_DATA.lineExample6;
  lineExample7 = LINE_CHART_DATA.lineExample7;
  lineExample8 = LINE_CHART_DATA.lineExample8;
  lineExample9 = LINE_CHART_DATA.lineExample9;

  // Autres types de graphiques
  treemapExample = TREEMAP_CHART_DATA.treemapExample;
  treemapExample2 = TREEMAP_CHART_DATA.treemapExample2;
  treemapExample3 = TREEMAP_CHART_DATA.treemapExample3;
  heatmapExample = HEATMAP_CHART_DATA.heatmapExample;
  rangeExample = RANGE_CHART_DATA.rangeExample;
  funnelExample = FUNNEL_CHART_DATA.funnelExample;

  constructor(public router: Router) {}

  getHighlightedCode(example: any): string {
    const code = JSON.stringify(example, null, 2)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return hljs.highlight(code, {
      language: 'json',
    }).value;
  }

  ngOnInit() {
    if (this.router.url === '/charts') {
      this.selectedChartType = 'Pie Chart';
    }
  }

  onChartTypeSelected(type: string | null) {
    this.selectedChartType = type;
    if (type) {
      this.router.navigate(['/charts']);
    } else {
      this.router.navigate(['/home']);
    }
  }

  openCodeBlocks: { [key: string]: boolean } = {};

  activeCodeBlock: number | null = null; // track menu actif

  @HostListener('document:click', ['$event'])
  clickOutside(event: any) {
    const clickedElement = event.target as HTMLElement;
    // Vérifie si clic en dehors d'un code-block ou code-toggle
    if (
      !clickedElement.closest('.code-block') &&
      !clickedElement.closest('.code-toggle')
    ) {
      this.closeAllCodeBlocks();
    }
  }

  closeAllCodeBlocks() {
    this.openCodeBlocks = {};
    this.activeCodeBlock = null;
  }

  toggleCode(index: number, event: Event) {
    event.stopPropagation(); // Empêche la propagation du clic

    if (this.activeCodeBlock !== null && this.activeCodeBlock !== index) {
      // Ferme le bloc précédemment ouvert
      this.openCodeBlocks[this.activeCodeBlock] = false;
    }

    this.openCodeBlocks[index] = !this.openCodeBlocks[index];
    this.activeCodeBlock = this.openCodeBlocks[index] ? index : null;
  }

  isCodeOpen(index: number): boolean {
    return this.openCodeBlocks[index] || false;
  }
}
