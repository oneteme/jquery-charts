import { applyAxisOffsets } from './axis-utils';

function appliquer(yAxis: any, series: any[] = [{ data: [10] }]): any {
  const options: any = { yAxis, series };
  applyAxisOffsets(options);
  return options.yAxis;
}

describe('applyAxisOffsets', () => {
  describe('garde-fous', () => {
    it('ne modifie pas les options sans yAxis', () => {
      const options: any = { series: [{ data: [10] }] };
      applyAxisOffsets(options);
      expect(options).toEqual({ series: [{ data: [10] }] });
    });

    it('ne modifie pas les options sans series', () => {
      const options: any = { yAxis: { maxOffset: 5 } };
      applyAxisOffsets(options);
      expect(options.yAxis.max).toBeUndefined();
    });

    it('ne modifie pas un axe dont le max est déjà défini', () => {
      const axe = appliquer({ max: 50, maxOffset: 5 });
      expect(axe).toEqual({ max: 50, maxOffset: 5 });
    });

    it('ne calcule rien sans données', () => {
      const axe = appliquer({ maxOffset: 5 }, []);
      expect(axe.max).toBeUndefined();
      expect(axe.endOnTick).toBeUndefined();
    });

    it('ignore les séries sans données', () => {
      expect(appliquer({ maxOffset: 0 }, [{}]).max).toBeUndefined();
    });

    it('ignore les points non numériques', () => {
      expect(appliquer({ maxOffset: 0 }, [{ data: ['a', null, [0, 'x']] }]).max).toBeUndefined();
    });
  });

  describe('seuil petit max', () => {
    it('active un seuil par défaut lorsque maxRounding vaut au moins 50', () => {
      const axe = appliquer({ maxRounding: 50 });
      expect(axe.smallMaxThreshold).toBe(100);
      expect(axe.smallMaxTickCount).toBe(4);
      expect(axe.smallMaxMinTickInterval).toBe(1);
    });

    it('n\'active pas de seuil par défaut lorsque maxRounding est inférieur à 50', () => {
      const axe = appliquer({ maxRounding: 10 });
      expect(axe.smallMaxThreshold).toBeUndefined();
      expect(axe.smallMaxTickCount).toBeUndefined();
      expect(axe.max).toBeUndefined();
    });

    it('conserve un smallMaxThreshold fourni par l\'utilisateur', () => {
      expect(appliquer({ smallMaxThreshold: 20, maxRounding: 50 }).smallMaxThreshold).toBe(20);
    });

    it('calcule le max avec les graduations du petit max par défaut', () => {
      const axe = appliquer({ maxRounding: 50 });
      expect(axe.max).toBe(12);
      expect(axe.tickAmount).toBe(4);
      expect(axe.tickInterval).toBe(4);
      expect(axe.endOnTick).toBeTrue();
    });

    it('applique le format entier par défaut des libellés', () => {
      expect(appliquer({ maxRounding: 50 }).labels.format).toBe('{value:.0f}');
    });

    it('conserve un format de libellés existant', () => {
      expect(appliquer({ maxRounding: 50, labels: { format: '{value} €' } }).labels.format).toBe('{value} €');
    });

    it('utilise smallMaxTickCount pour le nombre de graduations', () => {
      const axe = appliquer({ smallMaxThreshold: 20, smallMaxTickCount: 3 });
      expect(axe.max).toBe(15);
      expect(axe.tickAmount).toBe(3);
      expect(axe.tickInterval).toBe(5);
    });

    it('utilise tickAmount à défaut de smallMaxTickCount', () => {
      const axe = appliquer({ smallMaxThreshold: 20, tickAmount: 3 });
      expect(axe.max).toBe(15);
      expect(axe.tickAmount).toBe(3);
    });

    it('respecte smallMaxMinTickInterval', () => {
      const axe = appliquer(
        { smallMaxThreshold: 100, smallMaxTickCount: 4, smallMaxMinTickInterval: 5 },
        [{ data: [7] }],
      );
      expect(axe.max).toBe(15);
      expect(axe.tickInterval).toBe(5);
      expect(axe.minTickInterval).toBe(5);
    });

    it('n\'applique pas le petit max au-delà du seuil', () => {
      expect(appliquer({ smallMaxThreshold: 20, maxRounding: 50 }, [{ data: [30] }]).max).toBeUndefined();
    });

    it('n\'applique pas le petit max par défaut au-delà de 100', () => {
      expect(appliquer({ maxRounding: 50 }, [{ data: [150] }]).max).toBeUndefined();
    });

    it('ignore le petit max lorsque la valeur maximale est nulle', () => {
      expect(appliquer({ maxRounding: 50 }, [{ data: [0] }]).max).toBeUndefined();
    });
  });

  describe('décalage du maximum', () => {
    it('limite le décalage à 1 % de la valeur maximale', () => {
      const axe = appliquer({ maxOffset: 5 }, [{ data: [10, 20] }]);
      expect(axe.max).toBeCloseTo(20.2, 5);
      expect(axe.endOnTick).toBeFalse();
    });

    it('conserve le maximum des données avec un décalage nul', () => {
      const axe = appliquer({ maxOffset: 0 }, [{ data: [20] }]);
      expect(axe.max).toBe(20);
      expect(axe.endOnTick).toBeFalse();
    });

    it('applique le décalage lorsque la valeur maximale est nulle', () => {
      expect(appliquer({ maxOffset: 5 }, [{ data: [0] }]).max).toBe(5);
    });

    it('considère un décalage non numérique comme nul', () => {
      expect(appliquer({ maxOffset: '5' }, [{ data: [20] }]).max).toBe(20);
    });

    it('arrondit le maximum au multiple de maxRounding', () => {
      expect(appliquer({ maxOffset: 5, maxRounding: 10 }, [{ data: [23] }]).max).toBe(24);
    });

    it('arrondit au pas le plus fin lorsque maxRounding est seul', () => {
      expect(appliquer({ maxOffset: 0, maxRounding: 10 }, [{ data: [23] }]).max).toBe(23);
    });

    it('cale les graduations sur tickAmount', () => {
      const axe = appliquer({ maxOffset: 0, maxRounding: 10, tickAmount: 5 }, [{ data: [23] }]);
      expect(axe.max).toBe(24);
      expect(axe.tickInterval).toBe(6);
    });

    it('utilise tickInterval comme pas d\'arrondi à défaut de maxRounding', () => {
      expect(appliquer({ maxOffset: 0, tickInterval: 10 }, [{ data: [23] }]).max).toBe(23);
    });
  });

  describe('lecture des données', () => {
    it('ignore les séries masquées', () => {
      const axe = appliquer({ maxOffset: 0 }, [{ visible: false, data: [100] }, { data: [20] }]);
      expect(axe.max).toBe(20);
    });

    it('lit les valeurs nombre, tuple et objet y', () => {
      expect(appliquer({ maxOffset: 0 }, [{ data: [[0, 15], { y: 7 }, 2] }]).max).toBe(15);
    });

    it('lit la valeur high des points de type range', () => {
      expect(appliquer({ maxOffset: 0 }, [{ data: [{ low: 1, high: 40 }] }]).max).toBe(40);
    });

    it('associe chaque série à l\'axe désigné par yAxis', () => {
      const axes = appliquer(
        [{ maxOffset: 0 }, { maxOffset: 0 }],
        [{ data: [10] }, { yAxis: 1, data: [40] }],
      );
      expect(axes[0].max).toBe(10);
      expect(axes[1].max).toBe(40);
    });
  });
});
