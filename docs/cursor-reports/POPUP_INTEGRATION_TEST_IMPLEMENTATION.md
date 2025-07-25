# Popup Integration Test Implementation - Progress Report

## Overview

This document outlines the attempts to implement the missing integration tests for the ForgetfulMe Chrome extension popup interface, specifically focusing on testing the main interface when authenticated and configured.

## Current Status

**Problem**: The popup integration tests are failing because the Chrome API mocking isn't working correctly. The popup continues to show the setup interface instead of the main interface when authentication and configuration are mocked.

## What Has Been Tried

### 1. Initial Test Implementation ✅

**Attempt**: Created a test for "Main interface when authenticated and configured" in the existing `popup.test.js` file.

**Result**: Failed - popup showed setup interface instead of main interface.

**Root Cause**: The `beforeEach` hook in the existing test file calls `extensionHelper.mockChromeAPI()` which provides a default unauthenticated state, overriding any custom mocking.

### 2. Separate Test File Approach ✅

**Attempt**: Created a new test file `popup-authenticated.test.js` with custom Chrome API mocking in the `beforeEach` hook.

**Code Structure**:
```javascript
test.beforeEach(async ({ page, context }) => {
  extensionHelper = new ExtensionHelper(page, context);

  // Mock Chrome API with authenticated state before loading the page
  await page.addInitScript(() => {
    // Mock Chrome storage with authenticated session
    chrome.storage = {
      sync: {
        get: (keys, callback) => {
          const mockData = {
            auth_session: {
              user: { id: 'test-user-id', email: 'test@example.com' },
              access_token: 'test-token',
              refresh_token: 'test-refresh-token'
            },
            supabaseConfig: {
              url: 'https://test.supabase.co',
              anonKey: 'test-key'
            },
            customStatusTypes: ['read', 'good-reference', 'low-value', 'revisit-later']
          };
          callback(mockData);
        },
        // ... other mocked methods
      }
    };
  });

  await extensionHelper.openPopup();
  await extensionHelper.waitForExtensionReady();
});
```

**Result**: Still failed - popup showed setup interface.

**Debugging Output**:
```
Page content length: 1418
App container HTML: <div class="ui-container setup-container">
  <div class="ui-container-header">
    <h2>Welcome to ForgetfulMe!</h2>
    <p>This extension helps you mark websites as read for research purposes.</p>
  </div>
  <section class="section setup-section">
    <p>To use this extension, you need to configure your Supabase backend:</p>
    <ol>
      <li>Create a Supabase project at <a href="https://supabase.com" target="_blank">supabase.com</a></li>
      <li>Get your Project URL and anon public key</li>
      <li>Open the extension settings to configure</li>
    </ol>
    <button class="primary">Open Settings</button>
  </section>
  <!-- ... more setup content ... -->
</div>
```

### 3. Analysis of the Problem 🔍

**Key Findings**:

1. **Timing Issue**: The popup loads and initializes before the mocking script can take effect
2. **Storage Key Mismatch**: The popup expects `supabaseConfig` but the ConfigManager might be looking for different keys
3. **Authentication Flow**: The popup checks Supabase configuration first, then authentication state
4. **Initialization Order**: The popup's `initializeApp()` method runs before the mocked Chrome API is fully available

## Research from Web Sources

Based on the web search results, I found several relevant approaches:

### 1. Playwright Mock Browser APIs ([source](https://playwright.dev/docs/mock-browser-apis))

**Key Insight**: "Since the page may be calling the API very early while loading it's important to setup all the mocks before the page started loading."

**Recommended Approach**:
```javascript
await page.addInitScript(() => {
  // Mock APIs before page loads
  window.navigator.getBattery = async () => mockBattery;
});
```

### 2. Chrome Extension Testing with Puppeteer ([source](https://oliverdunk.com/2022/11/13/extensions-puppeteer-popup-testing))

**Key Insight**: Chrome extension popup testing requires special handling because popups are not regular web pages.

**Challenges Identified**:
- Popups run in a different context than regular pages
- Chrome extension APIs need to be mocked differently
- The popup initialization happens very early in the process

### 3. Session Storage in Playwright ([source](https://frontendrescue.com/posts/2023-07-28-session-storage-playwright))

