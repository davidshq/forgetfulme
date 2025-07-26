# Error Handler Module

This directory contains the modular error handling system for the ForgetfulMe Chrome extension. The error handler has been refactored from a single large file into focused, maintainable modules.

## 📁 Structure

```
utils/error-handler/
├── index.js                        # Main error handler and orchestrator
├── modules/
│   ├── error-categorizer.js        # Error categorization logic
│   ├── error-logger.js             # Error logging utilities
│   ├── error-messages.js           # User-friendly message generation
│   ├── error-retry.js              # Retry logic and policies
│   └── error-display.js            # Error display utilities
├── utils/
│   └── error-utils.js              # Shared error utilities
└── README.md                       # This documentation
```

## 🎯 Module Responsibilities

### **Main Error Handler (`index.js`)**
- Coordinates all error handling modules
- Provides unified error handling interface
- Maintains backward compatibility with existing code
- Exports both class and default instance

### **Error Categorizer (`modules/error-categorizer.js`)**
- Categorizes errors based on error messages and context
- Defines error types and severity levels
- Uses pattern matching for error classification
- Provides extensible categorization system

### **Error Logger (`modules/error-logger.js`)**
- Handles error logging with configurable severity levels
- Supports different log levels (LOW, MEDIUM, HIGH, CRITICAL)
- Provides silent logging option
- Configurable logging policies

### **Error Messages (`modules/error-messages.js`)**
- Generates user-friendly error messages
- Maps technical errors to user-readable messages
- Supports custom message patterns
- Handles different error types with specific messages

### **Error Retry (`modules/error-retry.js`)**
- Determines retry policies for different error types
- Manages user display decisions
- Configurable retry and display policies
- Severity-based display logic

### **Error Display (`modules/error-display.js`)**
- Handles error message display in UI
- Supports different message types (error, warning, info, success)
- Auto-removal with configurable timeouts
- Dismissible messages with close buttons

### **Error Utils (`utils/error-utils.js`)**
- Shared error handling utilities
- Input validation functions
- Error object creation and formatting
- Extensible validation patterns

## 🚀 Usage

### **Basic Usage**
```javascript
import ErrorHandler from './utils/error-handler/index.js';

// Handle an error
const result = ErrorHandler.handle(error, 'popup.initialize');
console.log(result.userMessage);

// Create a custom error
const error = ErrorHandler.createError('Custom error message', ErrorHandler.ERROR_TYPES.VALIDATION);
```

### **Advanced Usage**
```javascript
import { ErrorHandler } from './utils/error-handler/index.js';

// Create custom error handler with specific options
const customHandler = new ErrorHandler({
  logging: {
    enabled: true,
    level: 'HIGH'
  }
});

// Handle async operations
const result = await customHandler.handleAsync(
  async () => await someAsyncOperation(),
  'data.fetch',
  { showTechnical: false }
);
```

### **Module-Specific Usage**
```javascript
import { ErrorCategorizer } from './utils/error-handler/modules/error-categorizer.js';
import { ErrorMessages } from './utils/error-handler/modules/error-messages.js';

const categorizer = new ErrorCategorizer();
const messages = new ErrorMessages();

const errorInfo = categorizer.categorizeError(error, 'form.submit');
const userMessage = messages.getUserMessage(errorInfo);
```

## 🔧 Configuration

### **Error Types**
```javascript
ErrorHandler.ERROR_TYPES = {
  NETWORK: 'NETWORK',
  AUTH: 'AUTH',
  VALIDATION: 'VALIDATION',
  DATABASE: 'DATABASE',
  CONFIG: 'CONFIG',
  UI: 'UI',
  UNKNOWN: 'UNKNOWN',
};
```

### **Severity Levels**
```javascript
ErrorHandler.SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};
```

### **Custom Configuration**
```javascript
const handler = new ErrorHandler({
  logging: {
    enabled: true,
    level: 'MEDIUM'
  }
});

// Customize retry policies
handler.retry.setRetryPolicy('NETWORK', true);
handler.retry.setDisplayPolicy('VALIDATION', true);

// Customize message timeouts
handler.display.setDefaultTimeout('error', 15000);
```

## 🧪 Testing

Each module includes comprehensive unit tests:

```javascript
// tests/unit/error-handler/
├── error-categorizer.test.js
├── error-logger.test.js
├── error-messages.test.js
├── error-retry.test.js
├── error-display.test.js
└── error-utils.test.js
```

## 🔄 Migration from Old Error Handler

The new modular structure maintains full backward compatibility:

### **Before (Old Error Handler)**
```javascript
import ErrorHandler from './utils/error-handler.js';

const result = ErrorHandler.handle(error, 'popup.initialize');
ErrorHandler.showMessage('Error message', 'error', container);
```

### **After (New Modular Structure)**
```javascript
import ErrorHandler from './utils/error-handler/index.js';

// Same API - no changes needed!
const result = ErrorHandler.handle(error, 'popup.initialize');
ErrorHandler.showMessage('Error message', 'error', container);
```

## 📈 Benefits

### **Improved Maintainability**
- Each module has a single responsibility
- Easier to locate and modify specific functionality
- Clear module boundaries and interfaces

### **Enhanced Testability**
- Smaller, focused functions are easier to test
- Each module can be tested independently
- Better test coverage and isolation

### **Increased Flexibility**
- Configurable logging levels and policies
- Extensible error categorization
- Customizable retry and display policies

### **Better Code Organization**
- Logical separation of concerns
- Reduced cognitive load when working with individual modules
- Clearer dependency relationships

## 🔮 Future Enhancements

### **Planned Features**
- Error analytics and reporting
- Advanced retry strategies with exponential backoff
- Error grouping and deduplication
- Integration with external error tracking services

### **Extensibility Points**
- Custom error categorizers
- Plugin-based message formatters
- Configurable display themes
- Advanced validation patterns

## 📚 API Reference

For detailed API documentation, see the JSDoc comments in each module file. The main entry point (`index.js`) provides the complete public API for the error handling system.

---

*This modular error handler provides a robust, maintainable, and extensible foundation for error handling throughout the ForgetfulMe extension.* 