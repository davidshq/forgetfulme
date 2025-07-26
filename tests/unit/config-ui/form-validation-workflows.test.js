import { describe, test, expect, beforeEach, vi } from 'vitest';

describe('Configuration Form Validation Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup clean DOM environment
    document.body.innerHTML = `
      <div id="config-form-container">
        <div id="validation-messages"></div>
      </div>
    `;

    // Mock Chrome APIs
    global.chrome = {
      storage: {
        sync: {
          get: vi.fn(),
          set: vi.fn(),
        },
      },
    };
  });

  describe('Supabase URL Validation', () => {
    test('should validate correct Supabase URL formats', async () => {
      const ConfigUI = (await import('../../../config-ui.js')).default;

      const configUI = new ConfigUI();
      const container = document.getElementById('config-form-container');

      await configUI.showConfigForm(container);

      const urlInput = container.querySelector('input[name="supabase-url"]');
      const form = container.querySelector('form');

      const validUrls = [
        'https://abc123.supabase.co',
        'https://myproject.supabase.co',
        'https://test-project.supabase.co',
        'https://project_name.supabase.co',
      ];

      for (const validUrl of validUrls) {
        urlInput.value = validUrl;

        // Trigger validation
        const inputEvent = new Event('input', { bubbles: true });
        urlInput.dispatchEvent(inputEvent);

        // Should not show validation error
        const errorMessage =
          urlInput.parentElement.querySelector('.validation-error');
        expect(errorMessage).toBeFalsy();

        // Should allow form submission
        expect(urlInput.validity.valid).toBe(true);
      }
    });

    test('should reject invalid URL formats', async () => {
      const ConfigUI = (await import('../../../config-ui.js')).default;

      const configUI = new ConfigUI();
      const container = document.getElementById('config-form-container');

      await configUI.showConfigForm(container);

      const urlInput = container.querySelector('input[name="supabase-url"]');

      const invalidUrls = [
        'not-a-url',
        'http://insecure.supabase.co', // Not HTTPS
        'https://wrong-domain.com',
        'https://.supabase.co', // Missing project name
        'https://project.wrongdomain.co',
        'ftp://project.supabase.co',
        '',
      ];

      for (const invalidUrl of invalidUrls) {
        urlInput.value = invalidUrl;

        // Trigger validation
        const blurEvent = new Event('blur', { bubbles: true });
        urlInput.dispatchEvent(blurEvent);

        // Should show validation error
        const errorMessage =
          urlInput.parentElement.querySelector('.validation-error');
        expect(errorMessage).toBeTruthy();
        expect(errorMessage.textContent).toMatch(/invalid|format|required/i);

        // Should prevent form submission
        expect(urlInput.validity.valid).toBe(false);
      }
    });
  });

  describe('Anonymous Key Validation', () => {
    test('should validate JWT token format for anon key', async () => {
      const ConfigUI = (await import('../../../config-ui.js')).default;

      const configUI = new ConfigUI();
      const container = document.getElementById('config-form-container');

      await configUI.showConfigForm(container);

      const keyInput = container.querySelector('input[name="supabase-key"]');

      // Valid JWT-like format (3 parts separated by dots)
      const validKeys = [
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiJ9.signature',
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.test-signature',
      ];

      for (const validKey of validKeys) {
        keyInput.value = validKey;

        const inputEvent = new Event('input', { bubbles: true });
        keyInput.dispatchEvent(inputEvent);

        // Should accept valid JWT format
        const errorMessage =
          keyInput.parentElement.querySelector('.validation-error');
        expect(errorMessage).toBeFalsy();
        expect(keyInput.validity.valid).toBe(true);
      }
    });

    test('should reject invalid key formats', async () => {
      const ConfigUI = (await import('../../../config-ui.js')).default;

      const configUI = new ConfigUI();
      const container = document.getElementById('config-form-container');

      await configUI.showConfigForm(container);

      const keyInput = container.querySelector('input[name="supabase-key"]');

      const invalidKeys = [
        '', // Empty
        'not-a-jwt-token',
        'only.two.parts', // Not 3 parts
        'too.many.parts.here.invalid',
        '123456789', // Just numbers
        'short', // Too short
      ];

      for (const invalidKey of invalidKeys) {
        keyInput.value = invalidKey;

        const blurEvent = new Event('blur', { bubbles: true });
        keyInput.dispatchEvent(blurEvent);

        // Should show validation error
        const errorMessage =
          keyInput.parentElement.querySelector('.validation-error');
        expect(errorMessage).toBeTruthy();
        expect(errorMessage.textContent).toMatch(
          /invalid|token|format|required/i
        );
        expect(keyInput.validity.valid).toBe(false);
      }
    });
  });

  describe('Real-time Validation Feedback', () => {
    test('should provide immediate validation feedback as user types', async () => {
      const ConfigUI = (await import('../../../config-ui.js')).default;

      const configUI = new ConfigUI();
      const container = document.getElementById('config-form-container');

      await configUI.showConfigForm(container);

      const urlInput = container.querySelector('input[name="supabase-url"]');

      // Start with empty input
      urlInput.value = '';
      urlInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Should show "required" message
      let errorMessage =
        urlInput.parentElement.querySelector('.validation-error');
      expect(errorMessage.textContent).toContain('required');

      // Type partial URL
      urlInput.value = 'https://';
      urlInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Should show "incomplete" or "invalid" message
      errorMessage = urlInput.parentElement.querySelector('.validation-error');
      expect(errorMessage.textContent).toMatch(/invalid|incomplete/i);

      // Complete valid URL
      urlInput.value = 'https://myproject.supabase.co';
      urlInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Should clear error message
      errorMessage = urlInput.parentElement.querySelector('.validation-error');
      expect(errorMessage).toBeFalsy();

      // Should show success indicator
      const successIndicator = urlInput.parentElement.querySelector(
        '.validation-success'
      );
      expect(successIndicator).toBeTruthy();
    });

    test('should clear validation errors when input becomes valid', async () => {
      const ConfigUI = (await import('../../../config-ui.js')).default;

      const configUI = new ConfigUI();
      const container = document.getElementById('config-form-container');

      await configUI.showConfigForm(container);

      const keyInput = container.querySelector('input[name="supabase-key"]');

      // Start with invalid input
      keyInput.value = 'invalid-key';
      keyInput.dispatchEvent(new Event('blur', { bubbles: true }));

      // Should show error
      let errorMessage =
        keyInput.parentElement.querySelector('.validation-error');
      expect(errorMessage).toBeTruthy();

      // Fix the input
      keyInput.value =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.test';
      keyInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Error should be cleared
      errorMessage = keyInput.parentElement.querySelector('.validation-error');
      expect(errorMessage).toBeFalsy();

      // Should show valid state
      expect(keyInput.classList.contains('valid')).toBe(true);
      expect(keyInput.classList.contains('invalid')).toBe(false);
    });
  });

  describe('Form Submission Validation', () => {
    test('should prevent submission with invalid data', async () => {
      const ConfigUI = (await import('../../../config-ui.js')).default;

      const configUI = new ConfigUI();
      const container = document.getElementById('config-form-container');

      await configUI.showConfigForm(container);

      const form = container.querySelector('form');
      const urlInput = container.querySelector('input[name="supabase-url"]');
      const keyInput = container.querySelector('input[name="supabase-key"]');

      // Fill with invalid data
      urlInput.value = 'invalid-url';
      keyInput.value = 'invalid-key';

      // Attempt to submit
      const submitEvent = new Event('submit', {
        bubbles: true,
        cancelable: true,
      });
      form.dispatchEvent(submitEvent);

      // Submission should be prevented
      expect(submitEvent.defaultPrevented).toBe(true);

      // Should not call Chrome storage
      expect(global.chrome.storage.sync.set).not.toHaveBeenCalled();

      // Should focus on first invalid field
      expect(document.activeElement).toBe(urlInput);

      // Should show error summary
      const errorSummary = container.querySelector('.form-errors');
      expect(errorSummary).toBeTruthy();
      expect(errorSummary.textContent).toContain(
        'Please correct the following errors'
      );
    });

    test('should allow submission with valid data', async () => {
      const ConfigUI = (await import('../../../config-ui.js')).default;

      global.chrome.storage.sync.set.mockImplementation((data, callback) => {
        callback && callback();
      });

      const configUI = new ConfigUI();
      const container = document.getElementById('config-form-container');

      await configUI.showConfigForm(container);

      const form = container.querySelector('form');
      const urlInput = container.querySelector('input[name="supabase-url"]');
      const keyInput = container.querySelector('input[name="supabase-key"]');

      // Fill with valid data
      urlInput.value = 'https://validproject.supabase.co';
      keyInput.value =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.valid-signature';

      // Submit form
      const submitEvent = new Event('submit', {
        bubbles: true,
        cancelable: true,
      });
      form.dispatchEvent(submitEvent);

      // Should allow submission
      expect(submitEvent.defaultPrevented).toBe(false);

      // Should save to Chrome storage
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith(
        {
          supabaseConfig: {
            url: 'https://validproject.supabase.co',
            anonKey:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.valid-signature',
          },
        },
        expect.any(Function)
      );
    });
  });

  describe('Accessibility and UX', () => {
    test('should provide accessible validation messages', async () => {
      const ConfigUI = (await import('../../../config-ui.js')).default;

      const configUI = new ConfigUI();
      const container = document.getElementById('config-form-container');

      await configUI.showConfigForm(container);

      const urlInput = container.querySelector('input[name="supabase-url"]');

      // Trigger validation error
      urlInput.value = 'invalid';
      urlInput.dispatchEvent(new Event('blur', { bubbles: true }));

      const errorMessage =
        urlInput.parentElement.querySelector('.validation-error');

      // Should have proper ARIA attributes
      expect(urlInput.getAttribute('aria-invalid')).toBe('true');
      expect(urlInput.getAttribute('aria-describedby')).toBe(errorMessage.id);
      expect(errorMessage.getAttribute('role')).toBe('alert');

      // Error message should be announced to screen readers
      expect(errorMessage.getAttribute('aria-live')).toBe('polite');
    });

    test('should provide helpful validation messages', async () => {
      const ConfigUI = (await import('../../../config-ui.js')).default;

      const configUI = new ConfigUI();
      const container = document.getElementById('config-form-container');

      await configUI.showConfigForm(container);

      const urlInput = container.querySelector('input[name="supabase-url"]');
      const keyInput = container.querySelector('input[name="supabase-key"]');

      // Test URL error messages
      urlInput.value = 'not-https://project.supabase.co';
      urlInput.dispatchEvent(new Event('blur', { bubbles: true }));

      let errorMessage =
        urlInput.parentElement.querySelector('.validation-error');
      expect(errorMessage.textContent).toContain('must use HTTPS');

      // Test key error messages
      keyInput.value = 'too-short';
      keyInput.dispatchEvent(new Event('blur', { bubbles: true }));

      errorMessage = keyInput.parentElement.querySelector('.validation-error');
      expect(errorMessage.textContent).toContain(
        'anonymous key should be a JWT token'
      );
    });
  });

  describe('Edge Cases and Error Recovery', () => {
    test('should handle rapid input changes gracefully', async () => {
      const ConfigUI = (await import('../../../config-ui.js')).default;

      const configUI = new ConfigUI();
      const container = document.getElementById('config-form-container');

      await configUI.showConfigForm(container);

      const urlInput = container.querySelector('input[name="supabase-url"]');

      // Rapidly change input values
      const values = [
        'h',
        'ht',
        'htt',
        'http',
        'https',
        'https:',
        'https://',
        'https://test.supabase.co',
      ];

      for (const value of values) {
        urlInput.value = value;
        urlInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Should end up in valid state
      const errorMessage =
        urlInput.parentElement.querySelector('.validation-error');
      expect(errorMessage).toBeFalsy();
      expect(urlInput.validity.valid).toBe(true);
    });

    test('should handle clipboard paste validation', async () => {
      const ConfigUI = (await import('../../../config-ui.js')).default;

      const configUI = new ConfigUI();
      const container = document.getElementById('config-form-container');

      await configUI.showConfigForm(container);

      const keyInput = container.querySelector('input[name="supabase-key"]');

      // Simulate pasting a valid JWT token
      const validJWT =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiJ9.signature';

      keyInput.value = validJWT;
      keyInput.dispatchEvent(new Event('paste', { bubbles: true }));
      keyInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Should immediately validate pasted content
      const errorMessage =
        keyInput.parentElement.querySelector('.validation-error');
      expect(errorMessage).toBeFalsy();

      const successIndicator = keyInput.parentElement.querySelector(
        '.validation-success'
      );
      expect(successIndicator).toBeTruthy();
    });
  });
});
