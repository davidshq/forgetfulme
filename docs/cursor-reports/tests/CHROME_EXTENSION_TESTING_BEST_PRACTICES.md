# Chrome Extension Testing Best Practices

## Overview

This document outlines the best practices for organizing and implementing tests in Chrome extensions, based on the ForgetfulMe extension implementation.

## 🚨 Critical Issue: Directory Naming Restrictions

### The Problem
Chrome extensions **cannot load** if they contain directories with names starting with underscores (`_`). This is a Chrome security restriction to prevent loading of system directories.

**Error Message:**
```
ErrorCannot load extension with file or directory name __tests__. 
Filenames starting with "_" are reserved for use by the system.
```

### The Solution
Use directories that don't start with underscores for test organization.

## Recommended Test Directory Structure

### ✅ Good Structure
```
forgetfulme/
├── tests/
│   ├── unit/                    # Unit tests (Vitest)
│   │   ├── auth-ui.test.js
│   │   ├── background.test.js
│   │   ├── config-manager.test.js
│   │   └── ...
│   ├── integration/             # Integration tests (Playwright)
│   │   ├── popup.test.js
│   │   ├── options.test.js
│   │   └── ...
│   ├── helpers/                 # Test utilities
│   │   └── extension-helper.js
│   └── README.md
```

### ❌ Bad Structure (Causes Loading Errors)
```
forgetfulme/
├── __tests__/                   # ❌ Chrome won't load extension
│   ├── auth-ui.test.js
│   └── ...
├── _tests/                      # ❌ Also causes issues
│   └── ...
└── _private/                    # ❌ Reserved naming
    └── ...
```

## Test Framework Organization

### 1. Unit Tests (Vitest)
- **Location**: `tests/unit/`
- **Framework**: Vitest
- **Purpose**: Test individual components and utilities
- **Coverage**: Business logic, utility functions, error handling

### 2. Integration Tests (Playwright)
- **Location**: `tests/` (root level)
- **Framework**: Playwright
- **Purpose**: Test extension functionality in browser environment
- **Coverage**: UI interactions, Chrome API usage, end-to-end flows

### 3. Test Configuration

#### Vitest Configuration (`vitest.config.js`)
```javascript
export default defineConfig({
  test: {
    include: [
      'tests/unit/**/*.test.js'  // Unit tests only
    ],
    exclude: [
      'tests/popup.test.js',     // Exclude integration tests
      'tests/options.test.js',
      'tests/helpers/**'
    ]
  }
});
```

#### Playwright Configuration (`playwright.config.js`)
```javascript
export default defineConfig({
  testDir: './tests',            // Integration tests
  // ... other config
});
```

## Import Path Management

### When Moving Test Files
When reorganizing test files, update import paths:

```javascript
// ❌ Old path (from __tests__/)
import AuthUI from '../auth-ui.js';

// ✅ New path (from tests/unit/)
import AuthUI from '../../auth-ui.js';
```

### Relative Path Guidelines
- **From `tests/unit/` to root files**: `../../filename.js`
- **From `tests/unit/` to `utils/`**: `../../utils/filename.js`
- **From `tests/` to root files**: `../filename.js`

## Chrome Extension Testing Challenges

### 1. Chrome API Mocking
```javascript
// Mock Chrome APIs for unit tests
global.chrome = {
  storage: {
    sync: { get: vi.fn(), set: vi.fn() }
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: { addListener: vi.fn() }
  }
};
```

### 2. DOM Environment
```javascript
// Use JSDOM for DOM testing
environment: 'jsdom'
```

### 3. Service Worker Testing
- Background scripts require special handling
- Use comprehensive mocking for Chrome APIs
- Test message passing between contexts

## Best Practices Summary

### ✅ Do's
1. **Use `tests/` directory** for all test files
2. **Separate unit and integration tests** in subdirectories
3. **Mock Chrome APIs** comprehensively
4. **Use descriptive test names** and organize by functionality
5. **Include both positive and negative test cases**
6. **Test error handling** and edge cases
7. **Use helper utilities** for common test patterns

### ❌ Don'ts
1. **Don't use `__tests__/`** or any directory starting with `_`
2. **Don't test Chrome APIs directly** without mocking
3. **Don't mix unit and integration tests** in the same directory
4. **Don't forget to update import paths** when moving files
5. **Don't test implementation details** that don't affect user experience

## Testing Scripts

### Package.json Scripts
```json
{
  "scripts": {
    "test": "vitest",                    // Unit tests
    "test:unit": "vitest",
    "test:unit:ui": "vitest --ui",
    "test:unit:coverage": "vitest --coverage",
    "test:playwright": "playwright test", // Integration tests
    "test:playwright:headed": "playwright test --headed",
    "test:playwright:debug": "playwright test --debug"
  }
}
```

## Quality Metrics

### Coverage Goals
- **Unit Tests**: >80% line coverage
- **Integration Tests**: Core functionality paths
- **Error Handling**: All error scenarios covered
- **User Flows**: Complete user journeys tested

### Performance Goals
- **Unit Tests**: <5 seconds for full suite
- **Integration Tests**: <30 seconds for full suite
- **Test Reliability**: >95% pass rate

## Troubleshooting

### Common Issues

1. **Extension Won't Load**
   - Check for directories starting with `_`
   - Remove `__tests__/` or `_tests/` directories

2. **Import Path Errors**
   - Update relative paths when moving test files
   - Use `../../` for unit tests in `tests/unit/`

3. **Chrome API Errors**
   - Ensure comprehensive mocking in test setup
   - Mock all Chrome APIs used in tests

4. **DOM Errors**
   - Use JSDOM environment for unit tests
   - Mock DOM APIs that aren't available in test environment

## Resources

- [Chrome Extension Testing Guide](https://developer.chrome.com/docs/extensions/mv3/tut_testing/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)

## Implementation Example

The ForgetfulMe extension demonstrates these best practices:

- ✅ **Proper directory structure**: `tests/unit/` for unit tests
- ✅ **Comprehensive mocking**: Chrome APIs, DOM utilities
- ✅ **Clear separation**: Unit vs integration tests
- ✅ **Good coverage**: 307 unit tests, 11 integration tests
- ✅ **Reliable execution**: 100% pass rate

This structure ensures the extension loads properly in Chrome while maintaining comprehensive test coverage. 