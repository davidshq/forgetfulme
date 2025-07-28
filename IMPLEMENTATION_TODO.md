# ForgetfulMe Chrome Extension - Complete Implementation Todo

**Last Updated**: 2025-07-28

## Project Overview
ForgetfulMe is a Chrome extension (Manifest V3) that helps researchers track websites they've read. Features cross-device sync with Supabase backend, customizable status types, and comprehensive testing with visual regression.

## Architecture
- **6 Core Services**: BookmarkService, AuthService, ConfigService, StorageService, ErrorService, ValidationService
- **Tech Stack**: Vanilla ES6+ JavaScript with JSDoc types, Pico.css v2, Supabase backend
- **Testing**: Vitest (unit), Playwright (integration + visual regression)
- **Security**: Row Level Security, CSP compliant, no external scripts

## Current Status Summary
- **Core Infrastructure**: ✅ Complete (Phase 1)
- **Service Layer**: ✅ Mostly complete, missing some tests (Phase 2)
- **Database Integration**: ❌ Not started (Phase 3)
- **UI Components**: ✅ Complete (Phase 4)
- **Controllers**: ✅ Complete, missing tests (Phase 5)
- **Background Services**: ⚠️ Partial (1 of 3 services) (Phase 6)
- **Entry Points**: ✅ Complete (Phase 7)
- **Testing**: ⚠️ Partial coverage (Phase 8)
- **Security & Config**: ❌ Not implemented (Phase 9)
- **Performance**: ❌ Not optimized (Phase 10)
- **Production**: ❌ Not ready (Phase 11-12)

---

## Phase 1: Project Foundation & Core Architecture

### 1.1 Project Setup
- [x] Initialize npm project with package.json
- [x] Install dependencies: Vitest, Playwright, ESLint, Prettier
- [x] Create manifest.json (Manifest V3)
- [x] Set up folder structure according to architecture docs
- [x] Configure development scripts in package.json
- [x] Set up .gitignore (exclude supabase-config.local.js)

### 1.2 Development Infrastructure
- [x] Create ESLint configuration
- [x] Set up Prettier configuration  
- [x] Configure Vitest for unit testing
- [x] Set up Playwright for integration/E2E testing
- [x] Create testing utilities and mock factories
- [x] Set up Chrome extension development environment

### 1.3 Core Utilities & Constants
- [x] Create `src/utils/constants.js` - Application constants
- [x] Create `src/utils/dom.js` - DOM helper functions
- [x] Create `src/utils/formatting.js` - Display formatting utilities
- [x] Create `src/utils/ServiceContainer.js` - Dependency injection container
- [x] Create `src/types/jsdoc-types.js` - Shared JSDoc type definitions

---

## Phase 2: Service Layer Implementation

### 2.1 Error Service (Foundation)
- [x] Create `src/services/ErrorService.js`
- [x] Implement error categorization (NETWORK, AUTH, VALIDATION, DATABASE, CONFIG, STORAGE, PERMISSION, UNKNOWN)
- [x] Add error severity levels (LOW, MEDIUM, HIGH, CRITICAL)
- [x] Create user-friendly error message generation
- [x] Add retry logic for retryable errors
- [x] Provide recovery actions for each error type
- [x] Implement context-aware error handling (popup vs options vs manager)
- [x] Add error logging and reporting
- [x] Write comprehensive unit tests

### 2.2 Validation Service
- [x] Create `src/services/ValidationService.js`
- [x] Implement all JSDoc interfaces from API_INTERFACES.md
- [x] Use ValidationResult<T> pattern for all validation methods
- [x] Implement URL validation and normalization
- [x] Add email validation with proper format checking
- [x] Create bookmark data validation
- [x] Add input sanitization methods (XSS prevention)
- [x] Implement business rule validation
- [x] Add tag validation (no empty strings, length limits)
- [x] Write comprehensive validation tests

