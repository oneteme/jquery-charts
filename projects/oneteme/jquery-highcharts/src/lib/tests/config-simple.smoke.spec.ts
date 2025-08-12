import { ConfigurationManager } from '../directive/utils/config-manager';
import { configureSimpleGraphOptions } from '../directive/utils/chart-options';

describe('Config simple smoke', () => {
  it('configureSimpleGraphOptions ne jette pas pour tous les types simples', () => {
    const types: any[] = ['pie','donut','funnel','pyramid','polar','radar','radarArea','radialBar'];
    for (const t of types) {
      const options: any = { chart: {}, plotOptions: {} };
      expect(() => configureSimpleGraphOptions(options, t, false)).not.toThrow();
    }
  });

  it('ConfigurationManager.applyUserConfigWithTransformation ne jette pas avec user options vides', () => {
    const base: any = { chart: {}, plotOptions: {} };
    const user: any = { options: {} };
    const out = ConfigurationManager.applyUserConfigWithTransformation(base, user, 'pie' as any, false);
    expect(out).toBeTruthy();
  });
});
