import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  OrganizerButtonComponent,
  OrganizerButtonEvent,
  OrganizerConfig,
  OrganizerState,
} from '@oneteme/jquery-organizer';

interface OrganizerExample {
  id: 'fields' | 'axes' | 'views';
  index: string;
  title: string;
  description: string;
  tags: string[];
  config: OrganizerConfig;
  state: OrganizerState;
  lastEvent: string;
  code: string;
}

@Component({
  selector: 'app-organizer-documentation',
  standalone: true,
  imports: [CommonModule, RouterLink, OrganizerButtonComponent],
  templateUrl: './organizer-documentation.component.html',
  styleUrls: ['./organizer-documentation.component.scss'],
})
export class OrganizerDocumentationComponent {
  readonly tableRows: Record<string, string>[] = [
    { reference: 'INT-2410', client: 'Ville de Lyon', team: 'Raccordement', status: 'Terminé' },
    { reference: 'INT-2409', client: 'Métropole de Lille', team: 'Dépannage', status: 'Ouvert' },
    { reference: 'INT-2408', client: 'Agglomération de Nantes', team: 'Maintenance', status: 'En cours' },
  ];

  readonly examples: OrganizerExample[] = [
    {
      id: 'fields',
      index: '01',
      title: 'Personnaliser les colonnes d’un tableau',
      description: 'Le cas d’usage le plus courant : le menu Champs masque ou réaffiche les colonnes d’un tableau sans modifier les données.',
      tags: ['fields', 'visibleFields', 'table'],
      config: {
        fields: [
          { id: 'reference', label: 'Référence', visible: true },
          { id: 'client', label: 'Client', visible: true },
          { id: 'team', label: 'Équipe', visible: true },
          { id: 'status', label: 'Statut', visible: true },
        ],
      },
      state: { visibleFields: ['reference', 'client', 'team', 'status'] },
      lastEvent: 'Aucune modification',
      code: `readonly config: OrganizerConfig = {
  fields: [
    { id: 'reference', label: 'Référence', visible: true },
    { id: 'client', label: 'Client', visible: true },
    { id: 'team', label: 'Équipe', visible: true },
    { id: 'status', label: 'Statut', visible: true },
  ],
};

onViewChange(event: OrganizerButtonEvent): void {
  this.state = event.state;
}`,
    },
    {
      id: 'axes',
      index: '02',
      title: 'Changer les axes et l’agrégation',
      description: 'Les champs X et Y proposent des dimensions et des mesures. Une mesure peut exposer plusieurs agrégations dans un sous-menu.',
      tags: ['xFields', 'yFields', 'aggregates'],
      config: {
        xFields: [
          { id: 'month', label: 'Mois' },
          { id: 'region', label: 'Région' },
          { id: 'channel', label: 'Canal' },
        ],
        yFields: [
          { id: 'revenue', label: 'Chiffre d’affaires', aggregates: [{ id: 'sum', label: 'Somme' }, { id: 'average', label: 'Moyenne' }] },
          { id: 'orders', label: 'Commandes', aggregates: [{ id: 'count', label: 'Nombre' }, { id: 'average', label: 'Moyenne' }] },
        ],
      },
      state: { selectedX: 'month', selectedY: 'revenue', selectedYAggregate: 'sum' },
      lastEvent: 'Aucune modification',
      code: `readonly config: OrganizerConfig = {
  xFields: [{ id: 'month', label: 'Mois' }],
  yFields: [{
    id: 'revenue',
    label: 'Chiffre d’affaires',
    aggregates: [
      { id: 'sum', label: 'Somme' },
      { id: 'average', label: 'Moyenne' },
    ],
  }],
};`,
    },
    {
      id: 'views',
      index: '03',
      title: 'Préparer une vue avec regroupement et filtres',
      description: 'Les groupes, slices et templates permettent de proposer des lectures métier prêtes à choisir, tout en gardant l’état piloté par le parent.',
      tags: ['groups', 'slices', 'templates'],
      config: {
        groups: [
          { id: 'region', label: 'Région' },
          { id: 'status', label: 'Statut' },
          { id: 'channel', label: 'Canal' },
        ],
        slices: [
          { id: 'region', label: 'Région' },
          { id: 'status', label: 'Statut' },
        ],
        templates: [
          { id: 'regional', label: 'Vue régionale', groupBy: 'region', selectedSlices: ['region'] },
          { id: 'operations', label: 'Suivi opérationnel', groupBy: 'status', selectedSlices: ['status'] },
        ],
      },
      state: { selectedGroupBy: 'region', selectedSlices: ['region'], selectedTemplate: 'regional' },
      lastEvent: 'Aucune modification',
      code: `readonly config: OrganizerConfig = {
  groups: [{ id: 'region', label: 'Région' }],
  slices: [{ id: 'status', label: 'Statut' }],
  templates: [{
    id: 'regional',
    label: 'Vue régionale',
    groupBy: 'region',
    selectedSlices: ['region'],
  }],
};`,
    },
  ];

