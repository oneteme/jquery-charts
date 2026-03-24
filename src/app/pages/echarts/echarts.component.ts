import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { ChartComponent } from '@oneteme/jquery-echarts';
import { ECHARTS_EXAMPLES } from 'src/app/data/chart/echarts-examples.data';
import { ChartType } from '@oneteme/jquery-core';

interface EChartsSection {
  id: string;
  label: string;
  type: ChartType;
  exampleKey: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, ChartComponent],
  selector: 'app-echarts',
  templateUrl: './echarts.component.html',
  styleUrls: ['./echarts.component.scss'],
})
export class EChartsComponent implements OnInit {

  readonly examples = ECHARTS_EXAMPLES;

  readonly sections: EChartsSection[] = [
    { id: 'bar', label: 'Bar (horizontal)', type: 'bar', exampleKey: 'barExample' },
    { id: 'column', label: 'Column (vertical)', type: 'column', exampleKey: 'columnExample' },
    { id: 'line', label: 'Line', type: 'line', exampleKey: 'lineExample' },
    { id: 'spline', label: 'Spline', type: 'spline', exampleKey: 'splineExample' },
    { id: 'area', label: 'Area', type: 'area', exampleKey: 'areaExample' },
    { id: 'pie', label: 'Pie', type: 'pie', exampleKey: 'pieExample' },
    { id: 'donut', label: 'Donut', type: 'donut', exampleKey: 'donutExample' },
    { id: 'scatter', label: 'Scatter', type: 'scatter', exampleKey: 'scatterExample' },
    { id: 'bubble', label: 'Bubble', type: 'bubble', exampleKey: 'bubbleExample' },
    { id: 'heatmap', label: 'Heatmap', type: 'heatmap', exampleKey: 'heatmapExample' },
    { id: 'treemap', label: 'Treemap', type: 'treemap', exampleKey: 'treemapExample' },
    { id: 'funnel', label: 'Funnel', type: 'funnel', exampleKey: 'funnelExample' },
    { id: 'pyramid', label: 'Pyramid', type: 'pyramid', exampleKey: 'pyramidExample' },
    { id: 'radar', label: 'Radar', type: 'radar', exampleKey: 'radarExample' },
    { id: 'rangeBar', label: 'Range Bar (Gantt)', type: 'rangeBar', exampleKey: 'rangeBarExample' },
    { id: 'rangeColumn', label: 'Range Column', type: 'rangeColumn', exampleKey: 'rangeColumnExample' },
  ];

  openCodeBlocks: Record<string, boolean> = {};
  activeCodeBlock: string | null = null;

  ngOnInit(): void {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.code-block') && !target.closest('.code-toggle')) {
      this.openCodeBlocks = {};
      this.activeCodeBlock = null;
    }
  }

  toggleCode(id: string, event: Event): void {
    event.stopPropagation();
    if (this.activeCodeBlock && this.activeCodeBlock !== id) {
      this.openCodeBlocks[this.activeCodeBlock] = false;
    }
    this.openCodeBlocks[id] = !this.openCodeBlocks[id];
    this.activeCodeBlock = this.openCodeBlocks[id] ? id : null;
  }

  isCodeOpen(id: string): boolean {
    return this.openCodeBlocks[id] ?? false;
  }

  getHighlightedCode(type: ChartType, exampleKey: string): string {
    const example = this.examples[exampleKey];
    if (!example) return '';

    const formatValue = (val: any, indent = 0): string => {
      if (val === null) return 'null';
      if (val === undefined) return 'undefined';
      if (typeof val === 'function') {
        const str = val.toString();
        // Simplifie les DataProviders pour la lisibilité
        const match = str.match(/field\(['"](\w+)['"]\)/);
        if (match) return `field('${match[1]}')`;
        return str;
      }
      if (Array.isArray(val)) {
        if (val.length === 0) return '[]';
        const pad = ' '.repeat(indent + 2);
        const items = val.map(v => `${pad}${formatValue(v, indent + 2)}`).join(',\n');
        return `[\n${items}\n${' '.repeat(indent)}]`;
      }
      if (typeof val === 'object') {
        const entries = Object.entries(val);
        if (entries.length === 0) return '{}';
        const pad = ' '.repeat(indent + 2);
        const props = entries.map(([k, v]) => `${pad}${k}: ${formatValue(v, indent + 2)}`).join(',\n');
        return `{\n${props}\n${' '.repeat(indent)}}`;
      }
      if (typeof val === 'string') return `'${val}'`;
      return String(val);
    };

    let code = `// Données\nconst data = ${formatValue(example.data)};\n\n`;
    code    += `// Configuration\nconst config = ${formatValue(example.config)};\n\n`;
    code    += `// Template HTML\n<echarts-chart\n  type="${type}"\n  [config]="config"\n  [data]="data"\n></echarts-chart>`;

    return this._highlightCode(code);
  }

  private _highlightCode(code: string): string {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return escaped
      .replace(/(\/\/.*)/g, '<span class="comment">$1</span>')
      .replace(/\b(const|let|var|function|return)\b/g, '<span class="keyword">$1</span>')
      .replace(/('[^']*')/g, '<span class="string">$1</span>')
      .replace(/\b(\d+(\.\d+)?)\b/g, '<span class="number">$1</span>')
      .replace(/&lt;echarts-chart/g, '<span class="tag">&lt;echarts-chart</span>')
      .replace(/&lt;\/echarts-chart&gt;/g, '<span class="tag">&lt;/echarts-chart&gt;</span>')
      .replace(/(type|config|data)=/g, '<span class="attr">$1</span>=')
      .replace(/\b(field|rangeFields|values|joinFields)\b/g, '<span class="fn">$1</span>');
  }
}
