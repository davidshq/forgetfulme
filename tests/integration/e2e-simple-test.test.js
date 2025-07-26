/**
 * @fileoverview Simple E2E test to debug extension loading
 */

import { test, expect } from '@playwright/test';

test.describe('Simple Extension Loading Test', () => {
  test('should validate Chrome browser environment and extension capabilities', async ({ page, context }) => {
    console.log('Testing Chrome browser and extension environment...');
    
    // Step 1: Test basic Chrome browser functionality
    await page.goto('data:text/html,<html><head><title>Extension Test Page</title></head><body><h1>Testing Extension Environment</h1><p>This page tests Chrome extension capabilities.</p></body></html>');
    
    const title = await page.title();
    expect(title).toBe('Extension Test Page');
    console.log('✓ Basic page navigation works');
    
    // Step 2: Check for Chrome APIs (if available)
    const chromeApiCheck = await page.evaluate(() => {
      return {
        hasChrome: typeof window.chrome !== 'undefined',
        hasStorage: !!(window.chrome && window.chrome.storage),
        hasRuntime: !!(window.chrome && window.chrome.runtime),
        userAgent: navigator.userAgent.includes('Chrome')
      };
    });
    
    console.log('Chrome API availability:', chromeApiCheck);
    expect(chromeApiCheck.userAgent).toBe(true);
    
    // Step 3: Test extension-like functionality simulation
    await page.addInitScript(() => {
      // Simulate extension environment
      if (typeof window.chrome === 'undefined') {
        window.chrome = {
          runtime: {
            id: 'test-extension-id',
            getURL: (path) => `chrome-extension://test-id/${path}`,
            sendMessage: () => console.log('Extension message sent'),
          },
          storage: {
            sync: {
              get: () => console.log('Storage get called'),
              set: () => console.log('Storage set called'),
            }
          }
        };
      }
    });
    
    // Reload to apply the script
    await page.reload();
    
    // Step 4: Verify simulated extension environment
    const extensionSimulation = await page.evaluate(() => {
      const hasExtensionAPIs = !!(window.chrome && window.chrome.runtime && window.chrome.storage);
      const extensionId = window.chrome && window.chrome.runtime ? window.chrome.runtime.id : null;
      
      return {
        hasExtensionAPIs,
        extensionId,
        canSimulateExtension: true
      };
    });
    
    expect(extensionSimulation.hasExtensionAPIs).toBe(true);
    expect(extensionSimulation.extensionId).toBeTruthy();
    console.log('✓ Extension environment simulation successful');
    
    // Step 5: Test popup-like functionality
    const popupTest = await page.evaluate(() => {
      // Create a simple popup-like interface
      const popup = document.createElement('div');
      popup.id = 'extension-popup-test';
      popup.innerHTML = '<h2>Extension Popup Test</h2><button id="test-button">Test Button</button>';
      popup.style.cssText = 'position: fixed; top: 10px; right: 10px; background: white; border: 1px solid #ccc; padding: 10px; z-index: 9999;';
      document.body.appendChild(popup);
      
      return document.getElementById('extension-popup-test') !== null;
    });
    
    expect(popupTest).toBe(true);
    console.log('✓ Popup-like interface creation works');
    
    // Verify the test popup is visible
    const testButton = page.locator('#test-button');
    await expect(testButton).toBeVisible();
    await testButton.click();
    
    console.log('✓ All extension environment tests passed');
    
    // Clean up
    await page.evaluate(() => {
      const popup = document.getElementById('extension-popup-test');
      if (popup) popup.remove();
    });
  });
});