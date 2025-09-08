import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Import conditionnel - utilisez soit ApexCharts soit Highcharts à la fois, pas les deux
import { ChartComponent as ApexChartComponent } from '@oneteme/jquery-apexcharts';
// import { ChartComponent as HighchartsChartComponent } from '@oneteme/jquery-highcharts';

import { ChartProvider, ChartType, field } from '@oneteme/jquery-core';

@Component({
  selector: 'app-basic-test',
  templateUrl: './basic-test.component.html',
  styleUrls: ['./basic-test.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule,
    ApexChartComponent, // Décommentez pour tester jquery-Apexcharts (mais commentez HighchartsChartComponent)
    // HighchartsChartComponent, // Décommentez pour tester jquery-Highcharts (mais commentez ApexChartComponent)
  ],
})
export class BasicTestComponent implements OnInit {
  // Référence au composant de graphique
  // @ViewChild('chart') chart: HighchartsChartComponent<string, number>;
  @ViewChild('chart') chart: ApexChartComponent<string, number>;

  // Configuration du graphique
  chartType: ChartType = 'line';
  chartConfig: ChartProvider<string, number>;
  chartData: any[] = [];
  isSimpleChart = false;
  isComboChart = false;
  isPanelVisible = false;

  dataDelay = 100;

  // Configuration de loading (simplifiée)
  loadingConfig = {};

  // Types de graphiques regroupés par catégorie
  readonly chartTypes = { simple: ['pie','donut','polar','radar','radarArea','radialBar','funnel','pyramid'] as ChartType[], complex: ['bar','column','columnpyramid','line','area','spline','areaspline','columnrange','arearange','areasplinerange','scatter','bubble','heatmap','treemap'] as ChartType[] };

  // Config de base commune pour tous les graphs
  private readonly baseConfig = {
    options: {
      // Tout ce qu'on veut en commun
      legend: { enabled: true, position: 'bottom' },
      tooltip: { enabled: true },
      exporting: {
        enabled: true,
        buttons: {
          contextButton: {
            enabled: false,
            // menuItems: ['downloadPNG', 'downloadJPEG', 'downloadPDF', 'downloadSVG']
          },
        },
      },
      plotOptions: { series: { dataLabels: { enabled: true } } },
      chart: {
        zoom: {
          enabled: true,
          type: 'x',
          autoScaleYaxis: true,
        },
        toolbar: {
          show: true,
          tools: {
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            // reset: true,
            // download: true
          },
        },
      },
    },
  };

  // Données pour les deux types de graphiques
  private readonly chartData$ = {
    simple: [
      // { category: 'Catégorie A', value: 30 },
      // { category: 'Catégorie B', value: 25 },
      // { category: 'Catégorie C', value: 20 },
      // { category: 'Catégorie D', value: 15 },
      // { category: 'Catégorie E', value: 10 },

      // Total pas égal à 100 pour test les %
      { category: 'Catégorie A', value: 60 },
      { category: 'Catégorie B', value: 50 },
      { category: 'Catégorie C', value: 20 },
      { category: 'Catégorie D', value: 15 },
      { category: 'Catégorie E', value: 10 },
    ],
    complex: [
      // Données complex
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

      // Données pour les graphs type range
      // { month: 'Jan', team: 'Équipe A', value: [-2, 8] },
      // { month: 'Fév', team: 'Équipe A', value: [-1, 11] },
      // { month: 'Mar', team: 'Équipe A', value: [2, 15] },
      // { month: 'Avr', team: 'Équipe A', value: [5, 19] },
      // { month: 'Mai', team: 'Équipe A', value: [9, 24] },
      // { month: 'Juin', team: 'Équipe A', value: [13, 28] },
      // { month: 'Juil', team: 'Équipe A', value: [15, 32] },
      // { month: 'Aoû', team: 'Équipe A', value: [14, 30] },
      // { month: 'Sep', team: 'Équipe A', value: [10, 25] },
      // { month: 'Oct', team: 'Équipe A', value: [6, 18] },
      // { month: 'Nov', team: 'Équipe A', value: [2, 12] },
      // { month: 'Déc', team: 'Équipe A', value: [-1, 9] },

      // { month: 'Jan', team: 'Équipe B', value: [1, 12] },
      // { month: 'Fév', team: 'Équipe B', value: [3, 15] },
      // { month: 'Mar', team: 'Équipe B', value: [5, 18] },
      // { month: 'Avr', team: 'Équipe B', value: [8, 22] },
      // { month: 'Mai', team: 'Équipe B', value: [12, 28] },
      // { month: 'Juin', team: 'Équipe B', value: [16, 32] },
      // { month: 'Juil', team: 'Équipe B', value: [18, 35] },
      // { month: 'Aoû', team: 'Équipe B', value: [17, 33] },
      // { month: 'Sep', team: 'Équipe B', value: [14, 29] },
      // { month: 'Oct', team: 'Équipe B', value: [9, 24] },
      // { month: 'Nov', team: 'Équipe B', value: [5, 16] },
      // { month: 'Déc', team: 'Équipe B', value: [2, 13] },

      // { month: 'Jan', team: 'Équipe C', value: [-5, 5] },
      // { month: 'Fév', team: 'Équipe C', value: [-3, 8] },
      // { month: 'Mar', team: 'Équipe C', value: [0, 12] },
      // { month: 'Avr', team: 'Équipe C', value: [3, 16] },
      // { month: 'Mai', team: 'Équipe C', value: [7, 21] },
      // { month: 'Juin', team: 'Équipe C', value: [10, 25] },
      // { month: 'Juil', team: 'Équipe C', value: [12, 28] },
      // { month: 'Aoû', team: 'Équipe C', value: [11, 26] },
      // { month: 'Sep', team: 'Équipe C', value: [8, 22] },
      // { month: 'Oct', team: 'Équipe C', value: [4, 17] },
      // { month: 'Nov', team: 'Équipe C', value: [0, 10] },
      // { month: 'Déc', team: 'Équipe C', value: [-4, 6] },
    ],
    // Données pour les graphiques boxplot
    boxplot: [
      { category: 'Q1 2024', low: 12, q1: 18, median: 23, q3: 28, high: 35 },
      { category: 'Q2 2024', low: 15, q1: 22, median: 27, q3: 32, high: 38 },
      { category: 'Q3 2024', low: 10, q1: 16, median: 25, q3: 30, high: 40 },
      { category: 'Q4 2024', low: 14, q1: 20, median: 29, q3: 34, high: 42 },
      { category: 'Q1 2025', low: 16, q1: 24, median: 31, q3: 36, high: 45 },
    ],
  };

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
    this.chartData = [];

