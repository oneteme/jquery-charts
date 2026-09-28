import { CommonModule } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlicePanelComponent, SliceConfig } from '@oneteme/jquery-table';
import { ChartProvider, field } from '@oneteme/jquery-core';
import { ChartComponent } from '@oneteme/jquery-highcharts';

interface Task {
  id: string;
  title: string;
  status: 'À faire' | 'En cours' | 'Terminé';
  owner: string;
  priority: 'Faible' | 'Moyenne' | 'Haute';
}

interface OwnerStat {
  owner: string;
  done: number;
  inProgress: number;
  backlog: number;
}

@Component({
  selector: 'app-slice-chart',
  standalone: true,
  imports: [CommonModule, RouterLink, SlicePanelComponent, ChartComponent],
  templateUrl: './slice-chart.component.html',
  styleUrls: ['./slice-chart.component.scss'],
})
export class SliceChartComponent implements AfterViewInit {

  readonly codeTabs = [
    { key: 'ts', label: 'TS' },
    { key: 'html', label: 'HTML' },
    { key: 'scss', label: 'SCSS' },
  ] as const;

  activeCodeTab: 'ts' | 'html' | 'scss' = 'ts';

  readonly tasks: Task[] = [
    { id: 'T-01', title: 'Refonte authentification', status: 'Terminé', owner: 'Amine',          priority: 'Haute'   },
    { id: 'T-02', title: 'Tableau de bord v2',       status: 'En cours', owner: 'Fufu',           priority: 'Haute'   },
    { id: 'T-03', title: 'Correction pagination',    status: 'Terminé', owner: 'Youssef Senior', priority: 'Moyenne' },
    { id: 'T-04', title: 'Écrire les tests',          status: 'À faire', owner: 'Amine',          priority: 'Faible'  },
    { id: 'T-05', title: 'Déployer la recette',       status: 'En cours', owner: 'Youssef',        priority: 'Haute'   },
    { id: 'T-06', title: 'Passerelle API',            status: 'À faire', owner: 'Youssef Senior', priority: 'Moyenne' },
    { id: 'T-07', title: 'Revue UX',                  status: 'Terminé', owner: 'Fufu',           priority: 'Faible'  },
    { id: 'T-08', title: 'Migration SQL',             status: 'En cours', owner: 'Amine',          priority: 'Haute'   },
    { id: 'T-09', title: 'Mise en place monitoring',  status: 'À faire', owner: 'Youssef',        priority: 'Moyenne' },
    { id: 'T-10', title: 'Documentation API',         status: 'Terminé', owner: 'Youssef Senior', priority: 'Faible'  },
    { id: 'T-11', title: 'Chaîne CI/CD',              status: 'En cours', owner: 'Fufu',           priority: 'Haute'   },
    { id: 'T-12', title: 'Audit sécurité',            status: 'À faire', owner: 'Youssef',        priority: 'Haute'   },
  ];

  readonly sliceConfigs: SliceConfig<Task>[] = [
    { title: 'Statut',   columnKey: 'status'   },
    { title: 'Priorité', columnKey: 'priority' },
  ];

  // Config Highcharts — statique, définie une seule fois
  readonly chartConfig: ChartProvider<string, number> = {
    title: 'Tickets par développeur',
    stacked: true,
    series: [
      { data: { x: field('owner'), y: field('done') },       name: 'Terminé', color: '#176b72' },
      { data: { x: field('owner'), y: field('inProgress') }, name: 'En cours', color: '#bc5b35' },
      { data: { x: field('owner'), y: field('backlog') },   name: 'À faire', color: '#9aadb0' },
    ],
    options: { yAxis: { allowDecimals: false } } as any,
  };

  sliceCollapsed = false;
  activeSliceKeys: string[][] = [];

  chartData: OwnerStat[] = this.buildChartData(this.tasks);


  ngAfterViewInit(): void {
    setTimeout(() => { this.chartData = [...this.chartData]; });
  }

  onFilterChange(filterFn: (row: Task) => boolean): void {
    this.chartData = this.buildChartData(this.tasks.filter(filterFn));
  }

  onActiveKeysChange(keys: string[][]): void {
    this.activeSliceKeys = keys;
  }

  get activeFilterLabels(): string[] {
    return this.activeSliceKeys.flat();
  }

