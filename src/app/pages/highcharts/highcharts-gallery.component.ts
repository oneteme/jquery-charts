import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { ChartComponent } from '@oneteme/jquery-highcharts';
import { HIGHCHARTS_EXAMPLES } from 'src/app/data/chart/highcharts-examples.data';
import { ChartType } from '@oneteme/jquery-core';

interface HighchartsSection {
  id: string;
  label: string;
  type: ChartType;
  exampleKey: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, ChartComponent],
  selector: 'app-highcharts-gallery',
  templateUrl: './highcharts-gallery.component.html',
  styleUrls: ['./highcharts-gallery.component.scss'],
})
export class HighchartsGalleryComponent {

  readonly examples = HIGHCHARTS_EXAMPLES;

  readonly sections: HighchartsSection[] = [
    // Standard XY
    { id: 'line',              label: 'Line',                type: 'line',              exampleKey: 'lineExample'              },
    { id: 'spline',            label: 'Spline',              type: 'spline',            exampleKey: 'splineExample'            },
    { id: 'areaspline',        label: 'Area Spline',         type: 'areaspline',        exampleKey: 'areasplineExample'        },
    { id: 'area',              label: 'Area',                type: 'area',              exampleKey: 'areaExample'              },
    { id: 'bar',               label: 'Bar (horizontal)',    type: 'bar',               exampleKey: 'barExample'               },
    { id: 'column',            label: 'Column (vertical)',   type: 'column',            exampleKey: 'columnExample'            },
    { id: 'scatter',           label: 'Scatter',             type: 'scatter',           exampleKey: 'scatterExample'           },
    // Simple
    { id: 'pie',               label: 'Pie',                 type: 'pie',               exampleKey: 'pieExample'               },
    { id: 'donut',             label: 'Donut',               type: 'donut',             exampleKey: 'donutExample'             },
    { id: 'funnel',            label: 'Funnel',              type: 'funnel',            exampleKey: 'funnelExample'            },
    { id: 'pyramid',           label: 'Pyramid',             type: 'pyramid',           exampleKey: 'pyramidExample'           },
    // Polar / Radar
    { id: 'polar',             label: 'Polar',               type: 'polar',             exampleKey: 'polarExample'             },
    { id: 'radar',             label: 'Radar (Web)',         type: 'radar',             exampleKey: 'radarExample'             },
    { id: 'radarArea',         label: 'Radar Area',          type: 'radarArea',         exampleKey: 'radarAreaExample'         },
    { id: 'radialBar',         label: 'Radial Bar',          type: 'radialBar',         exampleKey: 'radialBarExample'         },
    // Bubble
    { id: 'bubble',            label: 'Bubble',              type: 'bubble',            exampleKey: 'bubbleExample'            },
    // Heatmap / Treemap
    { id: 'heatmap',           label: 'Heatmap',             type: 'heatmap',           exampleKey: 'heatmapExample'           },
    { id: 'treemap',           label: 'Treemap',             type: 'treemap',           exampleKey: 'treemapExample'           },
    // Range
    { id: 'columnrange',       label: 'Column Range',        type: 'columnrange',       exampleKey: 'columnrangeExample'       },
    { id: 'arearange',         label: 'Area Range',          type: 'arearange',         exampleKey: 'arearangeExample'         },
    { id: 'areasplinerange',   label: 'Area Spline Range',   type: 'areasplinerange',   exampleKey: 'areasplinerangeExample'   },
  ];

  openCodeBlocks: Record<string, boolean> = {};
  activeCodeBlock: string | null = null;

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
    const example = (this.examples as any)[exampleKey];
    if (!example) return '';

    const formatValue = (val: any, indent = 0): string => {
      if (val === null) return 'null';
      if (val === undefined) return 'undefined';
      if (typeof val === 'function') {
        const str = val.toString();
        const match = str.match(/field\(['"](\w+)['"]\)/);
        if (match) return `field('${match[1]}')`;
        const matchRange = str.match(/rangeFields\(['"](\w+)['"],\s*['"](\w+)['"]\)/);
        if (matchRange) return `rangeFields('${matchRange[1]}', '${matchRange[2]}')`;
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
    code    += `// Template HTML\n<chart\n  type="${type}"\n  [config]="config"\n  [data]="data"\n></chart>`;

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
      .replace(/&lt;chart/g, '<span class="tag">&lt;chart</span>')
      .replace(/&lt;\/chart&gt;/g, '<span class="tag">&lt;/chart&gt;</span>')
      .replace(/(type|config|data)=/g, '<span class="attr">$1</span>=')
      .replace(/\b(field|rangeFields|values|joinFields)\b/g, '<span class="fn">$1</span>');
  }
}
