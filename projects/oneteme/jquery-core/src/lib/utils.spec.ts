import { cloneSerializable, containsFunction, isObject, mergeDeep } from './utils';

describe('utils', () => {
  describe('isObject', () => {
    it('accepts plain objects only', () => {
      expect(isObject({})).toBeTrue();
      expect(isObject({ a: 1 })).toBeTrue();
    });

    it('rejects arrays, primitives and null', () => {
      expect(isObject([])).toBeFalse();
      expect(isObject('text')).toBeFalsy();
      expect(isObject(42)).toBeFalsy();
      expect(isObject(null)).toBeFalsy();
      expect(isObject(undefined)).toBeFalsy();
    });
  });

  describe('mergeDeep', () => {
    it('merges nested objects recursively', () => {
      const target = { a: { x: 1 }, keep: true };
      const result = mergeDeep(target, { a: { y: 2 }, b: 3 });
      expect(result).toEqual({ a: { x: 1, y: 2 }, keep: true, b: 3 });
    });

    it('returns the target object itself', () => {
      const target = {};
      expect(mergeDeep(target, { a: 1 })).toBe(target);
    });

    it('overrides primitive values with source values', () => {
      expect(mergeDeep({ a: 1, b: 'x' }, { a: 2 })).toEqual({ a: 2, b: 'x' });
    });

    it('applies several sources in order', () => {
      expect(mergeDeep({}, { a: 1 }, { a: 2, b: 3 })).toEqual({ a: 2, b: 3 });
    });

    it('does not mutate the source objects', () => {
      const source = { nested: { value: 1 } };
      const target: Record<string, unknown> = {};
      mergeDeep(target, source);
      (target['nested'] as Record<string, unknown>)['value'] = 99;
      expect(source.nested.value).toBe(1);
    });

    it('replaces arrays instead of merging them', () => {
      expect(mergeDeep({ list: [1, 2] }, { list: [3] })).toEqual({ list: [3] });
    });

    it('returns the target unchanged when no source is given', () => {
      expect(mergeDeep({ a: 1 })).toEqual({ a: 1 });
    });
  });

  describe('cloneSerializable', () => {
    it('returns a deep copy without functions', () => {
      const source = { name: 'x', nested: { value: 1 }, formatter: () => 'ignored' };
      const copy = cloneSerializable(source) as Record<string, unknown>;
      expect(copy).toEqual({ name: 'x', nested: { value: 1 } });
      expect(copy).not.toBe(source);
      expect((copy['nested'] as object)).not.toBe(source.nested);
    });
  });

  describe('containsFunction', () => {
    it('detects a function at the root or nested in objects and arrays', () => {
      expect(containsFunction(() => 1)).toBeTrue();
      expect(containsFunction({ a: { b: [1, () => 2] } })).toBeTrue();
    });

    it('returns false for serializable values', () => {
      expect(containsFunction({ a: [1, 'two', { three: null }] })).toBeFalse();
      expect(containsFunction(null)).toBeFalse();
      expect(containsFunction('text')).toBeFalse();
    });

    it('terminates on cyclic structures', () => {
      const cyclic: Record<string, unknown> = { name: 'loop' };
      cyclic['self'] = cyclic;
      expect(containsFunction(cyclic)).toBeFalse();
      cyclic['callback'] = () => 1;
      expect(containsFunction(cyclic)).toBeTrue();
    });
  });
});
