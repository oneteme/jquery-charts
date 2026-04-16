/**
 * GroupByManager
 *
 * Encapsule tout l'état et la logique liés au mode Group By :
 * - état collapsed / expanded des groupes
 * - pagination interne par groupe
 * - tri des groupes (asc / desc)
 * - scroll vers un groupe
 *
 * Le composant TableComponent l'instancie et lui passe deux callbacks :
 *   - `onNeedProjection` : demande une reprojection légère de la page courante
 *   - `onNeedRender`     : demande un rebuild complet (tri changé etc.)
 */
export class GroupByManager {
  /** Groupes actuellement ouverts (mode default-collapsed) ou fermés (mode default-expanded). */
  private readonly _collapsedGroups = new Set<string>();

  /** Page courante par clé de groupe. */
  private readonly _groupPages = new Map<string, number>();

  /** Taille de page pour la pagination interne des groupes. */
  groupPageSize = 5;

  /** Ordre de tri des groupes ('asc' | 'desc'). */
  groupSortOrder: 'asc' | 'desc' = 'asc';

  /**
   * Quand `true`, tous les groupes sont collapsés par défaut.
   * `_collapsedGroups` contient alors le seul groupe ouvert.
   */
  private _defaultGroupCollapsed = false;

  constructor(
    private readonly onNeedProjection: () => void,
    private readonly onNeedRender: () => void,
  ) {}

  // ── API publique

  /** Initialise le mode par défaut selon qu'un groupBy vient d'être activé. */
  setDefaultCollapsed(collapsed: boolean): void {
    this._defaultGroupCollapsed = collapsed;
  }

  /** Réinitialise l'état (à appeler quand le groupBy change de colonne). */
  reset(): void {
    this._collapsedGroups.clear();
    this._groupPages.clear();
  }

  isGroupCollapsed(groupKey: string): boolean {
    return this._defaultGroupCollapsed
      ? !this._collapsedGroups.has(groupKey)
      : this._collapsedGroups.has(groupKey);
  }

  toggleGroupCollapse(groupKey: string, scrollTo: (key: string) => void): void {
    if (this._collapsedGroups.has(groupKey)) {
      this._collapsedGroups.delete(groupKey);
    } else {
      this._collapsedGroups.clear();
      this._collapsedGroups.add(groupKey);
      scrollTo(groupKey);
    }
    this.onNeedProjection();
  }

  /** Retourne le groupe actuellement ouvert (seulement en mode default-collapsed avec exactement 1 ouvert). */
  getSingleOpenGroup(): string | null {
    return this._defaultGroupCollapsed && this._collapsedGroups.size === 1
      ? [...this._collapsedGroups][0]
      : null;
  }

  // ── Pagination par groupe

  getPage(groupKey: string): number {
    return this._groupPages.get(groupKey) ?? 0;
  }

  groupPageBack(groupKey: string): void {
    const current = this._groupPages.get(groupKey) ?? 0;
    if (current > 0) {
      this._groupPages.set(groupKey, current - 1);
      this.onNeedProjection();
    }
  }

  groupPageForward(groupKey: string, totalCount: number): void {
    const maxPage = Math.ceil(totalCount / this.groupPageSize) - 1;
    const current = this._groupPages.get(groupKey) ?? 0;
    if (current < maxPage) {
      this._groupPages.set(groupKey, current + 1);
      this.onNeedProjection();
    }
  }

  onGroupPageSizeChange(size: number): void {
    this.groupPageSize = size;
    this._groupPages.clear();
    this.onNeedRender();
  }

  onGroupSortToggle(dir: 'asc' | 'desc', scrollTo: (key: string) => void): void {
    if (this.groupSortOrder === dir) return;
    this.groupSortOrder = dir;
    this._groupPages.clear();
    this.onNeedRender();
    const openGroup = this.getSingleOpenGroup();
    if (openGroup) scrollTo(openGroup);
  }
}
