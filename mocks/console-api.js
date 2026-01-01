// Console API mocks for vitest.setup.js refactor
// Defensive: Only allow this mock to be loaded in Vitest
if (typeof globalThis.vi !== 'undefined') {
  throw new Error(
    'mocks/console-api.js should only be loaded in Vitest test environment.'
  );
}
import { vi } from 'vitest';

const mockConsole = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  log: vi.fn(),
  debug: vi.fn(),
};

export default mockConsole;
