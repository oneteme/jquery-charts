import { Component, HostListener, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  PIE_CHART_DATA,
  BAR_CHART_DATA,
  LINE_CHART_DATA,
  TREEMAP_CHART_DATA,
  HEATMAP_CHART_DATA,
  RANGE_CHART_DATA,
  FUNNEL_CHART_DATA,
} from '../../data/chart/_index';
import { ChartTypesService } from 'src/app/core/services/chart-types.service';

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.scss'],
})
export class ChartsComponent implements OnInit {
  selectedChartType: string = 'Pie Chart';
  private readonly chartTypeMap: { [key: string]: string } = {
    pie: 'Pie Chart',
    bar: 'Bar Chart',
    line: 'Line Chart',
    treemap: 'Treemap Chart',
    heatmap: 'Heatmap Chart',
    range: 'Range Chart',
    funnel: 'Funnel Chart',
  };

  pieExample = PIE_CHART_DATA.pieExample;
  pieExample2 = PIE_CHART_DATA.pieExample2;
  pieExample3 = PIE_CHART_DATA.pieExample3;
  pieExample4 = PIE_CHART_DATA.pieExample4;
  pieExample5 = PIE_CHART_DATA.pieExample5;
  pieExample6 = PIE_CHART_DATA.pieExample6;
  pieExample7 = PIE_CHART_DATA.pieExample7;
  pieExample8 = PIE_CHART_DATA.pieExample8;
  pieExample9 = PIE_CHART_DATA.pieExample9;

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

  lineExample = LINE_CHART_DATA.lineExample;
  lineExample2 = LINE_CHART_DATA.lineExample2;
  lineExample3 = LINE_CHART_DATA.lineExample3;
  lineExample4 = LINE_CHART_DATA.lineExample4;
  lineExample5 = LINE_CHART_DATA.lineExample5;
  lineExample6 = LINE_CHART_DATA.lineExample6;
  lineExample7 = LINE_CHART_DATA.lineExample7;
  lineExample8 = LINE_CHART_DATA.lineExample8;
  lineExample9 = LINE_CHART_DATA.lineExample9;

  treemapExample = TREEMAP_CHART_DATA.treemapExample;
  treemapExample2 = TREEMAP_CHART_DATA.treemapExample2;
  treemapExample3 = TREEMAP_CHART_DATA.treemapExample3;
  heatmapExample = HEATMAP_CHART_DATA.heatmapExample;
  rangeExample = RANGE_CHART_DATA.rangeExample;
  funnelExample = FUNNEL_CHART_DATA.funnelExample;

  constructor(
    public router: Router,
    private readonly route: ActivatedRoute,
    private readonly chartTypesService: ChartTypesService
  ) {}

  ngOnInit() {
    this.chartTypesService.getSelectedType().subscribe((type) => {
      this.selectedChartType = type;
    });

    this.route.params.subscribe((params) => {
      const type = params['type'];
      if (type) {
        const fullType = this.chartTypeMap[type] || 'Pie Chart';
        this.chartTypesService.setSelectedType(fullType);
      }
    });
  }

  openCodeBlocks: { [key: string]: boolean } = {};
  activeCodeBlock: number | null = null;

  @HostListener('document:click', ['$event'])
  clickOutside(event: any) {
    const clickedElement = event.target as HTMLElement;
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
    event.stopPropagation();

    if (this.activeCodeBlock !== null && this.activeCodeBlock !== index) {
      this.openCodeBlocks[this.activeCodeBlock] = false;
    }

    this.openCodeBlocks[index] = !this.openCodeBlocks[index];
    this.activeCodeBlock = this.openCodeBlocks[index] ? index : null;
  }

  isCodeOpen(index: number): boolean {
    return this.openCodeBlocks[index] || false;
  }

  getHighlightedCode(example: any): string {
    if (!example) return '';

    const exampleCopy = JSON.parse(JSON.stringify(example));

    let chartType = 'pie';
    if (Object.values(PIE_CHART_DATA).includes(example)) {
      chartType = 'pie';
    } else if (Object.values(BAR_CHART_DATA).includes(example)) {
      chartType = 'bar';
    } else if (Object.values(LINE_CHART_DATA).includes(example)) {
      chartType = 'line';
    } else if (Object.values(TREEMAP_CHART_DATA).includes(example)) {
      chartType = 'treemap';
    } else if (Object.values(HEATMAP_CHART_DATA).includes(example)) {
      chartType = 'heatmap';
    } else if (Object.values(RANGE_CHART_DATA).includes(example)) {
      chartType = 'range';
    } else if (Object.values(FUNNEL_CHART_DATA).includes(example)) {
      chartType = 'funnel';
    }

    const processDataFunctions = (obj: any) => {
      if (!obj) return obj;

      if (Array.isArray(obj)) {
        return obj.map((item) => processDataFunctions(item));
      }

      if (typeof obj === 'object') {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string' && value.includes('&#039;')) {
            result[key] = value.replace(/&#039;/g, "'");
          } else {
            result[key] = processDataFunctions(value);
          }
        }
        return result;
      }

      return obj;
    };

