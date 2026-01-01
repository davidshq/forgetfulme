/**
 * @fileoverview Form component creation utilities
 * @module components/form-components
 * @description Provides form field and form creation utilities
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { createButton } from './button-components.js';

/**
 * Available form field types for form creation
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
 * Create a form field with label
 * @param {string} type - Field type
 * @param {string} id - Field ID
 * @param {string} label - Field label
 * @param {Object} options - Field options
 * @returns {HTMLElement} Form group container
 */
export function createFormField(type, id, label, options = {}) {
  const formGroup = document.createElement('div');

  // Create label with Pico styling
  const labelEl = document.createElement('label');
  labelEl.htmlFor = id;
  labelEl.textContent = label;
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
  } else {
    field = document.createElement('input');
    field.type = type;
  }

  // Apply common attributes
  field.id = id;
  field.name = id; // Add name attribute for form submission

  if (options.placeholder) field.placeholder = options.placeholder;
  if (options.required) field.required = options.required;
  if (options.value) field.value = options.value;
  if (options.disabled) field.disabled = options.disabled;

  // Apply accessibility attributes
  if (options['aria-describedby']) {
    field.setAttribute('aria-describedby', options['aria-describedby']);
  }

  formGroup.appendChild(field);

  // Add help text if provided
  if (options.helpText) {
    const helpEl = document.createElement('small');
    helpEl.textContent = options.helpText;
    if (options['aria-describedby']) {
      helpEl.id = options['aria-describedby'];
    }
    formGroup.appendChild(helpEl);
  }

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
export function createForm(id, onSubmit, fields = [], options = {}) {
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
    const field = createFormField(
      fieldConfig.type,
      fieldConfig.id,
      fieldConfig.label,
      fieldConfig.options || {},
    );
    form.appendChild(field);
  });

  // Add submit button if specified
  if (options.submitText) {
    const submitBtn = createButton(options.submitText, null, 'primary', {
      type: 'submit',
      'aria-label': options.submitText,
    });
    form.appendChild(submitBtn);
  }

  return form;
}
