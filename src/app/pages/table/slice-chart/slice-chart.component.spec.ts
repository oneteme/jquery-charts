import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SliceChartComponent } from './slice-chart.component';

describe('SliceChartComponent', () => {
  let component: SliceChartComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SliceChartComponent], providers: [provideRouter([])] });
    component = TestBed.createComponent(SliceChartComponent).componentInstance;
  });

  it('recalcule les compteurs par développeur à partir des lignes filtrées', () => {
    component.onFilterChange(task => task.priority === 'Haute');

    expect(component.chartData.find(stat => stat.owner === 'Amine')).toEqual({
      owner: 'Amine',
      done: 1,
      inProgress: 1,
      backlog: 0,
    });
  });

  it('conserve tous les développeurs même quand le filtre ne retient aucune ligne', () => {
    component.onFilterChange(() => false);

    expect(component.chartData.length).toBe(4);
    expect(component.chartData.every(stat => stat.done + stat.inProgress + stat.backlog === 0)).toBeTrue();
  });

  it('expose les libellés de tous les filtres actifs à plat', () => {
    component.onActiveKeysChange([['Haute'], ['Terminé', 'En cours']]);

    expect(component.activeFilterLabels).toEqual(['Haute', 'Terminé', 'En cours']);
  });

  it('affiche le code correspondant à l’onglet sélectionné', () => {
    expect(component.activeCode).toBe(component.codeTs);

    component.selectCodeTab('html');
    expect(component.activeCode).toBe(component.codeHtml);

    component.selectCodeTab('scss');
    expect(component.activeCode).toBe(component.codeScss);
  });
});
