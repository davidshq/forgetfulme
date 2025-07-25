import { test, expect } from '@playwright/test';

test.describe('Debug Bookmark Management Tests', () => {
  test('should see what is actually rendered', async ({ page }) => {
    // Navigate to bookmark-management.html
    await page.goto('http://localhost:3000/bookmark-management.html');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Wait a bit for JavaScript to execute
    await page.waitForTimeout(3000);

    // Get the page content
    const pageContent = await page.content();
    console.log('Full page content:', pageContent);

    // Check what elements are actually present
    const appContainer = await page.locator('#app');
    const appHTML = await appContainer.innerHTML();
    console.log('App container HTML:', appHTML);

    // Check for different possible interfaces
    const setupContainer = await page.locator('.setup-container');
    const authContainer = await page.locator('.auth-container');
    const breadcrumb = await page.locator('.page-breadcrumb');
    const searchCard = await page.locator('.search-card');

    console.log('Setup container exists:', await setupContainer.count());
    console.log('Auth container exists:', await authContainer.count());
    console.log('Breadcrumb exists:', await breadcrumb.count());
    console.log('Search card exists:', await searchCard.count());

    // Check for any console errors
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
      console.log('Console:', msg.text());
    });

    // Wait a bit more to capture console messages
    await page.waitForTimeout(2000);

    console.log('All console logs:', consoleLogs);
  });
});
