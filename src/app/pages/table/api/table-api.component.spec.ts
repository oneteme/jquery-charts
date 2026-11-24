import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { col } from '@oneteme/jquery-table';
import { TableApiComponent } from './table-api.component';

describe('TableApiComponent', () => {
  let component: TableApiComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TableApiComponent],
      providers: [provideRouter([]), provideHttpClient()],
    });
    component = TestBed.createComponent(TableApiComponent).componentInstance;
  });

  it('bascule la panne simulée du chargeur à chaque appel', () => {
    component.toggleLazyFailure();
    expect(component.countries.failing).toBeTrue();

    component.toggleLazyFailure();
    expect(component.countries.failing).toBeFalse();
  });

  it('affiche le sens du tri, ou « Aucun tri » quand la direction est vide', () => {
    component.onSortChange({ active: 'name', direction: 'desc' });
    expect(component.lastSort).toBe('name · desc');

    component.onSortChange({ active: 'name', direction: '' });
    expect(component.lastSort).toBe('Aucun tri');
  });

  it('affiche la page en base 1 avec le nombre de lignes', () => {
    component.onPageChange({ pageIndex: 2, pageSize: 25 });

    expect(component.lastPage).toBe('page 3 · 25 lignes');
  });

  it('revient à « Aucun » quand le regroupement est supprimé', () => {
    component.onGroupByChange('status');
    expect(component.lastGroupBy).toBe('status');

    component.onGroupByChange(null);
    expect(component.lastGroupBy).toBe('Aucun');
  });

  it('signale la colonne ajoutée ou retirée à la place de la liste précédente', () => {
    component.onColumnsChange(['reference', 'status']);

    component.onColumnAdded(col('team', 'Équipe'));
    expect(component.lastColumns).toBe('Ajout : team');

    component.onColumnRemoved(col('status', 'Statut'));
    expect(component.lastColumns).toBe('Retrait : status');
  });

  it('incrémente le jeton de réinitialisation pour que la recherche soit vidée', () => {
    component.resetSearch();
    component.resetSearch();

    expect(component.clearSearchToken).toBe(2);
  });
});
