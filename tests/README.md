# ForgetfulMe Extension Test Suite

This directory contains comprehensive tests for the ForgetfulMe Chrome extension, organized into unit tests (Vitest) and integration/E2E tests (Playwright).

## Test Structure

### Unit Tests (`tests/unit/`)
- **Framework**: Vitest
- **Location**: `tests/unit/`
- **Utilities**: `tests/unit/utils/vitest-utils.js`
- **Factories**: `tests/unit/factories/`

### Integration/E2E Tests (`tests/integration/`)
- **Framework**: Playwright
- **Location**: `tests/integration/`
- **Utilities**: `tests/integration/utils/playwright-utils.js`
- **Factories**: `tests/integration/factories/`

### Shared Resources (`tests/shared/`)
- **Constants**: `tests/shared/constants.js`
- **Common test data used by both unit and integration tests**

## Test Utilities Separation

### Vitest Utilities (`tests/unit/utils/vitest-utils.js`)
- Mock creation for Chrome APIs
- DOM element mocking
- Test environment setup
- Module mocking utilities
- Vitest-specific test helpers

### Playwright Utilities (`tests/integration/utils/playwright-utils.js`)
- Extension helper class
- Browser context management
- Chrome API mocking for browser environment
- Page interaction utilities
- Integration test setup helpers

## Test Factories Separation

### Vitest Factories (`tests/unit/factories/vitest-factories.js`)
- Mock object creation for unit tests
- Vitest-specific test data
- Mock function creation
- Unit test state management

### Playwright Factories (`tests/integration/factories/playwright-factories.js`)
- Integration test state creation
- Browser environment test data
- E2E test scenarios
- Real-world data simulation

## Usage Examples

### Unit Tests (Vitest)
```javascript
import { createTestEnvironment, setupTestWithMocks } from './utils/vitest-utils.js';
import { createMockAuthSession, createMockUser } from './factories/vitest-factories.js';

describe('Auth Tests', () => {
  let mocks;

  beforeEach(() => {
    mocks = setupTestWithMocks();
  });

  test('should authenticate user', () => {
    const authSession = createMockAuthSession();
    // Test implementation
  });
});
```

### Integration Tests (Playwright)
```javascript
import { test, expect } from '@playwright/test';
import { createAuthenticatedPlaywrightTest, createUnconfiguredPlaywrightTest } from './utils/playwright-utils.js';
import { createAuthenticatedState } from './factories/playwright-factories.js';

test('authentication flow', async ({ page, context }) => {
  const helper = await createUnconfiguredPlaywrightTest(page, context);
  await helper.openOptions();
  // Test implementation
});
```

## Key Benefits of Separation

1. **Environment-Specific Utilities**: Each test framework has utilities tailored to its environment
2. **Reduced Dependencies**: No cross-contamination between unit and integration test utilities
3. **Better Performance**: Unit tests don't load Playwright-specific code
4. **Clearer Intent**: Test code clearly indicates its purpose and framework
5. **Easier Maintenance**: Changes to one framework don't affect the other

## Migration Guide

### From Shared Utilities to Framework-Specific
- **Unit Tests**: Import from `tests/unit/utils/vitest-utils.js`
- **Integration Tests**: Import from `tests/integration/utils/playwright-utils.js`

### From Shared Factories to Framework-Specific
- **Unit Tests**: Import from `tests/unit/factories/vitest-factories.js`
- **Integration Tests**: Import from `tests/integration/factories/playwright-factories.js`

## Best Practices

1. **Use Framework-Specific Utilities**: Always use the utilities designed for your test framework
2. **Import from Index Files**: Use the index files for clean imports
3. **Share Constants**: Use `tests/shared/constants.js` for common test data
4. **Document Changes**: Update this README when adding new utilities or factories
5. **Test Isolation**: Ensure unit and integration tests remain independent

## Running Tests

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### All Tests
```bash
npm test
```

## File Organization

```
tests/
├── unit/                    # Vitest unit tests
│   ├── utils/
│   │   └── vitest-utils.js # Vitest-specific utilities
│   └── factories/
│       ├── vitest-factories.js # Vitest-specific factories
│       └── index.js
├── integration/             # Playwright integration tests
│   ├── utils/
│   │   └── playwright-utils.js # Playwright-specific utilities
│   └── factories/
│       ├── playwright-factories.js # Playwright-specific factories
│       └── index.js
├── shared/
│   └── constants.js        # Shared test constants
└── README.md              # This file
```

## Contributing

When adding new tests:

1. **Choose the Right Framework**: Use Vitest for unit tests, Playwright for integration/E2E tests
2. **Use Framework-Specific Utilities**: Import from the appropriate utilities file
3. **Create Framework-Specific Factories**: Add new factories to the appropriate factories file
4. **Update Documentation**: Keep this README and related documentation up to date
5. **Follow Naming Conventions**: Use clear, descriptive names for utilities and factories 