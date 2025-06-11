import { ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges, Directive } from '@angular/core';
import { ChartProvider, ChartView, XaxisType, YaxisType } from '@oneteme/jquery-core';
import * as Highcharts from 'highcharts';
import { ChartCustomEvent } from './utils/types';
import { createHighchartsChart, destroyChart } from './utils/chart-creation';
import { initBaseChartOptions } from './utils/chart-options';
import { initializeHighchartsModules } from './utils/highcharts-modules';
import { LoadingManager } from './utils/loading-manager';
import { NoDataManager } from './utils/no-data-manager';

@Directive()
export abstract class BaseChartDirective<
  X extends XaxisType,
  Y extends YaxisType
> implements ChartView<X, Y>, OnDestroy, OnChanges
{
  @Input({ required: true }) config: ChartProvider<X, Y>;
  @Input({ required: true }) data: any[];
  @Input() isLoading: boolean = false;
  @Input() debug: boolean = false;
  @Input() canPivot: boolean = true;
  @Output() customEvent: EventEmitter<ChartCustomEvent> = new EventEmitter();
  @Input({ alias: 'type' }) type: string;

  chart: Highcharts.Chart;
  protected _chartConfig: ChartProvider<X, Y> = {};
  protected _options: any = {};
  protected _shouldRedraw: boolean = true;
  protected loadingManager: LoadingManager;
  protected noDataManager: NoDataManager;

  constructor(
    protected readonly el: ElementRef,
    protected readonly _zone: NgZone
  ) {
    // Initialiser les modules une seule fois
    initializeHighchartsModules();

    // Initialiser les managers
    this.loadingManager = new LoadingManager(this.el, {
      fadeInDuration: 200,
      fadeOutDuration: 400,
    });

    this.noDataManager = new NoDataManager(this.el, {
      fadeInDuration: 300,
      fadeOutDuration: 200,
    });

    this._options = initBaseChartOptions(
      this.type || '',
      this.debug
    );

    // Afficher le loading dès le montage du composant si isLoading est true (par défaut)
    // ou si on n'a pas encore de données
    setTimeout(() => {
      if (this.isLoading && (!this.data || this.data.length === 0)) {
        this.loadingManager.show();
      }
    }, 0);
  }

  ngOnDestroy(): void {
    destroyChart(this.chart, this.loadingManager, this.debug);
    this.noDataManager.destroy();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.debug) {
      console.log('Détection de changements', changes);
    }

    this._zone.runOutsideAngular(() => {
      // Gérer l'affichage initial du loading
      if (changes.isLoading || changes.data || changes.config) {
        this.handleInitialLoading();
      }

      // Vérifier que nous avons les données nécessaires avant de traiter
      if (this.config && this.data !== undefined) {
        this.processChanges(changes);
      } else if (this.debug) {
        console.log('Config ou data manquants, attente...', {
          hasConfig: !!this.config,
          hasData: this.data !== undefined
        });
      }
    });
  }

  protected handleInitialLoading(): void {
    // Afficher le loading seulement si isLoading est true ET qu'on n'a pas de données
    if (this.isLoading && (!this.data || this.data.length === 0)) {
      if (!this.loadingManager.visible) {
        this.loadingManager.show();
      }
    } else if (!this.isLoading && this.loadingManager.visible) {
      // Si isLoading devient false, masquer le loading immédiatement
      this.loadingManager.hide();
    }
  }

  protected processChanges(changes: SimpleChanges): void {
    const needsOptionsUpdate = this.hasRelevantChanges(changes);

    // Gestion du loading
    if (changes.isLoading) {
      if (changes.isLoading.currentValue) {
        if (this.debug) console.log('Affichage du loading...');
        this.loadingManager.show();
        // Masquer le message "aucune donnée" si le loading est activé
        this.noDataManager.hide();

        // Masquer le graphique existant si présent
        if (this.chart?.container) {
          this.chart.container.style.opacity = '0';
        }
      } else {
        if (this.debug) console.log('isLoading désactivé, masquage du loading...');
        // Si l'utilisateur désactive explicitement le loading, le masquer immédiatement
        this.loadingManager.hide();

        // Réafficher le graphique si présent
        if (this.chart?.container) {
          this.chart.container.style.opacity = '1';
        }
      }
    }

    // Gestion des différents types de changements - avec vérifications de sécurité
    if (changes.type && this.config) {
      if (this.debug) console.log('Changement de type détecté:', changes.type.previousValue, '->', changes.type.currentValue);
      this.updateChartType();
    }

    if (changes.config && this.config) {
      this.updateConfig();
    }

    if ((changes.config || changes.data) && this.config && this.data !== undefined) {
      this.updateData();
    }

    // Application des changements au graphique
    if (this._shouldRedraw) {
      if (this.debug) {
        console.log('Recréation complète du graphique nécessaire', changes);
        console.log('_shouldRedraw est true, destruction et recréation...');
      }
      destroyChart(this.chart, undefined, this.debug);
      this.chart = null;
      this.createChart();
      this._shouldRedraw = false;
    } else if (needsOptionsUpdate && this.chart) {
      if (this.debug) {
        console.log('Mise à jour des options du graphique', changes);
      }
      this.updateChart();
    } else if (needsOptionsUpdate && !this.chart && this.config) {
      if (this.debug) {
        console.log('Pas de graphique existant, création nécessaire', changes);
      }
      this.createChart();
    }

    // IMPORTANT : Vérifier l'état "aucune donnée" APRÈS tous les traitements
    // Et forcer la désactivation du loading si on a des données (même vides) et que la config est prête
    setTimeout(() => {
      this.finalizeDataState(changes);
    }, 0);
  }

  // Nouvelle méthode pour finaliser l'état après traitement des données
  protected finalizeDataState(changes: SimpleChanges): void {
    const hasReceivedData = changes.data && this.data !== undefined;
    const hasConfig = !!this.config;

    // Vérifier si on a reçu un changement de données
    if (hasReceivedData && hasConfig) {
      if (this.debug) console.log('Changement de données détecté, évaluation de l\'état final...');

      const hasNoData = !this.data || this.data.length === 0;
      const hasNoSeries = !this._options.series || this._options.series.length === 0 || (Array.isArray(this._options.series) && this._options.series.every(s => !s.data || (Array.isArray(s.data) && s.data.length === 0)));

      // Si on n'a pas de données ET que le loading n'est pas activé
      // ALORS on doit afficher le message "aucune donnée"
      if ((hasNoData || hasNoSeries) && !this.isLoading) {
        if (this.debug) console.log('Données vides reçues avec loading désactivé -> affichage message aucune donnée');

        // Forcer l'affichage du message "aucune donnée"
        if (this.loadingManager.visible) {
          this.loadingManager.hide().then(() => {
            if (this.debug) console.log('Loading masqué, affichage du message aucune donnée');
            this.noDataManager.show();
          });
        } else {
          this.noDataManager.show();
        }
      }

      // Si on n'a pas de données MAIS que le loading est activé
      // ALORS attendre que isLoading devienne false pour réévaluer
      else if ((hasNoData || hasNoSeries) && this.isLoading) {
        if (this.debug) console.log('Données vides reçues avec loading activé -> attente de la fin du loading');

        // S'assurer que le loading est visible et le message masqué
        if (!this.loadingManager.visible) {
          this.loadingManager.show();
        }
        this.noDataManager.hide();

        // Programmer une réévaluation après un délai raisonnable
        // pour gérer le cas où isLoading ne changerait jamais
        setTimeout(() => {
          if (this.isLoading && (!this.data || this.data.length === 0)) {
            if (this.debug) console.log('Timeout atteint avec loading toujours actif et pas de données -> forcer affichage message');
            this.loadingManager.hide().then(() => {
              this.noDataManager.show();
            });
          }
        }, 3000);
      }

      // Si on a des données valides
      else if (!hasNoData && !hasNoSeries) {
        if (this.debug) console.log('Données valides détectées -> masquer tous les messages');
        this.noDataManager.hide();
        // Le loading sera géré par createChart
      }
    }
  }

  // permet de filtrer le params "debug" pour ne pas mettre à jour
  protected hasRelevantChanges(changes: SimpleChanges): boolean {
    return Object.keys(changes).some((key) => !['debug'].includes(key));
  }

  // Met à jour les options du graph existant
  protected updateChart(): void {
    if (!this.chart) {
      if (this.debug) console.log('Pas de graphique existant pour la mise à jour, création...');
      this.createChart();
      return;
    }

    // Vérifications de sécurité pour s'assurer que le graphique est dans un état valide
    if (!this.chart.options || !this.chart.renderer || this.chart.renderer.forExport) {
      if (this.debug) console.log('Graphique dans un état invalide, recréation...');
      destroyChart(this.chart, undefined, this.debug);
      this.chart = null;
      this.createChart();
      return;
    }

    try {
      // Vérifier que les options sont valides avant la mise à jour
      if (!this._options || typeof this._options !== 'object') {
        if (this.debug) console.log('Options invalides pour la mise à jour');
        return;
      }

      this.chart.update(this._options, true, true);
      if (this.debug) console.log('Graphique mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du graphique:', error);
      // En cas d'erreur de mise à jour, recréer le graphique
      try {
        destroyChart(this.chart, undefined, this.debug);
      } catch (destroyError) {
        console.error('Erreur lors de la destruction après échec de mise à jour:', destroyError);
      }
      this.chart = null;
      this.createChart();
    }
  }

  // Crée un nouveau graph
  protected createChart(): void {
    // Vérifications de sécurité
    if (!this.config) {
      if (this.debug) console.log('Pas de configuration disponible');
      return;
    }

    // Si on n'a pas de données valides
    if (!this.data || this.data.length === 0) {
      if (this.debug) console.log('Pas de données disponibles pour createChart');
      // Ne pas maintenir le loading indéfiniment - laisser finalizeDataState gérer
      return;
    }

    // Vérifier si les options contiennent des séries valides
    if (!this._options.series || this._options.series.length === 0 ||
        (Array.isArray(this._options.series) && this._options.series.every(s => !s.data || (Array.isArray(s.data) && s.data.length === 0)))) {
      if (this.debug) console.log('Pas de séries valides dans les options pour createChart');
      // Ne pas maintenir le loading indéfiniment - laisser finalizeDataState gérer
      return;
    }

    // Masquer le message "aucune donnée" avant de créer le graphique
    this.noDataManager.hide();

    createHighchartsChart(
      this.el,
      this._options,
      this.config,
      this.customEvent,
      this._zone,
      this.loadingManager,
      this.canPivot,
      this.debug
    ).then((createdChart) => {
      if (createdChart) {
        this.chart = createdChart;
        if (this.debug) console.log('Graphique créé avec succès');
      } else {
        console.error('Échec de la création du graphique');
        // En cas d'échec, laisser finalizeDataState gérer l'affichage
      }
    });
  }

  // implémentées dans complex et simple chart directive
  protected abstract updateChartType(): void;
  protected abstract updateConfig(): void;
  protected abstract updateData(): void;
}
