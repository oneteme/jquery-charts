import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { finalize, map, Observable, tap, throwError } from 'rxjs';

/** API publique GraphQL (CORS ouvert, sans clé) : https://countries.trevorblades.com */
export const COUNTRIES_ENDPOINT = 'https://countries.trevorblades.com/graphql';

/** Colonne lazy de la table -> sélection GraphQL à ajouter à la requête complète. */
const LAZY_SELECTIONS: Record<string, string> = {
  capital: 'capital',
  currency: 'currency',
  languages: 'languages { name }',
};

export interface Country {
  code: string;
  name: string;
  continent: string;
  capital?: string | null;
  currency?: string | null;
  languages?: string;
}

export interface CountriesResponse {
  data: {
    countries: Array<{
      code: string;
      name: string;
      continent: { name: string };
      capital?: string | null;
      currency?: string | null;
      languages?: Array<{ name: string }>;
    }>;
  };
}

@Injectable({ providedIn: 'root' })
export class CountriesApiService {
  private readonly http = inject(HttpClient);

  /** Sélections GraphQL des colonnes lazy connues, dans l'ordre demandé. */
  selections(lazyColumns: readonly string[]): Array<{ column: string; selection: string }> {
    return lazyColumns.filter(column => column in LAZY_SELECTIONS).map(column => ({ column, selection: LAZY_SELECTIONS[column] }));
  }

  /** Requête complète : colonnes de base + sélections des colonnes lazy déjà demandées. */
  buildQuery(lazyColumns: readonly string[]): string {
    const lazy = this.selections(lazyColumns).map(item => item.selection);
    return `{ countries { code name continent { name } ${lazy.join(' ')} } }`.replace(/ {2,}/g, ' ');
  }

  request(query: string): Observable<HttpResponse<CountriesResponse>> {
    return this.http.post<CountriesResponse>(COUNTRIES_ENDPOINT, { query }, { observe: 'response' });
  }

  toRows(response: CountriesResponse): Country[] {
    return response.data.countries.map(country => ({
      ...country,
      continent: country.continent.name,
      languages: country.languages?.map(language => language.name).join(', '),
    }));
  }
}

/** Morceau de la requête GraphQL ; `added` marque les champs absents de la dernière requête réussie. */
export interface QuerySegment {
  text: string;
  added: boolean;
}

export interface ResponseLine {
  text: string;
  added: boolean;
}

/** Appel API tel que l'onglet Network du navigateur l'affiche. */
export interface NetworkCall {
  id: number;
  trigger: string;
  method: 'POST';
  url: string;
  status: number | 'pending' | 'canceled' | 'failed';
  statusText: string;
  durationMs: number | null;
  sizeBytes: number | null;
  querySegments: QuerySegment[];
  responseLines: ResponseLine[];
}

export type NetworkTab = 'payload' | 'response';

/** Nombre de pays détaillés dans l'aperçu de la réponse ; le reste est résumé par un commentaire. */
const RESPONSE_PREVIEW_COUNT = 3;
const MAX_CALLS = 20;

/**
 * État d'un exemple de colonnes lazy : lignes de base (`[data]`), chargement initial, état du chargeur de la config
 * et journal des appels API. Le chargeur lazy de la table est `lazyLoader` ; le chargement initial et le
 * rafraîchissement restent ceux de l'application.
 */
export class CountriesLazyDemo {
  /** Lignes de base : colonnes non lazy uniquement. */
  rows: Country[] = [];
  /** Premier chargement : le tableau est masqué par `[isLoading]` jusqu'à la première réponse. */
  loading = false;
  state: 'Prêt' | 'Chargement' | 'Erreur' = 'Prêt';
  /** Simule une panne : les requêtes échouent sans appeler l'API. */
  failing = false;
  requested: string[] = [];
  requestCount = 0;
  lastQuery = '';

  /** Journal façon onglet Network : le plus ancien en premier. */
  calls: NetworkCall[] = [];
  selectedId: number | null = null;
  networkTab: NetworkTab = 'payload';

  private callSeq = 0;
  /** Colonnes de la dernière réponse réussie : sert à repérer les champs ajoutés par la requête suivante. */
  private confirmed: string[] = [];

  constructor(private readonly api: CountriesApiService, private readonly changed: () => void) {}

  /** À donner à `config.lazyLoader` : relance la requête complète avec les colonnes lazy demandées (cumul). */
  readonly lazyLoader = (columns: string[]): Observable<Country[]> => {
    this.requested = columns;
    this.setState('Chargement');
    return this.run(`lazyLoader([${columns.map(column => `'${column}'`).join(', ')}])`, columns).pipe(
      tap({
        next: () => this.setState('Prêt'),
        error: () => this.setState('Erreur'),
      }),
    );
  };

  get selectedCall(): NetworkCall | null {
    return this.calls.find(call => call.id === this.selectedId) ?? null;
  }

  select(id: number): void {
    this.selectedId = id;
  }

  statusLabel(call: NetworkCall): string {
    return typeof call.status === 'number' ? String(call.status) : `(${call.status})`;
  }

  statusDetail(call: NetworkCall): string {
    return typeof call.status === 'number' ? `${call.status} ${call.statusText}` : call.statusText;
  }

  statusKind(call: NetworkCall): 'ok' | 'error' | 'muted' {
    if (call.status === 'failed' || (typeof call.status === 'number' && call.status >= 400)) return 'error';
    return typeof call.status === 'number' ? 'ok' : 'muted';
  }

