/**
 * @fileoverview Configuration UI component for ForgetfulMe extension
 * @module config-ui
 * @description Handles configuration user interface for Supabase setup and settings
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import ErrorHandler from './utils/error-handler.js';

/**
 * Configuration UI component for ForgetfulMe extension
 * @class ConfigUI
 * @description Handles configuration user interface for Supabase setup and settings
 *
 * @example
 * const configUI = new ConfigUI(supabaseConfig);
 * configUI.showConfigForm(container);
 * configUI.showConfigStatus(container);
 */
class ConfigUI {
  /**
   * Initialize the configuration UI component
   * @constructor
   * @param {Object} supabaseConfig - Supabase configuration instance
   * @description Sets up the configuration UI with Supabase configuration
   */
  constructor(supabaseConfig) {
    /** @type {Object} Supabase configuration instance */
    this.config = supabaseConfig;
  }

  /**
   * Display the configuration form
   * @param {HTMLElement} [container] - Optional container element (for backward compatibility)
   * @description Shows the Supabase configuration form using static HTML elements
   * @returns {void}
   * @since 1.0.0
   */
  showConfigForm(container) {
    // Get the main config interface section
    const configInterface = document.getElementById('config-interface');
    if (!configInterface) return;

    // Show form container, hide status container
    const formContainer = document.getElementById('config-form-container');
    const statusContainer = document.getElementById('config-status-container');
    const loadingContainer = document.getElementById('config-loading');

    if (formContainer) formContainer.hidden = false;
    if (statusContainer) statusContainer.hidden = true;
    if (loadingContainer) loadingContainer.hidden = true;

    // Clear any existing messages
    const messageContainer = document.getElementById('configMessage');
    if (messageContainer) messageContainer.innerHTML = '';

    // Bind form submission
    const configForm = document.getElementById('configForm');
    if (configForm) {
      configForm.onsubmit = e => {
        e.preventDefault();
        this.handleConfigSubmit();
      };
    }

    this.bindConfigEvents();
    this.loadCurrentConfig();
  }

  /**
   * Bind configuration form events
   * @description Sets up event listeners for configuration form interactions
   * @returns {void}
   * @private
   */
  bindConfigEvents() {
    // Form event is already bound in showConfigForm
  }

  /**
   * Load and display current configuration
   * @description Populates form fields with existing configuration values from storage
   * @returns {Promise<void>}
   * @async
   * @private
   */
  async loadCurrentConfig() {
    try {
      const currentConfig = await this.config.getConfiguration();

      if (currentConfig) {
        const urlInput = document.getElementById('supabaseUrl');
        const keyInput = document.getElementById('supabaseAnonKey');

        if (urlInput) urlInput.value = currentConfig.url || '';
        if (keyInput) keyInput.value = currentConfig.anonKey || '';

        this.showConfigMessage('Current configuration loaded', 'info');
      }
    } catch (error) {
      ErrorHandler.handle(error, 'config-ui.loadCurrentConfig', {
        silent: true,
      });
    }
  }

  /**
   * Handle configuration form submission
   * @description Validates form inputs, saves configuration to storage, and tests the connection
   * @returns {Promise<void>}
   * @async
   * @fires ConfigUI#configSaved
   * @fires ConfigUI#configError
   */
  async handleConfigSubmit() {
    const urlInput = document.getElementById('supabaseUrl');
    const keyInput = document.getElementById('supabaseAnonKey');

    const url = urlInput ? urlInput.value.trim() : '';
    const anonKey = keyInput ? keyInput.value.trim() : '';

    if (!url || !anonKey) {
      this.showConfigMessage('Please fill in all fields', 'error');
      return;
    }

    try {
      this.showConfigMessage('Saving configuration...', 'loading');

      const result = await this.config.setConfiguration(url, anonKey);

      if (result.success) {
        this.showConfigMessage('Configuration saved successfully!', 'success');

        // Test the configuration
        setTimeout(async () => {
          try {
            await this.config.initialize();
            this.showConfigMessage(
              'Configuration test successful! You can now use the extension.',
              'success'
            );
          } catch (error) {
            ErrorHandler.handle(error, 'config-ui.testConfiguration');
            this.showConfigMessage(
              'Configuration saved but test failed. Please check your credentials.',
              'error'
            );
          }
        }, 1000);
      } else {
        this.showConfigMessage(`Error: ${result.message}`, 'error');
      }
    } catch (error) {
      const errorResult = ErrorHandler.handle(
        error,
        'config-ui.handleConfigSubmit'
      );
      this.showConfigMessage(errorResult.userMessage, 'error');
    }
  }

