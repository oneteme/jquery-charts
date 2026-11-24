import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ECHARTS_DETAIL_SECTIONS } from 'src/app/pages/charts/chart-example-sections';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let component: SidebarComponent;
  let router: Router;

  const echartsLib = () => component.libs.find(lib => lib.key === 'echarts')!;
  const highchartsLib = () => component.libs.find(lib => lib.key === 'highcharts')!;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SidebarComponent],
      providers: [provideRouter([])],
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
  });

  function createWithUrl(url: string): void {
    spyOnProperty(router, 'url', 'get').and.returnValue(url);
    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('déplie la bibliothèque du graphique courant au chargement', () => {
    createWithUrl(`/charts/echarts/${ECHARTS_DETAIL_SECTIONS[0].id}`);

    expect(component.isExpanded('echarts')).toBeTrue();
    expect(component.isExpanded('highcharts')).toBeFalse();
  });

  it('navigue vers la galerie et déplie la bibliothèque choisie', async () => {
    createWithUrl('/');

    component.goToLib(highchartsLib());
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledOnceWith(['/charts/highcharts']);
    expect(component.isExpanded('highcharts')).toBeTrue();
  });

  it('replie la bibliothèque lorsqu on clique sur celle déjà dépliée', async () => {
    createWithUrl('/charts/highcharts');

    component.goToLib(highchartsLib());
    await fixture.whenStable();

    expect(component.isExpanded('highcharts')).toBeFalse();
  });

  it('bascule le dépliage sans naviguer et ne garde qu une bibliothèque ouverte', () => {
    createWithUrl('/');

    component.toggleExpand(echartsLib(), new Event('click'));
    expect(component.isExpanded('echarts')).toBeTrue();

    component.toggleExpand(highchartsLib(), new Event('click'));
    expect(component.isExpanded('echarts')).withContext('echarts replié').toBeFalse();
    expect(component.isExpanded('highcharts')).withContext('highcharts déplié').toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('navigue vers un type de graphique et ferme le menu mobile', () => {
    createWithUrl('/');
    component.isMenuOpen = true;

    component.goToType(echartsLib(), { id: 'bar', label: 'Bar' });

    expect(router.navigate).toHaveBeenCalledOnceWith(['/charts/echarts', 'bar']);
    expect(component.isMenuOpen).toBeFalse();
  });

  it('marque uniquement le type correspondant à l URL courante', () => {
    createWithUrl('/charts/echarts/bar');

    expect(component.isActiveType(echartsLib(), { id: 'bar', label: 'Bar' })).toBeTrue();
    expect(component.isActiveType(echartsLib(), { id: 'line', label: 'Line' })).toBeFalse();
  });
});
