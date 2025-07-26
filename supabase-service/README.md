# Supabase Service - Modular Architecture

## Overview

The Supabase service has been refactored into a modular architecture to improve maintainability, testability, and code organization. This document describes the new structure and how to use it.

## Architecture

The service is now organized into focused modules, each with a single responsibility:

```
supabase-service/
├── index.js                        # Main entry point and orchestrator
├── modules/
│   ├── core/
│   │   └── service-initializer.js  # Service initialization and client management
│   ├── bookmarks/
│   │   ├── bookmark-operations.js  # Bookmark CRUD operations
│   │   ├── bookmark-queries.js     # Bookmark retrieval and filtering
│   │   └── bookmark-stats.js       # Bookmark statistics and analytics
│   ├── preferences/
│   │   └── user-preferences.js     # User preferences management
│   ├── realtime/
│   │   └── realtime-manager.js     # Real-time subscriptions
│   └── data/
│       └── import-export.js        # Data import/export operations
└── README.md                       # This documentation
```

## Module Responsibilities

### Core Module
- **Service Initializer**: Handles Supabase client initialization and authentication state

### Bookmarks Module
- **Bookmark Operations**: CRUD operations (Create, Update, Delete) with validation
- **Bookmark Queries**: Retrieval operations with filtering and pagination
- **Bookmark Stats**: Statistics and analytics for bookmarks

### Preferences Module
- **User Preferences**: Management of user preferences and settings

### Realtime Module
- **Realtime Manager**: Real-time subscriptions and channel management

### Data Module
- **Import/Export**: Data import and export operations

## Usage

### Basic Usage

```javascript
import SupabaseService from './supabase-service/index.js';
import SupabaseConfig from './supabase-config.js';

// Initialize the service
const supabaseConfig = new SupabaseConfig();
const supabaseService = new SupabaseService(supabaseConfig);
await supabaseService.initialize();

// Use the service
const bookmark = await supabaseService.saveBookmark({
  url: 'https://example.com',
  title: 'Example Page',
  readStatus: 'read'
});
```

### Module-Specific Operations

The main service delegates to specific modules:

```javascript
// Bookmark operations
await supabaseService.saveBookmark(bookmark);
await supabaseService.updateBookmark(id, updates);
await supabaseService.deleteBookmark(id);

// Bookmark queries
const bookmarks = await supabaseService.getBookmarks({ page: 1, limit: 50 });
const bookmark = await supabaseService.getBookmarkByUrl(url);
const bookmark = await supabaseService.getBookmarkById(id);

// Bookmark statistics
const stats = await supabaseService.getBookmarkStats();

// User preferences
await supabaseService.saveUserPreferences(preferences);
const preferences = await supabaseService.getUserPreferences();

// Real-time subscriptions
const subscription = supabaseService.subscribeToBookmarks(callback);
supabaseService.unsubscribe('bookmarks');

// Import/Export
const data = await supabaseService.exportData();
await supabaseService.importData(importData);
```

## Dependency Injection

All modules use dependency injection for better testability:

```javascript
// Each module receives the Supabase config
const bookmarkOperations = new BookmarkOperations(supabaseConfig);

// The client is set after initialization
bookmarkOperations.setSupabaseClient(supabaseClient);
```

## Error Handling

All modules use the centralized error handler:

```javascript
import ErrorHandler from '../../../utils/error-handler.js';

// Consistent error handling across all modules
ErrorHandler.handle(error, 'module-name.method-name');
```

## Testing

Each module can be tested independently:

```javascript
// Test bookmark operations
import { BookmarkOperations } from './modules/bookmarks/bookmark-operations.js';

describe('BookmarkOperations', () => {
  it('should save bookmark successfully', async () => {
    const operations = new BookmarkOperations(mockConfig);
    // Test implementation
  });
});
```

## Migration from Monolithic Service

The refactoring maintains backward compatibility. The main service interface remains the same:

```javascript
// Old usage (still works)
const supabaseService = new SupabaseService(supabaseConfig);
await supabaseService.initialize();
const bookmark = await supabaseService.saveBookmark(bookmarkData);

// New usage (same interface)
const supabaseService = new SupabaseService(supabaseConfig);
await supabaseService.initialize();
const bookmark = await supabaseService.saveBookmark(bookmarkData);
```

## Benefits

1. **Improved Maintainability**: Each module has a single responsibility
2. **Enhanced Testability**: Modules can be tested independently
3. **Better Code Organization**: Clear separation of concerns
4. **Reduced Complexity**: Smaller, focused modules
5. **Dependency Injection**: Better testability and flexibility
6. **Backward Compatibility**: No breaking changes to existing code

## Future Enhancements

- Add more specialized modules as needed
- Implement caching layer
- Add performance monitoring
- Enhance error handling with module-specific error types 