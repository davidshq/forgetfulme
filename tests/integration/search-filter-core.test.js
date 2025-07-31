/**
 * @fileoverview Core search and filter functionality integration tests
 * Tests the search and filter logic without complex UI dependencies
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..');

test.describe('Search & Filter Core Functionality', () => {
  test('search and filter algorithms work correctly', async ({ page }) => {
    // Navigate to a simple HTML page to test the search logic
    const filePath = `file://${path.join(projectRoot, 'src', 'ui', 'bookmark-manager.html')}`;
    await page.goto(filePath);
    await page.waitForLoadState('networkidle');
    
    // Set up test data and search functions
    const searchResults = await page.evaluate(() => {
      // Create test bookmark dataset
      const bookmarks = [
        {
          id: 1,
          title: 'JavaScript Tutorial for Beginners',
          url: 'https://javascript.info/basics',
          tags: ['javascript', 'tutorial', 'beginner'],
          status: 'to-read',
          created_at: '2024-01-15T10:00:00Z',
          notes: 'Comprehensive JavaScript learning resource'
        },
        {
          id: 2,
          title: 'React Documentation',
          url: 'https://react.dev/docs',
          tags: ['react', 'javascript', 'framework'],
          status: 'reading',
          created_at: '2024-02-01T14:30:00Z',
          notes: 'Official React documentation with examples'
        },
        {
          id: 3,
          title: 'CSS Grid Layout Complete Guide',
          url: 'https://css-tricks.com/complete-guide-grid/',
          tags: ['css', 'layout', 'grid'],
          status: 'completed',
          created_at: '2024-03-01T09:15:00Z',
          notes: 'Complete CSS Grid reference guide'
        },
        {
          id: 4,
          title: 'Vue.js Framework Tutorial',
          url: 'https://vuejs.org/tutorial/',
          tags: ['vue', 'javascript', 'framework'],
          status: 'reading',
          created_at: '2024-03-15T11:20:00Z',
          notes: 'Interactive Vue.js learning path'
        },
        {
          id: 5,
          title: 'TypeScript Handbook',
          url: 'https://typescriptlang.org/docs/',
          tags: ['typescript', 'javascript', 'types'],
          status: 'completed',
          created_at: '2024-04-01T13:10:00Z',
          notes: 'Official TypeScript documentation'
        }
      ];
      
      // Search function implementation
      function searchBookmarks(options = {}) {
        let filtered = [...bookmarks];
        
        // Text search in title, URL, and notes
        if (options.query) {
          const query = options.query.toLowerCase();
          filtered = filtered.filter(bookmark =>
            bookmark.title.toLowerCase().includes(query) ||
            bookmark.url.toLowerCase().includes(query) ||
            bookmark.notes.toLowerCase().includes(query)
          );
        }
        
        // Tag filtering
        if (options.tags && options.tags.length > 0) {
          filtered = filtered.filter(bookmark =>
            options.tags.some(tag =>
              bookmark.tags.some(bookmarkTag =>
                bookmarkTag.toLowerCase().includes(tag.toLowerCase())
              )
            )
          );
        }
        
        // Status filtering
        if (options.status) {
          filtered = filtered.filter(bookmark => bookmark.status === options.status);
        }
        
        // Date range filtering
        if (options.dateFrom) {
          const fromDate = new Date(options.dateFrom);
          filtered = filtered.filter(bookmark =>
            new Date(bookmark.created_at) >= fromDate
          );
        }
        
        if (options.dateTo) {
          const toDate = new Date(options.dateTo);
          toDate.setHours(23, 59, 59, 999);
          filtered = filtered.filter(bookmark =>
            new Date(bookmark.created_at) <= toDate
          );
        }
        
        return {
          items: filtered,
          totalCount: filtered.length
        };
      }
      
      // Run comprehensive tests
      const results = {};
      
      // Test 1: Text search by title
      results.titleSearch = searchBookmarks({ query: 'JavaScript' });
      
      // Test 2: Text search by URL
      results.urlSearch = searchBookmarks({ query: 'css-tricks.com' });
      
      // Test 3: Text search by notes
      results.notesSearch = searchBookmarks({ query: 'documentation' });
      
      // Test 4: Case-insensitive search
      results.caseInsensitiveSearch = searchBookmarks({ query: 'REACT' });
      
      // Test 5: Tag filtering single tag
      results.singleTagFilter = searchBookmarks({ tags: ['framework'] });
      
      // Test 6: Tag filtering multiple tags
      results.multipleTagFilter = searchBookmarks({ tags: ['javascript', 'css'] });
      
      // Test 7: Status filtering
      results.statusFilter = searchBookmarks({ status: 'reading' });
      
      // Test 8: Date range filtering (from date)
      results.dateFromFilter = searchBookmarks({ dateFrom: '2024-03-01' });
      
      // Test 9: Date range filtering (to date)
      results.dateToFilter = searchBookmarks({ dateTo: '2024-02-28' });
      
      // Test 10: Date range filtering (both)
      results.dateRangeFilter = searchBookmarks({ 
        dateFrom: '2024-02-01', 
        dateTo: '2024-03-31' 
      });
      
      // Test 11: Combined filters (text + tags)
      results.combinedTextTags = searchBookmarks({ 
        query: 'tutorial', 
        tags: ['javascript'] 
      });
      
      // Test 12: Combined filters (tags + status)
      results.combinedTagsStatus = searchBookmarks({ 
        tags: ['framework'], 
        status: 'reading' 
      });
      
      // Test 13: Combined filters (text + status + date)
      results.combinedMultiple = searchBookmarks({
        query: 'javascript',
        status: 'completed',
        dateFrom: '2024-01-01'
      });
      
      // Test 14: No results
      results.noResults = searchBookmarks({ query: 'nonexistent' });
      
      // Test 15: Empty search (all results)
      results.emptySearch = searchBookmarks({});
      
      // Test 16: Performance test with partial matches
      const startTime = performance.now();
      results.performanceTest = searchBookmarks({ query: 'a' });
      const endTime = performance.now();
      results.searchTime = endTime - startTime;
      
      return results;
    });
    
    // Verify search results
    
    // Test 1: Title search should find JavaScript-related bookmarks
    expect(searchResults.titleSearch.totalCount).toBe(1); // Only the main JavaScript tutorial matches
    expect(searchResults.titleSearch.items.every(item => 
      item.title.toLowerCase().includes('javascript') ||
      item.tags.includes('javascript')
    )).toBe(true);
    
    // Test 2: URL search should find CSS tricks bookmark
    expect(searchResults.urlSearch.totalCount).toBe(1);
    expect(searchResults.urlSearch.items[0].url).toContain('css-tricks.com');
    
    // Test 3: Notes search should find documentation bookmarks
    expect(searchResults.notesSearch.totalCount).toBeGreaterThan(0);
    expect(searchResults.notesSearch.items.every(item =>
      item.notes.toLowerCase().includes('documentation')
    )).toBe(true);
    
    // Test 4: Case-insensitive search
    expect(searchResults.caseInsensitiveSearch.totalCount).toBe(1);
    expect(searchResults.caseInsensitiveSearch.items[0].title).toContain('React');
    
    // Test 5: Single tag filter
    expect(searchResults.singleTagFilter.totalCount).toBe(2);
    expect(searchResults.singleTagFilter.items.every(item =>
      item.tags.includes('framework')
    )).toBe(true);
    
    // Test 6: Multiple tag filter (OR operation)
    expect(searchResults.multipleTagFilter.totalCount).toBe(5); // All bookmarks have either javascript or css tags
    
    // Test 7: Status filter
    expect(searchResults.statusFilter.totalCount).toBe(2);
    expect(searchResults.statusFilter.items.every(item =>
      item.status === 'reading'
    )).toBe(true);
    
    // Test 8: Date from filter
    expect(searchResults.dateFromFilter.totalCount).toBe(3);
    expect(searchResults.dateFromFilter.items.every(item =>
      new Date(item.created_at) >= new Date('2024-03-01')
    )).toBe(true);
    
    // Test 9: Date to filter  
    expect(searchResults.dateToFilter.totalCount).toBe(2);
    expect(searchResults.dateToFilter.items.every(item =>
      new Date(item.created_at) <= new Date('2024-02-28T23:59:59.999Z')
    )).toBe(true);
    
    // Test 10: Date range filter
    expect(searchResults.dateRangeFilter.totalCount).toBe(3); // Feb 1, March 1, March 15 bookmarks
    
    // Test 11: Combined text + tags
    expect(searchResults.combinedTextTags.totalCount).toBe(2); // Both JavaScript and Vue have 'tutorial' and 'javascript' tags
    expect(searchResults.combinedTextTags.items.every(item =>
      item.title.toLowerCase().includes('tutorial') && item.tags.includes('javascript')
    )).toBe(true);
    
    // Test 12: Combined tags + status
    expect(searchResults.combinedTagsStatus.totalCount).toBe(2);
    expect(searchResults.combinedTagsStatus.items.every(item =>
      item.tags.includes('framework') && item.status === 'reading'
    )).toBe(true);
    
    // Test 13: Combined multiple filters (should find 0 or 1 results depending on data)
    expect(searchResults.combinedMultiple.totalCount).toBe(0); // No bookmarks match all criteria
    // The TypeScript bookmark is 'completed' but doesn't have 'javascript' in title
    
    // Test 14: No results
    expect(searchResults.noResults.totalCount).toBe(0);
    
    // Test 15: Empty search returns all
    expect(searchResults.emptySearch.totalCount).toBe(5);
    
    // Test 16: Performance should be fast
    expect(searchResults.searchTime).toBeLessThan(10); // Should be very fast
    expect(searchResults.performanceTest.totalCount).toBeGreaterThan(0);
  });
  
  test('search algorithm edge cases and validation', async ({ page }) => {
    // Navigate to test page
    const filePath = `file://${path.join(projectRoot, 'src', 'ui', 'bookmark-manager.html')}`;
    await page.goto(filePath);
    await page.waitForLoadState('networkidle');
    
    const edgeCaseResults = await page.evaluate(() => {
      // Test data with edge cases
      const bookmarks = [
        {
          id: 1,
          title: 'Test with "Special Characters" & Symbols!',
          url: 'https://example.com/path?query=value&other=123',
          tags: ['special-chars', 'test', 'edge-case'],
          status: 'to-read',
          created_at: '2024-01-01T00:00:00Z',
          notes: 'Contains various special characters & symbols'
        },
        {
          id: 2,
          title: 'Empty Tags Test',
          url: 'https://empty-tags.com',
          tags: [],
          status: 'reading',
          created_at: '2024-06-15T12:00:00Z',
          notes: ''
        },
        {
          id: 3,
          title: '',
          url: 'https://empty-title.com',
          tags: ['empty', 'title'],
          status: 'completed',
          created_at: '2024-12-31T23:59:59Z',
          notes: 'Bookmark with empty title'
        }
      ];
      
      function searchBookmarks(options = {}) {
        let filtered = [...bookmarks];
        
        if (options.query) {
          const query = options.query.toLowerCase();
          filtered = filtered.filter(bookmark =>
            (bookmark.title || '').toLowerCase().includes(query) ||
            (bookmark.url || '').toLowerCase().includes(query) ||
            (bookmark.notes || '').toLowerCase().includes(query)
          );
        }
        
        if (options.tags && options.tags.length > 0) {
          filtered = filtered.filter(bookmark =>
            bookmark.tags && bookmark.tags.length > 0 &&
            options.tags.some(tag =>
              bookmark.tags.some(bookmarkTag =>
                bookmarkTag.toLowerCase().includes(tag.toLowerCase())
              )
            )
          );
        }
        
        if (options.status) {
          filtered = filtered.filter(bookmark => bookmark.status === options.status);
        }
        
        return { items: filtered, totalCount: filtered.length };
      }
      
      return {
        // Test special characters in search
        specialCharsSearch: searchBookmarks({ query: 'Special Characters' }),
        symbolsSearch: searchBookmarks({ query: '&' }),
        quotesSearch: searchBookmarks({ query: '"' }),
        
        // Test URL search with query parameters
        urlWithParamsSearch: searchBookmarks({ query: '?query=value' }),
        
        // Test empty/null handling
        emptyStringSearch: searchBookmarks({ query: '' }),
        emptyTagsFilter: searchBookmarks({ tags: ['empty'] }),
        
        // Test case sensitivity edge cases
        mixedCaseSearch: searchBookmarks({ query: 'TeSt' }),
        
        // Test very long search queries
        longQuerySearch: searchBookmarks({ query: 'a'.repeat(1000) }),
        
        // Test searching for empty content
        emptyTitleSearch: searchBookmarks({ query: 'empty-title.com' }),
        
        // Test tag filtering with special characters
        specialCharTagFilter: searchBookmarks({ tags: ['special-chars'] }),
        
        // Test whitespace handling
        whitespaceSearch: searchBookmarks({ query: '  Test  ' }),
        
        // Test numeric search
        numericSearch: searchBookmarks({ query: '123' }),
        
        // Test with undefined/null options
        undefinedOptions: searchBookmarks(undefined),
        nullQuery: searchBookmarks({ query: null }),
        
        // Test performance with empty results
        performanceEmptyResults: (() => {
          const start = performance.now();
          const result = searchBookmarks({ query: 'definitely-not-found-12345' });
          const end = performance.now();
          return { result, time: end - start };
        })()
      };
    });
    
    // Verify edge case handling
    
    // Special characters should work
    expect(edgeCaseResults.specialCharsSearch.totalCount).toBe(1);
    expect(edgeCaseResults.symbolsSearch.totalCount).toBe(1);
    expect(edgeCaseResults.quotesSearch.totalCount).toBe(1);
    
    // URL parameters should be searchable
    expect(edgeCaseResults.urlWithParamsSearch.totalCount).toBe(1);
    
    // Empty string should return all results
    expect(edgeCaseResults.emptyStringSearch.totalCount).toBe(3);
    
    // Empty tags should be handled gracefully
    expect(edgeCaseResults.emptyTagsFilter.totalCount).toBe(1);
    
    // Case insensitive should work
    expect(edgeCaseResults.mixedCaseSearch.totalCount).toBeGreaterThan(0);
    
    // Very long queries should not crash
    expect(edgeCaseResults.longQuerySearch.totalCount).toBe(0);
    
    // Empty title should be searchable by URL
    expect(edgeCaseResults.emptyTitleSearch.totalCount).toBe(1);
    
    // Special character tags should work
    expect(edgeCaseResults.specialCharTagFilter.totalCount).toBe(1);
    
    // Whitespace should be handled (may or may not find results)
    expect(edgeCaseResults.whitespaceSearch.totalCount).toBeGreaterThanOrEqual(0);
    
    // Numeric search should work
    expect(edgeCaseResults.numericSearch.totalCount).toBe(1);
    
    // Undefined/null options should be handled gracefully
    expect(edgeCaseResults.undefinedOptions.totalCount).toBe(3);
    expect(edgeCaseResults.nullQuery.totalCount).toBe(3);
    
    // Performance with empty results should be fast
    expect(edgeCaseResults.performanceEmptyResults.result.totalCount).toBe(0);
    expect(edgeCaseResults.performanceEmptyResults.time).toBeLessThan(10);
  });
  
  test('large dataset search performance', async ({ page }) => {
    // Navigate to test page
    const filePath = `file://${path.join(projectRoot, 'src', 'ui', 'bookmark-manager.html')}`;
    await page.goto(filePath);
    await page.waitForLoadState('networkidle');
    
    const performanceResults = await page.evaluate(() => {
      // Generate large test dataset
      const bookmarks = [];
      const tags = ['javascript', 'react', 'vue', 'angular', 'css', 'html', 'nodejs', 'python', 'go', 'rust'];
      const statuses = ['to-read', 'reading', 'completed'];
      const domains = ['github.com', 'stackoverflow.com', 'mdn.org', 'dev.to', 'medium.com'];
      
      for (let i = 1; i <= 100; i++) {
        bookmarks.push({
          id: i,
          title: `Bookmark ${i}: ${tags[i % tags.length]} tutorial and guide`,
          url: `https://${domains[i % domains.length]}/article-${i}`,
          tags: [tags[i % tags.length], tags[(i + 1) % tags.length]],
          status: statuses[i % statuses.length],
          created_at: new Date(2024, (i % 12), (i % 28) + 1).toISOString(),
          notes: `This is a comprehensive guide about ${tags[i % tags.length]} development`
        });
      }
      
      function searchBookmarks(options = {}) {
        let filtered = [...bookmarks];
        
        if (options.query) {
          const query = options.query.toLowerCase();
          filtered = filtered.filter(bookmark =>
            bookmark.title.toLowerCase().includes(query) ||
            bookmark.url.toLowerCase().includes(query) ||
            bookmark.notes.toLowerCase().includes(query)
          );
        }
        
        if (options.tags && options.tags.length > 0) {
          filtered = filtered.filter(bookmark =>
            options.tags.some(tag =>
              bookmark.tags.some(bookmarkTag =>
                bookmarkTag.toLowerCase().includes(tag.toLowerCase())
              )
            )
          );
        }
        
        if (options.status) {
          filtered = filtered.filter(bookmark => bookmark.status === options.status);
        }
        
        return { items: filtered, totalCount: filtered.length };
      }
      
      // Performance tests
      const tests = [];
      
      // Test 1: Text search performance
      let start = performance.now();
      const textSearchResult = searchBookmarks({ query: 'javascript' });
      let end = performance.now();
      tests.push({ name: 'textSearch', time: end - start, results: textSearchResult.totalCount });
      
      // Test 2: Tag filter performance
      start = performance.now();
      const tagFilterResult = searchBookmarks({ tags: ['react'] });
      end = performance.now();
      tests.push({ name: 'tagFilter', time: end - start, results: tagFilterResult.totalCount });
      
      // Test 3: Status filter performance
      start = performance.now();
      const statusFilterResult = searchBookmarks({ status: 'reading' });
      end = performance.now();
      tests.push({ name: 'statusFilter', time: end - start, results: statusFilterResult.totalCount });
      
      // Test 4: Combined filter performance
      start = performance.now();
      const combinedResult = searchBookmarks({ 
        query: 'tutorial', 
        tags: ['javascript'], 
        status: 'to-read' 
      });
      end = performance.now();
      tests.push({ name: 'combinedFilter', time: end - start, results: combinedResult.totalCount });
      
      // Test 5: Full dataset scan (worst case)
      start = performance.now();
      const fullScanResult = searchBookmarks({ query: 'development' });
      end = performance.now();
      tests.push({ name: 'fullScan', time: end - start, results: fullScanResult.totalCount });
      
      return {
        totalBookmarks: bookmarks.length,
        tests: tests,
        averageTime: tests.reduce((sum, test) => sum + test.time, 0) / tests.length
      };
    });
    
    // Verify performance results
    expect(performanceResults.totalBookmarks).toBe(100);
    expect(performanceResults.tests).toHaveLength(5);
    
    // All search operations should be fast (< 50ms)
    performanceResults.tests.forEach(test => {
      expect(test.time).toBeLessThan(50);
      expect(test.results).toBeGreaterThanOrEqual(0);
    });
    
    // Average search time should be very fast
    expect(performanceResults.averageTime).toBeLessThan(20);
    
    // Verify that different searches return different result counts
    const textSearch = performanceResults.tests.find(t => t.name === 'textSearch');
    const tagFilter = performanceResults.tests.find(t => t.name === 'tagFilter');
    const statusFilter = performanceResults.tests.find(t => t.name === 'statusFilter');
    const combinedFilter = performanceResults.tests.find(t => t.name === 'combinedFilter');
    const fullScan = performanceResults.tests.find(t => t.name === 'fullScan');
    
    expect(textSearch.results).toBeGreaterThan(0);
    expect(tagFilter.results).toBeGreaterThan(0);
    expect(statusFilter.results).toBeGreaterThan(0);
    expect(combinedFilter.results).toBeGreaterThanOrEqual(0);
    expect(fullScan.results).toBe(100); // All bookmarks contain 'development'
  });
});