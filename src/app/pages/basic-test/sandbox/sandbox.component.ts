import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ChartProvider, ChartType, field } from '@oneteme/jquery-core';
import { ApexChartTestComponent } from '../apexcharts-chart-test/apexcharts-chart-test.component';
import { HighchartsTestComponent } from '../highcharts-test/highcharts-test.component';

@Component({
  selector: 'app-sandbox',
  templateUrl: './sandbox.component.html',
  styleUrls: ['./sandbox.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ApexChartTestComponent,
    HighchartsTestComponent,
  ],
})
export class SandboxComponent implements OnInit {
  chartType: ChartType = 'pie';
  chartConfig: ChartProvider<string, number>;
  chartData: any[] = [];
  isLoadingData = false;
  chartLibrary: 'apexcharts' | 'highcharts' = 'apexcharts';

  // Editeur JSON
  dataInput: string = '';
  configInput: string = '';
  jsonError: string = '';

  // Exemples de données
  private readonly exampleSimpleData = [
    { team: 'Équipe A', value: 58 },
    { team: 'Équipe B', value: 85 },
    { team: 'Équipe C', value: 42 },
    { team: 'Équipe D', value: 12 },
    { team: 'Équipe E', value: 60 },
  ];

  private readonly exampleComplexData = [
    { month: 'Jan', team: 'Équipe A', value: 44 },
    { month: 'Fév', team: 'Équipe A', value: 55 },
    { month: 'Mar', team: 'Équipe A', value: 57 },
    { month: 'Jan', team: 'Équipe B', value: 76 },
    { month: 'Fév', team: 'Équipe B', value: 85 },
    { month: 'Mar', team: 'Équipe B', value: 101 },
  ];

  // Configurations sérialisables (sans fonctions field())
  private readonly exampleSimpleConfigJson = {
    title: 'Mon graphique',
    subtitle: 'Sous-titre personnalisé',
    series: [{ data: { x: 'team', y: 'value' } }],
    showToolbar: true,
  };

  private readonly exampleComplexConfigJson = {
    title: 'Performance par équipe',
    subtitle: 'Données mensuelles',
    xtitle: 'Mois',
    ytitle: 'Valeur',
    stacked: false,
    series: [
      { name: 'team', data: { x: 'month', y: 'value' } },
    ],
    showToolbar: true,
  };

  // Configurations réelles avec field()
  private readonly exampleSimpleConfig: ChartProvider<string, number> = {
    title: 'Mon graphique',
    subtitle: 'Sous-titre personnalisé',
    series: [{ data: { x: field('team'), y: field('value') } }],
    showToolbar: true,
  };

  private readonly exampleComplexConfig: ChartProvider<string, number> = {
    title: 'Performance par équipe',
    subtitle: 'Données mensuelles',
    xtitle: 'Mois',
    ytitle: 'Valeur',
    stacked: false,
    series: [
      { name: field('team'), data: { x: field('month'), y: field('value') } },
    ],
    showToolbar: true,
  };

  ngOnInit(): void {
    this.loadExample('simple');
  }

  loadExample(type: 'simple' | 'complex'): void {
    if (type === 'simple') {
      this.chartType = 'pie';
      this.dataInput = JSON.stringify(this.exampleSimpleData, null, 2);
      this.configInput = JSON.stringify(this.exampleSimpleConfigJson, null, 2);
    } else {
      this.chartType = 'line';
      this.dataInput = JSON.stringify(this.exampleComplexData, null, 2);
      this.configInput = JSON.stringify(this.exampleComplexConfigJson, null, 2);
    }
    this.applyChanges();
  }

  applyChanges(): void {
    this.jsonError = '';

    try {
      // Parser la configuration
      const parsedConfig = JSON.parse(this.configInput);

      // Parser les données
      const parsedData = JSON.parse(this.dataInput);

      if (!Array.isArray(parsedData)) {
        throw new Error('Les données doivent être un tableau');
      }

      if (parsedData.length === 0) {
        throw new Error('Le tableau de données ne peut pas être vide');
      }

      // Validation de la configuration
      if (typeof parsedConfig !== 'object' || parsedConfig === null) {
        throw new Error('La configuration doit être un objet');
      }

      // Convertir les chaînes de caractères en fonctions field()
      const convertedConfig = this.convertConfigFieldsToFunctions(parsedConfig);

      // Appliquer les changements
      this.isLoadingData = true;
      this.chartData = [];

      // Petit délai pour montrer le loading
      setTimeout(() => {
        this.chartConfig = convertedConfig;
        this.chartData = parsedData;
        this.isLoadingData = false;
        console.log('Configuration appliquée:', this.chartConfig);
        console.log('Données appliquées:', this.chartData);
      }, 100);

    } catch (error: any) {
      this.jsonError = `Erreur JSON : ${error.message || 'Format invalide'}`;
      console.error('Erreur lors du parsing:', error);
    }
  }

  private convertConfigFieldsToFunctions(config: any): ChartProvider<string, number> {
    const converted = { ...config };

    // Convertir les series
    if (converted.series && Array.isArray(converted.series)) {
      converted.series = converted.series.map((serie: any) => {
        const convertedSerie = { ...serie };

        // Convertir name si c'est une chaîne
        if (typeof convertedSerie.name === 'string') {
          convertedSerie.name = field(convertedSerie.name);
        }

        // Convertir data.x et data.y
        if (convertedSerie.data) {
          const convertedData = { ...convertedSerie.data };
          if (typeof convertedData.x === 'string') {
            convertedData.x = field(convertedData.x);
          }
          if (typeof convertedData.y === 'string') {
            convertedData.y = field(convertedData.y);
          }
          if (typeof convertedData.z === 'string') {
            convertedData.z = field(convertedData.z);
          }
          convertedSerie.data = convertedData;
        }

        return convertedSerie;
      });
    }

    return converted as ChartProvider<string, number>;
  }

  toggleChartLibrary(): void {
    this.chartLibrary =
      this.chartLibrary === 'apexcharts' ? 'highcharts' : 'apexcharts';
  }

  getCurrentLibraryName(): string {
    return this.chartLibrary === 'apexcharts' ? 'ApexCharts' : 'Highcharts';
  }

  resetToDefault(): void {
    this.loadExample('simple');
  }
}
