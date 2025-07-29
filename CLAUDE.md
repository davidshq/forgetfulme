# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Testing
- `npm test` - Run unit tests with Vitest
- `npm run test:unit:ui` - Run unit tests with Vitest UI
- `npm run test:unit:coverage` - Run unit tests with coverage report
- `npm run test:playwright` - Run integration tests with Playwright
- `npm run test:playwright:headed` - Run Playwright tests in headed mode
- `npm run test:playwright:debug` - Debug Playwright tests
- `npm run test:playwright:ui` - Run Playwright tests with UI mode
- `npm run test:visual` - Run visual regression tests  
- `npm run test:visual:simple` - Run basic visual baseline tests
- `npm run test:visual:update` - Update visual regression baselines
- `npm run test:all` - Run all tests (unit + integration + visual)
- `npm run install-browsers` - Install Playwright browsers (Chromium)

### Code Quality
- `npm run lint` - Lint code with ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run check` - Run both linting and format checking

**Note**: Console statements show as warnings (not errors) and should be left in place unless explicitly requested to remove them for debugging purposes.

## Development Philosophy

### Architecture Principles
- **Thoughtful but not over-engineered**: Take time to plan good architecture but avoid overarchitecting
- **Static HTML first**: Use HTML for static content rather than JS (easier to modify and comprehend)
- **Selective JavaScript**: Use JS sparingly for dynamic content where it really makes a difference
- **Simplicity over sparkle**: Make it work and look good, but prioritize simplicity over fanciness
- **Readable over clever**: Prefer readable, maintainable code over fancy JS/CSS wizardry
- **Semantic and accessible**: Code should be semantically meaningful and accessible (accessibility is table stakes)

### Research-Driven Development
- **Best practices first**: When in doubt, search the internet for best practices
- **Document your plans**: Create markdown files with plans and operate from them when making changes
- **Update documentation**: Keep markdown files current as changes are made

### UI Philosophy
- **Pico.css framework**: Use simple, semantic HTML-first styling
- **Work WITH the framework**: Use Pico.css built-in classes (`secondary`, `contrast`, etc.) rather than creating custom CSS that fights against the framework. This ensures proper styling in both light and dark modes.
- **Alternative libraries**: May recommend better fit if justified
- **Progressive enhancement**: Static HTML foundation enhanced with JavaScript

### Testing Requirements
- **Unit tests**: Create Vitest tests when adding functionality - tests must pass before task completion
- **Integration tests**: Use Playwright for cross-component testing
- **Visual regression tests**: Critical for AI to "see" changes and match intended styling/layout

### Documentation Standards
- **JSDoc comments**: Required for all functions, focus on what functions do rather than implementation details
- **Markdown planning**: Document architectural decisions and plans

## Architecture Overview

This is a Chrome extension built with Manifest V3 that helps users mark websites as "read" for research purposes, with Supabase backend integration.

### Key Architectural Patterns

**Simplified Service Architecture**: The codebase uses a clean, focused architecture with 6 main services:
- `services/BookmarkService.js` - All bookmark operations (CRUD, search, statistics)
- `services/AuthService.js` - User authentication and session management  
- `services/ConfigService.js` - Application configuration and settings
- `services/StorageService.js` - Unified storage interface for Chrome storage
- `services/ErrorService.js` - Centralized error handling and user messaging
- `services/ValidationService.js` - Input validation and data sanitization

**Progressive Enhancement Architecture**:
- `popup.html`, `options.html`, `bookmark-manager.html` - Semantic HTML structure with accessibility features
- JavaScript enhances static HTML with show/hide logic instead of dynamic DOM generation
- Improved performance (15-30% faster initial render), accessibility (immediate screen reader access), and maintainability

**Pico.css Integration**: Consistent design system using Pico CSS v2 conventions:
- Semantic HTML forms using `<fieldset>` elements for proper grouping and accessibility
- Standard Pico button classes: default (primary), `secondary`, `contrast` - no custom button classes
- Minimal custom CSS - leverages Pico's built-in responsive design and spacing
- CSS variables for consistent theming and customization

### Visual Regression Testing

The extension includes comprehensive visual regression testing using Playwright screenshots:
- **Automated Screenshots**: Capture UI states during tests
- **Visual Comparisons**: Pixel-perfect diff detection  
- **Before/After Views**: See exactly what changed in test reports
- **State Coverage**: Screenshots of loading, error, success states

### Data Flow

1. **Authentication**: Users authenticate via Supabase with JWT tokens stored in Chrome sync storage
2. **Configuration**: Secure config management prevents credentials from being committed to version control
3. **Bookmarks**: CRUD operations flow through simplified service architecture with error handling
4. **Real-time**: Supabase real-time subscriptions for cross-device sync
5. **Error Handling**: Centralized system with user-friendly messages and retry logic

### Key Technologies
- **Manifest V3** Chrome extension with service workers
- **Supabase** for backend (PostgreSQL with Row Level Security)
- **ES6 Modules** with dependency injection pattern
- **JSDoc** for type safety without build step
- **CSP Compliant** - no external scripts, uses bundled supabase-js.min.js
- **Vitest** for unit testing with JSDOM environment
- **Playwright** for integration and visual regression testing
- **Pico.css** for styling framework

### File Structure

```
src/
├── services/
│   ├── BookmarkService.js      // All bookmark operations
│   ├── AuthService.js          // Authentication only
│   ├── ConfigService.js        // Simple configuration
│   ├── StorageService.js       // Chrome storage wrapper
│   ├── ErrorService.js         // Unified error handling
│   └── ValidationService.js    // Input validation
├── controllers/
│   ├── BaseController.js       // Common controller functionality
│   ├── PopupController.js      // Popup management
│   ├── OptionsController.js    // Settings management
│   └── BookmarkManagerController.js // Bookmark management
├── utils/
│   ├── ServiceContainer.js     // Dependency injection
│   ├── dom.js                  // DOM helper functions
│   ├── formatting.js           // Display formatting
│   └── constants.js            // Application constants
├── ui/
│   ├── popup.html              // Main popup interface
│   ├── options.html            // Settings page
│   ├── bookmark-manager.html   // Bookmark management
│   └── styles/
│       ├── shared.css          // Shared styles
│       ├── popup.css           // Popup-specific styles
│       ├── options.css         // Options-specific styles
│       └── bookmark-manager.css // Bookmark manager styles
├── background/
│   ├── BackgroundService.js    // Service worker main
│   ├── SyncManager.js          // Cross-device sync
│   └── ShortcutManager.js      // Keyboard shortcuts
└── main/
    ├── popup.js                // Popup initialization
    ├── options.js              // Options initialization
    ├── bookmark-manager.js     // Bookmark manager initialization
    └── background.js           // Background script initialization