**Key Insight**: For applications that use sessionStorage for authentication, Playwright provides specific patterns for persisting and rehydrating authentication state.

## Next Steps

### Phase 1: Fix Chrome API Mocking (High Priority)

1. **Investigate Storage Key Structure**
   - Check what keys the ConfigManager actually expects
   - Verify the `isSupabaseConfigured()` method implementation
   - Ensure the storage mocking matches the expected format

2. **Improve Mocking Timing**
   - Move mocking to happen before any page navigation
   - Use `context.addInitScript()` instead of `page.addInitScript()`
   - Ensure mocking happens at the browser context level

3. **Debug the Authentication Flow**
   - Add console logging to understand the initialization sequence
   - Check what the popup's `initializeApp()` method is actually receiving
   - Verify the auth state manager is working correctly

### Phase 2: Implement Proper Test Structure (Medium Priority)

1. **Create Authentication Test Fixtures**
   ```javascript
   // Based on Playwright patterns from web research
   const test = base.extend({
     authenticatedContext: async ({ context }, use) => {
       // Set up authenticated state
       await context.addInitScript(storage => {
         // Mock authenticated Chrome storage
       }, authenticatedStorage);
       use(context);
     },
   });
   ```

2. **Separate Test Projects**
   - Create setup tests that establish authentication
   - Use Playwright project dependencies to ensure setup runs first
   - Follow the pattern from the session storage research

### Phase 3: Implement Remaining Tests (Lower Priority)

Once the authentication mocking is working, implement the remaining missing tests:

1. **Mark as read functionality**
2. **Status selection dropdown**
3. **Tags input functionality**
4. **Recent entries display**
5. **Form submission and validation**
6. **Success/error message handling**
7. **Keyboard shortcuts (Ctrl+Shift+R)**

## Technical Recommendations

### 1. Use Context-Level Mocking

Based on the Playwright documentation, use `context.addInitScript()` instead of `page.addInitScript()`:

```javascript
await context.addInitScript(() => {
  // Mock Chrome APIs at context level
  if (typeof chrome === 'undefined') {
    window.chrome = {};
  }
  
  // Mock storage with proper structure
  chrome.storage = {
    sync: {
      get: (keys, callback) => {
        // Ensure this matches what the ConfigManager expects
        const mockData = {
          auth_session: { /* authenticated session */ },
          supabaseConfig: { /* supabase config */ },
          customStatusTypes: [/* status types */]
        };
        callback(mockData);
      }
    }
  };
});
```

### 2. Debug the Storage Structure

Add debugging to understand what the popup expects:

```javascript
// In the test, add debugging
await page.addInitScript(() => {
  // Override chrome.storage.sync.get to log what's being requested
  const originalGet = chrome.storage.sync.get;
  chrome.storage.sync.get = (keys, callback) => {
    console.log('Storage get requested for keys:', keys);
    // ... rest of mock implementation
  };
});
```

### 3. Use Playwright's Storage State

Consider using Playwright's built-in storage state management:

```javascript
// Save authenticated state
const storageState = await page.context().storageState();
fs.writeFileSync('playwright/.auth/auth.json', JSON.stringify(storageState));

// Use in tests
const context = await browser.newContext({
  storageState: 'playwright/.auth/auth.json'
});
```

## Conclusion

The main issue is that the Chrome API mocking isn't working correctly due to timing and structure issues. The next priority should be to:

1. **Fix the storage key structure** to match what the ConfigManager expects
2. **Improve the mocking timing** by using context-level initialization
3. **Add debugging** to understand the exact flow of the popup initialization

Once these issues are resolved, the remaining integration tests can be implemented following the same patterns.

## References

- [Playwright Mock Browser APIs](https://playwright.dev/docs/mock-browser-apis) - Official documentation for mocking browser APIs
- [Chrome Extension Testing with Puppeteer](https://oliverdunk.com/2022/11/13/extensions-puppeteer-popup-testing) - Insights into Chrome extension testing challenges
- [Session Storage in Playwright](https://frontendrescue.com/posts/2023-07-28-session-storage-playwright) - Patterns for authentication state management
- [Vitest localStorage Mocking](https://dev.to/britzdm/how-to-mock-and-spy-on-local-storage-in-vitest-54oe) - Techniques for mocking browser storage in tests 