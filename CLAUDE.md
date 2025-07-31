# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Code Quality
- `npm run lint` - Lint code with ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run check` - Run both linting and format checking

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
- **Pico.css framework**: Use simple, semantic HTML-first styling (see Pico.css Integration Lessons section for detailed guidance)
- **Alternative libraries**: May recommend better fit if justified
- **Progressive enhancement**: Static HTML foundation enhanced with JavaScript

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
- Leverages built-in responsive design, spacing, and automatic light/dark mode support
- Minimal custom CSS approach - work WITH the framework, not against it
- See "Pico.css Integration Lessons" section below for detailed implementation guidance

### Data Flow

1. **Authentication**: Users authenticate via Supabase with JWT tokens stored in Chrome sync storage
2. **Configuration**: Secure config management prevents credentials from being committed to version control
3. **Bookmarks**: CRUD operations flow through simplified service architecture with error handling
4. **Real-time**: Supabase real-time subscriptions for cross-device sync (planned feature)
5. **Error Handling**: Centralized system with user-friendly messages and retry logic
6. **Email Confirmation**: Dedicated confirmation flow for new user email verification

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
- **6 main services**: BookmarkService, AuthService, ConfigService, StorageService, ErrorService, ValidationService
- **4 controllers**: PopupController, OptionsController, BookmarkManagerController, BaseController
- **UI files**: popup.html, options.html, bookmark-manager.html, confirm.html + CSS files
- **Chrome extension structure**: service worker (BackgroundService.js), content scripts, manifest.json

## **Comprehensive Testing Protocol**

*This is the main testing reference section. All testing commands, requirements, and workflows are documented here.*

### **Testing Commands**

**Unit Testing:**
- `npm test` - Run unit tests with Vitest
- `npm run test:unit:ui` - Run unit tests with Vitest UI
- `npm run test:unit:coverage` - Run unit tests with coverage report

**Integration Testing:**
- `npm run test:playwright` - Run integration tests with Playwright
- `npm run test:playwright:headed` - Run Playwright tests in headed mode
- `npm run test:playwright:debug` - Debug Playwright tests
- `npm run test:playwright:ui` - Run Playwright tests with UI mode

**Visual Regression Testing:**
- `npm run test:visual` - Run visual regression tests  
- `npm run test:visual:simple` - Run basic visual baseline tests
- `npm run test:visual:update` - Update visual regression baselines

**Combined Testing:**
- `npm run test:all` - Run all tests (unit + integration + visual)
- `npm run install-browsers` - Install Playwright browsers (Chromium)

### **Testing Strategy**

- **Run targeted tests during development**: Use `npm test -- tests/unit/services/SpecificService.test.js` 
- **Run full test suite only when complete**: Use `npm run test:all` when ready for comprehensive validation

### **Testing Requirements**

- **Unit tests**: Create Vitest tests when adding functionality - tests must pass before task completion
- **Integration tests**: Use Playwright for cross-component testing
- **Visual regression tests**: Critical for AI to "see" changes and match intended styling/layout

**Claude Code Automation Requirements:**
1. Before ANY UI/CSS changes: Run `npm run test:visual:simple` to establish baseline
2. After ANY UI/CSS changes: Run `npm run test:visual:simple` to detect changes
3. After any code changes: Run `npm run check` for lint + format check
4. Before completing any task with UI changes: Run `npm run test:all`

**Visual Test Coverage Requirements:**
- Every UI state must have a visual test (loading, error, success, empty, populated)
- Responsive breakpoints: mobile (320px), tablet (768px), desktop (1200px+)
- Theme variations: light mode, dark mode
- Interactive states: hover, focus, active, disabled
- Form states: empty, filled, validation errors, success messages

### **Testing Structure**

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
- Automatic detection of visual changes with pixel-perfect diff detection
- Before/after comparisons in test reports
- Coverage of responsive design and error states
- Screenshots of loading, error, success states

**Test Organization:**
- **`tests/visual/simple-visual.test.js`**: Quick baseline tests for development
- **`tests/visual/popup-visual.test.js`**: Comprehensive popup UI states
- **`tests/visual/options-visual.test.js`**: Options page scenarios
- **`tests/visual/bookmark-manager-visual.test.js`**: Bookmark manager states

### **Test Failure Response Protocol**

If tests fail:
1. **DON'T ignore test failures** - they often catch real issues
2. **For visual test failures**: 
   - Open the HTML test report to see visual diffs
   - Zoom into differences - often reveals subtle issues
   - Check multiple browser sizes - responsive issues are common
   - Verify if changes are intentional or bugs
   - Only update baselines if changes are correct
   - DON'T immediately update baselines - investigate first
3. **For unit test failures**: Fix the logic issue before proceeding
4. **For lint failures**: Run `npm run lint:fix` to auto-fix, then review changes
5. **For integration test failures**: Debug with `npm run test:playwright:debug`

### **Visual Testing Workflow**

1. **Run baseline tests first**: `npm run test:visual` 
2. **Make your changes**
3. **Run visual tests again**: `npm run test:visual`
4. **Review diffs in test report** (usually `playwright-report/index.html`)
5. **If changes look correct**: `npm run test:visual:update`
6. **If changes look wrong**: Fix the issue and repeat

**Key Points:**
- **ALWAYS run visual tests** when changing CSS, HTML, or UI JavaScript
- **Review screenshot diffs carefully** in test reports before approving changes
- **Update baselines intentionally** only when visual changes are desired
- **Visual tests prevent UI regressions** that are hard to catch manually

### Security Considerations

- **Never commit** `supabase-config.local.js` or credentials
- **Row Level Security** ensures user data isolation
- **CSP compliant** implementation with no external script loading
- **Secure credential storage** in Chrome sync storage
- **JWT token** based authentication with automatic refresh

### Console Statement Policy

Console statements are intentionally kept in the codebase for debugging purposes and should not be removed unless explicitly requested. The ESLint configuration treats `console` statements as warnings (not errors) to allow for debugging output while still being visible during linting.

### Email Confirmation System

The extension includes a dedicated email confirmation flow for new user registration:
- **confirm.html**: Main confirmation page with full UI/branding
- **confirm.js**: Handles confirmation token processing and UI updates
- **confirm-simple.js**: Simplified handler for basic confirmation scenarios
- **URL Pattern**: `/src/ui/confirm.html#access_token=...&type=signup`