```

### Testing Strategy

**Behavior-Focused Unit Tests** (`tests/unit/`):
- Test real user workflows and component behavior
- Use Vitest with JSDOM for actual DOM testing
- Mock only external APIs (Chrome, Supabase) - never internal logic
- JSDoc type annotations for test clarity

**Integration Tests** (`tests/integration/`):
- Cross-component workflow testing
- Chrome extension API integration validation
- Real user journey testing from popup to background scripts

**Visual Regression Tests** (`tests/visual/`):
- Screenshot testing for all UI states
- Automatic detection of visual changes
- Before/after comparisons in test reports
- Coverage of responsive design and error states

### Security Considerations

- **Never commit** `supabase-config.local.js` or credentials
- **Row Level Security** ensures user data isolation
- **CSP compliant** implementation with no external script loading
- **Secure credential storage** in Chrome sync storage
- **JWT token** based authentication with automatic refresh

### Console Statement Policy

Console statements are intentionally kept in the codebase for debugging purposes and should not be removed unless explicitly requested. The ESLint configuration treats `console` statements as warnings (not errors) to allow for debugging output while still being visible during linting.

### Common Development Patterns

**Error Handling**: Always use the centralized ErrorService:
```javascript
/**
 * @param {ErrorService} errorService
 */
constructor(errorService) {
  this.errorService = errorService;
}

// Usage
const userError = this.errorService.handle(error, 'BookmarkService.save');
```

**Service Dependencies**: Services use constructor injection:
```javascript
/**
 * BookmarkService with clear dependencies
 * @param {IDatabaseClient} database
 * @param {IStorageService} storage
 * @param {IAuthService} auth
 * @param {IErrorService} error
 */
