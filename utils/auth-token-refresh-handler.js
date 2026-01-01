/**
 * @fileoverview Authentication token refresh handler
 * @module auth-token-refresh-handler
 * @description Handles token refresh edge cases including permanent failures,
 * session expiration during operations, concurrent refresh coordination, and offline recovery
 */

import ErrorHandler from './error-handler.js';

/**
 * Authentication token refresh handler
 * @class AuthTokenRefreshHandler
 * @description Manages token refresh with coordination for concurrent requests,
 * handles permanent failures, and manages offline/online state
 */
class AuthTokenRefreshHandler {
  /**
   * Initialize the auth token refresh handler
   * @constructor
   * @param {Object} supabaseConfig - Supabase configuration instance
   * @param {AuthStateManager} [authStateManager=null] - Authentication state manager
   */
  constructor(supabaseConfig, authStateManager = null) {
    this.config = supabaseConfig;
    this.authStateManager = authStateManager;
    /** @type {Promise|null} Current refresh operation in progress */
    this.refreshPromise = null;
    /** @type {boolean} Whether a permanent refresh failure has occurred */
    this.permanentFailure = false;
    /** @type {boolean} Current online/offline state */
    // Browser extension context - navigator may not be available in all contexts
    // eslint-disable-next-line no-undef
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    this.isOnline = nav && nav.onLine !== undefined ? nav.onLine : true;
    /** @type {Array<Function>} Queue of operations to retry when back online */
    this.offlineQueue = [];

    // Listen for online/offline events (only in window context)
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  /**
   * Handle online state change
   * @private
   */
  handleOnline() {
    this.isOnline = true;
    this.processOfflineQueue();
  }

  /**
   * Handle offline state change
   * @private
   */
  handleOffline() {
    this.isOnline = false;
  }

  /**
   * Process queued operations when back online
   * @private
   */
  async processOfflineQueue() {
    if (!this.isOnline || this.offlineQueue.length === 0) {
      return;
    }

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const operation of queue) {
      try {
        await operation();
      } catch (error) {
        ErrorHandler.handle(error, 'auth-token-refresh-handler.processOfflineQueue', {
          silent: true,
        });
      }
    }
  }

  /**
   * Check if session is expired or about to expire
   * @param {Object} session - Supabase session object
   * @returns {boolean} True if session is expired or expiring soon
   */
  isSessionExpired(session) {
    if (!session || !session.expires_at) {
      return true;
    }

    // Consider session expired if it expires within 60 seconds
    const expiresAt = session.expires_at * 1000; // Convert to milliseconds
    const now = Date.now();
    const bufferTime = 60 * 1000; // 60 seconds buffer

    return now >= expiresAt - bufferTime;
  }

