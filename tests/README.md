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
│   ├── background.test.js
│   ├── supabase-config.test.js
│   ├── config-ui.test.js
│   ├── popup.test.js
│   ├── options.test.js
│   ├── formatters.test.js
│   ├── bookmark-management.test.js
│   └── example-usage.test.js
├── integration/             # End-to-end integration tests (Playwright)
│   ├── popup.test.js        # Popup interface and user interactions
│   └── options.test.js      # Options page configuration
├── helpers/                 # Test utilities and factories
│   ├── test-utils.js       # Core test utilities
│   ├── test-factories.js   # Specialized test factories
│   └── extension-helper.js # Playwright extension helper
├── README.md               # This file
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

### Integration Tests (`tests/integration/`)

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
npm run test:playwright
```

### Specific Test File
```bash
npm test tests/unit/error-handler.test.js
npm run test:playwright tests/integration/popup.test.js
```

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