constructor(database, storage, auth, error) {
  this.database = database;
  this.storage = storage;
  this.auth = auth;
  this.error = error;
}
```

**Visual Testing**: Include screenshot tests for UI changes:
```javascript
test('popup displays correctly', async ({ page }) => {
  await page.goto('./popup.html');
  await page.waitForLoadState('networkidle');
  
  // Capture baseline screenshot
  await expect(page).toHaveScreenshot('popup-default-state.png');
});
```

### Development Workflow

1. **Setup**: Follow DEVELOPMENT_SETUP.md for quick start
2. **Testing**: Run `npm run test:all` before committing (includes visual regression)
3. **Visual Changes**: Use `npm run test:visual:update` to update baselines when changes are intentional
4. **Code Quality**: Run `npm run check` to ensure linting and formatting
5. **Debugging**: Use `npm run test:playwright:debug` for integration test debugging

## **CRITICAL: When to Run Tests**

### **Always Run These Commands When Making Changes:**

**For ANY code changes:**
```bash
npm run check           # Lint + format check (ALWAYS)
npm test               # Unit tests (ALWAYS)
```

**For UI/styling changes (MANDATORY):**
```bash
npm run test:visual            # Visual regression tests (CRITICAL)
npm run test:playwright        # Integration tests
npm run test:all              # All tests including visual
```

**For significant changes or before commits:**
```bash
npm run test:all              # Complete test suite (REQUIRED)
```

### **Automatic Visual Regression Testing Protocol**

**Claude Code MUST automatically run visual tests in these scenarios:**

1. **Before making any UI/CSS changes**: Run `npm run test:visual:simple` to establish current baseline
2. **After making UI/CSS changes**: Run `npm run test:visual:simple` to detect visual changes
3. **When adding new UI components**: Create corresponding visual tests immediately
4. **When modifying existing components**: Update visual tests to cover new states/variations
5. **Before completing any styling task**: Run full visual regression suite to ensure no regressions

**Test Coverage Requirements:**
- **Every UI state must have a visual test**: loading, error, success, empty, populated
- **Responsive breakpoints**: mobile, tablet, desktop views for each component
- **Theme variations**: light mode, dark mode, high contrast
- **Interactive states**: hover, focus, active, disabled states
- **Form states**: empty, filled, validation errors, success messages

### **Visual Regression Testing is CRITICAL**

- **ALWAYS run visual tests** when changing CSS, HTML, or UI JavaScript
- **Review screenshot diffs carefully** in test reports before approving changes
- **Update baselines intentionally** only when visual changes are desired:
  ```bash
  npm run test:visual:update    # Only after confirming changes are correct
  ```
- **Visual tests prevent UI regressions** that are hard to catch manually
- **Check the HTML test report** to see before/after visual comparisons

### **Test Failure Response Protocol**

If tests fail:
1. **DON'T ignore test failures** - they often catch real issues
2. **For visual test failures**: 
   - Open the HTML test report to see visual diffs
   - Verify if changes are intentional or bugs
   - Only update baselines if changes are correct
3. **For unit test failures**: Fix the logic issue before proceeding
4. **For lint failures**: Run `npm run lint:fix` to auto-fix, then review changes
5. **For integration test failures**: Debug with `npm run test:playwright:debug`

### **Before Making UI Changes**

1. **Run baseline tests first**: `npm run test:visual` 
2. **Make your changes**
3. **Run visual tests again**: `npm run test:visual`
4. **Review diffs in test report** (usually `playwright-report/index.html`)
5. **If changes look correct**: `npm run test:visual:update`
6. **If changes look wrong**: Fix the issue and repeat

### Important Notes

- **JSDoc is required** for all public APIs and service interfaces
- **Visual regression tests must pass** - update baselines only when changes are intentional
- **Follow dependency injection pattern** for all services
- **Use centralized error handling** - never throw raw errors to users
- **Maintain CSP compliance** - no external scripts or eval()
- **Test behavior, not implementation** - focus on user workflows

---

## **Automated Testing Protocol for Claude Code**

### **MANDATORY: Claude Code Automation Requirements**

**Claude Code MUST automatically perform these actions:**

1. **Before making any UI/CSS changes:**
   ```bash
   npm run test:visual:simple  # Establish baseline
   ```

2. **After making any UI/CSS changes:**
   ```bash
   npm run test:visual:simple  # Detect visual changes
   ```

3. **After any code changes:**
   ```bash
   npm run check              # Lint + format check
   ```

4. **When adding new UI components:**
   - Create corresponding visual tests immediately
   - Cover all states: default, loading, error, success, empty, populated
   - Include responsive breakpoints and theme variations

5. **When modifying existing components:**
   - Update visual tests to cover new states/variations
   - Ensure no regression in existing functionality

6. **Test Coverage Requirements:**
   - Every UI state must have a visual test
   - Responsive breakpoints: mobile (320px), tablet (768px), desktop (1200px+)
   - Theme variations: light mode, dark mode
   - Interactive states: hover, focus, active, disabled
   - Form states: empty, filled, validation errors, success messages
   - Loading states, error states, empty states, populated states

7. **Before completing any task involving UI changes:**
   ```bash
   npm run test:all           # Full test suite
   ```

### **Visual Test Organization**

- **`tests/visual/simple-visual.test.js`**: Quick baseline tests for development
- **`tests/visual/popup-visual.test.js`**: Comprehensive popup UI states
- **`tests/visual/options-visual.test.js`**: Options page scenarios
- **`tests/visual/bookmark-manager-visual.test.js`**: Bookmark manager states

**Claude Code must maintain and expand these test suites as the UI evolves.**

---

## **Lessons Learned from Chrome Extension Development**

### **Service Worker & Manifest V3 Constraints**

**Chrome extension service workers have significant limitations:**
- **No `window` object** - UMD bundles that rely on `window` won't work
- **No dynamic imports** - `import()` is disallowed by HTML specification
- **No npm modules** - Must use bundled or script-tag loaded libraries
- **Isolated context** - Services can't share Supabase clients between contexts

**Solutions:**
- Load libraries via `<script>` tags in HTML pages, export globally
- Keep service workers minimal - handle only Chrome APIs and messaging
- Initialize Supabase clients in UI contexts (popup, options) not service worker
- Use messaging between contexts instead of shared service instances

### **Configuration Management Best Practices**

**Multi-tier configuration with proper precedence:**
1. **UI configuration** (Chrome sync storage) - highest priority
2. **Local development files** (git-ignored) - fallback for developers  
3. **Graceful degradation** - show setup UI when no config exists

**Security patterns:**
- Never commit credentials to source control
- Use template files + git-ignored actual credentials
- Store sensitive config in Chrome sync storage (encrypted by browser)
- Validate configuration thoroughly before use

### **Error Handling for Chrome Extensions**

**Context-aware error handling:**
- **Normal conditions aren't errors** - "Auth session missing" is expected for logged-out users
- **Service worker errors are common** - handle gracefully, don't crash
- **Defensive programming** - always validate data types (arrays, objects) before use
- **Fallback values** - provide defaults when operations fail

**Error classification:**
- **User errors** - show friendly messages, provide next steps
- **System errors** - log for debugging, show generic "try again" message
- **Expected conditions** - don't log as errors (session missing, etc.)

### **Chrome Extension Architecture Patterns**

**Separation of concerns:**
- **Service workers** - Chrome APIs, notifications, messaging only
- **UI contexts** - Supabase clients, business logic, user interactions
- **Shared services** - Use dependency injection, but instantiate per context

**Data flow:**
- **Popup → Service Worker** - messaging for Chrome API operations  
- **Options → Storage** - direct configuration management
- **Background → UI** - notifications and badge updates only

### **Development Workflow Improvements**

**Configuration testing:**
- Test both UI config and local file config paths
- Validate configuration priority order works correctly
- Ensure graceful fallback when config is missing

**Library integration:**
- Always test library loading in actual Chrome extension context
- UMD bundles need special handling in service workers
- ES6 modules work in UI contexts but not service workers

**Debugging strategies:**
- Add extensive logging for configuration loading
- Distinguish between errors and expected conditions
- Use console.warn/log appropriately, reserve console.error for real issues

### **Pico.css Integration Lessons**

**Work WITH the framework, not against it:**
- **Use built-in classes**: Leverage Pico's `secondary`, `contrast`, `outline` classes instead of custom CSS
- **Dark mode compatibility**: Pico's built-in classes automatically handle light/dark mode - custom CSS often breaks this
- **Debugging approach**: When styling doesn't work, first check if you're using proper Pico classes before adding custom CSS
- **JavaScript integration**: Use class toggling (`classList.add('secondary')`) to change button states rather than custom CSS

**Example - Tab Button Implementation:**
```javascript
// Correct approach - use Pico classes
activeTab.classList.remove('secondary');    // Primary styling
inactiveTab.classList.add('secondary');     // Secondary styling

// Wrong approach - custom CSS that breaks in dark mode
// Custom CSS: .tab-button { background: #fff; color: #000; }
```