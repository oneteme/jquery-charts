import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TableExempleComponent } from './table.component';
import { COUNTRIES_ENDPOINT } from './countries-lazy.demo';

describe('TableExempleComponent', () => {
  let component: TableExempleComponent;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TableExempleComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
    component = TestBed.createComponent(TableExempleComponent).componentInstance;
  });

  it('charge les pays depuis l’API publique à l’initialisation', () => {
    component.ngOnInit();

    const request = httpMock.expectOne(COUNTRIES_ENDPOINT);
    expect(request.request.method).toBe('POST');
    request.flush({ data: { countries: [] } });
  });

  it('affiche la référence de la ligne sélectionnée, ou le code et le nom d’un pays', () => {
    component.onRowSelected({ reference: 'INT-2410' });
    expect(component.selectedReference).toBe('INT-2410');

    component.onRowSelected({ code: 'FR', name: 'France' });
    expect(component.selectedReference).toBe('FR · France');
  });

  it('retourne le code de l’onglet actif propre à chaque exemple', () => {
    const [overview, view] = component.examples;

    component.selectCodeTab(overview, 'html');

    expect(component.codeFor(overview)).toContain('<jquery-table');
    expect(component.codeFor(view)).toBe(view.code.ts);
  });
});
