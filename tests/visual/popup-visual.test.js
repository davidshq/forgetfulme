import { test, expect } from '@playwright/test';

test.describe('Popup visual', () => {
  test.use({ viewport: { width: 380, height: 560 } });

  test('default state', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/src/popup/popup.html');
    await expect(page).toHaveScreenshot('popup-default.png');
  });
});

