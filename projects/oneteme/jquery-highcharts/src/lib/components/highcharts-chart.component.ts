import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  ElementRef,
  Output,
  EventEmitter,
  NgZone,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  ChartProvider,
  ChartType,
  XaxisType,
  YaxisType,
  Coordinate2D,
} from '@oneteme/jquery-core';

// Import des modules Highcharts
import more from 'highcharts/highcharts-more';
import NoDataToDisplay from 'highcharts/modules/no-data-to-display';
import Annotations from 'highcharts/modules/annotations';
import Accessibility from 'highcharts/modules/accessibility';
import Funnel from 'highcharts/modules/funnel';
import Treemap from 'highcharts/modules/treemap';
import Exporting from 'highcharts/modules/exporting';
import * as Highcharts from 'highcharts';

// Import des services et utilitaires
import { HighchartsRenderService } from '../services/highcharts-render.service';
import { HighchartsDataService } from '../services/highcharts-data.service';
import {
  configureTypeSpecificOptions,
  getBaseOptions,
  logDebug,
} from '../utils/chart-utils';

// Initialisation des modules Highcharts
more(Highcharts);
NoDataToDisplay(Highcharts);
Annotations(Highcharts);
Accessibility(Highcharts);
Funnel(Highcharts);
Treemap(Highcharts);
Exporting(Highcharts);

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'highcharts-chart',
  template: `<div
    class="chart-container"
    style="width: 100%; height: 100%;"
  ></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HighchartsComponent<X extends XaxisType, Y extends YaxisType>
  implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
  private chartOptions: Highcharts.Options;
  private initialized = false;
  private optionsInitialized = false;
  private pendingInitialization = false;
  private hasRealData = false;
  private _isLoading = false;
  private dataService: HighchartsDataService<X, Y>;
  private renderService: HighchartsRenderService;

  @Input({ alias: 'type', required: true }) _type: ChartType;
  @Input({ required: true }) config: ChartProvider<X, Y>;
  @Input({ required: true }) data: any[];
  @Input() debug: boolean = false;
  @Output() chartInstance = new EventEmitter<Highcharts.Chart>();

  // Utilisation d'un setter pour isLoading
  @Input()
  set isLoading(value: boolean) {
    this._isLoading = value;
    logDebug(`Setter isLoading appelé avec ${value}`, null, this.debug);

    if (this.renderService?.getChart()) {
      this.renderService.toggleLoading(value);
    }
  }

  get isLoading(): boolean {
    return this._isLoading;
  }

  constructor(private readonly el: ElementRef, private readonly zone: NgZone) {}

  ngOnInit(): void {
    logDebug(
      'ngOnInit démarré',
      { type: this._type, config: this.config },
      this.debug
    );
    this.initialized = true;

    // Initialiser les services
    this.dataService = new HighchartsDataService<X, Y>(this.debug);
    this.renderService = new HighchartsRenderService(
      this.el,
      this.zone,
      this.debug
    );

    // Attendre que les données et la configuration soient disponibles avant d'initialiser les options
    if (this.config && this.data) {
      this.initOptions();
    } else {
      this.pendingInitialization = true;
      logDebug(
        'Initialisation en attente - données ou configuration manquantes',
        null,
        this.debug
      );
    }

    logDebug('ngOnInit terminé', null, this.debug);
  }

  ngAfterViewInit(): void {
    logDebug('ngAfterViewInit démarré', null, this.debug);

    if (this.chartOptions && !this.renderService.getChart()) {
      this.renderChart();
    }

    logDebug('ngAfterViewInit terminé', null, this.debug);
  }

  ngOnChanges(changes: SimpleChanges): void {
    logDebug('ngOnChanges démarré', changes, this.debug);

    // Assurez-vous que les services sont initialisés
    if (!this.dataService || !this.renderService) {
      this.dataService = new HighchartsDataService<X, Y>(this.debug);
      this.renderService = new HighchartsRenderService(
        this.el,
        this.zone,
        this.debug
      );
    }

    // Si c'est la première fois avec des données et config complètes, initialiser
    if (this.pendingInitialization && this.config && this.data) {
      logDebug(
        'Initialisation différée des options avec données complètes',
        null,
        this.debug
      );
      this.pendingInitialization = false;
      this.initOptions();

      // Après l'initialisation différée, créer le graphique si la vue est déjà initialisée
      if (this.el && this.el.nativeElement && !this.renderService.getChart()) {
        this.renderChart();
      }

      logDebug(
        'ngOnChanges terminé après initialisation différée',
        null,
        this.debug
      );
      return;
    }

    let needsUpdate = false;

    // Si le type de graphique change
    if (changes['_type'] && !changes['_type'].firstChange) {
      logDebug(
        'Changement du type de graphique',
        {
          ancien: changes['_type'].previousValue,
          nouveau: changes['_type'].currentValue,
        },
        this.debug
      );

      if (this.chartOptions) {
        this.renderService.updateChartType(
          this.chartOptions,
          changes['_type'].previousValue,
          changes['_type'].currentValue
        );
        needsUpdate = true;
      }
    }

    // Si les données ou la configuration ont changé (après la première initialisation)
    if (
      (changes['data'] || changes['config']) &&
      this.initialized &&
      this.config &&
      this.data &&
      !changes['data']?.firstChange &&
      !changes['config']?.firstChange
    ) {
      logDebug(
        'Changement des données ou de la configuration',
        {
          dataChanged: !!changes['data'],
          configChanged: !!changes['config'],
        },
        this.debug
      );

      this.updateData();
      needsUpdate = true;

      // Vérifier si nous avons de vraies données
      if (changes['data'] && this.data && this.data.length > 0) {
        this.hasRealData = true;

        // Si nous avons des données et que le chargement est toujours actif, le désactiver
        if (this._isLoading && this.renderService.getChart()) {
          // Programmer la fin du chargement après le rendu des données
          setTimeout(() => {
            this.renderService.toggleLoading(false);
          }, 10);
        }
      }
    }

    // Mise à jour du graphique si nécessaire
    if (this.renderService.getChart() && needsUpdate) {
      logDebug('Mise à jour du graphique requise', null, this.debug);
      this.renderService.updateChart(this.chartOptions);
    }

    logDebug('ngOnChanges terminé', null, this.debug);
  }

  ngOnDestroy(): void {
    logDebug('ngOnDestroy démarré', null, this.debug);

    if (this.renderService?.getChart()) {
      logDebug('Destruction du graphique', null, this.debug);
      this.renderService.destroyChart();
      this.chartInstance.emit(null);
    }

    logDebug('ngOnDestroy terminé', null, this.debug);
  }

  // Initialise les options du graphique
  private initOptions(): void {
    logDebug('initOptions démarré', null, this.debug);

    const startTime = performance.now();
    this.chartOptions = getBaseOptions(this._type, this.config);

    logDebug(
      'Options de base générées',
      {
        duration: `${(performance.now() - startTime).toFixed(2)}ms`,
      },
      this.debug
    );

    const dataStartTime = performance.now();
    this.updateData();

    logDebug(
      'Données mises à jour',
      {
        duration: `${(performance.now() - dataStartTime).toFixed(2)}ms`,
      },
      this.debug
    );

    this.optionsInitialized = true;

    // Si le chart existe déjà mais a besoin d'être mis à jour
    if (this.renderService.getChart()) {
      logDebug('Mise à jour du graphique existant', null, this.debug);
      this.renderService.updateChart(this.chartOptions);
    }

    logDebug(
      'initOptions terminé',
      {
        totalDuration: `${(performance.now() - startTime).toFixed(2)}ms`,
      },
      this.debug
    );
  }

  // Crée une nouvelle instance du graphique Highcharts
  private renderChart(): void {
    if (!this.chartOptions) {
      logDebug(
        'Impossible de créer le graphique: options non définies',
        null,
        this.debug
      );
      return;
    }

    // Configuration pour l'indicateur de chargement
    this.chartOptions.loading = {
      labelStyle: {
        color: '#666',
        fontSize: '16px',
      },
      style: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
      },
    };

    // Mise à jour des options spécifiques au type
    configureTypeSpecificOptions(this.chartOptions, this._type);

    // Création du graphique
    this.renderService.createChart(this.chartOptions);

    // Émission de l'instance du graphique
    this.chartInstance.emit(this.renderService.getChart() || undefined);

    // Gestion de l'état de chargement initial
    if (this.isLoading) {
      logDebug('Application du chargement initial', null, this.debug);
      this.renderService.toggleLoading(true);
    } else if (this.data && this.data.length === 0) {
      // Si pas de données, afficher le message "Aucune donnée"
      this.renderService.toggleLoading(false);
    } else {
      // Si nous avons des données, s'assurer que le chargement est masqué
      this.renderService.toggleLoading(false);
    }
  }

  // Met à jour les données du graphique
  private updateData(): void {
    if (!this.chartOptions) {
      this.chartOptions = getBaseOptions(this._type, this.config);
    }

    const hasData = this.dataService.updateData(
      this.data,
      this.config,
      this._type,
      this.chartOptions
    );

    if (hasData && this.data && this.data.length > 0) {
      this.hasRealData = true;
    }

    // Mise à jour des options spécifiques au type
    configureTypeSpecificOptions(this.chartOptions, this._type);
  }
}
