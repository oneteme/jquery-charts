import { MatPaginatorIntl } from '@angular/material/paginator';

/** Traductions françaises du paginator Material. */
export function getFrenchPaginatorIntl(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Éléments par page :';
  intl.nextPageLabel = 'Page suivante';
  intl.previousPageLabel = 'Page précédente';
  intl.firstPageLabel = 'Première page';
  intl.lastPageLabel = 'Dernière page';
  intl.getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) return `0 sur ${length}`;
    length = Math.max(length, 0);
    const start = page * pageSize;
    const end = start < length ? Math.min(start + pageSize, length) : start + pageSize;
    return `${start + 1} – ${end} sur ${length}`;
  };
  return intl;
}

/**
 * Convertit une valeur brute en chaîne affichable.
 * - null/undefined → ''
 * - Date → format locale fr-FR
 * - Tableau → valeurs jointes par ', '
 * - Objet avec label/name → sa valeur string
 * - Autres → String(value)
 */
export function normalizeCellValue(value: any): any {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date) {
    return value.toLocaleString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeCellValue(item)).join(', ');
  }
  if (typeof value === 'object') {
    if ('label' in value && value.label !== undefined) {
      return String(value.label);
    }
    if ('name' in value && value.name !== undefined) {
      return String(value.name);
    }
    return JSON.stringify(value);
  }
  return value;
}

/**
 * Transforme une clé camelCase/snake_case en libellé lisible.
 * Ex: 'createdAt' → 'Created at', 'my_field' → 'My field'
 */
export function humanizeKey(key: string): string {
  return key
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll(/[_-]+/g, ' ')
    .replace(/^./, (value) => value.toUpperCase());
}
