import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { ECHARTS_EXAMPLES } from 'src/app/data/chart/echarts-examples.data';
import { StackBlitzService } from 'src/app/core/services/stackblitz.service';
import { ECHARTS_DETAIL_SECTIONS } from '../charts/chart-example-sections';
import { EChartsDetailComponent } from './echarts-detail.component';

describe('EChartsDetailComponent', () => {
  let component: EChartsDetailComponent;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let router: Router;
  let stackBlitz: jasmine.SpyObj<StackBlitzService>;

  const [first, second, third] = ECHARTS_DETAIL_SECTIONS;

  function createWithType(type: string): void {
    params.next(convertToParamMap({ type }));
    component.ngOnInit();
  }

  beforeEach(() => {
    params = new BehaviorSubject(convertToParamMap({}));
    stackBlitz = jasmine.createSpyObj<StackBlitzService>('StackBlitzService', ['openExample']);
    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: { paramMap: params.asObservable() } },
        { provide: StackBlitzService, useValue: stackBlitz },
      ],
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    component = TestBed.createComponent(EChartsDetailComponent).componentInstance;
  });

  it('charge la section demandée avec ses voisines précédente et suivante', () => {
    createWithType(second.id);

    expect(component.section).toBe(second);
    expect(component.prev).toBe(first);
    expect(component.next).toBe(third);
    expect(component.currentConfig).toBe(ECHARTS_EXAMPLES[second.exampleKey].config);
  });

  it('n’a pas de section précédente sur la première page et pas de suivante sur la dernière', () => {
    createWithType(first.id);
    expect(component.prev).toBeNull();

    createWithType(ECHARTS_DETAIL_SECTIONS[ECHARTS_DETAIL_SECTIONS.length - 1].id);
    expect(component.next).toBeNull();
  });

  it('redirige vers la galerie quand le type demandé n’existe pas', () => {
    createWithType('type-inconnu');

    expect(component.section).toBeNull();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/charts/echarts']);
  });

  it('bascule l’affichage du code et le referme au changement de section', () => {
    createWithType(first.id);

    component.toggleCode();
    expect(component.isCodeOpen).toBeTrue();

    createWithType(second.id);
    expect(component.isCodeOpen).toBeFalse();
  });

  it('ouvre la section courante dans StackBlitz avec sa configuration et ses données', () => {
    createWithType(second.id);

    component.openInStackBlitz(new Event('click'));

    expect(stackBlitz.openExample).toHaveBeenCalledOnceWith('echarts', second, {
      config: ECHARTS_EXAMPLES[second.exampleKey].config,
      data: ECHARTS_EXAMPLES[second.exampleKey].data ?? [],
    });
  });
});