  selectCodeTab(tab: 'ts' | 'html' | 'scss'): void {
    this.activeCodeTab = tab;
  }

  get activeCode(): string {
    switch (this.activeCodeTab) {
      case 'html':
        return this.codeHtml;
      case 'scss':
        return this.codeScss;
      default:
        return this.codeTs;
    }
  }

  private buildChartData(filtered: Task[]): OwnerStat[] {
    const owners = [...new Set(this.tasks.map(t => t.owner))].sort((a, b) => a.localeCompare(b));
    return owners.map(owner => {
      const ownerTasks = filtered.filter(t => t.owner === owner);
      return {
        owner,
        done:       ownerTasks.filter(t => t.status === 'Terminé').length,
        inProgress: ownerTasks.filter(t => t.status === 'En cours').length,
        backlog:    ownerTasks.filter(t => t.status === 'À faire').length,
      };
    });
  }

  readonly codeTs = `// my.component.ts
import { AfterViewInit, Component } from '@angular/core';
import { SliceConfig, SlicePanelComponent } from '@oneteme/jquery-table';
import { ChartProvider, field } from '@oneteme/jquery-core';
import { ChartComponent } from '@oneteme/jquery-highcharts';

interface Task {
  status: 'À faire' | 'En cours' | 'Terminé';
  owner: string;
  priority: 'Faible' | 'Moyenne' | 'Haute';
}

interface OwnerStat { owner: string; done: number; inProgress: number; backlog: number; }

@Component({
  standalone: true,
  imports: [SlicePanelComponent, ChartComponent],
  templateUrl: './my.component.html',
  styleUrls: ['./my.component.scss'],
})
export class MyComponent implements AfterViewInit {

  readonly tasks: Task[] = [ /* ... vos données */ ];

  readonly sliceConfigs: SliceConfig<Task>[] = [
    { title: 'Statut',   columnKey: 'status'   },
    { title: 'Priorité', columnKey: 'priority' },
  ];

  // Config Highcharts — statique, définie une seule fois
  readonly chartConfig: ChartProvider<string, number> = {
    title: 'Tickets par développeur',
    stacked: true,
    series: [
      { data: { x: field('owner'), y: field('done') },       name: 'Terminé', color: '#176b72' },
      { data: { x: field('owner'), y: field('inProgress') }, name: 'En cours', color: '#bc5b35' },
      { data: { x: field('owner'), y: field('backlog') },   name: 'À faire', color: '#9aadb0' },
    ],
    options: { yAxis: { allowDecimals: false } } as any,
  };

  sliceCollapsed = false;

  chartData: OwnerStat[] = this.buildChartData(this.tasks);

  onFilterChange(filterFn: (row: Task) => boolean): void {
    this.chartData = this.buildChartData(this.tasks.filter(filterFn));
  }

  private buildChartData(filtered: Task[]): OwnerStat[] {
    const owners = [...new Set(this.tasks.map(t => t.owner))];
    return owners.map(owner => {
      const ownerTasks = filtered.filter(t => t.owner === owner);
      return {
        owner,
        done:       ownerTasks.filter(t => t.status === 'Terminé').length,
        inProgress: ownerTasks.filter(t => t.status === 'En cours').length,
        backlog:    ownerTasks.filter(t => t.status === 'À faire').length,
      };
    });
  }
}`;

  readonly codeHtml = `<!-- my.component.html -->
<div class="layout">

  <slice-panel
    [sliceConfigs]="sliceConfigs"
    [data]="tasks"
    [showCounts]="false"
    [alwaysShow]="true"
    (filterChange)="onFilterChange($event)"
  ></slice-panel>

  <div class="chart-area">
    <chart type="bar"
      [config]="chartConfig"
      [data]="chartData"
    ></chart>
  </div>

</div>`;

  readonly codeScss = `/* my.component.scss */
:host {
  display: flex;
  flex-direction: column;
  height: 100%;         /* parent doit fournir une hauteur */
}

.layout {
  display: flex;
  flex: 1 1 0;
  min-height: 0;
  border: 1px solid #d8e4e4;
  overflow: hidden;
}

/* slice-panel a :host display:block => c'est un vrai flex-item */
slice-panel {
  flex: 0 0 200px;
  height: 100%;
  border-right: 1px solid #e2e8f0;
}

.chart-area {
  flex: 1 1 0;
  min-width: 0;
  height: 100%;
}`;
}

