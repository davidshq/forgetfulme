/**
 * @fileoverview Authentication service for the ForgetfulMe extension
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Service for managing user authentication with Supabase
 */
export class AuthService {
  /**
   * @param {ConfigService} configService - Configuration service
   * @param {StorageService} storageService - Storage service
   * @param {ErrorService} errorService - Error handling service
   */
  constructor(configService, storageService, errorService) {
    this.configService = configService;
    this.storageService = storageService;
    this.errorService = errorService;
    this.currentUser = null;
    this.authChangeListeners = new Set();
    this.supabaseClient = null;
  }

  /**
   * Initialize Supabase client
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      const config = await this.configService.getSupabaseConfig();
      if (!config) {
        throw new Error('Supabase configuration not found');
      }

      // Create official Supabase client
      this.supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey);

      // Restore session from storage
      await this.restoreSession();
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'AuthService.initialize');
      throw new Error(errorInfo.message);
    }
  }

  /**
   * Sign in with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User session
   */
  async signIn(email, password) {
    try {
      if (!this.supabaseClient) {
        await this.initialize();
      }

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
      const errorInfo = this.errorService.handle(error, 'AuthService.signIn');
      throw new Error(errorInfo.message);
    }
  }

  /**
   * Sign up with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User session
   */
  async signUp(email, password) {
    try {
      if (!this.supabaseClient) {
        await this.initialize();
      }

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
      const emailNotConfirmed = response.data.user && (
        response.data.user.email_confirmed_at === null ||
        response.data.user.email_confirmed_at === undefined ||
        (response.data.user.user_metadata && response.data.user.user_metadata.email_verified === false)
      );

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
      const errorInfo = this.errorService.handle(error, 'AuthService.signUp');
      throw new Error(errorInfo.message);
    }
  }

  /**
   * Sign out current user
   * @returns {Promise<void>}
   */
  async signOut() {
    try {
      if (this.supabaseClient) {
        await this.supabaseClient.auth.signOut();
      }

      await this.handleAuthSignOut();
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'AuthService.signOut');
      throw new Error(errorInfo.message);
    }
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
   * Get current session
   * @returns {Promise<Object|null>} Current session or null
   */
  async getSession() {
    try {
      if (!this.supabaseClient) {
        await this.initialize();
      }

      const { data } = await this.supabaseClient.auth.getSession();
      return data.session;
    } catch (error) {
      this.errorService.handle(error, 'AuthService.getSession');
      return null;
    }
  }

  /**
   * Refresh current session
   * @returns {Promise<Object|null>} Refreshed session or null
   */
  async refreshSession() {
    try {
      if (!this.supabaseClient) {
        await this.initialize();
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
      this.errorService.handle(error, 'AuthService.refreshSession');
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

      return data.length > 0 ? data[0] : null;
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
      if (!this.isAuthenticated() || !this.supabaseClient) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabaseClient
        .from('user_profiles')
        .update(profileData)
        .eq('id', this.currentUser.id)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      return data[0];
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'AuthService.updateUserProfile');
      throw new Error(errorInfo.message);
    }
  }

  /**
   * Reset password
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  async resetPassword(email) {
    try {
      if (!this.supabaseClient) {
        await this.initialize();
      }

      const { error } = await this.supabaseClient.auth.resetPasswordForEmail(email);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      const errorInfo = this.errorService.handle(error, 'AuthService.resetPassword');
      throw new Error(errorInfo.message);
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
      const errorInfo = this.errorService.handle(error, 'AuthService.handleAuthSuccess');
      throw new Error(errorInfo.message);
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
      const errorInfo = this.errorService.handle(error, 'AuthService.handleAuthSignOut');
      throw new Error(errorInfo.message);
    }
  }

  /**
   * Restore session from storage
   * @private
   */
  async restoreSession() {
    try {
      const storedSession = await this.storageService.getUserSession();

      if (!storedSession) {
        return;
      }

      // Check if session is expired
      if (storedSession.expires_at && Date.now() / 1000 > storedSession.expires_at) {
        await this.handleAuthSignOut();
        return;
      }

      // Restore session in Supabase client
      if (this.supabaseClient && storedSession.access_token) {
        await this.supabaseClient.auth.setSession({
          access_token: storedSession.access_token,
          refresh_token: storedSession.refresh_token
        });
      }

      this.currentUser = storedSession;

      // Try to refresh the session
      await this.refreshSession();
    } catch (error) {
      // If restoration fails, clear the stored session
      await this.handleAuthSignOut();
    }
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
}