  /**
   * Refresh the authentication session
   * @param {boolean} [force=false] - Force refresh even if one is in progress
   * @returns {Promise<Object>} Refreshed session object
   * @throws {Error} When refresh fails permanently or network is offline
   */
  async refreshSession(force = false) {
    // Check if we're offline
    if (!this.isOnline) {
      throw ErrorHandler.createError(
        'Cannot refresh session while offline',
        ErrorHandler.ERROR_TYPES.NETWORK,
        'auth-token-refresh-handler.refreshSession',
      );
    }

    // Check for permanent failure
    if (this.permanentFailure && !force) {
      throw ErrorHandler.createError(
        'Token refresh has failed permanently. Please sign in again.',
        ErrorHandler.ERROR_TYPES.AUTH,
        'auth-token-refresh-handler.refreshSession',
      );
    }

    // If refresh is already in progress, wait for it
    if (this.refreshPromise && !force) {
      return this.refreshPromise;
    }

    // Start new refresh operation
    this.refreshPromise = this._performRefresh();

    try {
      const session = await this.refreshPromise;
      this.permanentFailure = false;
      return session;
    } catch (error) {
      // Permanent failures: invalid refresh token, user deleted, etc.
      if (
        error.message?.includes('Invalid refresh token') ||
        error.message?.includes('refresh_token_not_found') ||
        error.message?.includes('JWT expired') ||
        error.code === 'invalid_grant'
      ) {
        this.permanentFailure = true;
        this._clearAuthState();
      }

      throw error;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual session refresh
   * @private
   * @returns {Promise<Object>} Refreshed session
   */
  async _performRefresh() {
    if (!this.config.auth) {
      throw ErrorHandler.createError(
        'Supabase auth not initialized',
        ErrorHandler.ERROR_TYPES.CONFIG,
        'auth-token-refresh-handler._performRefresh',
      );
    }

    const { data, error } = await this.config.auth.refreshSession();

    if (error) {
      throw error;
    }

    if (!data.session) {
      throw ErrorHandler.createError(
        'No session returned from refresh',
        ErrorHandler.ERROR_TYPES.AUTH,
        'auth-token-refresh-handler._performRefresh',
      );
    }

    // Update config session
    this.config.session = data.session;
    this.config.user = data.session.user;

    // Update auth state manager if available
    if (this.authStateManager) {
      await this.authStateManager.setAuthState(data.session);
    }

    return data.session;
  }

  /**
   * Clear authentication state
   * @private
   */
  async _clearAuthState() {
    if (this.authStateManager) {
      await this.authStateManager.clearAuthState();
    }
    this.config.session = null;
    this.config.user = null;
  }

  /**
   * Check if error is an auth error that can be retried
   * @private
   * @param {Error} error - Error to check
   * @param {Object} errorResult - Error result from ErrorHandler
   * @returns {boolean} True if error is retryable auth error
   */
  _isRetryableAuthError(error, errorResult) {
    return (
      errorResult.errorInfo.type === ErrorHandler.ERROR_TYPES.AUTH ||
      error.message?.includes('JWT') ||
      error.message?.includes('token') ||
      error.message?.includes('session') ||
      error.code === 'PGRST116'
    );
  }

  /**
   * Handle offline operation queuing
   * @private
   * @param {Function} operation - Operation to queue
   * @param {string} context - Context for error handling
   * @param {Object} options - Options
   * @returns {Promise<any>} Promise that resolves when operation completes
   */
  _queueOfflineOperation(operation, context, options) {
    return new Promise((resolve, reject) => {
      this.offlineQueue.push(async () => {
        try {
          const result = await this.executeWithRefresh(operation, context, {
            ...options,
            queueIfOffline: false,
          });
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Handle auth error with refresh retry
   * @private
   * @param {Error} error - Original error
   * @param {Function} operation - Operation to retry
   * @param {string} context - Context for error handling
   * @returns {Promise<any>} Result of retried operation
   * @throws {Error} If refresh fails permanently or retry fails
   */
  async _handleAuthErrorWithRefresh(error, operation, context) {
    try {
      await this.refreshSession();
      return await operation();
    } catch (_refreshError) {
      if (this.permanentFailure) {
        throw ErrorHandler.createError(
          'Session expired. Please sign in again.',
          ErrorHandler.ERROR_TYPES.AUTH,
          context,
        );
      }
      throw error;
    }
  }

  /**
   * Execute an operation with automatic token refresh on auth errors
   * @param {Function} operation - Async operation to execute
   * @param {string} context - Context for error handling
   * @param {Object} [options={}] - Additional options
   * @param {boolean} [options.retryOnAuthError=true] - Retry operation after refresh
   * @param {boolean} [options.queueIfOffline=true] - Queue operation if offline
   * @returns {Promise<any>} Result of the operation
   */
  async executeWithRefresh(operation, context, options = {}) {
    const { retryOnAuthError = true, queueIfOffline = true } = options;

    // Check if offline and queue if requested
    if (!this.isOnline && queueIfOffline) {
      return this._queueOfflineOperation(operation, context, options);
    }

    try {
      // Check if session needs refresh before operation
      const { session } = this.config;
      if (session && this.isSessionExpired(session)) {
        await this.refreshSession();
      }

      return await operation();
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, context);

      // Check if this is an auth error that might be resolved by refresh
      if (retryOnAuthError && this._isRetryableAuthError(error, errorResult)) {
        return this._handleAuthErrorWithRefresh(error, operation, context);
      }

      // Not an auth error or retry disabled - throw original error
      throw error;
    }
  }

  /**
   * Reset permanent failure flag (e.g., after successful re-authentication)
   */
  resetPermanentFailure() {
    this.permanentFailure = false;
  }

  /**
   * Get current online status
   * @returns {boolean} True if online
   */
  getOnlineStatus() {
    return this.isOnline;
  }

  /**
   * Get number of queued offline operations
   * @returns {number} Number of queued operations
   */
  getQueuedOperationsCount() {
    return this.offlineQueue.length;
  }
}

export default AuthTokenRefreshHandler;
