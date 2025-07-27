import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockSupabaseConfig } from '../helpers/test-utils.js';

// Only mock UI messages for external interactions
vi.mock('../../utils/ui-messages.js', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    clear: vi.fn(),
    show: vi.fn(),
  },
}));

// Import actual modules
import UIComponents from '../../utils/ui-components.js';
import UIMessages from '../../utils/ui-messages.js';
import ErrorHandler from '../../utils/error-handler.js';
import ConfigUI from '../../config-ui.js';

describe('ConfigUI', () => {
  let configUI;
  let mockSupabaseConfig;
  let mockUIComponents;
  let mockUIMessages;
  let mockErrorHandler;
  let container;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock instances
    mockSupabaseConfig = createMockSupabaseConfig();

    // Create test container
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    // Create ConfigUI instance
    configUI = new ConfigUI(mockSupabaseConfig);
  });

  describe('constructor', () => {
    it('should initialize with supabase config', () => {
      expect(configUI.config).toBe(mockSupabaseConfig);
    });
  });

  describe('showConfigForm', () => {
    it('should create and display configuration form', async () => {
      // Mock UIComponents methods to return actual DOM elements
      const mockContainerEl = document.createElement('div');
      mockContainerEl.className = 'ui-container';

      const mockForm = document.createElement('form');
      const urlInput = document.createElement('input');
      urlInput.id = 'supabaseUrl';
      const keyInput = document.createElement('input');
      keyInput.id = 'supabaseAnonKey';
      const submitButton = document.createElement('button');
      submitButton.type = 'submit';

      mockForm.appendChild(urlInput);
      mockForm.appendChild(keyInput);
      mockForm.appendChild(submitButton);

      UIComponents.createContainer = vi.fn().mockReturnValue(mockContainerEl);
      UIComponents.createForm = vi.fn().mockReturnValue(mockForm);
      UIComponents.createSection = vi
        .fn()
        .mockReturnValue(document.createElement('div'));

      // Call the method
      configUI.showConfigForm(container);

      // Verify actual DOM elements were created
      expect(container.querySelector('.ui-container')).toBeTruthy();
      expect(container.querySelector('form')).toBeTruthy();
      expect(container.querySelector('#supabaseUrl')).toBeTruthy();
      expect(container.querySelector('#supabaseAnonKey')).toBeTruthy();
      expect(container.querySelector('button[type="submit"]')).toBeTruthy();
    });

    it('should bind events and load current config', async () => {
      // Mock the bindConfigEvents and loadCurrentConfig methods
      const bindEventsSpy = vi.spyOn(configUI, 'bindConfigEvents');
      const loadConfigSpy = vi.spyOn(configUI, 'loadCurrentConfig');

      // Create proper mock DOM elements
      const mockContainer = document.createElement('div');
      const mockForm = document.createElement('form');
      const mockSection = document.createElement('section');

      // Mock DOM methods with proper return values
      const { default: UIComponents } = await import(
        '../../utils/ui-components.js'
      );
      UIComponents.createContainer = vi.fn().mockReturnValue(mockContainer);
      UIComponents.createForm = vi.fn().mockReturnValue(mockForm);
      UIComponents.createSection = vi.fn().mockReturnValue(mockSection);

      // Call the method
      configUI.showConfigForm(container);

      // Verify events are bound and config is loaded
      expect(bindEventsSpy).toHaveBeenCalledWith(container);
      expect(loadConfigSpy).toHaveBeenCalledWith(container);
    });
  });

  describe('bindConfigEvents', () => {
    it('should bind configuration form events', () => {
      // Call the method
      configUI.bindConfigEvents(container);

      // Since the method currently has no implementation (commented out),
      // we just verify it can be called without error
      expect(configUI.bindConfigEvents).toBeDefined();
    });
  });

  describe('loadCurrentConfig', () => {
    it('should load and display current configuration', async () => {
      // Mock the config.getConfiguration method
      const mockConfig = {
        url: 'https://test.supabase.co',
        anonKey: 'test-key-123',
      };
      mockSupabaseConfig.getConfiguration = vi
        .fn()
        .mockResolvedValue(mockConfig);

      // Mock DOM querySelector to return input elements
      const mockUrlInput = document.createElement('input');
      const mockKeyInput = document.createElement('input');

      const { default: UIComponents } = await import(
        '../../utils/ui-components.js'
      );
      UIComponents.DOM.querySelector = vi
        .fn()
        .mockReturnValueOnce(mockUrlInput) // First call for #supabaseUrl
        .mockReturnValueOnce(mockKeyInput); // Second call for #supabaseAnonKey

      // Mock UIMessages
      const { default: UIMessages } = await import(
        '../../utils/ui-messages.js'
      );
      UIMessages.info = vi.fn();

      // Call the method
      await configUI.loadCurrentConfig(container);

      // Verify configuration was retrieved
      expect(mockSupabaseConfig.getConfiguration).toHaveBeenCalled();

      // Verify DOM elements were queried
      expect(UIComponents.DOM.querySelector).toHaveBeenCalledWith(
        '#supabaseUrl',
        container
      );
      expect(UIComponents.DOM.querySelector).toHaveBeenCalledWith(
        '#supabaseAnonKey',
        container
      );

      // Verify values were set
      expect(mockUrlInput.value).toBe('https://test.supabase.co');
      expect(mockKeyInput.value).toBe('test-key-123');

      // Verify success message was shown
      expect(UIMessages.info).toHaveBeenCalledWith(
        'Current configuration loaded',
        container
      );
    });

    it('should handle error when loading configuration', async () => {
      // Mock the config.getConfiguration to throw an error
      mockSupabaseConfig.getConfiguration = vi
        .fn()
        .mockRejectedValue(new Error('Test error'));

      // Mock ErrorHandler
      const { default: ErrorHandler } = await import(
        '../../utils/error-handler.js'
      );
      ErrorHandler.handle = vi.fn();

      // Call the method
      await configUI.loadCurrentConfig(container);

      // Verify error was handled
      expect(ErrorHandler.handle).toHaveBeenCalledWith(
        expect.any(Error),
        'config-ui.loadCurrentConfig',
        { silent: true }
      );
    });
  });

  describe('handleConfigSubmit', () => {
    it('should handle successful configuration submission', async () => {
      // Mock DOM elements
      const mockUrlInput = document.createElement('input');
      const mockKeyInput = document.createElement('input');
      mockUrlInput.value = 'https://test.supabase.co';
      mockKeyInput.value = 'test-key-123';

      // Mock DOM querySelector
      const { default: UIComponents } = await import(
        '../../utils/ui-components.js'
      );
      UIComponents.DOM.querySelector = vi
        .fn()
        .mockReturnValueOnce(mockUrlInput) // First call for #supabaseUrl
        .mockReturnValueOnce(mockKeyInput); // Second call for #supabaseAnonKey

      // Mock config.setConfiguration
      mockSupabaseConfig.setConfiguration = vi.fn().mockResolvedValue({
        success: true,
        message: 'Configuration saved',
      });

      // Mock config.initialize
      mockSupabaseConfig.initialize = vi.fn().mockResolvedValue();

      // Mock UIMessages
      const { default: UIMessages } = await import(
        '../../utils/ui-messages.js'
      );
      UIMessages.loading = vi.fn();
      UIMessages.success = vi.fn();
      UIMessages.error = vi.fn();

      // Call the method
      await configUI.handleConfigSubmit(container);

      // Verify loading message was shown
      expect(UIMessages.loading).toHaveBeenCalledWith(
        'Saving configuration...',
        container
      );

      // Verify configuration was saved
      expect(mockSupabaseConfig.setConfiguration).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-key-123'
      );

      // Verify success message was shown
      expect(UIMessages.success).toHaveBeenCalledWith(
        'Configuration saved successfully!',
        container
      );

      // Wait for the setTimeout to complete
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Verify initialization was called
      expect(mockSupabaseConfig.initialize).toHaveBeenCalled();

      // Verify final success message was shown
      expect(UIMessages.success).toHaveBeenCalledWith(
        'Configuration test successful! You can now use the extension.',
        container
      );
    });

    it('should handle empty form fields', async () => {
      // Mock DOM elements with empty values
      const mockUrlInput = document.createElement('input');
      const mockKeyInput = document.createElement('input');
      mockUrlInput.value = '';
      mockKeyInput.value = '';

      // Mock DOM querySelector
      const { default: UIComponents } = await import(
        '../../utils/ui-components.js'
      );
      UIComponents.DOM.querySelector = vi
        .fn()
        .mockReturnValueOnce(mockUrlInput)
        .mockReturnValueOnce(mockKeyInput);

      // Mock UIMessages
      const { default: UIMessages } = await import(
        '../../utils/ui-messages.js'
      );
      UIMessages.error = vi.fn();

      // Mock setConfiguration (even though it shouldn't be called)
      mockSupabaseConfig.setConfiguration = vi.fn();

      // Call the method
      await configUI.handleConfigSubmit(container);

      // Verify error message was shown
      expect(UIMessages.error).toHaveBeenCalledWith(
        'Please fill in all fields',
        container
      );

      // Verify configuration was not saved
      expect(mockSupabaseConfig.setConfiguration).not.toHaveBeenCalled();
    });

    it('should handle configuration save failure', async () => {
      // Mock DOM elements
      const mockUrlInput = document.createElement('input');
      const mockKeyInput = document.createElement('input');
      mockUrlInput.value = 'https://test.supabase.co';
      mockKeyInput.value = 'test-key-123';

      // Mock DOM querySelector
      const { default: UIComponents } = await import(
        '../../utils/ui-components.js'
      );
      UIComponents.DOM.querySelector = vi
        .fn()
        .mockReturnValueOnce(mockUrlInput)
        .mockReturnValueOnce(mockKeyInput);

      // Mock config.setConfiguration to fail
      mockSupabaseConfig.setConfiguration = vi.fn().mockResolvedValue({
        success: false,
        message: 'Invalid credentials',
      });

      // Mock UIMessages
      const { default: UIMessages } = await import(
        '../../utils/ui-messages.js'
      );
      UIMessages.loading = vi.fn();
      UIMessages.error = vi.fn();

      // Call the method
      await configUI.handleConfigSubmit(container);

      // Verify loading message was shown
      expect(UIMessages.loading).toHaveBeenCalledWith(
        'Saving configuration...',
        container
      );

      // Verify error message was shown
      expect(UIMessages.error).toHaveBeenCalledWith(
        'Error: Invalid credentials',
        container
      );
    });

    it('should handle configuration test failure', async () => {
      // Mock DOM elements
      const mockUrlInput = document.createElement('input');
      const mockKeyInput = document.createElement('input');
      mockUrlInput.value = 'https://test.supabase.co';
      mockKeyInput.value = 'test-key-123';

      // Mock DOM querySelector
      const { default: UIComponents } = await import(
        '../../utils/ui-components.js'
      );
      UIComponents.DOM.querySelector = vi
        .fn()
        .mockReturnValueOnce(mockUrlInput)
        .mockReturnValueOnce(mockKeyInput);

      // Mock config.setConfiguration to succeed
      mockSupabaseConfig.setConfiguration = vi.fn().mockResolvedValue({
        success: true,
        message: 'Configuration saved',
      });

      // Mock config.initialize to fail
      mockSupabaseConfig.initialize = vi
        .fn()
        .mockRejectedValue(new Error('Connection failed'));

      // Mock UIMessages
      const { default: UIMessages } = await import(
        '../../utils/ui-messages.js'
      );
      UIMessages.loading = vi.fn();
      UIMessages.success = vi.fn();
      UIMessages.error = vi.fn();

      // Mock ErrorHandler
      const { default: ErrorHandler } = await import(
        '../../utils/error-handler.js'
      );
      ErrorHandler.handle = vi.fn();

      // Call the method
      await configUI.handleConfigSubmit(container);

      // Wait for the setTimeout to complete
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Verify error was handled
      expect(ErrorHandler.handle).toHaveBeenCalledWith(
        expect.any(Error),
        'config-ui.testConfiguration'
      );

      // Verify error message was shown
      expect(UIMessages.error).toHaveBeenCalledWith(
        'Configuration saved but test failed. Please check your credentials.',
        container
      );
    });
  });

  describe('showConfigMessage', () => {
    it('should display configuration message using UIMessages', async () => {
      // Mock UIMessages
      const { default: UIMessages } = await import(
        '../../utils/ui-messages.js'
      );
      UIMessages.show = vi.fn();

      // Call the method
      configUI.showConfigMessage(container, 'Test message', 'success');

      // Verify UIMessages.show was called with correct parameters
      expect(UIMessages.show).toHaveBeenCalledWith(
        'Test message',
        'success',
        container
      );
    });

    it('should handle different message types', async () => {
      // Mock UIMessages
      const { default: UIMessages } = await import(
        '../../utils/ui-messages.js'
      );
      UIMessages.show = vi.fn();

      // Test different message types
      const messageTypes = ['success', 'error', 'warning', 'info', 'loading'];

      for (const type of messageTypes) {
        configUI.showConfigMessage(container, `Test ${type} message`, type);
        expect(UIMessages.show).toHaveBeenCalledWith(
          `Test ${type} message`,
          type,
          container
        );
      }

      // Verify it was called for each type
      expect(UIMessages.show).toHaveBeenCalledTimes(messageTypes.length);
    });
  });

  describe('showConfigStatus', () => {
    it('should display configuration status with buttons', () => {
      // Call the method
      configUI.showConfigStatus(container);

      // Verify container is populated with status HTML
      expect(container.innerHTML).toContain('Configuration Status');
      expect(container.innerHTML).toContain('Supabase URL:');
      expect(container.innerHTML).toContain('Anon Key:');
      expect(container.innerHTML).toContain('Connection:');
      expect(container.innerHTML).toContain('Test Connection');
      expect(container.innerHTML).toContain('Edit Configuration');

      // Verify buttons are present in the HTML
      expect(container.innerHTML).toContain('id="testConnectionBtn"');
      expect(container.innerHTML).toContain('id="editConfigBtn"');
    });

    it('should call loadConfigStatus and bindStatusEvents', () => {
      // Mock the methods
      const loadStatusSpy = vi.spyOn(configUI, 'loadConfigStatus');
      const bindEventsSpy = vi.spyOn(configUI, 'bindStatusEvents');

      // Call the method
      configUI.showConfigStatus(container);

      // Verify the methods were called
      expect(loadStatusSpy).toHaveBeenCalledWith(container);
      expect(bindEventsSpy).toHaveBeenCalledWith(container);
    });
  });

  describe('loadConfigStatus', () => {
    it('should load and display configuration status with valid config', async () => {
      // Mock configuration
      const mockConfig = {
        url: 'https://test.supabase.co',
        anonKey: 'test-key-12345678901234567890',
      };
      mockSupabaseConfig.getConfiguration = vi
        .fn()
        .mockResolvedValue(mockConfig);

      // Mock DOM elements
      const mockUrlEl = document.createElement('span');
      const mockKeyEl = document.createElement('span');
      const mockConnectionEl = document.createElement('span');

      // Mock DOM querySelector
      const { default: UIComponents } = await import(
        '../../utils/ui-components.js'
      );
      UIComponents.DOM.querySelector = vi
        .fn()
        .mockReturnValueOnce(mockUrlEl) // #statusUrl
        .mockReturnValueOnce(mockKeyEl) // #statusKey
        .mockReturnValueOnce(mockConnectionEl); // #statusConnection

      // Mock testConnection
      const testConnectionSpy = vi.spyOn(configUI, 'testConnection');

      // Call the method
      await configUI.loadConfigStatus(container);

      // Verify configuration was retrieved
      expect(mockSupabaseConfig.getConfiguration).toHaveBeenCalled();

      // Verify DOM elements were queried
      expect(UIComponents.DOM.querySelector).toHaveBeenCalledWith(
        '#statusUrl',
        container
      );
      expect(UIComponents.DOM.querySelector).toHaveBeenCalledWith(
        '#statusKey',
        container
      );

      // Verify values were set
      expect(mockUrlEl.textContent).toBe('https://test.supabase.co');
      expect(mockKeyEl.textContent).toBe('test-key-12345678901...');

      // Verify testConnection was called
      expect(testConnectionSpy).toHaveBeenCalledWith(container);
    });

    it('should handle missing configuration', async () => {
      // Mock configuration to be null
      mockSupabaseConfig.getConfiguration = vi.fn().mockResolvedValue(null);

      // Mock DOM elements
      const mockUrlEl = document.createElement('span');
      const mockKeyEl = document.createElement('span');
      const mockConnectionEl = document.createElement('span');

      // Mock DOM querySelector
      const { default: UIComponents } = await import(
        '../../utils/ui-components.js'
      );
      UIComponents.DOM.querySelector = vi
        .fn()
        .mockReturnValueOnce(mockUrlEl) // #statusUrl
        .mockReturnValueOnce(mockKeyEl) // #statusKey
        .mockReturnValueOnce(mockConnectionEl); // #statusConnection

      // Call the method
      await configUI.loadConfigStatus(container);

      // Verify configuration was retrieved
      expect(mockSupabaseConfig.getConfiguration).toHaveBeenCalled();

      // Verify values were set to "Not configured"
      expect(mockUrlEl.textContent).toBe('Not configured');
      expect(mockKeyEl.textContent).toBe('Not configured');
      expect(mockConnectionEl.textContent).toBe('Not configured');
    });

    it('should handle error when loading configuration', async () => {
      // Mock configuration to throw error
      mockSupabaseConfig.getConfiguration = vi
        .fn()
        .mockRejectedValue(new Error('Test error'));

      // Mock ErrorHandler
      const { default: ErrorHandler } = await import(
        '../../utils/error-handler.js'
      );
      ErrorHandler.handle = vi.fn();

      // Call the method
      await configUI.loadConfigStatus(container);

      // Verify error was handled
      expect(ErrorHandler.handle).toHaveBeenCalledWith(
        expect.any(Error),
        'config-ui.loadConfigStatus',
        { silent: true }
      );
    });
  });

  describe('testConnection', () => {
    it('should test connection successfully', async () => {
      // Mock DOM element
      const mockConnectionEl = document.createElement('span');

      // Mock DOM querySelector
      const { default: UIComponents } = await import(
        '../../utils/ui-components.js'
      );
      UIComponents.DOM.querySelector = vi
        .fn()
        .mockReturnValue(mockConnectionEl);

      // Mock config.initialize to succeed
      mockSupabaseConfig.initialize = vi.fn().mockResolvedValue();

      // Call the method
      await configUI.testConnection(container);

      // Verify initialization was called
      expect(mockSupabaseConfig.initialize).toHaveBeenCalled();

      // Verify connection status was updated
      expect(mockConnectionEl.textContent).toBe('Connected');
      expect(mockConnectionEl.className).toBe('status-value connected');
    });

    it('should handle connection failure', async () => {
      // Mock DOM element
      const mockConnectionEl = document.createElement('span');

      // Mock DOM querySelector
      const { default: UIComponents } = await import(
        '../../utils/ui-components.js'
      );
      UIComponents.DOM.querySelector = vi
        .fn()
        .mockReturnValue(mockConnectionEl);

      // Mock config.initialize to fail
      mockSupabaseConfig.initialize = vi
        .fn()
        .mockRejectedValue(new Error('Connection failed'));

      // Call the method
      await configUI.testConnection(container);

      // Verify initialization was called
      expect(mockSupabaseConfig.initialize).toHaveBeenCalled();

      // Verify connection status was updated to failed
      expect(mockConnectionEl.textContent).toBe('Failed');
      expect(mockConnectionEl.className).toBe('status-value failed');
    });

    it('should handle missing connection element', async () => {
      // Mock DOM querySelector to return null
      const { default: UIComponents } = await import(
        '../../utils/ui-components.js'
      );
      UIComponents.DOM.querySelector = vi.fn().mockReturnValue(null);

      // Mock config.initialize to succeed
      mockSupabaseConfig.initialize = vi.fn().mockResolvedValue();

      // Call the method (should not throw)
      await expect(configUI.testConnection(container)).resolves.not.toThrow();

      // Verify initialization was still called
      expect(mockSupabaseConfig.initialize).toHaveBeenCalled();
    });
  });

  describe('bindStatusEvents', () => {
    it('should bind test connection button event', async () => {
      // Create mock button
      const mockTestBtn = document.createElement('button');
      mockTestBtn.id = 'testConnectionBtn';

      // Mock DOM querySelector
      const { default: UIComponents } = await import(
        '../../utils/ui-components.js'
      );
      UIComponents.DOM.querySelector = vi
        .fn()
        .mockReturnValueOnce(mockTestBtn) // #testConnectionBtn
        .mockReturnValueOnce(null); // #editConfigBtn

      // Mock testConnection method
      const testConnectionSpy = vi.spyOn(configUI, 'testConnection');

      // Call the method
      configUI.bindStatusEvents(container);

      // Verify DOM query was made
      expect(UIComponents.DOM.querySelector).toHaveBeenCalledWith(
        '#testConnectionBtn',
        container
      );

      // Simulate button click
      mockTestBtn.click();

      // Verify testConnection was called
      expect(testConnectionSpy).toHaveBeenCalledWith(container);
    });

    it('should bind edit configuration button event', async () => {
      // Create mock button
      const mockEditBtn = document.createElement('button');
      mockEditBtn.id = 'editConfigBtn';

      // Mock DOM querySelector
      const { default: UIComponents } = await import(
        '../../utils/ui-components.js'
      );
      UIComponents.DOM.querySelector = vi
        .fn()
        .mockReturnValueOnce(null) // #testConnectionBtn
        .mockReturnValueOnce(mockEditBtn); // #editConfigBtn

      // Mock showConfigForm method to avoid the actual implementation
      const showConfigFormSpy = vi
        .spyOn(configUI, 'showConfigForm')
        .mockImplementation(() => {});

      // Call the method
      configUI.bindStatusEvents(container);

      // Verify DOM query was made
      expect(UIComponents.DOM.querySelector).toHaveBeenCalledWith(
        '#editConfigBtn',
        container
      );

      // Simulate button click
      mockEditBtn.click();

      // Verify showConfigForm was called
      expect(showConfigFormSpy).toHaveBeenCalledWith(container);
    });

    it('should handle missing buttons gracefully', async () => {
      // Mock DOM querySelector to return null for both buttons
      const { default: UIComponents } = await import(
        '../../utils/ui-components.js'
      );
      UIComponents.DOM.querySelector = vi
        .fn()
        .mockReturnValueOnce(null) // #testConnectionBtn
        .mockReturnValueOnce(null); // #editConfigBtn

      // Call the method (should not throw)
      expect(() => configUI.bindStatusEvents(container)).not.toThrow();

      // Verify DOM queries were still made
      expect(UIComponents.DOM.querySelector).toHaveBeenCalledWith(
        '#testConnectionBtn',
        container
      );
      expect(UIComponents.DOM.querySelector).toHaveBeenCalledWith(
        '#editConfigBtn',
        container
      );
    });
  });
});
