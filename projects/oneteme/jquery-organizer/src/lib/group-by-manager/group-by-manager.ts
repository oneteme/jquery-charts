export class GroupByManager {
  private readonly _collapsedGroups = new Set<string>();
  private readonly _groupPages = new Map<string, number>();

  groupPageSize = 5;
  groupSortOrder: 'asc' | 'desc' = 'asc';

  private _defaultGroupCollapsed = false;

  constructor(
    private readonly onNeedProjection: () => void,
    private readonly onNeedRender: () => void,
  ) {}

  setDefaultCollapsed(collapsed: boolean): void {
    this._defaultGroupCollapsed = collapsed;
  }

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

  getSingleOpenGroup(): string | null {
    return this._defaultGroupCollapsed && this._collapsedGroups.size === 1
      ? [...this._collapsedGroups][0]
      : null;
  }

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
