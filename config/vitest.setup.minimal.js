/**
 * @fileoverview Minimal Vitest setup for ForgetfulMe Extension
 * @module vitest-setup-minimal
 * @description Simplified test setup that only mocks essential external dependencies
 *
 * @author ForgetfulMe Team
 * @version 2.0.0 - Improved testing strategy
 * @since 2024-01-01
 */

import { vi } from 'vitest';

// ==================================================
// MINIMAL EXTERNAL DEPENDENCY MOCKING
// ==================================================

/**
 * Mock Chrome Extension APIs (external dependency)
 * Only mock what tests actually need, not every possible API
 */
const createMinimalChromeMock = () => ({
  storage: {
    sync: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(),
      remove: vi.fn().mockResolvedValue(),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  runtime: {
    sendMessage: vi.fn().mockResolvedValue({}),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue({}),
  },
  notifications: {
    create: vi.fn(),
  },
});

/**
 * Mock console methods to reduce test noise
 * Keep it simple - just prevent output, don't overcomplicate
 */
const createMinimalConsoleMock = () => ({
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  log: vi.fn(),
  debug: vi.fn(),
});

// ==================================================
// GLOBAL SETUP
// ==================================================

// Set up global Chrome API mock
global.chrome = createMinimalChromeMock();

// Set up global console mock
global.console = createMinimalConsoleMock();

// Mock Supabase client (external dependency)
global.supabase = {
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  })),
};

// ==================================================
// TEST UTILITIES
// ==================================================

/**
 * Reset all mocks between tests
 * Simple and focused - only reset what we've mocked
 */
export const resetAllMocks = () => {
  vi.clearAllMocks();

  // Reset Chrome storage to empty state
  global.chrome.storage.sync.get.mockResolvedValue({});
  global.chrome.storage.sync.set.mockResolvedValue();
};

/**
 * Create test data factory
 * Simple helper for creating test data without over-engineering
 */
export const createTestData = {
  bookmark: (overrides = {}) => ({
    id: 'test-bookmark-id',
    url: 'https://example.com',
    title: 'Test Bookmark',
    read_status: 'read',
    tags: [],
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  user: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    ...overrides,
  }),

  config: (overrides = {}) => ({
    url: 'https://test.supabase.co',
    anonKey: 'test-anon-key',
    ...overrides,
  }),
};

// ==================================================
// PRINCIPLES FOR MINIMAL MOCKING
// ==================================================

/*
✅ DO:
- Mock external APIs (Chrome, Supabase)
- Mock only what tests actually use
- Keep mocks simple and focused
- Reset mocks between tests
- Test real behavior and interactions

❌ DON'T:
- Mock internal utilities and components
- Create complex mock implementations
- Mock everything "just in case"
- Create giant mock class hierarchies
- Test implementation details

BEFORE (1,378 lines): Complex GlobalChromeStorageManager, extensive mocking
AFTER (100 lines): Simple, focused mocks of external dependencies only

The reduction from 1,378 lines to ~100 lines shows the power of 
focusing on behavior rather than over-mocking everything.
*/
