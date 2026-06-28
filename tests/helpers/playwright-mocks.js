/**
 * @fileoverview Shared Chrome API mocks for Playwright E2E tests
 * @module playwright-mocks
 */

import { DEFAULT_STATUS_TYPES } from '../../utils/constants.js';

const TEST_SUPABASE_URL = 'https://test-project.supabase.co';
const TEST_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-anon-key-for-e2e';

/** @type {Object} In-memory storage backing the Chrome storage mock */
export const mockStorageState = {
  supabaseConfig: null,
  customStatusTypes: [...DEFAULT_STATUS_TYPES],
  auth_session: null,
};

/**
 * Reset mock storage to an unconfigured, unauthenticated state.
 */
export function resetMockStorage() {
  mockStorageState.supabaseConfig = null;
  mockStorageState.customStatusTypes = [...DEFAULT_STATUS_TYPES];
  mockStorageState.auth_session = null;
}

/**
 * Apply a named storage preset for E2E scenarios.
 * @param {'unconfigured'|'configured'|'authenticated'} preset
 */
export function applyStoragePreset(preset) {
  resetMockStorage();

  if (preset === 'configured' || preset === 'authenticated') {
    mockStorageState.supabaseConfig = {
      url: TEST_SUPABASE_URL,
      anonKey: TEST_ANON_KEY,
    };
  }

  if (preset === 'authenticated') {
    mockStorageState.auth_session = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
    };
  }
}

/**
 * Build the init script injected before each extension page load.
 * @param {'unconfigured'|'configured'|'authenticated'} [preset='unconfigured']
 * @returns {string}
 */
export function buildChromeMockInitScript(preset = 'unconfigured') {
  const storageSnapshot = {
    unconfigured: {
      supabaseConfig: null,
      customStatusTypes: [...DEFAULT_STATUS_TYPES],
      auth_session: null,
    },
    configured: {
      supabaseConfig: {
        url: TEST_SUPABASE_URL,
        anonKey: TEST_ANON_KEY,
      },
      customStatusTypes: [...DEFAULT_STATUS_TYPES],
      auth_session: null,
    },
    authenticated: {
      supabaseConfig: {
        url: TEST_SUPABASE_URL,
        anonKey: TEST_ANON_KEY,
      },
      customStatusTypes: [...DEFAULT_STATUS_TYPES],
      auth_session: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
      },
    },
  };

  const initialStorage =
    storageSnapshot[preset] ?? storageSnapshot.unconfigured;

  return `
    (function () {
      const storageData = ${JSON.stringify(initialStorage)};

      if (typeof chrome === 'undefined') {
        window.chrome = {};
      }

      const makeStorageArea = () => ({
        get: (keys) =>
          new Promise((resolve) => {
            if (keys == null) {
              resolve({ ...storageData });
              return;
            }

            const keyList = Array.isArray(keys) ? keys : [keys];
            const result = {};
            keyList.forEach((key) => {
              if (Object.prototype.hasOwnProperty.call(storageData, key)) {
                result[key] = storageData[key];
              }
            });
            resolve(result);
          }),
        set: (data) =>
          new Promise((resolve) => {
            Object.assign(storageData, data);
            resolve();
          }),
        remove: (keys) =>
          new Promise((resolve) => {
            const keyList = Array.isArray(keys) ? keys : [keys];
            keyList.forEach((key) => {
              delete storageData[key];
            });
            resolve();
          }),
        clear: () =>
          new Promise((resolve) => {
            Object.keys(storageData).forEach((key) => {
              delete storageData[key];
            });
            resolve();
          }),
      });

      chrome.storage = {
        sync: makeStorageArea(),
        local: makeStorageArea(),
        session: makeStorageArea(),
        onChanged: {
          addListener: () => {},
          removeListener: () => {},
        },
      };

      if (!chrome.runtime) {
        chrome.runtime = {};
      }

      chrome.runtime.onMessage = chrome.runtime.onMessage || {
        addListener: () => {},
        removeListener: () => {},
      };
      chrome.runtime.sendMessage = (message, callback) => {
        if (callback) {
          callback({ success: true });
        }
        return Promise.resolve({ success: true });
      };
      chrome.runtime.openOptionsPage = () => {
        window.optionsPageOpened = true;
      };
      chrome.runtime.getURL = (path) =>
        'chrome-extension://test-extension-id/' + path;

      const defaultTab = {
        url: 'https://example.com/article-a',
        title: 'Example Article A',
      };

      chrome.tabs = chrome.tabs || {};
      chrome.tabs.query = (_queryInfo, callback) => {
        const tabs = [defaultTab];
        if (callback) {
          callback(tabs);
        }
        return Promise.resolve(tabs);
      };
      chrome.tabs.create =
        chrome.tabs.create ||
        ((_createInfo, callback) => {
          const tab = { id: 1 };
          if (callback) {
            callback(tab);
          }
          return Promise.resolve(tab);
        });

      // Headless Playwright reports navigator.onLine=false; fetch still works via route mocks
      try {
        Object.defineProperty(navigator, 'onLine', {
          get: () => true,
          configurable: true,
        });
      } catch (_error) {
        // Ignore if navigator cannot be patched
      }

      const sessionPayload = storageData.auth_session;
      if (sessionPayload?.access_token) {
        const supabaseSession = {
          access_token: sessionPayload.access_token,
          refresh_token: sessionPayload.refresh_token,
          expires_at: sessionPayload.expires_at,
          expires_in: 3600,
          token_type: 'bearer',
          user: sessionPayload.user,
        };
        try {
          localStorage.setItem(
            'sb-test-project-auth-token',
            JSON.stringify(supabaseSession),
          );
        } catch (_error) {
          // Ignore localStorage errors in restricted contexts
        }
      }
    })();
  `;
}

