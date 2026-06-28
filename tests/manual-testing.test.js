/**
 * @fileoverview Playwright E2E tests mapped to docs/MANUAL_TESTING.md
 * @description Automates UI flows from the manual testing guide using mocked
 * Chrome storage and Supabase HTTP responses.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { test, expect, EXTENSION_PATH } from './helpers/fixtures.js';
import ExtensionHelper from './helpers/extension-helper.js';
import {
  mockSupabaseRoutes,
  TEST_ANON_KEY,
  TEST_SUPABASE_URL,
} from './helpers/playwright-mocks.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

test.describe('Manual Testing Guide — Part 1: Install', () => {
  test('1.1 build artifacts exist', () => {
    expect(fs.existsSync(path.join(repoRoot, 'dist/background.js'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, 'supabase-js.min.js'))).toBe(true);
  });

  test('1.3 keyboard shortcut declared in manifest', () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'manifest.json'), 'utf8'),
    );
    expect(manifest.commands['mark-as-read'].suggested_key.default).toBe(
      'Ctrl+Shift+R',
    );
    expect(manifest.commands['mark-as-read'].suggested_key.mac).toBe(
      'Command+Shift+R',
    );
  });

  test.skip('1.2 load unpacked in Chrome — manual only', () => {});
});

test.describe('Manual Testing Guide — Part 2: First Run', () => {
  let extensionHelper;

  test.beforeEach(async ({ page, context }) => {
    extensionHelper = new ExtensionHelper(page, context, EXTENSION_PATH);
    await extensionHelper.mockChromeAPI('unconfigured');
    await extensionHelper.openPopup();
    await extensionHelper.waitForExtensionReady();
  });

  test('2.1 popup shows setup screen', async () => {
    expect(await extensionHelper.isElementVisible('.setup-container')).toBe(
      true,
    );
    const welcomeText = await extensionHelper.getElementText(
      '.ui-container-header h2',
    );
    expect(welcomeText).toContain('Welcome to ForgetfulMe');
    expect(await extensionHelper.isElementVisible('.setup-section')).toBe(true);
    expect(
      await extensionHelper.isElementVisible(
        'button:has-text("Open Settings")',
      ),
    ).toBe(true);
  });

  test('2.2 open settings from popup', async ({ page }) => {
    await page.evaluate(() => {
      window.optionsPageOpened = false;
    });
    await page.locator('button').filter({ hasText: 'Open Settings' }).click();
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => window.optionsPageOpened)).toBe(true);
  });

  test('2.3 options shows configuration form when not configured', async () => {
    await extensionHelper.mockChromeAPI('unconfigured');
    await extensionHelper.openOptions();
    await extensionHelper.waitForExtensionReady();
    expect(await extensionHelper.isElementVisible('.config-container')).toBe(
      true,
    );
    expect(await extensionHelper.isElementVisible('#supabaseUrl')).toBe(true);
    expect(await extensionHelper.isElementVisible('#supabaseAnonKey')).toBe(
      true,
    );
  });
});

test.describe('Manual Testing Guide — Part 3: Supabase Configuration', () => {
  let extensionHelper;

  test.beforeEach(async ({ page, context }) => {
    extensionHelper = new ExtensionHelper(page, context, EXTENSION_PATH);
    await extensionHelper.mockChromeAPI('unconfigured');
    await extensionHelper.openOptions();
    await extensionHelper.waitForExtensionReady();
  });

  test('3.1 save valid credentials shows feedback', async ({ page }) => {
    await mockSupabaseRoutes(page);
    await extensionHelper.fillField('#supabaseUrl', TEST_SUPABASE_URL);
    await extensionHelper.fillField('#supabaseAnonKey', TEST_ANON_KEY);
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('.ui-message')).toBeVisible({ timeout: 10_000 });
  });

  test('3.2 validation — empty fields', async ({ page }) => {
    await extensionHelper.disableNativeValidation('#configForm');
    await page.locator('#supabaseUrl').fill('');
    await page.locator('#supabaseAnonKey').fill('');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('.ui-message-error')).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.locator('.ui-message-error')).toContainText(
      'Please fill in all fields',
    );
  });

  test('3.3 validation — invalid credentials show error', async ({ page }) => {
    await page.route('**/*', async route => {
      const url = route.request().url();
      if (url.includes('supabase.co')) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Invalid API key' }),
        });
        return;
      }
      await route.continue();
    });

    await extensionHelper.fillField(
      '#supabaseUrl',
      'https://invalid.supabase.co',
    );
    await extensionHelper.fillField('#supabaseAnonKey', TEST_ANON_KEY);
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('.ui-message')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Manual Testing Guide — Part 4: Authentication', () => {
  let extensionHelper;

  test.beforeEach(async ({ page, context }) => {
    extensionHelper = new ExtensionHelper(page, context, EXTENSION_PATH);
    await mockSupabaseRoutes(page);
    await extensionHelper.mockChromeAPI('configured');
    await extensionHelper.openPopup();
    await extensionHelper.waitForExtensionReady();
  });

  test('4.1 sign-up form toggle from login', async ({ page }) => {
    expect(await extensionHelper.isElementVisible('#loginEmail')).toBe(true);
    await page.locator('#showSignup').click();
    expect(await extensionHelper.isElementVisible('#signupEmail')).toBe(true);
    expect(await extensionHelper.isElementVisible('#confirmPassword')).toBe(
      true,
    );
  });

  test('4.2 sign-up validation — empty fields', async ({ page }) => {
    await page.locator('#showSignup').click();
    await extensionHelper.disableNativeValidation('#signupForm');
    await page.locator('#signupForm button[type="submit"]').click();
    await expect(page.locator('#authMessage .ui-message-error')).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.locator('#authMessage .ui-message-error')).toContainText(
      'Please fill in all fields',
    );
  });

  test('4.3 sign-up validation — password mismatch', async ({ page }) => {
    await page.locator('#showSignup').click();
    await extensionHelper.disableNativeValidation('#signupForm');
    await page.locator('#signupEmail').fill('test@example.com');
    await page.locator('#signupPassword').fill('password123');
    await page.locator('#confirmPassword').fill('different123');
    await page.locator('#signupForm button[type="submit"]').click();
    await expect(page.locator('#authMessage .ui-message-error')).toContainText(
      'Passwords do not match',
    );
  });

  test('4.4 sign-up validation — short password', async ({ page }) => {
    await page.locator('#showSignup').click();
    await extensionHelper.disableNativeValidation('#signupForm');
    await page.locator('#signupEmail').fill('test@example.com');
    await page.locator('#signupPassword').fill('12345');
    await page.locator('#confirmPassword').fill('12345');
    await page.locator('#signupForm button[type="submit"]').click();
    await expect(page.locator('#authMessage .ui-message-error')).toContainText(
      'Password must be at least 6 characters',
    );
  });

  test('4.5 sign-in validation — empty fields', async ({ page }) => {
    await extensionHelper.disableNativeValidation('#loginForm');
    await page.locator('#loginForm button[type="submit"]').click();
    await expect(page.locator('#authMessage .ui-message-error')).toContainText(
      'Please fill in all fields',
    );
  });

  test('4.6 toggle back to login from sign-up', async ({ page }) => {
    await page.locator('#showSignup').click();
    await page.locator('#showLogin').click();
    expect(await extensionHelper.isElementVisible('#loginEmail')).toBe(true);
  });
});

