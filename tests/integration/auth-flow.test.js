import { test, expect } from '@playwright/test';
import { ExtensionHelper } from './utils/playwright-utils.js';

test.describe('ForgetfulMe Basic Page Loading Tests', () => {
  let extensionHelper;

  test.beforeEach(async ({ page, context }) => {
    // Initialize extension helper with proper Chrome extension context
    extensionHelper = new ExtensionHelper(page, context);

    // Set up Chrome API mocking
    await extensionHelper.mockChromeAPI();
  });

  test('should load bookmark management page successfully', async ({
    page,
  }) => {
    // Navigate to bookmark management page
    await page.goto('http://localhost:3000/bookmark-management.html');
    await extensionHelper.waitForExtensionReady();

    // Verify the page loads without errors
    const pageTitle = await page.title();
    expect(pageTitle).toContain('ForgetfulMe');

    // Verify the main app container is present
    const appContainer = await page.locator('#app');
    await expect(appContainer).toBeVisible();

    // Verify some basic content is rendered
    const pageContent = await page.content();
    expect(pageContent).toContain('ForgetfulMe');
  });

  test('should load options page successfully', async ({ page }) => {
    // Navigate to options page
    await page.goto('http://localhost:3000/options.html');
    await extensionHelper.waitForExtensionReady();

    // Verify the page loads without errors
    const pageTitle = await page.title();
    expect(pageTitle).toContain('ForgetfulMe');

    // Verify the main app container is present
    const appContainer = await page.locator('#app');
    await expect(appContainer).toBeVisible();
  });

  test('should load popup page successfully', async ({ page }) => {
    // Navigate to popup page
    await page.goto('http://localhost:3000/popup.html');
    await extensionHelper.waitForExtensionReady();

    // Verify the page loads without errors
    const pageTitle = await page.title();
    expect(pageTitle).toContain('ForgetfulMe');

    // Verify the main app container is present
    const appContainer = await page.locator('#app');
    await expect(appContainer).toBeVisible();
  });

  test('should handle page reloads gracefully', async ({ page }) => {
    // Navigate to bookmark management page
    await page.goto('http://localhost:3000/bookmark-management.html');
    await extensionHelper.waitForExtensionReady();

    // Verify initial load
    const appContainer = await page.locator('#app');
    await expect(appContainer).toBeVisible();

    // Reload the page
    await page.reload();
    await extensionHelper.waitForExtensionReady();

    // Verify page still loads after reload
    await expect(appContainer).toBeVisible();
  });

  test('should load all required JavaScript files', async ({ page }) => {
    // Navigate to bookmark management page
    await page.goto('http://localhost:3000/bookmark-management.html');
    await extensionHelper.waitForExtensionReady();

    // Check that the main script is loaded
    const scriptElements = await page.locator(
      'script[src*="bookmark-management.js"]'
    );
    await expect(scriptElements).toHaveCount(1);

    // Check that Supabase library is loaded
    const supabaseScript = await page.locator(
      'script[src*="supabase-js.min.js"]'
    );
    await expect(supabaseScript).toHaveCount(1);
  });

  test('should load CSS stylesheets', async ({ page }) => {
    // Navigate to bookmark management page
    await page.goto('http://localhost:3000/bookmark-management.html');
    await extensionHelper.waitForExtensionReady();

    // Check that CSS is loaded
    const cssLink = await page.locator('link[href*="pico.min.css"]');
    await expect(cssLink).toHaveCount(1);
  });

  test('should have proper HTML structure', async ({ page }) => {
    // Navigate to bookmark management page
    await page.goto('http://localhost:3000/bookmark-management.html');
    await extensionHelper.waitForExtensionReady();

    // Verify basic HTML structure
    const html = await page.locator('html');
    await expect(html).toBeVisible();

    // Check that head and body exist (don't check visibility for head)
    const head = await page.locator('head');
    await expect(head).toHaveCount(1);

    const body = await page.locator('body');
    await expect(body).toBeVisible();

    const appDiv = await page.locator('#app');
    await expect(appDiv).toBeVisible();
  });

  test('should not have JavaScript errors on page load', async ({ page }) => {
    const consoleErrors = [];

    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to bookmark management page
    await page.goto('http://localhost:3000/bookmark-management.html');
    await extensionHelper.waitForExtensionReady();

    // Wait a bit for any potential errors
    await page.waitForTimeout(2000);

    // Verify no JavaScript errors occurred
    expect(consoleErrors.length).toBe(0);
  });

  test('should have proper meta tags', async ({ page }) => {
    // Navigate to bookmark management page
    await page.goto('http://localhost:3000/bookmark-management.html');
    await extensionHelper.waitForExtensionReady();

    // Check for required meta tags
    const charsetMeta = await page.locator('meta[charset="UTF-8"]');
    await expect(charsetMeta).toHaveCount(1);

    const viewportMeta = await page.locator('meta[name="viewport"]');
    await expect(viewportMeta).toHaveCount(1);
  });
});