/** Sample bookmarks returned by mocked Supabase REST routes. */
export const MOCK_BOOKMARKS = [
  {
    id: 'bookmark-1',
    url: 'https://example.com/article-a',
    title: 'Example Article A',
    description: '',
    read_status: 'read',
    tags: ['research', 'tutorial'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'test-user-id',
  },
  {
    id: 'bookmark-2',
    url: 'https://example.com/article-b',
    title: 'Example Article B',
    description: '',
    read_status: 'good-reference',
    tags: ['important'],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    user_id: 'test-user-id',
  },
];

/**
 * Parse a PostgREST filter value such as `eq.read`.
 * @param {string|null} value
 * @returns {string|null}
 */
function parseEqFilter(value) {
  if (!value || !value.startsWith('eq.')) {
    return null;
  }

  return decodeURIComponent(value.slice(3));
}

/**
 * Filter mock bookmarks using Supabase REST query parameters.
 * @param {URL} requestUrl
 * @returns {typeof MOCK_BOOKMARKS}
 */
function filterMockBookmarks(requestUrl) {
  let results = [...MOCK_BOOKMARKS];
  const statusValue = parseEqFilter(requestUrl.searchParams.get('read_status'));
  const urlValue = parseEqFilter(requestUrl.searchParams.get('url'));
  const searchFilter = requestUrl.searchParams.get('or');

  if (statusValue) {
    results = results.filter(bookmark => bookmark.read_status === statusValue);
  }

  if (urlValue) {
    results = results.filter(bookmark => bookmark.url === urlValue);
  }

  if (searchFilter) {
    const match = searchFilter.match(/\.ilike\.%([^,%]+)%/i);
    const term = match?.[1]?.toLowerCase() ?? '';
    results = results.filter(
      bookmark =>
        bookmark.title.toLowerCase().includes(term) ||
        bookmark.description.toLowerCase().includes(term) ||
        bookmark.tags.some(tag => tag.toLowerCase().includes(term)),
    );
  }

  return results;
}

/**
 * Mock Supabase REST/auth HTTP responses for authenticated E2E flows.
 * @param {import('@playwright/test').Page} page
 */
export async function mockSupabaseRoutes(page) {
  await page.route('**/*', async route => {
    const url = route.request().url();
    const method = route.request().method();

    if (!url.includes('supabase.co')) {
      await route.continue();
      return;
    }

    if (url.includes('/auth/v1/')) {
      const sessionBody = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: { id: 'test-user-id', email: 'test@example.com' },
      };

      if (url.includes('/auth/v1/user')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(sessionBody.user),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(sessionBody),
      });
      return;
    }

    if (url.includes('/rest/v1/bookmarks')) {
      const requestUrl = new URL(url);
      const results = filterMockBookmarks(requestUrl);
      const wantsSingle =
        requestUrl.searchParams.has('url') &&
        !requestUrl.searchParams.has('order');

      if (method === 'GET') {
        if (wantsSingle) {
          if (results.length === 0) {
            await route.fulfill({
              status: 406,
              contentType: 'application/json',
              body: JSON.stringify({
                code: 'PGRST116',
                message:
                  'JSON object requested, multiple (or no) rows returned',
              }),
            });
            return;
          }

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(results[0]),
            headers: { 'content-range': '0-0/1' },
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(results),
          headers: {
            'content-range': `0-${Math.max(results.length - 1, 0)}/${results.length}`,
          },
        });
        return;
      }

      if (method === 'POST') {
        const body = route.request().postDataJSON?.() ?? {};
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'bookmark-new',
            ...body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: 'test-user-id',
          }),
        });
        return;
      }

      if (method === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...MOCK_BOOKMARKS[0],
            read_status: 'revisit-later',
            tags: ['research', 'important'],
          }),
        });
        return;
      }

      if (method === 'DELETE') {
        await route.fulfill({ status: 204, body: '' });
        return;
      }
    }

    if (url.includes('/rest/v1/user_profiles')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ preferences: {} }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
      headers: { 'content-range': '0-0/0' },
    });
  });
}

export { TEST_ANON_KEY, TEST_SUPABASE_URL };