test.describe('Manual Testing Guide — Part 5: Popup Mark as Read', () => {
  let extensionHelper;

  test.beforeEach(async ({ page, context }) => {
    extensionHelper = new ExtensionHelper(page, context, EXTENSION_PATH);
    await mockSupabaseRoutes(page);
    await extensionHelper.mockChromeAPI('authenticated');
    await extensionHelper.openPopup();
    await extensionHelper.waitForExtensionReady();
  });

  test('5.1 main popup layout when authenticated', async ({ page }) => {
    await expect(page.locator('#read-status')).toBeVisible();
    await expect(page.locator('#tags')).toBeVisible();
    await expect(page.locator('button:has-text("Mark as Read")')).toBeVisible();
    await expect(page.locator('.recent-entries-card')).toBeVisible();
    await expect(
      page.getByRole('list', { name: 'Recent bookmarks' }),
    ).toBeAttached();
    await expect(page.locator('button:has-text("Settings")')).toBeVisible();
    await expect(page.locator('button:has-text("Manage URLs")')).toBeVisible();
  });

  test('5.2 default status types in dropdown', async ({ page }) => {
    const options = await page.locator('#read-status option').allTextContents();
    expect(options).toEqual(
      expect.arrayContaining([
        'Read',
        'Good Reference',
        'Low Value',
        'Revisit Later',
      ]),
    );
  });

  test('5.3 mark new page saves bookmark', async ({ page }) => {
    await page.evaluate(() => {
      chrome.tabs.query = () =>
        Promise.resolve([
          {
            url: 'https://example.com/new-page',
            title: 'New Test Page',
          },
        ]);
      window.close = () => {};
    });

    await page.selectOption('#read-status', 'good-reference');
    await page.locator('#tags').fill('research, tutorial');
    await page.locator('button:has-text("Mark as Read")').click();
    await expect(page.locator('.ui-message-success')).toContainText(
      'Page marked as read',
      { timeout: 10_000 },
    );
  });

  test('5.4 duplicate URL opens edit interface', async ({ page }) => {
    await page.selectOption('#read-status', 'low-value');
    await page.locator('#tags').fill('updated');
    await page.locator('button:has-text("Mark as Read")').click();
    await expect(page.locator('#edit-read-status')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator('h1')).toContainText('Edit Bookmark');
  });

  test('5.5 cancel edit returns to main interface', async ({ page }) => {
    await page.locator('button:has-text("Mark as Read")').click();
    await expect(page.locator('#edit-read-status')).toBeVisible({
      timeout: 10_000,
    });
    await page.locator('button:has-text("Back")').click();
    await expect(page.locator('#read-status')).toBeVisible({ timeout: 5_000 });
  });

  test('5.6 restricted URL shows error', async ({ page }) => {
    await page.evaluate(() => {
      chrome.tabs.query = () =>
        Promise.resolve([
          {
            url: 'chrome://extensions/',
            title: 'Extensions',
          },
        ]);
    });
    await page.locator('button:has-text("Mark as Read")').click();
    await expect(page.locator('.ui-message-error')).toContainText(
      'Cannot mark browser pages as read',
      { timeout: 5_000 },
    );
  });
});

