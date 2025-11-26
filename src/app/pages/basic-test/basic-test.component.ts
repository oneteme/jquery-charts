import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ChartProvider, ChartType, field } from '@oneteme/jquery-core';
import { ApexChartTestComponent } from './apexcharts-chart-test/apexcharts-chart-test.component';
import { HighchartsTestComponent } from './highcharts-test/highcharts-test.component';
import { mapChartConfig, mapChartData } from './highcharts-test/map-test-data';

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
  chartType: ChartType = 'pie';
  chartConfig: ChartProvider<string, number>;
  chartData: any[] = [];
  isLoadingData = false;
  isPanelVisible = false;
  useSimpleData = true;

  chartLibrary: 'apexcharts' | 'highcharts' = 'highcharts';
  dataDelay = 0;

  // Types de graphiques possibles pour tester la compatibilité des transformations
  // possibleTypes: ChartType[] = ['bar', 'line', 'pie', 'map'];

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

  private readonly simpleData = [
    { team: 'Équipe A', value: 58 },
    { team: 'Équipe B', value: 85 },
    { team: 'Équipe C', value: 42 },
    { team: 'Équipe D', value: 12 },
    { team: 'Équipe E', value: 60 },
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

  ngOnInit(): void {
    this.loadChartData();
  }

  loadChartData(): void {
    this.isLoadingData = true;
    this.chartData = [];

    // Simuler un délai de chargement
    setTimeout(() => {
      // Configuration spéciale pour les maps
      if (this.chartType === 'map') {
        this.chartConfig = { ...mapChartConfig };
        this.chartData = [...mapChartData];
        console.log('Chargement des données MAP:', this.chartData);
      } else if (this.useSimpleData) {
        this.chartConfig = { ...this.simpleConfig };
        this.chartData = [...this.simpleData];
        console.log('Chargement des données SIMPLES:', this.chartData);
      } else {
        this.chartConfig = { ...this.complexConfig };
        this.chartData = [...this.complexData];
        console.log('Chargement des données COMPLEXES:', this.chartData);
      }

      console.log('Config utilisée:', this.chartConfig);
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

  toggleDataType(): void {
    this.useSimpleData = !this.useSimpleData;
    console.log(
      'Toggle Data Type - Mode:',
      this.useSimpleData ? 'SIMPLE' : 'COMPLEX'
    );
    this.loadChartData();
  }

  setDataType(isSimple: boolean): void {
    if (this.useSimpleData !== isSimple) {
      this.useSimpleData = isSimple;
      console.log(
        'Set Data Type - Mode:',
        this.useSimpleData ? 'SIMPLE' : 'COMPLEX'
      );
      this.loadChartData();
    }
  }

  getCurrentMode(): string {
    return this.useSimpleData
      ? 'Simple (name/value)'
      : 'Complex (x/y multi-séries)';
  }

  toggleChartLibrary(): void {
    this.chartLibrary =
      this.chartLibrary === 'apexcharts' ? 'highcharts' : 'apexcharts';
  }

  getCurrentLibraryName(): string {
    return this.chartLibrary === 'apexcharts' ? 'ApexCharts' : 'Highcharts';
  }
}
