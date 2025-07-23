/**
 * @fileoverview Authentication State Manager for ForgetfulMe extension
 * @module auth-state-manager
 * @description Handles authentication state synchronization across all extension contexts
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

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
   * @async
   * @method initialize
   * @description Loads current auth state from storage and sets up change listeners
   * @throws {Error} When initialization fails
   *
   * @example
   * const authManager = new AuthStateManager();
   * await authManager.initialize();
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
      console.log(
        'AuthStateManager initialized, current state:',
        this.authState ? 'authenticated' : 'not authenticated'
      );
    } catch (error) {
      console.error('Error initializing AuthStateManager:', error);
      throw error;
    }
  }

  /**
   * Get the current authentication state
   * @async
   * @method getAuthState
   * @description Returns the current authentication session object
   * @returns {Promise<Object|null>} Current authentication session or null if not authenticated
   *
   * @example
   * const session = await authManager.getAuthState();
   * if (session) {
   *   console.log('User is authenticated:', session.user.email);
   * }
   */
  async getAuthState() {
    await this.ensureInitialized();
    return this.authState;
  }

  /**
   * Set the authentication state and notify all contexts
   * @async
   * @method setAuthState
   * @param {Object|null} session - The authentication session object or null to clear
   * @description Updates the auth state, saves to storage, and notifies all extension contexts
   *
   * @example
   * // Set authenticated state
   * await authManager.setAuthState(session);
   *
   * // Clear authentication
   * await authManager.setAuthState(null);
   */
  async setAuthState(session) {
    await this.ensureInitialized();

    this.authState = session;

    // Save to storage (this will trigger storage.onChanged in other contexts)
    await chrome.storage.sync.set({ auth_session: session });

    // Notify all contexts via runtime message
    this.notifyAllContexts(session);

    // Notify local listeners
    this.notifyListeners('authStateChanged', session);

    console.log(
      'Auth state updated:',
      session ? 'authenticated' : 'not authenticated'
    );
  }

  async clearAuthState() {
    await this.ensureInitialized();

    this.authState = null;

    // Remove from storage
    await chrome.storage.sync.remove(['auth_session']);

    // Notify all contexts
    this.notifyAllContexts(null);

    // Notify local listeners
    this.notifyListeners('authStateChanged', null);

    console.log('Auth state cleared');
  }

  async isAuthenticated() {
    await this.ensureInitialized();
    return this.authState !== null;
  }

  handleAuthStateChange(newAuthState) {
    const oldAuthState = this.authState;
    this.authState = newAuthState;

    // Only notify if state actually changed
    if (oldAuthState !== newAuthState) {
      this.notifyListeners('authStateChanged', newAuthState);
      console.log(
        'Auth state changed via storage:',
        newAuthState ? 'authenticated' : 'not authenticated'
      );
    }
  }

  notifyAllContexts(session) {
    try {
      chrome.runtime
        .sendMessage({
          type: 'AUTH_STATE_CHANGED',
          session: session,
        })
        .catch(error => {
          // Ignore errors when no listeners are available
          console.debug(
            'No runtime message listeners available:',
            error.message
          );
        });
    } catch (error) {
      console.debug('Error sending auth state message:', error.message);
    }
  }

  // Event listener management
  addListener(event, callback) {
    this.listeners.add({ event, callback });
  }

  removeListener(event, callback) {
    for (const listener of this.listeners) {
      if (listener.event === event && listener.callback === callback) {
        this.listeners.delete(listener);
        break;
      }
    }
  }

  notifyListeners(event, data) {
    for (const listener of this.listeners) {
      if (listener.event === event) {
        try {
          listener.callback(data);
        } catch (error) {
          console.error('Error in auth state listener:', error);
        }
      }
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  // Get current auth state summary
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
