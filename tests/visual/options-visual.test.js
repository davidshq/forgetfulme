import { test, expect } from '@playwright/test';

test.describe('Options visual', () => {
  test.use({ viewport: { width: 380, height: 560 } });

  test('default state', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/src/options/options.html');
    await expect(page).toHaveScreenshot('options-default.png');
  });
});

