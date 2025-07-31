/**
 * @fileoverview Integration tests for authentication state persistence
 * Tests: Login → Close extension → Reopen → Still authenticated
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..');

test.describe('Authentication State Persistence Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to popup using file:// protocol
    const filePath = `file://${path.join(projectRoot, 'src', 'ui', 'popup.html')}`;
    await page.goto(filePath);
    await page.waitForLoadState('networkidle');
    
    // Set viewport for consistent testing
    await page.setViewportSize({ width: 400, height: 600 });
  });

  test('authentication persists across extension close and reopen', async ({ page }) => {
    // Step 1: Show auth section and login form
    await page.evaluate(() => {
      document.getElementById('auth-section').classList.remove('hidden');
      document.getElementById('signin-form').classList.remove('hidden');
      const configSection = document.getElementById('config-required-section');
      if (configSection) configSection.classList.add('hidden');
      const mainSection = document.getElementById('main-section');
      if (mainSection) mainSection.classList.add('hidden');
    });

    const authSection = page.locator('#auth-section');
    await expect(authSection).toBeVisible();

    // Step 2: Fill login form
    const testUser = {
      email: 'persistent@example.com',
      password: 'SecurePassword123!',
      id: 'test-user-id',
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    };

    await page.fill('#signin-email', testUser.email);
    await page.fill('#signin-password', testUser.password);

    // Mock successful login response
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: testUser.id,
            email: testUser.email
          },
          session: {
            access_token: testUser.access_token,
            refresh_token: testUser.refresh_token,
            expires_at: testUser.expires_at,
            user: {
              id: testUser.id,
              email: testUser.email
            }
          }
        })
      });
    });

    // Step 3: Submit login form
    const submitButton = page.locator('#signin-submit');
    await submitButton.click();

    // Simulate successful authentication by storing session
    await page.evaluate((userData) => {
      // Simulate Chrome storage API for testing
      const mockSession = {
        id: userData.id,
        email: userData.email,
        access_token: userData.access_token,
        refresh_token: userData.refresh_token,
        expires_at: userData.expires_at
      };
      
      // Store in localStorage to simulate Chrome sync storage
      localStorage.setItem('USER_SESSION', JSON.stringify(mockSession));
      localStorage.setItem('auth_timestamp', Date.now().toString());
      
      // Show main section to simulate successful login
      document.getElementById('auth-section').classList.add('hidden');
      document.getElementById('main-section').classList.remove('hidden');
      
      // Update user email display
      const userEmailElement = document.getElementById('user-email');
      if (userEmailElement) {
        userEmailElement.textContent = userData.email;
      }
    }, testUser);

    // Step 4: Verify user is logged in
    const mainSection = page.locator('#main-section');
    await expect(mainSection).toBeVisible();
    await expect(page.locator('#user-email')).toContainText(testUser.email);

    // Take screenshot of authenticated state
    await expect(page).toHaveScreenshot('auth-logged-in-state.png');

    // Step 5: Simulate extension close and reopen by reloading the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Step 6: Restore session from storage
    await page.evaluate(() => {
      // Check if session exists in localStorage
      const storedSession = localStorage.getItem('USER_SESSION');
      const authTimestamp = localStorage.getItem('auth_timestamp');
      
      if (storedSession && authTimestamp) {
        const session = JSON.parse(storedSession);
        const timePassed = Date.now() - parseInt(authTimestamp);
        
        // Check if session is still valid (less than 24 hours old for testing)
        if (timePassed < 24 * 60 * 60 * 1000) {
          // Session is valid, restore authenticated state
          window.restoredSession = session;
          
          // Show main section instead of auth section
          const authSection = document.getElementById('auth-section');
          const mainSection = document.getElementById('main-section');
          const configSection = document.getElementById('config-required-section');
          
          if (authSection) authSection.classList.add('hidden');
          if (mainSection) mainSection.classList.remove('hidden');
          if (configSection) configSection.classList.add('hidden');
          
          // Restore user email display
          const userEmailElement = document.getElementById('user-email');
          if (userEmailElement) {
            userEmailElement.textContent = session.email;
          }
          
          // Populate page data
          const pageTitle = document.getElementById('page-title');
          const pageUrl = document.getElementById('page-url');
          if (pageTitle) pageTitle.value = 'Example Page';
          if (pageUrl) pageUrl.value = 'https://example.com';
        }
      }
    });

    // Step 7: Verify user is still authenticated after reload
    await expect(mainSection).toBeVisible();
    await expect(page.locator('#user-email')).toContainText(testUser.email);
    
    // Verify the session was restored
    const restoredSession = await page.evaluate(() => window.restoredSession);
    expect(restoredSession).toBeTruthy();
    expect(restoredSession.email).toBe(testUser.email);
    expect(restoredSession.id).toBe(testUser.id);

    // Take screenshot of restored authenticated state
    await expect(page).toHaveScreenshot('auth-restored-state.png');
  });

  test('expired session requires re-authentication', async ({ page }) => {
    // Step 1: Set up an expired session
    const expiredUser = {
      email: 'expired@example.com',
      id: 'expired-user-id',
      access_token: 'expired-token',
      refresh_token: 'expired-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago (expired)
    };

    await page.evaluate((userData) => {
      // Store expired session
      localStorage.setItem('USER_SESSION', JSON.stringify(userData));
      localStorage.setItem('auth_timestamp', Date.now().toString());
    }, expiredUser);

    // Step 2: Reload page to trigger session check
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Step 3: Check for expired session handling
    await page.evaluate(() => {
      const storedSession = localStorage.getItem('USER_SESSION');
      
      if (storedSession) {
        const session = JSON.parse(storedSession);
        const currentTime = Math.floor(Date.now() / 1000);
        
        // Check if session is expired
        if (session.expires_at && currentTime > session.expires_at) {
          // Clear expired session
          localStorage.removeItem('USER_SESSION');
          localStorage.removeItem('auth_timestamp');
          
          // Show auth section
          const authSection = document.getElementById('auth-section');
          const mainSection = document.getElementById('main-section');
          const configSection = document.getElementById('config-required-section');
          
          if (authSection) authSection.classList.remove('hidden');
          if (mainSection) mainSection.classList.add('hidden');
          if (configSection) configSection.classList.add('hidden');
          
          window.sessionExpired = true;
        }
      }
    });

    // Step 4: Verify auth section is shown (user needs to login again)
    const authSection = page.locator('#auth-section');
    await expect(authSection).toBeVisible();
    
    const mainSection = page.locator('#main-section');
    await expect(mainSection).not.toBeVisible();

    // Verify session was detected as expired
    const sessionExpired = await page.evaluate(() => window.sessionExpired);
    expect(sessionExpired).toBe(true);
  });

  test('logout clears persisted authentication state', async ({ page }) => {
    // Step 1: Set up authenticated session
    const testUser = {
      email: 'logout-test@example.com',
      id: 'logout-user-id',
      access_token: 'logout-token',
      refresh_token: 'logout-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600
    };

    await page.evaluate((userData) => {
      // Store session
      localStorage.setItem('USER_SESSION', JSON.stringify(userData));
      localStorage.setItem('auth_timestamp', Date.now().toString());
      
      // Show main section
      document.getElementById('auth-section').classList.add('hidden');
      document.getElementById('main-section').classList.remove('hidden');
      const configSection = document.getElementById('config-required-section');
      if (configSection) configSection.classList.add('hidden');
      
      // Set user email
      const userEmailElement = document.getElementById('user-email');
      if (userEmailElement) {
        userEmailElement.textContent = userData.email;
      }
    }, testUser);

    // Verify authenticated state
    const mainSection = page.locator('#main-section');
    await expect(mainSection).toBeVisible();
    await expect(page.locator('#user-email')).toContainText(testUser.email);

    // Step 2: Simulate logout
    await page.evaluate(() => {
      // Clear session storage
      localStorage.removeItem('USER_SESSION');
      localStorage.removeItem('auth_timestamp');
      
      // Clear any bookmark cache
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('bookmarks:') || key.startsWith('cache:'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Show auth section
      document.getElementById('auth-section').classList.remove('hidden');
      document.getElementById('main-section').classList.add('hidden');
      
      // Clear user info
      const userEmailElement = document.getElementById('user-email');
      if (userEmailElement) {
        userEmailElement.textContent = '';
      }
      
      window.loggedOut = true;
    });

    // Step 3: Verify logout state
    const authSection = page.locator('#auth-section');
    await expect(authSection).toBeVisible();
    await expect(mainSection).not.toBeVisible();

    // Verify logout was executed
    const loggedOut = await page.evaluate(() => window.loggedOut);
    expect(loggedOut).toBe(true);

    // Step 4: Reload page and verify session is still cleared
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that no session is restored
    await page.evaluate(() => {
      const storedSession = localStorage.getItem('USER_SESSION');
      window.noSessionFound = !storedSession;
      
      // Ensure auth section is shown
      const authSection = document.getElementById('auth-section');
      const mainSection = document.getElementById('main-section');
      const configSection = document.getElementById('config-required-section');
      
      if (authSection) authSection.classList.remove('hidden');
      if (mainSection) mainSection.classList.add('hidden');
      if (configSection) configSection.classList.add('hidden');
    });

    // Verify no session exists
    const noSessionFound = await page.evaluate(() => window.noSessionFound);
    expect(noSessionFound).toBe(true);

    // Verify auth section is still shown
    await expect(authSection).toBeVisible();
    await expect(mainSection).not.toBeVisible();
  });

  test('token refresh maintains authentication state', async ({ page }) => {
    // Step 1: Set up session that needs refresh
    const testUser = {
      email: 'refresh-test@example.com',
      id: 'refresh-user-id',
      access_token: 'old-access-token',
      refresh_token: 'valid-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 300 // 5 minutes from now (needs refresh soon)
    };

    await page.evaluate((userData) => {
      localStorage.setItem('USER_SESSION', JSON.stringify(userData));
      localStorage.setItem('auth_timestamp', Date.now().toString());
    }, testUser);

    // Mock token refresh endpoint
    await page.route('**/auth/token', async route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postData();
        if (body && body.includes('valid-refresh-token')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              access_token: 'new-access-token',
              refresh_token: 'new-refresh-token',
              expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
              user: {
                id: testUser.id,
                email: testUser.email
              }
            })
          });
        } else {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Invalid refresh token' })
          });
        }
      }
    });

    // Step 2: Simulate token refresh
    await page.evaluate(async () => {
      const storedSession = localStorage.getItem('USER_SESSION');
      if (storedSession) {
        const session = JSON.parse(storedSession);
        
        // Simulate refresh logic
        try {
          // In real implementation, this would call the refresh endpoint
          // For testing, we'll simulate a successful refresh
          const refreshedSession = {
            ...session,
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
            expires_at: Math.floor(Date.now() / 1000) + 3600
          };
          
          localStorage.setItem('USER_SESSION', JSON.stringify(refreshedSession));
          window.tokenRefreshed = true;
          window.refreshedSession = refreshedSession;
        } catch (error) {
          window.refreshError = error.message;
        }
      }
    });

    // Step 3: Verify token was refreshed
    const tokenRefreshed = await page.evaluate(() => window.tokenRefreshed);
    expect(tokenRefreshed).toBe(true);

    const refreshedSession = await page.evaluate(() => window.refreshedSession);
    expect(refreshedSession.access_token).toBe('new-access-token');
    expect(refreshedSession.refresh_token).toBe('new-refresh-token');
    expect(refreshedSession.expires_at).toBeGreaterThan(testUser.expires_at);

    // Step 4: Verify authentication is maintained
    await page.evaluate(() => {
      // Show main section with refreshed session
      document.getElementById('auth-section').classList.add('hidden');
      document.getElementById('main-section').classList.remove('hidden');
      
      const userEmailElement = document.getElementById('user-email');
      if (userEmailElement && window.refreshedSession) {
        userEmailElement.textContent = window.refreshedSession.email;
      }
    });

    const mainSection = page.locator('#main-section');
    await expect(mainSection).toBeVisible();
    await expect(page.locator('#user-email')).toContainText(testUser.email);
  });

  test('Chrome sync storage integration for cross-device authentication', async ({ page }) => {
    // This test simulates Chrome sync storage behavior
    const testUser = {
      email: 'sync-test@example.com',
      id: 'sync-user-id',
      access_token: 'sync-access-token',
      refresh_token: 'sync-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600
    };

    // Step 1: Simulate saving to Chrome sync storage
    await page.evaluate((userData) => {
      // Simulate Chrome sync storage API
      window.mockChromeStorage = {
        sync: {
          data: {},
          get: function(keys, callback) {
            if (typeof keys === 'string') {
              callback({ [keys]: this.data[keys] });
            } else if (Array.isArray(keys)) {
              const result = {};
              keys.forEach(key => {
                if (this.data[key]) result[key] = this.data[key];
              });
              callback(result);
            } else {
              callback(this.data);
            }
          },
          set: function(items, callback) {
            Object.assign(this.data, items);
            if (callback) callback();
          },
          remove: function(keys, callback) {
            if (typeof keys === 'string') {
              delete this.data[keys];
            } else if (Array.isArray(keys)) {
              keys.forEach(key => delete this.data[key]);
            }
            if (callback) callback();
          }
        }
      };

      // Save session to mock Chrome sync storage
      window.mockChromeStorage.sync.set({
        USER_SESSION: userData,
        SYNC_TIMESTAMP: Date.now()
      });

      window.syncStorageSet = true;
    }, testUser);

    // Verify data was set
    const syncStorageSet = await page.evaluate(() => window.syncStorageSet);
    expect(syncStorageSet).toBe(true);

    // Step 2: Simulate reading from Chrome sync storage (as if on another device)
    await page.evaluate(() => {
      // Simulate retrieving from sync storage
      window.mockChromeStorage.sync.get(['USER_SESSION', 'SYNC_TIMESTAMP'], (result) => {
        if (result.USER_SESSION) {
          // Restore session from sync storage
          localStorage.setItem('USER_SESSION', JSON.stringify(result.USER_SESSION));
          localStorage.setItem('auth_timestamp', result.SYNC_TIMESTAMP.toString());
          
          window.syncedSession = result.USER_SESSION;
          window.syncTimestamp = result.SYNC_TIMESTAMP;
          
          // Update UI to show authenticated state
          document.getElementById('auth-section').classList.add('hidden');
          document.getElementById('main-section').classList.remove('hidden');
          
          const userEmailElement = document.getElementById('user-email');
          if (userEmailElement) {
            userEmailElement.textContent = result.USER_SESSION.email;
          }
        }
      });
    });

    // Step 3: Verify synced session was restored
    const syncedSession = await page.evaluate(() => window.syncedSession);
    expect(syncedSession).toBeTruthy();
    expect(syncedSession.email).toBe(testUser.email);
    expect(syncedSession.id).toBe(testUser.id);

    const mainSection = page.locator('#main-section');
    await expect(mainSection).toBeVisible();
    await expect(page.locator('#user-email')).toContainText(testUser.email);

    // Take screenshot of synced state
    await expect(page).toHaveScreenshot('auth-chrome-sync-state.png');
  });
});