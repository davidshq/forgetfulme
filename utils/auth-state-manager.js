/**
 * @fileoverview Authentication state manager for ForgetfulMe extension
 * @module auth-state-manager
 * @description Manages authentication state across all extension contexts
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import ErrorHandler from './error-handler.js';

/**
 * Authentication State Manager for ForgetfulMe extension
 * @class AuthStateManager
 * @description Manages authentication state synchronization across all extension contexts
 * including popup, background, and options pages
 *
 * @example
 * const authManager = new AuthStateManager();
 * await authManager.initialize();
 * authManager.addListener('authStateChanged', (session) => {
 *   console.log('Auth state changed:', session);
 * });
 */
class AuthStateManager {
  /**
   * Initialize the authentication state manager
   * @constructor
   * @description Sets up the auth state manager with initial state and listener management
   */
  constructor() {
    /** @type {Object|null} Current authentication session */
    this.authState = null;
    /** @type {Set} Set of event listeners */
    this.listeners = new Set();
    /** @type {boolean} Whether the manager has been initialized */
    this.initialized = false;
  }

  /**
   * Initialize the authentication state manager
   * @description Loads current auth state from storage and sets up change listeners
   * @throws {Error} When initialization fails
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Load current auth state from storage
      const result = await chrome.storage.sync.get(['auth_session']);
      this.authState = result.auth_session || null;

      // Set up storage change listener
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync' && changes.auth_session) {
          this.handleAuthStateChange(changes.auth_session.newValue);
        }
      });

      this.initialized = true;
      // AuthStateManager initialized successfully
    } catch (error) {
      const errorResult = ErrorHandler.handle(
        error,
        'auth-state-manager.initialize'
      );
      throw ErrorHandler.createError(
        errorResult.userMessage,
        errorResult.errorInfo.type,
        'auth-state-manager.initialize'
      );
    }
  }

  /**
   * Get the current authentication state
   * @returns {Promise<Object|null>} Current authentication session or null if not authenticated
   */
  async getAuthState() {
    await this.ensureInitialized();
    return this.authState;
  }

  /**
   * Set the authentication state and notify all contexts
   * @param {Object|null} session - The authentication session object or null to clear
   * @description Updates the auth state, saves to storage, and notifies all extension contexts
   */
  async setAuthState(session) {
    await this.ensureInitialized();

    this.authState = session;

    try {
      // Save to storage (this will trigger storage.onChanged in other contexts)
      await chrome.storage.sync.set({ auth_session: session });
    } catch (error) {
      // Handle storage errors gracefully
      ErrorHandler.handle(error, 'auth-state-manager.setAuthState.storage');
      
      // Still notify contexts even if storage fails
      this.notifyAllContexts(session);
      this.notifyListeners('authStateChanged', session);
      
      // Re-throw to let caller know storage failed
      throw ErrorHandler.createError(
        'Failed to save authentication state to storage',
        'storage-error',
        'auth-state-manager.setAuthState'
      );
    }

    // Notify all contexts via runtime message
    this.notifyAllContexts(session);

    // Notify local listeners
    this.notifyListeners('authStateChanged', session);

    // Auth state updated successfully
  }

  /**
   * Clear authentication state
   * @description Removes auth state from storage and notifies all contexts
   */
  async clearAuthState() {
    await this.ensureInitialized();

    this.authState = null;

    // Remove from storage
    await chrome.storage.sync.remove(['auth_session']);

    // Notify all contexts
    this.notifyAllContexts(null);

    // Notify local listeners
    this.notifyListeners('authStateChanged', null);

    // Auth state cleared successfully
  }

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>} True if user is authenticated
   */
  async isAuthenticated() {
    await this.ensureInitialized();
    return this.authState !== null;
  }

  /**
   * Handle authentication state change from storage
   * @param {Object|null} newAuthState - New authentication state
   * @description Updates local state and notifies listeners of changes
   */
  handleAuthStateChange(newAuthState) {
    const oldAuthState = this.authState;
    this.authState = newAuthState;

    // Only notify if state actually changed
    if (oldAuthState !== newAuthState) {
      this.notifyListeners('authStateChanged', newAuthState);
      // Auth state changed via storage
    }
  }

  /**
   * Notify all extension contexts of auth state change
   * @param {Object|null} session - Current session object or null
   * @description Sends runtime message to all extension contexts
   */
  notifyAllContexts(session) {
    try {
      chrome.runtime
        .sendMessage({
          type: 'AUTH_STATE_CHANGED',
          session: session,
        })
        .catch(error => {
          ErrorHandler.handle(
            error,
            'auth-state-manager.notifyAllContexts.runtime'
          );
        });
    } catch (error) {
      ErrorHandler.handle(error, 'auth-state-manager.notifyAllContexts');
    }
  }

  /**
   * Add event listener
   * @param {string} event - Event name to listen for
   * @param {Function} callback - Callback function to execute
   * @description Registers a callback for auth state events
   */
  addListener(event, callback) {
    this.listeners.add({ event, callback });
  }

  /**
   * Remove event listener
   * @param {string} event - Event name to remove listener from
   * @param {Function} callback - Callback function to remove
   * @description Removes a specific event listener
   */
  removeListener(event, callback) {
    for (const listener of this.listeners) {
      if (listener.event === event && listener.callback === callback) {
        this.listeners.delete(listener);
        break;
      }
    }
  }

  /**
   * Notify all listeners of an event
   * @param {string} event - Event name to notify
   * @param {*} data - Data to pass to listeners
   * @description Executes all registered callbacks for an event
   */
  notifyListeners(event, data) {
    for (const listener of this.listeners) {
      if (listener.event === event) {
        try {
          listener.callback(data);
        } catch (error) {
          ErrorHandler.handle(error, 'auth-state-manager.notifyListeners');
        }
      }
    }
  }

  /**
   * Ensure manager is initialized
   * @description Initializes manager if not already done
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Get current auth state summary
   * @returns {Object} Summary object with auth state information
   * @description Returns a summary of current authentication state
   */
  getAuthSummary() {
    return {
      isAuthenticated: this.authState !== null,
      hasSession: !!this.authState,
      userId: this.authState?.user?.id || null,
      email: this.authState?.user?.email || null,
      initialized: this.initialized,
    };
  }
}

// Export for use in other files
export default AuthStateManager;
