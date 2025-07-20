# Enhanced Test Utilities

This directory contains enhanced test utilities that provide centralized mock creation, test environment setup, and consistent patterns for testing the ForgetfulMe extension.

## Overview

The enhanced test utilities address the following issues identified in the test improvements document:

- **Code Duplication**: Eliminates repetitive mock setup across test files
- **Inconsistent Patterns**: Standardizes mocking approaches
- **Complex Setup**: Simplifies test initialization
- **Missing Best Practices**: Provides utilities and factories for better test organization

## Files

### `test-utils.js`
Core utilities for creating mocks and setting up test environments.

### `test-factories.js`
Specialized factories for creating complete test instances for different modules.

### `example-usage.test.js`
Example tests demonstrating how to use the enhanced utilities.

## Quick Start

### Basic Usage

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createPopupTestInstance } from './test-factories.js';

describe('Popup Tests', () => {
  let testContext;

  beforeEach(async () => {
    testContext = await createPopupTestInstance();
  });

  afterEach(() => {
    testContext.cleanup();
  });

  it('should save bookmark', async () => {
    const { popup, mocks } = testContext;
    
    // Setup mocks
    mocks.supabaseService.saveBookmark.mockResolvedValue({
      id: 'new-id',
      url: 'https://example.com',
    });

    // Execute
    await popup.markAsRead();

    // Assert
    expect(mocks.supabaseService.saveBookmark).toHaveBeenCalled();
  });
});
```

### Using Custom Mocks

```javascript
const customMocks = {
  supabaseService: {
    saveBookmark: vi.fn().mockResolvedValue({
      id: 'custom-id',
      url: 'https://custom.com',
    }),
  },
};

const testContext = await createPopupTestInstance(customMocks);
```

### Using Test Data Factories

```javascript
import { createTestData } from './test-factories.js';

const bookmark = createTestData.bookmark({
  url: 'https://custom.com',
  title: 'Custom Page',
});

const user = createTestData.user({
  email: 'custom@example.com',
});
```

### Using Assertion Helpers

```javascript
import { createAssertionHelpers } from './test-factories.js';

const assertions = createAssertionHelpers(mocks);

// Assert error handling
assertions.assertErrorHandling('popup.markAsRead');

// Assert success message
assertions.assertSuccessMessage('Page marked as read!');

// Assert bookmark saved
assertions.assertBookmarkSaved({
  url: 'https://example.com',
  title: 'Test Page',
});
```

## Available Factories

### `createPopupTestInstance(customMocks)`
Creates a complete popup test instance with:
- All necessary mocks
- DOM elements setup
- Chrome tabs setup
- Bookmark data setup

### `createAuthUITestInstance(customMocks)`
Creates a complete auth UI test instance with:
- Authentication mocks
- Container setup
- Form validation setup

### `createBackgroundTestInstance(customMocks)`
Creates a complete background service test instance with:
- Chrome runtime mocks
- Storage mocks
- Badge management setup

### `createOptionsTestInstance(customMocks)`
Creates a complete options page test instance with:
- Configuration form setup
- DOM elements for settings
- Validation setup

### `createConfigUITestInstance(customMocks)`
Creates a complete config UI test instance with:
- Configuration container setup
- Authentication flow setup

### `createSupabaseServiceTestInstance(customMocks)`
Creates a complete Supabase service test instance with:
- Supabase client mocks
- Database operation mocks
- Authentication mocks

### `createUtilityTestInstance(modulePath, customMocks)`
Creates a test instance for utility modules with:
- Module-specific mocks
- Utility function setup

## Test Data Factories

### `createTestData.bookmark(overrides)`
Creates sample bookmark data with sensible defaults.

### `createTestData.user(overrides)`
Creates sample user data with sensible defaults.

### `createTestData.tab(overrides)`
Creates sample tab data with sensible defaults.

### `createTestData.error(overrides)`
Creates sample error data with sensible defaults.

## Assertion Helpers

### `assertErrorHandling(expectedContext)`
Asserts that error handling was called correctly.

### `assertSuccessMessage(expectedMessage)`
Asserts that a success message was shown.

### `assertLoadingMessage(expectedMessage)`
Asserts that a loading message was shown.

### `assertBookmarkSaved(expectedBookmark)`
Asserts that a bookmark was saved correctly.

### `assertBookmarkUpdated(bookmarkId, expectedUpdates)`
Asserts that a bookmark was updated correctly.

## Migration Guide

### From Old Test Pattern

**Before:**
```javascript
// Lots of repetitive mock setup
vi.mock('../../utils/ui-components.js', () => ({
  default: {
    DOM: {
      getElement: vi.fn(),
      // ... many more mocks
    }
  }
}));

vi.mock('../../utils/error-handler.js', () => ({
  default: {
    handle: vi.fn(),
    // ... many more mocks
  }
}));

// ... more vi.mock calls

beforeEach(() => {
  vi.clearAllMocks();
  // ... complex setup
});
```

**After:**
```javascript
import { createPopupTestInstance } from './test-factories.js';

let testContext;

beforeEach(async () => {
  testContext = await createPopupTestInstance();
});

afterEach(() => {
  testContext.cleanup();
});
```

### Benefits

1. **Reduced Code**: 80% less boilerplate code
2. **Consistency**: All tests use the same patterns
3. **Maintainability**: Changes to mocks only need to be made in one place
4. **Readability**: Tests focus on behavior, not setup
5. **Reliability**: Standardized error handling and assertions

## Best Practices

### 1. Use Factories for Module-Specific Tests
```javascript
// Good
const testContext = await createPopupTestInstance();

// Avoid
const testContext = await createUtilityTestInstance('../../popup.js');
```

### 2. Use Test Data Factories for Consistent Data
```javascript
// Good
const bookmark = createTestData.bookmark({ url: 'https://custom.com' });

// Avoid
const bookmark = {
  id: 'test-id',
  url: 'https://custom.com',
  // ... manually creating all fields
};
```

### 3. Use Assertion Helpers for Common Patterns
```javascript
// Good
const assertions = createAssertionHelpers(mocks);
assertions.assertErrorHandling('popup.markAsRead');

// Avoid
expect(mocks.errorHandler.handle).toHaveBeenCalledWith(
  expect.any(Error),
  'popup.markAsRead'
);
```

### 4. Use Custom Mocks Sparingly
```javascript
// Good - only override what you need
const customMocks = {
  supabaseService: {
    saveBookmark: vi.fn().mockRejectedValue(new Error('Network error')),
  },
};

// Avoid - overriding everything
const customMocks = {
  // ... overriding all mocks
};
```

## Troubleshooting

### Async Import Issues
If you encounter issues with async imports, ensure your factory functions are marked as `async`:

```javascript
export const createTestInstance = async (customMocks = {}) => {
  // ... setup code
};
```

### Mock Not Working
If a mock isn't working as expected:

1. Check that the mock is being set up in the factory
2. Verify the mock is being applied correctly
3. Use custom mocks to override specific behavior

### Test Isolation Issues
If tests are interfering with each other:

1. Always call `cleanup()` in `afterEach`
2. Use `vi.clearAllMocks()` in `beforeEach` if needed
3. Ensure each test has its own test context

## Contributing

When adding new test utilities:

1. Add new mock creators to `test-utils.js`
2. Add new factories to `test-factories.js`
3. Update this README with documentation
4. Add example usage to `example-usage.test.js`
5. Ensure backward compatibility with existing tests 