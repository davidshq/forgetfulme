import { describe, test, expect, beforeEach, vi } from 'vitest';
import UIComponents from '../../../utils/ui-components.js';

describe('Button Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('createButton', () => {
    test('should create functional button with click handler', () => {
      const onClick = vi.fn();
      const button = UIComponents.createButton('Save', onClick, 'primary');

      // Test behavior - button should be clickable
      expect(button.tagName).toBe('BUTTON');
      expect(button.textContent).toBe('Save');
      expect(button.disabled).toBe(false);

      // Test click behavior
      button.click();
      expect(onClick).toHaveBeenCalledOnce();
    });

    test('should create disabled button when specified', () => {
      const onClick = vi.fn();
      const button = UIComponents.createButton('Save', onClick, 'primary', {
        disabled: true,
      });

      // Test disabled state behavior
      expect(button.disabled).toBe(true);

      // Disabled button should not trigger click handler
      button.click();
      expect(onClick).not.toHaveBeenCalled();
    });

    test('should support ARIA accessibility attributes', () => {
      const button = UIComponents.createButton('Delete', () => {}, 'danger', {
        ariaLabel: 'Delete bookmark',
        role: 'button',
      });

      // Test accessibility - what users with screen readers experience
      expect(button.getAttribute('aria-label')).toBe('Delete bookmark');
      expect(button.getAttribute('role')).toBe('button');
    });

    test('should handle missing click handler gracefully', () => {
      // This tests real-world scenario where onClick might be undefined
      const button = UIComponents.createButton('Test', null);

      // Should not throw error when clicked
      expect(() => button.click()).not.toThrow();
    });
  });

  describe('Button Integration', () => {
    test('should work with form submission', () => {
      const onSubmit = vi.fn();
      const form = document.createElement('form');
      form.addEventListener('submit', onSubmit);

      const submitButton = UIComponents.createButton(
        'Submit',
        null,
        'primary',
        {
          type: 'submit',
        }
      );

      form.appendChild(submitButton);
      document.body.appendChild(form);

      // Test form integration behavior
      submitButton.click();
      expect(onSubmit).toHaveBeenCalled();
    });
  });
});
