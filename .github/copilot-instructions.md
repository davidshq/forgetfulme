# AI Coding Agent Instructions - ForgetfulMe Extension

## Project Overview

**ForgetfulMe** is a Chrome extension that helps researchers and students mark websites as "read" with customizable status types and tags. It syncs across devices via Supabase backend and supports unlimited storage for hundreds of thousands of entries.

**Key Constraint**: This is a Chrome Extension (Manifest V3), not a web app. Service workers have strict limitations:
- No DOM access in background scripts
- All shared logic uses ES modules
- Configuration loaded from `chrome.storage.sync`
- Real-time updates via Supabase subscriptions

## Architecture Overview

### Core Components

**Service Boundary**: The extension has three main layers:
1. **UI Layer** (`popup.html`, `options.html`, `config-ui.js`, `auth-ui.js`) - User-facing interfaces
2. **Business Logic** (`supabase-service.js`, `utils/*`) - Shared service classes  
3. **Background Service** (`background.js`) - Message router, keyboard shortcuts, background tasks

**Data Flow**: 
- UI scripts → Message API → `background.js` → Services → Supabase
- Supabase real-time events → `RealtimeManager` → broadcast to all tabs via port messaging

### Key Services

| Service | Purpose | Location |
|---------|---------|----------|
| **SupabaseService** | Database ops (CRUD), real-time subscriptions | [supabase-service.js](..](supabase-service.js) |
| **ConfigManager** | Unified config/storage management, validates settings | [utils/config-manager.js](utils/config-manager.js) |
| **ErrorHandler** | Centralized error categorization & user messages | [utils/error-handler.js](utils/error-handler.js) |
| **BookmarkTransformer** | Normalizes data between UI and database formats | [utils/bookmark-transformer.js](utils/bookmark-transformer.js) |
| **AuthStateManager** | Tracks user session state across contexts | [utils/auth-state-manager.js](utils/auth-state-manager.js) |

## Critical Patterns & Conventions

