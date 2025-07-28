/**
 * @fileoverview Options page initialization module for ForgetfulMe extension
 * @module options/modules/initialization/options-initializer
 * @description Handles options page DOM setup, service initialization, and app state determination
 * @since 1.0.0
 * @requires utils/ui-components
 * @requires utils/error-handler
 * @requires utils/ui-messages
 */

import UIComponents from '../../../utils/ui-components.js';
import ErrorHandler from '../../../utils/error-handler.js';
import UIMessages from '../../../utils/ui-messages.js';

/**
 * Options page initializer class
 * @class OptionsInitializer
 * @description Coordinates the initialization sequence for the options page including DOM setup and service configuration
 * @since 1.0.0
 */
export class OptionsInitializer {
  /**
   * Initialize the options page initializer
   * @constructor
   * @param {Object} dependencies - Required service dependencies
   * @param {SupabaseConfig} dependencies.supabaseConfig - Supabase configuration manager
   * @param {SupabaseService} dependencies.supabaseService - Supabase data service
   * @param {AuthStateManager} dependencies.authStateManager - Authentication state manager
   */
  constructor(dependencies) {
    this.supabaseConfig = dependencies.supabaseConfig;
    this.supabaseService = dependencies.supabaseService;
    this.authStateManager = dependencies.authStateManager;
    this.appContainer = null;
  }

  /**
   * Initialize the options page asynchronously
   * @description Waits for DOM ready, sets up elements, and initializes the application
   * @returns {Promise<void>}
   * @async
   */
  async initializeAsync() {
    try {
      // Wait for DOM to be ready
      await UIComponents.DOM.ready();

      this.initializeElements();
      await this.initializeApp();
      this.initializeAuthState();
    } catch (error) {
      ErrorHandler.handle(error, 'options.initializeAsync');
    }
  }

  /**
   * Initialize DOM elements
   * @description Sets up references to DOM elements for event binding
   */
  initializeElements() {
    // Initialize elements that exist in the initial HTML
    this.appContainer = UIComponents.DOM.getElement('main-content');

    // Re-initialize dynamically created elements with safe access
    this.statusTypesList = UIComponents.DOM.getElement('status-types-list');
    this.newStatusInput = UIComponents.DOM.getElement('new-status');
    this.addStatusBtn = UIComponents.DOM.getElement('add-status-btn');
    this.exportDataBtn = UIComponents.DOM.getElement('export-data-btn');
    this.importDataBtn = UIComponents.DOM.getElement('import-data-btn');
    this.importFile = UIComponents.DOM.getElement('import-file');
    this.clearDataBtn = UIComponents.DOM.getElement('clear-data-btn');

    // Stats elements
    this.totalEntries = UIComponents.DOM.getElement('total-entries');
    this.statusTypesCount = UIComponents.DOM.getElement('status-types-count');
    this.mostUsedStatus = UIComponents.DOM.getElement('most-used-status');
  }

  /**
   * Initialize the application
   * @description Checks configuration, initializes Supabase, and shows appropriate interface
   * @returns {Promise<Object>} Initialization result with interface type
   */
  async initializeApp() {
    try {
      // Check if Supabase is configured
      if (!(await this.supabaseConfig.isConfigured())) {
        return { interfaceType: 'config' };
      }

      // Initialize Supabase with retry mechanism
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          await this.supabaseService.initialize();
          break; // Success, exit the retry loop
        } catch (error) {
          retryCount++;
          // Supabase initialization attempt failed, retrying...

          if (retryCount >= maxRetries) {
            throw error; // Re-throw if we've exhausted retries
          }

          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Check if user is authenticated using auth state manager
      const isAuthenticated = await this.authStateManager.isAuthenticated();

      if (isAuthenticated) {
        return { interfaceType: 'main' };
      } else {
        return { interfaceType: 'auth' };
      }
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'options.initializeApp');
      if (errorResult.shouldShowToUser) {
        UIMessages.error(errorResult.userMessage, this.appContainer);
      }
      return { interfaceType: 'config' };
    }
  }

  /**
   * Initialize authentication state and listeners
   * @description Sets up auth state manager and message listeners
   * @param {Function} authStateChangeCallback - Callback for auth state changes
   * @returns {Promise<void>}
   */
  async initializeAuthState(authStateChangeCallback) {
    try {
      await this.authStateManager.initialize();

      // Listen for auth state changes
      this.authStateManager.addListener('authStateChanged', session => {
        authStateChangeCallback(session);
      });

      // Listen for runtime messages from background
      chrome.runtime.onMessage.addListener(
        (message, _sender, _sendResponse) => {
          if (message.type === 'AUTH_STATE_CHANGED') {
            authStateChangeCallback(message.session);
          }
        }
      );

      // Auth state initialized successfully
    } catch (error) {
      ErrorHandler.handle(error, 'options.initializeAuthState');
    }
  }

  /**
   * Get initialized DOM elements
   * @returns {Object} Object containing all initialized DOM elements
   */
  getElements() {
    return {
      appContainer: this.appContainer,
      statusTypesList: this.statusTypesList,
      newStatusInput: this.newStatusInput,
      addStatusBtn: this.addStatusBtn,
      exportDataBtn: this.exportDataBtn,
      importDataBtn: this.importDataBtn,
      importFile: this.importFile,
      clearDataBtn: this.clearDataBtn,
      totalEntries: this.totalEntries,
      statusTypesCount: this.statusTypesCount,
      mostUsedStatus: this.mostUsedStatus,
    };
  }
}
