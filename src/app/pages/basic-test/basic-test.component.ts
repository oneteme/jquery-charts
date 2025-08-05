import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
// import { ChartComponent as ApexChartComponent } from '@oneteme/jquery-apexcharts';
import { ChartComponent as HighchartsChartComponent } from './../../../../projects/oneteme/jquery-highcharts/src/public-api';
import { ChartProvider, ChartType, field } from '@oneteme/jquery-core';
import { mapChartData } from 'src/app/data/chart/map-chart.data';

@Component({
  selector: 'app-basic-test',
  templateUrl: './basic-test.component.html',
  styleUrls: ['./basic-test.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    // ApexChartComponent,
    HighchartsChartComponent
  ],
})
export class BasicTestComponent implements OnInit {
  // Références aux composants de graphiques
  // @ViewChild('apexChart') apexChart: ApexChartComponent<string, number>;
  @ViewChild('highchart') highchart: HighchartsChartComponent<string, number>;

  // Contrôle de l'affichage
  showApexChart = false;
  showHighcharts = true;
  layoutMode: 'row' | 'column' = 'column';
  isPanelExpanded = false;

  // Configuration du graphique
  chartType: ChartType = 'pie';
  chartConfig: ChartProvider<string, number>;
  chartData: any[] = [];
  isSimpleChart = false;
  isComboChart = false;
  dataDelay = 100;

  // Personnalisation loading
  loadingConfig = {
    // Configuration du loading
    // showText: false,
    // text: 'Chargement en cours...',
    // showSpinner: true,
    // backgroundColor: '#ffffff',
    // textColor: '#000000',
    // spinnerColor: '#ff0000',

    // Configuration "aucune donnée"
    // showNoDataBackground: true,
    // noDataMessage: 'Aucune donnée n\'a été trouvée...',
    // noDataBackgroundColor: '#f2f2f2',
    // noDataBorderColor: '#acacac',
    // noDataTextColor: '#000000',
    // showNoDataIcon: true,
    // noDataIcon: '📈',
  };

  // Types de graphiques regroupés par catégorie
  readonly chartTypes = {
    simple: ['pie', 'donut', 'polar', 'radar', 'radarArea', 'radialBar', 'funnel', 'pyramid'] as ChartType[],
    complex: ['bar', 'column', 'columnpyramid', 'line', 'area', 'spline', 'areaspline', 'columnrange', 'arearange', 'areasplinerange', 'scatter', 'bubble', 'heatmap', 'treemap'] as ChartType[],
    map: ['map'] as ChartType[] };

