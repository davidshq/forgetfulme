/**
 * @fileoverview Unit tests for ServiceContainer
 */

import { describe, it, expect } from 'vitest';
import { ServiceContainer } from '../../../src/utils/ServiceContainer.js';

describe('utils/ServiceContainer', () => {
  it('should register and retrieve singleton services', () => {
    const c = new ServiceContainer();
    class A {}
    c.register('a', () => new A());
    const a1 = c.get('a');
    const a2 = c.get('a');
    expect(a1).toBeInstanceOf(A);
    expect(a1).toBe(a2);
  });

  it('should support non-singleton factories', () => {
    const c = new ServiceContainer();
    class A {}
    c.register('a', () => new A(), false);
    const a1 = c.get('a');
    const a2 = c.get('a');
    expect(a1).toBeInstanceOf(A);
    expect(a2).toBeInstanceOf(A);
    expect(a1).not.toBe(a2);
  });

  it('should register instance directly', () => {
    const c = new ServiceContainer();
    const obj = { x: 1 };
    c.registerInstance('x', obj);
    expect(c.get('x')).toBe(obj);
  });

  it('should report has() correctly and throw for unknown services', () => {
    const c = new ServiceContainer();
    expect(c.has('missing')).toBe(false);
    expect(() => c.get('missing')).toThrowError("Service 'missing' not registered");
  });
});