### 2.3 Storage Service
- [x] Create `src/services/StorageService.js`
- [x] Implement Chrome storage wrapper (sync + local)
- [x] Add session management
- [x] Create bookmark caching system
- [x] Implement configuration storage
- [x] Add storage change listeners
- [x] Write storage service tests

### 2.4 Config Service
- [x] Create `src/services/ConfigService.js`
- [x] Implement Supabase configuration management
- [x] Add status types management
- [x] Create user preferences handling
- [x] Add configuration validation
- [x] Implement default configuration setup
- [ ] Write config service tests

### 2.5 Auth Service
- [x] Create `src/services/AuthService.js`
- [x] Implement Supabase authentication wrapper
- [x] Add sign in/sign up/sign out methods
- [x] Create session management
- [x] Add authentication state listeners
- [x] Implement token refresh logic
- [ ] Write authentication tests

### 2.6 Bookmark Service
- [x] Create `src/services/BookmarkService.js`
- [x] Implement CRUD operations with full JSDoc interface
- [x] Use PaginatedResult<T> for large dataset handling
- [x] Add search and filtering with full-text search
- [x] Create statistics generation (by status, tags, activity)
- [x] Add bulk operations (delete, update status, add/remove tags)
- [ ] Implement import/export functionality (JSON, CSV, browser bookmarks)
- [ ] Add tag cloud generation and activity timeline
- [x] Support for 100,000+ bookmarks per user
- [ ] Write comprehensive bookmark tests

---

## Phase 3: Database & Backend Integration

### 3.1 Database Schema
- [ ] Set up Supabase project
- [ ] Implement database schema from `DATABASE_SCHEMA.md`
- [ ] Create user_profiles table with JSONB preferences
- [ ] Set up status_types table with default types
- [ ] Create bookmarks table with all metadata and constraints
- [ ] Configure Row Level Security policies for data isolation
- [ ] Add database indexes for performance (GIN, full-text search)
- [ ] Implement stored functions (search_bookmarks, bulk_update_bookmarks)
- [ ] Create views (bookmark_stats_view, tag_stats_view)
- [ ] Set up partitioning strategy for large datasets (100,000+ bookmarks)
- [ ] Add data migration functions for version upgrades

### 3.2 Database Client Interface
- [ ] Create database client abstraction
- [ ] Implement Supabase client wrapper
- [ ] Add query builder interface
- [ ] Create real-time subscription handling
- [ ] Add connection testing
- [ ] Implement error handling for database operations

### 3.3 Authentication Integration
- [ ] Configure Supabase Auth settings
- [ ] Disable email confirmation for Chrome extension use
- [ ] Handle chrome-extension:// URL limitations
- [ ] Set up user profile auto-creation with triggers
- [ ] Implement JWT token management with automatic refresh
- [ ] Test complete authentication workflows
- [ ] Add session validation across contexts
- [ ] Implement secure session persistence in Chrome storage
- [ ] Add cross-device auth sync
- [ ] Create manual verification through extension UI (if needed)

---

## Phase 4: UI Components & HTML Structure

### 4.1 Base HTML Structure
- [ ] Create `src/ui/popup.html` - Main extension popup (350-400px width)
- [ ] Create `src/ui/options.html` - Settings page
- [ ] Create `src/ui/bookmark-manager.html` - Bookmark management interface
- [ ] Include Pico.css v2 CDN links
- [ ] Use progressive enhancement pattern (static HTML + JavaScript enhancement)
- [ ] Add semantic HTML structure with ARIA attributes (WCAG 2.1 AA)
- [ ] Implement proper form structures with fieldsets
- [ ] Add data-testid attributes for testing
- [ ] Ensure screen reader compatibility throughout
- [ ] Add focus management with logical tab order

### 4.2 CSS Styling
- [ ] Create `src/ui/styles/shared.css` - Common styles
- [ ] Create `src/ui/styles/popup.css` - Popup-specific styles
- [ ] Create `src/ui/styles/options.css` - Options page styles
- [ ] Create `src/ui/styles/bookmark-manager.css` - Manager styles
- [ ] Implement responsive design
- [ ] Add accessibility-focused styling

