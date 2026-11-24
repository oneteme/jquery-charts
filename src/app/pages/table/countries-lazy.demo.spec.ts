import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  COUNTRIES_ENDPOINT,
  Country,
  CountriesApiService,
  CountriesLazyDemo,
  CountriesResponse,
  NetworkCall,
} from './countries-lazy.demo';

function response(count: number): CountriesResponse {
  return {
    data: {
      countries: Array.from({ length: count }, (_, index) => ({
        code: `C${index}`,
        name: `Pays ${index}`,
        continent: { name: 'Europe' },
        capital: `Capitale ${index}`,
        currency: 'EUR',
      })),
    },
  };
}

describe('CountriesLazyDemo', () => {
  let http: HttpTestingController;
  let changed: jasmine.Spy<() => void>;
  let demo: CountriesLazyDemo;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    changed = jasmine.createSpy<() => void>('changed');
    demo = new CountriesLazyDemo(TestBed.inject(CountriesApiService), changed);
  });

  describe('requête GraphQL', () => {
    it('n’ajoute que les sélections lazy connues, dans l’ordre demandé', () => {
      const api = TestBed.inject(CountriesApiService);

      expect(api.buildQuery(['languages', 'inconnue', 'capital'])).toBe(
        '{ countries { code name continent { name } languages { name } capital } }',
      );
    });

    it('normalise les espaces quand aucune colonne lazy n’est demandée', () => {
      expect(TestBed.inject(CountriesApiService).buildQuery([])).toBe('{ countries { code name continent { name } } }');
    });
  });

  describe('chargement lazy', () => {
    it('relance la requête complète avec les colonnes demandées puis passe à l’état Prêt', () => {
      let rows: Country[] = [];

      demo.lazyLoader(['capital']).subscribe(value => (rows = value));
      expect(demo.state).toBe('Chargement');

      const request = http.expectOne(COUNTRIES_ENDPOINT);
      expect(request.request.body.query).toContain('continent { name } capital }');
      request.flush(response(1));

      expect(rows.map(row => row.capital)).toEqual(['Capitale 0']);
      expect(rows[0].continent).toBe('Europe');
      expect(demo.state).toBe('Prêt');
    });

    it('passe à l’état Erreur et enregistre le statut HTTP quand l’API échoue', () => {
      const errors = jasmine.createSpy('error');

      demo.lazyLoader(['capital']).subscribe({ error: errors });
      http.expectOne(COUNTRIES_ENDPOINT).flush({}, { status: 500, statusText: 'Server Error' });

      expect(demo.state).toBe('Erreur');
      expect(errors).toHaveBeenCalledTimes(1);
      expect(demo.statusDetail(demo.calls[0])).toBe('500 Server Error');
      expect(demo.statusKind(demo.calls[0])).toBe('error');
    });

    it('signale comme ajoutés uniquement les champs absents de la dernière réponse réussie', () => {
      demo.lazyLoader(['capital']).subscribe();
      http.expectOne(COUNTRIES_ENDPOINT).flush(response(1));

      demo.lazyLoader(['capital', 'currency']).subscribe();
      http.expectOne(COUNTRIES_ENDPOINT).flush(response(1));

      const second = demo.calls[1];
      expect(second.querySegments.filter(segment => segment.added).map(segment => segment.text)).toEqual([' currency']);
      expect(second.responseLines.filter(line => line.added).map(line => line.text.trim())).toEqual(['"currency": "EUR"']);
    });

    it('limite l’aperçu de la réponse aux premiers pays et résume le reste', () => {
      demo.lazyLoader(['capital']).subscribe();
      http.expectOne(COUNTRIES_ENDPOINT).flush(response(4));

      const preview = demo.calls[0].responseLines.map(line => line.text).join('\n');
      expect(preview).toContain('1 autres pays');
      expect(preview).toContain('"C2"');
      expect(preview).not.toContain('"C3"');
    });

    it('annule l’appel en cours au désabonnement et le marque dans le journal', () => {
      const subscription = demo.lazyLoader(['capital']).subscribe();

      subscription.unsubscribe();

      expect(demo.calls[0].status).toBe('canceled');
      expect(demo.statusLabel(demo.calls[0])).toBe('(canceled)');
      expect(demo.statusKind(demo.calls[0])).toBe('muted');
    });

    it('simule une panne sans appeler l’API', () => {
      const errors = jasmine.createSpy('error');
      demo.failing = true;

      demo.lazyLoader(['capital']).subscribe({ error: errors });

      http.expectNone(COUNTRIES_ENDPOINT);
      expect(errors).toHaveBeenCalledTimes(1);
      expect(demo.calls[0].status).toBe('failed');
      expect(demo.state).toBe('Erreur');
    });
  });

  describe('journal et chargement initial', () => {
    it('remplit les lignes au chargement initial et masque le tableau jusqu’à la réponse', () => {
      demo.load();
      expect(demo.loading).toBeTrue();

      http.expectOne(COUNTRIES_ENDPOINT).flush(response(2));

      expect(demo.loading).toBeFalse();
      expect(demo.rows.map(row => row.code)).toEqual(['C0', 'C1']);
    });

    it('enregistre le rafraîchissement comme un nouvel appel sélectionné', () => {
      demo.refresh();
      http.expectOne(COUNTRIES_ENDPOINT).flush(response(1));

      expect(demo.calls[0].trigger).toBe('Rafraîchissement');
      expect(demo.selectedCall).toBe(demo.calls[0]);
      expect(demo.rows.length).toBe(1);
    });

    it('conserve seulement les vingt derniers appels', () => {
      demo.failing = true;

      for (let index = 0; index < 21; index++) {
        demo.lazyLoader(['capital']).subscribe({ error: () => undefined });
      }

      expect(demo.calls.length).toBe(20);
      expect(demo.calls[0].id).toBe(2);
      expect(demo.selectedCall?.id).toBe(21);
    });

    it('formate la taille et la durée affichées dans le journal', () => {
      const call = {
        id: 1,
        trigger: 'test',
        method: 'POST',
        url: COUNTRIES_ENDPOINT,
        status: 200,
        statusText: 'OK',
        durationMs: 42,
        sizeBytes: 2048,
        querySegments: [],
        responseLines: [],
      } as NetworkCall;

      expect(demo.sizeLabel(call)).toBe('2,0 ko');
      expect(demo.timeLabel(call)).toBe('42 ms');
      expect(demo.sizeLabel({ ...call, sizeBytes: null })).toBe('—');
    });
  });
});
