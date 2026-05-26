import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NgFor } from '@angular/common';

interface LibraryTab {
  label: string;
  path: string;
  description: string;
  badge: string;
}

@Component({
  selector: 'app-charts-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgFor],
  templateUrl: './charts-shell.component.html',
  styleUrls: ['./charts-shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartsShellComponent {
  readonly libraries: LibraryTab[] = [
    { label: 'ECharts',    path: '/charts/echarts',    description: 'Apache ECharts 5',  badge: 'echarts'    },
    { label: 'Highcharts', path: '/charts/highcharts', description: 'Highcharts 11',     badge: 'highcharts' },
    { label: 'ApexCharts', path: '/charts/apexcharts', description: 'ApexCharts 3',      badge: 'apexcharts' },
  ];
}
