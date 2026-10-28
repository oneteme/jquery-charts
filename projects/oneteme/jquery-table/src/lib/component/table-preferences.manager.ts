import { SavedTableConfig } from '../jquery-table.model';

const STORAGE_PREFIX = 'jqt_prefs_';

/**
 * Gère la persistance de la configuration d'un tableau dans le localStorage.
 * Identifie chaque tableau par un `tableId` unique fourni par l'utilisateur.
 */
export class TablePreferencesManager {
  readonly key: string;

  constructor(tableId: string) {
    this.key = STORAGE_PREFIX + tableId;
  }

  /** Retourne la configuration sauvegardée, ou `null` si absente / corrompue. */
  load(): SavedTableConfig | null {
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? (JSON.parse(raw) as SavedTableConfig) : null;
    } catch {
      return null;
    }
  }

  /** Persiste la configuration dans le localStorage. */
  save(config: SavedTableConfig): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(config));
    } catch {
      // localStorage peut être indisponible (mode privé strict, quota dépassé…)
    }
  }

  /** Supprime la configuration sauvegardée. */
  clear(): void {
    try {
      localStorage.removeItem(this.key);
    } catch {
      // stockage indisponible : rien à effacer
    }
  }

  /** Indique si une configuration est actuellement sauvegardée. */
  hasSaved(): boolean {
    try {
      return localStorage.getItem(this.key) !== null;
    } catch {
      return false;
    }
  }
}
