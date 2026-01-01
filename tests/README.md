# ForgetfulMe Extension Tests

This directory contains comprehensive tests for the ForgetfulMe Chrome extension, following a strategic approach that addresses ES module mocking limitations in Vitest.

## Testing Strategy

### Core Principles

Based on the findings in `docs/ES_MODULE_MOCKING_ISSUE.md`, our testing strategy follows these principles:

1. **Test Individual Utility Modules Separately** - Each utility module is tested in isolation with proper mocking
2. **Use Playwright for Integration Testing** - Complex UI interactions and popup functionality are tested with Playwright
3. **Focus on Business Logic** - Unit tests focus on the core business logic in utility modules
4. **Accept ES Module Limitations** - We work within Vitest's ES module mocking constraints

### Test Structure

```
tests/
├── unit/                    # Individual module unit tests
│   ├── error-handler.test.js
│   ├── ui-components.test.js
│   ├── auth-state-manager.test.js
│   ├── config-manager.test.js
│   ├── bookmark-transformer.test.js
│   ├── ui-messages.test.js
│   ├── auth-ui.test.js
│   ├── supabase-service.test.js
│   └── background.test.js
├── helpers/                 # Test utilities and factories
│   ├── test-utils.js       # Core test utilities
│   ├── test-factories.js   # Specialized test factories
│   └── extension-helper.js # Playwright extension helper
├── popup.test.js           # Playwright integration tests
├── options.test.js         # Playwright integration tests
└── README.md              # This file
```

## Test Categories

### Unit Tests (`tests/unit/`)

These tests focus on individual utility modules and their business logic:

- **ErrorHandler** - Error categorization and user-friendly messages
- **UIComponents** - DOM manipulation and UI element creation
- **AuthStateManager** - Authentication state management
- **ConfigManager** - Configuration storage and validation
- **BookmarkTransformer** - Data format conversion
- **UIMessages** - User message display
- **AuthUI** - Authentication forms and user interactions
- **SupabaseService** - Database operations
- **BackgroundService** - Extension background functionality

### Integration Tests (`tests/`)

These tests use Playwright for end-to-end functionality:

- **popup.test.js** - Popup interface and user interactions
- **options.test.js** - Options page configuration

## Test Utilities

### Core Utilities (`test-utils.js`)

Provides centralized mock creation and test environment setup:

- `createTestEnvironment()` - Complete test environment with all mocks
- `setupTestWithMocks()` - Test setup with mocks and cleanup
- `createMockChrome()` - Chrome extension API mocks
- `createMockErrorHandler()` - Error handler mocks
- `createMockUIComponents()` - UI component mocks
- And more...

### Test Factories (`test-factories.js`)

Provides specialized test instance creation:

- `createUtilityTestInstance()` - For testing utility modules
- `createAuthUITestInstance()` - For testing authentication UI
- `createBackgroundTestInstance()` - For testing background service
- `createOptionsTestInstance()` - For testing options page
- `createSupabaseServiceTestInstance()` - For testing database operations

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### Specific Test File
```bash
npm test tests/unit/error-handler.test.js
```

## How to Write New Tests

### Step-by-Step Guide

#### 1. Choose the Right Test Type

**Unit Tests** (for business logic):
```javascript
// tests/unit/my-module.test.js
import { describe, test, expect, beforeEach, vi } from 'vitest';
import MyModule from '../../utils/my-module.js';

describe('MyModule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should do something specific', () => {
    const result = MyModule.doSomething('input');
    expect(result).toBe('expected');
  });
});
```

**Integration Tests** (for UI workflows):
```javascript
// tests/my-feature.test.js
import { test, expect } from '@playwright/test';
import ExtensionHelper from './helpers/extension-helper.js';

test.describe('My Feature', () => {
  let helper;

  test.beforeEach(async ({ context, page }) => {
    helper = new ExtensionHelper(page, context);
    await helper.loadExtension();
    await helper.openPopup();
  });

  test('should display correctly', async ({ page }) => {
    const isVisible = await helper.isElementVisible('#my-element');
    expect(isVisible).toBe(true);
  });
});
```

#### 2. Set Up Your Test Environment

Use test helpers for consistent setup:

```javascript
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestWithMocks } from './helpers/test-utils.js';
import MyModule from '../../utils/my-module.js';

describe('MyModule', () => {
  let mocks, cleanup;

  beforeEach(() => {
    ({ mocks, cleanup } = setupTestWithMocks());
  });

  afterEach(() => {
    cleanup();
  });

  test('should handle errors correctly', async () => {
    mocks.errorHandler.handle.mockReturnValue({
      userMessage: 'Error occurred',
      errorInfo: { type: 'NETWORK' }
    });

    // Your test code here
  });
});
```

