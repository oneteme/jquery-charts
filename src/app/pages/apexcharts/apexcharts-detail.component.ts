import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ChartComponent as ApexChartComponent } from '@oneteme/jquery-apexcharts';
import { APEXCHARTS_EXAMPLES } from 'src/app/data/chart/apexcharts-examples.data';
import { ChartType } from '@oneteme/jquery-core';
import { Subscription } from 'rxjs';

interface ApexSection { id: string; label: string; type: ChartType; exampleKey: string; }

const SECTIONS: ApexSection[] = [
  { id: 'pie',         label: 'Pie',               type: 'pie',         exampleKey: 'pieExample'         },
  { id: 'donut',       label: 'Donut',             type: 'donut',       exampleKey: 'donutExample'       },
  { id: 'polar',       label: 'Polar',             type: 'polar',       exampleKey: 'polarExample'       },
  { id: 'radar',       label: 'Radar',             type: 'radar',       exampleKey: 'radarExample'       },
  { id: 'radial',      label: 'Radial Bar',        type: 'radial',      exampleKey: 'radialExample'      },
  { id: 'line',        label: 'Line',              type: 'line',        exampleKey: 'lineExample'        },
  { id: 'area',        label: 'Area',              type: 'area',        exampleKey: 'areaExample'        },
  { id: 'bar',         label: 'Bar (horizontal)',  type: 'bar',         exampleKey: 'barExample'         },
  { id: 'column',      label: 'Column (vertical)', type: 'column',      exampleKey: 'columnExample'      },
  { id: 'heatmap',     label: 'Heatmap',           type: 'heatmap',     exampleKey: 'heatmapExample'     },
  { id: 'treemap',     label: 'Treemap',           type: 'treemap',     exampleKey: 'treemapExample'     },
  { id: 'funnel',      label: 'Funnel',            type: 'funnel',      exampleKey: 'funnelExample'      },
  { id: 'pyramid',     label: 'Pyramid',           type: 'pyramid',     exampleKey: 'pyramidExample'     },
  { id: 'rangeBar',    label: 'Range Bar (Gantt)', type: 'rangeBar',    exampleKey: 'rangeBarExample'    },
  { id: 'rangeColumn', label: 'Range Column',      type: 'rangeColumn', exampleKey: 'rangeColumnExample' },
  { id: 'rangeArea',   label: 'Range Area',        type: 'rangeArea',   exampleKey: 'rangeAreaExample'   },
];

@Component({
  standalone: true,
  imports: [CommonModule, ApexChartComponent, RouterLink],
  selector: 'app-apexcharts-detail',
  template: `
    <div class="apexcharts-page">
      <div class="detail-nav" *ngIf="section">
        <a routerLink="/charts/apexcharts" class="back-link">← Tous les types</a>
        <span class="detail-title">{{ section.label }}</span>
        <div class="prev-next">
          <a *ngIf="prev" [routerLink]="['/charts/apexcharts', prev.id]" class="nav-btn">‹ {{ prev.label }}</a>
          <a *ngIf="next" [routerLink]="['/charts/apexcharts', next.id]" class="nav-btn">{{ next.label }} ›</a>
        </div>
      </div>
      <div class="charts-grid single-card" *ngIf="section">
        <div class="chart-wrapper">
          <div class="chart-label">{{ section!.label }}</div>
          <chart
            class="chart-component"
            [type]="section!.type"
            [config]="currentConfig"
            [data]="currentData"
          ></chart>
          <button class="code-toggle" (click)="toggleCode()" aria-label="Voir le code">
            <img src="assets/icons/code.svg" class="code-icon" alt="code" />
            <span class="tooltip">Voir le code</span>
          </button>
          <div class="code-block" [class.open]="isCodeOpen">
            <pre><code [innerHTML]="highlightedCode"></code></pre>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./apexcharts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApexChartsDetailComponent implements OnInit, OnDestroy {
  section: ApexSection | null = null;
  prev: ApexSection | null = null;
  next: ApexSection | null = null;
  currentConfig: any = null;
  currentData: any = null;
  isCodeOpen = false;
  highlightedCode = '';

  private paramSub: Subscription | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.paramSub = this.route.paramMap.subscribe(params => {
      const type = params.get('type');
      const idx = SECTIONS.findIndex(s => s.id === type);
      if (idx === -1) { this.router.navigate(['/charts/apexcharts']); return; }
      this.section       = SECTIONS[idx];
      this.prev          = idx > 0 ? SECTIONS[idx - 1] : null;
      this.next          = idx < SECTIONS.length - 1 ? SECTIONS[idx + 1] : null;
      const example      = (APEXCHARTS_EXAMPLES as any)[this.section.exampleKey];
      this.currentConfig = example?.config;
      this.currentData   = example?.data;
      this.isCodeOpen    = false;
      this.highlightedCode = this._buildCode(this.section.type, this.section.exampleKey);
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy() { this.paramSub?.unsubscribe(); }

  toggleCode() { this.isCodeOpen = !this.isCodeOpen; this.cdr.markForCheck(); }

  private _buildCode(type: ChartType, exampleKey: string): string {
    const example = (APEXCHARTS_EXAMPLES as any)[exampleKey];
    if (!example) return '';
    const fv = (val: any, indent = 0): string => {
      if (val === null) return 'null';
      if (val === undefined) return 'undefined';
      if (typeof val === 'function') {
        const str = val.toString();
        const m  = str.match(/field\(['"](\w+)['"]\)/);           if (m)  return `field('${m[1]}')`;
        const mr = str.match(/rangeFields\(['"](\w+)['"],\s*['"](\w+)['"]\)/); if (mr) return `rangeFields('${mr[1]}', '${mr[2]}')`;
        return str;
      }
      if (Array.isArray(val)) {
        if (!val.length) return '[]';
        const pad = ' '.repeat(indent + 2);
        return `[\n${val.map(v => `${pad}${fv(v, indent + 2)}`).join(',\n')}\n${' '.repeat(indent)}]`;
      }
      if (typeof val === 'object') {
        const entries = Object.entries(val);
        if (!entries.length) return '{}';
        const pad = ' '.repeat(indent + 2);
        return `{\n${entries.map(([k, v]) => `${pad}${k}: ${fv(v, indent + 2)}`).join(',\n')}\n${' '.repeat(indent)}}`;
      }
      return typeof val === 'string' ? `'${val}'` : String(val);
    };
    let code = `// Données\nconst data = ${fv(example.data)};\n\n`;
    code    += `// Configuration\nconst config = ${fv(example.config)};\n\n`;
    code    += `// Template HTML\n<chart\n  type="${type}"\n  [config]="config"\n  [data]="data"\n></chart>`;
    return this._highlight(code);
  }

  private _highlight(code: string): string {
    const e = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return e
      .replace(/(\/\/.*)/g,                              '<span class="comment">$1</span>')
      .replace(/\b(const|let|var|function|return)\b/g,   '<span class="keyword">$1</span>')
      .replace(/('[^']*')/g,                             '<span class="string">$1</span>')
      .replace(/\b(\d+(\.\d+)?)\b/g,                    '<span class="number">$1</span>')
      .replace(/&lt;chart/g,                             '<span class="tag">&lt;chart</span>')
      .replace(/&lt;\/chart&gt;/g,                       '<span class="tag">&lt;/chart&gt;</span>')
      .replace(/(type|config|data)=/g,                   '<span class="attr">$1</span>=')
      .replace(/\b(field|rangeFields|values|joinFields)\b/g, '<span class="fn">$1</span>');
  }
}
