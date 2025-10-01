import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ChartProvider, ChartType, field } from '@oneteme/jquery-core';
import { ApexChartTestComponent } from './apexcharts-chart-test/apexcharts-chart-test.component';
import { HighchartsTestComponent } from './highcharts-test/highcharts-test.component';

@Component({
  selector: 'app-basic-test',
  templateUrl: './basic-test.component.html',
  styleUrls: ['./basic-test.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ApexChartTestComponent,
    HighchartsTestComponent,
  ],
})
export class BasicTestComponent implements OnInit {
  // Configuration du graphique
  chartType: ChartType = 'line';
  chartConfig: ChartProvider<string, number>;
  chartData: any[] = [];
  isSimpleChart = false;
  isPanelVisible = false;
  isLoadingData = false;

  chartLibrary: 'apexcharts' | 'highcharts' = 'highcharts';
  dataDelay = 100;

  // Types de graphiques regroupés par catégorie
  readonly chartTypes = {
    simple: ['pie', 'donut', 'funnel'] as ChartType[],
    complex: ['bar', 'column', 'line', 'area', 'spline'] as ChartType[],
  };

  // Configuration unique pour les deux bibliothèques
  private readonly simpleConfig: ChartProvider<string, number> = {
    title: 'Répartition par équipe',
    subtitle: 'Ceci est un sous titre',
    series: [{ data: { x: field('team'), y: field('value') } }],
    showToolbar: true,
  };

  private readonly complexConfig: ChartProvider<string, number> = {
    title: 'Performance par équipe',
    subtitle: 'Ceci est un sous titre',
    xtitle: 'Mois',
    ytitle: 'Valeur',
    stacked: false,
    series: [
      { name: field('team'), data: { x: field('month'), y: field('value') } },
    ],
    showToolbar: true,
  };

  // Données simplifiées - seulement 3 équipes
  private readonly simpleData = [
    { team: 'Équipe A', value: 58 },
    { team: 'Équipe B', value: 85 },
    { team: 'Équipe C', value: 42 },
  ];

  private readonly complexData = [
    { month: 'Jan', team: 'Équipe A', value: 44 },
    { month: 'Fév', team: 'Équipe A', value: 55 },
    { month: 'Mar', team: 'Équipe A', value: 57 },
    { month: 'Avr', team: 'Équipe A', value: 56 },
    { month: 'Mai', team: 'Équipe A', value: 61 },
    { month: 'Juin', team: 'Équipe A', value: 58 },

    { month: 'Jan', team: 'Équipe B', value: 76 },
    { month: 'Fév', team: 'Équipe B', value: 85 },
    { month: 'Mar', team: 'Équipe B', value: 101 },
    { month: 'Avr', team: 'Équipe B', value: 98 },
    { month: 'Mai', team: 'Équipe B', value: 87 },
    { month: 'Juin', team: 'Équipe B', value: 105 },

    { month: 'Jan', team: 'Équipe C', value: 35 },
    { month: 'Fév', team: 'Équipe C', value: 41 },
    { month: 'Mar', team: 'Équipe C', value: 36 },
    { month: 'Avr', team: 'Équipe C', value: 33 },
    { month: 'Mai', team: 'Équipe C', value: 42 },
    { month: 'Juin', team: 'Équipe C', value: 30 },
  ];

  get simpleChartTypes(): ChartType[] {
    return this.chartTypes.simple;
  }

  get complexChartTypes(): ChartType[] {
    return this.chartTypes.complex;
  }

  ngOnInit(): void {
    this.loadChartData();
  }

  loadChartData(): void {
    this.isLoadingData = true;
    this.chartData = []; // Vider les données pendant le chargement

    // Simuler un délai de chargement
    setTimeout(() => {
      this.isSimpleChart = this.chartTypes.simple.includes(this.chartType);

      if (this.isSimpleChart) {
        this.chartConfig = this.simpleConfig;
        this.chartData = [...this.simpleData];
      } else {
        this.chartConfig = this.complexConfig;
        this.chartData = [...this.complexData];
      }

      this.isLoadingData = false;
    }, this.dataDelay);
  }

  changeChartType(): void {
    this.loadChartData();
  }

  reloadData(): void {
    this.loadChartData();
  }

  toggleControlPanel(): void {
    this.isPanelVisible = !this.isPanelVisible;
  }

  getCurrentMode(): string {
    return this.isSimpleChart ? 'simple' : 'complex';
  }

  toggleChartLibrary(): void {
    this.chartLibrary =
      this.chartLibrary === 'apexcharts' ? 'highcharts' : 'apexcharts';
  }

  getCurrentLibraryName(): string {
    return this.chartLibrary === 'apexcharts' ? 'ApexCharts' : 'Highcharts';
  }
}