#### 3. Test Specific Scenarios

```javascript
describe('BookmarkService', () => {
  describe('saveBookmark', () => {
    test('should save new bookmark successfully', async () => {
      // Setup
      const bookmark = {
        url: 'https://example.com',
        title: 'Example',
        readStatus: 'read'
      };

      // Execute
      const result = await bookmarkService.saveBookmark(bookmark);

      // Assert
      expect(result).toHaveProperty('id');
      expect(result.url).toBe(bookmark.url);
    });

    test('should prevent duplicate bookmarks', async () => {
      // Setup
      const bookmark = { url: 'https://example.com', title: 'Example' };
      await bookmarkService.saveBookmark(bookmark);

      // Execute & Assert
      await expect(
        bookmarkService.saveBookmark(bookmark)
      ).rejects.toThrow('Duplicate URL');
    });

    test('should validate bookmark data', async () => {
      const invalidBookmark = { url: '' }; // Missing required fields

      await expect(
        bookmarkService.saveBookmark(invalidBookmark)
      ).rejects.toThrow();
    });
  });
});
```

#### 4. Handle Async Operations

```javascript
// Good: Using async/await
test('should load data asynchronously', async () => {
  const data = await myModule.loadData();
  expect(data).toBeDefined();
});

// Good: Using promises with proper error handling
test('should handle loading errors', () => {
  return myModule.loadData().catch(error => {
    expect(error).toBeDefined();
  });
});

// Avoid: Forgetting to return/await
test('should load data', () => {
  myModule.loadData(); // Missing await - test completes too early!
});
```

---

## Test Data Factories Usage

### What Are Test Factories?

Test factories create consistent, reusable test data objects. They're located in `tests/helpers/test-factories.js`.

### Using Built-in Factories

```javascript
import { createTestData, createAssertionHelpers } from './helpers/test-factories.js';

describe('Bookmark Operations', () => {
  test('should create bookmarks with factory', () => {
    // Create a bookmark with default values
    const bookmark = createTestData.bookmark();
    expect(bookmark).toHaveProperty('url');
    expect(bookmark).toHaveProperty('title');

    // Override specific properties
    const customBookmark = createTestData.bookmark({
      url: 'https://custom.com',
      title: 'Custom Title'
    });
    expect(customBookmark.url).toBe('https://custom.com');
  });

  test('should create user data', () => {
    const user = createTestData.user();
    expect(user.id).toBeDefined();
    expect(user.email).toBeDefined();
  });

  test('should create error objects', () => {
    const error = createTestData.error({
      type: 'NETWORK',
      message: 'Connection failed'
    });
    expect(error.type).toBe('NETWORK');
  });
});
```

### Common Test Data Objects

```javascript
// Bookmark data
const bookmark = createTestData.bookmark({
  url: 'https://example.com',
  title: 'Example Page',
  readStatus: 'good-reference',
  tags: ['research', 'important']
});

// User data
const user = createTestData.user({
  email: 'test@example.com'
});

// Tab data (for Chrome tabs)
const tab = createTestData.tab({
  url: 'https://example.com',
  title: 'Example'
});

// Error data
const error = createTestData.error({
  message: 'Custom error',
  type: 'AUTH'
});
```

### Creating Custom Factories

```javascript
// tests/helpers/test-factories.js - Add custom factory
export const createTestData = {
  // ... existing factories ...

  customBookmarkWithTags: (overrides = {}) => ({
    url: 'https://example.com',
    title: 'Tagged Bookmark',
    readStatus: 'read',
    tags: ['tag1', 'tag2'],
    timestamp: new Date().toISOString(),
    ...overrides
  }),

  userWithPreferences: (overrides = {}) => ({
    id: 'user-123',
    email: 'user@example.com',
    preferences: {
      theme: 'light',
      notifications: true
    },
    ...overrides
  })
};

// Usage in tests
test('should handle tagged bookmarks', () => {
  const bookmark = createTestData.customBookmarkWithTags({
    title: 'My Bookmark'
  });
  expect(bookmark.tags.length).toBeGreaterThan(0);
});
```

### Using Assertion Helpers

