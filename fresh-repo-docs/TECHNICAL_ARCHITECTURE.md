# ForgetfulMe Extension - Technical Architecture Specification

## Overview

This document defines the simplified, clean architecture for the ForgetfulMe extension rewrite. The design emphasizes **simplicity, maintainability, and testability** while preserving the excellent features from the current implementation.

## Technology Stack

### Core Technologies
- **JavaScript**: Vanilla ES6+ modules with JSDoc type annotations
- **Chrome Extension**: Manifest V3 with service workers
- **Backend**: Supabase (PostgreSQL + Authentication + Real-time)
- **Database**: PostgreSQL with Row Level Security (RLS)

### Frontend & Styling
- **CSS Framework**: Pico.css v2 (semantic HTML-first approach)
- **DOM Manipulation**: Vanilla JavaScript (no frameworks)
- **Progressive Enhancement**: Static HTML foundation + JavaScript enhancement

### Development & Testing
- **Unit Testing**: Vitest with JSDOM environment  
- **Integration Testing**: Playwright for Chrome extension testing
- **Visual Regression Testing**: Playwright screenshots with automated comparisons
- **Code Quality**: ESLint + Prettier
- **Type Safety**: JSDoc annotations (no build step required)

### Security & Performance
- **CSP Compliant**: No external script dependencies
- **Authentication**: JWT tokens with secure Chrome storage
- **Data Security**: Database-level RLS policies
- **Performance**: Service worker architecture + local caching
- **Configuration**: UI-based Supabase setup (no build step required)

## Core Design Principles

1. **Single Responsibility** - Each service has one clear purpose
2. **Dependency Injection** - Services receive dependencies through constructors
3. **Interface-Based Design** - All services implement clear interfaces
4. **Progressive Enhancement** - Static HTML enhanced by JavaScript
5. **Security First** - Authentication and data isolation at every layer
6. **No Build Step** - Direct JavaScript development with JSDoc typing

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Context                          │
├─────────────────────────────────────────────────────────────┤
│  UI Controllers                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ PopupUI     │  │ OptionsUI   │  │ BookmarkManagerUI   │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Core Services                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │BookmarkSvc  │  │  AuthSvc    │  │    ConfigSvc        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│           │               │                    │           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ StorageSvc  │  │ ErrorSvc    │  │    ValidationSvc    │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  External Interfaces                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ SupabaseDB  │  │ChromeStorage│  │   Chrome APIs       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                Background Service Worker                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │BackgroundSvc│  │ SyncManager │  │  ShortcutManager    │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Service Layer Architecture

### Core Services

#### 1. BookmarkService
**Purpose**: All bookmark-related operations (CRUD, search, statistics)

```javascript
/**
 * @typedef {Object} NewBookmark
 * @property {string} url
 * @property {string} title
 * @property {string} [description]
 * @property {string} status
 * @property {string[]} [tags]
 */

/**
 * @typedef {Object} Bookmark
 * @property {string} id
 * @property {string} userId
 * @property {string} url
 * @property {string} title
 * @property {string} [description]
 * @property {string} status
 * @property {string[]} tags
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string} [lastAccessedAt]
 * @property {number} accessCount
 */

/**
 * @typedef {Object} SearchQuery
 * @property {string} [text]
 * @property {string} [status]
 * @property {string[]} [tags]
 * @property {string} [dateFrom]
 * @property {string} [dateTo]
 * @property {number} [limit]
 * @property {number} [offset]
 */

/**
 * @typedef {Object} BookmarkStats
 * @property {number} total
 * @property {Object<string, number>} byStatus
 * @property {Object} recentActivity
 * @property {Array<{tag: string, count: number}>} topTags
 */

/**
 * Bookmark service interface
 * @interface IBookmarkService
 */

/**
 * BookmarkService - All bookmark-related operations
 */
class BookmarkService {
  /**
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
  
  /**
   * Save a new bookmark
   * @param {NewBookmark} bookmark
   * @returns {Promise<Bookmark>}
   */
  async save(bookmark) {
    try {
      // Validate input
      const validated = await this.validateBookmark(bookmark);
      
      // Check if exists
      const existing = await this.findByUrl(validated.url);
      if (existing) {
        return this.update(existing.id, validated);
      }
      
      // Save to database
      const saved = await this.database.bookmarks.insert({
        ...validated,
        user_id: await this.auth.getUserId(),
        created_at: new Date().toISOString()
      });
      
      // Cache locally
      await this.storage.cacheBookmark(saved);
      
      return this.transformFromDB(saved);
    } catch (error) {
      throw this.error.handle(error, 'BookmarkService.save');
    }
  }
  
  // ... other methods
}
```

