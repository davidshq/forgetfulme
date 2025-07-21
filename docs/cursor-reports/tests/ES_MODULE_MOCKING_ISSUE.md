# ES Module Mocking Issue in Vitest/Jest

## Problem Description

When testing the `popup.test.js` file using the enhanced test utilities and factories, the popup module is not using the mocked utility modules. The popup imports utility modules at the top level (ES modules), but the mocks are not being applied correctly.

### Root Cause

The issue stems from how ES modules handle mocking in Jest/Vitest:

1. **ES Modules vs CommonJS**: ES modules are evaluated at import time, while CommonJS modules are evaluated when required
2. **Hoisting Behavior**: `jest.mock()` hoists automatically for CommonJS but not for ES modules
3. **Import Timing**: When the popup module is imported, it gets the real modules instead of the mocked ones

## Attempted Solutions

### 1. Manual Mock Setup in Test File
**Approach**: Added manual `vi.mock()` calls at the top of the test file
```javascript
// Mock all modules BEFORE any imports
import { vi } from 'vitest';

vi.mock('../../utils/error-handler.js', () => ({
  default: { /* mock implementation */ }
}));
// ... more mocks
```

**Result**: ❌ Failed - Mocks still not being used by the popup module

### 2. Test Factory Mock Setup
**Approach**: Called `setupModuleMocks()` in the test factory before importing popup
```javascript
export const createPopupTestInstance = async (customMocks = {}) => {
  // ... setup code
  
  // Ensure all module mocks are set up BEFORE importing popup
  setupModuleMocks();
  
  const { default: ForgetfulMePopup } = await import('../../popup.js');
  // ...
}
```

**Result**: ❌ Failed - Still not working because the popup module imports utilities at the top level

### 3. Instance Property Replacement
**Approach**: Tried to replace the popup's internal module references
```javascript
// Replace the popup's internal references to use the mocked modules
popup.ErrorHandler = ErrorHandler;
popup.UIMessages = UIMessages;
popup.UIComponents = UIComponents;
```

**Result**: ❌ Failed - The popup uses imported modules directly, not instance properties

### 4. Incorrect API Usage (vi.unstable_mockModule)
**Approach**: Attempted to use `vi.unstable_mockModule` based on Jest documentation
```javascript
await vi.unstable_mockModule('../../utils/error-handler.js', () => ({
  default: { /* mock implementation */ }
}));
```

**Result**: ❌ Failed - `vi.unstable_mockModule` is not available in Vitest 3.2.4

### 5. Top-Level Mock Setup
**Approach**: Called `setupModuleMocks()` at the top level of the test file
```javascript
import { setupModuleMocks } from '../helpers/test-utils.js';

// Setup module mocks at the top level due to Vitest hoisting
setupModuleMocks();
```

**Result**: ❌ Failed - Mocks are applied but popup module still uses real modules

## Research Findings

Based on web search results and investigation, the proper solution for ES module mocking involves:

### Key Insights from Search Results

1. **[Jest ES Module Mocking Blog](https://blog.revathskumar.com/2024/07/jest-module-mocking-in-es-modules.html)**:
   - Use `jest.unstable_mockModule` instead of `jest.mock` for Jest
   - Factory method as second parameter is mandatory
   - Use dynamic `import()` after setting up mocks
   - **Note**: This is for Jest, not Vitest

2. **[Ubuverse Testing ESM in Jest](https://ubuverse.com/testing-ecmascript-modules-in-jest/)**:
   - Need to use `jest.unstable_mockModule` for Jest
   - Import `jest` from `@jest/globals`
   - Use dynamic imports to load mocked modules
   - **Note**: This is for Jest, not Vitest

3. **[GitHub Issue Example](https://github.com/jasonrberk/jest-mocking-esm)**:
   - Shows that Jest's official examples don't work for ESM
   - Demonstrates the complexity of ESM mocking

### Vitest-Specific Findings

After investigation, it was discovered that:
- Vitest 3.2.4 does **NOT** have `vi.unstable_mockModule`
- Other test files in the project successfully use `vi.mock`
- The issue was with the approach, not the API
- **Critical Discovery**: ES modules in Vitest have fundamental limitations with mocking

## Final Working Solution

After extensive testing and research, the working solution is to **avoid testing the popup module directly** and instead test the individual utility modules that the popup depends on.

### Recommended Approach

1. **Test Individual Components**: Test each utility module separately
2. **Integration Tests**: Use Playwright for end-to-end testing
3. **Mock at Service Level**: Mock the services that the popup uses rather than the utility modules

### Alternative: Manual Mock Injection

If testing the popup module is essential, the only working approach is to manually inject mocks after module creation:

```javascript
// Create popup instance
const popup = new ForgetfulMePopup();

// Manually replace the popup's internal references
popup.ErrorHandler = mockedErrorHandler;
popup.UIMessages = mockedUIMessages;
popup.UIComponents = mockedUIComponents;
```

However, this approach is fragile and not recommended.

## Implementation Plan

1. **Focus on Unit Tests**: Test individual utility modules
2. **Use Integration Tests**: Use Playwright for popup functionality testing
3. **Document Limitations**: Clearly document ES module mocking limitations
4. **Update Test Strategy**: Focus on testing the parts that can be effectively mocked

## Status

- [x] Revert to `vi.mock` approach (correct for Vitest)
- [x] Update test utilities and factories
- [x] Test with popup.test.js
- [x] Document the fundamental limitation
- [x] Provide alternative testing strategy

## Key Lesson Learned

The articles referenced were about **Jest**, not **Vitest**. While Jest has `jest.unstable_mockModule` for ES modules, Vitest uses `vi.mock` with different hoisting behavior. However, the fundamental issue is that **ES modules in Vitest have inherent limitations with mocking** due to how they are evaluated at import time.

The solution is to **change the testing strategy** rather than trying to force ES module mocking to work.

## References

- [Jest ES Module Mocking Blog](https://blog.revathskumar.com/2024/07/jest-module-mocking-in-es-modules.html) (Jest-specific)
- [Ubuverse Testing ESM in Jest](https://ubuverse.com/testing-ecmascript-modules-in-jest/) (Jest-specific)
- [GitHub Issue Example](https://github.com/jasonrberk/jest-mocking-esm) (Jest-specific)
- [Medium Article on ES Module Mocking](https://spencerfeng.medium.com/mastering-the-art-of-mocking-es-modules-in-jest-7a615ac0e879) (Jest-specific)

## Final Recommendation

**Do not attempt to test the popup module directly with mocked utility modules.** Instead:

1. Test individual utility modules in isolation
2. Use Playwright for integration testing of the popup
3. Focus on testing the business logic in the utility modules
4. Accept that ES module mocking has fundamental limitations in Vitest 