  onViewChange(example: OrganizerExample, event: OrganizerButtonEvent): void {
    example.state = event.state;
    example.lastEvent = `${this.eventLabel(event.type)} · ${this.stateSummary(example)}`;
  }

  isFieldVisible(example: OrganizerExample, fieldId: string): boolean {
    return example.state.visibleFields?.includes(fieldId) ?? false;
  }

  fieldLabel(example: OrganizerExample, fieldId: string): string {
    return example.config.fields?.find(field => field.id === fieldId)?.label ?? fieldId;
  }

  xLabel(example: OrganizerExample): string {
    const id = example.state.selectedX;
    return example.config.xFields?.find(field => field.id === id)?.label ?? id ?? 'Aucun axe';
  }

  yLabel(example: OrganizerExample): string {
    const id = example.state.selectedY;
    const yField = example.config.yFields?.find(field => field.id === id);
    const aggregate = yField?.aggregates?.find(item => item.id === example.state.selectedYAggregate);
    if (!yField) {
      return 'Aucune mesure';
    }
    const aggregateLabel = aggregate ? ` · ${aggregate.label}` : '';
    return `${yField.label}${aggregateLabel}`;
  }

  groupLabel(example: OrganizerExample): string {
    const id = example.state.selectedGroupBy;
    return example.config.groups?.find(group => group.id === id)?.label ?? 'Aucun regroupement';
  }

  selectedSliceLabels(example: OrganizerExample): string[] {
    return (example.state.selectedSlices ?? []).map(id => example.config.slices?.find(slice => slice.id === id)?.label ?? id);
  }

  templateLabel(example: OrganizerExample): string {
    const id = example.state.selectedTemplate;
    return example.config.templates?.find(template => template.id === id)?.label ?? 'Vue personnalisée';
  }

  private eventLabel(type: OrganizerButtonEvent['type']): string {
    const labels: Record<OrganizerButtonEvent['type'], string> = {
      fieldToggled: 'Champ modifié',
      xSelected: 'Axe X modifié',
      ySelected: 'Axe Y modifié',
      groupBySelected: 'Regroupement modifié',
      templateSelected: 'Template appliqué',
      sliceSelected: 'Filtre modifié',
      chartTypeSelected: 'Type de graphique modifié',
      reset: 'État réinitialisé',
      viewSwitched: 'Vue modifiée',
    };
    return labels[type];
  }

  private stateSummary(example: OrganizerExample): string {
    if (example.id === 'fields') {
      return `${example.state.visibleFields?.length ?? 0} colonne(s) visible(s)`;
    }
    if (example.id === 'axes') {
      return `${this.xLabel(example)} → ${this.yLabel(example)}`;
    }
    return `${this.groupLabel(example)} · ${this.selectedSliceLabels(example).length} filtre(s)`;
  }
}