#### 2. AuthService
**Purpose**: User authentication and session management

```javascript
/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} createdAt
 * @property {string} [lastLoginAt]
 */

/**
 * @typedef {Object} Session
 * @property {string} accessToken
 * @property {string} refreshToken
 * @property {string} expiresAt
 * @property {User} user
 */

/**
 * @typedef {Object} AuthResult
 * @property {boolean} success
 * @property {Session} [session]
 * @property {string} [error]
 */

/**
 * AuthService - User authentication and session management
 */
class AuthService {
  /**
   * @param {IDatabaseClient} database
   * @param {IStorageService} storage
   * @param {IErrorService} error
   */
  constructor(database, storage, error) {
    this.database = database;
    this.storage = storage;
    this.error = error;
  }
  
  /**
   * Sign in user with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<AuthResult>}
   */
  async signIn(email, password) {
    try {
      const result = await this.database.auth.signInWithPassword({
        email,
        password
      });
      
      if (result.data.session) {
        await this.storage.setSession(result.data.session);
        return { success: true, session: result.data.session };
      }
      
      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      throw this.error.handle(error, 'AuthService.signIn');
    }
  }
  
  // ... other methods
}
```

#### 3. ConfigService
**Purpose**: Application configuration and settings management

```javascript
/**
 * @typedef {Object} SupabaseConfig
 * @property {string} url
 * @property {string} anonKey
 */

/**
 * @typedef {Object} StatusType
 * @property {string} id
 * @property {string} userId
 * @property {string} name
 * @property {string} [color]
 * @property {boolean} isDefault
 * @property {number} sortOrder
 * @property {string} createdAt
 */

/**
 * @typedef {Object} UserPreferences
 * @property {string} defaultStatus
 * @property {boolean} autoTagging
 * @property {Object<string, string>} keyboardShortcuts
 * @property {string} theme
 * @property {number} pageSize
 * @property {boolean} showDescriptions
 */

/**
 * ConfigService - Application configuration and settings management
 */
class ConfigService {
  /**
   * @param {IStorageService} storage
   * @param {IValidationService} validation
   * @param {IErrorService} error
   */
  constructor(storage, validation, error) {
    this.storage = storage;
    this.validation = validation;
    this.error = error;
  }
  
  /**
   * Get Supabase configuration
   * @returns {Promise<SupabaseConfig|null>}
   */
  async getSupabaseConfig() {
    try {
      const config = await this.storage.get<SupabaseConfig>('supabase_config');
      return config;
    } catch (error) {
      throw this.error.handle(error, 'ConfigService.getSupabaseConfig');
    }
  }
  
  // ... other methods
}
```

### Utility Services

#### 4. StorageService
**Purpose**: Unified storage interface for Chrome storage and caching

```javascript
/**
 * StorageService - Unified storage interface for Chrome storage and caching
 */
class StorageService {
  /**
   * @param {ChromeStorage} chrome
   * @param {IErrorService} error
   */
  constructor(chrome, error) {
    this.chrome = chrome;
    this.error = error;
  }
  
  /**
   * Get value from storage
   * @template T
   * @param {string} key
   * @returns {Promise<T|null>}
   */
  async get(key) {
    try {
      const result = await this.chrome.storage.sync.get([key]);
      return result[key] || null;
    } catch (error) {
      throw this.error.handle(error, 'StorageService.get');
    }
  }
  
  // ... other methods
}
```

