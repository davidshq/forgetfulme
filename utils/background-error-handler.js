/**
 * @fileoverview Error handler for background service worker
 * @module background-error-handler
 * @description Simplified error handler for service worker context
 */

/**
 * Simple error handler for background script (service worker)
 * Since service workers can't use ES6 imports, this is a simplified version
 */
const BackgroundErrorHandler = {
  /**
   * Handle errors in background script
   * @param {Error} error - The error object
   * @param {string} context - Where the error occurred
   */
  handle(error, context) {
    // Log error for debugging
    console.error(`[${context}] Error:`, error.message);

    // Show user-friendly notification if needed
    this.showErrorNotification(error, context);
  },

  /**
   * Show error notification to user
   * @param {Error} error - The error object
   * @param {string} context - Where the error occurred
   */
  showErrorNotification(error, context) {
    // Only show notifications for certain types of errors
    if (context.includes('auth') || context.includes('config')) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'ForgetfulMe',
        message: this.getUserMessage(error, context),
      });
    }
  },

  /**
   * Get user-friendly error message
   * @param {Error} error - The error object
   * @param {string} context - Where the error occurred
   * @returns {string} User-friendly error message
   */
  getUserMessage(error, _context) {
    const message = error.message || error.toString();

    // Network errors
    if (message.includes('fetch') || message.includes('network') || message.includes('HTTP')) {
      return 'Connection error. Please check your internet connection and try again.';
    }

    // Authentication errors
    if (message.includes('auth') || message.includes('login') || message.includes('sign')) {
      return 'Authentication error. Please try signing in again.';
    }

    // Configuration errors
    if (message.includes('config') || message.includes('supabase')) {
      return 'Configuration error. Please check your settings and try again.';
    }

    // Default error message
    return 'An unexpected error occurred. Please try again.';
  },

  /**
   * Create a standardized error object
   * @param {string} message - Error message
   * @param {string} context - Error context
   * @returns {Error} Standardized error object
   */
  createError(message, context) {
    const error = new Error(message);
    error.context = context;
    error.timestamp = new Date().toISOString();
    return error;
  },
};

// Export for use in background.js
// eslint-disable-next-line no-undef
if (typeof module !== 'undefined' && module.exports) {
  // eslint-disable-next-line no-undef
  module.exports = BackgroundErrorHandler;
}