### 4.3 Base Controller
- [ ] Create `src/controllers/BaseController.js`
- [ ] Implement common controller functionality
- [ ] Add error handling methods
- [ ] Create message display utilities
- [ ] Add cleanup/destroy methods
- [ ] Write base controller tests

---

## Phase 5: Controller Implementation

### 5.1 Popup Controller
- [ ] Create `src/controllers/PopupController.js`
- [ ] Implement authentication interface switching
- [ ] Add current page info loading
- [ ] Create bookmark form handling
- [ ] Implement recent bookmarks display
- [ ] Add status change handling
- [ ] Write popup controller tests

### 5.2 Options Controller
- [ ] Create `src/controllers/OptionsController.js`
- [ ] Implement Supabase configuration UI
- [ ] Add status types management
- [ ] Create user preferences handling
- [ ] Add connection testing
- [ ] Implement data import/export
- [ ] Write options controller tests

### 5.3 Bookmark Manager Controller
- [ ] Create `src/controllers/BookmarkManagerController.js`
- [ ] Implement bookmark listing with pagination
- [ ] Add search and filtering UI
- [ ] Create bulk operations
- [ ] Add bookmark editing interface
- [ ] Implement sorting and view options
- [ ] Write manager controller tests

---

## Phase 6: Background Services

### 6.1 Service Worker
- [ ] Create `src/background/BackgroundService.js`
- [ ] Implement extension lifecycle management
- [ ] Add message handling between contexts
- [ ] Create keyboard shortcut handling
- [ ] Add notification management
- [ ] Implement sync operations
- [ ] Write background service tests

### 6.2 Sync Manager
- [ ] Create `src/background/SyncManager.js`
- [ ] Implement real-time data synchronization
- [ ] Add conflict resolution
- [ ] Create sync status tracking
- [ ] Add offline support
- [ ] Implement batch sync operations
- [ ] Write sync manager tests

### 6.3 Shortcut Manager
- [ ] Create `src/background/ShortcutManager.js`
- [ ] Implement keyboard shortcut registration
- [ ] Add Ctrl+Shift+R bookmark marking
- [ ] Create context menu integration
- [ ] Add customizable shortcuts
- [ ] Write shortcut tests

---

## Phase 7: Main Entry Points

### 7.1 Entry Point Scripts
- [x] Create `src/main/popup.js` - Popup initialization
- [x] Create `src/main/options.js` - Options page initialization
- [x] Create `src/main/bookmark-manager.js` - Manager initialization
- [x] Create `src/main/background.js` - Background script initialization
- [x] Implement service container setup
- [x] Add dependency injection wiring

### 7.2 Service Registration
- [x] Configure service container registration
- [x] Set up dependency injection for all services
- [x] Add singleton pattern for shared services
- [x] Create service factory methods
- [x] Implement proper service lifecycle

---

## Phase 8: Testing Implementation

### 8.1 Unit Test Suite
- [~] Write service layer unit tests (target: 95% pass rate) - Partial: ErrorService, StorageService, ValidationService done
- [ ] Create controller unit tests
- [x] Add utility function tests
- [x] Implement mock factories
- [x] Create test data factories
- [x] Set up code coverage reporting

### 8.2 Integration Tests
- [x] Write Chrome extension API integration tests
- [ ] Create cross-context message tests
- [ ] Add authentication workflow tests
- [ ] Implement database integration tests
- [ ] Test real-time sync operations
- [ ] Create error handling integration tests

