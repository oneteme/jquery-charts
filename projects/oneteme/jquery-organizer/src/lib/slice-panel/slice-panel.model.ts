import { DataProvider } from '@oneteme/jquery-core';
import type { OrganizerIconFontSet } from '../models/organizer-config.interface';

export const EMPTY_CATEGORY_KEY = '__empty__';
export const EMPTY_CATEGORY_LABEL = 'Vide';

export interface SliceCategory<T = any> {
  key: string;
  label: string;
  filter?: (row: T) => boolean;
  /** Effectif précalculé (rempli par le panneau pour les catégories dérivées d'une colonne). */
  count?: number;
}

export interface SliceConfig<T = any> {
  title?: string;
  icon?: string;
  iconFontSet?: OrganizerIconFontSet;
  multiSelect?: boolean;
  columnKey?: string;
  hidden?: boolean;
  bucket?: (row: T) => string;
  categories?: SliceCategory<T>[];
  /** Libellé affiché pour une valeur brute. La clé de catégorie (utilisée pour filtrer) reste la valeur brute. */
  formatLabel?: (raw: string) => string;
  /** Ordre d'affichage des valeurs brutes ; par défaut, ordre alphabétique des clés. */
  compareKeys?: (a: string, b: string) => number;
}

export interface SliceColumnDef<T = any> {
  key: string;
  header?: string;
  icon?: string;
  iconFontSet?: OrganizerIconFontSet;
  value?: DataProvider<any>;
  /** Colonne absente de la requête de base : ses valeurs sont dans les lignes une fois chargée (`lazyStatus`). */
  lazy?: true;
}