    setTimeout(() => {
      let chartMode: 'simple' | 'complex' | 'boxplot';
      if (this.chartType === 'boxplot') {
        chartMode = 'boxplot';
      } else if (this.isSimpleChart) {
        chartMode = 'simple';
      } else {
        chartMode = 'complex';
      }

      this.configureChart(chartMode);
    }, this.dataDelay);
  }

  private configureChart(
    mode: 'simple' | 'complex' | 'boxplot'
  ): void {
    const isSimple = mode === 'simple';
    const isBoxplot = mode === 'boxplot';

    if (isBoxplot) {
      this.configureBoxplotChart();
    } else {
      // Configuration spéciale pour tester la propriété 'visible'
      this.chartConfig = {
        ...this.baseConfig,
        title: isSimple ? 'Répartition' : 'Performance par équipe',
        subtitle: 'Démonstration fonctionnelle',
        ...(isSimple
          ? {}
          : { xtitle: 'Mois', ytitle: 'Valeur', stacked: false }),
        series: isSimple
          ? [
              {
                data: {
                  x: field('category'),
                  y: field('value'),
                },
              },
            ]
          : [
              {
                name: field('team'),
                data: {
                  x: field('month'),
                  y: field('value'),
                },
                color: field('color'),
                visible: field('visible'),
                // visible: false
              },
              // série statique pour test
              {
                name: 'Équipe D',
                data: { x: field('month'), y: field('value') },
                color: '#ff0000',
                visible: false
              }
            ],
        showToolbar: true,
      };

      // Charger les données filtrées par équipe pour les graphiques complexes
      if (isSimple) {
        this.chartData = [...this.chartData$[mode]];
      } else {
        // Pour les graphiques complexes, ajouter les propriétés color et visible aux données
        const complexData = this.chartData$[mode].map((item) => ({
          ...item,
          color:
            item.team === 'Équipe A'
              ? '#4CAF50'
              : item.team === 'Équipe B'
              ? '#FF9800'
              : item.team === 'Équipe C'
              ? '#2196F3'
              : '#a5a5a5',
          visible: item.team !== 'Équipe B', // équipe B masquée par défaut
        }));

        // Ajouter des données pour la série statique
        const staticSeriesData = [
          { month: 'Jan', team: 'Équipe D', value: 76 },
          { month: 'Fév', team: 'Équipe D', value: 85 },
          { month: 'Mar', team: 'Équipe D', value: 101 },
          { month: 'Avr', team: 'Équipe D', value: 98 },
          { month: 'Mai', team: 'Équipe D', value: 87 },
          { month: 'Juin', team: 'Équipe D', value: 105 }
        ];

        this.chartData = [...complexData, ...staticSeriesData];
      }

      // Pour tester "Aucune donnée", commenter / décommenter
      // this.chartData = [];
    }
  }

  private configureBoxplotChart(): void {
    this.chartConfig = {
      ...this.baseConfig,
      title: 'Analyse de Distribution - Boxplot',
      subtitle: 'Distribution des valeurs par quartile',
      xtitle: 'Période',
      ytitle: 'Valeur',
      series: [
        {
          name: 'Distribution',
          data: {
            x: field('category'),
            y: field('low'),
          },
        },
      ],
      showToolbar: true,
    };

    this.chartData = [...this.chartData$.boxplot];
  }

  changeChartType(): void {
    const isBoxplotChart = this.chartType === 'boxplot';
    this.isSimpleChart =
      !isBoxplotChart && this.chartTypes.simple.includes(this.chartType);
    this.loadChartData();
  }

  toggleChartComplexity(): void {
    this.isSimpleChart = !this.isSimpleChart;
    this.chartType = this.isSimpleChart ? 'pie' : 'column';
    this.loadChartData();
  }

  reloadData(): void {
    this.loadChartData();
  }

  getCurrentMode(): string {
    if (this.chartType === 'boxplot') return 'boxplot';
    return this.isSimpleChart ? 'simple' : 'complex';
  }

  toggleControlPanel(): void {
    this.isPanelVisible = !this.isPanelVisible;
  }
}
