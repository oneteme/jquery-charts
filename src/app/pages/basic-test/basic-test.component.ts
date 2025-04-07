import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartComponent } from '@oneteme/jquery-apexcharts';
import { ChartProvider, field } from '@oneteme/jquery-core';
import { BarChartDirective } from '@oneteme/jquery-apexcharts';

interface TestData {
  label: string;
  value1: number;
  value2: number;
}
@Component({
  selector: 'app-basic-test',
  standalone: true,
  imports: [CommonModule, ChartComponent, FormsModule],
  // imports: [CommonModule, BarChartDirective, FormsModule],
  templateUrl: './basic-test.component.html',
  styleUrls: ['./basic-test.component.scss'],
})
export class BasicTestComponent implements OnInit {
  chartData: TestData[] = [];
  chartConfig: any;
  chartType = 'bar'; // Type de graphique par défaut
  dataDelay = 100; // Délai par défaut en ms

  maille = 'label';

  // Données locales qui simuleront des données distantes
  localData: TestData[] = [
    { label: 'Janvier', value1: 4500, value2: 2800 },
    { label: 'Février', value1: 5200, value2: 3100 },
    { label: 'Mars', value1: 4800, value2: 2600 },
    { label: 'Avril', value1: 5800, value2: 3400 },
    { label: 'Mai', value1: 6000, value2: 3700 },
    { label: 'Juin', value1: 6500, value2: 4200 },
    { label: 'Juillet', value1: 7200, value2: 4500 },
    { label: 'Août', value1: 7800, value2: 4800 },
    { label: 'Septembre', value1: 7300, value2: 4300 },
    { label: 'Octobre', value1: 6900, value2: 4100 },
  ];

  constructor() {}

  ngOnInit() {

    // Initialiser la configuration du graphique
    this.initChartConfig();

    // Simuler un chargement de données distantes
    this.loadData();
  }

  /**
   * Initialise la configuration du graphique
   */
  initChartConfig() {
    this.chartConfig = {
      title: 'Évolution mensuelle',
      series: [
        {
          data: { x: field(this.maille), y: field('value1') },
          name: "Chiffre d'affaires",
        },
        {
          data: { x: field(this.maille), y: field('value2') },
          name: 'Bénéfice',
        },
      ],
      showToolbar : true,
      options: {
        chart: {
          height: 400,
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '60%',
            distributed: false,
            borderRadius: 2,
          },
        },
        dataLabels: {
          dropShadow: {
            enabled: true,
          },
          formatter: (val: number) =>
            `${val.toLocaleString('fr-FR').replace(/,/g, ' ')}`,
          enabled: true,
          position: 'top',
        },
        xaxis: {
          type: 'category',
          labels: {
            rotate: 0,
            formatter: (v: string) => this.formatting(v),
          },
        },
        yaxis: {
          tickAmount: 5,
          min: 0,
          max: 15000,
          forceNiceScale: true,
          axisBorder: {
            show: true,
          },
          axisTicks: {
            show: true,
          },
          labels: {
            formatter: (val: number) =>
              `${val.toLocaleString('fr-FR').replace(/,/g, ' ')}`,
          },
        },
        grid: {
          borderColor: '#e7e7e7',
          row: {
            colors: ['#f3f3f3', 'transparent'],
            opacity: 0.5,
          },
        },
        legend: {
          position: 'bottom',
          horizontalAlign: 'center',
          offsetY: -5,
        },
      },
      stacked: true,
    };
  }

  /**
   * Gestion des événements personnalisés de la directive
   */
  onChartEvent(event: string) {
    console.log('Événement du graphique reçu:', event);
  }

  /**
   * Charge les données avec un délai configurable
   * pour simuler une requête API distante
   */
  loadData() {
    // S'assurer que les données soient vides pendant le chargement
    this.chartData = [];

    console.log(`🔍 DÉBUT CHARGEMENT - délai initialisé à ${this.dataDelay}ms`);

  // Simuler un délai réseau
  setTimeout(() => {
    console.log(`✔️ DONNÉES REÇUES après ${this.dataDelay}ms`);

      // Charger les données locales après le délai
      this.chartData = [
        { label: 'Janvier', value1: 4500, value2: 2800 },
        { label: 'Février', value1: 5200, value2: 3100 },
        { label: 'Mars', value1: 4800, value2: 2600 },
        { label: 'Avril', value1: 5800, value2: 3400 },
        { label: 'Mai', value1: 6000, value2: 3700 },
        { label: 'Juin', value1: 6500, value2: 4200 },
        { label: 'Juillet', value1: 7200, value2: 4500 },
        { label: 'Août', value1: 7800, value2: 4800 },
        { label: 'Septembre', value1: 7300, value2: 4300 },
        { label: 'Octobre', value1: 6900, value2: 4100 },
        { label: 'Novembre', value1: 7100, value2: 4400 },
        { label: 'Décembre', value1: 7400, value2: 4700 },
      ];

      console.log('➡️ Chargement des données terminé', this.localData);
    }, this.dataDelay);
  }

  /**
   * Formatage personnalisé pour les étiquettes
   */
  formatting(value: string): string {
    return value;
  }
}