#### 5. ErrorService
**Purpose**: Centralized error handling and user messaging

```javascript
/**
 * Error types for categorization
 * @enum {string}
 */
const ErrorType = {
  NETWORK: 'NETWORK',
  AUTH: 'AUTH',
  VALIDATION: 'VALIDATION',
  DATABASE: 'DATABASE',
  CONFIG: 'CONFIG',
  UNKNOWN: 'UNKNOWN'
};

/**
 * @typedef {Object} ServiceError
 * @property {Error} original
 * @property {string} type
 * @property {string} context
 * @property {string} userMessage
 * @property {Date} timestamp
 * @property {boolean} retryable
 */

/**
 * ErrorService - Centralized error handling and user messaging
 */
class ErrorService {
  /**
   * Handle an error and return structured error info
   * @param {Error} error
   * @param {string} context
   * @returns {ServiceError}
   */
  handle(error, context) {
    const errorType = this.categorizeError(error);
    const userMessage = this.generateUserMessage(error, errorType);
    
    const serviceError: ServiceError = {
      original: error,
      type: errorType,
      context,
      userMessage,
      timestamp: new Date(),
      retryable: this.isRetryable(error, errorType)
    };
    
    this.log(serviceError);
    return serviceError;
  }
  
  private categorizeError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorType.NETWORK;
    }
    if (message.includes('auth') || message.includes('unauthorized')) {
      return ErrorType.AUTH;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION;
    }
    if (message.includes('database') || message.includes('sql')) {
      return ErrorType.DATABASE;
    }
    if (message.includes('config')) {
      return ErrorType.CONFIG;
    }
    
    return ErrorType.UNKNOWN;
  }
  
  // ... other methods
}
```

#### 6. ValidationService
**Purpose**: Input validation and data sanitization

```javascript
/**
 * @typedef {Object} ValidationResult
 * @template T
 * @property {boolean} isValid
 * @property {string[]} errors
 * @property {T} [data]
 */

/**
 * ValidationService - Input validation and data sanitization
 */
class ValidationService {
  /**
   * Validate bookmark data
   * @param {NewBookmark} bookmark
   * @returns {Promise<ValidationResult<NewBookmark>>}
   */
  async validateBookmark(bookmark) {
    const errors = [];
    
    // Validate URL
    const urlResult = this.validateUrl(bookmark.url);
    if (!urlResult.isValid) {
      errors.push(...urlResult.errors);
    }
    
    // Validate title
    if (!bookmark.title || bookmark.title.trim().length === 0) {
      errors.push('Title is required');
    }
    
    // Validate status
    if (!bookmark.status || bookmark.status.trim().length === 0) {
      errors.push('Status is required');
    }
    
    // Validate tags
    if (bookmark.tags) {
      bookmark.tags.forEach(tag => {
        if (tag.length > 50) {
          errors.push('Tag must be less than 50 characters');
        }
      });
    }
    
    return Promise.resolve({
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? {
        ...bookmark,
        url: urlResult.data!,
        title: this.sanitizeInput(bookmark.title),
        description: bookmark.description ? this.sanitizeInput(bookmark.description) : undefined
      } : undefined
    });
  }
  
  // ... other methods
}
```

## UI Controller Architecture

### Base Controller Pattern

```javascript
/**
 * Base controller class with common functionality
 * @abstract
 */
class BaseController {
  /**
   * @param {IErrorService} error
   * @param {IStorageService} storage
   */
  constructor(error, storage) {
    this.error = error;
    this.storage = storage;
  }
  
  /**
   * Handle errors with user-friendly messages
   * @param {Error} error
   * @param {string} context
   * @returns {Promise<void>}
   */
  async handleError(error, context) {
    const serviceError = this.error.handle(error, context);
    this.showErrorMessage(serviceError.userMessage);
  }
  
  /**
   * Show error message to user (must be implemented by subclasses)
   * @abstract
   * @param {string} message
   */
  showErrorMessage(message) {
    throw new Error('showErrorMessage must be implemented by subclass');
  }
  
  /**
   * Show success message to user (must be implemented by subclasses)
   * @abstract
   * @param {string} message
   */
  showSuccessMessage(message) {
    throw new Error('showSuccessMessage must be implemented by subclass');
  }
}
```

