import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

const mockCreateConfirmDialog = vi.fn();
const mockShowModal = vi.fn();

vi.mock('../../utils/ui-components.js', () => ({
  default: {
    createConfirmDialog: (...args) => mockCreateConfirmDialog(...args),
    showModal: (...args) => mockShowModal(...args),
  },
}));

import UIMessages from '../../utils/ui-messages.js';

// Mock console methods
const mockConsole = {
  warn: vi.fn(),
  log: vi.fn(),
};

describe('UIMessages', () => {
  let container;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateConfirmDialog.mockReset();
    mockShowModal.mockReset();
    global.console = mockConsole;

    // Setup test container
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    document.body.innerHTML = '';
  });

  describe('Constants', () => {
    test('should have all expected message types', () => {
      expect(UIMessages.MESSAGE_TYPES).toEqual({
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info',
      });
    });
  });

  describe('show', () => {
    test('should show message in container', () => {
      const messageEl = UIMessages.show('Test message', 'info', container);

      expect(messageEl).toBeDefined();
      expect(messageEl.tagName).toBe('DIV');
      expect(messageEl.className).toContain('ui-message');
      expect(messageEl.className).toContain('ui-message-info');
      expect(messageEl.textContent).toBe('Test message');
      expect(container.querySelector('.ui-message')).toBe(messageEl);
    });

    test('should show message with icon', () => {
      const messageEl = UIMessages.show('Test message', 'success', container, {
        icon: '✅',
      });

      expect(messageEl.querySelector('.ui-message-icon')).toBeTruthy();
      expect(messageEl.querySelector('.ui-message-icon').textContent).toBe(
        '✅',
      );
    });

    test('should auto-remove message after timeout', async () => {
      const messageEl = UIMessages.show('Test message', 'info', container, {
        timeout: 10, // 10ms timeout for testing
      });

      expect(container.querySelector('.ui-message')).toBe(messageEl);

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(container.querySelector('.ui-message')).toBeNull();
    });

    test('should handle missing container', () => {
      const result = UIMessages.show('Test message', 'info');

      expect(result).toBeUndefined();
      // ErrorHandler handles missing container
    });

    test('should handle container errors gracefully', () => {
      // Mock appendChild to throw error
      const originalAppendChild = container.appendChild;
      container.appendChild = vi.fn().mockImplementation(() => {
        throw new Error('DOM error');
      });

      const result = UIMessages.show('Test message', 'info', container);

      expect(result).toBeUndefined();
      // ErrorHandler handles container errors

      // Restore original method
      container.appendChild = originalAppendChild;
    });
  });

  describe('success', () => {
    test('should show success message', () => {
      const messageEl = UIMessages.success('Operation successful!', container);

      expect(messageEl.className).toContain('ui-message-success');
      expect(messageEl.querySelector('.ui-message-icon')).toBeTruthy();
      expect(messageEl.querySelector('.ui-message-icon').textContent).toBe(
        '✅',
      );
    });

    test('should show success message with custom options', () => {
      const messageEl = UIMessages.success('Success!', container, {
        timeout: 5000,
        icon: '🎉',
      });

      expect(messageEl.querySelector('.ui-message-icon').textContent).toBe(
        '🎉',
      );
    });
  });

  describe('error', () => {
    test('should show error message', () => {
      const messageEl = UIMessages.error('Something went wrong!', container);

      expect(messageEl.className).toContain('ui-message-error');
      expect(messageEl.querySelector('.ui-message-icon')).toBeTruthy();
      expect(messageEl.querySelector('.ui-message-icon').textContent).toBe(
        '❌',
      );
    });

    test('should show error message with custom options', () => {
      const messageEl = UIMessages.error('Error!', container, {
        timeout: 10000,
        icon: '💥',
      });

      expect(messageEl.querySelector('.ui-message-icon').textContent).toBe(
        '💥',
      );
    });
  });

  describe('info', () => {
    test('should show info message', () => {
      const messageEl = UIMessages.info('Here is some information.', container);

      expect(messageEl.className).toContain('ui-message-info');
      expect(messageEl.querySelector('.ui-message-icon')).toBeTruthy();
      expect(messageEl.querySelector('.ui-message-icon').textContent).toBe(
        'ℹ️',
      );
    });

    test('should show info message with custom options', () => {
      const messageEl = UIMessages.info('Info!', container, {
        timeout: 6000,
        icon: '📋',
      });

      expect(messageEl.querySelector('.ui-message-icon').textContent).toBe(
        '📋',
      );
    });
  });

  describe('loading', () => {
    test('should show loading message with Pico progress', () => {
      const messageEl = UIMessages.loading('Please wait...', container);

      expect(messageEl.className).toContain('ui-message-loading');
      expect(messageEl.getAttribute('aria-busy')).toBe('true');
      expect(messageEl.querySelector('progress')).toBeTruthy();
      expect(
        messageEl.querySelector('progress').getAttribute('aria-label'),
      ).toBe('Loading');
      expect(messageEl.querySelector('.ui-message-text')).toBeTruthy();
      expect(messageEl.querySelector('.ui-message-text').textContent).toBe(
        'Please wait...',
      );
    });

    test('should not auto-remove loading message', async () => {
      const messageEl = UIMessages.loading('Loading...', container);

      expect(container.querySelector('.ui-message')).toBe(messageEl);

      // Wait for a while
      await new Promise(resolve => setTimeout(resolve, 100));

      // Message should still be there
      expect(container.querySelector('.ui-message')).toBe(messageEl);
    });

    test('should show loading message without text', () => {
      const messageEl = UIMessages.loading('', container);

      expect(messageEl.className).toContain('ui-message-loading');
      expect(messageEl.getAttribute('aria-busy')).toBe('true');
      expect(messageEl.querySelector('progress')).toBeTruthy();
      expect(messageEl.querySelector('.ui-message-text')).toBeFalsy();
    });

    test('should handle null container gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      const result = UIMessages.loading('Loading...', null);

      expect(result).toBeUndefined();
      // ErrorHandler handles null container

      consoleSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });

  describe('getDefaultTimeout', () => {
    test('should return correct timeout for error messages', () => {
      expect(UIMessages.getDefaultTimeout('error')).toBe(10000);
    });

    test('should return correct timeout for warning messages', () => {
      expect(UIMessages.getDefaultTimeout('warning')).toBe(8000);
    });

    test('should return correct timeout for success messages', () => {
      expect(UIMessages.getDefaultTimeout('success')).toBe(5000);
    });

    test('should return correct timeout for info messages', () => {
      expect(UIMessages.getDefaultTimeout('info')).toBe(6000);
    });

    test('should return default timeout for unknown message type', () => {
      expect(UIMessages.getDefaultTimeout('unknown')).toBe(5000);
    });
  });

  describe('confirm', () => {
    test('should create confirmation dialog with UIComponents', () => {
      const dialogEl = document.createElement('div');
      mockCreateConfirmDialog.mockReturnValue(dialogEl);

      const mockConfirm = vi.fn();
      const mockCancel = vi.fn();
      const confirmEl = UIMessages.confirm(
        'Are you sure?',
        mockConfirm,
        mockCancel,
        container,
      );

      expect(confirmEl).toBe(dialogEl);
      expect(mockCreateConfirmDialog).toHaveBeenCalledWith(
        'Are you sure?',
        mockConfirm,
        mockCancel,
        {},
      );
      expect(mockShowModal).toHaveBeenCalledWith(dialogEl);
    });

    test('should create confirmation dialog with custom options', () => {
      const dialogEl = document.createElement('div');
      mockCreateConfirmDialog.mockReturnValue(dialogEl);

      const options = {
        confirmText: 'Yes',
        cancelText: 'No',
      };

      UIMessages.confirm('Are you sure?', vi.fn(), vi.fn(), container, options);

      expect(mockCreateConfirmDialog).toHaveBeenCalledWith(
        'Are you sure?',
        expect.any(Function),
        expect.any(Function),
        options,
      );
      expect(mockShowModal).toHaveBeenCalledWith(dialogEl);
    });
  });

  describe('Integration Tests', () => {
    test('should handle multiple message types in same container', () => {
      const successMsg = UIMessages.success('Success!', container);
      const errorMsg = UIMessages.error('Error!', container);
      const warningMsg = UIMessages.show(
        'Warning!',
        UIMessages.MESSAGE_TYPES.WARNING,
        container,
      );
      const infoMsg = UIMessages.info('Info!', container);

      expect(container.querySelectorAll('.ui-message')).toHaveLength(4);
      expect(container.querySelector('.ui-message-success')).toBe(successMsg);
      expect(container.querySelector('.ui-message-error')).toBe(errorMsg);
      expect(container.querySelector('.ui-message-warning')).toBe(warningMsg);
      expect(container.querySelector('.ui-message-info')).toBe(infoMsg);
    });

    test('should allow multiple messages in same container', () => {
      UIMessages.success('Success!', container);
      UIMessages.error('Error!', container);
      UIMessages.show('Warning!', 'warning', container);

      expect(container.querySelectorAll('.ui-message')).toHaveLength(3);
    });

    test('should handle message removal when parent is removed', () => {
      const messageEl = UIMessages.success('Success!', container);

      // Remove container from DOM
      container.parentNode?.removeChild(container);

      // Should not throw error when trying to remove message
      expect(() => {
        setTimeout(() => {
          if (messageEl.parentNode) {
            messageEl.parentNode.removeChild(messageEl);
          }
        }, 100);
      }).not.toThrow();
    });
  });
});
