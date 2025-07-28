/**
 * @fileoverview Visual regression tests for bookmark manager UI
 */

import { test, expect } from '@playwright/test';

test.describe('Bookmark Manager Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./src/ui/bookmark-manager.html');
    await page.waitForLoadState('networkidle');
    
    // Set consistent viewport for screenshots
    await page.setViewportSize({ width: 1400, height: 900 });
  });

  test('bookmark manager default empty state', async ({ page }) => {
    // Take screenshot of empty bookmark manager
    await expect(page).toHaveScreenshot('bookmark-manager-empty-state.png');
  });

  test('bookmark manager with sample bookmarks', async ({ page }) => {
    // Mock sample bookmarks
    await page.evaluate(() => {
      window.mockBookmarks = [
        {
          id: '1',
          title: 'Example Website',
          url: 'https://example.com',
          status: 'read',
          tags: ['web', 'example'],
          notes: 'This is a test bookmark',
          created_at: new Date('2024-01-15').toISOString(),
          updated_at: new Date('2024-01-15').toISOString()
        },
        {
          id: '2',
          title: 'Another Site',
          url: 'https://another.com',
          status: 'unread',
          tags: ['reference', 'tools'],
          notes: 'Useful reference site',
          created_at: new Date('2024-01-10').toISOString(),
          updated_at: new Date('2024-01-10').toISOString()
        },
        {
          id: '3',
          title: 'Learning Resource',
          url: 'https://learn.example.com',
          status: 'in-progress',
          tags: ['learning', 'tutorial'],
          notes: 'Great tutorial series',
          created_at: new Date('2024-01-05').toISOString(),
          updated_at: new Date('2024-01-12').toISOString()
        }
      ];
      window.mockStatusTypes = [
        { id: 'read', name: 'Read', color: '#22c55e' },
        { id: 'unread', name: 'Unread', color: '#ef4444' },
        { id: 'in-progress', name: 'In Progress', color: '#f59e0b' }
      ];
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for bookmarks to load
    const bookmarkList = page.locator('#bookmark-list');
    await expect(bookmarkList).toBeVisible();
    
    // Take screenshot with bookmarks
    await expect(page).toHaveScreenshot('bookmark-manager-with-bookmarks.png');
  });

  test('bookmark manager search and filters', async ({ page }) => {
    // Mock bookmarks first
    await page.evaluate(() => {
      window.mockBookmarks = [
        { id: '1', title: 'JavaScript Tutorial', url: 'https://js.example.com', status: 'read', tags: ['javascript', 'tutorial'] },
        { id: '2', title: 'CSS Guide', url: 'https://css.example.com', status: 'unread', tags: ['css', 'guide'] },
        { id: '3', title: 'React Documentation', url: 'https://react.example.com', status: 'in-progress', tags: ['react', 'docs'] }
      ];
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Use search
    await page.fill('#search-input', 'JavaScript');
    
    // Set status filter
    await page.selectOption('#status-filter', 'read');
    
    // Set tag filter
    await page.fill('#tag-filter', 'tutorial');
    
    // Take screenshot with filters applied
    await expect(page).toHaveScreenshot('bookmark-manager-filtered.png');
  });

  test('bookmark manager list view', async ({ page }) => {
    // Mock bookmarks
    await page.evaluate(() => {
      window.mockBookmarks = Array.from({ length: 8 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Bookmark ${i + 1}`,
        url: `https://example${i + 1}.com`,
        status: ['read', 'unread', 'in-progress'][i % 3],
        tags: [`tag${i + 1}`, 'common'],
        notes: `Notes for bookmark ${i + 1}`,
        created_at: new Date(2024, 0, i + 1).toISOString()
      }));
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Ensure list view is selected
    const listViewButton = page.locator('#view-list');
    await listViewButton.click();
    
    // Take screenshot of list view
    await expect(page).toHaveScreenshot('bookmark-manager-list-view.png');
  });

  test('bookmark manager grid view', async ({ page }) => {
    // Mock bookmarks
    await page.evaluate(() => {
      window.mockBookmarks = Array.from({ length: 8 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Bookmark ${i + 1}`,
        url: `https://example${i + 1}.com`,
        status: ['read', 'unread', 'in-progress'][i % 3],
        tags: [`tag${i + 1}`, 'common'],
        notes: `Notes for bookmark ${i + 1}`,
        created_at: new Date(2024, 0, i + 1).toISOString()
      }));
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Switch to grid view
    const gridViewButton = page.locator('#view-grid');
    await gridViewButton.click();
    
    // Take screenshot of grid view
    await expect(page).toHaveScreenshot('bookmark-manager-grid-view.png');
  });

  test('bookmark manager bulk selection mode', async ({ page }) => {
    // Mock bookmarks
    await page.evaluate(() => {
      window.mockBookmarks = Array.from({ length: 5 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Bookmark ${i + 1}`,
        url: `https://example${i + 1}.com`,
        status: 'unread',
        tags: ['test'],
        created_at: new Date().toISOString()
      }));
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Enable bulk selection
    const bulkSelectButton = page.locator('#bulk-select-toggle');
    await bulkSelectButton.click();
    
    // Select some bookmarks
    const checkboxes = page.locator('.bookmark-checkbox');
    await checkboxes.first().check();
    await checkboxes.nth(2).check();
    
    // Take screenshot of bulk selection mode
    await expect(page).toHaveScreenshot('bookmark-manager-bulk-selection.png');
  });

  test('bookmark manager edit bookmark modal', async ({ page }) => {
    // Mock bookmarks
    await page.evaluate(() => {
      window.mockBookmarks = [
        {
          id: '1',
          title: 'Example Website',
          url: 'https://example.com',
          status: 'read',
          tags: ['web', 'example'],
          notes: 'This is a test bookmark',
          created_at: new Date().toISOString()
        }
      ];
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Click edit button on first bookmark
    const editButton = page.locator('.edit-bookmark').first();
    await editButton.click();
    
    // Wait for modal to appear
    const modal = page.locator('#edit-bookmark-modal');
    await expect(modal).toBeVisible();
    
    // Take screenshot of edit modal
    await expect(page).toHaveScreenshot('bookmark-manager-edit-modal.png');
  });

  test('bookmark manager pagination', async ({ page }) => {
    // Mock many bookmarks to show pagination
    await page.evaluate(() => {
      window.mockBookmarks = Array.from({ length: 25 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Bookmark ${i + 1}`,
        url: `https://example${i + 1}.com`,
        status: 'unread',
        tags: ['test'],
        created_at: new Date().toISOString()
      }));
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for pagination to appear
    const pagination = page.locator('#pagination');
    await expect(pagination).toBeVisible();
    
    // Take screenshot with pagination
    await expect(page).toHaveScreenshot('bookmark-manager-pagination.png');
  });

  test('bookmark manager statistics panel', async ({ page }) => {
    // Mock bookmarks with various statuses
    await page.evaluate(() => {
      window.mockBookmarks = [
        ...Array.from({ length: 10 }, (_, i) => ({ id: `r${i}`, status: 'read', created_at: new Date().toISOString() })),
        ...Array.from({ length: 5 }, (_, i) => ({ id: `u${i}`, status: 'unread', created_at: new Date().toISOString() })),
        ...Array.from({ length: 3 }, (_, i) => ({ id: `p${i}`, status: 'in-progress', created_at: new Date().toISOString() }))
      ];
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for statistics to load
    const statsPanel = page.locator('#statistics-panel');
    await expect(statsPanel).toBeVisible();
    
    // Take screenshot of statistics
    await expect(page).toHaveScreenshot('bookmark-manager-statistics.png');
  });

  test('bookmark manager loading state', async ({ page }) => {
    // Mock slow loading
    await page.route('**/bookmarks', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
    
    await page.reload();
    
    // Wait for loading indicator
    const loadingIndicator = page.locator('.loading');
    await expect(loadingIndicator).toBeVisible();
    
    // Take screenshot of loading state
    await expect(page).toHaveScreenshot('bookmark-manager-loading.png');
  });

  test('bookmark manager error state', async ({ page }) => {
    // Simulate error message
    await page.evaluate(() => {
      const messageArea = document.getElementById('message-area');
      const errorMsg = document.createElement('div');
      errorMsg.className = 'message error';
      errorMsg.textContent = 'Failed to load bookmarks. Please check your connection.';
      messageArea.appendChild(errorMsg);
    });
    
    // Take screenshot with error
    await expect(page).toHaveScreenshot('bookmark-manager-error-state.png');
  });

  test('bookmark manager dark mode', async ({ page }) => {
    // Set dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    
    // Mock some bookmarks
    await page.evaluate(() => {
      window.mockBookmarks = [
        { id: '1', title: 'Dark Mode Test', url: 'https://example.com', status: 'read', tags: ['test'] }
      ];
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Take screenshot in dark mode
    await expect(page).toHaveScreenshot('bookmark-manager-dark-mode.png');
  });

  test('bookmark manager mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Mock bookmarks
    await page.evaluate(() => {
      window.mockBookmarks = [
        { id: '1', title: 'Mobile Test Bookmark', url: 'https://example.com', status: 'read', tags: ['mobile'] }
      ];
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of mobile view
    await expect(page).toHaveScreenshot('bookmark-manager-mobile.png');
  });
});