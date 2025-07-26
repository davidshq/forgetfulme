import { describe, test, expect, beforeEach, vi } from 'vitest';

describe('Settings Page User Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup DOM environment
    document.body.innerHTML = `
      <div id="app">
        <div id="config-container"></div>
        <div id="status-container"></div>
        <div id="message-container"></div>
      </div>
    `;

    // Mock only Chrome APIs (external dependencies)
    global.chrome = {
      storage: {
        sync: {
          get: vi.fn(),
          set: vi.fn(),
        },
      },
      runtime: {
        sendMessage: vi.fn(),
      },
    };
  });

  describe('Initial Page Load Workflow', () => {
    test('should display configuration form on page load', async () => {
      // Import actual config-ui after mocking
      const ConfigUI = (await import('../../../config-ui.js')).default;

      // Mock existing config in storage
      global.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({
          supabaseConfig: {
            url: 'https://existing.supabase.co',
            anonKey: 'existing-key-123',
          },
        });
      });

      const configUI = new ConfigUI();
      const container = document.getElementById('config-container');

      // Test page initialization
      await configUI.showConfigForm(container);

      // Verify form is created with real DOM elements
      const form = container.querySelector('form');
      expect(form).toBeTruthy();

      const urlInput = form.querySelector('input[name="supabase-url"]');
      const keyInput = form.querySelector('input[name="supabase-key"]');

      expect(urlInput).toBeTruthy();
      expect(keyInput).toBeTruthy();

      // Test that existing config is loaded into form
      expect(urlInput.value).toBe('https://existing.supabase.co');
      expect(keyInput.value).toBe('existing-key-123');
    });

    test('should display empty form for first-time setup', async () => {
      const ConfigUI = (await import('../../../config-ui.js')).default;

      // Mock empty storage (first time setup)
      global.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({}); // No existing config
      });

      const configUI = new ConfigUI();
      const container = document.getElementById('config-container');

      await configUI.showConfigForm(container);

      const form = container.querySelector('form');
      const urlInput = form.querySelector('input[name="supabase-url"]');
      const keyInput = form.querySelector('input[name="supabase-key"]');

      // Should have empty form for new setup
      expect(urlInput.value).toBe('');
      expect(keyInput.value).toBe('');

      // Should show setup instructions
      const instructions = container.querySelector('.setup-instructions');
      expect(instructions).toBeTruthy();
      expect(instructions.textContent).toContain('first time');
    });
  });

  describe('Configuration Save Workflow', () => {
    test('should save valid configuration', async () => {
      const ConfigUI = (await import('../../../config-ui.js')).default;

      global.chrome.storage.sync.set.mockImplementation((data, callback) => {
        callback && callback();
      });

      const configUI = new ConfigUI();
      const container = document.getElementById('config-container');

      await configUI.showConfigForm(container);

      const form = container.querySelector('form');
      const urlInput = form.querySelector('input[name="supabase-url"]');
      const keyInput = form.querySelector('input[name="supabase-key"]');

      // Fill in valid configuration
      urlInput.value = 'https://newproject.supabase.co';
      keyInput.value = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid-key';

      // Submit form
      const submitEvent = new Event('submit', { bubbles: true });
      form.dispatchEvent(submitEvent);

      // Test that configuration is saved
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith(
        {
          supabaseConfig: {
            url: 'https://newproject.supabase.co',
            anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid-key',
          },
        },
        expect.any(Function)
      );

      // Test success feedback
      const messageContainer = document.getElementById('message-container');
      const successMessage = messageContainer.querySelector('.success-message');
      expect(successMessage).toBeTruthy();
      expect(successMessage.textContent).toContain('saved successfully');
    });

    test('should validate configuration before saving', async () => {
      const ConfigUI = (await import('../../../config-ui.js')).default;

      const configUI = new ConfigUI();
      const container = document.getElementById('config-container');

      await configUI.showConfigForm(container);

      const form = container.querySelector('form');
      const urlInput = form.querySelector('input[name="supabase-url"]');
      const keyInput = form.querySelector('input[name="supabase-key"]');

      // Test invalid configurations
      const invalidConfigs = [
        { url: '', key: 'valid-key' }, // Empty URL
        { url: 'invalid-url', key: 'valid-key' }, // Invalid URL format
        { url: 'https://valid.supabase.co', key: '' }, // Empty key
        { url: 'https://valid.supabase.co', key: 'invalid-key' }, // Invalid key format
      ];

      for (const config of invalidConfigs) {
        urlInput.value = config.url;
        keyInput.value = config.key;

        const submitEvent = new Event('submit', { bubbles: true });
        form.dispatchEvent(submitEvent);

        // Should not save invalid configuration
        expect(global.chrome.storage.sync.set).not.toHaveBeenCalled();

        // Should show validation error
        const messageContainer = document.getElementById('message-container');
        const errorMessage = messageContainer.querySelector('.error-message');
        expect(errorMessage).toBeTruthy();
        expect(errorMessage.textContent).toMatch(/invalid|required|format/i);

        vi.clearAllMocks();
      }
    });
  });

  describe('Connection Testing Workflow', () => {
    test('should test connection to Supabase successfully', async () => {
      const ConfigUI = (await import('../../../config-ui.js')).default;

      // Mock successful connection test
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Connection successful' }),
      });

      const configUI = new ConfigUI();
      const container = document.getElementById('config-container');

      await configUI.showConfigForm(container);

      const form = container.querySelector('form');
      const urlInput = form.querySelector('input[name="supabase-url"]');
      const keyInput = form.querySelector('input[name="supabase-key"]');
      const testButton = form.querySelector('.test-connection-btn');

      // Fill in configuration
      urlInput.value = 'https://working.supabase.co';
      keyInput.value = 'valid-anon-key';

      // Test connection
      testButton.click();

      // Should show loading state
      expect(testButton.textContent).toContain('Testing');
      expect(testButton.disabled).toBe(true);

      // Wait for test to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should show success status
      const statusContainer = document.getElementById('status-container');
      const successStatus = statusContainer.querySelector(
        '.connection-success'
      );
      expect(successStatus).toBeTruthy();
      expect(successStatus.textContent).toContain('Connected');

      // Button should be re-enabled
      expect(testButton.disabled).toBe(false);
      expect(testButton.textContent).toContain('Test Connection');
    });

    test('should handle connection test failures gracefully', async () => {
      const ConfigUI = (await import('../../../config-ui.js')).default;

      // Mock failed connection test
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const configUI = new ConfigUI();
      const container = document.getElementById('config-container');

      await configUI.showConfigForm(container);

      const testButton = container.querySelector('.test-connection-btn');
      const urlInput = container.querySelector('input[name="supabase-url"]');
      const keyInput = container.querySelector('input[name="supabase-key"]');

      // Fill in configuration
      urlInput.value = 'https://broken.supabase.co';
      keyInput.value = 'invalid-key';

      // Test connection
      testButton.click();

      // Wait for test to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should show error status
      const statusContainer = document.getElementById('status-container');
      const errorStatus = statusContainer.querySelector('.connection-error');
      expect(errorStatus).toBeTruthy();
      expect(errorStatus.textContent).toMatch(/failed|error|unable/i);

      // Should provide helpful error message
      const messageContainer = document.getElementById('message-container');
      const errorMessage = messageContainer.querySelector('.error-message');
      expect(errorMessage.textContent).toContain('Unable to connect');
    });
  });

  describe('User Preferences Workflow', () => {
    test('should save and load user preferences', async () => {
      const ConfigUI = (await import('../../../config-ui.js')).default;

      // Mock existing preferences
      global.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({
          userPreferences: {
            showNotifications: false,
            autoMarkRead: true,
            defaultStatus: 'good-reference',
          },
        });
      });

      const configUI = new ConfigUI();
      const container = document.getElementById('config-container');

      await configUI.showConfigForm(container);

      // Should load existing preferences
      const notificationCheckbox = container.querySelector(
        'input[name="show-notifications"]'
      );
      const autoMarkCheckbox = container.querySelector(
        'input[name="auto-mark-read"]'
      );
      const defaultStatusSelect = container.querySelector(
        'select[name="default-status"]'
      );

      expect(notificationCheckbox.checked).toBe(false);
      expect(autoMarkCheckbox.checked).toBe(true);
      expect(defaultStatusSelect.value).toBe('good-reference');

      // Change preferences
      notificationCheckbox.checked = true;
      autoMarkCheckbox.checked = false;
      defaultStatusSelect.value = 'read';

      // Save preferences
      const saveButton = container.querySelector('.save-preferences-btn');
      saveButton.click();

      // Should save updated preferences
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith(
        {
          userPreferences: {
            showNotifications: true,
            autoMarkRead: false,
            defaultStatus: 'read',
          },
        },
        expect.any(Function)
      );
    });
  });

  describe('Error Recovery Workflow', () => {
    test('should recover from storage errors gracefully', async () => {
      const ConfigUI = (await import('../../../config-ui.js')).default;

      // Mock storage error
      global.chrome.storage.sync.get.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const configUI = new ConfigUI();
      const container = document.getElementById('config-container');

      // Should not crash on storage error
      await expect(configUI.showConfigForm(container)).resolves.not.toThrow();

      // Should show error message to user
      const messageContainer = document.getElementById('message-container');
      const errorMessage = messageContainer.querySelector('.error-message');
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toContain('storage');
    });

    test('should handle form validation errors with user feedback', async () => {
      const ConfigUI = (await import('../../../config-ui.js')).default;

      const configUI = new ConfigUI();
      const container = document.getElementById('config-container');

      await configUI.showConfigForm(container);

      const form = container.querySelector('form');
      const urlInput = form.querySelector('input[name="supabase-url"]');

      // Submit form with invalid data
      urlInput.value = 'not-a-url';

      const submitEvent = new Event('submit', { bubbles: true });
      form.dispatchEvent(submitEvent);

      // Should show field-specific validation errors
      const urlError = urlInput.parentElement.querySelector('.field-error');
      expect(urlError).toBeTruthy();
      expect(urlError.textContent).toContain('valid URL');

      // Should focus on first error field
      expect(document.activeElement).toBe(urlInput);
    });
  });
});
