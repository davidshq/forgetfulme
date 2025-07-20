/**
 * @fileoverview Configuration UI component for ForgetfulMe extension
 * @module config-ui
 * @description Handles configuration user interface for Supabase setup and settings
 * 
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import UIComponents from './utils/ui-components.js';
import ErrorHandler from './utils/error-handler.js';
import UIMessages from './utils/ui-messages.js';

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

  showConfigForm(container) {
    // Create container with header
    const containerEl = UIComponents.createContainer(
      'Supabase Configuration',
      'Enter your Supabase project credentials to enable cloud sync',
      'config-container'
    );

    // Create config form
    const configForm = UIComponents.createForm(
      'configForm',
      (e, form) => this.handleConfigSubmit(document),
      [
        {
          type: 'url',
          id: 'supabaseUrl',
          label: 'Project URL',
          options: {
            placeholder: 'https://your-project.supabase.co',
            required: true,
            helpText: 'Your Supabase project URL (found in Settings > API)',
          },
        },
        {
          type: 'text',
          id: 'supabaseAnonKey',
          label: 'Anon Public Key',
          options: {
            placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            required: true,
            helpText: 'Your anon public key (found in Settings > API)',
          },
        },
      ],
      {
        submitText: 'Save Configuration',
        className: 'config-form',
      }
    );

    containerEl.appendChild(configForm);

    // Create help section
    const helpSection = UIComponents.createSection(
      'How to get your credentials:',
      'config-help'
    );
    helpSection.innerHTML = `
      <ol>
        <li>Go to <a href="https://supabase.com" target="_blank">supabase.com</a> and create an account</li>
        <li>Create a new project</li>
        <li>Go to Settings > API in your project dashboard</li>
        <li>Copy the "Project URL" and "anon public" key</li>
        <li>Paste them in the form above</li>
      </ol>
      
      <div class="config-note">
        <strong>Note:</strong> Your credentials are stored securely in your browser's sync storage and are never shared with anyone.
      </div>
    `;
    containerEl.appendChild(helpSection);

    // Create message container
    const messageContainer = document.createElement('div');
    messageContainer.id = 'configMessage';
    messageContainer.className = 'config-message';
    containerEl.appendChild(messageContainer);

    container.innerHTML = '';
    container.appendChild(containerEl);
    this.bindConfigEvents(container);
    this.loadCurrentConfig(container);
  }

  bindConfigEvents(container) {
    // Form event is handled by createForm, no additional binding needed
  }

  async loadCurrentConfig(container) {
    try {
      const currentConfig = await this.config.getConfiguration();

      if (currentConfig) {
        const urlInput = UIComponents.DOM.querySelector(
          '#supabaseUrl',
          container
        );
        const keyInput = UIComponents.DOM.querySelector(
          '#supabaseAnonKey',
          container
        );

        if (urlInput) urlInput.value = currentConfig.url || '';
        if (keyInput) keyInput.value = currentConfig.anonKey || '';

        UIMessages.info('Current configuration loaded', container);
      }
    } catch (error) {
      const errorResult = ErrorHandler.handle(
        error,
        'config-ui.loadCurrentConfig',
        { silent: true }
      );
      // Don't show user for this error as it's not critical
    }
  }

  async handleConfigSubmit(container) {
    const urlInput = UIComponents.DOM.querySelector('#supabaseUrl', container);
    const keyInput = UIComponents.DOM.querySelector(
      '#supabaseAnonKey',
      container
    );

    const url = urlInput ? urlInput.value.trim() : '';
    const anonKey = keyInput ? keyInput.value.trim() : '';

    if (!url || !anonKey) {
      UIMessages.error('Please fill in all fields', container);
      return;
    }

    try {
      UIMessages.loading('Saving configuration...', container);

      const result = await this.config.setConfiguration(url, anonKey);

      if (result.success) {
        UIMessages.success('Configuration saved successfully!', container);

        // Test the configuration
        setTimeout(async () => {
          try {
            await this.config.initialize();
            UIMessages.success(
              'Configuration test successful! You can now use the extension.',
              container
            );
          } catch (error) {
            const errorResult = ErrorHandler.handle(
              error,
              'config-ui.testConfiguration'
            );
            UIMessages.error(
              'Configuration saved but test failed. Please check your credentials.',
              container
            );
          }
        }, 1000);
      } else {
        UIMessages.error(`Error: ${result.message}`, container);
      }
    } catch (error) {
      const errorResult = ErrorHandler.handle(
        error,
        'config-ui.handleConfigSubmit'
      );
      UIMessages.error(errorResult.userMessage, container);
    }
  }

  showConfigMessage(container, message, type) {
    // Use the centralized UIMessages system
    UIMessages.show(message, type, container);
  }

  showConfigStatus(container) {
    const statusHTML = `
      <div class="config-status">
        <h3>Configuration Status</h3>
        <div class="status-item">
          <span class="status-label">Supabase URL:</span>
          <span class="status-value" id="statusUrl">-</span>
        </div>
        <div class="status-item">
          <span class="status-label">Anon Key:</span>
          <span class="status-value" id="statusKey">-</span>
        </div>
        <div class="status-item">
          <span class="status-label">Connection:</span>
          <span class="status-value" id="statusConnection">-</span>
        </div>
        
        <button id="testConnectionBtn" class="config-btn secondary">Test Connection</button>
        <button id="editConfigBtn" class="config-btn secondary">Edit Configuration</button>
      </div>
    `;

    container.innerHTML = statusHTML;
    this.loadConfigStatus(container);
    this.bindStatusEvents(container);
  }

  async loadConfigStatus(container) {
    try {
      const config = await this.config.getConfiguration();

      if (config) {
        const urlEl = UIComponents.DOM.querySelector('#statusUrl', container);
        const keyEl = UIComponents.DOM.querySelector('#statusKey', container);

        if (urlEl) urlEl.textContent = config.url || 'Not set';
        if (keyEl)
          keyEl.textContent = config.anonKey
            ? `${config.anonKey.substring(0, 20)}...`
            : 'Not set';

        // Test connection
        await this.testConnection(container);
      } else {
        const urlEl = UIComponents.DOM.querySelector('#statusUrl', container);
        const keyEl = UIComponents.DOM.querySelector('#statusKey', container);
        const connectionEl = UIComponents.DOM.querySelector(
          '#statusConnection',
          container
        );

        if (urlEl) urlEl.textContent = 'Not configured';
        if (keyEl) keyEl.textContent = 'Not configured';
        if (connectionEl) connectionEl.textContent = 'Not configured';
      }
    } catch (error) {
      const errorResult = ErrorHandler.handle(
        error,
        'config-ui.loadConfigStatus',
        { silent: true }
      );
      // Don't show user for this error as it's not critical
    }
  }

  async testConnection(container) {
    const connectionEl = UIComponents.DOM.querySelector(
      '#statusConnection',
      container
    );

    try {
      await this.config.initialize();
      if (connectionEl) {
        connectionEl.textContent = 'Connected';
        connectionEl.className = 'status-value connected';
      }
    } catch (error) {
      if (connectionEl) {
        connectionEl.textContent = 'Failed';
        connectionEl.className = 'status-value failed';
      }
    }
  }

  bindStatusEvents(container) {
    const testBtn = UIComponents.DOM.querySelector(
      '#testConnectionBtn',
      container
    );
    const editBtn = UIComponents.DOM.querySelector('#editConfigBtn', container);

    if (testBtn) {
      testBtn.addEventListener('click', async () => {
        await this.testConnection(container);
      });
    }

    if (editBtn) {
      editBtn.addEventListener('click', () => {
        this.showConfigForm(container);
      });
    }
  }
}

// Export for use in other files
export default ConfigUI;
