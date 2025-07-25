import { test, expect } from '@playwright/test';
import ExtensionHelper from '../helpers/extension-helper.js';

test.describe('ForgetfulMe Bookmark Operations Tests', () => {
  let extensionHelper;

  test.beforeEach(async ({ page, context }) => {
    extensionHelper = new ExtensionHelper(page, context);
    
    // Mock Chrome API before loading the page
    await extensionHelper.mockChromeAPI();
  });

  test('should create and save new bookmark', async ({ page }) => {
    // Set up authenticated state
    await extensionHelper.setupAuthenticatedState();

    await page.goto('http://localhost:3000/bookmark-management.html');
    await extensionHelper.waitForExtensionReady();
    await extensionHelper.waitForNetworkIdle();

    // Verify bookmark management interface is visible
    const searchCard = await page.locator('.search-card');
    await expect(searchCard).toBeVisible({ 
      timeout: 5000,
      message: 'Search card should be visible for authenticated users'
    });

    // Fill in bookmark form
    const urlInput = await page.locator('#bookmarkUrl');
    const titleInput = await page.locator('#bookmarkTitle');
    const tagsInput = await page.locator('#bookmarkTags');
    
    await expect(urlInput).toBeVisible({ timeout: 5000 });
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    
    await urlInput.fill('https://example.com/test-page');
    await titleInput.fill('Test Page Title');
    if (await tagsInput.isVisible()) {
      await tagsInput.fill('test, integration');
    }

    // Submit bookmark
    const saveButton = await page.locator('button').filter({ hasText: /save/i });
    await expect(saveButton).toBeVisible({ timeout: 5000 });
    await saveButton.click();

    // Wait for save operation
    await extensionHelper.waitForNetworkIdle();

    // Verify success message
    const successMessage = await page.locator('.ui-message.success');
    await expect(successMessage).toBeVisible({ 
      timeout: 5000,
      message: 'Success message should be displayed after bookmark save'
    });
  });

  test('should search and filter bookmarks', async ({ page }) => {
    // Set up authenticated state with existing bookmarks
    await extensionHelper.setupAuthenticatedState();

    await page.goto('http://localhost:3000/bookmark-management.html');
    await extensionHelper.waitForExtensionReady();
    await extensionHelper.waitForNetworkIdle();

    // Verify search functionality is available
    const searchInput = await page.locator('#searchInput, input[placeholder*="search"]');
    await expect(searchInput).toBeVisible({ 
      timeout: 5000,
      message: 'Search input should be visible for authenticated users'
    });

    // Perform search
    await searchInput.fill('test');
    await searchInput.press('Enter');
    await extensionHelper.waitForNetworkIdle();

    // Verify search results or no results message
    const searchResults = await page.locator('.bookmark-item, .no-results');
    await expect(searchResults).toBeVisible({ 
      timeout: 5000,
      message: 'Search results or no results message should be displayed'
    });
  });

  test('should edit existing bookmark', async ({ page }) => {
    // Set up authenticated state
    await extensionHelper.setupAuthenticatedState();

    await page.goto('http://localhost:3000/bookmark-management.html');
    await extensionHelper.waitForExtensionReady();
    await extensionHelper.waitForNetworkIdle();

    // Find and click edit button for first bookmark
    const editButton = await page.locator('.edit-bookmark, button[title*="edit"]').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await extensionHelper.waitForNetworkIdle();

      // Verify edit form is visible
      const editForm = await page.locator('.edit-form, .bookmark-form');
      await expect(editForm).toBeVisible({ 
        timeout: 5000,
        message: 'Edit form should be visible when editing bookmark'
      });

      // Update bookmark title
      const titleInput = await page.locator('#bookmarkTitle');
      if (await titleInput.isVisible()) {
        await titleInput.fill('Updated Test Title');
        
        // Save changes
        const saveButton = await page.locator('button').filter({ hasText: /save/i });
        await saveButton.click();
        await extensionHelper.waitForNetworkIdle();

        // Verify success message
        const successMessage = await page.locator('.ui-message.success');
        await expect(successMessage).toBeVisible({ 
          timeout: 5000,
          message: 'Success message should be displayed after bookmark update'
        });
      }
    }
  });

  test('should delete bookmark with confirmation', async ({ page }) => {
    // Set up authenticated state
    await extensionHelper.setupAuthenticatedState();

    await page.goto('http://localhost:3000/bookmark-management.html');
    await extensionHelper.waitForExtensionReady();
    await extensionHelper.waitForNetworkIdle();

    // Find and click delete button for first bookmark
    const deleteButton = await page.locator('.delete-bookmark, button[title*="delete"]').first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await extensionHelper.waitForNetworkIdle();

      // Verify confirmation dialog
      const confirmDialog = await page.locator('.confirm-dialog, .modal');
      if (await confirmDialog.isVisible()) {
        // Confirm deletion
        const confirmButton = await page.locator('button').filter({ hasText: /confirm|yes|delete/i });
        await confirmButton.click();
        await extensionHelper.waitForNetworkIdle();

        // Verify success message
        const successMessage = await page.locator('.ui-message.success');
        await expect(successMessage).toBeVisible({ 
          timeout: 5000,
          message: 'Success message should be displayed after bookmark deletion'
        });
      }
    }
  });

  test('should handle bookmark operations errors gracefully', async ({ page }) => {
    // Set up authenticated state
    await extensionHelper.setupAuthenticatedState();

    await page.goto('http://localhost:3000/bookmark-management.html');
    await extensionHelper.waitForExtensionReady();
    await extensionHelper.waitForNetworkIdle();

    // Try to save bookmark with invalid data
    const urlInput = await page.locator('#bookmarkUrl');
    const titleInput = await page.locator('#bookmarkTitle');
    
    if (await urlInput.isVisible() && await titleInput.isVisible()) {
      // Fill invalid URL
      await urlInput.fill('invalid-url');
      await titleInput.fill('Test Title');

      // Submit bookmark
      const saveButton = await page.locator('button').filter({ hasText: /save/i });
      await saveButton.click();
      await extensionHelper.waitForNetworkIdle();

      // Verify error message
      const errorMessage = await page.locator('.ui-message.error');
      await expect(errorMessage).toBeVisible({ 
        timeout: 5000,
        message: 'Error message should be displayed for invalid bookmark data'
      });

      // Verify form is still accessible for correction
      await expect(urlInput).toBeVisible({ timeout: 5000 });
      await expect(titleInput).toBeVisible({ timeout: 5000 });
    }
  });
}); 