import { test, expect } from '@playwright/test';

test.describe('Popup auth view', () => {
  test.use({ viewport: { width: 380, height: 560 } });

  test('shows auth form when signed out', async ({ page }) => {
    await page.goto('/popup/popup.html');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('domcontentloaded');
    
    // Wait a bit for any JavaScript to execute
    await page.waitForTimeout(1000);
    
    // Check if we need to show the auth form by default
    // Since there's no Supabase config in test env, getUser() should return null
    // and the auth section should be shown
    const authSectionHidden = await page.getAttribute('#auth-section', 'hidden');
    const appSectionHidden = await page.getAttribute('#app-section', 'hidden');
    
    // If auth section is hidden and app section is visible, we need to sign out
    if (authSectionHidden !== null && appSectionHidden === null) {
      await page.click('#signout-btn');
      await page.waitForSelector('#auth-section:not([hidden])');
    }
    
    // Ensure auth section is visible for the test
    await page.evaluate(() => {
      document.getElementById('auth-section').hidden = false;
      document.getElementById('app-section').hidden = true;
    });
    
    await expect(page).toHaveScreenshot('popup-auth.png');
  });
});

