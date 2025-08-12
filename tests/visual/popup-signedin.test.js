import { test, expect } from '@playwright/test';

test.describe('Popup signed-in visual', () => {
  test.use({ viewport: { width: 380, height: 560 } });

  test('shows signed-in state with recents', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/src/popup/popup.html?mock=signedin');
    await page.waitForSelector('#app-section:not([hidden])');
    await expect(page).toHaveScreenshot('popup-signedin.png');
  });
});