  /**
   * Display configuration message
   * @param {string} message - Message to display to the user
   * @param {'success'|'error'|'info'|'loading'} type - Message type for styling
   * @description Shows user feedback messages in the static HTML message container
   * @returns {void}
   * @private
   */
  showConfigMessage(message, type) {
    const messageContainer = document.getElementById('configMessage');

    if (messageContainer) {
      messageContainer.className = `config-message ${type}`;
      messageContainer.innerHTML = message;
      messageContainer.setAttribute('aria-live', 'polite');
    }
  }

  /**
   * Display configuration status
   * @param {HTMLElement} [container] - Optional container element (for backward compatibility)
   * @description Shows current configuration status by revealing static HTML elements and loading current values
   * @returns {void}
   * @since 1.0.0
   */
  showConfigStatus(container) {
    // Show status container, hide form container
    const formContainer = document.getElementById('config-form-container');
    const statusContainer = document.getElementById('config-status-container');
    
    if (formContainer) formContainer.hidden = true;
    if (statusContainer) statusContainer.hidden = false;

    this.loadConfigStatus();
    this.bindStatusEvents();
  }

  /**
   * Load and display configuration status
   * @description Fetches current configuration from storage and updates the status display
   * @returns {Promise<void>}
   * @async
   * @private
   */
  async loadConfigStatus() {
    try {
      const config = await this.config.getConfiguration();

      if (config) {
        const urlEl = document.getElementById('statusUrl');
        const keyEl = document.getElementById('statusKey');

        if (urlEl) urlEl.textContent = config.url || 'Not set';
        if (keyEl)
          keyEl.textContent = config.anonKey
            ? `${config.anonKey.substring(0, 20)}...`
            : 'Not set';

        // Test connection
        await this.testConnection();
      } else {
        const urlEl = document.getElementById('statusUrl');
        const keyEl = document.getElementById('statusKey');
        const connectionEl = document.getElementById('statusConnection');

        if (urlEl) urlEl.textContent = 'Not configured';
        if (keyEl) keyEl.textContent = 'Not configured';
        if (connectionEl) connectionEl.textContent = 'Not configured';
      }
    } catch (error) {
      ErrorHandler.handle(error, 'config-ui.loadConfigStatus', {
        silent: true,
      });
    }
  }

  /**
   * Test Supabase connection
   * @description Attempts to initialize Supabase client and updates connection status display
   * @returns {Promise<void>}
   * @async
   */
  async testConnection() {
    const connectionEl = document.getElementById('statusConnection');

    try {
      await this.config.initialize();
      if (connectionEl) {
        connectionEl.textContent = 'Connected';
        connectionEl.className = 'status-value connected';
      }
    } catch {
      if (connectionEl) {
        connectionEl.textContent = 'Failed';
        connectionEl.className = 'status-value failed';
      }
    }
  }

  /**
   * Bind status page events
   * @description Sets up click event listeners for test connection and edit configuration buttons
   * @returns {void}
   * @private
   */
  bindStatusEvents() {
    const testBtn = document.getElementById('testConnectionBtn');
    const editBtn = document.getElementById('editConfigBtn');

    if (testBtn) {
      testBtn.onclick = async () => {
        testBtn.disabled = true;
        testBtn.textContent = 'Testing...';
        await this.testConnection();
        testBtn.disabled = false;
        testBtn.textContent = 'Test Connection';
      };
    }

    if (editBtn) {
      editBtn.onclick = () => {
        this.showConfigForm();
      };
    }
  }
}

// Export for use in other files
export default ConfigUI;
