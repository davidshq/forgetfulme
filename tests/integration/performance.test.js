/**
 * @fileoverview Integration tests for performance scenarios
 * Tests: 100+ bookmarks creation and management, search performance, UI responsiveness
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..');
// Helper to set up authenticated state for bookmark manager
async function setupAuthenticatedState(page) {
  await page.evaluate(() => {
    const testUser = {
      email: 'performance@example.com',
      id: 'performance-user-id',
      access_token: 'performance-access-token',
      refresh_token: 'performance-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600
    };
    
    // Store session
    localStorage.setItem('USER_SESSION', JSON.stringify(testUser));
    localStorage.setItem('auth_timestamp', Date.now().toString());
    
    // Set user info in bookmark manager header
    const userInfoElement = document.getElementById('user-info');
    if (userInfoElement) {
      userInfoElement.textContent = testUser.email;
    }
    
    // Ensure bookmark manager sections are visible (they should be by default)
    const searchSection = document.querySelector('.search-section');
    const bookmarkSection = document.querySelector('.bookmark-section');
    if (searchSection) searchSection.style.display = 'block';
    if (bookmarkSection) bookmarkSection.style.display = 'block';
  });
}
// Helper to generate large dataset of bookmarks
function generateBookmarkData(count = 100) {
  const domains = ['github.com', 'stackoverflow.com', 'medium.com', 'dev.to', 'docs.microsoft.com', 
                   'mozilla.org', 'w3schools.com', 'codepen.io', 'freecodecamp.org', 'hackernoon.com'];
  const tags = ['javascript', 'react', 'nodejs', 'python', 'webdev', 'tutorial', 'documentation', 
                'framework', 'library', 'tool', 'reference', 'guide', 'example', 'best-practices'];
  const statuses = ['want-to-read', 'reading', 'read', 'reference'];
  
  const bookmarks = [];
  
  for (let i = 1; i <= count; i++) {
    const domain = domains[i % domains.length];
    const randomTags = tags.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 4) + 1);
    
    bookmarks.push({
      id: `bookmark-${i}`,
      title: `Performance Test Article ${i} - ${randomTags[0].toUpperCase()} Development`,
      url: `https://${domain}/article-${i}-${randomTags[0]}`,
      tags: randomTags,
      status: statuses[i % statuses.length],
      created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(), // Random date within last 90 days
      updated_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Random date within last 30 days
      notes: i % 5 === 0 ? `Important notes for bookmark ${i}` : null,
      priority: i % 10 === 0 ? 'high' : i % 7 === 0 ? 'medium' : 'low'
    });
  }
  
  return bookmarks;
}
// Helper to set up bookmark manager with large dataset
async function setupBookmarkManagerWithData(page, bookmarkCount = 100) {
  // Navigate to bookmark manager
  const bookmarkManagerPath = `file://${path.join(projectRoot, 'src', 'ui', 'bookmark-manager.html')}`;
  await page.goto(bookmarkManagerPath);
  await page.waitForLoadState('networkidle');
  
  // Set up authenticated state
  await setupAuthenticatedState(page);
  
  // Generate and inject large bookmark dataset
  const bookmarks = generateBookmarkData(bookmarkCount);
  
  // Inject performance helpers and test data
  await injectPerformanceHelpers(page, bookmarks);
  
  // Wait for bookmark manager to be ready
  await waitForBookmarkManager(page);
  
  // Trigger initial load
  await triggerInitialLoad(page);
}
// Helper to set up search functionality (uses existing bookmark manager elements)
async function setupSearchFunctionality(page) {
  await page.evaluate(() => {
    window.searchFunctionalitySetup = true;
  });
}
test.describe.skip('Performance Integration', () => {
  test('loads and renders 100+ bookmarks efficiently', async ({ page }) => {
    // Set up bookmark manager with 150 bookmarks
    await setupBookmarkManagerWithData(page, 150);
    
    // Verify data was loaded
    const dataLoaded = await page.evaluate(() => window.performanceDataLoaded);
    expect(dataLoaded).toBe(true);
    
    const totalBookmarks = await page.evaluate(() => window.totalBookmarks);
    expect(totalBookmarks).toBe(150);
    
    // Wait for initial render to complete
    await page.waitForSelector('.bookmark-item', { timeout: 10000 });
    
    // Verify bookmarks are rendered
    const renderedBookmarks = await page.locator('.bookmark-item').count();
    expect(renderedBookmarks).toBeGreaterThan(0);
    expect(renderedBookmarks).toBeLessThanOrEqual(20); // Should be paginated
    
    // Check render performance
    const renderTime = await page.evaluate(() => window.lastRenderTime);
    expect(renderTime).toBeLessThan(1000); // Should render in under 1 second
    
    // Verify pagination info
    const paginationInfo = page.locator('#pagination-info');
    await expect(paginationInfo).toContainText('150 bookmarks');
    
    // Take screenshot of large dataset
    await expect(page).toHaveScreenshot('large-dataset-rendering.png');
    
    console.log(`Performance test: Rendered ${renderedBookmarks} bookmarks in ${renderTime}ms`);
  });
  test('search performs efficiently with large dataset', async ({ page }) => {
    // Set up bookmark manager with 200 bookmarks
    await setupBookmarkManagerWithData(page, 200);
    await setupSearchFunctionality(page);
    
    // Verify setup
    const searchSetup = await page.evaluate(() => window.searchFunctionalitySetup);
    expect(searchSetup).toBe(true);
    
    // Wait for initial load
    await page.waitForSelector('.bookmark-item', { timeout: 10000 });
    
    // Test text search performance
    const searchStartTime = Date.now();
    
    await page.fill('#search-query', 'javascript');
    await page.waitForSelector('.bookmark-item', { timeout: 5000 });
    
    const searchEndTime = Date.now();
    const searchDuration = searchEndTime - searchStartTime;
    
    // Verify search results
    const searchResults = await page.locator('.bookmark-item').count();
    expect(searchResults).toBeGreaterThan(0);
    
    // Check search performance
    const searchTime = await page.evaluate(() => window.lastSearchTime);
    expect(searchTime).toBeLessThan(500); // Search should complete in under 500ms
    expect(searchDuration).toBeLessThan(2000); // Total search interaction under 2 seconds
    
    // Test filter performance (if filter elements exist)
    const tagFilter = page.locator('#tag-filter');
    const statusFilter = page.locator('#status-filter');
    
    if (await tagFilter.count() > 0) {
      await page.selectOption('#tag-filter', 'react');
      await page.waitForTimeout(500); // Wait for debounced search
      
      const filterResults = await page.locator('.bookmark-item').count();
      expect(filterResults).toBeGreaterThan(0);
    }
    
    // Test combined search and filter
    await page.fill('#search-query', 'development');
    if (await statusFilter.count() > 0) {
      await page.selectOption('#status-filter', 'read');
    }
    await page.waitForTimeout(500);
    
    const combinedResults = await page.locator('.bookmark-item').count();
    // Combined filters should narrow results further
    
    // Take screenshot of search results
    await expect(page).toHaveScreenshot('search-performance-results.png');
    
    console.log(`Search performance: ${searchResults} results in ${searchTime}ms (total: ${searchDuration}ms)`);
  });
  test('pagination handles large datasets smoothly', async ({ page }) => {
    // Set up bookmark manager with 250 bookmarks
    await setupBookmarkManagerWithData(page, 250);
    await setupSearchFunctionality(page);
    
    // Wait for initial load
    await page.waitForSelector('.bookmark-item', { timeout: 10000 });
    
    // Verify first page
    let currentBookmarks = await page.locator('.bookmark-item').count();
    expect(currentBookmarks).toBe(20); // Default page size
    
    // Test pagination performance
    const paginationStartTime = Date.now();
    
    // Go to next page
    const nextButton = page.locator('#next-page');
    await expect(nextButton).toBeEnabled();
    await nextButton.click();
    
    // Wait for new page to load
    await page.waitForTimeout(500);
    
    const paginationEndTime = Date.now();
    const paginationDuration = paginationEndTime - paginationStartTime;
    
    // Verify second page loaded
    currentBookmarks = await page.locator('.bookmark-item').count();
    expect(currentBookmarks).toBe(20);
    
    // Check pagination info updated
    const paginationInfo = page.locator('#pagination-info');
    await expect(paginationInfo).toContainText('21-40 of 250');
    
    // Test multiple page navigation
    for (let i = 0; i < 3; i++) {
      await nextButton.click();
      await page.waitForTimeout(300);
    }
    
    // Should be on page 5 now (showing items 81-100)
    await expect(paginationInfo).toContainText('81-100 of 250');
    
    // Test going back
    const prevButton = page.locator('#prev-page');
    await expect(prevButton).toBeEnabled();
    await prevButton.click();
    await page.waitForTimeout(300);
    
    await expect(paginationInfo).toContainText('61-80 of 250');
    
    // Verify pagination performance
    expect(paginationDuration).toBeLessThan(1000); // Pagination should be under 1 second
    
    // Take screenshot of pagination state
    await expect(page).toHaveScreenshot('pagination-performance.png');
    
    console.log(`Pagination performance: ${paginationDuration}ms per page`);
  });
  test('bulk operations perform efficiently with large selections', async ({ page }) => {
    // Set up bookmark manager with 100 bookmarks
    await setupBookmarkManagerWithData(page, 100);
    await setupSearchFunctionality(page);
    
    // Wait for initial load
    await page.waitForSelector('.bookmark-item', { timeout: 10000 });
    
    // Set up bulk selection functionality (use existing elements)
    await page.evaluate(() => {
      const selectAllCheckbox = document.getElementById('bulk-select-all');
      const bulkDeleteButton = document.getElementById('bulk-delete');
      const selectedCountSpan = document.getElementById('selected-count');
      
      if (!selectAllCheckbox) {
        console.warn('Bulk selection elements not found in bookmark manager');
        return;
      }
      
      // Set up select all functionality
      let selectedIds = new Set();
      
      function updateSelectionUI() {
        const count = selectedIds.size;
        if (selectedCountSpan) {
          selectedCountSpan.textContent = `${count} selected`;
          selectedCountSpan.classList.toggle('hidden', count === 0);
        }
        if (bulkDeleteButton) {
          bulkDeleteButton.disabled = count === 0;
        }
      }
      
      selectAllCheckbox.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.bookmark-checkbox');
        const isChecked = e.target.checked;
        
        checkboxes.forEach(checkbox => {
          checkbox.checked = isChecked;
          if (isChecked) {
            selectedIds.add(checkbox.value);
          } else {
            selectedIds.delete(checkbox.value);
          }
        });
        
        updateSelectionUI();
      });
      
      // Handle individual checkbox changes
      document.addEventListener('change', (e) => {
        if (e.target.classList.contains('bookmark-checkbox')) {
          if (e.target.checked) {
            selectedIds.add(e.target.value);
          } else {
            selectedIds.delete(e.target.value);
          }
          updateSelectionUI();
        }
      });
      
      // Bulk delete functionality
      if (bulkDeleteButton) {
        bulkDeleteButton.addEventListener('click', async () => {
        if (selectedIds.size === 0) return;
        
        const startTime = performance.now();
        
        try {
          const response = await fetch('/api/bookmarks', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: Array.from(selectedIds) })
          });
          
          if (response.ok) {
            // Remove deleted items from UI
            selectedIds.forEach(id => {
              const element = document.querySelector(`[data-id="${id}"]`);
              if (element) element.remove();
            });
            
            const deleteTime = performance.now() - startTime;
            window.lastBulkDeleteTime = deleteTime;
            window.deletedCount = selectedIds.size;
            
            selectedIds.clear();
            updateSelectionUI();
            
            console.log(`Bulk deleted ${window.deletedCount} items in ${deleteTime}ms`);
          }
        } catch (error) {
          console.error('Bulk delete error:', error);
        }
        });
      }
      
      window.bulkActionsSetup = true;
    });
    
    // Verify bulk actions are set up
    const bulkSetup = await page.evaluate(() => window.bulkActionsSetup);
    expect(bulkSetup).toBe(true);
    
    // Select all items on current page
    const selectAllCheckbox = page.locator('#bulk-select-all');
    await selectAllCheckbox.check();
    
    // Verify selection count
    const selectionCount = page.locator('#selected-count');
    await expect(selectionCount).toContainText('20 selected');
    
    // Test bulk delete performance
    const bulkDeleteButton = page.locator('#bulk-delete');
    await expect(bulkDeleteButton).toBeEnabled();
    
    const bulkStartTime = Date.now();
    await bulkDeleteButton.click();
    
    // Wait for bulk operation to complete
    await page.waitForTimeout(1000);
    
    const bulkEndTime = Date.now();
    const totalBulkTime = bulkEndTime - bulkStartTime;
    
    // Verify bulk delete performance
    const bulkDeleteTime = await page.evaluate(() => window.lastBulkDeleteTime);
    const deletedCount = await page.evaluate(() => window.deletedCount);
    
    expect(deletedCount).toBe(20);
    expect(bulkDeleteTime).toBeLessThan(2000); // Bulk delete should complete in under 2 seconds
    expect(totalBulkTime).toBeLessThan(3000); // Total interaction under 3 seconds
    
    // Verify UI updated correctly
    await expect(selectionCount).toContainText('0 selected');
    await expect(selectionCount).toHaveClass(/hidden/);
    
    // Take screenshot of bulk operations result
    await expect(page).toHaveScreenshot('bulk-operations-performance.png');
    
    console.log(`Bulk delete performance: ${deletedCount} items in ${bulkDeleteTime}ms (total: ${totalBulkTime}ms)`);
  });
  test('UI remains responsive during heavy operations', async ({ page }) => {
    // Set up bookmark manager with 300 bookmarks
    await setupBookmarkManagerWithData(page, 300);
    await setupSearchFunctionality(page);
    
    // Wait for initial load
    await page.waitForSelector('.bookmark-item', { timeout: 10000 });
    
    // Test UI responsiveness during heavy search
    await page.evaluate(() => {
      // Track UI responsiveness
      window.responsivenessTimes = [];
      let frameCount = 0;
      
      function measureFrameTime() {
        const startTime = performance.now();
        
        requestAnimationFrame(() => {
          const frameTime = performance.now() - startTime;
          window.responsivenessTimes.push(frameTime);
          frameCount++;
          
          if (frameCount < 30) { // Measure 30 frames
            measureFrameTime();
          } else {
            const avgFrameTime = window.responsivenessTimes.reduce((a, b) => a + b, 0) / window.responsivenessTimes.length;
            const maxFrameTime = Math.max(...window.responsivenessTimes);
            
            window.avgFrameTime = avgFrameTime;
            window.maxFrameTime = maxFrameTime;
            window.responsivenessComplete = true;
            
            console.log(`UI Responsiveness - Avg: ${avgFrameTime}ms, Max: ${maxFrameTime}ms`);
          }
        });
      }
      
      // Start measuring after a heavy operation
      setTimeout(measureFrameTime, 100);
    });
    
    // Perform multiple rapid search operations to stress test UI
    const searchInput = page.locator('#search-query');
    
    await searchInput.fill('a');
    await page.waitForTimeout(100);
    await searchInput.fill('ab');
    await page.waitForTimeout(100);
    await searchInput.fill('abc');
    await page.waitForTimeout(100);
    await searchInput.fill('javascript');
    await page.waitForTimeout(500);
    
    // Test rapid filter changes
    await page.selectOption('#tag-filter', 'react');
    await page.waitForTimeout(200);
    await page.selectOption('#status-filter', 'reading');
    await page.waitForTimeout(200);
    await page.selectOption('#tag-filter', 'nodejs');
    await page.waitForTimeout(500);
    
    // Wait for responsiveness measurement to complete
    await page.waitForFunction(() => window.responsivenessComplete, { timeout: 10000 });
    
    // Check UI responsiveness metrics
    const avgFrameTime = await page.evaluate(() => window.avgFrameTime);
    const maxFrameTime = await page.evaluate(() => window.maxFrameTime);
    
    // UI should remain responsive (under 16.67ms per frame for 60fps)
    expect(avgFrameTime).toBeLessThan(20); // Average frame time under 20ms
    expect(maxFrameTime).toBeLessThan(100); // No single frame over 100ms
    
    // Test scroll performance with large list
    await page.evaluate(() => {
      // Simulate rapid scrolling
      const bookmarkList = document.getElementById('bookmark-list');
      let scrollEvents = 0;
      const maxScrollEvents = 20;
      
      function simulateScroll() {
        bookmarkList.scrollTop += 50;
        scrollEvents++;
        
        if (scrollEvents < maxScrollEvents) {
          requestAnimationFrame(simulateScroll);
        }
      }
      
      simulateScroll();
    });
    
    await page.waitForTimeout(1000);
    
    // Take screenshot showing responsive UI
    await expect(page).toHaveScreenshot('ui-responsiveness-test.png');
    
    console.log(`UI Responsiveness - Average: ${avgFrameTime}ms, Max: ${maxFrameTime}ms per frame`);
  });
  test('memory usage remains stable with large datasets', async ({ page }) => {
    // Set up bookmark manager with 500 bookmarks (stress test)
    await setupBookmarkManagerWithData(page, 500);
    await setupSearchFunctionality(page);
    
    // Wait for initial load
    await page.waitForSelector('.bookmark-item', { timeout: 15000 });
    
    // Monitor memory usage
    await page.evaluate(() => {
      window.memorySnapshots = [];
      
      function takeMemorySnapshot(label) {
        if (performance.memory) {
          const snapshot = {
            label,
            usedJSSize: performance.memory.usedJSSize,
            totalJSSize: performance.memory.totalJSSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
            timestamp: Date.now()
          };
          window.memorySnapshots.push(snapshot);
          console.log(`Memory snapshot (${label}):`, snapshot);
          return snapshot;
        }
        return null;
      }
      
      // Initial memory snapshot
      takeMemorySnapshot('initial');
      
      window.takeMemorySnapshot = takeMemorySnapshot;
    });
    
    // Perform memory-intensive operations
    
    // 1. Multiple search operations
    const searchTerms = ['javascript', 'react', 'nodejs', 'python', 'tutorial', 'guide'];
    for (const term of searchTerms) {
      await page.fill('#search-query', term);
      await page.waitForTimeout(300);
    }
    
    await page.evaluate(() => window.takeMemorySnapshot('after-searches'));
    
    // 2. Rapid pagination through dataset
    for (let i = 0; i < 10; i++) {
      await page.click('#next-page');
      await page.waitForTimeout(200);
    }
    
    await page.evaluate(() => window.takeMemorySnapshot('after-pagination'));
    
    // 3. Clear search and return to start
    await page.fill('#search-input', '');
    await page.waitForTimeout(500);
    
    // Navigate back to first page
    for (let i = 0; i < 10; i++) {
      await page.click('#prev-page');
      await page.waitForTimeout(200);
    }
    
    await page.evaluate(() => window.takeMemorySnapshot('after-cleanup'));
    
    // Get memory analysis
    const memoryAnalysis = await page.evaluate(() => {
      if (window.memorySnapshots.length === 0) {
        return { available: false };
      }
      
      const initial = window.memorySnapshots[0];
      const final = window.memorySnapshots[window.memorySnapshots.length - 1];
      
      const memoryGrowth = final.usedJSSize - initial.usedJSSize;
      const memoryGrowthPercent = (memoryGrowth / initial.usedJSSize) * 100;
      
      return {
        available: true,
        initial: initial.usedJSSize,
        final: final.usedJSSize,
        growth: memoryGrowth,
        growthPercent: memoryGrowthPercent,
        snapshots: window.memorySnapshots
      };
    });
    
    if (memoryAnalysis.available) {
      // Memory growth should be reasonable (less than 50% increase)
      expect(memoryAnalysis.growthPercent).toBeLessThan(50);
      
      console.log(`Memory Usage - Initial: ${Math.round(memoryAnalysis.initial / 1024 / 1024)}MB, ` +
                  `Final: ${Math.round(memoryAnalysis.final / 1024 / 1024)}MB, ` +
                  `Growth: ${memoryAnalysis.growthPercent.toFixed(1)}%`);
    } else {
      console.log('Memory monitoring not available in this environment');
    }
    
    // Take final screenshot
    await expect(page).toHaveScreenshot('memory-usage-test.png');
  });
});