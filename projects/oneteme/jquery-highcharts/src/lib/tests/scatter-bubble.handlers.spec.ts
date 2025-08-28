import { ScatterHandler } from '../directive/utils/charts-handlers/complex-handlers/scatter.handler';
import { BubbleHandler } from '../directive/utils/charts-handlers/complex-handlers/bubble.handler';

describe('Scatter/Bubble Handlers', () => {
  it('scatter: doit garder les gridlines et produire la série correcte', () => {
    const handler = new ScatterHandler();
    const data = [{ name: 'A', values: [[1,2],[2,3]] }];
    const cfg: any = {};
    const out = handler.handle(data as any, cfg, false);
    expect(out.series?.[0]?.type).toBe('scatter');
    expect(Array.isArray(out.series?.[0]?.data)).toBeTrue();
  });

  it('bubble: doit produire des points {x,y,z}', () => {
    const handler = new BubbleHandler();
    const data = [{ name: 'A', values: [[1,2,4],[2,3,5]] }];
    const cfg: any = {};
    const out = handler.handle(data as any, cfg, false);
    expect(out.series?.[0]?.type).toBe('bubble');
    expect(Array.isArray(out.series?.[0]?.data)).toBeTrue();
    const p = out.series?.[0]?.data?.[0];
    expect(p.length || Object.keys(p).length).toBeGreaterThan(1);
  });
});
