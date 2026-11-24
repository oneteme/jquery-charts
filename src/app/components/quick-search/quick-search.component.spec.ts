import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { QuickSearchComponent } from './quick-search.component';

describe('QuickSearchComponent', () => {
  let fixture: ComponentFixture<QuickSearchComponent>;
  let component: QuickSearchComponent;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [QuickSearchComponent],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(QuickSearchComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
  });

  function pressKey(key: string, init: KeyboardEventInit = {}): void {
    component.onKeydown(new KeyboardEvent('keydown', { key, ...init }));
  }

  it('ouvre la recherche avec Ctrl+K ou Cmd+K', () => {
    pressKey('k', { ctrlKey: true });
    expect(component.isOpen).withContext('Ctrl+K').toBeTrue();

    component.close();
    pressKey('k', { metaKey: true });
    expect(component.isOpen).withContext('Cmd+K').toBeTrue();
  });

  it('affiche huit résultats initiaux quand la requête est vide', () => {
    component.open();
    expect(component.results.length).toBe(8);
  });

  it('ferme la recherche avec Échap et réinitialise la requête', () => {
    component.open();
    component.onQuery('echarts');

    pressKey('Escape');

    expect(component.isOpen).toBeFalse();
    expect(component.query).toBe('');
    expect(component.results).toEqual([]);
  });

  it('ignore les touches de navigation et Entrée quand la recherche est fermée', () => {
    pressKey('ArrowDown');
    pressKey('Enter');

    expect(component.activeIndex).toBe(0);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('filtre sans tenir compte des accents', () => {
    component.onQuery('demarrer');

    expect(component.results.map(item => item.route)).toContain('/demarrer');
  });

  it('limite les résultats à dix éléments', () => {
    component.onQuery('exemple');

    expect(component.results.length).toBe(10);
  });

  it('borne la sélection active entre le premier et le dernier résultat', () => {
    component.open();
    component.onQuery('api');
    const lastIndex = component.results.length - 1;

    for (let i = 0; i < lastIndex + 3; i++) pressKey('ArrowDown');
    expect(component.activeIndex).withContext('bas de liste').toBe(lastIndex);

    for (let i = 0; i < lastIndex + 3; i++) pressKey('ArrowUp');
    expect(component.activeIndex).withContext('haut de liste').toBe(0);
  });

  it('ouvre le résultat actif avec Entrée puis ferme la recherche', () => {
    component.open();
    component.onQuery('atelier');

    pressKey('Enter');

    expect(router.navigate).toHaveBeenCalledOnceWith(['/atelier']);
    expect(component.isOpen).toBeFalse();
  });

  it('entoure la correspondance par une balise mark', () => {
    component.onQuery('echarts');

    expect(component.highlightMatch('ECharts — Galerie')).toBe('<mark>ECharts</mark> — Galerie');
  });

  it('traite les caractères spéciaux de la requête comme du texte', () => {
    component.onQuery('(');

    expect(component.highlightMatch('Pie (test)')).toBe('Pie <mark>(</mark>test)');
  });
});
