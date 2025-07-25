# Test Structure Documentation

This directory contains the test suite for the ForgetfulMe Chrome extension, organized with separate utilities for unit tests (Vitest) and integration tests (Playwright).

## Directory Structure

```
tests/
├── shared/                    # Shared constants and types
│   └── constants.js          # Common test data constants
├── unit/                     # Vitest unit tests
│   ├── factories/           # Unit test factories
│   │   ├── auth-factory.js
│   │   ├── bookmark-factory.js
│   │   ├── config-factory.js
│   │   └── index.js
│   ├── utils/               # Unit test utilities
│   │   └── test-utils.js
│   └── *.test.js           # Unit test files
├── integration/             # Playwright E2E tests
│   ├── factories/           # E2E test factories
│   │   ├── auth-factory.js
│   │   ├── bookmark-factory.js
│   │   └── index.js
│   ├── helpers/             # E2E test helpers
│   │   └── extension-helper.js
│   └── *.test.js           # Integration test files
└── helpers/                 # Shared test helpers
    └── extension-helper.js
```

## Usage Examples

### Unit Tests (Vitest)

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockAuthSession, createMockBookmark } from './unit/factories';
import { mockChromeAPI, createMockElement } from './unit/utils/test-utils';

describe('AuthStateManager', () => {
  beforeEach(() => {
    // Mock Chrome API
    const mockChrome = mockChromeAPI({
      auth_session: createMockAuthSession()
    });
    global.chrome = mockChrome;
  });

  it('should handle authentication', () => {
    // Test implementation using factories
    const session = createMockAuthSession({ user: { id: 'test-user' } });
    expect(session.user.id).toBe('test-user');
  });
});
```

### Integration Tests (Playwright)

```javascript
import { test, expect } from '@playwright/test';
import ExtensionHelper from './helpers/extension-helper.js';
import { createAuthenticatedState, createBookmarkFormData } from './integration/factories';

test.describe('Bookmark Management', () => {
  let extensionHelper;

  test.beforeEach(async ({ page, context }) => {
    extensionHelper = new ExtensionHelper(page, context);
    await extensionHelper.mockChromeAPI(createAuthenticatedState());
  });

  test('should create bookmark', async ({ page }) => {
    const bookmarkData = createBookmarkFormData({
      title: 'Test Bookmark',
      url: 'https://example.com'
    });

    await page.goto('http://localhost:3000/bookmark-management.html');
    // Test implementation
  });
});
```

## Factory Functions

### Unit Test Factories

- **`createMockAuthSession(overrides)`** - Creates mock authentication session
- **`createMockBookmark(overrides)`** - Creates mock bookmark object
- **`createMockConfig(overrides)`** - Creates mock configuration object
- **`createMockChromeStorage(overrides)`** - Creates mock Chrome storage data

### Integration Test Factories

- **`createAuthenticatedState(overrides)`** - Creates authenticated Chrome storage state
- **`createUnconfiguredState(overrides)`** - Creates unconfigured Chrome storage state
- **`createConfiguredState(overrides)`** - Creates configured but unauthenticated state
- **`createBookmarkFormData(overrides)`** - Creates bookmark form data for E2E tests

## Utility Functions

### Unit Test Utilities

- **`mockChromeAPI(storageData)`** - Mocks Chrome API for unit tests
- **`createMockElement(tagName, attributes, innerHTML)`** - Creates mock DOM elements
- **`createMockForm(formData)`** - Creates mock form elements
- **`mockConsole()`** - Mocks console methods
- **`resetMocks()`** - Resets all Vitest mocks

### Integration Test Utilities

- **`ExtensionHelper`** - Main helper class for Playwright tests
- **`setupAuthenticatedState(userData)`** - Sets up authenticated state
- **`setupUnconfiguredState()`** - Sets up unconfigured state
- **`waitForNetworkIdle(timeout)`** - Waits for network to be idle

## Best Practices

1. **Use Factories**: Always use factory functions to create test data instead of hardcoding values
2. **Override Pattern**: Use the `overrides` parameter to customize test data for specific scenarios
3. **Shared Constants**: Import from `./shared/constants.js` for consistent test data
4. **Framework Separation**: Keep unit test utilities separate from integration test utilities
5. **Documentation**: Add JSDoc comments to all factory and utility functions

## Running Tests

```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:playwright

# Run all tests
npm test
```

## Adding New Factories

1. Create a new factory file in the appropriate directory (`unit/factories/` or `integration/factories/`)
2. Export factory functions with proper JSDoc documentation
3. Add the export to the corresponding `index.js` file
4. Update this README with usage examples

## Adding New Utilities

1. Create utility functions in the appropriate utils directory
2. Follow the existing patterns for mocking and helper functions
3. Add comprehensive JSDoc documentation
4. Include usage examples in this README 