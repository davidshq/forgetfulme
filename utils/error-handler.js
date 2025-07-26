/**
 * @fileoverview Centralized Error Handler for ForgetfulMe Extension
 * @module error-handler
 * @description Provides comprehensive error handling, categorization, and user-friendly error messages
 *
 * @deprecated This file is maintained for backward compatibility.
 * New code should import from './utils/error-handler/index.js'
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

// Import from the new modular structure
import ErrorHandler, {
  ErrorHandler as ErrorHandlerClass,
} from './error-handler/index.js';

// Re-export the default instance and class for backward compatibility
export { ErrorHandlerClass as ErrorHandler };
export default ErrorHandler;
