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
- `npm run install-browsers` - Install Playwright browsers (Chromium)

### Code Quality
- `npm run lint` - Lint code with ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run check` - Run both linting and format checking

## Architecture Overview

This is a Chrome extension built with Manifest V3 that helps users mark websites as "read" for research purposes, with Supabase backend integration.

### Key Architectural Patterns

**Modular Service Architecture**: The codebase uses a modular architecture with three main service layers:
- `supabase-service/` - Modular Supabase operations (bookmarks, auth, preferences, realtime)
- `utils/error-handler/` - Centralized error handling with categorization and user-friendly messages
- `utils/config-manager/` - Unified configuration management with validation and migration

**Component Structure**: Each major service is organized into modules:
- `modules/` - Core functionality modules
- `utils/` - Utility functions and helpers
- `index.js` - Main coordinator that orchestrates modules using dependency injection

**Chrome Extension Architecture**:
- `popup.js` - Main popup interface (uses `popup/` modules)
- `options.js` - Settings page (uses `options/` modules)  
- `background.js` - Service worker for background operations
- `bookmark-management.html` - Dedicated bookmark management interface

**Static HTML Foundation**: The extension follows a "static-first, enhance progressively" architecture:
- `popup.html`, `options.html`, `bookmark-management.html` - Semantic HTML structure with accessibility features
- JavaScript enhances static HTML with show/hide logic instead of dynamic DOM generation
- Improved performance (15-30% faster initial render), accessibility (immediate screen reader access), and maintainability

**Pico.css Integration**: Consistent design system using Pico CSS v2 conventions:
- Semantic HTML forms using `<fieldset>` elements for proper grouping and accessibility
- Standard Pico button classes: default (primary), `secondary`, `contrast` - no custom button classes
- Minimal custom CSS - leverages Pico's built-in responsive design and spacing
- CSS variables for consistent theming and customization

### Data Flow

1. **Authentication**: Users authenticate via Supabase with JWT tokens stored in Chrome sync storage
2. **Configuration**: Secure config management prevents credentials from being committed to version control
3. **Bookmarks**: CRUD operations flow through modular service architecture with error handling
4. **Real-time**: Supabase real-time subscriptions for cross-device sync
5. **Error Handling**: Centralized system with user-friendly messages and retry logic

### Key Technologies
- **Manifest V3** Chrome extension with service workers
- **Supabase** for backend (PostgreSQL with Row Level Security)
- **ES6 Modules** with dependency injection pattern
- **CSP Compliant** - no external scripts, uses bundled supabase-js.min.js
- **Vitest** for unit testing with JSDOM environment
- **Playwright** for integration testing

### Testing Strategy ✅ IMPROVED

**Behavior-Focused Unit Tests** (`tests/unit/`):
- Test real user workflows and component behavior
- Use Vitest with JSDOM for actual DOM testing
- Mock only external APIs (Chrome, Supabase) - never internal logic
- Discovered 15+ real bugs through improved testing approach
- 93% reduction in mock complexity (1,378 → 100 lines)

**Integration Tests**:
- Cross-component workflow testing
- Chrome extension API integration validation
- Real user journey testing from popup to background scripts

**Testing Quality Improvements**:
- Large monolithic test files split into focused modules
- Tests now catch real user-facing bugs immediately
- Behavior-focused approach prevents over-mocking syndrome
- **All major discovered bugs have been fixed**: accessibility, API integration, DOM safety, button behavior, auth sync

### Security Considerations

- **Never commit** `supabase-config.local.js` or credentials
- **Row Level Security** ensures user data isolation
- **CSP compliant** implementation with no external script loading
- **Secure credential storage** in Chrome sync storage
- **JWT token** based authentication with automatic refresh

### Common Development Patterns

**Error Handling**: Always use the centralized ErrorHandler:
```javascript
import ErrorHandler from './utils/error-handler.js';
const result = ErrorHandler.handle(error, 'context.operation');
```

**Configuration**: Use ConfigManager for all settings:
```javascript
import ConfigManager from './utils/config-manager.js';
const config = await configManager.getSupabaseConfig();
```

**Service Operations**: Services follow dependency injection pattern:
```javascript
class MyService {
  constructor(dependencies) {
    this.config = dependencies.config;
    this.errorHandler = dependencies.errorHandler;
  }
}
```

### Important Files to Understand

- `supabase-service/index.js` - Main service orchestrator
- `utils/error-handler/index.js` - Centralized error handling
- `utils/config-manager/index.js` - Configuration management
- `tests/helpers/test-factories.js` - Test data creation utilities
- `supabase-schema.sql` - Database schema definition

### Development Workflow

1. **Setup**: Follow SUPABASE_SETUP.md for backend configuration
2. **Testing**: Run `npm test && npm run test:playwright` before committing
3. **Code Quality**: Run `npm run check` to ensure linting and formatting
4. **Debugging**: Use `npm run test:playwright:debug` for integration test debugging