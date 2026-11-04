import { publishChartGroupSync, registerChartGroupSync } from './chart-group-sync';

let groupCounter = 0;
const nextGroup = () => `test-group-${++groupCounter}`;

describe('chart group sync', () => {
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    cleanups.splice(0).forEach(cleanup => cleanup());
  });

  function subscribe(group: string | null | undefined, source: symbol, listener: (event: unknown) => void): () => void {
    const cleanup = registerChartGroupSync(group, source, listener as Parameters<typeof registerChartGroupSync>[2]);
    cleanups.push(cleanup);
    return cleanup;
  }

  const event = (group: string, source: symbol) => ({
    group,
    action: 'datazoom' as const,
    source,
    payload: { min: 1, max: 2 },
  });

  it('delivers an event to the other members of the group', () => {
    const group = nextGroup();
    const sourceA = Symbol('a');
    const sourceB = Symbol('b');
    const listenerB = jasmine.createSpy('listenerB');
    subscribe(group, sourceA, () => undefined);
    subscribe(group, sourceB, listenerB);

    publishChartGroupSync(event(group, sourceA));

    expect(listenerB).toHaveBeenCalledOnceWith(event(group, sourceA));
  });

  it('does not echo an event back to its source', () => {
    const group = nextGroup();
    const source = Symbol('source');
    const listener = jasmine.createSpy('listener');
    subscribe(group, source, listener);

    publishChartGroupSync(event(group, source));

    expect(listener).not.toHaveBeenCalled();
  });

  it('does not deliver events to another group', () => {
    const listener = jasmine.createSpy('listener');
    subscribe(nextGroup(), Symbol('other'), listener);

    publishChartGroupSync(event(nextGroup(), Symbol('source')));

    expect(listener).not.toHaveBeenCalled();
  });

  it('stops delivering once unsubscribed', () => {
    const group = nextGroup();
    const listener = jasmine.createSpy('listener');
    const unsubscribe = subscribe(group, Symbol('member'), listener);

    unsubscribe();
    publishChartGroupSync(event(group, Symbol('source')));

    expect(listener).not.toHaveBeenCalled();
  });

  it('keeps delivering to remaining members after one unsubscribes', () => {
    const group = nextGroup();
    const remaining = jasmine.createSpy('remaining');
    const unsubscribe = subscribe(group, Symbol('gone'), () => undefined);
    subscribe(group, Symbol('kept'), remaining);

    unsubscribe();
    publishChartGroupSync(event(group, Symbol('source')));

    expect(remaining).toHaveBeenCalledTimes(1);
  });

  it('returns a no-op cleanup and registers nothing for a missing group', () => {
    const listener = jasmine.createSpy('listener');
    const cleanup = registerChartGroupSync(null, Symbol('x'), listener);
    expect(() => cleanup()).not.toThrow();
    expect(() => registerChartGroupSync(undefined, Symbol('x'), listener)()).not.toThrow();
    expect(() => registerChartGroupSync('', Symbol('x'), listener)()).not.toThrow();
    publishChartGroupSync(event('', Symbol('source')));
    expect(listener).not.toHaveBeenCalled();
  });

  it('isolates a failing listener from the other members', () => {
    const group = nextGroup();
    const consoleError = spyOn(console, 'error');
    const healthy = jasmine.createSpy('healthy');
    subscribe(group, Symbol('broken'), () => {
      throw new Error('boom');
    });
    subscribe(group, Symbol('healthy'), healthy);

    publishChartGroupSync(event(group, Symbol('source')));

    expect(healthy).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalled();
  });
});
