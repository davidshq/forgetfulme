/**
 * @fileoverview Authentication service for the ForgetfulMe extension
 */

import { createClient } from '../lib/supabase.js';
import { withServicePatterns } from '../utils/serviceHelpers.js';
import { TIME_CALCULATIONS } from '../utils/constants.js';

/**
 * Service for managing user authentication with Supabase
 */
export class AuthService extends withServicePatterns(class {}) {
  // Static instance tracking for cleanup
  static currentInstance = null;

  /**
   * @param {ConfigService} configService - Configuration service
   * @param {StorageService} storageService - Storage service
   * @param {ErrorService} errorService - Error handling service
   * @param {LoggingService} [loggingService] - Optional logging service
   */
  constructor(configService, storageService, errorService, loggingService = null) {
    super();

    // Clean up previous instance if exists
    if (AuthService.currentInstance) {
      AuthService.currentInstance.cleanup();
    }
    AuthService.currentInstance = this;

    this.configService = configService;
    this.storageService = storageService;
    this.errorService = errorService;
    this.loggingService = loggingService;
    this.currentUser = null;
    this.authChangeListeners = new Set();
    this.supabaseClient = null;
    this.isInitialized = false;

    // Race condition prevention
    this.sessionOperationInProgress = false;
    this.sessionOperationQueue = [];
  }

  /**
   * Initialize Supabase client
   * @returns {Promise<boolean>} True if initialized successfully, false if config missing
   */
  async initialize() {
    try {
      this.loggingService?.debug('AuthService', 'Initializing authentication service');
      const config = await this.configService.getSupabaseConfig();
      if (!config) {
        this.loggingService?.info('AuthService', 'No configuration found - configuration required');
        console.log('[AuthService] No configuration found - configuration required');
        this.supabaseClient = null;
        this.isInitialized = false;
        return false;
      }

      // Create official Supabase client
      this.supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey);
      this.isInitialized = true;
      this.loggingService?.info('AuthService', 'Supabase client initialized successfully');

      // Restore session from storage (don't let this fail initialization)
      try {
        await this.restoreSession();
        this.loggingService?.debug('AuthService', 'Session restored successfully');
      } catch (sessionError) {
        // Session restoration failure is normal - just log it and continue
        this.loggingService?.debug(
          'AuthService',
          'No valid session to restore (normal for first-time users)'
        );
        console.log('[AuthService] No valid session to restore (normal for first-time users)');
      }

      return true;
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'AuthService.initialize');
      this.loggingService?.error('AuthService', 'Initialization failed', error);
      console.error('[AuthService] Initialization failed:', errorInfo.message);
      this.supabaseClient = null;
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Check if the AuthService is properly configured and initialized
   * @returns {boolean} True if ready to use
   */
  isConfigured() {
    return this.isInitialized && this.supabaseClient !== null;
  }

