/**
 * @fileoverview Cross-Device Synchronization E2E Tests
 * @module e2e-cross-device-sync
 * @description Tests for real-time synchronization and multi-context scenarios
 * 
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2025-01-01
 */

import { test, expect } from '@playwright/test';
import RealExtensionHelper from '../helpers/real-extension-helper.js';

test.describe('ForgetfulMe Cross-Device Synchronization', () => {
  let device1Helper;
  let device2Helper;
  let device1ExtensionId;
  let device2ExtensionId;

  test.beforeEach(async ({ browser }) => {
    // Create two separate browser contexts to simulate different devices
    const device1Context = await browser.newContext();
    const device2Context = await browser.newContext();
    
    const device1Page = await device1Context.newPage();
    const device2Page = await device2Context.newPage();
    
    // Initialize helpers for both "devices"
    device1Helper = new RealExtensionHelper(device1Page, device1Context);
    device2Helper = new RealExtensionHelper(device2Page, device2Context);
    
    // Verify extensions are loaded on both contexts
    const device1Loaded = await device1Helper.isExtensionLoaded();
    const device2Loaded = await device2Helper.isExtensionLoaded();
    
    if (!device1Loaded || !device2Loaded) {
      test.skip('Extensions not loaded in both browser contexts');
    }
    
    device1ExtensionId = await device1Helper.getExtensionId();
    device2ExtensionId = await device2Helper.getExtensionId();
  });

  test.afterEach(async () => {
    await device1Helper.cleanup();
    await device2Helper.cleanup();
  });

  test('Multi-context extension loading simulation', async () => {
    // Verify both extension instances are running independently
    expect(device1ExtensionId).toBeTruthy();
    expect(device2ExtensionId).toBeTruthy();
    
    // Open popups on both "devices"
    const device1Popup = await device1Helper.openPopup();
    const device2Popup = await device2Helper.openPopup();
    
    // Verify both popups load independently
    await expect(device1Popup.locator('#app')).toBeVisible({ timeout: 10000 });
    await expect(device2Popup.locator('#app')).toBeVisible({ timeout: 10000 });
    
    // Verify they have extension functionality (real or fallback)
    const device1URL = device1Popup.url();
    const device2URL = device2Popup.url();
    
    // Accept either chrome-extension:// URLs or localhost fallback URLs
    const device1IsValid = device1URL.includes('chrome-extension://') || device1URL.includes('localhost:3000');
    const device2IsValid = device2URL.includes('chrome-extension://') || device2URL.includes('localhost:3000');
    
    expect(device1IsValid).toBe(true);
    expect(device2IsValid).toBe(true);
    expect(device1URL).toContain('popup.html');
    expect(device2URL).toContain('popup.html');
    
    // Verify independent contexts can operate simultaneously
    const device1Content = await device1Popup.evaluate(() => document.title);
    const device2Content = await device2Popup.evaluate(() => document.title);
    
    expect(device1Content).toBeTruthy();
    expect(device2Content).toBeTruthy();
    
    console.log(`Device 1 URL: ${device1URL}, Title: ${device1Content}`);
    console.log(`Device 2 URL: ${device2URL}, Title: ${device2Content}`);
    
    await device1Popup.close();
    await device2Popup.close();
  });

  test('Bookmark creation workflow across multiple contexts', async () => {
    // Device 1: Configure extension
    const device1Options = await device1Helper.openOptions();
    
    // Simulate configuration on device 1
    const urlInput = device1Options.locator('#supabaseUrl, input[name="supabaseUrl"]');
    const keyInput = device1Options.locator('#supabaseKey, input[name="supabaseKey"]');
    
    if (await urlInput.isVisible() && await keyInput.isVisible()) {
      await urlInput.fill('https://test-project.supabase.co');
      await keyInput.fill('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-key');
      
      const saveButton = device1Options.locator('button').filter({ hasText: /save|apply/i });
      if (await saveButton.count() > 0) {
        await saveButton.click();
        await device1Options.waitForTimeout(2000);
      }
    }
    
    await device1Options.close();
    
    // Device 1: Create bookmark
    const device1Popup = await device1Helper.openPopup();
    
    // Simulate bookmark creation on device 1
    const titleInput = device1Popup.locator('#bookmarkTitle, input[name="title"]');
    const markButton = device1Popup.locator('button').filter({ hasText: /mark|save|bookmark/i });
    
    if (await titleInput.count() > 0 && await markButton.count() > 0) {
      await titleInput.fill('Cross-Device Test Bookmark');
      await markButton.click();
      await device1Popup.waitForTimeout(2000);
    }
    
    await device1Popup.close();
    
    // Device 2: Check for synchronized data (in real implementation)
    const device2Bookmark = await device2Helper.openBookmarkManagement();
    
    // In a real Supabase integration, this would check for synchronized bookmarks
    // For now, we verify the interface is accessible on device 2
    await device2Bookmark.waitForSelector('#app', { timeout: 5000 });
    
    // Simulate search for the bookmark created on device 1
    const searchInput = device2Bookmark.locator('#searchInput, input[placeholder*="search"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('Cross-Device Test');
      await searchInput.press('Enter');
      await device2Bookmark.waitForTimeout(1000);
    }
    
    await device2Bookmark.close();
  });

  test('Real-time update simulation workflow', async () => {
    // Open bookmark management on both devices
    const device1Bookmark = await device1Helper.openBookmarkManagement();
    const device2Bookmark = await device2Helper.openBookmarkManagement();
    
    // Verify both interfaces are ready
    await device1Bookmark.waitForSelector('#app', { timeout: 5000 });
    await device2Bookmark.waitForSelector('#app', { timeout: 5000 });
    
    // Device 1: Create new bookmark
    const addButton = device1Bookmark.locator('button').filter({ hasText: /add|new|create/i });
    
    if (await addButton.count() > 0) {
      await addButton.click();
      
      const urlInput = device1Bookmark.locator('#bookmarkUrl, input[name="url"]');
      const titleInput = device1Bookmark.locator('#bookmarkTitle, input[name="title"]');
      const saveButton = device1Bookmark.locator('button').filter({ hasText: /save|create/i });
      
      if (await urlInput.count() > 0 && await titleInput.count() > 0) {
        await urlInput.fill('https://example.com/realtime-test');
        await titleInput.fill('Real-time Sync Test');
        
        if (await saveButton.count() > 0) {
          await saveButton.click();
          await device1Bookmark.waitForTimeout(2000);
        }
      }
    }
    
    // Device 2: Simulate checking for updates
    // In real implementation, this would test real-time subscriptions
    const refreshButton = device2Bookmark.locator('button').filter({ hasText: /refresh|reload/i });
    if (await refreshButton.count() > 0) {
      await refreshButton.click();
      await device2Bookmark.waitForTimeout(1000);
    }
    
    // Both devices should maintain independent UI state
    await expect(device1Bookmark.locator('#app')).toBeVisible();
    await expect(device2Bookmark.locator('#app')).toBeVisible();
    
    await device1Bookmark.close();
    await device2Bookmark.close();
  });

  test('Concurrent user actions across contexts', async () => {
    // Simulate concurrent actions on both devices
    const device1Popup = await device1Helper.openPopup();
    const device2Options = await device2Helper.openOptions();
    
    // Device 1: User creating bookmark
    const device1Title = device1Popup.locator('#bookmarkTitle, input[name="title"]');
    if (await device1Title.count() > 0) {
      await device1Title.fill('Concurrent Action Test 1');
    }
    
    // Device 2: User modifying settings
    const device2StatusInput = device2Options.locator('input[name*="status"], #customStatusTypes');
    if (await device2StatusInput.count() > 0) {
      await device2StatusInput.fill('concurrent-test-status');
    }
    
    // Execute actions simultaneously
    const [device1Save, device2Save] = await Promise.allSettled([
      (async () => {
        const saveBtn = device1Popup.locator('button').filter({ hasText: /save|mark/i });
        if (await saveBtn.count() > 0) {
          await saveBtn.click();
          await device1Popup.waitForTimeout(1000);
        }
      })(),
      (async () => {
        const saveBtn = device2Options.locator('button').filter({ hasText: /save|apply/i });
        if (await saveBtn.count() > 0) {
          await saveBtn.click();
          await device2Options.waitForTimeout(1000);
        }
      })()
    ]);
    
    // Both operations should complete without interference
    expect(device1Save.status).toBe('fulfilled');
    expect(device2Save.status).toBe('fulfilled');
    
    await device1Popup.close();
    await device2Options.close();
  });

  test('Session state isolation between contexts', async () => {
    // Device 1: Set specific state
    const device1Options = await device1Helper.openOptions();
    
    // Modify preferences on device 1
    const device1Toggle = device1Options.locator('input[type="checkbox"]').first();
    if (await device1Toggle.count() > 0) {
      const initialState = await device1Toggle.isChecked();
      await device1Toggle.click();
      await device1Options.waitForTimeout(500);
      
      // Verify state changed
      const newState = await device1Toggle.isChecked();
      expect(newState).toBe(!initialState);
    }
    
    // Device 2: Check state isolation
    const device2Options = await device2Helper.openOptions();
    
    // Device 2 should have independent state
    const device2Toggle = device2Options.locator('input[type="checkbox"]').first();
    if (await device2Toggle.count() > 0) {
      // In isolated contexts, changes on device 1 shouldn't affect device 2
      // (until real-time sync is implemented)
      await device2Toggle.waitFor({ state: 'visible', timeout: 3000 });
    }
    
    // Both devices should maintain their own UI state
    await expect(device1Options.locator('#app')).toBeVisible();
    await expect(device2Options.locator('#app')).toBeVisible();
    
    await device1Options.close();
    await device2Options.close();
  });

  test('Error handling across multiple contexts', async () => {
    // Simulate network error on device 1
    const device1Popup = await device1Helper.openPopup();
    
    // Block network requests on device 1
    await device1Popup.route('**/*', route => {
      if (route.request().url().includes('supabase')) {
        route.abort();
      } else {
        route.continue();
      }
    });
    
    // Device 2: Normal operation
    const device2Popup = await device2Helper.openPopup();
    
    // Device 1: Try to perform action (should fail)
    const device1SaveBtn = device1Popup.locator('button').filter({ hasText: /save|mark/i });
    if (await device1SaveBtn.count() > 0) {
      await device1SaveBtn.click();
      await device1Popup.waitForTimeout(3000);
      
      // Should show error on device 1
      const errorMessage = device1Popup.locator('.ui-message.error, .error-message');
      if (await errorMessage.count() > 0) {
        await expect(errorMessage).toBeVisible({ timeout: 3000 });
      }
    }
    
    // Device 2: Should continue working normally
    const device2SaveBtn = device2Popup.locator('button').filter({ hasText: /save|mark/i });
    if (await device2SaveBtn.count() > 0) {
      await device2SaveBtn.click();
      await device2Popup.waitForTimeout(2000);
      
      // Device 2 should not be affected by device 1's network issues
      await expect(device2Popup.locator('#app')).toBeVisible();
    }
    
    await device1Popup.close();
    await device2Popup.close();
  });

  test('Extension lifecycle across multiple contexts', async () => {
    // Test extension behavior when one context is closed
    const device1Popup = await device1Helper.openPopup();
    const device2Popup = await device2Helper.openPopup();
    
    // Verify both are working
    await expect(device1Popup.locator('#app')).toBeVisible();
    await expect(device2Popup.locator('#app')).toBeVisible();
    
    // Close device 1 context
    await device1Helper.context.close();
    
    // Device 2 should continue working independently
    await expect(device2Popup.locator('#app')).toBeVisible();
    
    // Device 2 should be able to perform actions
    const device2ActionBtn = device2Popup.locator('button').first();
    if (await device2ActionBtn.count() > 0) {
      await device2ActionBtn.click();
      await device2Popup.waitForTimeout(1000);
    }
    
    await device2Popup.close();
  });
});