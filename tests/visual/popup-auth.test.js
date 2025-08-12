import { test, expect } from '@playwright/test';

test.describe('Popup auth view', () => {
  test.use({ viewport: { width: 380, height: 560 } });

  test('shows auth form when signed out', async ({ page }) => {
    await page.goto('/popup/popup.html');
    
    // Wait for the JavaScript to load and execute
    await page.waitForLoadState('networkidle');
    
    // Wait for either auth section to be visible or app section to be visible
    // This handles both signed-in and signed-out states
    await page.waitForSelector('#auth-section:not([hidden]), #app-section:not([hidden])', { timeout: 10000 });
    
    // If we're signed in (app section visible), sign out first
    const appSectionVisible = await page.isVisible('#app-section:not([hidden])');
    if (appSectionVisible) {
      await page.click('#signout-btn');
      await page.waitForSelector('#auth-section:not([hidden])');
    }
    
    await expect(page).toHaveScreenshot('popup-auth.png');
  });
});

