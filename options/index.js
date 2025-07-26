/**
 * @fileoverview Main options page entry point
 * @module options
 * @description Orchestrates all options page modules and provides main entry point
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
import UIMessages from '../utils/ui-messages.js';

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
   * @description Sets up all modules with proper dependency injection
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
   * @description Sets up DOM elements, app initialization, and auth state
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
   * @param {string} interfaceType - Type of interface to show (config, auth, main)
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
   * @param {Object|null} session - Current session object or null
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
   * @description Displays Supabase configuration form
   */
  showConfigInterface() {
    this.configUI.showConfigForm(this.appContainer);
  }

  /**
   * Show authentication interface
   * @description Displays login form for user authentication
   */
  showAuthInterface() {
    this.authManager.showAuthInterface();
  }

  /**
   * Show main application interface
   * @description Creates and displays the main options interface
   */
  showMainInterface() {
    this.optionsInterface.showMainInterface();
    this.optionsInterface.bindEvents();
  }

  /**
   * Handle successful authentication
   * @description Updates auth state and shows main interface
   */
  onAuthSuccess() {
    this.authManager.onAuthSuccess(
      () => this.showMainInterface(),
      () => this.loadData()
    );
  }

  /**
   * Load and display application data
   * @description Fetches bookmarks and status types, updates UI
   */
  async loadData() {
    await this.dataManager.loadData();
  }

  /**
   * Open bookmark management interface in a new tab
   * @description Opens the bookmark management interface in a new tab for better usability
   */
  openBookmarkManagement() {
    // Open bookmark management page in a new tab
    chrome.tabs.create({
      url: chrome.runtime.getURL('bookmark-management.html'),
    });
  }

  /**
   * Show message to user
   * @param {string} message - Message to display
   * @param {string} type - Message type (success, error, info, loading)
   * @description Shows user feedback messages using centralized UIMessages system
   */
  showMessage(message, type) {
    // Use the centralized UIMessages system
    UIMessages.show(message, type, this.appContainer);
  }
}

// Initialize options page immediately (DOM ready is handled in constructor)
new ForgetfulMeOptions();

// Export for testing
export default ForgetfulMeOptions;
