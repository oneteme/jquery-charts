import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

@Component({ template: '', standalone: true })
class StubPageComponent {}

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AppComponent],
      providers: [
        provideRouter([
          { path: '', component: StubPageComponent, pathMatch: 'full' },
          { path: 'produit', component: StubPageComponent, pathMatch: 'full' },
          { path: 'demarrer', component: StubPageComponent },
          { path: '**', component: StubPageComponent, data: { notFound: true } },
        ]),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    router = TestBed.inject(Router);
  });

  function createAt(url: string): AppComponent {
    spyOnProperty(router, 'url', 'get').and.returnValue(url);
    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('masque la barre latérale sur l accueil et la page produit', () => {
    expect(createAt('/').showSidebar).withContext('accueil').toBeFalse();
  });

  it('affiche la barre latérale sur les pages de contenu', () => {
    expect(createAt('/charts/echarts').showSidebar).toBeTrue();
  });

  it('met à jour la barre latérale à chaque navigation', async () => {
    const component = createAt('/');

    await router.navigateByUrl('/demarrer');
    expect(component.showSidebar).withContext('vers une page de contenu').toBeTrue();

    await router.navigateByUrl('/produit');
    expect(component.showSidebar).withContext('vers la page produit').toBeFalse();
  });

  it('masque la barre latérale sur une page introuvable', async () => {
    const component = createAt('/demarrer');

    await router.navigateByUrl('/page-inexistante');

    expect(component.showSidebar).toBeFalse();
  });

  it('remonte la zone principale en haut à chaque navigation', async () => {
    createAt('/');
    const main: HTMLElement = fixture.nativeElement.querySelector('main');
    const scrollTo = spyOn(main, 'scrollTo') as unknown as jasmine.Spy<(options: ScrollToOptions) => void>;

    await router.navigateByUrl('/demarrer');

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0 });
  });
});
