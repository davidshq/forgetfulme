# Test Mocks

This directory contains modular mock implementations for Vitest test setup. The mocks are organized by functionality to improve maintainability and reusability.

## Structure

### `dom.js`

Comprehensive DOM mocks including:

- **`createMockElement(tagName)`** - Creates a full-featured mock DOM element with:
  - Event handling (addEventListener, removeEventListener, dispatchEvent)
  - DOM manipulation (appendChild, removeChild, insertBefore, replaceChild)
  - Query methods (querySelector, querySelectorAll)
  - Element properties (className, id, style, attributes, dimensions)
  - Form properties (value, checked, required, disabled)
- **`createMockDocument(createElementFn)`** - Creates a mock document object with:
  - Element creation (createElement)
  - Element queries (getElementById, getElementsByClassName, getElementsByTagName, querySelector, querySelectorAll)
  - Document structure (body, head, documentElement)
  - Element registration by ID

- **`createMockWindow(document)`** - Creates a mock window object with:
  - Document reference
  - Event handling
  - Timers (setTimeout, setInterval, clearTimeout, clearInterval)
  - Location object
  - Storage (localStorage, sessionStorage)

### `chrome-api.js`

Chrome extension API mocks:

- **`createMockChrome()`** - Returns a complete Chrome API mock with:
  - Storage API (sync, local)
  - Runtime API (messages, URLs, options page)
  - Tabs API (query, get, update, create)
  - Action API (badge text and colors)
  - Notifications API

### `console.js`

Console method mocks:

- **`createMockConsole()`** - Returns mocked console methods (error, warn, info, log, debug) that can be tracked in tests

### `error-handler.js`

ErrorHandler utility mocks:

- **`createMockErrorHandler()`** - Returns a mock ErrorHandler with:
  - `handle()` method for error handling
  - `createError()` method for error creation
  - `ERROR_TYPES` constants

### `ui-components.js` (and related modules)

UIComponents mocks split into modular files for maintainability:

- **`ui-components.js`** - Main entry point that combines all component mocks
- **`ui-components-basic.js`** - Basic components (container, form, formField, button, list, listItem)
- **`ui-components-cards.js`** - Card components (section, card, cardWithActions, formCard, listCard)
- **`ui-components-navigation.js`** - Navigation components (navigation, breadcrumb, navMenu, headerWithNav)
- **`ui-components-modals.js`** - Modal and dialog components (modal, confirmDialog, showModal, closeModal, tooltip)
- **`ui-components-tabs.js`** - Tab components (createTabs, switchTab)
- **`ui-components-dom.js`** - DOM utility methods (getElement, querySelector, setValue, etc.)

**`createMockUIComponents(document)`** - Returns a complete UIComponents mock with all the above functionality combined.

## Usage

These mocks are automatically set up in `vitest.setup.js`. They can also be imported individually in test files if needed:

```javascript
import { createMockChrome } from './tests/helpers/mocks/chrome-api.js';

const mockChrome = createMockChrome();
```

## Known Limitations

### DOM Query Methods

The `querySelector` and `querySelectorAll` implementations have some limitations:

- Class name matching works for simple cases but may not handle all edge cases
- Complex CSS selectors are not fully supported (only class and tag selectors)
- Nested queries may not work in all scenarios

These limitations affect 2 tests in `ui-components.test.js`. The mocks work correctly for most use cases, but complex selector queries may need additional refinement.

## Best Practices

1. **Use the factory functions** - Always use the factory functions (`createMockElement`, `createMockChrome`, etc.) rather than creating mocks manually
2. **Reset between tests** - The `vitest.setup.js` file includes `beforeEach` hooks to reset mocks between tests
3. **Customize when needed** - You can override specific mock behaviors in individual tests if needed
4. **Keep mocks focused** - Each mock file should focus on a single area of functionality

## Maintenance

When adding new mocks or updating existing ones:

1. Keep mocks focused on their specific domain
2. Ensure mocks are reset between tests
3. Document any limitations or known issues
4. Update this README if adding new mock files or significant functionality