test.describe('Manual Testing Guide — Part 8: Settings (Authenticated)', () => {
  let extensionHelper;

  test.beforeEach(async ({ page, context }) => {
    extensionHelper = new ExtensionHelper(page, context, EXTENSION_PATH);
    await mockSupabaseRoutes(page);
    await extensionHelper.mockChromeAPI('authenticated');
    await extensionHelper.openOptions();
    await extensionHelper.waitForExtensionReady();
  });

  test('8.1 settings page sections render', async ({ page }) => {
    await expect(page.locator('.config-card')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.stats-card')).toBeVisible();
    await expect(page.locator('.status-card')).toBeVisible();
    await expect(page.locator('.data-card')).toBeVisible();
    await expect(page.locator('.bookmark-card')).toBeVisible();
  });

  test('8.2 statistics display bookmark counts', async ({ page }) => {
    await expect(page.locator('#total-entries')).not.toHaveText('-', {
      timeout: 10_000,
    });
    const totalEntries = await extensionHelper.getElementText('#total-entries');
    expect(Number(totalEntries)).toBeGreaterThan(0);
  });

  test('8.3 add empty status type shows error', async ({ page }) => {
    await extensionHelper.disableNativeValidation('#add-status-form');
    await page.locator('#new-status').fill('');
    await page.locator('#add-status-form button[type="submit"]').click();
    await expect(page.locator('.ui-message-error')).toContainText(
      'Please enter a status type',
    );
  });

  test('8.4 add custom status type succeeds', async ({ page }) => {
    await page.locator('#new-status').fill('important');
    await page.locator('#add-status-form button[type="submit"]').click();
    await expect(page.locator('.ui-message-success')).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.locator('#status-types-list')).toContainText('Important');
  });

  test('8.5 export all data triggers download', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: 10_000 });
    await page.locator('button:has-text("Export All Data")').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^forgetfulme-export-/);
  });

  test('8.6 clear all data confirmation can be cancelled', async ({ page }) => {
    await page.locator('button:has-text("Clear All Data")').click();
    const dialog = page.locator('dialog.confirm-dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await dialog.locator('button:has-text("Cancel")').click();
    await expect(dialog).toHaveCount(0);
  });
});

