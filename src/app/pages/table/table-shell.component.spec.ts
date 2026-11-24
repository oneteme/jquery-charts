import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TableShellComponent } from './table-shell.component';

describe('TableShellComponent', () => {
  let component: TableShellComponent;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TableShellComponent] });
    router = TestBed.inject(Router);
    component = TestBed.createComponent(TableShellComponent).componentInstance;
  });

  it('détecte la page présentation à partir de l’URL courante', () => {
    spyOnProperty(router, 'url', 'get').and.returnValue('/table/presentation');

    expect(component.isPresentation).toBeTrue();
  });

  it('ne considère pas les autres sous-pages comme une présentation', () => {
    spyOnProperty(router, 'url', 'get').and.returnValue('/table/comparatif');

    expect(component.isPresentation).toBeFalse();
  });
});
