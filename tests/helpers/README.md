# Test Helpers

Utilities under `tests/helpers/` support Vitest unit tests for the ForgetfulMe extension.

## Files

| File                     | Purpose                                                        |
| ------------------------ | -------------------------------------------------------------- |
| `test-utils.js`          | Chrome API mocks, DOM helpers, `setupTestWithMocks()`          |
| `test-factories.js`      | `createTestData` and `createAssertionHelpers`                  |
| `vi-module-mocks.js`     | Shared `vi.mock()` module shapes for page unit tests           |
| `register-page-mocks.js` | Side-effect import that registers page-level `vi.mock()` calls |
| `mocks/`                 | Modular mock implementations (see `mocks/README.md`)           |

## Quick start

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupTestWithMocks } from './test-utils.js';
import { createTestData } from './test-factories.js';

describe('MyModule', () => {
  let mocks;
  let cleanup;

  beforeEach(() => {
    ({ mocks, cleanup } = setupTestWithMocks());
  });

  afterEach(() => {
    cleanup();
  });

  it('uses shared bookmark fixtures', () => {
    const bookmark = createTestData.bookmark({ title: 'Example' });
    expect(bookmark.url).toBe('https://example.com');
  });
});
```

## Conventions

- Prefer `setupTestWithMocks()` for utility-module tests; for popup/options unit tests, import `register-page-mocks.js` instead of duplicating shared `vi.mock` blocks.
- Import modules under test **after** mocks are registered when using dynamic imports.
- Playwright E2E tests live in `tests/popup.test.js` and `tests/options.test.js`; Vitest unit tests live in `tests/unit/`.

## Background service worker tests

`tests/unit/background.test.js` validates handler behavior with inline specs. It does not import the bundled service worker (`dist/background.js`). Run `npm run build:background` before loading the extension in Chrome.
