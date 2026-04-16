import { DataProvider } from '@oneteme/jquery-core';
import { Observable } from 'rxjs';

/** Une catégorie cliquable dans un slice (ex: "En cours", "Terminé"). */
export interface SliceCategory<T = any> {
  key: string;
  label: string;
  /**
   * Prédicat de filtrage en mémoire — **optionnel**.
   *
   * - **Tableau** : requis. Le slice-panel applique ce prédicat sur les lignes locales.
   * - **Graphique** : omis. Le parent écoute `(activeKeysChange)` pour déclencher
   *   une nouvelle requête API avec les clés sélectionnées.
   *
   * Si `filter` est absent, la sélection n'a aucun effet sur les données locales ;
   * c'est au composant parent de réagir via `(activeKeysChange)`.
   */
  filter?: (row: T) => boolean;
}

/**
 * Groupe de filtres affiché dans le panneau latéral.
 *
 * **Mode colonne** (`columnKey`) : le slice lit automatiquement les valeurs distinctes
 * de la colonne désignée pour générer les catégories. `bucket` permet de regrouper
 * des valeurs continues (ex: plages de durée). `hidden` le masque par défaut et
 * laisse la table le rendre disponible dans le menu "Ajouter un filtre".
 *
 * **Mode manuel** (`categories`) : les catégories sont définies explicitement avec
 * leur propre fonction `filter`. `columnKey` peut coexister pour le lien avec la
 * colonne (icône, label), mais `categories` prend le dessus sur le bucketing auto.
 */
export interface SliceConfig<T = any> {
  title?: string;
  /** Icône Material affichée dans le titre du slice (ex: 'schedule', 'dns'). */
  icon?: string;
  /** Autorise la sélection simultanée de plusieurs catégories. Par défaut : `false`. */
  multiSelect?: boolean;
  /**
   * Clé de la colonne associée à ce slice.
   * En **mode colonne**, les valeurs distinctes de cette colonne génèrent les catégories.
   * En **mode manuel**, sert uniquement à lier visuellement le slice à la colonne.
   */
  columnKey?: string;
  /** Masqué par défaut ; disponible via le menu "Ajouter un filtre". Par défaut : `false`. */
  hidden?: boolean;
  /**
   * Transforme chaque valeur de ligne en label de tranche avant regroupement.
   * Utilisé en **mode colonne** pour des valeurs continues (ex: durées, montants).
   * Ignoré si `categories` est défini.
   */
  bucket?: (row: T) => string;
  /** Catégories explicites (**mode manuel**). Si absent, générées auto depuis `columnKey`. */
  categories?: SliceCategory<T>[];
}

/**
 * Description minimale d'une colonne nécessaire au panneau de slices.
 * Utilisé indépendamment de la table : pas de propriétés de rendu (tri, suppression, groupement...).
 * `TableColumnProvider` (librairie table) est un superset structurel compatible.
 */
export interface SliceColumnDef<T = any> {
  key: string;
  header?: string;
  icon?: string;
  value?: DataProvider<any>;
  /** Chargement différé : la présence de cet objet active le mode lazy. */
  lazy?: {
    /** Fonction appelée pour charger les valeurs de la colonne. Retourne un tableau dans le même ordre que les lignes. */
    fetchFn: () => Observable<any[]>;
  };
}

