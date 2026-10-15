import { GroupByManager } from './group-by-manager';

function setup() {
  const onNeedProjection = jasmine.createSpy('onNeedProjection');
  const onNeedRender = jasmine.createSpy('onNeedRender');
  const scrollTo = jasmine.createSpy('scrollTo');
  const manager = new GroupByManager(onNeedProjection, onNeedRender);
  return { manager, onNeedProjection, onNeedRender, scrollTo };
}

describe('GroupByManager', () => {

  describe('repli des groupes', () => {
    it('sans défaut replié, aucun groupe n\'est replié', () => {
      const { manager } = setup();
      expect(manager.isGroupCollapsed('A')).toBeFalse();
    });

    it('avec groupes repliés par défaut, tous le sont tant qu\'aucun n\'est ouvert', () => {
      const { manager } = setup();
      manager.setDefaultCollapsed(true);
      expect(manager.isGroupCollapsed('A')).toBeTrue();
      expect(manager.isGroupCollapsed('B')).toBeTrue();
      expect(manager.getSingleOpenGroup()).toBeNull();
    });

    it('ouvre un seul groupe à la fois (accordéon), défile vers lui et demande la projection', () => {
      const { manager, onNeedProjection, scrollTo } = setup();
      manager.setDefaultCollapsed(true);

      manager.toggleGroupCollapse('A', scrollTo);
      expect(manager.isGroupCollapsed('A')).toBeFalse();
      expect(manager.isGroupCollapsed('B')).toBeTrue();
      expect(manager.getSingleOpenGroup()).toBe('A');
      expect(scrollTo).toHaveBeenCalledOnceWith('A');
      expect(onNeedProjection).toHaveBeenCalledTimes(1);

      manager.toggleGroupCollapse('B', scrollTo);
      expect(manager.isGroupCollapsed('A')).toBeTrue();
      expect(manager.isGroupCollapsed('B')).toBeFalse();
      expect(manager.getSingleOpenGroup()).toBe('B');
    });

    it('referme le groupe ouvert sans défilement', () => {
      const { manager, scrollTo } = setup();
      manager.setDefaultCollapsed(true);
      manager.toggleGroupCollapse('A', scrollTo);
      scrollTo.calls.reset();

      manager.toggleGroupCollapse('A', scrollTo);
      expect(manager.isGroupCollapsed('A')).toBeTrue();
      expect(manager.getSingleOpenGroup()).toBeNull();
      expect(scrollTo).not.toHaveBeenCalled();
    });

    it('reset remet tous les groupes à l\'état par défaut et efface les pages', () => {
      const { manager, scrollTo } = setup();
      manager.setDefaultCollapsed(true);
      manager.toggleGroupCollapse('A', scrollTo);
      manager.groupPageForward('A', 100);

      manager.reset();
      expect(manager.isGroupCollapsed('A')).toBeTrue();
      expect(manager.getPage('A')).toBe(0);
    });
  });

  describe('pagination par groupe', () => {
    it('avance et recule dans les bornes, par groupe', () => {
      const { manager, onNeedProjection } = setup();
      manager.groupPageSize = 5;

      manager.groupPageBack('A');
      expect(manager.getPage('A')).toBe(0);
      expect(onNeedProjection).not.toHaveBeenCalled();

      manager.groupPageForward('A', 12); // 3 pages : 0, 1, 2
      manager.groupPageForward('A', 12);
      manager.groupPageForward('A', 12);
      expect(manager.getPage('A')).toBe(2);
      expect(manager.getPage('B')).toBe(0);
      expect(onNeedProjection).toHaveBeenCalledTimes(2);

      manager.groupPageBack('A');
      expect(manager.getPage('A')).toBe(1);
    });

    it('ne dépasse pas la dernière page, y compris pour un effectif multiple de la taille de page', () => {
      const { manager } = setup();
      manager.groupPageSize = 5;
      manager.groupPageForward('A', 10);
      manager.groupPageForward('A', 10);
      expect(manager.getPage('A')).toBe(1);
    });

    it('un groupe vide ou unique reste à la page 0', () => {
      const { manager } = setup();
      manager.groupPageForward('A', 0);
      manager.groupPageForward('B', 3);
      expect(manager.getPage('A')).toBe(0);
      expect(manager.getPage('B')).toBe(0);
    });

    it('ne change pas de page quand la taille de page vaut 0 (tout afficher)', () => {
      const { manager } = setup();
      manager.groupPageSize = 0;
      manager.groupPageForward('A', 50);
      expect(manager.getPage('A')).toBe(0);
    });

    it('changer la taille de page efface les pages et demande un rendu', () => {
      const { manager, onNeedRender } = setup();
      manager.groupPageForward('A', 50);

      manager.onGroupPageSizeChange(10);
      expect(manager.groupPageSize).toBe(10);
      expect(manager.getPage('A')).toBe(0);
      expect(onNeedRender).toHaveBeenCalledTimes(1);
    });
  });

  describe('tri des groupes', () => {
    it('ignore le tri demandé dans le même sens', () => {
      const { manager, onNeedRender, scrollTo } = setup();
      manager.onGroupSortToggle('asc', scrollTo);
      expect(onNeedRender).not.toHaveBeenCalled();
    });

    it('change le sens, efface les pages et demande un rendu', () => {
      const { manager, onNeedRender, scrollTo } = setup();
      manager.groupPageForward('A', 50);

      manager.onGroupSortToggle('desc', scrollTo);
      expect(manager.groupSortOrder).toBe('desc');
      expect(manager.getPage('A')).toBe(0);
      expect(onNeedRender).toHaveBeenCalledTimes(1);
      expect(scrollTo).not.toHaveBeenCalled();
    });

    it('défile vers l\'unique groupe ouvert après un changement de sens', () => {
      const { manager, scrollTo } = setup();
      manager.setDefaultCollapsed(true);
      manager.toggleGroupCollapse('B', () => undefined);

      manager.onGroupSortToggle('desc', scrollTo);
      expect(scrollTo).toHaveBeenCalledOnceWith('B');
    });
  });
});
