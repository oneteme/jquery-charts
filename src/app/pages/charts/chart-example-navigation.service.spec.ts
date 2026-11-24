import { ChartExampleNavigationService } from './chart-example-navigation.service';

describe('ChartExampleNavigationService', () => {
  it('ne réémet pas un exemple déjà courant', () => {
    const service = new ChartExampleNavigationService();
    const onExample = jasmine.createSpy('onExample');
    const subscription = service.currentExample$.subscribe(onExample);

    service.setCurrentExample('bar');
    service.setCurrentExample('bar');
    service.setCurrentExample('pie');
    subscription.unsubscribe();

    expect(onExample.calls.allArgs()).toEqual([[null], ['bar'], ['pie']]);
  });

  it('ne réinitialise que si un exemple est sélectionné', () => {
    const service = new ChartExampleNavigationService();
    const onExample = jasmine.createSpy('onExample');
    const subscription = service.currentExample$.subscribe(onExample);

    service.reset();
    service.setCurrentExample('line');
    service.reset();
    service.reset();
    subscription.unsubscribe();

    expect(onExample.calls.allArgs()).toEqual([[null], ['line'], [null]]);
  });
});