  // Configuration de base commune pour tous les graphiques
  private readonly baseConfig = {
    options: {
      // Tout ce qu'on veut en commun pour tous les graphiques
      legend: { enabled: false, position: 'bottom' },
      tooltip: { enabled: true },
      exporting: {
        enabled: true,
        buttons: {
          contextButton: {
            enabled: true,
            // menuItems: ['downloadPNG', 'downloadJPEG', 'downloadPDF', 'downloadSVG']
          },
        },
      },
      plotOptions: {
        series: {
          dataLabels: {
            enabled: false,
          }
        }
      }
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
    map: [],
    combo: [
      // Données pour les graphiques combinés scatter + line
      { month: 'Jan', metric: 'Performance', value: 44 },
      { month: 'Fév', metric: 'Performance', value: 55 },
      { month: 'Mar', metric: 'Performance', value: 57 },
      { month: 'Avr', metric: 'Performance', value: 56 },
      { month: 'Mai', metric: 'Performance', value: 61 },
      { month: 'Juin', metric: 'Performance', value: 58 },

      // Points scatter pour anomalies
      { month: 'Jan', metric: 'Anomalies', value: 35 },
      { month: 'Mar', metric: 'Anomalies', value: 42 },
      { month: 'Mai', metric: 'Anomalies', value: 38 },
    ],
  };

  get simpleChartTypes(): ChartType[] {
    return this.chartTypes.simple;
  }
  get complexChartTypes(): ChartType[] {
    return this.chartTypes.complex;
  }
  get mapChartType(): ChartType[] {
    return this.chartTypes.map;
  }

  ngOnInit(): void {
    this.loadChartData();
  }
  loadChartData(): void {
    this.chartData = [];
    const isMapChart = this.chartTypes.map.includes(this.chartType);
    if (
      !isMapChart &&
      (window as any).Highcharts?.maps?.['custom/france-regions']
    ) {
      console.log(
        'Nettoyage des données GeoJSON car on passe à un graphique non-map'
      );
      delete (window as any).Highcharts.maps['custom/france-regions'];
    }

    setTimeout(() => {
      let chartMode: 'simple' | 'complex' | 'map' | 'combo';
      if (this.isComboChart) {
        chartMode = 'combo';
      } else if (isMapChart) {
        chartMode = 'map';
      } else if (this.isSimpleChart) {
        chartMode = 'simple';
      } else {
        chartMode = 'complex';
      }

      this.configureChart(chartMode);
    }, this.dataDelay);
  }

  private configureChart(mode: 'simple' | 'complex' | 'map' | 'combo'): void {
    const isSimple = mode === 'simple';
    const isMap = mode === 'map';
    const isCombo = mode === 'combo';

    if (isMap) {
      this.chartConfig = mapChartData.config;
      this.chartData = [...mapChartData.data];
      this.loadGeoJsonData();
    } else if (isCombo) {
      this.configureComboChart();
    } else {
      this.chartConfig = {
        ...this.baseConfig,
        title: isSimple ? 'Répartition par catégorie' : 'Performance par mois',
        subtitle: 'Données 2025',
        ...(isSimple
          ? {}
          : { xtitle: 'Mois', ytitle: 'Valeur', stacked: false }),
        series: [
          {
            ...(isSimple ? {} : { name: field('team') }),
            data: {
              x: field(isSimple ? 'category' : 'month'),
              y: field('value'),
            },
          },
        ],
        showToolbar: true,
      };

      this.chartData = [...this.chartData$[mode]];

      // Pour tester "Aucune donnée", commenter / décommenter
      // this.chartData = [];
    }
  }

  private configureComboChart(): void {
    this.chartConfig = {
      ...this.baseConfig,
      title: 'Ventes & Objectifs Mensuels',
      subtitle: 'Performance commerciale 2025 - Colonnes (Ventes) + Ligne (Objectifs) + Scatter (Bonus)',
      xtitle: 'Mois',
      ytitle: 'Montant (€)',
      showToolbar: true,
    };

    this.chartData = [
      {
        type: 'column',
        name: 'Ventes Réalisées',
        data: [
          { x: 'Jan', y: 85000 },
          { x: 'Fév', y: 92000 },
          { x: 'Mar', y: 78000 },
          { x: 'Avr', y: 105000 },
          { x: 'Mai', y: 110000 },
          { x: 'Juin', y: 95000 },
          { x: 'Juil', y: 125000 },
          { x: 'Aoû', y: 88000 },
          { x: 'Sep', y: 115000 },
          { x: 'Oct', y: 132000 },
          { x: 'Nov', y: 145000 },
          { x: 'Déc', y: 158000 },
        ],
      },
      {
        type: 'line',
        name: 'Objectif Mensuel',
        data: [
          { x: 'Jan', y: 100000 },
          { x: 'Fév', y: 100000 },
          { x: 'Mar', y: 100000 },
          { x: 'Avr', y: 105000 },
          { x: 'Mai', y: 105000 },
          { x: 'Juin', y: 105000 },
          { x: 'Juil', y: 110000 },
          { x: 'Aoû', y: 110000 },
          { x: 'Sep', y: 110000 },
          { x: 'Oct', y: 115000 },
          { x: 'Nov', y: 115000 },
          { x: 'Déc', y: 120000 },
        ],
      },
      {
        type: 'scatter',
        name: 'Bonus Exceptionnels',
        data: [
          { x: 'Avr', y: 125000 },
          { x: 'Juil', y: 140000 },
          { x: 'Oct', y: 150000 },
          { x: 'Déc', y: 175000 },
        ],
      },
    ];
  }

  private async loadGeoJsonData(): Promise<void> {
    try {
      console.log('Chargement des données GeoJSON...');
      const response = await fetch(
        'assets/france-geojson/regions-version-simplifiee.geojson'
      );
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const geoJsonData = await response.json();
      console.log('Données GeoJSON chargées:', geoJsonData);

      if ((window as any).Highcharts) {
        (window as any).Highcharts.maps = (window as any).Highcharts.maps ?? {};
        (window as any).Highcharts.maps['custom/france-regions'] = geoJsonData;
        console.log('Données GeoJSON injectées dans Highcharts.maps');

        this.chartConfig = {
          ...this.chartConfig,
          options: {
            ...this.chartConfig.options,
            chart: {
              ...this.chartConfig.options?.chart,
              map: 'custom/france-regions',
            },
          },
        };
        console.log('Configuration de carte mise à jour:', this.chartConfig);
      } else {
        console.error('Highcharts non disponible sur window');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données GeoJSON:', error);
    }
  }

  // Méthode pour revenir aux graphiques normaux
  loadNormalChart(): void {
    this.isComboChart = false;
    this.loadChartData();
  }

  // Méthode pour charger les graphiques combinés
  loadComboChart(): void {
    this.isComboChart = true;
    this.isSimpleChart = false;
    this.chartType = 'line'; // Type de base mais les données prévalent
    this.loadChartData();
  }

  changeChartType(): void {
    const isMapChart = this.chartTypes.map.includes(this.chartType);
    this.isSimpleChart =
      !isMapChart && this.chartTypes.simple.includes(this.chartType);
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

  toggleControlPanel(): void {
    this.isPanelExpanded = !this.isPanelExpanded;
  }
}
