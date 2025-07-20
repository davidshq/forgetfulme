// Authentication State Manager for ForgetfulMe extension
// Handles authentication state synchronization across all contexts
class AuthStateManager {
  constructor() {
    this.authState = null;
    this.listeners = new Set();
    this.initialized = false;
  }

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

  async getAuthState() {
    await this.ensureInitialized();
    return this.authState;
  }

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
