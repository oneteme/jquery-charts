import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface ChartTypeItem { id: string; label: string; }
interface LibItem { key: string; label: string; route: string; types: ChartTypeItem[]; }

@Component({
  selector: 'app-sidebar',
  template: `
    <button class="menu-toggle" (click)="toggleMenu()" [class.active]="isMenuOpen" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>

    <div class="sidebar" [class.open]="isMenuOpen">

      <div class="sidebar-section">
        <span class="sidebar-section-label">Composants</span>
        <ul>
          <li [class.active]="isTableRoute()" (click)="goToTable()">jquery-table</li>
        </ul>
      </div>

      <div class="sidebar-section">
        <span class="sidebar-section-label">Graphiques</span>
        <ul>
          <li *ngFor="let lib of libs" [class.active]="isChartsLib(lib.key)">
            <span class="lib-name" (click)="goToLib(lib)">{{ lib.label }}</span>
            <span class="lib-arrow" [class.open]="isExpanded(lib.key)" (click)="toggleExpand(lib, $event)">›</span>
            <ul class="sub-list" *ngIf="isExpanded(lib.key)" (click)="$event.stopPropagation()">
              <li
                *ngFor="let type of lib.types; trackBy: trackByFn"
                [class.active]="isActiveType(lib, type)"
                (click)="goToType(lib, type, $event)"
              >{{ type.label }}</li>
            </ul>
          </li>
        </ul>
      </div>

    </div>

    <div class="overlay" *ngIf="isMenuOpen" (click)="toggleMenu()"></div>
  `,
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent implements OnInit {
  isMenuOpen = false;
  expandedLibs = new Set<string>();

  readonly libs: LibItem[] = [
    {
      key: 'echarts', label: 'jquery-echarts', route: '/charts/echarts',
      types: [
        { id: 'bar',         label: 'Bar'          },
        { id: 'column',      label: 'Column'       },
        { id: 'line',        label: 'Line'         },
        { id: 'spline',      label: 'Spline'       },
        { id: 'area',        label: 'Area'         },
        { id: 'pie',         label: 'Pie'          },
        { id: 'donut',       label: 'Donut'        },
        { id: 'scatter',     label: 'Scatter'      },
        { id: 'bubble',      label: 'Bubble'       },
        { id: 'heatmap',     label: 'Heatmap'      },
        { id: 'treemap',     label: 'Treemap'      },
        { id: 'funnel',      label: 'Funnel'       },
        { id: 'pyramid',     label: 'Pyramid'      },
        { id: 'radar',       label: 'Radar'        },
        { id: 'rangeBar',    label: 'Range Bar'    },
        { id: 'rangeColumn', label: 'Range Column' },
      ]
    },
    {
      key: 'highcharts', label: 'jquery-highcharts', route: '/charts/highcharts',
      types: [
        { id: 'line',            label: 'Line'             },
        { id: 'spline',          label: 'Spline'           },
        { id: 'areaspline',      label: 'Area Spline'      },
        { id: 'area',            label: 'Area'             },
        { id: 'bar',             label: 'Bar'              },
        { id: 'column',          label: 'Column'           },
        { id: 'scatter',         label: 'Scatter'          },
        { id: 'pie',             label: 'Pie'              },
        { id: 'donut',           label: 'Donut'            },
        { id: 'funnel',          label: 'Funnel'           },
        { id: 'pyramid',         label: 'Pyramid'          },
        { id: 'polar',           label: 'Polar'            },
        { id: 'radar',           label: 'Radar'            },
        { id: 'radarArea',       label: 'Radar Area'       },
        { id: 'radialBar',       label: 'Radial Bar'       },
        { id: 'bubble',          label: 'Bubble'           },
        { id: 'heatmap',         label: 'Heatmap'          },
        { id: 'treemap',         label: 'Treemap'          },
        { id: 'columnrange',     label: 'Column Range'     },
        { id: 'arearange',       label: 'Area Range'       },
        { id: 'areasplinerange', label: 'Area Spline Range'},
      ]
    },
    {
      key: 'apexcharts', label: 'jquery-apexcharts', route: '/charts/apexcharts',
      types: [
        { id: 'pie',         label: 'Pie'          },
        { id: 'donut',       label: 'Donut'        },
        { id: 'polar',       label: 'Polar'        },
        { id: 'radar',       label: 'Radar'        },
        { id: 'radial',      label: 'Radial Bar'   },
        { id: 'line',        label: 'Line'         },
        { id: 'area',        label: 'Area'         },
        { id: 'bar',         label: 'Bar'          },
        { id: 'column',      label: 'Column'       },
        { id: 'heatmap',     label: 'Heatmap'      },
        { id: 'treemap',     label: 'Treemap'      },
        { id: 'funnel',      label: 'Funnel'       },
        { id: 'pyramid',     label: 'Pyramid'      },
        { id: 'rangeBar',    label: 'Range Bar'    },
        { id: 'rangeColumn', label: 'Range Column' },
        { id: 'rangeArea',   label: 'Range Area'   },
      ]
    },
  ];

  constructor(
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Init : expand lib active au démarrage
    this.libs.forEach(lib => { if (this.isChartsLib(lib.key)) this.expandedLibs.add(lib.key); });

    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      // Auto-expand la lib active (sans replier les autres)
      this.libs.forEach(lib => { if (this.isChartsLib(lib.key)) this.expandedLibs.add(lib.key); });
      this.cdr.markForCheck();
    });
  }

  trackByFn(_index: number, item: ChartTypeItem): string { return item.id; }

  isTableRoute(): boolean { return this.router.url.startsWith('/table'); }

  isChartsLib(key: string): boolean { return this.router.url.startsWith(`/charts/${key}`); }

  isExpanded(key: string): boolean { return this.expandedLibs.has(key); }

  isActiveType(lib: LibItem, type: ChartTypeItem): boolean {
    return this.router.url === `${lib.route}/${type.id}`;
  }

  goToTable() {
    this.router.navigate(['/table']);
    if (this.isMenuOpen) this.toggleMenu();
  }

  goToLib(lib: LibItem) {
    this.expandedLibs.clear();
    this.expandedLibs.add(lib.key);
    this.router.navigate([lib.route]);
    if (this.isMenuOpen) this.toggleMenu();
  }

  toggleExpand(lib: LibItem, event: Event) {
    event.stopPropagation();
    if (this.expandedLibs.has(lib.key)) {
      this.expandedLibs.delete(lib.key);
    } else {
      this.expandedLibs.clear();
      this.expandedLibs.add(lib.key);
    }
    this.cdr.markForCheck();
  }

  goToType(lib: LibItem, type: ChartTypeItem, event: Event) {
    event.stopPropagation();
    this.router.navigate([lib.route, type.id]);
    if (this.isMenuOpen) this.toggleMenu();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    this.cdr.markForCheck();
  }
}
