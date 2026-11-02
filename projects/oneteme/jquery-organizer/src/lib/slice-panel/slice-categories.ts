import { EMPTY_CATEGORY_KEY, EMPTY_CATEGORY_LABEL, SliceCategory } from './slice-panel.model';

/**
 * Catégories d'un slice déduites des lignes : valeurs distinctes triées avec leur effectif,
 * la catégorie « Vide » (null, undefined ou chaîne vide) étant placée en dernier.
 * `getValue` lit la valeur de la colonne dans une ligne.
 */
export function buildCategoriesFromRows<T>(rows: readonly T[] | null | undefined, getValue: (row: T) => unknown): SliceCategory<T>[] {
  const counts = new Map<string, number>();
  let empty = 0;
  (rows ?? []).forEach(row => {
    const value = getValue(row);
    if (value == null || value === '') {
      empty++;
    } else {
      const text = String(value);
      counts.set(text, (counts.get(text) ?? 0) + 1);
    }
  });

  const categories: SliceCategory<T>[] = [...counts.keys()].sort().map(key => ({
    key,
    label: key,
    count: counts.get(key),
    filter: (row: T) => String(getValue(row) ?? '') === key,
  }));
  if (empty > 0) {
    categories.push({
      key: EMPTY_CATEGORY_KEY,
      label: EMPTY_CATEGORY_LABEL,
      count: empty,
      filter: (row: T) => {
        const value = getValue(row);
        return value == null || value === '';
      },
    });
  }
  return categories;
}
