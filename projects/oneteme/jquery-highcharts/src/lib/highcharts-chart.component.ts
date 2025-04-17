import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnChanges, SimpleChanges, ElementRef, Output, EventEmitter, NgZone, AfterViewInit, OnDestroy, ChangeDetectionStrategy,
} from '@angular/core';
import { ChartProvider, ChartType, XaxisType, YaxisType, buildChart, Coordinate2D, CommonChart, mergeDeep, buildSingleSerieChart } from '@oneteme/jquery-core';

import more from 'highcharts/highcharts-more';
import NoDataToDisplay from 'highcharts/modules/no-data-to-display';
import Annotations from 'highcharts/modules/annotations';
import Accessibility from 'highcharts/modules/accessibility';
import Funnel from 'highcharts/modules/funnel';
import Treemap from 'highcharts/modules/treemap';
import Exporting from 'highcharts/modules/exporting';
import * as Highcharts from 'highcharts';

// Initialisation des modules Highcharts
more(Highcharts);
NoDataToDisplay(Highcharts);
Annotations(Highcharts);
Accessibility(Highcharts);
Funnel(Highcharts);
Treemap(Highcharts);
Exporting(Highcharts);

Highcharts.setOptions({
  lang: {
    noData: "Aucune donnée"
  }
});

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
  protected _charts: {
    [key: string]: { possibleType: ChartType[] };
  } = {
    pie: { possibleType: ['pie', 'donut', 'polar', 'radar', 'radial'] },
    donut: { possibleType: ['pie', 'donut', 'polar', 'radar', 'radial'] },
    polar: { possibleType: ['pie', 'donut', 'polar', 'radar', 'radial'] },
    radar: { possibleType: ['pie', 'donut', 'polar', 'radar', 'radial'] },
    radial: { possibleType: ['pie', 'donut', 'polar', 'radar', 'radial'] },
    line: { possibleType: ['line', 'area', 'spline', 'areaspline'] },
    area: { possibleType: ['line', 'area', 'spline', 'areaspline'] },
    spline: { possibleType: ['line', 'area', 'spline', 'areaspline'] },
    areaspline: { possibleType: ['line', 'area', 'spline', 'areaspline'] },
    bar: { possibleType: ['bar', 'column', 'heatmap', 'treemap'] },
    column: { possibleType: ['bar', 'column', 'heatmap', 'treemap'] },
    heatmap: { possibleType: ['bar', 'column', 'heatmap', 'treemap'] },
    treemap: { possibleType: ['bar', 'column', 'heatmap', 'treemap'] },
    funnel: { possibleType: ['funnel', 'pyramid'] },
    pyramid: { possibleType: ['funnel', 'pyramid'] },
    rangeArea: { possibleType: ['rangeArea', 'rangeBar', 'rangeColumn']},
    rangeBar: { possibleType: ['rangeArea', 'rangeBar', 'rangeColumn'] },
    rangeColumn: { possibleType: ['rangeArea', 'rangeBar', 'rangeColumn'] },
  };

  private chart: Highcharts.Chart;
  private chartOptions: Highcharts.Options;
  private readonly oneToOneFlag = true;
  private readonly runOutsideAngularFlag = true;
  private commonChart: CommonChart<X, Y | Coordinate2D>;
  private initialized = false;
  private optionsInitialized = false;
  private pendingInitialization = false;
  private _options: any;

  @Input({ alias: 'type', required: true }) _type: ChartType;
  @Input({ required: true }) config: ChartProvider<X, Y>;
  @Input({ required: true }) data: any[];
  @Input() debug: boolean;
  @Output() chartInstance = new EventEmitter<Highcharts.Chart>();
  @Input()
  set isLoading(isLoading: boolean) {
    this._options.noData.text = isLoading
      ? 'Chargement des données...'
      : 'Aucune donnée';
  }

  constructor(private readonly el: ElementRef, private readonly zone: NgZone) {}

  // Méthode utilitaire pour les logs avec timestamp
  private logDebug(message: string, data?: any): void {
    if (this.debug) {
      const timestamp = new Date().toISOString();
      if (data) {
        console.log(`[HIGHCHARTS][${timestamp}] ${message}`, data);
      } else {
        console.log(`[HIGHCHARTS][${timestamp}] ${message}`);
      }
    }
  }

  ngOnInit(): void {
    this.logDebug('ngOnInit démarré', { type: this._type, config: this.config });
    this.initialized = true;

    // Attendre que les données et la configuration soient disponibles avant d'initialiser les options
    if (this.config && this.data) {
      this.initOptions();
    } else {
      this.pendingInitialization = true;
      this.logDebug('Initialisation en attente - données ou configuration manquantes');
    }

    this.logDebug('ngOnInit terminé');
  }

  ngAfterViewInit(): void {
    this.logDebug('ngAfterViewInit démarré');

    if (this.chartOptions && !this.chart) {
      this.createChart();
    }

    this.logDebug('ngAfterViewInit terminé');
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.logDebug('ngOnChanges démarré', changes);

    // Si c'est la première fois avec des données et config complètes, initialiser
    if (this.pendingInitialization && this.config && this.data) {
      this.logDebug('Initialisation différée des options avec données complètes');
      this.pendingInitialization = false;
      this.initOptions();
      // Après l'initialisation différée, créer le graphique si la vue est déjà initialisée
      if (this.el?.nativeElement && !this.chart) {
        this.createChart();
      }
      this.logDebug('ngOnChanges terminé après initialisation différée');
      return;
    }

    let needsUpdate = false;

    // Si le type de graphique change
    if (changes['_type'] && !changes['_type'].firstChange) {
      this.logDebug('Changement du type de graphique', {
        ancien: changes['_type'].previousValue,
        nouveau: changes['_type'].currentValue
      });
      this.updateChartType(changes['_type'].currentValue);
      needsUpdate = true;
    }

    // Si les données ou la configuration ont changé (après la première initialisation)
    if ((changes['data'] || changes['config']) &&
        this.initialized &&
        this.config &&
        this.data &&
        !changes['data']?.firstChange &&
        !changes['config']?.firstChange) {

      this.logDebug('Changement des données ou de la configuration', {
        dataChanged: !!changes['data'],
        configChanged: !!changes['config']
      });
      this.updateData();
      needsUpdate = true;
    }

    // Si l'état de chargement a changé
    if (changes['isLoading'] && this.chart) {
      this.logDebug('Changement de l\'état de chargement', {
        nouvelEtat: this.isLoading
      });
      this.toggleLoading(this.isLoading);
    }

    // Mise à jour du graphique si nécessaire
    if (this.chart && needsUpdate) {
      this.logDebug('Mise à jour du graphique requise');
      this.updateChart();
    }

    this.logDebug('ngOnChanges terminé');
  }

  ngOnDestroy(): void {
    this.logDebug('ngOnDestroy démarré');

    if (this.chart) {
      this.logDebug('Destruction du graphique');
      this.chart.destroy();
      this.chart = null;
      this.chartInstance.emit(null);
    }

    this.logDebug('ngOnDestroy terminé');
  }

  // Initialise les options du graphique
  private initOptions(): void {
    this.logDebug('initOptions démarré');

    const startTime = performance.now();
    this.chartOptions = this.getBaseOptions();
    this.logDebug('Options de base générées', {
      duration: `${(performance.now() - startTime).toFixed(2)}ms`
    });

    const dataStartTime = performance.now();
    this.updateData();
    this.logDebug('Données mises à jour', {
      duration: `${(performance.now() - dataStartTime).toFixed(2)}ms`
    });

    this.optionsInitialized = true;

    // Si le chart existe déjà mais a besoin d'être mis à jour
    if (this.chart) {
      this.logDebug('Mise à jour du graphique existant');
      this.updateChart();
    }

    this.logDebug('initOptions terminé', {
      totalDuration: `${(performance.now() - startTime).toFixed(2)}ms`
    });
  }

  // Crée une nouvelle instance du graphique Highcharts
  private createChart(): void {
    if (!this.chartOptions) {
      this.logDebug('Impossible de créer le graphique: options non définies');
      return;
    }

    try {
      this.logDebug('createChart démarré');
      const startTime = performance.now();

      if (!this.chartOptions.chart) this.chartOptions.chart = {};

      // S'assurer que le conteneur est disponible
      const container = this.el.nativeElement.querySelector('.chart-container');
      if (!container) {
        this.logDebug('Conteneur de graphique non trouvé');
        return;
      }

      if (this.runOutsideAngularFlag) {
        this.logDebug('Création du graphique en dehors de la zone Angular');
        this.zone.runOutsideAngular(() => {
          const renderStartTime = performance.now();
          this.chart = Highcharts.chart(
            container,
            this.chartOptions
          );
          this.logDebug('Rendu du graphique terminé', {
            duration: `${(performance.now() - renderStartTime).toFixed(2)}ms`
          });

          this.chartInstance.emit(this.chart);
          if (this.isLoading) {
            this.toggleLoading(true);
          }
        });
      } else {
        this.logDebug('Création du graphique à l\'intérieur de la zone Angular');
        const renderStartTime = performance.now();
        this.chart = Highcharts.chart(
          container,
          this.chartOptions
        );
        this.logDebug('Rendu du graphique terminé', {
          duration: `${(performance.now() - renderStartTime).toFixed(2)}ms`
        });

        this.chartInstance.emit(this.chart);
        if (this.isLoading) {
          this.toggleLoading(true);
        }
      }

      this.logDebug('createChart terminé', {
        totalDuration: `${(performance.now() - startTime).toFixed(2)}ms`
      });
    } catch (error) {
      console.error('[HIGHCHARTS] Erreur lors de la création du graphique:', error);
    }
  }

  // Met à jour le graphique existant avec les nouvelles options
  private updateChart(): void {
    if (!this.chart) {
      this.logDebug('updateChart: Le graphique n\'existe pas encore, création...');
      this.createChart();
      return;
    }

    this.logDebug('updateChart démarré');
    const startTime = performance.now();

    if (this.runOutsideAngularFlag) {
      this.logDebug('Mise à jour en dehors de la zone Angular');
      this.zone.runOutsideAngular(() => {
        const updateStartTime = performance.now();
        this.chart.update(this.chartOptions, true, this.oneToOneFlag);
        this.logDebug('Chart.update() terminé', {
          duration: `${(performance.now() - updateStartTime).toFixed(2)}ms`
        });
      });
    } else {
      this.logDebug('Mise à jour à l\'intérieur de la zone Angular');
      const updateStartTime = performance.now();
      this.chart.update(this.chartOptions, true, this.oneToOneFlag);
      this.logDebug('Chart.update() terminé', {
        duration: `${(performance.now() - updateStartTime).toFixed(2)}ms`
      });
    }

    this.logDebug('updateChart terminé', {
      totalDuration: `${(performance.now() - startTime).toFixed(2)}ms`
    });
  }

  // Affiche ou masque l'indicateur de chargement
  private toggleLoading(show: boolean): void {
    if (!this.chart) return;

    this.logDebug(`toggleLoading: ${show ? 'affichage' : 'masquage'} de l'indicateur`);

    if (show) {
      this.chart.showLoading('Chargement des données...');
    } else {
      this.chart.hideLoading();
    }
  }

  // Met à jour les données du graphique en utilisant jquery-core
  private updateData(): void {
    if (!this.data || !this.config) {
      this.logDebug('Impossible de mettre à jour les données: données ou configuration manquantes');
      return;
    }

    try {
      this.logDebug('updateData démarré', {
        dataLength: this.data.length,
        chartType: this._type
      });
      const startTime = performance.now();

      // S'assurer que config.series est défini avec au moins un élément
      if (!this.config.series || !Array.isArray(this.config.series) || this.config.series.length === 0) {
        this.logDebug('Configuration des séries manquante, création d\'une série par défaut');
        // Créer une configuration de série par défaut au lieu d'afficher un warning
        this.config.series = [{
          data: {
            x: this.data[0] && Object.keys(this.data[0])[0] ? field => field[Object.keys(this.data[0])[0]] : field => 'Valeur',
            y: this.data[0] && Object.keys(this.data[0])[1] ? field => field[Object.keys(this.data[0])[1]] : field => 0
          }
        }];
      }

      // Déterminer si nous utilisons un graphique simple ou complexe
      let buildChartStartTime = performance.now();
      if (this.isSimpleChartType(this._type)) {
        // Pour les graphiques simples
        this.logDebug('Construction d\'un graphique simple');
        this.commonChart = buildSingleSerieChart(
          this.data,
          { ...this.config, continue: false },
          null
        );
      } else {
        // Pour les graphiques complexes
        this.logDebug('Construction d\'un graphique complexe');
        this.commonChart = buildChart(
          this.data,
          { ...this.config, continue: this.determineIfContinuous() },
          null
        );
      }
      this.logDebug('Construction du chart terminée', {
        duration: `${(performance.now() - buildChartStartTime).toFixed(2)}ms`
      });

      if (!this.chartOptions) {
        this.chartOptions = this.getBaseOptions();
      }

      // Mise à jour des séries dans les options Highcharts
      const seriesStartTime = performance.now();
      this.updateSeriesData();
      this.logDebug('Mise à jour des séries terminée', {
        duration: `${(performance.now() - seriesStartTime).toFixed(2)}ms`,
        seriesCount: this.commonChart.series.length
      });

      // Mise à jour des options spécifiques au type de graphique
      const typeOptionsStartTime = performance.now();
      this.updateTypeSpecificOptions();
      this.logDebug('Mise à jour des options spécifiques au type terminée', {
        duration: `${(performance.now() - typeOptionsStartTime).toFixed(2)}ms`,
        chartType: this._type
      });

      this.logDebug('updateData terminé', {
        totalDuration: `${(performance.now() - startTime).toFixed(2)}ms`
      });
    } catch (error) {
      console.error('[HIGHCHARTS] Erreur lors de la mise à jour des données:', error);
    }
  }

  // Met à jour le type de graphique
  private updateChartType(newType: ChartType): void {
    this.logDebug('updateChartType démarré', {
      ancienType: this._type,
      nouveauType: newType
    });
    const startTime = performance.now();

    this._type = newType;

    // Mise à jour des options spécifiques au type
    if (this.chartOptions?.chart) {
      this.chartOptions.chart.type = this.mapChartType(this._type);
    }

    this.updateTypeSpecificOptions();

    this.logDebug('updateChartType terminé', {
      duration: `${(performance.now() - startTime).toFixed(2)}ms`
    });
  }

  // Vérifie si un type de graphique est de type simple
  private isSimpleChartType(type: ChartType): boolean {
    const result = ['pie','donut','funnel','pyramid','polar','radar','radial'].includes(type);
    this.logDebug(`isSimpleChartType: ${type} => ${result}`);
    return result;
  }

  // Détermine si les données doivent être traitées comme continues
  private determineIfContinuous(): boolean {
    const result = ['line', 'area', 'spline', 'areaspline'].includes(this._type);
    this.logDebug(`determineIfContinuous: ${this._type} => ${result}`);
    return result;
  }

  // Génère les options de base pour le graphique
  private getBaseOptions(): Highcharts.Options {
    this.logDebug('getBaseOptions démarré');
    const startTime = performance.now();

    // Initialiser la configuration si elle n'existe pas
    if (!this.config) {
      this.config = { series: [] };
    }

    const options = {
      chart: {
        type: this.mapChartType(this._type),
      },
      title: {
        text: this.config.title || undefined,
      },
      subtitle: {
        text: this.config.subtitle || undefined,
      },
      credits: {
        enabled: false,
      },
      accessibility: {
        enabled: false,
      },
      exporting: {
        enabled: this.config.showToolbar ?? false
      },
      plotOptions: {
        series: {
          stacking: this.config.stacked ? ('normal' as Highcharts.OptionsStackingValue) : undefined,
          dataLabels: {
            enabled: false,
          },
          events: {
          },
        },
      },
      xAxis: {
        title: {
          text: this.config.xtitle || undefined,
        },
        type: 'category' as Highcharts.AxisTypeValue,
      },
      yAxis: {
        title: {
          text: this.config.ytitle || undefined,
        },
      },
      series: [],
    };

    this.logDebug('getBaseOptions terminé', {
      duration: `${(performance.now() - startTime).toFixed(2)}ms`
    });

    return options;
  }

  /**
   * Mappe les types de graphiques ChartType vers les types Highcharts
   */
  private mapChartType(chartType: ChartType): string {
    const typeMapping = {
      pie: 'pie',
      donut: 'pie', // Highcharts utilise pie avec innerSize
      polar: 'column', // Sera transformé en polarArea
      radar: 'line', // Sera transformé en radar
      radial: 'column', // Sera transformé en radialBar
      line: 'line',
      area: 'area',
      spline: 'spline',
      areaspline: 'areaspline',
      bar: 'bar',
      column: 'column',
      heatmap: 'heatmap',
      treemap: 'treemap',
      funnel: 'funnel',
      pyramid: 'funnel', // Sera inversé
      rangeArea: 'arearange',
      rangeBar: 'columnrange',
      rangeColumn: 'columnrange',
    };

    const result = typeMapping[chartType] ?? 'line';
    this.logDebug(`mapChartType: ${chartType} => ${result}`);
    return result;
  }

  /**
   * Met à jour les séries de données dans les options du graphique
   */
  private updateSeriesData(): void {
    if (!this.commonChart || !this.chartOptions) return;

    try {
      this.logDebug('updateSeriesData démarré');
      const startTime = performance.now();

      if (this.isSimpleChartType(this._type)) {
        // Format pour les graphiques simples comme pie, donut
        this.logDebug('Traitement des séries pour graphique simple');
        const seriesDataStartTime = performance.now();

        const seriesData =
          this.commonChart.series[0]?.data.map((point, index) => {
            const category = this.commonChart.categories?.[index] || '';
            return {
              name: String(category),
              y: typeof point === 'number' ? point : null,
            };
          }) || [];

        this.chartOptions.series = [
          {
            name:
              this.commonChart.series[0]?.name ||
              this.config.ytitle ||
              'Valeur',
            data: seriesData,
            color: this.commonChart.series[0]?.color,
          },
        ] as any;

        this.logDebug('Séries pour graphique simple créées', {
          duration: `${(performance.now() - seriesDataStartTime).toFixed(2)}ms`,
          pointCount: seriesData.length
        });
      } else {
        // Format pour les graphiques complexes
        this.logDebug('Traitement des séries pour graphique complexe');
        const seriesStartTime = performance.now();

        const series = this.commonChart.series.map((series) => {
          let seriesData;

          if (this.determineIfContinuous()) {
            // Pour les graphiques continus (x, y)
            seriesData = series.data.map((point) => {
              if (
                typeof point === 'object' &&
                point !== null &&
                'x' in point &&
                'y' in point
              ) {
                return { x: (point as any).x, y: (point as any).y };
              }
              return point;
            });
          } else {
            // Pour les graphiques avec catégories
            seriesData = series.data;
          }

          return {
            name: series.name || '',
            data: seriesData,
            color: series.color,
            stack: series.stack,
          };
        });

        this.chartOptions.series = series as any;

        this.logDebug('Séries pour graphique complexe créées', {
          duration: `${(performance.now() - seriesStartTime).toFixed(2)}ms`,
          seriesCount: series.length
        });

        // Ajouter les catégories pour les graphiques non-continus
        if (
          !this.determineIfContinuous() &&
          this.commonChart.categories?.length
        ) {
          const categoriesStartTime = performance.now();

          if (!this.chartOptions.xAxis) {
            this.chartOptions.xAxis = {};
          }

          if (Array.isArray(this.chartOptions.xAxis)) {
            this.chartOptions.xAxis[0].categories =
              this.commonChart.categories.map((category) => String(category));
          } else {
            this.chartOptions.xAxis.categories =
              this.commonChart.categories.map((category) => String(category));
          }

          this.logDebug('Catégories mises à jour', {
            duration: `${(performance.now() - categoriesStartTime).toFixed(2)}ms`,
            categoryCount: this.commonChart.categories.length
          });
        }
      }

      // Fusionner avec les options personnalisées de l'utilisateur
      if (this.config.options) {
        const mergeStartTime = performance.now();
        this.chartOptions = mergeDeep(this.chartOptions, this.config.options);
        this.logDebug('Options personnalisées fusionnées', {
          duration: `${(performance.now() - mergeStartTime).toFixed(2)}ms`
        });
      }

      this.logDebug('updateSeriesData terminé', {
        totalDuration: `${(performance.now() - startTime).toFixed(2)}ms`
      });
    } catch (error) {
      console.error(
        '[HIGHCHARTS] Erreur lors de la mise à jour des séries:',
        error
      );
    }
  }

  /**
   * Met à jour les options spécifiques au type de graphique sélectionné
   */
  private updateTypeSpecificOptions(): void {
    if (!this.chartOptions?.chart) return;

    this.logDebug('updateTypeSpecificOptions démarré');
    const startTime = performance.now();

    this.chartOptions.chart.type = this.mapChartType(this._type);

    // Réinitialiser certaines options qui pourraient persister
    if (this.chartOptions.chart.polar) this.chartOptions.chart.polar = false;
    if (this.chartOptions.chart.inverted)
      this.chartOptions.chart.inverted = false;
    if (this.chartOptions.pane) delete this.chartOptions.pane;

    // Configurer les options spécifiques au type
    const typeSwitchStartTime = performance.now();
    switch (this._type) {
      case 'donut':
        this.logDebug('Configuration des options pour type: donut');
        if (!this.chartOptions.plotOptions) this.chartOptions.plotOptions = {};
        if (!this.chartOptions.plotOptions.pie)
          this.chartOptions.plotOptions.pie = {};
        this.chartOptions.plotOptions.pie.innerSize = '50%';
        break;

      case 'polar':
        this.logDebug('Configuration des options pour type: polar');
        this.chartOptions.chart.polar = true;
        break;

      case 'radar':
        this.logDebug('Configuration des options pour type: radar');
        this.chartOptions.chart.polar = true;
        this.chartOptions.pane = {
          size: '80%',
          startAngle: 0,
          endAngle: 360,
        };
        break;

      case 'bar':
        this.logDebug('Configuration des options pour type: bar');
        if (!this.chartOptions.plotOptions) this.chartOptions.plotOptions = {};
        if (!this.chartOptions.plotOptions.bar)
          this.chartOptions.plotOptions.bar = {};
        // Barres horizontales
        this.chartOptions.chart.inverted = true;
        break;

      case 'pyramid':
        this.logDebug('Configuration des options pour type: pyramid');
        if (!this.chartOptions.plotOptions) this.chartOptions.plotOptions = {};
        if (!this.chartOptions.plotOptions.funnel)
          this.chartOptions.plotOptions.funnel = {};
        this.chartOptions.plotOptions.funnel.reversed = true;
        break;

      case 'rangeBar':
      case 'rangeColumn':
        this.logDebug('Configuration des options pour type: range');
        // Configuration spécifique pour les graphiques de type range
        if (!this.chartOptions.plotOptions) this.chartOptions.plotOptions = {};
        if (!this.chartOptions.plotOptions.columnrange)
          this.chartOptions.plotOptions.columnrange = {};
        this.chartOptions.chart.inverted = this._type === 'rangeBar';
        break;

      case 'spline':
      case 'areaspline':
        this.logDebug('Configuration des options pour type: spline');
        // Configuration spécifique pour les graphiques de type spline
        if (!this.chartOptions.plotOptions) this.chartOptions.plotOptions = {};
        if (!this.chartOptions.plotOptions.spline)
          this.chartOptions.plotOptions.spline = {};
        if (!this.chartOptions.plotOptions.areaspline)
          this.chartOptions.plotOptions.areaspline = {};
        break;

      default:
        this.logDebug(`Pas de configuration spécifique pour le type: ${this._type}`);
    }

    this.logDebug('Switch des types terminé', {
      duration: `${(performance.now() - typeSwitchStartTime).toFixed(2)}ms`
    });

    this.logDebug('updateTypeSpecificOptions terminé', {
      totalDuration: `${(performance.now() - startTime).toFixed(2)}ms`
    });
  }
}
