import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChartComponent as ApexChartComponent } from '@oneteme/jquery-apexcharts';
import { HighchartsComponent } from './../../../../projects/oneteme/jquery-highcharts/src/public-api';
import { ChartProvider, ChartType, field } from '@oneteme/jquery-core';

@Component({
  selector: 'app-basic-test',
  templateUrl: './basic-test.component.html',
  styleUrls: ['./basic-test.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ApexChartComponent,
    HighchartsComponent,
  ],
})
export class BasicTestComponent implements OnInit {
  // Références aux composants de graphiques
  @ViewChild('apexChart') apexChart: ApexChartComponent<string, number>;
  @ViewChild('highchart') highchart: HighchartsComponent<string, number>;

  // Contrôle de l'affichage
  showApexChart = false;
  showHighcharts = true;
  layoutMode: 'row' | 'column' = 'column';
  isPanelExpanded = false;

  // Configuration du graphique
  chartType: ChartType = 'pie';
  chartConfig: ChartProvider<string, number>;
  chartData: any[] = [];
  isLoading: boolean = true;
  isSimpleChart = true;
  dataDelay = 500;

  // Exemples de données pour graphiques simples (pie, donut)
  private readonly simpleData = [
    { category: 'Catégorie A', value: 30 },
    { category: 'Catégorie B', value: 25 },
    { category: 'Catégorie C', value: 20 },
    { category: 'Catégorie D', value: 15 },
    { category: 'Catégorie E', value: 10 },
  ];

  // Exemples de données pour graphiques complexes (bar, column, line)
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

  constructor() {}

  ngOnInit(): void {
    this.loadChartData();
  }

  /**
   * Charge les données du graphique en fonction du type sélectionné
   */
  loadChartData(): void {
    // Simuler un délai de chargement
    this.chartData = [];

    setTimeout(() => {
      if (this.isSimpleChart) {
        this.configureSimpleChart();
      } else {
        this.configureComplexChart();
      }
    }, this.dataDelay);
  }

  /**
   * Configure un graphique simple (pie, donut)
   */
  private configureSimpleChart(): void {
    // Configuration pour les graphiques de type pie/donut
    this.chartConfig = {
      title: 'Répartition par catégorie',
      subtitle: 'Données 2025',
      showToolbar: true,
      series: [
        {
          data: {
            x: field('category'),
            y: field('value'),
          },
        },
      ],
      options: {
        legend: {
          position: 'bottom',
        },
        tooltip: {
          enabled: true,
        },
      },
    };

    this.chartData = [...this.simpleData];
  }

  /**
   * Configure un graphique complexe (line, bar, column)
   */
  private configureComplexChart(): void {
    // Configuration pour les graphiques avec séries multiples
    this.chartConfig = {
      title: 'Performance par mois',
      subtitle: 'Données 2025',
      showToolbar: true,
      xtitle: 'Mois',
      ytitle: 'Valeur',
      stacked: false,
      series: [
        {
          name: field('team'),
          data: {
            x: field('month'),
            y: field('value'),
          },
        },
      ],
      options: {
        legend: {
          position: 'bottom',
        },
        tooltip: {
          enabled: true,
        },
      },
    };

    this.chartData = [...this.complexData];
  }

  /**
   * Change le type de graphique (simple)
   */
  setSimpleChartType(type: ChartType): void {
    this.chartType = type;
    this.loadChartData();
  }

  /**
   * Change le type de graphique (complexe)
   */
  setComplexChartType(type: ChartType): void {
    this.chartType = type;
    this.loadChartData();
  }

  /**
   * Bascule entre graphique simple et complexe
   */
  toggleChartComplexity(): void {
    this.isSimpleChart = !this.isSimpleChart;

    if (this.isSimpleChart) {
      this.chartType = 'pie';
    } else {
      this.chartType = 'column';
    }

    this.loadChartData();
  }

  /**
   * Force le rechargement des données
   */
  reloadData(): void {
    this.loadChartData();
  }

  /**
   * Bascule l'état du panneau de contrôle
   */
  toggleControlPanel(): void {
    this.isPanelExpanded = !this.isPanelExpanded;
  }
}