    const preprocessedExample = processDataFunctions(exampleCopy);

    const formatObject = (obj: any, indent = 0): string => {
      if (obj === null) return 'null';
      if (obj === undefined) return 'undefined';

      const padding = ' '.repeat(indent);
      const nestedPadding = ' '.repeat(indent + 2);

      if (Array.isArray(obj)) {
        if (obj.length === 0) return '[]';

        const formattedItems = obj
          .map((item) => `${nestedPadding}${formatObject(item, indent + 2)}`)
          .join(',\n');

        return `[\n${formattedItems}\n${padding}]`;
      }

      if (typeof obj === 'object') {
        if (obj.constructor !== Object) {
          return obj.toString();
        }

        const entries = Object.entries(obj);
        if (entries.length === 0) return '{}';

        if (
          'data' in obj &&
          typeof obj.data === 'object' &&
          Object.keys(obj.data).length === 0
        ) {
          const dataMapping = `{\n${nestedPadding}x: (o) => o.field,\n${nestedPadding}y: (o) => o.count\n${padding}}`;
          const otherEntries = entries.filter(([key]) => key !== 'data');

          const otherProps = otherEntries
            .map(([key, value]) => {
              return `${nestedPadding}${key}: ${formatObject(
                value,
                indent + 2
              )}`;
            })
            .join(',\n');

          return `{\n${nestedPadding}data: ${dataMapping}${
            otherEntries.length > 0 ? ',\n' + otherProps : ''
          }\n${padding}}`;
        }

        const formattedProps = entries
          .map(([key, value]) => {
            return `${nestedPadding}${key}: ${formatObject(value, indent + 2)}`;
          })
          .join(',\n');

        return `{\n${formattedProps}\n${padding}}`;
      }

      if (typeof obj === 'string') {
        return `"${obj}"`;
      }
      return String(obj);
    };

    let code = '// Configuration\n';
    code +=
      'const config = ' + formatObject(preprocessedExample.config) + ';\n\n';
    code += '// Données\n';
    code += 'const data = ' + formatObject(preprocessedExample.data) + ';\n\n';
    code += '// Utilisation\n';

    const usageCode = `<chart
  type="'${chartType}'"
  [config]="config"
  [data]="data"
></chart>`;

    code += usageCode;

    const escapedCode = code
      .replace(/&(?!amp;|lt;|gt;|quot;)/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    const coloredCode = escapedCode
      .replace(/(\/\/.*)/g, '<span class="comment">$1</span>')
      .replace(/&lt;chart/g, '<span class="tag">&lt;chart</span>')
      .replace(/&lt;\/chart&gt;/g, '<span class="tag">&lt;/chart&gt;</span>')
      .replace(
        /\[config\]="config"/g,
        '<span class="tag">[config]="config"</span>'
      )
      .replace(/\[data\]="data"/g, '<span class="tag">[data]="data"</span>')
      .replace(/type="([^"]*)"/g, '<span class="tag">type="$1"</span>')
      .replace(/&gt;/g, '<span class="tag">&gt;</span>')
      .replace(
        /\b(const|let|var|function|return|if|else|for|while|switch|case)\b/g,
        '<span class="keyword">$1</span>'
      )
      .replace(
        /\b(o) =&gt;/g,
        '<span class="function">$1</span><span class="operator"> =&gt;</span>'
      )
      .replace(
        /&quot;([^&]*?)&quot;/g,
        '<span class="string">&quot;$1&quot;</span>'
      )
      .replace(
        /\b(true|false|null|undefined)\b/g,
        '<span class="boolean">$1</span>'
      )
      .replace(/\b(\d+)\b/g, '<span class="number">$1</span>')
      .replace(/\{|\}/g, '<span class="punctuation">$&</span>')
      .replace(/\(|\)/g, '<span class="punctuation">$&</span>')
      .replace(/\[|\]/g, '<span class="punctuation">$&</span>')
      .replace(/:/g, '<span class="punctuation">:</span>')
      .replace(/,/g, '<span class="punctuation">,</span>');

    return coloredCode;
  }
}