test.describe('Manual Testing Guide — Part 9: Bookmark Management', () => {
  let extensionHelper;

  test('9.1 requires authentication when signed out', async ({
    page,
    context,
  }) => {
    extensionHelper = new ExtensionHelper(page, context, EXTENSION_PATH);
    await extensionHelper.mockChromeAPI('configured');
    await extensionHelper.openBookmarkManagement();
    await extensionHelper.waitForExtensionReady();
    expect(await extensionHelper.isElementVisible('.auth-container')).toBe(
      true,
    );
    const text = await page.locator('.auth-container').textContent();
    expect(text).toContain('Authentication Required');
  });

  test.describe('authenticated bookmark management', () => {
    test.beforeEach(async ({ page, context }) => {
      extensionHelper = new ExtensionHelper(page, context, EXTENSION_PATH);
      await mockSupabaseRoutes(page);
      await extensionHelper.mockChromeAPI('authenticated');
      await extensionHelper.openBookmarkManagement();
      await extensionHelper.waitForExtensionReady();
      await expect(page.locator('.bookmark-item').first()).toBeVisible({
        timeout: 10_000,
      });
    });

    test('9.2 page layout renders', async () => {
      expect(await extensionHelper.isElementVisible('#page-title')).toBe(true);
      expect(await extensionHelper.isElementVisible('#search-query')).toBe(
        true,
      );
      expect(await extensionHelper.isElementVisible('#status-filter')).toBe(
        true,
      );
      expect(await extensionHelper.isElementVisible('#bookmarks-list')).toBe(
        true,
      );
      expect(await extensionHelper.isElementVisible('#select-all')).toBe(true);
    });

    test('9.3 bookmarks list loads entries', async ({ page }) => {
      const items = page.locator('.bookmark-item');
      expect(await items.count()).toBeGreaterThan(0);
    });

    test('9.4 search by text filters results', async ({ page }) => {
      await page.locator('#search-query').fill('article-a');
      await page.locator('#search-form button[type="submit"]').click();
      await expect(page.locator('.bookmark-title').first()).toContainText(
        'Article A',
        { timeout: 5_000 },
      );
    });

    test('9.5 filter by status', async ({ page }) => {
      await page.selectOption('#status-filter', 'good-reference');
      await page.locator('#search-form button[type="submit"]').click();
      await expect(page.locator('.bookmark-status').first()).toContainText(
        'Good Reference',
        { timeout: 5_000 },
      );
    });

    test('9.6 edit bookmark opens edit form', async ({ page }) => {
      await page
        .locator('.bookmark-item button:has-text("Edit")')
        .first()
        .click();
      await expect(page.locator('#edit-read-status')).toBeVisible({
        timeout: 5_000,
      });
    });

    test('9.7 bulk select enables action buttons', async ({ page }) => {
      await page.locator('.bookmark-checkbox').first().check();
      expect(await page.locator('#delete-selected').isEnabled()).toBe(true);
      expect(await page.locator('#export-selected').isEnabled()).toBe(true);
    });

    test('9.8 select all toggles selection', async ({ page }) => {
      await page.locator('#select-all').click();
      const checkedCount = await page
        .locator('.bookmark-checkbox:checked')
        .count();
      expect(checkedCount).toBeGreaterThan(0);
      await page.locator('#select-all').click();
      expect(await page.locator('.bookmark-checkbox:checked').count()).toBe(0);
    });

    test('9.9 delete confirmation can be cancelled', async ({ page }) => {
      await page
        .locator('.bookmark-item button:has-text("Delete")')
        .first()
        .click();
      const dialog = page.locator('dialog.confirm-dialog');
      await expect(dialog).toBeVisible({ timeout: 5_000 });
      await dialog.locator('button:has-text("Cancel")').click();
      await expect(dialog).toHaveCount(0);
    });
  });
});

test.describe('Manual Testing Guide — Manual-only sections', () => {
  test.skip('Part 6 — toolbar badge behavior — requires live tab context', () => {});
  test.skip('Part 7 — keyboard shortcut — requires OS-level shortcut', () => {});
  test.skip('Part 10 — cross-device sync — requires second profile', () => {});
  test.skip('Part 11.1 — offline mode — environment specific', () => {});
});