```javascript
import { createAssertionHelpers } from './helpers/test-factories.js';

describe('Error Handling', () => {
  let mocks, assertionHelpers;

  beforeEach(() => {
    ({ mocks, cleanup } = setupTestWithMocks());
    assertionHelpers = createAssertionHelpers(mocks);
  });

  test('should handle errors correctly', async () => {
    // Your test code
    assertionHelpers.assertErrorHandling('my-context');
    
    // Verifies error was categorized and user message was shown
  });

  test('should show success message', async () => {
    // Your test code
    assertionHelpers.assertSuccessMessage('Bookmark saved');
    
    // Verifies success message was displayed
  });

  test('should save bookmark', async () => {
    // Your test code
    assertionHelpers.assertBookmarkSaved({
      url: 'https://example.com'
    });
    
    // Verifies bookmark save was called with expected data
  });
});
```

---

## Mocking Patterns for Chrome APIs

### Chrome Storage Mock

```javascript
import { setupTestWithMocks } from './helpers/test-utils.js';

describe('Chrome Storage', () => {
  let mocks;

  beforeEach(() => {
    ({ mocks } = setupTestWithMocks());
  });

  test('should get items from storage', async () => {
    // Setup mock to return data
    mocks.chrome.storage.sync.get.mockResolvedValue({
      'auth_session': { token: 'abc123' }
    });

    // Your code that uses chrome.storage.sync.get
    const result = await chrome.storage.sync.get(['auth_session']);
    
    expect(result).toHaveProperty('auth_session');
  });

  test('should set items in storage', async () => {
    mocks.chrome.storage.sync.set.mockResolvedValue();

    await chrome.storage.sync.set({ key: 'value' });

    expect(mocks.chrome.storage.sync.set).toHaveBeenCalledWith({ key: 'value' });
  });

  test('should handle storage errors', async () => {
    const error = new Error('Storage full');
    mocks.chrome.storage.sync.set.mockRejectedValue(error);

    await expect(
      chrome.storage.sync.set({ key: 'value' })
    ).rejects.toThrow('Storage full');
  });
});
```

### Chrome Runtime Mock

```javascript
describe('Chrome Runtime', () => {
  let mocks;

  beforeEach(() => {
    ({ mocks } = setupTestWithMocks());
  });

  test('should send messages', async () => {
    // Mock the response
    mocks.chrome.runtime.sendMessage.mockResolvedValue({
      success: true,
      data: { result: 'processed' }
    });

    const response = await chrome.runtime.sendMessage({
      type: 'GET_CONFIG'
    });

    expect(response).toHaveProperty('success');
    expect(mocks.chrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'GET_CONFIG' }),
      expect.any(Function)
    );
  });

  test('should handle message listeners', () => {
    const listener = vi.fn();
    mocks.chrome.runtime.onMessage.addListener(listener);

    expect(mocks.chrome.runtime.onMessage.addListener).toHaveBeenCalledWith(listener);
  });
});
```

### Chrome Tabs Mock

```javascript
describe('Chrome Tabs', () => {
  let mocks;

  beforeEach(() => {
    ({ mocks } = setupTestWithMocks());
  });

  test('should query tabs', async () => {
    const mockTabs = [{
      id: 1,
      url: 'https://example.com',
      title: 'Example'
    }];

    mocks.chrome.tabs.query.mockResolvedValue(mockTabs);

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

    expect(tabs).toHaveLength(1);
    expect(tabs[0].url).toBe('https://example.com');
  });

  test('should handle tab updates', async () => {
    mocks.chrome.tabs.update.mockResolvedValue({
      id: 1,
      url: 'https://updated.com'
    });

    const result = await chrome.tabs.update(1, { url: 'https://updated.com' });

    expect(result.url).toBe('https://updated.com');
  });
});
```

### Service Mock Pattern

```javascript
// For mocking complex services like Supabase
describe('SupabaseService', () => {
  let mocks;

  beforeEach(() => {
    ({ mocks } = setupTestWithMocks());

    // Setup Supabase mock
    mocks.supabaseService.saveBookmark.mockResolvedValue({
      id: 'bookmark-123',
      url: 'https://example.com'
    });

    mocks.supabaseService.getBookmarks.mockResolvedValue([
      { id: '1', url: 'https://example.com' }
    ]);
  });

  test('should save bookmarks', async () => {
    const result = await mocks.supabaseService.saveBookmark({
      url: 'https://example.com'
    });

    expect(result.id).toBeDefined();
  });
});
```

---

## Running Tests with Different Configurations

### Basic Test Commands

```bash
# Run all tests (unit + integration)
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests (Playwright)
npm run test:playwright

# Run specific test file
npm test tests/unit/error-handler.test.js

# Run tests matching a pattern
npm test -- --grep "should save"

# Run tests in watch mode (auto-rerun on changes)
npm test -- --watch
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:unit:coverage

# View coverage with UI
npm run test:unit:coverage -- --ui

# Coverage for specific file
npm run test:unit:coverage -- tests/unit/error-handler.test.js
```