### Error Handling - Consistent Approach
**Every async operation must use ErrorHandler**. Returns `{userMessage, errorInfo}`:
```javascript
try {
  const result = await supabaseService.saveBookmark(data);
} catch (error) {
  const {userMessage, errorInfo} = ErrorHandler.handle(error, 'context.method');
  // userMessage = user-friendly text for UI
  // errorInfo.type = one of [NETWORK, AUTH, VALIDATION, DATABASE, CONFIG, UI, UNKNOWN]
}
```
- **Never** show raw errors to users
- Error types in `ErrorHandler.ERROR_TYPES` determine retry logic and messaging
- See [utils/error-handler.js](utils/error-handler.js#L18-L35) for all types

### Configuration Flow - Secure Defaults
```javascript
// 1. ConfigManager loads from chrome.storage.sync
// 2. Falls back to supabase-config.js if missing
// 3. User can override via options.html settings UI
// Never commit real credentials - use supabase-config.template.js
const configManager = new ConfigManager();
await configManager.initialize();
const supabaseConfig = await configManager.getSupabaseConfig();
```

### Message Passing - UI ↔ Background Script
UI code cannot directly call background script functions. Always use Chrome message API:
```javascript
// popup.js (UI)
chrome.runtime.sendMessage(
  {type: 'SAVE_BOOKMARK', data: bookmarkData},
  (response) => { /* handle response */ }
);

// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SAVE_BOOKMARK') {
    // Process and send back response
    sendResponse({success: true});
  }
});
```

### Data Format - Bookmark Structure
Bookmarks normalize to this structure (applies across UI, DB, messages):
```javascript
{
  url: string,           // Must be unique per user
  title: string,         // Page title
  readStatus: string,    // User-defined status (e.g., 'read', 'good_reference')
  tags: string[],        // User-defined categories
  timestamp: number,     // ISO timestamp when marked
  userId: string,        // Supabase auth user ID
  // Optional fields populated from database
  id: string,            // Supabase row ID
  description: string,   // Optional user notes
}
```
Use **BookmarkTransformer** to convert between formats (see [utils/bookmark-transformer.js](utils/bookmark-transformer.js)).

## Testing & Quality

### Test Structure
- **Unit tests**: `tests/unit/**/*.test.js` with Vitest + jsdom
- **Integration tests**: `tests/popup.test.js`, `tests/options.test.js` (Playwright)
- **Setup file**: [vitest.setup.js](..](vitest.setup.js) - mocks Chrome APIs and Supabase

### Test Utilities
- [tests/helpers/test-utils.js](../tests/helpers/test-utils.js) - Mock Chrome storage, auth, messaging
- [tests/helpers/test-factories.js](../tests/helpers/test-factories.js) - Factory functions for test data
- [tests/helpers/extension-helper.js](../tests/helpers/extension-helper.js) - Extension-specific mocks

### Running Tests
```bash
npm run test:unit              # Run all unit tests
npm run test:unit:coverage     # With coverage report
npm run test:playwright        # Run E2E tests (headless)
npm run test:playwright:headed # With visible browser
npm run test:playwright:debug  # Step through with inspector
```

## Developer Workflows

### Setup & Development
1. **Install**: `npm install && npm run install-browsers` (for Playwright)
2. **Config**: Copy `supabase-config.template.js` → `supabase-config.local.js` with real credentials
3. **Load Extension**: Chrome → `chrome://extensions` → Developer mode → Load unpacked
4. **Debugging**: Open extension popup → Right-click → Inspect to view console

### Code Quality Checks
```bash
npm run lint              # ESLint check
npm run lint:fix          # Auto-fix issues
npm run format:check      # Prettier format check
npm run format            # Auto-format all files
npm run check             # Run lint + format:check
```
**Both ESLint and Prettier are enforced** - config in [eslint.config.js](..](eslint.config.js) and `.prettierrc` (if exists).

### Common Development Patterns

**Adding a new bookmark field**:
1. Update [supabase-schema.sql](supabase-schema.sql) with migration
2. Update BookmarkTransformer converter methods
3. Add validation in ConfigManager or ErrorHandler
4. Update UI component in [utils/ui-components.js](utils/ui-components.js) if needed
5. Add unit test for new field handling

**Adding a new settings option**:
1. Add to [options.html](options.html) form
2. Update ConfigManager storage keys
3. Add initialization in [options.js](..](options.js) 
4. Test persistence via `chrome.storage.sync` mock

**Fixing a Supabase sync issue**:
- Check RealtimeManager in [supabase-service.js](..](supabase-service.js) - manages subscriptions
- Verify user is authenticated via AuthStateManager before any DB call
- See [RACE_CONDITION_FIXES.md](../docs/cursor-reports/RACE_CONDITION_FIXES.md) for common timing issues

## Integration Points & Dependencies

### Supabase Integration
- **Auth**: Email/password via Supabase Auth (session stored in ConfigManager)
- **Database**: `bookmarks` table (url unique per user), `user_preferences` table
- **Real-time**: Supabase Realtime listens for changes across all devices
- **Setup guide**: [SUPABASE_SETUP.md](..](SUPABASE_SETUP.md)

### Chrome APIs Used
- `chrome.storage.sync` - Config persistence across devices
- `chrome.runtime.sendMessage` - UI-to-background communication
- `chrome.commands` - Keyboard shortcut handling (Ctrl+Shift+R)
- `chrome.notifications` - Error notifications to user
- `chrome.tabs` - Current tab info for bookmark URL
- `chrome.windows` - Window/tab management

### External Libraries
- **supabase-js.min.js** - Supabase client (included as local file, not npm)
- **pico.min.css** - CSS framework (minimal styling, in `libs/`)

## Important Gotchas

1. **Service Worker Restart**: Background script can be terminated by Chrome - don't assume global state persists. Use `chrome.storage.sync` for all persistent data.

2. **CORS & Content Scripts**: Extension can access any URL via `<all_urls>` permission, but communication with pages requires content script (not currently implemented - popup only).

3. **Duplicate URLs**: System prevents duplicate URLs per user (enforced at DB level with unique constraint). Check for existing before calling `saveBookmark()`.

4. **Configuration Must Initialize**: Never skip `configManager.initialize()` - it validates Supabase credentials and auth state. Many errors stem from uninitialized config.

5. **Error Messages Are User-Facing**: Text in error messages displays in notifications and UI. Keep them clear and actionable, not technical.

6. **Real-time Subscriptions**: Must manually unsubscribe from RealtimeManager when component unmounts to prevent memory leaks and duplicate events.

## Key Documentation Files

- [docs/architecture/DESIGN.md](../docs/architecture/DESIGN.md) - Original design requirements
- [SUPABASE_SETUP.md](..](SUPABASE_SETUP.md) - Backend setup for contributors
- [docs/cursor-reports/](../docs/cursor-reports/) - Detailed analysis of specific features:
  - `BOOKMARK_MANAGEMENT_IMPLEMENTATION.md` - CRUD patterns
  - `RACE_CONDITION_FIXES.md` - Timing/sync issues resolved
  - `ERROR_HANDLING_CONSOLIDATED.md` - Error handling patterns
  - `AUTH_STATE_MANAGEMENT_FIX.md` - Auth flow details

## Quick Reference - File Purposes

| File | Purpose |
|------|---------|
| [popup.js](..](popup.js) | Main UI for marking pages + quick actions |
| [options.js](..](options.js) | Settings page (custom status types, tags, auth) |
| [background.js](..](background.js) | Message router, keyboard shortcuts, IPC hub |
| [auth-ui.js](..](auth-ui.js) | Shared login/logout UI component |
| [config-ui.js](..](config-ui.js) | Shared Supabase config UI component |
| [utils/](utils/) | All service classes (Config, Error, Auth, Bookmark, UI) |

