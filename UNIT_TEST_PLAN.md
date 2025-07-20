# ForgetfulMe Chrome Extension - Unit Test Plan

## Overview

This document outlines the unit testing strategy for the ForgetfulMe Chrome extension, reflecting the current implementation status and providing a roadmap for comprehensive test coverage. The project uses **Vitest for unit tests** and **Playwright for integration tests**.

## Current Testing Infrastructure

### ✅ Current Test Coverage

#### Unit Tests (Vitest) - 18 tests implemented
```javascript
// __tests__/auth-ui.test.js - 18 tests ✅
describe('AuthUI', () => {
  // Constructor tests (2 tests)
  // Login tests (5 tests) 
  // Signup tests (8 tests)
  // Signout tests (2 tests)
  // Error message tests (1 test)
})
```

#### Utility Tests (Vitest) - Available but not implemented
```javascript
// utils/auth-state-manager.test.js - Available
// utils/bookmark-transformer.test.js - Available
```

## Current Implementation Status

### ❌ Not Implemented

#### 7. Utility Module Tests (Vitest)
**Priority**: High  
**Framework**: Vitest  
**Estimated Tests**: 20-30 tests

```javascript
// utils/auth-state-manager.test.js
describe('AuthStateManager', () => {
  test('should initialize with no auth state')
  test('should set and persist auth state')
  test('should clear auth state')
  test('should notify listeners of auth state changes')
  test('should handle storage change events')
  test('should provide auth summary')
  test('should handle initialization errors')
})

// utils/bookmark-transformer.test.js
describe('BookmarkTransformer', () => {
  test('should transform to Supabase format')
  test('should transform to UI format')
  test('should transform from current tab')
  test('should normalize tags correctly')
  test('should validate bookmark data')
  test('should handle invalid URLs')
  test('should handle missing required fields')
  test('should preserve timestamps when requested')
})

// utils/error-handler.test.js
describe('ErrorHandler', () => {
  test('should categorize network errors')
  test('should categorize authentication errors')
  test('should categorize validation errors')
  test('should provide user-friendly messages')
  test('should log errors for debugging')
  test('should handle unknown error types')
})

// utils/config-manager.test.js
describe('ConfigManager', () => {
  test('should save custom status types')
  test('should load custom status types')
  test('should validate status type format')
  test('should handle configuration errors')
  test('should provide default settings')
})

// utils/ui-components.test.js
describe('UIComponents', () => {
  test('should create containers')
  test('should create buttons')
  test('should create forms')
  test('should create messages')
  test('should handle DOM ready events')
  test('should provide safe DOM access')
})

// utils/ui-messages.test.js
describe('UIMessages', () => {
  test('should display success messages')
  test('should display error messages')
  test('should display info messages')
  test('should auto-hide messages')
  test('should handle message container errors')
})
```

## Test Environment Setup

### Current Configuration
```javascript
// vitest.config.js
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    coverage: {
      provider: 'v8',
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    }
  }
})
```

### Mock Infrastructure
```javascript
// vitest.setup.js - Comprehensive mocks
- Chrome extension APIs (storage, runtime, tabs, action, notifications)
- DOM utilities and event handling
- Local/session storage
- Fetch API for network requests
- Console methods to reduce test noise
```

## Running Tests

### Unit Tests (Vitest)
```bash
# Run all unit tests
npm test

# Run tests with UI
npm run test:unit:ui

# Run tests with coverage
npm run test:unit:coverage

# Run specific test file
npm test __tests__/auth-ui.test.js
npm test __tests__/background.test.js
```

## Maintenance Guidelines

### Test Maintenance
1. **Update tests** when core functionality changes
2. **Add tests** for new features
3. **Refactor tests** when implementation changes
4. **Remove obsolete tests** for removed features

### Test Documentation
1. **Clear test descriptions** explaining what is being tested
2. **Setup instructions** for test environment
3. **Mock data documentation** for test data sets
4. **Troubleshooting guide** for common test issues