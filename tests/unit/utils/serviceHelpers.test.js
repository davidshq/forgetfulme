/**
 * @fileoverview Unit tests for service helper mixins
 */

import { describe, it, expect, vi } from 'vitest';
import { withInitialization, withErrorHandling } from '../../../src/utils/serviceHelpers.js';

describe('utils/serviceHelpers', () => {
  it('withInitialization.ensureInitialized should call initialize when needed', async () => {
    class Base { async initialize() { this.supabaseClient = { ok: true }; return true; } }
    const Mixed = withInitialization(Base);
    const inst = new Mixed();
    await inst.ensureInitialized();
    expect(inst.supabaseClient).toBeTruthy();
  });

  it('withInitialization.ensureConfigured should indicate failure without throwing when requested', async () => {
    class Base { isConfigured() { return false; } async initialize() { return false; } }
    const Mixed = withInitialization(Base);
    const inst = new Mixed();
    const ok = await inst.ensureConfigured(false);
    expect(ok).toBe(false);
  });

  it('withErrorHandling.handleAndThrow should rethrow processed error message', () => {
    class Base { constructor() { this.errorService = { handle: vi.fn(() => ({ message: 'processed' })) }; } }
    const Mixed = withErrorHandling(Base);
    const inst = new Mixed();
    expect(() => inst.handleAndThrow(new Error('x'), 'Ctx')).toThrowError('processed');
  });

  it('withErrorHandling.handleAndReturnNull should swallow and return null', () => {
    const handle = vi.fn();
    class Base { constructor() { this.errorService = { handle }; } }
    const Mixed = withErrorHandling(Base);
    const inst = new Mixed();
    const r = inst.handleAndReturnNull(new Error('x'), 'Ctx');
    expect(r).toBeNull();
    expect(handle).toHaveBeenCalled();
  });

  it('withErrorHandling.withErrorHandling should return fallback on error and result on success', async () => {
    const handle = vi.fn();
    class Base { constructor() { this.errorService = { handle }; } }
    const Mixed = withErrorHandling(Base);
    const inst = new Mixed();

    const ok = await inst.withErrorHandling(async () => 42, 'Ctx', null);
    expect(ok).toBe(42);

    const fb = await inst.withErrorHandling(async () => { throw new Error('boom'); }, 'Ctx', 'fb');
    expect(fb).toBe('fb');
    expect(handle).toHaveBeenCalled();
  });
});


