import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OrganizerButtonEvent } from '@oneteme/jquery-organizer';
import { OrganizerDocumentationComponent } from './organizer-documentation.component';

describe('OrganizerDocumentationComponent', () => {
  let component: OrganizerDocumentationComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [OrganizerDocumentationComponent], providers: [provideRouter([])] });
    component = TestBed.createComponent(OrganizerDocumentationComponent).componentInstance;
  });

  it('résume le dernier événement et l’état de l’exemple modifié', () => {
    const example = component.examples[0];

    component.onViewChange(example, {
      type: 'fieldToggled',
      state: { visibleFields: ['reference', 'status'] },
    } as OrganizerButtonEvent);

    expect(example.lastEvent).toBe('Champ modifié · 2 colonne(s) visible(s)');
  });

  it('affiche la mesure avec son agrégation sélectionnée, ou « Aucune mesure » sans champ Y', () => {
    const axes = component.examples[1];
    axes.state = { selectedY: 'revenue', selectedYAggregate: 'average' };

    expect(component.yLabel(axes)).toBe('Chiffre d’affaires · Moyenne');

    axes.state = { selectedY: 'unknown' };
    expect(component.yLabel(axes)).toBe('Aucune mesure');
  });

  it('retombe sur l’identifiant quand un champ est absent de la configuration', () => {
    const fields = component.examples[0];

    expect(component.fieldLabel(fields, 'unknown')).toBe('unknown');
    expect(component.selectedSliceLabels(component.examples[2])).toEqual(['Région']);
  });

  it('utilise un libellé de repli quand aucun axe, regroupement ou template ne correspond', () => {
    const views = component.examples[2];

    views.state = { selectedGroupBy: 'missing', selectedTemplate: 'missing' };

    expect(component.xLabel(component.examples[1])).toBe('Mois');
    expect(component.groupLabel(views)).toBe('Aucun regroupement');
    expect(component.templateLabel(views)).toBe('Vue personnalisée');
  });
});
