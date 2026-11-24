import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { ChartTypesService } from 'src/app/core/services/chart-types.service';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let component: HeaderComponent;
  let router: Router;
  let chartTypes: ChartTypesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HeaderComponent],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    chartTypes = TestBed.inject(ChartTypesService);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
  });

  function setUrl(url: string): void {
    spyOnProperty(router, 'url', 'get').and.returnValue(url);
  }

  it('marque Produit comme actif sur l accueil, avec ou sans paramètres', () => {
    setUrl('/produit?source=menu');

    expect(component.isProductActive()).toBeTrue();
    expect(component.isUsageActive()).toBeFalse();
  });

  it('marque Utilisation comme actif sur les pages de documentation', () => {
    setUrl('/demarrer#installation');

    expect(component.isProductActive()).toBeFalse();
    expect(component.isUsageActive()).toBeTrue();
  });

  it('réinitialise le type sélectionné et revient à l accueil depuis le logo', () => {
    spyOn(chartTypes, 'resetSelectedType');
    fixture.debugElement.query(By.css('.header-left')).nativeElement.click();

    expect(chartTypes.resetSelectedType).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/']);
  });

  it('ouvre la page npm de la bibliothèque choisie dans un nouvel onglet isolé', () => {
    spyOn(window, 'open');
    component.showInstallMenu = true;

    component.goToInstall('echarts');

    expect(window.open).toHaveBeenCalledOnceWith(
      'https://www.npmjs.com/package/@oneteme/jquery-echarts',
      '_blank',
      'noopener,noreferrer'
    );
    expect(component.showInstallMenu).toBeFalse();
  });

  it('garde le menu npm ouvert pour un clic à l intérieur et le ferme pour un clic extérieur', () => {
    const toggle: HTMLButtonElement = fixture.debugElement.query(By.css('.download-btn')).nativeElement;

    toggle.click();
    expect(component.showInstallMenu).withContext('ouverture par le bouton').toBeTrue();

    toggle.click();
    document.body.click();
    expect(component.showInstallMenu).withContext('clic extérieur').toBeFalse();
  });
});
