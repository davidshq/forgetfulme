/**
 * @fileoverview Application initialization utility
 * @module utils/app-initializer
 * @description Provides common app initialization logic for popup, options, and bookmark-management pages
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { retryWithBackoff } from './retry-utils.js';
import ErrorHandler from './error-handler.js';
import UIMessages from './ui-messages.js';

/**
 * Initialize application with Supabase and authentication checks
 * @param {Object} options - Initialization options
 * @param {SupabaseConfig} options.supabaseConfig - Supabase configuration manager
 * @param {SupabaseService} options.supabaseService - Supabase service instance
 * @param {AuthStateManager} options.authStateManager - Authentication state manager
 * @param {Function} options.onConfigured - Callback when Supabase is not configured
 * @param {Function} options.onAuthenticated - Callback when user is authenticated
 * @param {Function} options.onUnauthenticated - Callback when user is not authenticated
 * @param {HTMLElement} options.appContainer - Container element for error messages
 * @param {string} options.context - Context name for error handling (e.g., 'popup.initializeApp')
 * @returns {Promise<void>}
 *
 * @example
 * await initializeApp({
 *   supabaseConfig,
 *   supabaseService,
 *   authStateManager,
 *   onConfigured: () => this.showSetupInterface(),
 *   onAuthenticated: () => { this.showMainInterface(); this.loadData(); },
 *   onUnauthenticated: () => this.showAuthInterface(),
 *   appContainer: this.appContainer,
 *   context: 'popup.initializeApp'
 * });
 */
export async function initializeApp(options) {
  const {
    supabaseConfig,
    supabaseService,
    authStateManager,
    onConfigured,
    onAuthenticated,
    onUnauthenticated,
    appContainer,
    context = 'app.initializeApp',
  } = options;

  try {
    // Check if Supabase is configured
    if (!(await supabaseConfig.isConfigured())) {
      onConfigured();
      return;
    }

    // Initialize Supabase with retry mechanism
    await retryWithBackoff(() => supabaseService.initialize());

    // Check if user is authenticated
    const isAuthenticated = await authStateManager.isAuthenticated();

    if (isAuthenticated) {
      onAuthenticated();
    } else {
      onUnauthenticated();
    }
  } catch (error) {
    const errorResult = ErrorHandler.handle(error, context);
    if (errorResult.shouldShowToUser && appContainer) {
      UIMessages.error(errorResult.userMessage, appContainer);
    }
    onConfigured();
  }
}
