/**
 * @fileoverview Simple visual regression test to establish initial baselines
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..');

test.describe('Simple Visual Regression', () => {
  test('popup default state', async ({ page }) => {
    const filePath = `file://${path.join(projectRoot, 'src', 'ui', 'popup.html')}`;
    await page.goto(filePath);
    await page.waitForLoadState('networkidle');
    await page.setViewportSize({ width: 400, height: 600 });
    
    // Take baseline screenshot
    await expect(page).toHaveScreenshot('popup-baseline.png');
  });

  test('options default state', async ({ page }) => {
    const filePath = `file://${path.join(projectRoot, 'src', 'ui', 'options.html')}`;
    await page.goto(filePath);
    await page.waitForLoadState('networkidle');
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Take baseline screenshot
    await expect(page).toHaveScreenshot('options-baseline.png');
  });

  test('bookmark manager default state', async ({ page }) => {
    const filePath = `file://${path.join(projectRoot, 'src', 'ui', 'bookmark-manager.html')}`;
    await page.goto(filePath);
    await page.waitForLoadState('networkidle');
    await page.setViewportSize({ width: 1400, height: 900 });
    
    // Take baseline screenshot
    await expect(page).toHaveScreenshot('bookmark-manager-baseline.png');
  });
});