### 8.3 E2E & Visual Regression Tests
- [x] Set up Playwright E2E test suite
- [ ] Create complete user workflow tests (first-time setup, daily use)
- [ ] Extension environment testing with real extension ID discovery
- [ ] Cross-device synchronization simulation
- [ ] Performance and memory testing under load
- [x] Implement visual regression testing (screenshot testing for all UI states)
- [ ] Create accessibility testing (keyboard navigation, screen readers)
- [ ] Test responsive design breakpoints
- [ ] Modal dialogs and error states coverage
- [ ] Set up cross-browser testing
- [x] Behavior-focused testing (test user workflows, not implementation)
- [x] Use JSDOM for realistic DOM testing environment

---

## Phase 9: Security & Configuration

### 9.1 Security Implementation
- [ ] Implement Content Security Policy compliance
- [ ] Add input validation throughout
- [ ] Create secure credential storage
- [ ] Implement CSRF protection
- [ ] Add SQL injection prevention
- [ ] Test security vulnerabilities

### 9.2 Configuration Management
- [ ] Create UI-based Supabase configuration (primary method)
- [ ] Built-in connection testing feature
- [ ] Add configuration validation before saving
- [ ] Implement secure credential handling in Chrome sync storage
- [ ] Create supabase-config.local.js template for development
- [ ] Environment variable support for advanced users
- [ ] Create configuration migration system
- [ ] Add configuration backup/restore
- [ ] Test configuration workflows
- [ ] Never commit local configuration files

---

## Phase 10: Performance & Optimization

### 10.1 Performance Optimization
- [ ] Optimize service worker startup time (<500ms)
- [ ] Implement efficient caching strategies
- [ ] Add lazy loading for large datasets
- [ ] Optimize database queries
- [ ] Implement request debouncing
- [ ] Add performance monitoring

### 10.2 User Experience
- [ ] Target user persona optimization (Academic Researcher, Content Curator, Knowledge Worker)
- [ ] Popup load within 500ms
- [ ] Page marking completion within 2 seconds
- [ ] Search results appearance within 3 seconds
- [ ] Implement loading states
- [ ] Add progress indicators
- [ ] Create smooth animations
- [ ] Full keyboard navigation support
- [ ] High contrast display mode support
- [ ] Test with screen readers
- [ ] Maintain search performance with large datasets

---

## Phase 11: Production Readiness

### 11.1 Build & Distribution
- [ ] Create production build process
- [ ] Optimize assets for production
- [ ] Create extension packaging
- [ ] Add version management
- [ ] Create release documentation
- [ ] Set up automated testing in CI

### 11.2 Documentation & Polish
- [ ] Update all documentation
- [ ] Create user guide
- [ ] Add troubleshooting guide
- [ ] Create developer documentation
- [ ] Add contributing guidelines
- [ ] Polish UI and error messages

### 11.3 Quality Assurance
- [ ] Run complete test suite (target: 95%+ pass rate)
- [ ] Perform security audit  
- [ ] Test in multiple browsers
- [ ] Validate accessibility compliance
- [ ] Test with large datasets
- [ ] Verify cross-device sync

---

## Phase 12: Deployment & Monitoring

### 12.1 Chrome Web Store Preparation
- [ ] Create store listing assets
- [ ] Write store description
- [ ] Create screenshots and promotional images
- [ ] Set up privacy policy
- [ ] Prepare extension for review
- [ ] Submit to Chrome Web Store

### 12.2 Monitoring & Support
- [ ] Set up error monitoring
- [ ] Create user feedback system
- [ ] Add usage analytics (privacy-compliant)
- [ ] Set up automated backups
- [ ] Create support documentation
- [ ] Plan for maintenance and updates

---

## Development Commands Reference

```bash
# Setup
npm install
npm run install-browsers

# Development
npm test                    # Unit tests
npm run test:playwright     # Integration tests  
npm run test:visual         # Visual regression tests
npm run test:all            # All tests
npm run check               # Code quality (lint + format)

# Testing with UI
npm run test:unit:ui        # Unit tests with UI
npm run test:playwright:ui  # Integration tests with UI

# Visual regression
npm run test:visual:update  # Update visual baselines

# Code quality
npm run lint               # Check linting
npm run lint:fix          # Fix linting issues
npm run format            # Format code
```

