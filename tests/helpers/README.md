# Test Helpers

Utilities under `tests/helpers/` support Vitest unit tests for the ForgetfulMe extension.

## Files

| File                     | Purpose                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| `vi-module-mocks.js`     | Shared `vi.mock()` module shapes for page unit tests                                            |
| `register-page-mocks.js` | Side-effect import that registers page-level `vi.mock()` calls for popup and options unit tests |
| `extension-helper.js`    | Playwright helper for E2E extension tests                                                       |
| `fixtures.js`            | Playwright test fixture with extension loading                                                  |
| `mocks/`                 | Modular mock implementations (see `mocks/README.md`)                                            |

## Quick start

### Page unit tests (popup and options)

```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '../helpers/register-page-mocks.js';
import {
  configureUIComponentStubs,
  PAGE_ERROR_HANDLER_RESULT,
} from '../helpers/vi-module-mocks.js';

import MyPage from '../../my-page.js';
import UIComponents from '../../utils/ui-components.js';
import ErrorHandler from '../../utils/error-handler.js';

describe('MyPage', () => {
  beforeEach(() => {
    ErrorHandler.handle = vi.fn().mockReturnValue(PAGE_ERROR_HANDLER_RESULT);
    configureUIComponentStubs(UIComponents, {
      getElement: id => (id === 'app' ? document.createElement('div') : null),
    });
  });
});
```

`bookmark-management.test.js` also imports `register-page-mocks.js` for shared
dependency mocks, then adds local `vi.mock()` blocks for page-specific
components (`bookmark-list`, `search-filter`, etc.).

### Utility module unit tests

Chrome APIs, DOM, and console mocks are set up globally in `vitest.setup.js`. Import individual factories from `mocks/` when you need custom behavior:

```javascript
import { describe, it, expect } from 'vitest';
import { createMockChrome } from './mocks/chrome-api.js';

describe('MyModule', () => {
  it('uses chrome.storage', async () => {
    chrome.storage.sync.get.mockResolvedValue({ key: 'value' });
    // ...
  });
});
```

## Conventions

- For popup and options unit tests, import `register-page-mocks.js` instead of duplicating shared `vi.mock` blocks.
- `bookmark-management.test.js` reuses `register-page-mocks.js` for shared deps and keeps component mocks local.
- Import modules under test **after** mocks are registered when using dynamic imports.
- Playwright E2E tests live in `tests/popup.test.js` and `tests/options.test.js`; Vitest unit tests live in `tests/unit/`.

## Background service worker tests

`tests/unit/background.test.js` validates handler behavior with inline specs. It does not import the bundled service worker (`dist/background.js`). Run `npm run build:background` before loading the extension in Chrome.
