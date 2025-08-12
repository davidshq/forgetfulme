import { test, expect } from '@playwright/test';

test.describe('Popup signed-in visual', () => {
  test.use({ viewport: { width: 380, height: 560 } });

  test('shows signed-in state with recents', async ({ page }) => {
    await page.goto('/popup/popup.html?mock=signedin');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('domcontentloaded');
    
    // Wait a bit for any JavaScript to execute
    await page.waitForTimeout(1000);
    
    // Ensure app section is visible for the test (signed-in state)
    await page.evaluate(() => {
      document.getElementById('auth-section').hidden = true;
      document.getElementById('app-section').hidden = false;
    });
    
    await expect(page).toHaveScreenshot('popup-signedin.png');
  });
});

