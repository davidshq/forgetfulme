// Supabase API mocks for vitest.setup.js refactor
// Defensive: Only allow this mock to be loaded in Vitest
if (typeof globalThis.vi !== 'undefined') {
  throw new Error('mocks/supabase-api.js should only be loaded in Vitest test environment.');
}
import { vi } from 'vitest';

const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  delete: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  range: vi.fn(() => mockSupabase),
  overlaps: vi.fn(() => mockSupabase),
  single: vi.fn(() => mockSupabase),
  upsert: vi.fn(() => mockSupabase),
  channel: vi.fn(() => mockSupabase),
  on: vi.fn(() => mockSupabase),
  subscribe: vi.fn(() => mockSupabase),
  removeChannel: vi.fn(),
};

export default mockSupabase;
