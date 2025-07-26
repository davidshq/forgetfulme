/**
 * @fileoverview Authentication state management module for options page
 * @module auth-state-manager
 * @description Handles authentication state management and UI updates
 */

import ErrorHandler from '../../../utils/error-handler.js';

/**
 * Authentication state manager for options page
 * @class AuthStateManager
 * @description Manages authentication state and UI updates
 */
export class AuthStateManager {
  /**
   * Initialize the auth state manager
   * @constructor
   * @param {Object} dependencies - Required dependencies
   * @param {Object} dependencies.authStateManager - Auth state manager instance
   * @param {Object} dependencies.authUI - Auth UI manager
   * @param {Object} dependencies.configUI - Config UI manager
   */
  constructor(dependencies) {
    this.authStateManager = dependencies.authStateManager;
    this.authUI = dependencies.authUI;
    this.configUI = dependencies.configUI;
    this.appContainer = null;
  }

  /**
   * Handle authentication state changes
   * @param {Object|null} session - Current session object or null
   * @param {Function} showMainInterface - Callback to show main interface
   * @param {Function} loadData - Callback to load data
   * @description Updates UI based on authentication state
   */
  handleAuthStateChange(session, showMainInterface, loadData) {
    // Auth state changed - update UI accordingly

    // Update UI based on auth state
    if (session) {
      // User is authenticated - show main interface
      showMainInterface();
      loadData();
    } else {
      // User is not authenticated - show auth interface
      this.showAuthInterface();
    }
  }

  /**
   * Show authentication interface
   * @description Displays login form for user authentication
   */
  showAuthInterface() {
    this.authUI.showLoginForm(this.appContainer);
  }

  /**
   * Handle successful authentication
   * @param {Function} showMainInterface - Callback to show main interface
   * @param {Function} loadData - Callback to load data
   * @description Updates auth state and shows main interface
   */
  onAuthSuccess(showMainInterface, loadData) {
    // Update auth state in the manager
    this.authStateManager.setAuthState(this.authUI.supabaseConfig.session);

    showMainInterface();
    loadData();
  }

  /**
   * Set the app container reference
   * @param {HTMLElement} appContainer - The main app container element
   */
  setAppContainer(appContainer) {
    this.appContainer = appContainer;
  }
}
