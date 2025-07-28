/**
 * @fileoverview Authentication state management module for ForgetfulMe options page
 * @module options/modules/auth/auth-state-manager
 * @description Manages authentication state transitions and coordinates UI updates based on auth status
 * @since 1.0.0
 * @requires utils/error-handler
 */

import ErrorHandler from '../../../utils/error-handler.js';

/**
 * Authentication state manager for options page
 * @class AuthStateManager  
 * @description Coordinates authentication state changes between the auth UI and main interface
 * @since 1.0.0
 */
export class AuthStateManager {
  /**
   * Initialize the auth state manager
   * @constructor
   * @param {Object} dependencies - Required dependencies for auth management
   * @param {BaseAuthStateManager} dependencies.authStateManager - Base auth state manager instance
   * @param {AuthUI} dependencies.authUI - Authentication UI manager
   * @param {ConfigUI} dependencies.configUI - Configuration UI manager
   */
  constructor(dependencies) {
    this.authStateManager = dependencies.authStateManager;
    this.authUI = dependencies.authUI;
    this.configUI = dependencies.configUI;
    this.appContainer = null;
  }

  /**
   * Handle authentication state changes
   * @param {Object|null} session - Current session object or null if not authenticated
   * @param {Function} showMainInterface - Callback to display the main interface
   * @param {Function} loadData - Callback to load application data
   * @description Determines which interface to show based on authentication status
   * @returns {void}
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
   * @description Hides all other interfaces and displays the authentication login form
   * @returns {void}
   */
  showAuthInterface() {
    // Hide other interfaces
    const configInterface = document.getElementById('config-interface');
    const settingsInterface = document.getElementById('settings-interface');
    const errorInterface = document.getElementById('error-interface');
    
    if (configInterface) configInterface.hidden = true;
    if (settingsInterface) settingsInterface.hidden = true;
    if (errorInterface) errorInterface.hidden = true;
    
    // Show auth interface
    const authInterface = document.getElementById('auth-interface');
    if (authInterface) {
      authInterface.hidden = false;
      // Use auth interface as container for auth UI
      this.authUI.showLoginForm(authInterface);
    }
  }

  /**
   * Handle successful authentication
   * @param {Function} showMainInterface - Callback to display the main interface
   * @param {Function} loadData - Callback to load application data
   * @description Updates auth state in the manager and transitions to main interface
   * @returns {void}
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
   * @description Updates the app container reference for auth UI operations
   * @returns {void}
   */
  setAppContainer(appContainer) {
    this.appContainer = appContainer;
  }
}
