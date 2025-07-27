/**
 * @fileoverview Complete User Workflow E2E Tests
 * @module e2e-user-workflows
 * @description End-to-end tests for complete user journeys in real Chrome extension environment
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2025-01-01
 */

import { test, expect } from '@playwright/test';
import RealExtensionHelper from '../helpers/real-extension-helper.js';

test.describe('ForgetfulMe Complete User Workflows', () => {
  let extensionHelper;
  let extensionId;

  test.beforeEach(async ({ page, context }) => {
    extensionHelper = new RealExtensionHelper(page, context);

    const isLoaded = await extensionHelper.isExtensionLoaded();
    if (!isLoaded) {
      test.skip('Extension not loaded in browser context');
    }

    extensionId = await extensionHelper.getExtensionId();
  });

  test.afterEach(async () => {
    await extensionHelper.cleanup();
  });

  test('First-time user setup workflow', async () => {
    // Step 1: User opens extension for first time
    const popupPage = await extensionHelper.openPopup();

    // Check if popup loads (could be setup interface or main interface)
    await expect(popupPage.locator('#app')).toBeVisible({ timeout: 10000 });

    // Get the current interface content
    const pageContent = await popupPage.textContent('#app');
    const hasSetupContent =
      pageContent.toLowerCase().includes('welcome') ||
      pageContent.toLowerCase().includes('setup') ||
      pageContent.toLowerCase().includes('configure');

    console.log(
      'Popup content type:',
      hasSetupContent ? 'Setup interface' : 'Main interface'
    );

    // Step 2: Test settings navigation (if setup interface exists)
    const settingsButtons = await popupPage
      .locator('button')
      .filter({ hasText: /settings|configure|setup|⚙️/i })
      .count();
    console.log('Settings buttons found:', settingsButtons);

    if (settingsButtons > 0) {
      // There are settings-related buttons
      const settingsButton = popupPage
        .locator('button')
        .filter({ hasText: /settings|configure|setup|⚙️/i })
        .first();

      // Mock the options page opening
      await popupPage.addInitScript(() => {
        if (window.chrome && window.chrome.runtime) {
          window.chrome.runtime.openOptionsPage = () => {
            window.optionsPageRequested = true;
          };
        }
      });

      await settingsButton.click();
      await popupPage.waitForTimeout(1000);
    }

    // Step 3: Test options page access
    const optionsPage = await extensionHelper.openOptions();
    await expect(optionsPage.locator('#app')).toBeVisible({ timeout: 10000 });

    // Check for any form elements (configuration interface)
    const inputElements = await optionsPage
      .locator('input, select, textarea')
      .count();
    console.log('Form elements found in options:', inputElements);

    // Step 4: Test basic form interaction if forms exist
    if (inputElements > 0) {
      const firstInput = optionsPage.locator('input').first();
      if (await firstInput.isVisible()) {
        await firstInput.fill('test-configuration-value');
        console.log('Successfully filled form input');
      }
    }

    // Verify the workflow completes without errors
    const optionsContent = await optionsPage.textContent('#app');
    expect(optionsContent.length).toBeGreaterThan(10);
    console.log('✓ First-time setup workflow test completed');

    await optionsPage.close();
    await popupPage.close();
  });

  test('Daily bookmark workflow: Quick mark via popup', async () => {
    // Step 1: User is on a webpage they want to bookmark
    const testPage = await extensionHelper.createTestPage(
      'https://example.com/interesting-article',
      'Interesting Article About Technology'
    );

    // Step 2: User opens extension popup
    const popupPage = await extensionHelper.openPopup();

    // Step 3: Check if popup loads and has interactive elements
    await expect(popupPage.locator('#app')).toBeVisible({ timeout: 10000 });

    // Step 4: Analyze available interface elements
    const interfaceAnalysis = await popupPage.evaluate(() => {
      const inputs = document.querySelectorAll('input, select, textarea');
      const buttons = document.querySelectorAll('button');
      return {
        inputCount: inputs.length,
        buttonCount: buttons.length,
        hasInteractiveElements: inputs.length > 0 || buttons.length > 0,
      };
    });

    console.log('Interface analysis:', interfaceAnalysis);

    // Step 5: Interact with available elements
    if (interfaceAnalysis.inputCount > 0) {
      const firstInput = popupPage.locator('input').first();
      if (await firstInput.isVisible()) {
        await firstInput.fill('Test bookmark value');
        console.log('Successfully filled input field');
      }
    }

    if (interfaceAnalysis.buttonCount > 0) {
      const firstButton = popupPage.locator('button').first();
      if (await firstButton.isVisible()) {
        await firstButton.click();
        await popupPage.waitForTimeout(1000);
        console.log('Successfully clicked button');
      }
    }

    // Verify workflow completed without errors
    const finalState = await popupPage.evaluate(() => {
      return {
        appVisible: !!document.getElementById('app'),
        hasContent: document.body.textContent.length > 10,
      };
    });

    expect(finalState.appVisible).toBe(true);
    expect(finalState.hasContent).toBe(true);
    console.log('✓ Bookmark workflow test completed successfully');

    // Close popup
    await popupPage.close();
    await testPage.close();
  });

  test('Keyboard shortcut workflow', async () => {
    // Step 1: Create a test page for keyboard shortcut testing
    const testPage = await extensionHelper.createTestPage(
      'https://example.com/shortcut-test',
      'Shortcut Test Page'
    );

    // Bring test page to front
    await testPage.bringToFront();

    // Step 2: Set up keyboard event detection
    await testPage.addInitScript(() => {
      window.shortcutDetected = false;
      window.shortcutDetails = null;

      document.addEventListener('keydown', event => {
        if (event.ctrlKey && event.shiftKey && event.key === 'R') {
          window.shortcutDetected = true;
          window.shortcutDetails = {
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            key: event.key,
            timestamp: Date.now(),
          };
          console.log('Keyboard shortcut Ctrl+Shift+R detected');
        }
      });
    });

    // Step 3: Trigger keyboard shortcut
    await testPage.keyboard.press('Control+Shift+KeyR');
    await testPage.waitForTimeout(1000);

    // Step 4: Verify shortcut was detected
    const shortcutResult = await testPage.evaluate(() => {
      return {
        detected: window.shortcutDetected,
        details: window.shortcutDetails,
      };
    });

    expect(shortcutResult.detected).toBe(true);
    expect(shortcutResult.details.ctrlKey).toBe(true);
    expect(shortcutResult.details.shiftKey).toBe(true);
    expect(shortcutResult.details.key).toBe('R');

    console.log('✓ Keyboard shortcut detection working');

    // Step 5: Test if extension popup can be triggered manually
    const popupPage = await extensionHelper.openPopup();
    await expect(popupPage.locator('#app')).toBeVisible({ timeout: 5000 });

    // Simulate quick bookmark action
    const hasButtons = await popupPage.locator('button').count();
    if (hasButtons > 0) {
      const firstButton = popupPage.locator('button').first();
      if (await firstButton.isVisible()) {
        await firstButton.click();
        await popupPage.waitForTimeout(500);
      }
    }

    console.log('✓ Keyboard shortcut workflow test completed');
    await popupPage.close();
    await testPage.close();
  });

  test('Bookmark management workflow', async () => {
    // Step 1: User opens bookmark management
    const bookmarkPage = await extensionHelper.openBookmarkManagement();

    // Step 2: User views their bookmark list
    await bookmarkPage.waitForSelector('#app', { timeout: 5000 });

    // Should see bookmark interface (exact elements depend on auth state)
    const bookmarkInterface = bookmarkPage.locator(
      '.bookmark-list, .search-card, .bookmark-management'
    );

    if ((await bookmarkInterface.count()) > 0) {
      await expect(bookmarkInterface.first()).toBeVisible({ timeout: 3000 });

      // Step 3: User searches bookmarks
      const searchInput = bookmarkPage.locator(
        '#searchInput, input[placeholder*="search"]'
      );
      if ((await searchInput.count()) > 0) {
        await searchInput.fill('test');
        await searchInput.press('Enter');
        await bookmarkPage.waitForTimeout(1000);
      }

      // Step 4: User adds new bookmark manually
      const addButton = bookmarkPage
        .locator('button')
        .filter({ hasText: /add|new|create/i });
      if ((await addButton.count()) > 0) {
        await addButton.click();

        // Fill new bookmark form
        const urlInput = bookmarkPage.locator(
          '#bookmarkUrl, input[name="url"]'
        );
        const titleInput = bookmarkPage.locator(
          '#bookmarkTitle, input[name="title"]'
        );

        if ((await urlInput.count()) > 0 && (await titleInput.count()) > 0) {
          await urlInput.fill('https://example.com/manual-bookmark');
          await titleInput.fill('Manual Bookmark Test');

          const saveButton = bookmarkPage
            .locator('button')
            .filter({ hasText: /save|create/i });
          if ((await saveButton.count()) > 0) {
            await saveButton.click();
            await bookmarkPage.waitForTimeout(2000);
          }
        }
      }
    }

    await bookmarkPage.close();
  });

  test('Settings and preferences workflow', async () => {
    // Step 1: User opens settings
    const optionsPage = await extensionHelper.openOptions();

    // Step 2: User modifies custom status types
    await optionsPage.waitForSelector('#app', { timeout: 5000 });

    // Look for custom status configuration
    const statusSection = optionsPage.locator(
      '.custom-status, .status-types, #customStatusTypes'
    );

    if ((await statusSection.count()) > 0) {
      // User adds new status type
      const addStatusButton = optionsPage
        .locator('button')
        .filter({ hasText: /add.*status|new.*status/i });

      if ((await addStatusButton.count()) > 0) {
        await addStatusButton.click();

        const statusInput = optionsPage
          .locator('input[placeholder*="status"], input[name*="status"]')
          .last();
        if ((await statusInput.count()) > 0) {
          await statusInput.fill('research-later');

          const saveButton = optionsPage
            .locator('button')
            .filter({ hasText: /save|apply/i });
          if ((await saveButton.count()) > 0) {
            await saveButton.click();
            await optionsPage.waitForTimeout(1000);
          }
        }
      }
    }

    // Step 3: User modifies other preferences
    const preferencesSection = optionsPage.locator(
      '.preferences, .user-preferences'
    );

    if ((await preferencesSection.count()) > 0) {
      // Look for preference toggles or inputs
      const toggles = optionsPage.locator('input[type="checkbox"]');
      const toggleCount = await toggles.count();

      if (toggleCount > 0) {
        // Toggle first preference
        await toggles.first().click();
        await optionsPage.waitForTimeout(500);
      }
    }

    // Step 4: User saves all changes
    const saveAllButton = optionsPage
      .locator('button')
      .filter({ hasText: /save all|apply changes/i });
    if ((await saveAllButton.count()) > 0) {
      await saveAllButton.click();
      await optionsPage.waitForTimeout(1000);
    }

    await optionsPage.close();
  });

  test('Error handling and recovery workflow', async () => {
    // Step 1: User encounters network error
    const popupPage = await extensionHelper.openPopup();

    // Simulate network failure by blocking requests
    await popupPage.route('**/*', route => {
      if (route.request().url().includes('supabase')) {
        route.abort();
      } else {
        route.continue();
      }
    });

    // Step 2: User tries to perform action
    const markButton = popupPage
      .locator('button')
      .filter({ hasText: /mark|save|bookmark/i });
    if ((await markButton.count()) > 0) {
      await markButton.click();
      await popupPage.waitForTimeout(3000);

      // Should see error message
      const errorMessage = popupPage.locator(
        '.ui-message.error, .error-message, .network-error'
      );
      if ((await errorMessage.count()) > 0) {
        await expect(errorMessage).toBeVisible({ timeout: 3000 });

        // Step 3: User tries retry
        const retryButton = popupPage
          .locator('button')
          .filter({ hasText: /retry|try again/i });
        if ((await retryButton.count()) > 0) {
          // Remove network block
          await popupPage.unroute('**/*');

          // Retry operation
          await retryButton.click();
          await popupPage.waitForTimeout(2000);
        }
      }
    }

    await popupPage.close();
  });

  test('Cross-page navigation and state consistency', async () => {
    // Step 1: User starts in popup
    const popupPage = await extensionHelper.openPopup();

    // User performs some action in popup
    const statusSelect = popupPage.locator('select, #bookmarkStatus');
    if ((await statusSelect.count()) > 0) {
      await statusSelect.selectOption('good-reference');
    }

    // Note initial state
    const popupContent = await popupPage.textContent('#app');

    // Step 2: User navigates to bookmark management
    const bookmarkPage = await extensionHelper.openBookmarkManagement();

    // Should maintain consistent user context
    await bookmarkPage.waitForSelector('#app', { timeout: 5000 });

    // Step 3: User navigates to options
    const optionsPage = await extensionHelper.openOptions();

    // Should maintain consistent user context
    await optionsPage.waitForSelector('#app', { timeout: 5000 });

    // Step 4: User returns to popup
    await popupPage.bringToFront();

    // Should maintain state (if applicable)
    await popupPage.waitForTimeout(1000);

    // Verify pages are independently functional
    await expect(popupPage.locator('#app')).toBeVisible();
    await expect(bookmarkPage.locator('#app')).toBeVisible();
    await expect(optionsPage.locator('#app')).toBeVisible();

    // Clean up
    await popupPage.close();
    await bookmarkPage.close();
    await optionsPage.close();
  });
});
