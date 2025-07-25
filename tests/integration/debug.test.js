import { test, expect } from '@playwright/test';

test.describe('Debug Tests', () => {
  test('should load popup.html', async ({ page }) => {
    // Navigate to popup.html
    await page.goto('http://localhost:3000/popup.html');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if the app container exists
    const appContainer = await page.locator('#app');
    expect(await appContainer.count()).toBeGreaterThan(0);

    // Log the page content for debugging
    const pageContent = await page.content();
    console.log('Page content:', pageContent.substring(0, 500));

    // Check for any console errors
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
      console.log('Console:', msg.text());
    });

    // Wait a bit to capture any console messages
    await page.waitForTimeout(2000);

    // Check if there are any errors
    const errors = consoleLogs.filter(
      log => log.includes('error') || log.includes('Error')
    );
    console.log('Errors found:', errors);

    // Check if the app container is visible
    const isVisible = await appContainer.isVisible();
    console.log('App container visible:', isVisible);

    // Get the computed style to see if it's hidden
    const style = await appContainer.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
      };
    });
    console.log('App container style:', style);
  });

  test('should load bookmark-management.html', async ({ page }) => {
    // Navigate to bookmark-management.html
    await page.goto('http://localhost:3000/bookmark-management.html');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if the app container exists
    const appContainer = await page.locator('#app');
    expect(await appContainer.count()).toBeGreaterThan(0);

    // Log the page content for debugging
    const pageContent = await page.content();
    console.log('Bookmark page content:', pageContent.substring(0, 500));

    // Check for any console errors
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
      console.log('Console:', msg.text());
    });

    // Wait a bit to capture any console messages
    await page.waitForTimeout(2000);

    // Check if there are any errors
    const errors = consoleLogs.filter(
      log => log.includes('error') || log.includes('Error')
    );
    console.log('Errors found:', errors);

    // Check if the app container is visible
    const isVisible = await appContainer.isVisible();
    console.log('App container visible:', isVisible);

    // Get the computed style to see if it's hidden
    const style = await appContainer.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
      };
    });
    console.log('App container style:', style);
  });
});
