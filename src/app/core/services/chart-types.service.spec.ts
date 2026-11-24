import { ChartTypesService } from './chart-types.service';

describe('ChartTypesService', () => {
  it('émet null par défaut puis le type sélectionné', () => {
    const service = new ChartTypesService();
    const emitted: (string | null)[] = [];
    const subscription = service.getSelectedType().subscribe(type => emitted.push(type));

    service.setSelectedType('Pie Chart');
    subscription.unsubscribe();

    expect(emitted).toEqual([null, 'Pie Chart']);
  });

  it('revient à null après une réinitialisation', () => {
    const service = new ChartTypesService();
    const emitted: (string | null)[] = [];
    const subscription = service.getSelectedType().subscribe(type => emitted.push(type));

    service.setSelectedType('Bar Chart');
    service.resetSelectedType();
    subscription.unsubscribe();

    expect(emitted).toEqual([null, 'Bar Chart', null]);
  });
});
