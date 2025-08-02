# Error Handling Standards

This document defines the standardized error handling patterns for the ForgetfulMe Chrome extension.

## Architecture Overview

### Service Layer Patterns

All services should use consistent error handling through the `withServicePatterns` mixin, which provides:

1. **`handleAndThrow(error, context)`** - For operations that should fail fast
2. **`handleAndReturnNull(error, context)`** - For non-critical operations
3. **`safeAsync(operation, context, fallbackValue)`** - For wrapped async operations

### Error Flow

```
Raw Error → ErrorService.handle(error, context) → Categorized ErrorInfo → User Action
```

## Service Implementation Standards

### 1. Service Class Structure

```javascript
import { withServicePatterns } from '../utils/serviceHelpers.js';

export class MyService extends withServicePatterns(class {}) {
  constructor(dependencies) {
    super(); // REQUIRED for classes extending withServicePatterns
    this.errorService = errorService;
    // ... other initialization
  }
}
```

### 2. Error Handling Patterns

#### Pattern A: Critical Operations (should throw)
```javascript
async someOperation() {
  try {
    // Validation
    if (!this.isValid(data)) {
      this.handleAndThrow(new Error('Invalid data'), 'ServiceName.someOperation');
    }
    
    // Business logic
    const result = await this.performOperation();
    return result;
  } catch (error) {
    this.handleAndThrow(error, 'ServiceName.someOperation');
  }
}
```

#### Pattern B: Non-Critical Operations (can return null)
```javascript
async getOptionalData() {
  try {
    const result = await this.fetchData();
    return result;
  } catch (error) {
    return this.handleAndReturnNull(error, 'ServiceName.getOptionalData');
  }
}
```

#### Pattern C: Operations with Fallback
```javascript
async getDataWithFallback() {
  return this.safeAsync(
    () => this.fetchData(),
    'ServiceName.getDataWithFallback',
    [] // fallback value
  );
}
```

### 3. Avoid These Anti-Patterns

❌ **Raw throws without context:**
```javascript
throw new Error('Something went wrong'); // BAD
```

❌ **Inconsistent return values:**
```javascript
// Sometimes returns null, sometimes throws - BAD
if (error) return null;
if (otherError) throw error;
```

❌ **Mixed error handling:**
```javascript
// Some methods use errorService, others don't - BAD
this.errorService.handle(error, 'Method1');
throw new Error('Raw error in Method2');
```

## Controller Implementation Standards

### Base Controller Pattern

Controllers should extend `BaseController` and use the errorService:

```javascript
export class MyController extends BaseController {
  constructor(services) {
    super(services.errorService);
    // ... other services
  }

  async handleUserAction() {
    try {
      await this.someService.performAction();
      this.showSuccess('Action completed');
    } catch (error) {
      // BaseController should provide error display methods
      this.displayError(error);
    }
  }
}
```

## Error Context Naming Convention

Use format: `ServiceName.methodName` or `ControllerName.methodName`

Examples:
- `BookmarkService.createBookmark`
- `ConfigService.setSupabaseConfig`  
- `PopupController.handleSaveBookmark`

## Error Categories

The ErrorService automatically categorizes errors:

1. **Configuration errors** - Missing config, invalid settings
2. **Database errors** - Supabase connection issues, query failures
3. **Storage errors** - Chrome storage API failures
4. **Network errors** - Connection timeouts, API failures
5. **Rate limit errors** - API rate limiting
6. **Authentication errors** - Login failures, token issues
7. **Validation errors** - Input validation failures
8. **Permission errors** - Access denied, insufficient permissions

## Testing Error Handling

### Unit Tests Should Cover:

1. **Error propagation** - Verify errors are properly handled and categorized
2. **Context preservation** - Ensure error context is maintained
3. **Fallback behavior** - Test fallback values and null returns
4. **User-friendly messages** - Verify error messages are appropriate for users

### Example Test:

```javascript
it('should handle authentication errors with proper context', async () => {
  const error = new Error('User not authenticated');
  
  await expect(bookmarkService.createBookmark({}))
    .rejects.toThrow('User not authenticated');
    
  expect(mockErrorService.handle).toHaveBeenCalledWith(
    error,
    'BookmarkService.createBookmark'
  );
});
```

## Migration Checklist

- [ ] Service extends `withServicePatterns`
- [ ] Constructor calls `super()`
- [ ] Raw `throw new Error()` replaced with `handleAndThrow()`
- [ ] Methods that can fail gracefully use `handleAndReturnNull()`
- [ ] All error contexts follow naming convention
- [ ] Unit tests cover error handling paths
- [ ] Controllers use BaseController error display methods