The confirmation system automatically extracts tokens from Supabase email links and updates the user's verification status.

### Common Development Patterns

- **Error Handling**: Always use the centralized ErrorService with `this.errorService.handle(error, 'Context.method')`
- **Service Dependencies**: Services use constructor injection pattern for dependency injection
- **Visual Testing**: Include screenshot tests for UI changes using `await expect(page).toHaveScreenshot()`

### **CRITICAL Development Workflow: Work on One Problem at a Time**

**Claude Code MUST follow this incremental development approach:**

- **Work on ONE logical unit of work at a time** - complete each feature/fix fully before moving to the next
- **Each unit of work should result in ONE git commit** - this makes the change history clear and allows for easy rollbacks
- **Exception: Super simple bug fixes** - only combine multiple trivial fixes (like typos, formatting) into a single commit
- **Never batch unrelated changes** - UI changes, logic fixes, and new features should be separate commits

**Complete Development Cycle for Each Change:**
1. **Setup**: Follow dev-docs/DEVELOPMENT_SETUP.md for quick start (first time only)
2. **Make the change**: Implement the specific feature/fix
3. **Run tests**: `npm run check` + visual tests if UI changes (see Testing Commands section)
4. **Verify the fix works**: Test the actual functionality
5. **Visual Changes**: Use `npm run test:visual:update` to update baselines when changes are intentional
6. **Final validation**: Run `npm run test:all` before committing (includes visual regression)
7. **Commit**: Commit the change with a descriptive message
8. **Debugging**: Use `npm run test:playwright:debug` for integration test debugging as needed
9. **THEN move to the next item**

**Benefits**: Clear change history, easy rollbacks, better testing, reduced conflicts, easier debugging.


### Important Development Notes

- **JSDoc is required** for all public APIs and service interfaces
- **Visual regression tests must pass** - update baselines only when changes are intentional  
- **Follow dependency injection pattern** for all services
- **Use centralized error handling** - never throw raw errors to users
- **Maintain CSP compliance** - no external scripts or eval()
- **Test behavior, not implementation** - focus on user workflows

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

**Core Principles - Work WITH the framework, not against it:**
- **Use built-in classes**: Leverage Pico's `secondary`, `contrast`, `outline` classes instead of custom CSS
- **Dark mode compatibility**: Pico's built-in classes automatically handle light/dark mode - custom CSS often breaks this
- **Semantic HTML first**: Use proper HTML elements (`<fieldset>`, `<button>`, etc.) that Pico styles automatically
- **Debugging approach**: When styling doesn't work, first check if you're using proper Pico classes before adding custom CSS
- **JavaScript integration**: Use class toggling (`classList.add('secondary')`) to change button states rather than custom CSS

**Architecture Integration:**
- **Responsive design**: Leverage Pico's built-in responsive breakpoints and spacing
- **CSS variables**: Use Pico's CSS custom properties for consistent theming
- **Minimal custom CSS**: Only add custom styles when Pico's built-in options are insufficient

**Tab Button Pattern**: Use `classList.remove('secondary')` for primary styling, `classList.add('secondary')` for secondary styling.

---

## **UI Development Best Practices**

### **MANDATORY UI Development Process**

1. **Before UI changes**: Run visual baseline tests
2. **During development**: 
   - Measure element dimensions using `element.boundingBox()`
   - Check computed styles with `getComputedStyle()`
   - Test responsive breakpoints (320px, 768px, 1200px+)
   - Take screenshots for debugging
3. **After changes**: Run visual regression tests and review diffs in `playwright-report/index.html`

### **Layout Debugging Approach**
1. Inspect element hierarchy in browser dev tools
2. Check computed styles vs CSS declarations  
3. Verify Pico.css classes are applied correctly
4. Test with minimal reproduction case
5. Measure actual results, don't assume CSS behavior