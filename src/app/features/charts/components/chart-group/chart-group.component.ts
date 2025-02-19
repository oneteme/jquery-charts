import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ChartProvider, XaxisType, YaxisType } from '@oneteme/jquery-core';

import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';

hljs.registerLanguage('typescript', typescript);

@Component({
  selector: 'app-chart-group',
  template: `
    <div class="chart-group">
      <div class="chart-group__header">
        <div class="divider"></div>
        <h3>{{ title }}</h3>
        <div class="divider"></div>
      </div>
      <div class="chart-grid">
        <ng-container *ngFor="let row of rows">
          <div class="chart-container" *ngFor="let chart of row">
            <chart [type]="type" [config]="chart.config" [data]="chart.data" />
            <div class="code-container">
              <div class="code-header">
                <span>Configuration</span>
                <button (click)="copyCode(getConfigCode(chart))">
                  Copier
                </button>
              </div>
              <pre><code class="language-typescript" [innerHTML]="getFormattedCode(chart)"></code></pre>
            </div>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styleUrls: ['./chart-group.component.scss']
})
export class ChartGroupComponent implements OnInit, OnChanges {
  @Input() title: string = '';
  @Input() type: string = '';
  @Input() rows: Array<
    Array<{
      config: ChartProvider<XaxisType, YaxisType>;
      data: any[];
    }>
  > = [];

  ngOnInit() {
    console.log('ChartGroup initialized with:', {
      title: this.title,
      type: this.type,
      rows: this.rows
    });
    hljs.highlightAll();
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('ChartGroup changes:', changes);
    if (changes['rows'] && !changes['rows'].firstChange) {
      setTimeout(() => {
        hljs.highlightAll();
      });
    }
    if (changes['rows']) {
      console.log('New chart data:', this.rows);
    }
  }

  getConfigCode(chart: any): string {
    return `{
  data: ${JSON.stringify(chart.data, null, 2)},
  config: ${JSON.stringify(chart.config, null, 2)}
}`;
  }

  getFormattedCode(chart: any): string {
    const code = this.getConfigCode(chart);
    return hljs.highlight(code, { language: 'typescript' }).value;
  }

  copyCode(code: string) {
    navigator.clipboard.writeText(code);
  }
}