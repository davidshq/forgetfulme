/**
 * @fileoverview Basic UI component mocks
 * @module mocks/ui-components-basic
 * @description Basic UI component mocks (container, form, button, list)
 */

import { vi } from 'vitest';

/**
 * Creates basic UI component mocks
 * @param {Object} document - Mock document object
 * @returns {Object} Basic component mocks
 */
export const createBasicComponents = document => ({
  createContainer: vi.fn((title, subtitle, className) => {
    const container = document.createElement('div');
    container.className = `ui-container ${className}`.trim();
    container.innerHTML = `
      <div class="ui-container-header">
        <h2>${title}</h2>
        ${subtitle ? `<p>${subtitle}</p>` : ''}
      </div>
    `;
    return container;
  }),
  createForm: vi.fn((id, onSubmit, fields, options) => {
    const form = document.createElement('form');
    form.id = id;
    form.className = options.className || '';

    fields.forEach(field => {
      const fieldElement = document.createElement('input');
      fieldElement.id = field.id;
      fieldElement.type = field.type;
      fieldElement.required = field.options?.required || false;
      form.appendChild(fieldElement);
    });

    if (onSubmit) {
      form.addEventListener('submit', onSubmit);
    }

    return form;
  }),
  createFormField: vi.fn((type, id, label, options) => {
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'ui-form-group';

    const labelElement = document.createElement('label');
    labelElement.htmlFor = id;
    labelElement.textContent = label;
    fieldContainer.appendChild(labelElement);

    let fieldElement;
    if (type === 'select') {
      fieldElement = document.createElement('select');
      if (options.options) {
        options.options.forEach(option => {
          const optionEl = document.createElement('option');
          optionEl.value = option.value;
          optionEl.textContent = option.text;
          if (option.selected) optionEl.selected = true;
          fieldElement.appendChild(optionEl);
        });
      }
    } else {
      fieldElement = document.createElement('input');
      fieldElement.type = type;
    }

    fieldElement.id = id;
    fieldElement.className = 'ui-form-control';
    fieldElement.required = options?.required || false;
    if (options?.placeholder) fieldElement.placeholder = options.placeholder;
    if (options?.value) fieldElement.value = options.value;
    if (options?.disabled) fieldElement.disabled = options.disabled;

    fieldContainer.appendChild(fieldElement);

    if (options?.helpText) {
      const helpElement = document.createElement('small');
      helpElement.textContent = options.helpText;
      fieldContainer.appendChild(helpElement);
    }

    return fieldContainer;
  }),
  createButton: vi.fn((text, onClick, options) => {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = options?.className || 'ui-btn';
    button.type = 'button';
    if (onClick) {
      button.addEventListener('click', onClick);
    }
    return button;
  }),
  createList: vi.fn(id => {
    const list = document.createElement('div');
    list.id = id;
    list.className = 'list';
    return list;
  }),
  createListItem: vi.fn((data, options) => {
    const item = document.createElement('div');
    item.className = 'list-item';
    if (data.title) {
      const title = document.createElement('div');
      title.className = 'item-title';
      title.textContent = data.title;
      item.appendChild(title);
    }
    if (options?.template) {
      const template = document.createElement('span');
      template.textContent = options.template(data);
      item.appendChild(template);
    }
    return item;
  }),
});
