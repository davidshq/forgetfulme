/**
 * @fileoverview Shared service helper utilities for the ForgetfulMe extension
 */

/**
 * Mixin to add common service initialization patterns
 * @param {Class} BaseClass - The base class to extend
 * @returns {Class} Extended class with initialization helpers
 */
export function withInitialization(BaseClass) {
  return class extends BaseClass {
    /**
     * Ensure service is initialized (for services with supabaseClient)
     * @returns {Promise<void>}
     * @throws {Error} If initialization fails
     */
    async ensureInitialized() {
      if (!this.supabaseClient) {
        await this.initialize();
      }
      if (!this.supabaseClient) {
        throw new Error(`${this.constructor.name} failed to initialize`);
      }
    }

    /**
     * Ensure service is configured (for services with isConfigured method)
     * @param {boolean} throwOnFailure - Whether to throw error or return false
     * @returns {Promise<boolean>} True if configured, false if not (when throwOnFailure=false)
     * @throws {Error} If not configured and throwOnFailure=true
     */
    async ensureConfigured(throwOnFailure = true) {
      if (!this.isConfigured()) {
        const initialized = await this.initialize();
        if (!initialized) {
          if (throwOnFailure) {
            throw new Error(
              'Supabase configuration is required. Please configure the extension in Options.'
            );
          }
          return false;
        }
      }
      return true;
    }
  };
}

/**
 * Mixin to add common error handling patterns
 * @param {Class} BaseClass - The base class to extend
 * @returns {Class} Extended class with error handling helpers
 */
export function withErrorHandling(BaseClass) {
  return class extends BaseClass {
    /**
     * Handle and rethrow error with service context
     * @param {Error} error - The error to handle
     * @param {string} context - The context (e.g., 'ServiceName.methodName')
     * @throws {Error} Processed error with errorService handling
     */
    handleAndThrow(error, context) {
      const errorInfo = this.errorService.handle(error, context);
      throw new Error(errorInfo.message);
    }

    /**
     * Handle error and return null (for non-critical operations)
     * @param {Error} error - The error to handle
     * @param {string} context - The context (e.g., 'ServiceName.methodName')
     * @returns {null}
     */
    handleAndReturnNull(error, context) {
      this.errorService.handle(error, context);
      return null;
    }

    /**
     * Wrap async operation with error handling
     * @param {Function} operation - Async operation to wrap
     * @param {string} context - The context for error handling
     * @param {*} fallbackValue - Value to return on error (default: rethrow)
     * @returns {Promise<*>} Operation result or fallback value
     */
    async withErrorHandling(operation, context, fallbackValue = Symbol('RETHROW')) {
      try {
        return await operation();
      } catch (error) {
        if (fallbackValue === Symbol('RETHROW')) {
          this.handleAndThrow(error, context);
        } else {
          this.errorService.handle(error, context);
          return fallbackValue;
        }
      }
    }
  };
}

/**
 * Combine multiple mixins
 * @param {...Function} mixins - Mixin functions to combine
 * @returns {Function} Combined mixin function
 */
export function composeMixins(...mixins) {
  return baseClass => mixins.reduce((cls, mixin) => mixin(cls), baseClass);
}

/**
 * Standard service base with common patterns
 * @param {Class} BaseClass - The base class to extend
 * @returns {Class} Extended class with all common service patterns
 */
export const withServicePatterns = composeMixins(withInitialization, withErrorHandling);