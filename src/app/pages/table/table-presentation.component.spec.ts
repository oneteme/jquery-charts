import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TablePresentationComponent } from './table-presentation.component';

describe('TablePresentationComponent', () => {
  let component: TablePresentationComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TablePresentationComponent] });
    component = TestBed.createComponent(TablePresentationComponent).componentInstance;
  });

  it('charge les interventions à l’initialisation et lève l’état de chargement', () => {
    expect(component.isLoading).toBeTrue();

    component.ngOnInit();

    expect(component.isLoading).toBeFalse();
    expect(component.interventions[0].reference).toBe('INT-2024-0001');
  });

  it('ajoute nbCompteurs aux lignes une fois le délai écoulé lorsque la colonne est demandée', fakeAsync(() => {
    component.ngOnInit();

    component.onLazyColumnsRequested(['reference', 'nbCompteurs']);
    tick(1199);
    expect(component.interventions[0].nbCompteurs).toBeUndefined();

    tick(1);
    expect(component.interventions[0].nbCompteurs).toBe(12);
    expect(component.interventions[1].nbCompteurs).toBe(19);
  }));

  it('n’ajoute pas nbCompteurs lorsque la colonne n’est pas demandée', fakeAsync(() => {
    component.ngOnInit();

    component.onLazyColumnsRequested(['reference']);
    tick(1200);

    expect(component.interventions.every(i => i.nbCompteurs === undefined)).toBeTrue();
  }));

  it('mémorise la ligne sélectionnée', () => {
    component.ngOnInit();
    const row = component.interventions[3];

    component.onRowSelected(row);

    expect(component.selectedRow).toBe(row);
  });

  it('traduit les libellés connus et renvoie la valeur brute pour un libellé inconnu', () => {
    expect(component.typeLabel('dépannage')).toBe('Dépannage');
    expect(component.statutLabel('planifiée')).toBe('Planifiée');
    expect(component.prioriteLabel('haute')).toBe('Haute');

    expect(component.typeLabel('inconnu')).toBe('inconnu');
    expect(component.statutLabel('inconnu')).toBe('inconnu');
    expect(component.prioriteLabel('inconnu')).toBe('inconnu');
  });

  it('produit des classes CSS sans accents et conserve la valeur brute pour un type inconnu', () => {
    expect(component.typeCssClass('dépannage')).toBe('badge-type--depannage');
    expect(component.statutCssClass('terminée')).toBe('badge-statut--terminee');
    expect(component.statutCssClass('en cours')).toBe('badge-statut--en-cours');
    expect(component.typeCssClass('autre')).toBe('badge-type--autre');
  });

  it('ouvre une alerte récapitulative et empêche la propagation du clic', () => {
    component.ngOnInit();
    const row = component.interventions[0];
    const alertSpy = spyOn(window, 'alert');
    const event = new Event('click');
    spyOn(event, 'stopPropagation');

    component.viewIntervention(row, event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledOnceWith(
      `${row.reference}\n${row.type} — ${row.commune}\nTechnicien : ${row.technicien}`
    );
  });
});
