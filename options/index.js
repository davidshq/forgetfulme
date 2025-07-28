/**
 * @fileoverview Main options page entry point for ForgetfulMe extension
 * @module options/index
 * @description Orchestrates all options page modules, manages dependencies, and provides the main entry point
 * @since 1.0.0
 * @requires options/modules/initialization/options-initializer
 * @requires options/modules/auth/auth-state-manager
 * @requires options/modules/data/data-manager
 * @requires options/modules/ui/options-interface
 */

import { OptionsInitializer } from './modules/initialization/options-initializer.js';
import { AuthStateManager } from './modules/auth/auth-state-manager.js';
import { DataManager } from './modules/data/data-manager.js';
import { OptionsInterface } from './modules/ui/options-interface.js';

import ConfigManager from '../utils/config-manager.js';
import SupabaseConfig from '../supabase-config.js';
import SupabaseService from '../supabase-service.js';
import AuthUI from '../auth-ui.js';
import BaseAuthStateManager from '../utils/auth-state-manager.js';
import ConfigUI from '../config-ui.js';
import UIComponents from '../utils/ui-components.js';

// Make UIComponents globally available for UIMessages
window.UIComponents = UIComponents;

/**
 * Main options page class for ForgetfulMe extension
 * @class ForgetfulMeOptions
 * @description Orchestrates all options page modules and manages the main application flow
 *
 * @example
 * // The options page is automatically instantiated when options.html loads
 * // No manual instantiation required
 */
class ForgetfulMeOptions {
  /**
   * Initialize the options page with all required services and managers
   * @constructor
   * @description Sets up the options page with configuration, authentication, and service dependencies
   */
  constructor() {
    // Initialize core services
    this.configManager = new ConfigManager();
    this.authStateManager = new BaseAuthStateManager();
    this.supabaseConfig = new SupabaseConfig();
    this.supabaseService = new SupabaseService(this.supabaseConfig);
    this.authUI = new AuthUI(
      this.supabaseConfig,
      () => this.onAuthSuccess(),
      this.authStateManager
    );
    this.configUI = new ConfigUI(this.supabaseConfig);

    // Initialize modules with dependencies
    this.initializeModules();

    // Initialize after DOM is ready
    this.initializeAsync();
  }

  /**
   * Initialize all modules with their dependencies
   * @description Sets up all modules with proper dependency injection for loose coupling
   * @returns {void}
   * @private
   */
  initializeModules() {
    // Initialize the options initializer
    this.initializer = new OptionsInitializer({
      supabaseConfig: this.supabaseConfig,
      supabaseService: this.supabaseService,
      authStateManager: this.authStateManager,
    });

    // Initialize the auth state manager
    this.authManager = new AuthStateManager({
      authStateManager: this.authStateManager,
      authUI: this.authUI,
      configUI: this.configUI,
    });

    // Initialize the data manager (appContainer will be set later)
    this.dataManager = new DataManager({
      configManager: this.configManager,
      supabaseService: this.supabaseService,
      appContainer: null, // Will be set after initialization
    });

    // Initialize the options interface (appContainer will be set later)
    this.optionsInterface = new OptionsInterface({
      appContainer: null, // Will be set after initialization
      configUI: this.configUI,
      dataManager: this.dataManager,
    });
  }

  /**
   * Initialize the options page asynchronously
   * @description Sets up DOM elements, initializes the application, and configures auth state listeners
   * @returns {Promise<void>}
   * @async
   */
  async initializeAsync() {
    try {
      // Initialize the initializer
      await this.initializer.initializeAsync();

      // Get initialized elements
      const elements = this.initializer.getElements();
      this.appContainer = elements.appContainer;

      // Set app container for modules that need it
      this.dataManager.appContainer = this.appContainer;
      this.optionsInterface.appContainer = this.appContainer;
      this.authManager.setAppContainer(this.appContainer);

      // Initialize auth state with callbacks
      await this.initializer.initializeAuthState(session =>
        this.handleAuthStateChange(session)
      );

      // Get initialization result
      const initResult = await this.initializer.initializeApp();
      this.showInterface(initResult.interfaceType);
    } catch (error) {
      console.error('Failed to initialize options page:', error);
    }
  }

  /**
   * Show the appropriate interface based on initialization result
   * @param {'config'|'auth'|'main'} interfaceType - Type of interface to show
   * @description Routes to the appropriate interface based on app state
   * @returns {void}
   * @private
   */
  showInterface(interfaceType) {
    switch (interfaceType) {
      case 'config':
        this.showConfigInterface();
        break;
      case 'auth':
        this.showAuthInterface();
        break;
      case 'main':
        this.showMainInterface();
        this.loadData();
        break;
      default:
        this.showConfigInterface();
    }
  }

  /**
   * Handle authentication state changes
   * @param {Object|null} session - Current session object or null if not authenticated
   * @description Responds to authentication state changes by updating the UI
   * @returns {void}
   * @private
   */
  handleAuthStateChange(session) {
    this.authManager.handleAuthStateChange(
      session,
      () => this.showMainInterface(),
      () => this.loadData()
    );
  }

  /**
   * Show configuration interface
   * @description Hides other interfaces and displays the Supabase configuration form
   * @returns {void}
   */
  showConfigInterface() {
    // Hide other interfaces
    const authInterface = document.getElementById('auth-interface');
    const settingsInterface = document.getElementById('settings-interface');
    const errorInterface = document.getElementById('error-interface');
    
    if (authInterface) authInterface.hidden = true;
    if (settingsInterface) settingsInterface.hidden = true;
    if (errorInterface) errorInterface.hidden = true;
    
    // Show config interface
    const configInterface = document.getElementById('config-interface');
    if (configInterface) {
      configInterface.hidden = false;
      this.configUI.showConfigForm(configInterface);
    }
  }

  /**
   * Show authentication interface
   * @description Delegates to auth manager to display the login form
   * @returns {void}
   */
  showAuthInterface() {
    this.authManager.showAuthInterface();
  }

  /**
   * Show main application interface
   * @description Displays the main options interface with all cards and binds events
   * @returns {void}
   */
  showMainInterface() {
    this.optionsInterface.showMainInterface();
  }

  /**
   * Handle successful authentication
   * @description Callback for successful authentication that updates state and UI
   * @returns {void}
   * @private
   */
  onAuthSuccess() {
    this.authManager.onAuthSuccess(
      () => this.showMainInterface(),
      () => this.loadData()
    );
  }

  /**
   * Load and display application data
   * @description Delegates to data manager to fetch and display bookmarks and status types
   * @returns {Promise<void>}
   * @async
   */
  async loadData() {
    await this.dataManager.loadData();
  }


}

// Initialize options page immediately (DOM ready is handled in constructor)
new ForgetfulMeOptions();

// Export for testing
export default ForgetfulMeOptions;