### PopupController

```javascript
/**
 * PopupController - Manages the popup interface
 * @extends BaseController
 */
class PopupController extends BaseController {
  /**
   * @param {IBookmarkService} bookmark
   * @param {IAuthService} auth
   * @param {IConfigService} config
   * @param {IErrorService} error
   * @param {IStorageService} storage
   */
  constructor(bookmark, auth, config, error, storage) {
    super(error, storage);
    this.bookmark = bookmark;
    this.auth = auth;
    this.config = config;
  }
  
  /**
   * Initialize the popup interface
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Check authentication
      const isAuthenticated = await this.auth.isAuthenticated();
      if (!isAuthenticated) {
        this.showAuthInterface();
        return;
      }
      
      // Load current page info
      const currentTab = await this.getCurrentTab();
      await this.loadBookmarkForm(currentTab);
      await this.loadRecentBookmarks();
      
      this.setupEventListeners();
    } catch (error) {
      await this.handleError(error as Error, 'PopupController.initialize');
    }
  }
  
  private async handleBookmarkSave(event: Event): Promise<void> {
    event.preventDefault();
    
    try {
      const formData = this.getFormData();
      const bookmark = await this.bookmark.save(formData);
      this.showSuccessMessage('Bookmark saved successfully!');
      await this.loadRecentBookmarks(); // Refresh list
    } catch (error) {
      await this.handleError(error as Error, 'PopupController.handleBookmarkSave');
    }
  }
  
  // ... other methods
}
```

## Data Flow Architecture

### Request Flow Example: Save Bookmark

```
User Action (UI)
    ↓
PopupController.handleBookmarkSave()
    ↓
BookmarkService.save()
    ↓
ValidationService.validateBookmark()
    ↓
DatabaseClient.bookmarks.insert()
    ↓
StorageService.cacheBookmark()
    ↓
UI Update (Success Message)
```

### Error Flow Example

```
Database Error
    ↓
BookmarkService catches error
    ↓
ErrorService.handle()
    ↓
ServiceError with user message
    ↓
Controller.handleError()
    ↓
UI displays user-friendly message
```

## Dependency Injection Pattern

### Service Container

```javascript
/**
 * Simple service container for dependency injection
 */
class ServiceContainer {
  constructor() {
    /** @type {Map<string, Function>} */
    this.services = new Map();
    /** @type {Map<string, any>} */
    this.instances = new Map();
  }
  
  /**
   * Register a service factory
   * @param {string} name
   * @param {Function} factory
   */
  register(name, factory) {
    this.services.set(name, factory);
  }
  
  /**
   * Register a singleton service
   * @param {string} name
   * @param {Function} factory
   */
  registerSingleton(name, factory) {
    this.services.set(name, () => {
      if (!this.instances.has(name)) {
        this.instances.set(name, factory());
      }
      return this.instances.get(name);
    });
  }
  
  /**
   * Get a service instance
   * @template T
   * @param {string} name
   * @returns {T}
   */
  get(name) {
    const factory = this.services.get(name);
    if (!factory) {
      throw new Error(`Service ${name} not found`);
    }
    return factory();
  }
}

// Service Registration Example
const container = new ServiceContainer();

// Register singletons (shared instances)
container.registerSingleton('error', () => new ErrorService());
container.registerSingleton('validation', () => new ValidationService());
container.registerSingleton('storage', () => new StorageService(chrome, container.get('error')));
container.register('validation', () => new ValidationService());
container.register('config', () => new ConfigService(
  container.get('storage'),
  container.get('validation'),
  container.get('error')
));
container.register('auth', () => new AuthService(
  container.get('database'),
  container.get('storage'),
  container.get('error')
));
container.register('bookmark', () => new BookmarkService(
  container.get('database'),
  container.get('storage'),
  container.get('auth'),
  container.get('error')
));

// Controller instantiation
const popupController = new PopupController(
  container.get('bookmark'),
  container.get('auth'),
  container.get('config'),
  container.get('error'),
  container.get('storage')
);
```

