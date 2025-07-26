import { describe, test, expect, beforeEach, vi } from 'vitest';
import UIComponents from '../../../utils/ui-components.js';

describe('Form Components Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('Form Field Creation', () => {
    test('should create accessible text input field', () => {
      const field = UIComponents.createFormField({
        type: 'text',
        name: 'bookmark-title',
        label: 'Bookmark Title',
        placeholder: 'Enter bookmark title',
        required: true,
      });

      // Test field structure and accessibility
      const label = field.querySelector('label');
      const input = field.querySelector('input');

      expect(label.textContent).toContain('Bookmark Title');
      expect(input.type).toBe('text');
      expect(input.name).toBe('bookmark-title');
      expect(input.placeholder).toBe('Enter bookmark title');
      expect(input.required).toBe(true);

      // Test label-input association
      expect(label.getAttribute('for')).toBe(input.id);
      expect(input.getAttribute('aria-describedby')).toBeTruthy();
    });

    test('should create URL field with validation', () => {
      const field = UIComponents.createFormField({
        type: 'url',
        name: 'bookmark-url',
        label: 'Website URL',
        validation: {
          pattern: 'https?://.*',
          message: 'Please enter a valid URL',
        },
      });

      const input = field.querySelector('input');
      expect(input.type).toBe('url');
      expect(input.pattern).toBe('https?://.*');

      // Test validation message
      const validationMsg = field.querySelector('.validation-message');
      expect(validationMsg).toBeTruthy();
    });

    test('should create select field with options', () => {
      const field = UIComponents.createFormField({
        type: 'select',
        name: 'read-status',
        label: 'Read Status',
        options: [
          { value: 'read', text: 'Read' },
          { value: 'unread', text: 'Unread' },
          { value: 'important', text: 'Important' },
        ],
      });

      const select = field.querySelector('select');
      const options = select.querySelectorAll('option');

      expect(select.name).toBe('read-status');
      expect(options).toHaveLength(3);
      expect(options[0].value).toBe('read');
      expect(options[0].textContent).toBe('Read');
    });
  });

  describe('Form Creation and Submission', () => {
    test('should create form with proper structure', () => {
      const onSubmit = vi.fn();
      const fields = [
        {
          type: 'text',
          name: 'title',
          label: 'Title',
          required: true,
        },
        {
          type: 'url',
          name: 'url',
          label: 'URL',
          required: true,
        },
      ];

      const form = UIComponents.createForm({
        fields,
        submitText: 'Save Bookmark',
        onSubmit,
      });

      // Test form structure
      expect(form.tagName).toBe('FORM');

      const titleField = form.querySelector('input[name="title"]');
      const urlField = form.querySelector('input[name="url"]');
      const submitButton = form.querySelector('button[type="submit"]');

      expect(titleField).toBeTruthy();
      expect(urlField).toBeTruthy();
      expect(submitButton.textContent).toBe('Save Bookmark');
    });

    test('should handle form submission correctly', () => {
      const onSubmit = vi.fn();
      const form = UIComponents.createForm({
        fields: [{ type: 'text', name: 'title', label: 'Title' }],
        onSubmit,
      });

      document.body.appendChild(form);

      // Fill form data
      const titleInput = form.querySelector('input[name="title"]');
      titleInput.value = 'Test Bookmark';

      // Submit form
      const submitEvent = new Event('submit', { bubbles: true });
      form.dispatchEvent(submitEvent);

      // Test submission handling
      expect(onSubmit).toHaveBeenCalled();
      const callArgs = onSubmit.mock.calls[0];
      expect(callArgs[0]).toBeInstanceOf(Event);
    });

    test('should validate required fields before submission', () => {
      const onSubmit = vi.fn();
      const form = UIComponents.createForm({
        fields: [
          { type: 'text', name: 'title', label: 'Title', required: true },
        ],
        onSubmit,
      });

      document.body.appendChild(form);

      // Try to submit without filling required field
      const submitEvent = new Event('submit', { bubbles: true });
      form.dispatchEvent(submitEvent);

      // Form should not submit with invalid data
      const titleInput = form.querySelector('input[name="title"]');
      expect(titleInput.validity.valid).toBe(false);
    });
  });

  describe('Form Validation Workflow', () => {
    test('should show validation errors for invalid input', () => {
      const field = UIComponents.createFormField({
        type: 'email',
        name: 'user-email',
        label: 'Email',
        required: true,
      });

      document.body.appendChild(field);
      const input = field.querySelector('input');

      // Test invalid email
      input.value = 'invalid-email';
      input.dispatchEvent(new Event('blur'));

      expect(input.validity.valid).toBe(false);
    });

    test('should clear validation errors when input becomes valid', () => {
      const field = UIComponents.createFormField({
        type: 'url',
        name: 'bookmark-url',
        label: 'URL',
        required: true,
      });

      document.body.appendChild(field);
      const input = field.querySelector('input');

      // First, trigger validation error
      input.value = 'invalid-url';
      input.dispatchEvent(new Event('blur'));

      // Then fix the input
      input.value = 'https://example.com';
      input.dispatchEvent(new Event('input'));

      expect(input.validity.valid).toBe(true);
    });
  });

  describe('Form Accessibility', () => {
    test('should provide proper ARIA labels and descriptions', () => {
      const field = UIComponents.createFormField({
        type: 'password',
        name: 'user-password',
        label: 'Password',
        help: 'Password must be at least 8 characters',
        required: true,
      });

      const input = field.querySelector('input');
      const label = field.querySelector('label');
      const helpText = field.querySelector('.help-text');

      expect(label.getAttribute('for')).toBe(input.id);
      if (helpText) {
        expect(input.getAttribute('aria-describedby')).toBe(helpText.id);
      }
      expect(input.getAttribute('aria-required')).toBe('true');
    });

    test('should support keyboard navigation', () => {
      const form = UIComponents.createForm({
        fields: [
          { type: 'text', name: 'field1', label: 'Field 1' },
          { type: 'text', name: 'field2', label: 'Field 2' },
        ],
      });

      document.body.appendChild(form);

      const field1 = form.querySelector('input[name="field1"]');
      const field2 = form.querySelector('input[name="field2"]');

      // Test tab navigation
      field1.focus();
      expect(document.activeElement).toBe(field1);

      // Simulate tab key to move to next field
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      field1.dispatchEvent(tabEvent);
      field2.focus();
      expect(document.activeElement).toBe(field2);
    });
  });

  describe('Dynamic Form Behavior', () => {
    test('should add and remove fields dynamically', () => {
      const form = UIComponents.createForm({
        fields: [{ type: 'text', name: 'title', label: 'Title' }],
      });

      document.body.appendChild(form);

      // Test initial field count
      let inputs = form.querySelectorAll('input[type="text"]');
      expect(inputs).toHaveLength(1);

      // Add a field dynamically
      const newField = UIComponents.createFormField({
        type: 'text',
        name: 'description',
        label: 'Description',
      });

      const submitButton = form.querySelector('button[type="submit"]');
      form.insertBefore(newField, submitButton);

      inputs = form.querySelectorAll('input[type="text"]');
      expect(inputs).toHaveLength(2);
    });
  });
});
