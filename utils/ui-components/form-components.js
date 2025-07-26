/**
 * @fileoverview Form components for ForgetfulMe extension
 * @module ui-components/form-components
 * @description Provides form field creation and form utilities
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { ButtonComponents } from './button-components.js';

/**
 * Available form field types for form creation
 * @static
 * @type {Object}
 * @property {string} TEXT - Text input field
 * @property {string} EMAIL - Email input field
 * @property {string} PASSWORD - Password input field
 * @property {string} URL - URL input field
 * @property {string} NUMBER - Number input field
 * @property {string} SELECT - Select dropdown field
 * @property {string} TEXTAREA - Textarea field
 * @property {string} CHECKBOX - Checkbox field
 * @property {string} RADIO - Radio button field
 */
export const FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  PASSWORD: 'password',
  URL: 'url',
  NUMBER: 'number',
  SELECT: 'select',
  TEXTAREA: 'textarea',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
};

/**
 * Form component creation utilities
 * @class FormComponents
 * @description Provides form field creation and form utilities
 *
 * @example
 * // Create a form field
 * const field = FormComponents.createFormField('text', 'username', 'Username', { required: true });
 *
 * // Create a complete form
 * const form = FormComponents.createForm('login-form', onSubmit, [
 *   { type: 'email', id: 'email', label: 'Email', options: { required: true } },
 *   { type: 'password', id: 'password', label: 'Password', options: { required: true } }
 * ]);
 */
export class FormComponents {
  /**
   * Create a form field with label
   * @param {string} type - Field type
   * @param {string} id - Field ID
   * @param {string} label - Field label
   * @param {Object} options - Field options
   * @returns {HTMLElement} Form group container
   */
  static createFormField(type, id, label, options = {}) {
    const formGroup = document.createElement('div');
    formGroup.className = 'form-field';

    // Create label with Pico styling
    const labelEl = document.createElement('label');
    labelEl.htmlFor = id;
    labelEl.textContent = label;

    // Add required indicator
    if (options.required) {
      const requiredSpan = document.createElement('span');
      requiredSpan.textContent = ' *';
      requiredSpan.className = 'required-indicator';
      requiredSpan.style.color = 'var(--pico-del-color)';
      requiredSpan.setAttribute('aria-label', 'required');
      labelEl.appendChild(requiredSpan);
    }

    formGroup.appendChild(labelEl);

    // Create input/select based on type
    let field;
    if (type === 'select') {
      field = document.createElement('select');
      if (options.options) {
        options.options.forEach(option => {
          const optionEl = document.createElement('option');
          optionEl.value = option.value;
          optionEl.textContent = option.text;
          if (option.selected) optionEl.selected = true;
          field.appendChild(optionEl);
        });
      }
    } else if (type === 'textarea') {
      field = document.createElement('textarea');
      if (options.rows) field.rows = options.rows;
      if (options.cols) field.cols = options.cols;
    } else {
      field = document.createElement('input');
      field.type = type;
    }

    // Apply common attributes
    field.id = id;
    field.name = id; // Add name attribute for form submission

    if (options.placeholder) field.placeholder = options.placeholder;
    if (options.value) field.value = options.value;
    if (options.disabled) field.disabled = options.disabled;

    // Add Pico validation attributes
    if (options.required) {
      field.required = true;
      field.setAttribute('aria-required', 'true');
    }

    if (options.invalid) {
      field.setAttribute('aria-invalid', 'true');
    }

    // Apply accessibility attributes
    if (options['aria-describedby']) {
      field.setAttribute('aria-describedby', options['aria-describedby']);
    }

    // Apply CSS classes
    if (options.className) {
      field.className = options.className;
    }

    formGroup.appendChild(field);

    // Add help text if provided
    if (options.helpText) {
      const helpEl = document.createElement('small');
      helpEl.textContent = options.helpText;
      helpEl.style.color = 'var(--pico-muted-color)';
      if (options['aria-describedby']) {
        helpEl.id = options['aria-describedby'];
      }
      formGroup.appendChild(helpEl);
    }

    // Add validation feedback container
    const feedbackEl = document.createElement('div');
    feedbackEl.className = 'validation-feedback';
    feedbackEl.style.display = 'none';
    feedbackEl.style.color = 'var(--pico-del-color)';
    feedbackEl.style.fontSize = '0.75rem';
    feedbackEl.style.marginTop = '0.25rem';
    formGroup.appendChild(feedbackEl);

    // Store reference to feedback element for validation
    field._feedbackElement = feedbackEl;

    return formGroup;
  }

  /**
   * Create a form container
   * @param {string} id - Form ID
   * @param {Function} onSubmit - Submit handler
   * @param {Array} fields - Array of field configurations
   * @param {Object} options - Form options
   * @returns {HTMLFormElement}
   */
  static createForm(id, onSubmit, fields = [], options = {}) {
    const form = document.createElement('form');
    form.id = id;
    form.className = options.className || '';

    // Add form accessibility attributes
    if (options['aria-label']) {
      form.setAttribute('aria-label', options['aria-label']);
    }
    form.setAttribute('role', 'form');

    if (onSubmit) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        onSubmit(e, form);
      });
    }

    // Add fields
    fields.forEach(fieldConfig => {
      const field = this.createFormField(
        fieldConfig.type,
        fieldConfig.id,
        fieldConfig.label,
        fieldConfig.options || {}
      );
      form.appendChild(field);
    });

    // Add submit button if specified
    if (options.submitText) {
      const submitBtn = ButtonComponents.createButton(
        options.submitText,
        null,
        'primary',
        {
          type: 'submit',
          'aria-label': options.submitText,
        }
      );
      form.appendChild(submitBtn);
    }

    return form;
  }

  /**
   * Validate a form field
   * @param {HTMLElement} field - The form field to validate
   * @param {string} customMessage - Custom validation message
   * @returns {boolean} True if valid, false if invalid
   */
  static validateField(field, customMessage = null) {
    const isValid = field.checkValidity();
    const feedbackEl = field._feedbackElement;

    if (!isValid) {
      field.setAttribute('aria-invalid', 'true');
      if (feedbackEl) {
        feedbackEl.textContent = customMessage || field.validationMessage;
        feedbackEl.style.display = 'block';
      }
    } else {
      field.removeAttribute('aria-invalid');
      if (feedbackEl) {
        feedbackEl.style.display = 'none';
      }
    }

    return isValid;
  }

  /**
   * Validate an entire form
   * @param {HTMLFormElement} form - The form to validate
   * @returns {boolean} True if all fields are valid
   */
  static validateForm(form) {
    const fields = form.querySelectorAll('input, select, textarea');
    let isFormValid = true;

    fields.forEach(field => {
      const isFieldValid = this.validateField(field);
      if (!isFieldValid) {
        isFormValid = false;
      }
    });

    return isFormValid;
  }

  /**
   * Set up real-time validation for a form
   * @param {HTMLFormElement} form - The form to add validation to
   */
  static setupRealTimeValidation(form) {
    const fields = form.querySelectorAll('input, select, textarea');

    fields.forEach(field => {
      // Validate on blur
      field.addEventListener('blur', () => {
        this.validateField(field);
      });

      // Clear validation on input (for real-time feedback)
      field.addEventListener('input', () => {
        if (field.hasAttribute('aria-invalid')) {
          this.validateField(field);
        }
      });
    });
  }
}
