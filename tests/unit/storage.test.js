import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as storage from '../../src/utils/storage.js';

describe('storage utils', () => {
  beforeEach(() => {
    const store = {};
    global.chrome = {
      storage: {
        local: {
          get: vi.fn((keys, cb) => {
            if (Array.isArray(keys)) {
              const out = {};
              for (const k of keys) out[k] = store[k];
              cb(out);
            } else if (typeof keys === 'string') {
              cb({ [keys]: store[keys] });
            } else {
              cb({});
            }
          }),
          set: vi.fn((items, cb) => {
            Object.assign(store, items);
            cb && cb();
          }),
          remove: vi.fn((keys, cb) => {
            (Array.isArray(keys) ? keys : [keys]).forEach(k => delete store[k]);
            cb && cb();
          })
        }
      }
    };
  });

  it('set/get/remove roundtrip', async () => {
    await storage.set({ A: 1, B: 2 });
    expect(await storage.get(['A', 'B'])).toEqual({ A: 1, B: 2 });
    await storage.remove('A');
    expect(await storage.get(['A', 'B'])).toEqual({ A: undefined, B: 2 });
  });
});