## Success Criteria

### Phase Completion Targets
- **Unit Tests**: 95%+ pass rate (currently partial - 3 services tested)
- **Integration Tests**: 100% pass rate (basic tests implemented)
- **E2E Tests**: 90%+ pass rate (not yet implemented)
- **Visual Regression**: Basic setup complete, needs expansion
- **Performance**: Service worker startup not yet measured
- **Security**: Not yet audited
- **Accessibility**: Basic ARIA attributes added, full compliance pending

### Final Deliverables
- ✅ Fully functional Chrome extension
- ✅ Comprehensive test suite (unit, integration, E2E, visual)
- ✅ Complete documentation
- ✅ Supabase backend with security
- ✅ Cross-device synchronization
- ✅ Chrome Web Store ready package

---

## Critical Notes

### Security Requirements
- Never commit credentials to version control
- Use only Supabase anon key (never service role key)
- Maintain CSP compliance throughout
- Implement Row Level Security on all database tables

### Testing Requirements  
- Visual regression tests must pass before UI changes
- All services require unit tests with mocking
- Integration tests required for Chrome API interactions
- E2E tests required for complete user workflows

### Architecture Adherence
- Follow 6-service architecture strictly
- Use dependency injection throughout
- Maintain separation of concerns
- Keep services focused on single responsibilities

---

## Additional Implementation Requirements

### Chrome Extension Manifest V3 Specifics
- [ ] Service worker architecture instead of background pages
- [ ] Proper message passing between contexts (popup, options, background)
- [ ] CSP compliant with no external script loading
- [ ] Declarative keyboard shortcut registration
- [ ] Commands API for Ctrl+Shift+R shortcut
- [ ] Tabs API for current page information
- [ ] Storage API for cross-device sync
- [ ] Notifications API for user feedback
- [ ] Action API for badge and icon state

### Development Philosophy Requirements
- [ ] No comments unless explicitly requested
- [ ] Thoughtful but not over-engineered architecture
- [ ] Static HTML first approach
- [ ] Selective JavaScript for dynamic content only
- [ ] Semantic and accessible code as table stakes
- [ ] Use Result<T, E> wrapper for operations that can fail

### Visual Testing Integration (MANDATORY)
- [ ] Run visual tests BEFORE making UI changes
- [ ] Review screenshot diffs carefully before approving changes
- [ ] Update baselines intentionally only when changes are correct
- [ ] Check HTML test report for before/after visual comparisons
- [ ] Screenshot testing for loading, error, success states
- [ ] Before/after visual comparisons in test reports

### File Structure Validation
```
src/
├── services/ (6 focused services) ✓
├── controllers/ (3 UI controllers + BaseController) ✓
├── types/ (JSDoc type definitions) ✓
├── utils/ (4 utility modules) ✓
├── background/ (1 of 3 background services)
├── ui/ (HTML files + styles/) ✓
└── main/ (4 entry point scripts) ✓
```

### Testing Targets Specificity
- **Current Status**: 6 test files implemented, partial coverage
- **Phase 3 Target**: 95%+ unit test pass rate for production confidence
- **OAuth Flow Testing**: Not yet implemented
- **E2E Reliability**: Not yet implemented
- **Performance**: Not yet measured
- **Behavior-Focused**: Approach implemented in existing tests

### Development Workflow Requirements
1. **Always run `npm run check` with every change** (ESLint + Prettier)
2. **Visual regression tests must pass before UI changes**
3. **Test behavior, not implementation details**
4. **Use dependency injection pattern throughout**
5. **Follow CSP guidelines strictly - no external scripts**
6. **Mock only external APIs (Chrome, Supabase) - never internal logic**

This todo provides a complete roadmap for building the ForgetfulMe Chrome extension from scratch, following the established architecture and testing requirements documented in the project.