  /** Vrai si l'appel ajoute au moins un champ par rapport à la dernière réponse réussie. */
  hasAdded(call: NetworkCall): boolean {
    return call.querySegments.some(segment => segment.added);
  }

  sizeLabel(call: NetworkCall): string {
    if (call.sizeBytes === null) return '—';
    return call.sizeBytes < 1024 ? `${call.sizeBytes} o` : `${(call.sizeBytes / 1024).toFixed(1).replace('.', ',')} ko`;
  }

  timeLabel(call: NetworkCall): string {
    return call.durationMs === null ? '—' : `${call.durationMs} ms`;
  }

  /** Requête de base de l'application : le tableau est masqué par le chargement jusqu'\u00e0 la premi\u00e8re r\u00e9ponse. */
  load(): void {
    this.loading = true;
    this.run('Chargement initial', []).subscribe({
      next: rows => this.setRows(rows),
      error: () => this.setLoading(false),
    });
  }

  /**
   * Rafra\u00eechissement de l'application : elle ne conna\u00eet que les colonnes de base. La table d\u00e9tecte le nouveau `data`
   * et rappelle `lazyLoader` pour les colonnes d\u00e9j\u00e0 demand\u00e9es, d'o\u00f9 une seconde requ\u00eate dans le journal.
   */
  refresh(): void {
    this.run('Rafra\u00eechissement', []).subscribe({ next: rows => this.setRows(rows) });
  }

  private setRows(rows: Country[]): void {
    this.rows = rows;
    this.loading = false;
    this.changed();
  }

  private setLoading(loading: boolean): void {
    this.loading = loading;
    this.changed();
  }

  private setState(state: 'Pr\u00eat' | 'Chargement' | 'Erreur'): void {
    this.state = state;
    this.changed();
  }

  /** Requ\u00eate compl\u00e8te pour ces colonnes lazy ; se d\u00e9sabonner l'annule et marque l'appel `canceled` dans le journal. */
  private run(trigger: string, columns: string[]): Observable<Country[]> {
    this.lastQuery = this.api.buildQuery(columns);
    const call = this.record(trigger, columns);
    if (this.failing) {
      this.fail(call, 'failed', 'net::ERR_INTERNET_DISCONNECTED (simulation)', null);
      return throwError(() => new Error('API indisponible (simulation)'));
    }
    this.requestCount++;
    const startedAt = performance.now();
    return this.api.request(this.lastQuery).pipe(
      tap({
        next: response => {
          const body = response.body as CountriesResponse;
          call.status = response.status;
          call.statusText = response.statusText || 'OK';
          call.durationMs = Math.round(performance.now() - startedAt);
          call.sizeBytes = new TextEncoder().encode(JSON.stringify(body)).length;
          call.responseLines = this.responseLines(body, columns.filter(column => !this.confirmed.includes(column)));
          this.confirmed = [...columns];
          this.changed();
        },
        error: (error: HttpErrorResponse) =>
          this.fail(call, error.status > 0 ? error.status : 'failed', error.statusText || error.message, Math.round(performance.now() - startedAt)),
      }),
      map(response => this.api.toRows(response.body as CountriesResponse)),
      finalize(() => {
        if (call.status === 'pending') {
          call.status = 'canceled';
          call.statusText = 'canceled';
          this.changed();
        }
      }),
    );
  }

  private fail(call: NetworkCall, status: number | 'failed', statusText: string, durationMs: number | null): void {
    call.status = status;
    call.statusText = statusText;
    call.durationMs = durationMs;
    this.loading = false;
    this.changed();
  }

  /** Ajoute l'appel au journal en attente de r\u00e9ponse (comme \u00ab (pending) \u00bb dans le navigateur) et le s\u00e9lectionne. */
  private record(trigger: string, columns: string[]): NetworkCall {
    const added = columns.filter(column => !this.confirmed.includes(column));
    const call: NetworkCall = {
      id: ++this.callSeq,
      trigger,
      method: 'POST',
      url: COUNTRIES_ENDPOINT,
      status: 'pending',
      statusText: 'pending',
      durationMs: null,
      sizeBytes: null,
      querySegments: [
        { text: '{ countries { code name continent { name }', added: false },
        ...this.api.selections(columns).map(item => ({ text: ` ${item.selection}`, added: added.includes(item.column) })),
        { text: ' } }', added: false },
      ],
      responseLines: [],
    };
    this.calls = [...this.calls, call].slice(-MAX_CALLS);
    this.selectedId = call.id;
    return call;
  }

  /** Aperçu JSON de la réponse : les premiers pays, puis un commentaire ; les champs `added` sont signalés. */
  private responseLines(body: CountriesResponse, added: string[]): ResponseLine[] {
    const countries = body.data.countries;
    const lines = JSON.stringify({ data: { countries: countries.slice(0, RESPONSE_PREVIEW_COUNT) } }, null, 2).split('\n');
    if (countries.length > RESPONSE_PREVIEW_COUNT) {
      lines.splice(lines.length - 3, 0, `      // … ${countries.length - RESPONSE_PREVIEW_COUNT} autres pays`);
    }
    let closingIndent: string | null = null;
    return lines.map(text => {
      if (closingIndent !== null) {
        if (text.startsWith(closingIndent) && /^[\]}]/.test(text.slice(closingIndent.length))) closingIndent = null;
        return { text, added: true };
      }
      const field = /^(\s*)"([^"]+)":/.exec(text);
      if (!field || !added.includes(field[2])) return { text, added: false };
      if (/[[{]$/.test(text)) closingIndent = field[1];
      return { text, added: true };
    });
  }
}
