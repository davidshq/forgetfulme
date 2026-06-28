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
├── helpers/                 # Test utilities and mocks
│   ├── vi-module-mocks.js   # Shared vi.mock module factories
│   ├── register-page-mocks.js # Page-level vi.mock registration
│   ├── extension-helper.js  # Playwright extension helper
│   └── mocks/              # Modular mock implementations
│       ├── dom.js          # DOM element, document, window mocks
│       ├── chrome-api.js   # Chrome extension API mocks
│       ├── console.js      # Console method mocks
│       ├── error-handler.js # ErrorHandler mocks
│       ├── ui-components.js # UIComponents mocks
│       └── README.md       # Mock documentation
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

### Modular Mocks (`helpers/mocks/`)

The test mocks are organized into modular files for better maintainability:

- **`dom.js`** - DOM element, document, and window mocks
- **`chrome-api.js`** - Chrome extension API mocks
- **`console.js`** - Console method mocks
- **`error-handler.js`** - ErrorHandler utility mocks
- **`ui-components.js`** - UIComponents mocks

These mocks are automatically set up in `vitest.setup.js` and can also be imported individually in test files. See `helpers/mocks/README.md` for detailed documentation.

### Page-level ES module mocks

Popup and options unit tests share dependency mocks via:

- `helpers/vi-module-mocks.js` — factory functions (`mockErrorHandlerModule`, `configureUIComponentStubs`, etc.)
- `helpers/register-page-mocks.js` — side-effect import that registers shared `vi.mock()` calls

`bookmark-management.test.js` imports the same shared mocks, then adds local
component mocks for list/search/bulk/editor modules.

```javascript
import '../helpers/register-page-mocks.js';
import { configureUIComponentStubs } from '../helpers/vi-module-mocks.js';
```

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

Utility module tests rely on global mocks from `vitest.setup.js`. Page unit tests import shared module mocks:

```javascript
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import '../helpers/register-page-mocks.js';
import { PAGE_ERROR_HANDLER_RESULT } from '../helpers/vi-module-mocks.js';
import ErrorHandler from '../../utils/error-handler.js';
import MyModule from '../../utils/my-module.js';

describe('MyModule', () => {
  beforeEach(() => {
    ErrorHandler.handle = vi.fn().mockReturnValue(PAGE_ERROR_HANDLER_RESULT);
  });

  test('should handle errors correctly', async () => {
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
        readStatus: 'read',
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
      await expect(bookmarkService.saveBookmark(bookmark)).rejects.toThrow(
        'Duplicate URL',
      );
    });

    test('should validate bookmark data', async () => {
      const invalidBookmark = { url: '' }; // Missing required fields

      await expect(
        bookmarkService.saveBookmark(invalidBookmark),
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

## Test Data

Define inline fixtures in each test file, or extract shared objects into a helper only when multiple tests reuse them:

```javascript
const bookmark = {
  id: 'test-bookmark-id',
  url: 'https://example.com',
  title: 'Example Page',
  read_status: 'read',
  tags: ['research'],
};
```

---

## Mocking Patterns for Chrome APIs

`vitest.setup.js` provides a global `chrome` mock. Configure return values per test:

### Chrome Storage Mock

```javascript
describe('Chrome Storage', () => {
  test('should get items from storage', async () => {
    chrome.storage.sync.get.mockResolvedValue({
      auth_session: { token: 'abc123' },
    });

    const result = await chrome.storage.sync.get(['auth_session']);

    expect(result).toHaveProperty('auth_session');
  });

  test('should set items in storage', async () => {
    chrome.storage.sync.set.mockResolvedValue();

    await chrome.storage.sync.set({ key: 'value' });

    expect(chrome.storage.sync.set).toHaveBeenCalledWith({
      key: 'value',
    });
  });

  test('should handle storage errors', async () => {
    const error = new Error('Storage full');
    chrome.storage.sync.set.mockRejectedValue(error);

    await expect(chrome.storage.sync.set({ key: 'value' })).rejects.toThrow(
      'Storage full',
    );
  });
});
```

### Chrome Runtime Mock

```javascript
describe('Chrome Runtime', () => {
  test('should send messages', async () => {
    chrome.runtime.sendMessage.mockResolvedValue({
      success: true,
      data: { result: 'processed' },
    });

    const response = await chrome.runtime.sendMessage({
      type: 'GET_CONFIG',
    });

    expect(response).toHaveProperty('success');
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'GET_CONFIG' }),
      expect.any(Function),
    );
  });

  test('should handle message listeners', () => {
    const listener = vi.fn();
    chrome.runtime.onMessage.addListener(listener);

    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledWith(listener);
  });
});
```

### Chrome Tabs Mock

```javascript
describe('Chrome Tabs', () => {
  test('should query tabs', async () => {
    const mockTabs = [
      {
        id: 1,
        url: 'https://example.com',
        title: 'Example',
      },
    ];

    chrome.tabs.query.mockResolvedValue(mockTabs);

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

    expect(tabs).toHaveLength(1);
    expect(tabs[0].url).toBe('https://example.com');
  });

  test('should handle tab updates', async () => {
    chrome.tabs.update.mockResolvedValue({
      id: 1,
      url: 'https://updated.com',
    });

    const result = await chrome.tabs.update(1, { url: 'https://updated.com' });

    expect(result.url).toBe('https://updated.com');
  });
});
```

### Page module mock pattern

For popup and options unit tests, use `register-page-mocks.js` and
`configureUIComponentStubs` instead of inline shared `vi.mock()` blocks.
`bookmark-management.test.js` reuses `register-page-mocks.js` and keeps
page-specific component mocks local. See `helpers/README.md`.

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
      reporter: ['text', 'json', 'html'],
    },
  },
};
```

**playwright.config.js** - Integration test configuration:

```javascript
export default {
  testDir: './tests',
  testMatch: ['**/*.test.js'],
  use: {
    headless: true,
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
};
```

---

## Test Best Practices

### 1. Mock Dependencies Properly

```javascript
// Global chrome mock from vitest.setup.js — configure per test
chrome.storage.sync.get.mockResolvedValue({ key: 'value' });
chrome.tabs.query.mockResolvedValue([{ url: 'https://example.com' }]);
```

### 2. Use Shared Page Mocks for UI Tests

```javascript
import '../helpers/register-page-mocks.js';
import { configureUIComponentStubs } from '../helpers/vi-module-mocks.js';
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