## File Structure

```
src/
├── services/
│   ├── BookmarkService.js
│   ├── AuthService.js
│   ├── ConfigService.js
│   ├── StorageService.js
│   ├── ErrorService.js
│   └── ValidationService.js
├── controllers/
│   ├── BaseController.js
│   ├── PopupController.js
│   ├── OptionsController.js
│   └── BookmarkManagerController.js
├── types/
│   └── jsdoc-types.js       // JSDoc typedefs for shared types
├── utils/
│   ├── ServiceContainer.js
│   ├── dom.js
│   ├── formatting.js
│   └── constants.js
├── background/
│   ├── BackgroundService.js
│   ├── SyncManager.js
│   └── ShortcutManager.js
├── ui/
│   ├── popup.html
│   ├── options.html
│   ├── bookmark-manager.html
│   └── styles/
│       ├── shared.css
│       ├── popup.css
│       ├── options.css
│       └── bookmark-manager.css
└── main/
    ├── popup.js
    ├── options.js
    ├── bookmark-manager.js
    └── background.js
```

## Testing Architecture

### Service Testing Pattern

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BookmarkService } from '../services/BookmarkService.js';
import { createMockDatabase, createMockStorage, createMockAuth, createMockError } from './test-factories.js';

describe('BookmarkService', () => {
  /** @type {BookmarkService} */
  let service;
  /** @type {import('vitest').MockedObject<IDatabaseClient>} */
  let mockDatabase;
  /** @type {import('vitest').MockedObject<IStorageService>} */
  let mockStorage;
  /** @type {import('vitest').MockedObject<IAuthService>} */
  let mockAuth;
  /** @type {import('vitest').MockedObject<IErrorService>} */
  let mockError;
  
  beforeEach(() => {
    mockDatabase = createMockDatabase();
    mockStorage = createMockStorage();
    mockAuth = createMockAuth();
    mockError = createMockError();
    
    service = new BookmarkService(mockDatabase, mockStorage, mockAuth, mockError);
  });
  
  describe('save', () => {
    it('should save new bookmark successfully', async () => {
      // Arrange
      /** @type {NewBookmark} */
      const newBookmark = {
        url: 'https://example.com',
        title: 'Test Page',
        status: 'read'
      };
      
      mockAuth.getUserId.mockResolvedValue('user-123');
      mockDatabase.bookmarks.insert.mockResolvedValue({
        id: 'bookmark-123',
        ...newBookmark,
        user_id: 'user-123',
        created_at: '2024-01-01T00:00:00Z'
      });
      
      // Act
      const result = await service.save(newBookmark);
      
      // Assert
      expect(result).toEqual(expect.objectContaining({
        id: 'bookmark-123',
        url: 'https://example.com',
        title: 'Test Page'
      }));
      expect(mockDatabase.bookmarks.insert).toHaveBeenCalledWith(
        expect.objectContaining(newBookmark)
      );
      expect(mockStorage.cacheBookmark).toHaveBeenCalledWith(result);
    });
  });
});
```

## Benefits of This Architecture

### 1. **Simplicity**
- Single responsibility per service
- Clear dependency relationships
- Minimal abstraction layers

### 2. **Testability**
- Easy mocking through interfaces
- Isolated unit testing
- Dependency injection enables testing

### 3. **Maintainability**
- Fewer files to understand
- Clear service boundaries
- Consistent patterns throughout

### 4. **Performance**
- Direct service calls
- Minimal overhead
- Efficient dependency injection

### 5. **Scalability**
- Easy to add new services
- Clear extension points
- Modular service registration

This architecture maintains all the benefits of the current implementation while dramatically simplifying the codebase and improving maintainability.