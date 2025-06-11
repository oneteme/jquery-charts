import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChartComponent as ApexChartComponent } from '@oneteme/jquery-apexcharts';
import { ChartComponent as HighchartsComponent } from './../../../../projects/oneteme/jquery-highcharts/src/public-api';
import { ChartProvider, ChartType, field } from '@oneteme/jquery-core';
import { mapChartData } from 'src/app/data/chart/map-chart.data';

@Component({
  selector: 'app-basic-test',
  templateUrl: './basic-test.component.html',
  styleUrls: ['./basic-test.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ApexChartComponent, HighchartsComponent],
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
  isSimpleChart = false;
  dataDelay = 200;

  // Types de graphiques regroupés par catégorie
  readonly chartTypes = {
    simple: ['pie', 'donut', 'polar', 'radar', 'radialBar', 'funnel', 'pyramid', 'radialBar'] as ChartType[],
    complex: ['bar', 'column', 'columnpyramid', 'line', 'area', 'spline', 'areaspline', 'columnrange', 'arearange', 'areasplinerange', 'scatter', 'bubble', 'heatmap', 'treemap'] as ChartType[],
    map: ['map'] as ChartType[] };

  // Configuration de base commune pour tous les graphiques
  private readonly baseConfig = {
    options: {
      // Tout ce qu'on veut en commun pour tous les graphiques
      legend: { position: 'bottom' },
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

      { category: 'Catégorie A', value: 60 },
      { category: 'Catégorie B', value: 50 },
      { category: 'Catégorie C', value: 20 },
      { category: 'Catégorie D', value: 15 },
      { category: 'Catégorie E', value: 10 },
    ],
    complex: [
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
    ],
  };

  // Accesseurs pour rétrocompatibilité avec le template
  get simpleChartTypes(): ChartType[] {
    return this.chartTypes.simple;
  }
  get complexChartTypes(): ChartType[] {
    return this.chartTypes.complex;
  }
  get mapChartType():  ChartType[] {
    return this.chartTypes.map;
  }

  ngOnInit(): void {
    this.loadChartData();
  }  // Charge les données du graphique en fonction du type sélectionné
  loadChartData(): void {
    // Réinitialisation complète des données et configuration
    this.chartData = [];
    // Nettoyer les données GeoJSON spécifiques aux cartes si on passe à un autre type
    const isMapChart = this.chartTypes.map.includes(this.chartType);
    if (!isMapChart && (window as any).Highcharts?.maps?.['custom/france-regions']) {
      console.log('Nettoyage des données GeoJSON car on passe à un graphique non-map');
      delete (window as any).Highcharts.maps['custom/france-regions'];
    }

    setTimeout(() => {
      // Extract nested ternary into separate logic
      let chartMode: 'simple' | 'complex' | 'map';
      if (isMapChart) {
        chartMode = 'map';
      } else if (this.isSimpleChart) {
        chartMode = 'simple';
      } else {
        chartMode = 'complex';
      }

      this.configureChart(chartMode);
    }, this.dataDelay);
  }

  // Configure un graphique selon son type
  private configureChart(mode: 'simple' | 'complex' | 'map'): void {
    const isSimple = mode === 'simple';
    const isMap = mode === 'map';

    if (isMap) {
      // Configuration pour les graphiques map
      this.chartConfig = mapChartData.config;
      this.chartData = [...mapChartData.data];
      this.loadGeoJsonData();
    } else {
      // Configuration pour les graphiques simple/complex existants
      this.chartConfig = {
        ...this.baseConfig,
        title: isSimple ? 'Répartition par catégorie' : 'Performance par mois',
        subtitle: 'Données 2025',
        ...(isSimple ? {} : { xtitle: 'Mois', ytitle: 'Valeur', stacked: false }),
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
    }
  }
  // Charge les données GeoJSON pour les cartes
  private async loadGeoJsonData(): Promise<void> {
    try {
      console.log('Chargement des données GeoJSON...');
      const response = await fetch('assets/france-geojson/regions-version-simplifiee.geojson');
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const geoJsonData = await response.json();
      console.log('Données GeoJSON chargées:', geoJsonData);

      // Injecte les données GeoJSON dans Highcharts.maps
      if ((window as any).Highcharts) {
        (window as any).Highcharts.maps = (window as any).Highcharts.maps ?? {};
        (window as any).Highcharts.maps['custom/france-regions'] = geoJsonData;
        console.log('Données GeoJSON injectées dans Highcharts.maps');

        // Mise à jour de la configuration pour utiliser la carte
        this.chartConfig = {
          ...this.chartConfig,
          options: {
            ...this.chartConfig.options,
            chart: {
              ...this.chartConfig.options?.chart,
              map: 'custom/france-regions'
            }
          }
        };
        console.log('Configuration de carte mise à jour:', this.chartConfig);
      } else {
        console.error('Highcharts non disponible sur window');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données GeoJSON:', error);
    }
  }
  // Méthode appelée quand le type de graphique change dans le select
  changeChartType(): void {
    const isMapChart = this.chartTypes.map.includes(this.chartType);
    this.isSimpleChart = !isMapChart && this.chartTypes.simple.includes(this.chartType);
    this.loadChartData();
  }

  // Bascule entre graphique simple et complexe
  toggleChartComplexity(): void {
    this.isSimpleChart = !this.isSimpleChart;
    this.chartType = this.isSimpleChart ? 'pie' : 'column';
    this.loadChartData();
  }

  // Force le rechargement des données
  reloadData(): void {
    this.loadChartData();
  }

  // affiche ou non le panneau de contrôle
  toggleControlPanel(): void {
    this.isPanelExpanded = !this.isPanelExpanded;
  }
}
