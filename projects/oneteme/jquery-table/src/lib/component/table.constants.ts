/**
 * Constantes sentinel utilisées pour les identifiants de colonnes et les valeurs
 * projetées dans le datasource interne de la table.
 *
 * Centraliser ici évite les typos silencieuses et facilite les tests unitaires.
 */

/** Identifiant de la colonne virtuelle rendue sur toute la largeur pour les en-têtes de groupe. */
export const GROUP_ROW_COLUMN = '__group_row';

/** Marqueur posé sur les objets de ligne pour signaler une ligne d'en-tête de groupe. */
export const GROUP_HEADER_MARKER = '__groupHeader';

/** Clé du groupe spéciale « chargement lazy en cours ». */
export const GROUP_KEY_LAZY_LOADING = '__lazy_loading__';

/** Clé du groupe spéciale « trop de groupes ». */
export const GROUP_KEY_TOO_MANY = '__too_many_groups__';

/** Propriété injectée dans chaque ligne projetée : référence vers la ligne brute d'origine. */
export const ROW_RAW_KEY = '__raw';

/** Propriété injectée dans chaque ligne projetée : index global de la ligne dans le jeu de données filtré. */
export const ROW_INDEX_KEY = '__index';

/** Propriété injectée dans chaque ligne projetée : clé du groupe auquel appartient la ligne d'en-tête. */
export const ROW_GROUP_KEY = '__groupKey';

/** Propriété injectée dans chaque ligne projetée : nombre de lignes dans le groupe. */
export const ROW_GROUP_COUNT = '__groupCount';

/** Propriété injectée dans chaque ligne projetée : page courante du groupe. */
export const ROW_GROUP_PAGE = '__groupPage';

/** Propriété injectée dans chaque ligne projetée : nombre de pages du groupe. */
export const ROW_GROUP_PAGE_COUNT = '__groupPageCount';

/** Valeur sentinelle posée dans une cellule lazy en cours de chargement. */
export const LAZY_LOADING_VALUE = '__lazy_loading__';

/** Valeur sentinelle posée dans une cellule lazy en erreur. */
export const LAZY_ERROR_VALUE = '__lazy_error__';
