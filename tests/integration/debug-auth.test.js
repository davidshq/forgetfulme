import { test, expect } from '@playwright/test';

test.describe('Debug Authentication Interface Tests', () => {
  test('should see what is rendered when configured but not authenticated', async ({ page }) => {
    // Mock Chrome API with configured but not authenticated state
    await page.addInitScript(() => {
      // Mock Chrome API
      if (typeof chrome === 'undefined') {
        window.chrome = {};
      }

      if (!chrome.storage) {
        chrome.storage = {
          sync: {
            get: (keys, callback) => {
              // Mock storage data - configured but not authenticated
              const mockData = {
                auth_session: null,
                supabase_url: 'https://test.supabase.co',
                supabase_anon_key: 'test-key',
              };
              callback(mockData);
            },
            set: (data, callback) => {
              if (callback) callback();
            },
          },
          local: {
            get: (keys, callback) => {
              callback({});
            },
            set: (data, callback) => {
              if (callback) callback();
            },
          },
        };
      }

      // Mock chrome.runtime API
      if (!chrome.runtime) {
        chrome.runtime = {
          onMessage: {
            addListener: () => {},
          },
          sendMessage: (message, callback) => {
            if (callback) callback({ success: true });
          },
          openOptionsPage: () => {
            window.optionsPageOpened = true;
          },
        };
      }

      // Mock chrome.tabs API
      if (!chrome.tabs) {
        chrome.tabs = {
          query: (queryInfo, callback) => {
            callback([
              {
                url: 'https://example.com',
                title: 'Test Page',
              },
            ]);
          },
          create: (options) => {
            window.tabCreated = options;
          },
        };
      }
    });

    // Navigate to bookmark-management.html
    await page.goto('http://localhost:3000/bookmark-management.html');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for JavaScript to execute
    await page.waitForTimeout(3000);
    
    // Get the page content
    const pageContent = await page.content();
    console.log('Full page content:', pageContent);
    
    // Check what elements are actually present
    const appContainer = await page.locator('#app');
    const appHTML = await appContainer.innerHTML();
    console.log('App container HTML:', appHTML);
    
    // Check for different possible interfaces
    const setupContainer = await page.locator('.setup-container');
    const authContainer = await page.locator('.auth-container');
    const breadcrumb = await page.locator('.page-breadcrumb');
    const searchCard = await page.locator('.search-card');
    
    console.log('Setup container exists:', await setupContainer.count());
    console.log('Auth container exists:', await authContainer.count());
    console.log('Breadcrumb exists:', await breadcrumb.count());
    console.log('Search card exists:', await searchCard.count());
    
    // Check for any console errors
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
      console.log('Console:', msg.text());
    });
    
    // Wait a bit more to capture console messages
    await page.waitForTimeout(2000);
    
    console.log('All console logs:', consoleLogs);
  });
}); 