  /**
   * Sign in with email and password (synchronized to prevent race conditions)
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User session
   */
  async signIn(email, password) {
    return this.withSessionLock(async () => {
      try {
        await this.ensureConfigured();

        const response = await this.supabaseClient.auth.signInWithPassword({
          email,
          password
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        const session = response.data.session;
        if (!session) {
          throw new Error('No session returned from sign in');
        }

        await this.handleAuthSuccess(session);
        return this.currentUser;
      } catch (error) {
        this.handleAndThrow(error, 'AuthService.signIn');
      }
    });
  }

  /**
   * Sign up with email and password (synchronized to prevent race conditions)
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User session
   */
  async signUp(email, password) {
    return this.withSessionLock(async () => {
      try {
        await this.ensureConfigured();

        const response = await this.supabaseClient.auth.signUp({
          email,
          password
        });

        if (response.error) {
          const error = new Error(response.error.message);
          error.status = response.error.status;
          throw error;
        }

        // Log response for debugging
        console.log('SignUp response:', {
          hasSession: !!response.data.session,
          hasUser: !!response.data.user,
          userEmailConfirmed: response.data.user?.email_confirmed_at,
          user: JSON.stringify(response.data.user, null, 2),
          session: JSON.stringify(response.data.session, null, 2)
        });

        // Handle email confirmation requirement
        // Check both possible fields for email verification status
        const emailNotConfirmed =
          response.data.user &&
          (response.data.user.email_confirmed_at === null ||
            response.data.user.email_confirmed_at === undefined ||
            (response.data.user.user_metadata &&
              response.data.user.user_metadata.email_verified === false));

        if (!response.data.session && response.data.user && emailNotConfirmed) {
          // Email confirmation required - handle through extension UI
          console.log('Email confirmation required for:', response.data.user.email);
          return {
            requiresConfirmation: true,
            email: response.data.user.email
          };
        }

        const session = response.data.session;
        if (!session) {
          throw new Error('No session returned from sign up');
        }

        await this.handleAuthSuccess(session);
        return this.currentUser;
      } catch (error) {
        this.handleAndThrow(error, 'AuthService.signUp');
      }
    });
  }

  /**
   * Sign out current user (synchronized to prevent race conditions)
   * @returns {Promise<void>}
   */
  async signOut() {
    return this.withSessionLock(async () => {
      try {
        if (this.supabaseClient) {
          await this.supabaseClient.auth.signOut();
        }

        await this.handleAuthSignOut();
      } catch (error) {
        this.handleAndThrow(error, 'AuthService.signOut');
      }
    });
  }

  /**
   * Get current user
   * @returns {Object|null} Current user or null
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Whether user is authenticated
   */
  isAuthenticated() {
    return this.currentUser !== null;
  }

  /**
   * Get current session (synchronized to prevent race conditions)
   * @returns {Promise<Object|null>} Current session or null
   */
  async getSession() {
    return this.withSessionLock(async () => {
      try {
        const configured = await this.ensureConfigured(false);
        if (!configured) {
          return null;
        }

        const { data } = await this.supabaseClient.auth.getSession();
        return data.session;
      } catch (error) {
        this.errorService.handle(error, 'AuthService.getSession');
        return null;
      }
    });
  }

  /**
   * Refresh current session (synchronized to prevent race conditions)
   * @returns {Promise<Object|null>} Refreshed session or null
   */
  async refreshSession() {
    return this.withSessionLock(async () => {
      return this._refreshSessionInternal();
    });
  }

  /**
   * Internal refresh session implementation (without synchronization)
   * @returns {Promise<Object|null>} Refreshed session or null
   * @private
   */
  async _refreshSessionInternal() {
    try {
      const configured = await this.ensureConfigured(false);
      if (!configured) {
        return null;
      }

      const { data, error } = await this.supabaseClient.auth.refreshSession();

      if (error) {
        throw new Error(error.message);
      }

      if (data.session) {
        await this.handleAuthSuccess(data.session);
        return this.currentUser;
      }

      return null;
    } catch (error) {
      // Don't log "Auth session missing" as an error - it's normal when no user is signed in
      if (!error.message?.includes('Auth session missing')) {
        this.errorService.handle(error, 'AuthService.refreshSession');
      }
      await this.handleAuthSignOut();
      return null;
    }
  }

  /**
   * Add authentication state change listener
   * @param {Function} callback - Callback function
   * @returns {Function} Cleanup function
   */
  addAuthChangeListener(callback) {
    this.authChangeListeners.add(callback);

    // Return cleanup function
    return () => {
      this.authChangeListeners.delete(callback);
    };
  }

  /**
   * Get user profile from Supabase
   * @returns {Promise<Object|null>} User profile or null
   */
  async getUserProfile() {
    try {
      if (!this.isAuthenticated() || !this.supabaseClient) {
        return null;
      }

      const { data, error } = await this.supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('id', this.currentUser.id);

      if (error) {
        throw new Error(error.message);
      }

      return Array.isArray(data) && data.length > 0 ? data[0] : null;
    } catch (error) {
      this.errorService.handle(error, 'AuthService.getUserProfile');
      return null;
    }
  }

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated profile
   */
  async updateUserProfile(profileData) {
    try {
      // Type safety: validate profileData
      if (profileData === null || profileData === undefined) {
        throw new Error('Profile data cannot be null or undefined');
      }

      if (typeof profileData !== 'object' || Array.isArray(profileData)) {
        throw new Error('Profile data must be an object');
      }

      if (Object.keys(profileData).length === 0) {
        throw new Error('Profile data cannot be empty');
      }

      if (!this.isAuthenticated() || !this.supabaseClient) {
        throw new Error('User not authenticated');
      }

      // Ensure currentUser exists before accessing its properties
      if (!this.currentUser || !this.currentUser.id) {
        throw new Error('Current user information not available');
      }

      const { data, error } = await this.supabaseClient
        .from('user_profiles')
        .update(profileData)
        .eq('id', this.currentUser.id)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      return Array.isArray(data) && data.length > 0 ? data[0] : null;
    } catch (error) {
      this.handleAndThrow(error, 'AuthService.updateUserProfile');
    }
  }

  /**
   * Reset password
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  async resetPassword(email) {
    try {
      await this.ensureConfigured();

      const { error } = await this.supabaseClient.auth.resetPasswordForEmail(email);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      this.handleAndThrow(error, 'AuthService.resetPassword');
    }
  }

  /**
   * Handle successful authentication
   * @param {Object} session - Supabase session
   * @private
   */
  async handleAuthSuccess(session) {
    try {
      this.currentUser = {
        id: session.user.id,
        email: session.user.email,
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      };

      // Store session in Chrome storage
      await this.storageService.setUserSession(this.currentUser);

      // Notify listeners
      this.notifyAuthChange(this.currentUser);
    } catch (error) {
      this.handleAndThrow(error, 'AuthService.handleAuthSuccess');
    }
  }

  /**
   * Handle sign out
   * @private
   */
  async handleAuthSignOut() {
    try {
      this.currentUser = null;

      // Clear session from storage
      await this.storageService.clearUserSession();

      // Clear bookmark cache on sign out
      await this.storageService.clearBookmarkCache();

      // Notify listeners
      this.notifyAuthChange(null);
    } catch (error) {
      this.handleAndThrow(error, 'AuthService.handleAuthSignOut');
    }
  }

  /**
   * Synchronization wrapper to prevent race conditions in session operations
   * @param {Function} operation - Async operation to execute
   * @returns {Promise<any>} Result of the operation
   * @private
   */
  async withSessionLock(operation) {
    return new Promise((resolve, reject) => {
      this.sessionOperationQueue.push({ operation, resolve, reject });
      this.processSessionQueue();
    });
  }

  /**
   * Process queued session operations sequentially
   * @private
   */
  async processSessionQueue() {
    if (this.sessionOperationInProgress || this.sessionOperationQueue.length === 0) {
      return;
    }

    this.sessionOperationInProgress = true;

    while (this.sessionOperationQueue.length > 0) {
      const { operation, resolve, reject } = this.sessionOperationQueue.shift();

      try {
        const result = await operation();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.sessionOperationInProgress = false;
  }

  /**
   * Restore session from storage
   * @private
   */
  async restoreSession() {
    return this.withSessionLock(async () => {
      try {
        const storedSession = await this.storageService.getUserSession();

        if (!storedSession) {
          return;
        }

        // Check if session is expired - handle both seconds and milliseconds format
        if (storedSession.expires_at) {
          const currentTime = Date.now();
          const expiryTime = storedSession.expires_at;

          // Determine if expires_at is in seconds or milliseconds
          // If expires_at is much smaller than current time, it's likely in seconds
          const isInSeconds = expiryTime < currentTime / 100; // Simple heuristic

          const expiryTimeMs = isInSeconds
            ? expiryTime * TIME_CALCULATIONS.MILLISECONDS_PER_SECOND
            : expiryTime;

          if (currentTime > expiryTimeMs) {
            await this.handleAuthSignOut();
            return;
          }
        }

        // Restore session in Supabase client
        if (this.supabaseClient && storedSession.access_token) {
          await this.supabaseClient.auth.setSession({
            access_token: storedSession.access_token,
            refresh_token: storedSession.refresh_token
          });
        }

        this.currentUser = storedSession;

        // Schedule session refresh outside of the lock to avoid nested locking
        setTimeout(() => {
          this._refreshSessionInternal().catch(error => {
            console.log('[AuthService] Failed to refresh session after restore:', error.message);
          });
        }, 0);
      } catch (error) {
        // If restoration fails, clear the stored session
        // Don't log "Auth session missing" as an error - it's normal
        if (!error.message?.includes('Auth session missing')) {
          console.log('[AuthService] Session restoration failed:', error.message);
        }
        await this.handleAuthSignOut();
      }
    });
  }

  /**
   * Notify authentication state change listeners
   * @param {Object|null} user - Current user or null
   * @private
   */
  notifyAuthChange(user) {
    this.authChangeListeners.forEach(callback => {
      try {
        callback(user);
      } catch (error) {
        this.errorService.handle(error, 'AuthService.authChangeListener');
      }
    });
  }

  /**
   * Get authentication status summary
   * @returns {Object} Authentication status
   */
  getAuthStatus() {
    return {
      isAuthenticated: this.isAuthenticated(),
      user: this.currentUser
        ? {
            id: this.currentUser.id,
            email: this.currentUser.email,
            expires_at: this.currentUser.expires_at
          }
        : null,
      hasSupabaseConfig: this.supabaseClient !== null
    };
  }

  /**
   * Cleanup service resources
   * @private
   */
  cleanup() {
    // Clear all auth change listeners
    this.authChangeListeners.clear();

    // NOTE: Supabase auth state cleanup is handled by service recreation
    // We cannot safely unsubscribe from auth state changes as the subscription
    // is managed by the Supabase client instance

    // Clear references
    this.currentUser = null;
    this.supabaseClient = null;
    this.isInitialized = false;
  }
}
