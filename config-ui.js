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
   * @param {HTMLElement} container - Container element to render the form
   * @description Shows the Supabase configuration form using static HTML
   */
  showConfigForm(container) {
    // Validate container parameter
    if (!container) {
      const error = ErrorHandler.createError(
        'Container element is required for config form',
        'config-ui.showConfigForm'
      );
      ErrorHandler.handle(error, 'config-ui.showConfigForm');
      return;
    }

    // Show config form container, hide status container
    const formContainer = container.querySelector('#config-form-container');
    const statusContainer = container.querySelector('#config-status-container');
    const loadingContainer = container.querySelector('#config-loading');

    if (formContainer) formContainer.hidden = false;
    if (statusContainer) statusContainer.hidden = true;
    if (loadingContainer) loadingContainer.hidden = true;

    // Clear any existing messages
    const messageContainer = container.querySelector('#configMessage');
    if (messageContainer) messageContainer.innerHTML = '';

    // Bind form submission
    const configForm = container.querySelector('#configForm');
    if (configForm) {
      configForm.onsubmit = e => {
        e.preventDefault();
        this.handleConfigSubmit(container);
      };
    }

    this.bindConfigEvents(container);
    this.loadCurrentConfig(container);
  }

  /**
   * Bind configuration form events
   * @param {HTMLElement} container - Container element
   * @description Sets up event listeners for configuration form interactions
   */
  bindConfigEvents(_container) {
    // Form event is handled by createForm, no additional binding needed
  }

  /**
   * Load and display current configuration
   * @param {HTMLElement} container - Container element
   * @description Populates form fields with existing configuration values
   */
  async loadCurrentConfig(container) {
    try {
      // Validate container parameter
      if (!container) {
        const error = ErrorHandler.createError(
          'Container element is required to load config',
          'config-ui.loadCurrentConfig'
        );
        ErrorHandler.handle(error, 'config-ui.loadCurrentConfig', {
          silent: true,
        });
        return;
      }

      const currentConfig = await this.config.getConfiguration();

      if (currentConfig) {
        const urlInput = container.querySelector('#supabaseUrl');
        const keyInput = container.querySelector('#supabaseAnonKey');

        if (urlInput) urlInput.value = currentConfig.url || '';
        if (keyInput) keyInput.value = currentConfig.anonKey || '';

        this.showConfigMessage(
          container,
          'Current configuration loaded',
          'info'
        );
      }
    } catch (error) {
      ErrorHandler.handle(error, 'config-ui.loadCurrentConfig', {
        silent: true,
      });
      // Don't show user for this error as it's not critical
    }
  }

  /**
   * Handle configuration form submission
   * @param {HTMLElement} container - Container element
   * @description Validates and saves configuration, then tests the connection
   */
  async handleConfigSubmit(container) {
    const urlInput = container.querySelector('#supabaseUrl');
    const keyInput = container.querySelector('#supabaseAnonKey');

    const url = urlInput ? urlInput.value.trim() : '';
    const anonKey = keyInput ? keyInput.value.trim() : '';

    if (!url || !anonKey) {
      this.showConfigMessage(container, 'Please fill in all fields', 'error');
      return;
    }

    try {
      this.showConfigMessage(container, 'Saving configuration...', 'loading');

      const result = await this.config.setConfiguration(url, anonKey);

      if (result.success) {
        this.showConfigMessage(
          container,
          'Configuration saved successfully!',
          'success'
        );

        // Test the configuration
        setTimeout(async () => {
          try {
            await this.config.initialize();
            this.showConfigMessage(
              container,
              'Configuration test successful! You can now use the extension.',
              'success'
            );
          } catch (error) {
            ErrorHandler.handle(error, 'config-ui.testConfiguration');
            this.showConfigMessage(
              container,
              'Configuration saved but test failed. Please check your credentials.',
              'error'
            );
          }
        }, 1000);
      } else {
        this.showConfigMessage(container, `Error: ${result.message}`, 'error');
      }
    } catch (error) {
      const errorResult = ErrorHandler.handle(
        error,
        'config-ui.handleConfigSubmit'
      );
      this.showConfigMessage(container, errorResult.userMessage, 'error');
    }
  }

  /**
   * Display configuration message
   * @param {HTMLElement} container - Container element
   * @param {string} message - Message to display
   * @param {string} type - Message type (success, error, info, loading)
   * @description Shows user feedback messages in static HTML message container
   */
  showConfigMessage(container, message, type) {
    const messageContainer = container.querySelector('#configMessage');

    if (messageContainer) {
      messageContainer.className = `config-message ${type}`;
      messageContainer.innerHTML = message;
      messageContainer.setAttribute('aria-live', 'polite');
    }
  }

  /**
   * Display configuration status
   * @param {HTMLElement} container - Container element
   * @description Shows current configuration status using static HTML
   */
  showConfigStatus(container) {
    // Validate container parameter
    if (!container) {
      const error = ErrorHandler.createError(
        'Container element is required for config status',
        'config-ui.showConfigStatus'
      );
      ErrorHandler.handle(error, 'config-ui.showConfigStatus');
      return;
    }

    // Show status container, hide form container
    const formContainer = container.querySelector('#config-form-container');
    const statusContainer = container.querySelector('#config-status-container');
    const loadingContainer = container.querySelector('#config-loading');

    if (formContainer) formContainer.hidden = true;
    if (statusContainer) statusContainer.hidden = false;
    if (loadingContainer) loadingContainer.hidden = true;

    this.loadConfigStatus(container);
    this.bindStatusEvents(container);
  }

  /**
   * Load and display configuration status
   * @param {HTMLElement} container - Container element
   * @description Updates status display with current configuration values
   */
  async loadConfigStatus(container) {
    try {
      const config = await this.config.getConfiguration();

      if (config) {
        const urlEl = container.querySelector('#statusUrl');
        const keyEl = container.querySelector('#statusKey');

        if (urlEl) urlEl.textContent = config.url || 'Not set';
        if (keyEl)
          keyEl.textContent = config.anonKey
            ? `${config.anonKey.substring(0, 20)}...`
            : 'Not set';

        // Test connection
        await this.testConnection(container);
      } else {
        const urlEl = container.querySelector('#statusUrl');
        const keyEl = container.querySelector('#statusKey');
        const connectionEl = container.querySelector('#statusConnection');

        if (urlEl) urlEl.textContent = 'Not configured';
        if (keyEl) keyEl.textContent = 'Not configured';
        if (connectionEl) connectionEl.textContent = 'Not configured';
      }
    } catch (error) {
      ErrorHandler.handle(error, 'config-ui.loadConfigStatus', {
        silent: true,
      });
      // Don't show user for this error as it's not critical
    }
  }

  /**
   * Test Supabase connection
   * @param {HTMLElement} container - Container element
   * @description Attempts to connect to Supabase and updates connection status
   */
  async testConnection(container) {
    const connectionEl = container.querySelector('#statusConnection');

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
   * @param {HTMLElement} container - Container element
   * @description Sets up event listeners for test connection and edit configuration buttons
   */
  bindStatusEvents(container) {
    const testBtn = container.querySelector('#testConnectionBtn');
    const editBtn = container.querySelector('#editConfigBtn');

    if (testBtn) {
      testBtn.onclick = async () => {
        await this.testConnection(container);
      };
    }

    if (editBtn) {
      editBtn.onclick = () => {
        this.showConfigForm(container);
      };
    }
  }
}

// Export for use in other files
export default ConfigUI;
