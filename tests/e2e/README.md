# End-to-End Testing Documentation

## Overview

This directory contains comprehensive E2E testing for the ForgetfulMe Chrome extension, including both component integration tests and real Chrome extension environment tests.

## Testing Architecture

### 1. **Multi-Layer Testing Strategy**

```
┌─────────────────────────────────────────────────────────────┐
│                  Testing Pyramid                           │
├─────────────────────────────────────────────────────────────┤
│ L4: Full System Integration (Future - Real Supabase)       │
├─────────────────────────────────────────────────────────────┤
│ L3: Chrome Extension E2E (NEW - Real Extension Environment)│
├─────────────────────────────────────────────────────────────┤
│ L2: Component Integration (Current - Playwright HTTP)      │
├─────────────────────────────────────────────────────────────┤
│ L1: Unit Tests (Current - Vitest + JSDOM)                  │
└─────────────────────────────────────────────────────────────┘
```

### 2. **Test Projects Configuration**

- **`component-integration`**: HTTP-based testing for fast component feedback
- **`extension-e2e`**: Real Chrome extension environment testing
- **`firefox`**: Cross-browser testing (future implementation)

## Running Tests

### Quick Commands

```bash
# Run all unit tests
npm run test:unit

# Run component integration tests (HTTP-based)
npm run test:integration

# Run real Chrome extension E2E tests
npm run test:e2e

# Run E2E tests with browser UI (for debugging)
npm run test:e2e:headed

# Run all tests in sequence
npm run test:all

# Run quick feedback loop (unit + integration)
npm run test:quick
```

### Detailed Commands

```bash
# Component Integration Tests
npm run test:integration                    # Headless
npm run test:integration:headed            # With browser UI
npm run test:integration:ui                # With Playwright UI

# Real Extension E2E Tests
npm run test:e2e                          # Headless
npm run test:e2e:headed                   # With browser UI
npm run test:e2e:debug                    # Debug mode
npm run test:e2e:ui                       # With Playwright UI

# Run specific test files
npx playwright test e2e-extension-environment.test.js --project=extension-e2e
npx playwright test e2e-user-workflows.test.js --project=extension-e2e --headed
```

## Test Files Structure

### Integration Tests (`tests/integration/`)

#### Component Integration Tests
- `popup.test.js` - Popup component testing (HTTP-based)
- `options.test.js` - Options page testing (HTTP-based)  
- `bookmark-operations.test.js` - Bookmark operations (HTTP-based)
- `auth-flow.test.js` - Authentication workflows (HTTP-based)

#### Real Extension E2E Tests
- `e2e-extension-environment.test.js` - Extension environment validation
- `e2e-user-workflows.test.js` - Complete user journey testing

### Test Helpers (`tests/helpers/`)

- `extension-helper.js` - Original helper for HTTP-based testing
- `real-extension-helper.js` - NEW helper for real extension testing

## Real Extension E2E Testing Features

### 1. **Real Chrome Extension Environment**
- Loads actual extension using `--load-extension`
- Uses real `chrome-extension://` URLs
- Tests actual Chrome extension APIs
- Validates real extension lifecycle

### 2. **Extension-Specific Testing**
```javascript
const helper = new RealExtensionHelper(page, context);

// Get real extension ID
const extensionId = await helper.getExtensionId();

// Open real extension popup
const popupPage = await helper.openPopup();

// Test keyboard shortcuts
await helper.triggerKeyboardShortcut('Ctrl+Shift+R');

// Test cross-page navigation
const optionsPage = await helper.openOptions();
const bookmarkPage = await helper.openBookmarkManagement();
```

### 3. **Complete User Workflows**
- **First-time setup**: Configuration → Authentication → First bookmark
- **Daily workflows**: Quick mark via popup, keyboard shortcuts
- **Bookmark management**: Search, edit, delete operations
- **Error scenarios**: Network failures, retry mechanisms

## Test Development Guidelines

### 1. **When to Use Each Test Type**

#### Component Integration Tests
- ✅ Fast component behavior validation
- ✅ UI element interactions
- ✅ Form validation and error handling
- ✅ Quick development feedback

#### Real Extension E2E Tests  
- ✅ Complete user journeys
- ✅ Chrome extension API integration
- ✅ Keyboard shortcuts and extension actions
- ✅ Cross-page state consistency
- ✅ Real extension environment validation

### 2. **Test Naming Convention**
- Component tests: `component-name.test.js`
- E2E tests: `e2e-test-focus.test.js`

### 3. **Best Practices**

#### ✅ Do
- Test complete user workflows in E2E tests
- Use meaningful test descriptions
- Clean up extension pages after tests
- Handle async operations properly
- Test error conditions and recovery

#### ❌ Don't
- Mix component testing with E2E testing in same file
- Test implementation details in E2E tests
- Skip cleanup (causes resource leaks)
- Ignore timeout configurations
- Test without proper extension setup

## Debugging E2E Tests

### 1. **Visual Debugging**
```bash
# Run with browser UI visible
npm run test:e2e:headed

# Run in debug mode (pauses execution)
npm run test:e2e:debug

# Use Playwright UI for interactive debugging
npm run test:e2e:ui
```

### 2. **Extension Debugging**
- Tests run with `--enable-extension-activity-logging`
- Extension console logs are captured
- Screenshots taken on failures
- Video recordings for failed tests

### 3. **Common Issues**

#### Extension Not Loading
```bash
# Ensure extension manifest is valid
# Check Chrome flags in playwright.config.js
# Verify extension ID discovery logic
```

#### Tests Timing Out
```bash
# Increase timeout in test configuration
# Check if extension is properly initialized
# Verify Chrome extension APIs are available
```

#### State Consistency Issues
```bash
# Ensure proper cleanup between tests
# Check Chrome storage mocking
# Verify extension background script functionality
```

## Performance Considerations

### 1. **Test Execution Time**
- Component integration: ~2-5 seconds per test
- Real extension E2E: ~10-30 seconds per test
- Use `test:quick` for development feedback

### 2. **Resource Management**
- Extension pages are automatically cleaned up
- Browser contexts isolated between tests
- Memory leaks prevented through proper cleanup

## Future Enhancements

### Phase 2: Complete User Journey Automation
- [ ] Multi-tab bookmark workflows
- [ ] Bulk bookmark operations
- [ ] Import/export functionality testing
- [ ] Advanced search and filtering

### Phase 3: Real Supabase Integration
- [ ] Test database setup automation
- [ ] Real-time sync testing across browsers
- [ ] Authentication flow with real backend
- [ ] Data persistence validation

### Phase 4: Performance & Reliability
- [ ] Memory leak detection
- [ ] Performance benchmarking
- [ ] Stress testing with large datasets
- [ ] Cross-browser compatibility testing

## Contributing

1. **Adding New E2E Tests**
   - Use `e2e-` prefix for filenames
   - Extend `RealExtensionHelper` for new functionality
   - Follow complete user workflow patterns

2. **Updating Test Infrastructure**
   - Modify `playwright.config.js` for new projects
   - Update `package.json` scripts as needed
   - Document new testing patterns

3. **Best Practices**
   - Test real user scenarios, not implementation details
   - Ensure tests are reliable and not flaky
   - Maintain clear separation between test layers
   - Keep E2E tests focused and efficient

---

For questions or issues with E2E testing, see the main project documentation or create an issue in the project repository.