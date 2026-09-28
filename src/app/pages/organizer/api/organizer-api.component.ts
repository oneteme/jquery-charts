import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface ApiEntry {
  name: string;
  type: string;
  description: string;
  example?: string;
}

interface ApiSection {
  title: string;
  description: string;
  entries: ApiEntry[];
}

@Component({
  selector: 'app-organizer-api',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './organizer-api.component.html',
  styleUrls: ['./organizer-api.component.scss'],
})
export class OrganizerApiComponent {
  readonly sections: ApiSection[] = [
    {
      title: 'organizer-button',
      description: 'Le composant visuel qui affiche le menu Organizer et renvoie les choix de l’utilisateur.',
      entries: [
        { name: 'config', type: 'OrganizerConfig', description: 'Décrit les champs et les fonctionnalités disponibles dans le menu.', example: '<organizer-button [config]="organizerConfig" ...></organizer-button>' },
        { name: 'state', type: 'OrganizerState', description: 'État courant de la vue. Conservez-le dans le composant parent et repassez-le après chaque changement.', example: '<organizer-button [state]="organizerState" ...></organizer-button>' },
        { name: 'hideMenuValues', type: 'boolean', description: 'Masque les valeurs détaillées dans les menus lorsque votre écran ne doit afficher que les choix.', example: '<organizer-button [hideMenuValues]="true" ...></organizer-button>' },
        { name: 'viewChange', type: 'EventEmitter<OrganizerButtonEvent>', description: 'Émet un nouvel état quand l’utilisateur modifie un champ, un axe, un regroupement, un type de graphique ou un template.', example: '(viewChange)="organizerState = $event.state"' },
        { name: 'sliceStateChange', type: 'EventEmitter<OrganizerSliceState | null>', description: 'Émet les données d’un filtre après son chargement, ou null lorsqu’il est désactivé.', example: '(sliceStateChange)="onSliceStateChange($event)"' },
      ],
    },
    {
      title: 'OrganizerConfig',
      description: 'Configuration des choix proposés par le menu. Ne déclarez que les blocs réellement utiles à votre écran.',
      entries: [
        { name: 'fields', type: 'OrganizerViewField[]', description: 'Liste des indicateurs ou colonnes que l’utilisateur peut afficher ou masquer.', example: "fields: [{ id: 'sales', label: 'Ventes', visible: true }]" },
        { name: 'xFields', type: 'OrganizerXField[]', description: 'Dimensions disponibles pour l’axe X.', example: "xFields: [{ id: 'month', label: 'Mois' }]" },
        { name: 'yFields', type: 'OrganizerYField[]', description: 'Mesures disponibles pour l’axe Y, avec leurs agrégations éventuelles.', example: "yFields: [{ id: 'sales', label: 'Ventes', aggregates: [{ id: 'sum', label: 'Somme' }] }]" },
        { name: 'groups', type: 'OrganizerViewGroup[]', description: 'Clés proposées pour regrouper les données, par exemple par région ou statut.', example: "groups: [{ id: 'region', label: 'Région' }]" },
        { name: 'slices', type: 'OrganizerViewSlice[]', description: 'Filtres disponibles dans le menu ; leurs données peuvent être chargées avec onFetchSliceData.', example: "slices: [{ id: 'region', label: 'Région' }]" },
        { name: 'templates', type: 'OrganizerTemplate[]', description: 'Vues prédéfinies qui appliquent plusieurs choix en une seule action.', example: "templates: [{ id: 'regional', label: 'Vue régionale', groupBy: 'region' }]" },
        { name: 'chartTypes', type: 'OrganizerChartType[]', description: 'Types de graphique proposés par le renderer hôte. Le parent applique ensuite selectedChartType au composant graphique.', example: "chartTypes: [{ id: 'line', label: 'Courbe' }, { id: 'column', label: 'Colonnes' }]" },
        { name: 'showExport', type: 'boolean', description: 'Affiche le menu Export. Avec onExportVisual ou onExportData, il propose ces actions ; sinon il appelle onExport pour un export direct.', example: 'showExport: true,\nonExportData: () => this.exportData()' },
        { name: 'showPreferences', type: 'boolean', description: 'Affiche le menu Préférences avec Éditer, Sauvegarder et Réinitialiser. Les callbacks onPreferencesEdit, onPreferencesSave et onPreferencesClear doivent être fournis par l’application.', example: 'showPreferences: true,\nonPreferencesSave: () => this.savePreferences()' },
        { name: 'showActions', type: 'boolean', description: 'Affiche le menu Actions uniquement lorsqu’un callback onCopyVisual ou onToggleFullscreen est fourni.', example: 'showActions: true,\nonCopyVisual: () => this.copyVisual()' },
        { name: 'switchView', type: '{ currentView, onSwitch }', description: 'Ajoute une action pour basculer entre les vues graphique et tableau. La librairie émet viewSwitched ; elle ne change pas vos composants à votre place.', example: "switchView: { currentView: 'chart', onSwitch: view => this.changeView(view) }" },
        { name: 'showReset', type: 'boolean', description: 'Présent dans le type OrganizerConfig, mais non utilisé par le template actuel du composant : ne produit pas de commande visible.', example: '// Ne pas utiliser comme bouton de reset actuellement' },
        { name: 'onFetchSliceData', type: '(key) => Observable<any[]> | Promise<any[]>', description: 'Charge les valeurs ou les lignes d’un filtre lorsque l’utilisateur l’ouvre.', example: 'onFetchSliceData: key => this.loadFilterValues(key)' },
      ],
    },
    {
      title: 'OrganizerState',
      description: 'État piloté par le parent. Il peut être partiel : seuls les choix utiles à votre intégration sont nécessaires.',
      entries: [
        { name: 'visibleFields', type: 'string[]', description: 'Identifiants des champs actuellement visibles.', example: "visibleFields: ['sales', 'orders']" },
        { name: 'selectedChartType', type: 'string', description: 'Identifiant du type de graphique choisi dans le menu.', example: "selectedChartType: 'line'" },
        { name: 'selectedX', type: 'string', description: 'Identifiant de la dimension sélectionnée pour l’axe X.', example: "selectedX: 'month'" },
        { name: 'selectedY', type: 'string', description: 'Identifiant de la mesure sélectionnée pour l’axe Y.', example: "selectedY: 'sales'" },
        { name: 'selectedYAggregate', type: 'string', description: 'Agrégation sélectionnée pour la mesure Y.', example: "selectedYAggregate: 'sum'" },
        { name: 'selectedGroupBy', type: 'string', description: 'Identifiant du regroupement actif.', example: "selectedGroupBy: 'region'" },
        { name: 'selectedSlices', type: 'string[]', description: 'Identifiants des filtres actifs.', example: "selectedSlices: ['region']" },
        { name: 'selectedTemplate', type: 'string', description: 'Identifiant de la vue prédéfinie active.', example: "selectedTemplate: 'regional'" },
      ],
    },
    {
      title: 'Adaptateurs pour les graphiques',
      description: 'Ces fonctions font le lien entre votre modèle de configuration métier et le composant Organizer. Elles servent surtout aux intégrations de graphiques qui utilisent le modèle OrganizerChartConfig.',
      entries: [
        { name: 'buildOrganizerChartBinding()', type: '(chartConfig, options?) => OrganizerChartBinding', description: 'Construit le binding initial : config du menu et état courant à passer à organizer-button.', example: 'organizer = buildOrganizerChartBinding(chartOptions);' },
        { name: 'handleOrganizerChartEvent()', type: '(event, chartConfig, binding, options?) => OrganizerChartEventResult', description: 'Applique un événement à la configuration métier, reconstruit le binding et indique avec shouldRefetch si les données doivent être rechargées.', example: 'const result = handleOrganizerChartEvent(event, chartOptions, organizer);' },
        { name: 'chartConfigToOrganizer()', type: '(chartConfig, options?) => OrganizerConfig', description: 'Convertit les groupes, indicateurs, filtres et templates du modèle métier en configuration du menu.', example: 'const config = chartConfigToOrganizer(chartOptions);' },
        { name: 'chartConfigToState()', type: '(chartConfig) => OrganizerState', description: 'Déduit l’état sélectionné à partir du modèle métier.', example: 'const state = chartConfigToState(chartOptions);' },
        { name: 'applyOrganizerEventToChart()', type: '(event, chartConfig) => void', description: 'Version bas niveau : applique l’événement au modèle métier sans reconstruire automatiquement le binding.', example: 'applyOrganizerEventToChart(event, chartOptions);' },
      ],
    },
    {
      title: 'slice-panel',
      description: 'Panneau de filtres séparé. Il reçoit l’état émis par organizer-button lorsque le chargement d’un slice est demandé.',
      entries: [
        { name: 'sliceConfigs', type: 'SliceConfig<T>[]', description: 'Définit les filtres statiques affichés par le panneau.', example: '<slice-panel [sliceConfigs]="sliceState.sliceConfigs" ...></slice-panel>' },
        { name: 'data / columns', type: 'T[] / SliceColumnDef<T>[]', description: 'Données et colonnes utilisées pour construire les catégories filtrables.', example: '<slice-panel [data]="sliceState.tasks" [columns]="columns" ...></slice-panel>' },
        { name: 'filterChange', type: 'EventEmitter<(row) => boolean>', description: 'Émet le prédicat à appliquer aux lignes après une sélection de filtre.', example: '(filterChange)="rows = rows.filter($event)"' },
        { name: 'dynamicSliceKeysChange', type: 'EventEmitter<string[]>', description: 'Émet les clés des filtres dynamiques activés.', example: '(dynamicSliceKeysChange)="onDynamicSlices($event)"' },
      ],
    },
  ];
}
