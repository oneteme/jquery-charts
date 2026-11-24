import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FullscreenManager } from '@oneteme/jquery-core';
import { CoreApiComponent } from './core-api.component';

describe('CoreApiComponent', () => {
  let component: CoreApiComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CoreApiComponent], providers: [provideRouter([])] });
    component = TestBed.createComponent(CoreApiComponent).componentInstance;
  });

  describe('snapshots', () => {
    it('crée un snapshot avec le libellé courant et affiche sa version de schéma', () => {
      component.createSnapshot();

      expect(component.snapshots.length).toBe(1);
      expect(component.snapshots[0].label).toBe('Démonstration Core');
      expect(component.snapshotFeedback).toContain('Snapshot valide : Démonstration Core');
    });

    it('utilise le libellé par défaut quand le libellé saisi est vide', () => {
      component.snapshotLabel = '   ';

      expect(component.snapshotDraft.label).toBe('Démonstration Core');
    });

    it('renomme le dernier snapshot avec le libellé saisi', () => {
      component.createSnapshot();
      component.snapshotLabel = 'Nouveau nom';

      component.renameLatestSnapshot();

      expect(component.snapshots[0].label).toBe('Nouveau nom');
      expect(component.snapshotFeedback).toBe('Snapshot renommé : Nouveau nom');
    });

    it('signale l’absence de snapshot au renommage sans en créer', () => {
      component.renameLatestSnapshot();

      expect(component.snapshots).toEqual([]);
      expect(component.snapshotFeedback).toBe('Aucun snapshot à renommer');
    });

    it('supprime le dernier snapshot et confirme son libellé', () => {
      component.createSnapshot();

      component.removeLatestSnapshot();

      expect(component.snapshots).toEqual([]);
      expect(component.snapshotFeedback).toBe('Snapshot supprimé : Démonstration Core');
    });

    it('signale l’absence de snapshot à la suppression', () => {
      component.removeLatestSnapshot();

      expect(component.snapshotFeedback).toBe('Aucun snapshot à supprimer');
    });

    it('vide le stockage et conserve le feedback de confirmation', () => {
      component.createSnapshot();

      component.clearSnapshots();

      expect(component.snapshots).toEqual([]);
      expect(component.snapshotFeedback).toBe('Stockage vidé');
    });
  });

  describe('organizer', () => {
    it('ajoute un champ optionnel puis le retire au second basculement', () => {
      expect(component.isOrganizerFieldSelected('Marge')).toBeFalse();

      component.toggleOrganizerField('Marge');
      expect(component.isOrganizerFieldSelected('Marge')).toBeTrue();

      component.toggleOrganizerField('Marge');
      expect(component.isOrganizerFieldSelected('Marge')).toBeFalse();
    });

    it('conserve l’ordre de définition des champs sélectionnés', () => {
      component.toggleOrganizerField('Ventes');
      component.toggleOrganizerField('Marge');

      expect(component.organizerState.selectedFieldIds).toEqual(['Prévision', 'Marge']);
    });
  });

  describe('synchronisation de groupe', () => {
    it('reçoit l’événement publié et limite l’historique à trois entrées', () => {
      component.publishSync('tooltip');

      expect(component.syncEvents.length).toBe(1);
      expect(component.syncEvents[0].action).toBe('tooltip');
      expect(component.syncEvents[0].payload).toEqual(jasmine.objectContaining({ xValue: 'Mar' }));

      component.publishSync('datazoom');
      component.publishSync('tooltip');
      component.publishSync('datazoom');

      expect(component.syncEvents.length).toBe(3);
      expect(component.syncEvents[0].action).toBe('datazoom');
    });

    it('ne reçoit plus les événements après destruction du composant', () => {
      component.ngOnDestroy();

      component.publishSync('tooltip');

      expect(component.syncEvents).toEqual([]);
    });
  });

  describe('unités et échelles', () => {
    it('choisit l’échelle adaptée à la magnitude de chaque valeur', () => {
      expect(component.unitExamples.map(example => example.unit)).toEqual(['unités', 'k', 'M']);
    });

    it('signale une unité non enregistrée au lieu de convertir silencieusement', () => {
      expect(component.unitError).toContain('mile');
    });
  });

  describe('intervalles', () => {
    it('borne le nombre de classes entre 2 et 8', () => {
      component.intervalType = 'quantile';

      component.intervalCount = 100;
      expect(component.activeIntervalStrategy).toEqual({ type: 'quantile', count: 8 });

      component.intervalCount = 1;
      expect(component.activeIntervalStrategy).toEqual({ type: 'quantile', count: 2 });
    });

    it('fournit les seuils sigma pour la stratégie moyenne-écart-type', () => {
      component.intervalType = 'mean-stddev';

      expect(component.activeIntervalStrategy).toEqual({ type: 'mean-stddev', sigmas: [-2, -1, 0, 1, 2] });
    });

    it('calcule les bornes min et max du jeu de données', () => {
      expect(component.intervalStats).toEqual(jasmine.objectContaining({ min: 4, max: 61 }));
    });
  });

  describe('précision', () => {
    it('retombe sur 2 décimales quand la précision saisie est invalide', () => {
      component.precision = Number.NaN;
      expect(component.validPrecision).toBe(2);

      component.precision = 42;
      expect(component.validPrecision).toBe(2);

      component.precision = 3;
      expect(component.validPrecision).toBe(3);
    });
  });

  describe('formatage et erreurs', () => {
    it('affiche un JSON indenté pour une valeur sérialisable', () => {
      const formatted = component.formatJson({ a: 1, b: [2] });

      expect(formatted).toContain('\n  "a": 1');
      expect(JSON.parse(formatted)).toEqual({ a: 1, b: [2] });
    });

    it('remplace une valeur circulaire par un message explicite', () => {
      const circular: Record<string, unknown> = {};
      circular['self'] = circular;

      expect(component.formatJson(circular)).toBe('<valeur non sérialisable>');
    });

    it('retourne le message d’une erreur levée et un objet sérialisé pour une valeur non Error', () => {
      expect(component.captureError(() => { throw new Error('boom'); })).toBe('boom');
      expect(component.captureError(() => { throw { code: 42 }; })).toBe('{"code":42}');
    });

    it('indique l’absence d’erreur quand l’opération réussit', () => {
      expect(component.captureError(() => 'ok')).toBe('Aucune erreur');
    });
  });

  describe('actions', () => {
    it('copie le code de la démo puis réinitialise l’indicateur après 1,5 s', fakeAsync(() => {
      spyOn(navigator.clipboard, 'writeText').and.resolveTo();
      const demo = component.demos[0];

      component.copyCode(demo);
      tick();

      expect(navigator.clipboard.writeText).toHaveBeenCalledOnceWith(demo.code);
      expect(demo.copied).toBeTrue();

      tick(1500);
      expect(demo.copied).toBeFalse();
    }));

    it('signale l’indisponibilité du plein écran sans tenter de l’activer', async () => {
      spyOn(FullscreenManager, 'isSupported').and.returnValue(false);
      spyOn(FullscreenManager, 'toggle');

      await component.toggleFullscreen(document.createElement('div'));

      expect(FullscreenManager.toggle).not.toHaveBeenCalled();
      expect(component.fullscreenStatus).toBe('Fullscreen API indisponible dans ce navigateur ou ce contexte.');
    });
  });
});