### Playwright Integration Tests

```bash
# Run Playwright tests headless (default)
npm run test:playwright

# Run with visible browser
npm run test:playwright:headed

# Debug with inspector
npm run test:playwright:debug

# Run specific test
npm run test:playwright -- tests/popup.test.js

# Run with specific browser
npm run test:playwright -- --project=chromium
```

### Environment Variables

```bash
# Run with debug logging
DEBUG=* npm test

# Run with verbose output
npm test -- --reporter=verbose

# Run with specific timeout
npm test -- --testTimeout=10000
```

### CI/CD Integration

```bash
# Run all checks (lint + tests)
npm run check
npm test:unit
npm run test:playwright

# Continuous mode for development
npm test -- --watch
```

### Configuration Files

**vitest.config.js** - Unit test configuration:
```javascript
export default {
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
};
```

**playwright.config.js** - Integration test configuration:
```javascript
export default {
  testDir: './tests',
  testMatch: ['**/*.test.js'],
  use: {
    headless: true,
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ]
};
```

---

## Test Best Practices

### 1. Mock Dependencies Properly

```javascript
// Mock Chrome APIs
const mockChrome = {
  storage: { sync: { get: vi.fn() } },
  tabs: { query: vi.fn() }
};
global.chrome = mockChrome;
```

### 2. Use Test Factories for Complex Setup

```javascript
import { createAuthUITestInstance } from './helpers/test-factories.js';

describe('AuthUI', () => {
  let authUI, mocks, cleanup;

  beforeEach(async () => {
    ({ authUI, mocks, cleanup } = await createAuthUITestInstance());
  });

  afterEach(() => {
    cleanup();
  });
});
```

### 3. Test Business Logic, Not Implementation Details

```javascript
// Good: Test the business logic
test('should categorize network errors correctly', () => {
  const error = new Error('Network timeout');
  const result = ErrorHandler.handle(error, 'test-context');
  expect(result.errorInfo.type).toBe(ErrorHandler.ERROR_TYPES.NETWORK);
});

// Avoid: Testing implementation details
test('should call console.warn', () => {
  // Implementation details may change
});
```

### 4. Use Descriptive Test Names

```javascript
// Good: Descriptive test names
test('should save bookmark when no duplicate exists', async () => {
  // Test implementation
});

// Avoid: Vague test names
test('should work', async () => {
  // Test implementation
});
```

## ES Module Mocking Strategy

### Why This Approach?

The ES module mocking limitations in Vitest make it difficult to test modules with complex dependencies. Our solution:

1. **Test Individual Modules** - Each utility module is tested in isolation
2. **Mock Dependencies** - Use `vi.mock()` for simple dependencies
3. **Integration Tests** - Use Playwright for complex UI testing
4. **Focus on Business Logic** - Test what the module does, not how it does it

### Example: Testing a Utility Module

```javascript
// tests/unit/example-utility.test.js
import { describe, test, expect, beforeEach, vi } from 'vitest';
import ExampleUtility from '../../utils/example-utility.js';

describe('ExampleUtility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup mocks for dependencies
  });

  test('should perform business logic correctly', () => {
    const result = ExampleUtility.doSomething('input');
    expect(result).toBe('expected output');
  });
});
```

## Coverage Goals

- **Unit Tests**: 90%+ coverage for utility modules
- **Integration Tests**: Cover all major user workflows
- **Error Handling**: Test all error scenarios
- **Edge Cases**: Test boundary conditions and invalid inputs

## Continuous Integration

Tests run automatically on:
- Pull requests
- Main branch commits
- Release tags

## Troubleshooting

### Common Issues

1. **JSDOM Navigation Errors**: Mock `window.location.reload()` for tests that trigger page reloads
2. **Chrome API Errors**: Ensure Chrome APIs are properly mocked
3. **Async Test Failures**: Use proper async/await patterns and timeouts

### Debugging Tests

```bash
# Run tests with verbose output
npm test -- --reporter=verbose

# Run specific test with debugging
npm test -- --reporter=verbose tests/unit/example.test.js
```

## Contributing

When adding new tests:

1. Follow the existing patterns in similar test files
2. Use the test factories for complex setup
3. Focus on business logic, not implementation details
4. Add comprehensive error handling tests
5. Update this README if adding new test categories

## References

- [ES Module Mocking Issue Documentation](../docs/ES_MODULE_MOCKING_ISSUE.md)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/) 