import { configureSimpleGraphOptions } from '../directive/utils/chart-options';

// On teste que les hooks load/animations sont bien en place, sans exécuter Highcharts

describe('Funnel/Pyramid animations', () => {
  it('configureSimpleGraphOptions: ajoute les events load pour funnel/pyramid', () => {
    const base: any = { chart: {}, plotOptions: {} };

    configureSimpleGraphOptions(base, 'funnel', false);
    expect(typeof base.chart.events.load).toBe('function');
    expect(base.plotOptions?.funnel?.reversed).toBeFalse();

    const base2: any = { chart: {}, plotOptions: {} };
    configureSimpleGraphOptions(base2, 'pyramid', false);
    expect(typeof base2.chart.events.load).toBe('function');
    expect(base2.plotOptions?.funnel?.reversed).toBeTrue();
  });
});
