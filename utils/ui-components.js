/**
 * @fileoverview UI Components for ForgetfulMe extension
 * @module ui-components
 * @description Provides reusable UI components and DOM utilities
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import ErrorHandler from './error-handler.js';

/**
 * UI Components factory for ForgetfulMe Extension
 * @class UIComponents
 * @description Provides centralized component creation and DOM utilities for consistent UI patterns
 *
 * @example
 * // Create a button
 * const button = UIComponents.createButton('Click me', () => console.log('clicked'));
 *
 * // Use DOM utilities
 * const element = UIComponents.DOM.getElement('my-element');
 */
class UIComponents {
  /**
   * Available component types for UI creation
   * @static
   * @type {Object}
   * @property {string} BUTTON - Button component type
   * @property {string} FORM - Form component type
   * @property {string} INPUT - Input component type
   * @property {string} SELECT - Select component type
   * @property {string} LABEL - Label component type
   * @property {string} CONTAINER - Container component type
   * @property {string} HEADER - Header component type
   * @property {string} SECTION - Section component type
   * @property {string} LIST - List component type
   * @property {string} LIST_ITEM - List item component type
   * @property {string} MESSAGE - Message component type
   * @property {string} CONFIRM - Confirmation dialog component type
   * @property {string} TOAST - Toast notification component type
   */
  static COMPONENT_TYPES = {
    BUTTON: 'button',
    FORM: 'form',
    INPUT: 'input',
    SELECT: 'select',
    LABEL: 'label',
    CONTAINER: 'container',
    HEADER: 'header',
    SECTION: 'section',
    LIST: 'list',
    LIST_ITEM: 'list-item',
    MESSAGE: 'message',
    CONFIRM: 'confirm',
    TOAST: 'toast',
  };

  /**
   * Available button styles for consistent UI
   * @static
   * @type {Object}
   * @property {string} PRIMARY - Primary button style
   * @property {string} SECONDARY - Secondary button style
   * @property {string} DANGER - Danger/error button style
   * @property {string} SUCCESS - Success button style
   * @property {string} WARNING - Warning button style
   * @property {string} INFO - Info button style
   * @property {string} SMALL - Small button size
   * @property {string} LARGE - Large button size
   */
  static BUTTON_STYLES = {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
    DANGER: 'danger',
    SUCCESS: 'success',
    WARNING: 'warning',
    INFO: 'info',
    SMALL: 'small',
    LARGE: 'large',
  };

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
  static FIELD_TYPES = {
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
   * DOM utility class for safe element access and manipulation
   * @static
   * @namespace DOM
   * @description Provides safe DOM element access and manipulation utilities
   */
  static DOM = {
    /**
     * Check if DOM is ready
     * @returns {boolean} - True if DOM is ready
     */
    isReady() {
      return (
        document.readyState === 'complete' ||
        document.readyState === 'interactive'
      );
    },

    /**
     * Wait for DOM to be ready
     * @returns {Promise} - Promise that resolves when DOM is ready
     */
    ready() {
      return new Promise(resolve => {
        if (this.isReady()) {
          resolve();
        } else {
          document.addEventListener('DOMContentLoaded', resolve, {
            once: true,
          });
        }
      });
    },

    /**
     * Safely get an element by ID
     * @param {string} id - Element ID
     * @param {HTMLElement} container - Container to search in (optional)
     * @returns {HTMLElement|null} - Element or null if not found
     */
    getElement(id, container = document) {
      try {
        return container.getElementById(id);
      } catch (error) {
        ErrorHandler.handle(error, 'ui-components.DOM.getElement');
        return null;
      }
    },

    /**
     * Safely get an element by selector
     * @param {string} selector - CSS selector
     * @param {HTMLElement} container - Container to search in (optional)
     * @returns {HTMLElement|null} - Element or null if not found
     */
    querySelector(selector, container = document) {
      try {
        return container.querySelector(selector);
      } catch (error) {
        ErrorHandler.handle(error, 'ui-components.DOM.querySelector');
        return null;
      }
    },

    /**
     * Safely get multiple elements by selector
     * @param {string} selector - CSS selector
     * @param {HTMLElement} container - Container to search in (optional)
     * @returns {NodeList} - Elements or empty NodeList
     */
    querySelectorAll(selector, container = document) {
      try {
        return container.querySelectorAll(selector);
      } catch (error) {
        ErrorHandler.handle(error, 'ui-components.DOM.querySelectorAll');
        return document.querySelectorAll(''); // Return empty NodeList
      }
    },

    /**
     * Check if an element exists
     * @param {string} id - Element ID
     * @param {HTMLElement} container - Container to search in (optional)
     * @returns {boolean} - True if element exists
     */
    elementExists(id, container = document) {
      return this.getElement(id, container) !== null;
    },

    /**
     * Wait for an element to exist
     * @param {string} id - Element ID
     * @param {number} timeout - Timeout in milliseconds (default: 5000)
     * @param {HTMLElement} container - Container to search in (optional)
     * @returns {Promise<HTMLElement>} - Promise that resolves with element
     */
    waitForElement(id, timeout = 5000, container = document) {
      return new Promise((resolve, reject) => {
        const element = this.getElement(id, container);
        if (element) {
          resolve(element);
          return;
        }

        const startTime = Date.now();
        const checkElement = () => {
          const element = this.getElement(id, container);
          if (element) {
            resolve(element);
            return;
          }

          if (Date.now() - startTime > timeout) {
            reject(
              new Error(`Element with id '${id}' not found within ${timeout}ms`)
            );
            return;
          }

          requestAnimationFrame(checkElement);
        };

        requestAnimationFrame(checkElement);
      });
    },

    /**
     * Safely add event listener to element
     * @param {string} id - Element ID
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {HTMLElement} container - Container to search in (optional)
     * @returns {boolean} - True if listener was added
     */
    addEventListener(id, event, handler, container = document) {
      const element = this.getElement(id, container);
      if (element) {
        element.addEventListener(event, handler);
        return true;
      }
      // Element with id not found
      return false;
    },

    /**
     * Safely set element value
     * @param {string} id - Element ID
     * @param {string} value - Value to set
     * @param {HTMLElement} container - Container to search in (optional)
     * @returns {boolean} - True if value was set
     */
    setValue(id, value, container = document) {
      const element = this.getElement(id, container);
      if (element) {
        element.value = value;
        return true;
      }
      // Element with id not found
      return false;
    },

    /**
     * Safely get element value
     * @param {string} id - Element ID
     * @param {HTMLElement} container - Container to search in (optional)
     * @returns {string|null} - Element value or null
     */
    getValue(id, container = document) {
      const element = this.getElement(id, container);
      return element ? element.value : null;
    },

    /**
     * Initialize elements safely with retry logic
     * @param {Object} elementMap - Object mapping property names to element IDs
     * @param {HTMLElement} container - Container to search in (optional)
     * @returns {Object} - Object with initialized elements
     */
    initializeElements(elementMap, container = document) {
      const elements = {};

      for (const [propertyName, elementId] of Object.entries(elementMap)) {
        elements[propertyName] = this.getElement(elementId, container);
      }

      return elements;
    },

    /**
     * Bind events safely with existence checks
     * @param {Array} eventBindings - Array of event binding objects
     * @param {HTMLElement} container - Container to search in (optional)
     * @returns {Array} - Array of successfully bound events
     */
    bindEvents(eventBindings, container = document) {
      const boundEvents = [];

      for (const binding of eventBindings) {
        const { elementId, event, handler, selector } = binding;

        let element = null;
        if (elementId) {
          element = this.getElement(elementId, container);
        } else if (selector) {
          element = this.querySelector(selector, container);
        }

        if (element) {
          element.addEventListener(event, handler);
          boundEvents.push({ element, event, handler });
        } else {
          // Element not found for binding
        }
      }

      return boundEvents;
    },
  };

  /**
   * Create a button element
   * @param {string} text - Button text
   * @param {Function} onClick - Click handler
   * @param {string} className - Additional CSS classes
   * @param {Object} options - Additional options
   * @returns {HTMLButtonElement}
   */
  static createButton(text, onClick, className = '', options = {}) {
    const button = document.createElement('button');
    button.textContent = text;

    // Map custom classes to Pico CSS classes
    let picoClass = '';
    if (className.includes('primary')) picoClass = 'primary';
    else if (className.includes('secondary')) picoClass = 'secondary';
    else if (className.includes('danger')) picoClass = 'contrast';
    else if (className.includes('outline')) picoClass = 'outline';
    else picoClass = className;

    button.className = picoClass;

    if (onClick) {
      button.addEventListener('click', onClick);
    }

    // Apply additional attributes
    if (options.type) button.type = options.type;
    if (options.disabled) button.disabled = options.disabled;
    if (options.title) button.title = options.title;
    if (options.id) button.id = options.id;

    return button;
  }

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
      const submitBtn = this.createButton(options.submitText, null, 'primary', {
        type: 'submit',
        'aria-label': options.submitText,
      });
      form.appendChild(submitBtn);
    }

    return form;
  }

  /**
   * Create a container with header
   * @param {string} title - Container title
   * @param {string} subtitle - Container subtitle
   * @param {string} className - Additional CSS classes
   * @returns {HTMLElement}
   */
  static createContainer(title, subtitle = '', className = '') {
    const container = document.createElement('div');
    container.className = `ui-container ${className}`.trim();

    if (title) {
      const header = document.createElement('div');
      header.className = 'ui-container-header';

      const titleEl = document.createElement('h2');
      titleEl.textContent = title;
      header.appendChild(titleEl);

      if (subtitle) {
        const subtitleEl = document.createElement('p');
        subtitleEl.textContent = subtitle;
        header.appendChild(subtitleEl);
      }

      container.appendChild(header);
    }

    return container;
  }

  /**
   * Create a list container
   * @param {string} id - List ID
   * @param {string} className - Additional CSS classes
   * @returns {HTMLElement}
   */
  static createList(id, className = '') {
    const list = document.createElement('div');
    list.id = id;
    list.className = `list ${className}`.trim();
    return list;
  }

  /**
   * Create a list item
   * @param {Object} data - Item data
   * @param {Object} options - Item options
   * @returns {HTMLElement}
   */
  static createListItem(data, options = {}) {
    const item = document.createElement('div');
    item.className = `list-item ${options.className || ''}`.trim();

    // Add title if provided
    if (data.title) {
      const title = document.createElement('div');
      title.className = 'item-title';
      title.textContent = data.title;
      if (data.titleTooltip) title.title = data.titleTooltip;
      item.appendChild(title);
    }

    // Add meta information
    if (data.meta) {
      const meta = document.createElement('div');
      meta.className = 'item-meta';

      if (data.meta.status) {
        const status = document.createElement('span');
        status.className = `status status-${data.meta.status}`;
        status.textContent = data.meta.statusText || data.meta.status;
        meta.appendChild(status);
      }

      if (data.meta.time) {
        const time = document.createElement('span');
        time.textContent = data.meta.time;
        meta.appendChild(time);
      }

      if (data.meta.tags && data.meta.tags.length > 0) {
        const tags = document.createElement('span');
        tags.textContent = ` • ${data.meta.tags.join(', ')}`;
        meta.appendChild(tags);
      }

      item.appendChild(meta);
    }

    // Add actions if provided
    if (data.actions) {
      const actions = document.createElement('div');
      actions.className = 'item-actions';

      data.actions.forEach(action => {
        const actionBtn = this.createButton(
          action.text,
          action.onClick,
          action.className || ''
        );
        actions.appendChild(actionBtn);
      });

      item.appendChild(actions);
    }

    return item;
  }

  /**
   * Create a section with title using Pico styling
   * @param {string} title - Section title
   * @param {string} className - Additional CSS classes
   * @param {Object} options - Section options
   * @returns {HTMLElement}
   */
  static createSection(title, className = '', options = {}) {
    // Use article element for card-like sections when specified
    const element = options.useCard ? document.createElement('article') : document.createElement('section');
    element.className = `section ${className}`.trim();

    if (title) {
      const titleEl = document.createElement(options.useCard ? 'header' : 'h3');
      if (options.useCard) {
        const titleH3 = document.createElement('h3');
        titleH3.textContent = title;
        titleEl.appendChild(titleH3);
      } else {
        titleEl.textContent = title;
      }
      element.appendChild(titleEl);
    }

    return element;
  }

  /**
   * Create a card using Pico's article element with header, content, and footer
   * @param {string} title - Card title (optional)
   * @param {string|HTMLElement} content - Card content
   * @param {string|HTMLElement} footer - Card footer content (optional)
   * @param {string} className - Additional CSS classes
   * @param {Object} _options - Card options (unused)
   * @returns {HTMLElement}
   */
  static createCard(title, content, footer = '', className = '', _options = {}) {
    const article = document.createElement('article');
    article.className = `card ${className}`.trim();
    
    // Add header if title is provided
    if (title) {
      const header = document.createElement('header');
      const titleEl = document.createElement('h3');
      titleEl.textContent = title;
      header.appendChild(titleEl);
      article.appendChild(header);
    }
    
    // Add main content
    const mainContent = document.createElement('div');
    if (typeof content === 'string') {
      mainContent.innerHTML = content;
    } else {
      mainContent.appendChild(content);
    }
    article.appendChild(mainContent);
    
    // Add footer if provided
    if (footer) {
      const footerElement = document.createElement('footer');
      if (typeof footer === 'string') {
        footerElement.innerHTML = footer;
      } else {
        footerElement.appendChild(footer);
      }
      article.appendChild(footerElement);
    }
    
    return article;
  }

  /**
   * Create a card with actions in the footer
   * @param {string} title - Card title
   * @param {string|HTMLElement} content - Card content
   * @param {Array} actions - Array of action objects with text, onClick, and className
   * @param {string} className - Additional CSS classes
   * @returns {HTMLElement}
   */
  static createCardWithActions(title, content, actions = [], className = '') {
    const article = document.createElement('article');
    article.className = `card ${className}`.trim();
    
    // Add header
    if (title) {
      const header = document.createElement('header');
      const titleEl = document.createElement('h3');
      titleEl.textContent = title;
      header.appendChild(titleEl);
      article.appendChild(header);
    }
    
    // Add main content
    const mainContent = document.createElement('div');
    if (typeof content === 'string') {
      mainContent.innerHTML = content;
    } else {
      mainContent.appendChild(content);
    }
    article.appendChild(mainContent);
    
    // Add footer with actions
    if (actions.length > 0) {
      const footer = document.createElement('footer');
      footer.className = 'card-actions';
      
      actions.forEach(action => {
        const button = this.createButton(
          action.text,
          action.onClick,
          action.className || 'secondary'
        );
        footer.appendChild(button);
      });
      
      article.appendChild(footer);
    }
    
    return article;
  }

  /**
   * Create a card with form elements
   * @param {string} title - Card title
   * @param {Array} formFields - Array of form field configurations
   * @param {Function} onSubmit - Form submit handler
   * @param {string} submitText - Submit button text
   * @param {string} className - Additional CSS classes
   * @returns {HTMLElement}
   */
  static createFormCard(title, formFields, onSubmit, submitText = 'Submit', className = '') {
    const article = document.createElement('article');
    article.className = `card form-card ${className}`.trim();
    
    // Add header
    if (title) {
      const header = document.createElement('header');
      const titleEl = document.createElement('h3');
      titleEl.textContent = title;
      header.appendChild(titleEl);
      article.appendChild(header);
    }
    
    // Add form content
    const form = this.createForm('card-form', onSubmit, formFields, {
      submitText,
      className: 'card-form'
    });
    article.appendChild(form);
    
    return article;
  }

  /**
   * Create a card with list items
   * @param {string} title - Card title
   * @param {Array} items - Array of item data objects
   * @param {Object} options - List options
   * @param {string} className - Additional CSS classes
   * @returns {HTMLElement}
   */
  static createListCard(title, items, options = {}, className = '') {
    const article = document.createElement('article');
    article.className = `card list-card ${className}`.trim();
    
    // Add header
    if (title) {
      const header = document.createElement('header');
      const titleEl = document.createElement('h3');
      titleEl.textContent = title;
      header.appendChild(titleEl);
      article.appendChild(header);
    }
    
    // Add list content
    const listContainer = document.createElement('div');
    listContainer.className = 'card-list';
    
    items.forEach(item => {
      const listItem = this.createListItem(item, options);
      listContainer.appendChild(listItem);
    });
    
    article.appendChild(listContainer);
    
    return article;
  }

  /**
   * Create a responsive layout container
   * @param {string} className - Additional CSS classes
   * @returns {HTMLElement}
   */
  static createLayoutContainer(className = '') {
    const container = document.createElement('div');
    container.className = `container ${className}`.trim();
    return container;
  }

  /**
   * Create a sidebar layout
   * @param {HTMLElement} sidebar - Sidebar content
   * @param {HTMLElement} main - Main content
   * @param {Object} options - Layout options
   * @returns {HTMLElement}
   */
  static createSidebarLayout(sidebar, main, options = {}) {
    const layout = document.createElement('div');
    layout.className = `sidebar-layout ${options.className || ''}`.trim();

    // Create sidebar container
    const sidebarContainer = document.createElement('aside');
    sidebarContainer.className = 'sidebar';
    sidebarContainer.appendChild(sidebar);
    layout.appendChild(sidebarContainer);

    // Create main content container
    const mainContainer = document.createElement('main');
    mainContainer.className = 'main-content';
    mainContainer.appendChild(main);
    layout.appendChild(mainContainer);

    return layout;
  }

  /**
   * Create a grid layout with Pico CSS classes
   * @param {Array} items - Grid items
   * @param {Object} options - Grid options
   * @returns {HTMLElement}
   */
  static createGrid(items, options = {}) {
    const grid = document.createElement('div');

    // Use Pico's grid system with responsive classes
    let gridClass = 'grid';
    if (options.columns) {
      gridClass += ` grid-${options.columns}`;
    }
    if (options.gap) {
      gridClass += ` gap-${options.gap}`;
    }
    grid.className = `${gridClass} ${options.className || ''}`.trim();

    items.forEach(item => {
      const gridItem = document.createElement('div');
      // Use Pico's grid item styling
      gridItem.className = `grid-item ${item.className || ''}`.trim();

      // Support for complex content (not just text)
      if (typeof item === 'string') {
        gridItem.textContent = item;
      } else if (item.content) {
        gridItem.innerHTML = item.content;
      } else if (item.text) {
        gridItem.textContent = item.text;
      }

      grid.appendChild(gridItem);
    });

    return grid;
  }

  /**
   * Create a confirmation dialog using Pico's dialog system
   * @param {string} message - Confirmation message
   * @param {Function} onConfirm - Confirm handler
   * @param {Function} onCancel - Cancel handler
   * @param {Object} options - Dialog options
   * @returns {HTMLElement}
   */
  static createConfirmDialog(message, onConfirm, onCancel, options = {}) {
    const actions = [
      {
        text: options.confirmText || 'Confirm',
        onClick: () => {
          this.closeModal(dialog);
          if (onConfirm) onConfirm();
        },
        className: 'primary',
      },
      {
        text: options.cancelText || 'Cancel',
        onClick: () => {
          this.closeModal(dialog);
          if (onCancel) onCancel();
        },
        className: 'secondary',
      },
    ];

    const dialog = this.createModal(
      options.title || 'Confirm',
      message,
      actions,
      {
        showClose: false,
        className: 'confirm-dialog',
        ...options,
      }
    );

    return dialog;
  }

  /**
   * Create a Pico progress indicator (indeterminate)
   * @param {string} ariaLabel - ARIA label for accessibility
   * @param {string} className - Additional CSS classes
   * @returns {HTMLElement}
   */
  static createProgressIndicator(ariaLabel = 'Loading', className = '') {
    const progress = document.createElement('progress');
    progress.setAttribute('aria-label', ariaLabel);
    progress.className = className.trim();
    // Indeterminate progress (no value attribute)
    return progress;
  }

  /**
   * Create a Pico progress bar with specific value
   * @param {number} value - Progress value (0-100)
   * @param {number} max - Maximum value (default: 100)
   * @param {string} ariaLabel - ARIA label for accessibility
   * @param {string} className - Additional CSS classes
   * @returns {HTMLElement}
   */
  static createProgressBar(value, max = 100, ariaLabel = 'Progress', className = '') {
    const progress = document.createElement('progress');
    progress.value = Math.min(Math.max(value, 0), max);
    progress.max = max;
    progress.setAttribute('aria-label', ariaLabel);
    progress.className = className.trim();
    return progress;
  }

  /**
   * Create a loading state with Pico progress indicator
   * @param {string} text - Loading text
   * @param {string} className - Additional CSS classes
   * @returns {HTMLElement}
   */
  static createLoadingState(text = 'Loading...', className = '') {
    const container = document.createElement('div');
    container.className = `loading-state ${className}`.trim();

    const progress = this.createProgressIndicator('Loading', 'loading-progress');
    container.appendChild(progress);

    if (text && text.trim()) {
      const textEl = document.createElement('div');
      textEl.className = 'loading-text';
      textEl.textContent = text;
      container.appendChild(textEl);
    }

    return container;
  }

  /**
   * Set busy state on an element using Pico's aria-busy attribute
   * @param {HTMLElement} element - Element to set busy state on
   * @param {boolean} isBusy - Whether element is busy
   */
  static setBusyState(element, isBusy) {
    if (isBusy) {
      element.setAttribute('aria-busy', 'true');
    } else {
      element.removeAttribute('aria-busy');
    }
  }

  /**
   * Create a status indicator
   * @param {string} status - Status type
   * @param {string} text - Status text
   * @param {string} className - Additional CSS classes
   * @returns {HTMLElement}
   */
  static createStatusIndicator(status, text, className = '') {
    const indicator = document.createElement('div');
    indicator.className =
      `status-indicator status-${status} ${className}`.trim();

    const icon = document.createElement('span');
    icon.className = 'status-icon';

    // Set appropriate icon based on status
    switch (status) {
      case 'success':
        icon.textContent = '✓';
        break;
      case 'error':
        icon.textContent = '✗';
        break;
      case 'warning':
        icon.textContent = '⚠';
        break;
      case 'info':
        icon.textContent = 'ℹ';
        break;
      default:
        icon.textContent = '•';
    }

    const textEl = document.createElement('span');
    textEl.className = 'status-text';
    textEl.textContent = text;

    indicator.appendChild(icon);
    indicator.appendChild(textEl);

    return indicator;
  }

  /**
   * Create a tabbed interface
   * @param {Array} tabs - Tab configurations
   * @param {Object} options - Tab options
   * @returns {HTMLElement}
   */
  static createTabs(tabs, _options = {}) {
    const tabContainer = document.createElement('div');
    tabContainer.className = 'tab-container';

    const tabList = document.createElement('div');
    tabList.className = 'tab-list';

    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content';

    tabs.forEach((tab, index) => {
      const tabButton = this.createButton(
        tab.title,
        () => this.switchTab(tabContainer, index),
        `tab-button ${index === 0 ? 'active' : ''}`
      );
      tabList.appendChild(tabButton);

      const tabPanel = document.createElement('div');
      tabPanel.className = `tab-panel ${index === 0 ? 'active' : ''}`;
      tabPanel.innerHTML = tab.content;
      tabContent.appendChild(tabPanel);
    });

    tabContainer.appendChild(tabList);
    tabContainer.appendChild(tabContent);

    return tabContainer;
  }

  /**
   * Switch between tabs
   * @param {HTMLElement} tabContainer - Tab container
   * @param {number} activeIndex - Index of active tab
   */
  static switchTab(tabContainer, activeIndex) {
    const buttons = tabContainer.querySelectorAll('.tab-button');
    const panels = tabContainer.querySelectorAll('.tab-panel');

    buttons.forEach((button, index) => {
      button.classList.toggle('active', index === activeIndex);
    });

    panels.forEach((panel, index) => {
      panel.classList.toggle('active', index === activeIndex);
    });
  }

  /**
   * Create a modal dialog using Pico's dialog system
   * @param {string} title - Modal title
   * @param {HTMLElement|string} content - Modal content
   * @param {Array} actions - Array of action buttons
   * @param {Object} options - Modal options
   * @returns {HTMLElement}
   */
  static createModal(title, content, actions = [], options = {}) {
    const dialog = document.createElement('dialog');
    dialog.className = options.className || '';

    // Create article container for Pico styling
    const article = document.createElement('article');
    
    // Add header if title is provided
    if (title) {
      const header = document.createElement('header');
      const titleEl = document.createElement('h3');
      titleEl.textContent = title;
      header.appendChild(titleEl);
      article.appendChild(header);
    }

    // Add main content
    const mainContent = document.createElement('div');
    if (typeof content === 'string') {
      mainContent.innerHTML = content;
    } else {
      mainContent.appendChild(content);
    }
    article.appendChild(mainContent);

    // Add footer with actions if provided
    if (actions.length > 0) {
      const footer = document.createElement('footer');
      actions.forEach(action => {
        const button = this.createButton(
          action.text,
          action.onClick,
          action.className || 'outline',
          action.options || {}
        );
        footer.appendChild(button);
      });
      article.appendChild(footer);
    }

    // Add close button if not disabled
    if (options.showClose !== false) {
      const closeBtn = this.createButton(
        '×',
        () => this.closeModal(dialog),
        'outline',
        {
          'aria-label': 'Close modal',
          title: 'Close',
        }
      );
      closeBtn.style.position = 'absolute';
      closeBtn.style.top = '1rem';
      closeBtn.style.right = '1rem';
      article.appendChild(closeBtn);
    }

    dialog.appendChild(article);

    // Add backdrop click to close
    dialog.addEventListener('click', e => {
      if (e.target === dialog) {
        this.closeModal(dialog);
      }
    });

    return dialog;
  }

  /**
   * Close a modal dialog
   * @param {HTMLElement} modal - Modal element
   */
  static closeModal(modal) {
    if (modal && modal.tagName === 'DIALOG') {
      modal.close();
    }
    if (modal && modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
  }

  /**
   * Show a modal dialog
   * @param {HTMLElement} modal - Modal element
   */
  static showModal(modal) {
    if (modal && modal.tagName === 'DIALOG') {
      modal.showModal();
    } else {
      document.body.appendChild(modal);
    }
  }

  /**
   * Create a tooltip
   * @param {HTMLElement} element - Element to attach tooltip to
   * @param {string} text - Tooltip text
   * @param {Object} options - Tooltip options
   */
  static createTooltip(element, text, options = {}) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;

    element.addEventListener('mouseenter', () => {
      document.body.appendChild(tooltip);
      this.positionTooltip(element, tooltip, options);
    });

    element.addEventListener('mouseleave', () => {
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
    });
  }

  /**
   * Position a tooltip relative to an element
   * @param {HTMLElement} element - Target element
   * @param {HTMLElement} tooltip - Tooltip element
   * @param {Object} options - Positioning options
   */
  static positionTooltip(element, tooltip, options = {}) {
    const rect = element.getBoundingClientRect();
    const position = options.position || 'top';

    let top, left;

    switch (position) {
      case 'top':
        top = rect.top - tooltip.offsetHeight - 5;
        left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + 5;
        left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltip.offsetHeight / 2;
        left = rect.left - tooltip.offsetWidth - 5;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltip.offsetHeight / 2;
        left = rect.right + 5;
        break;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }

  /**
   * Create a navigation menu using Pico's nav structure
   * @param {Array} items - Array of navigation items with text, href, and optional active state
   * @param {string} ariaLabel - ARIA label for the navigation
   * @param {string} className - Additional CSS classes
   * @returns {HTMLElement}
   */
  static createNavigation(items, ariaLabel = 'Main navigation', className = '') {
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', ariaLabel);
    nav.className = className.trim();

    const ul = document.createElement('ul');
    items.forEach(item => {
      const li = document.createElement('li');
      
      if (item.href) {
        const a = document.createElement('a');
        a.href = item.href;
        a.textContent = item.text;
        if (item.active) {
          a.setAttribute('aria-current', 'page');
        }
        if (item.title) {
          a.title = item.title;
        }
        li.appendChild(a);
      } else if (item.onClick) {
        const button = this.createButton(
          item.text,
          item.onClick,
          item.className || 'outline',
          {
            title: item.title,
            'aria-label': item['aria-label'],
          }
        );
        li.appendChild(button);
      }
      
      ul.appendChild(li);
    });

    nav.appendChild(ul);
    return nav;
  }

  /**
   * Create a breadcrumb navigation using Pico's nav structure
   * @param {Array} items - Array of breadcrumb items with text and href
   * @param {string} className - Additional CSS classes
   * @returns {HTMLElement}
   */
  static createBreadcrumb(items, className = '') {
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Breadcrumb');
    nav.className = `breadcrumb ${className}`.trim();

    const ol = document.createElement('ol');
    items.forEach((item, index) => {
      const li = document.createElement('li');
      
      if (index === items.length - 1) {
        // Last item (current page)
        const span = document.createElement('span');
        span.textContent = item.text;
        span.setAttribute('aria-current', 'page');
        li.appendChild(span);
      } else {
        // Navigation items
        const a = document.createElement('a');
        a.href = item.href;
        a.textContent = item.text;
        li.appendChild(a);
      }
      
      ol.appendChild(li);
    });

    nav.appendChild(ol);
    return nav;
  }

  /**
   * Create a navigation menu with dropdown support
   * @param {Array} items - Array of navigation items
   * @param {string} ariaLabel - ARIA label for the navigation
   * @param {string} className - Additional CSS classes
   * @returns {HTMLElement}
   */
  static createNavMenu(items, ariaLabel = 'Navigation menu', className = '') {
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', ariaLabel);
    nav.className = `nav-menu ${className}`.trim();

    const ul = document.createElement('ul');
    items.forEach(item => {
      const li = document.createElement('li');
      
      if (item.dropdown) {
        // Create dropdown menu
        const details = document.createElement('details');
        details.className = 'dropdown';
        
        const summary = document.createElement('summary');
        summary.textContent = item.text;
        if (item.title) {
          summary.title = item.title;
        }
        details.appendChild(summary);
        
        const dropdownUl = document.createElement('ul');
        item.dropdown.forEach(dropdownItem => {
          const dropdownLi = document.createElement('li');
          const dropdownA = document.createElement('a');
          dropdownA.href = dropdownItem.href;
          dropdownA.textContent = dropdownItem.text;
          if (dropdownItem.onClick) {
            dropdownA.addEventListener('click', dropdownItem.onClick);
          }
          dropdownLi.appendChild(dropdownA);
          dropdownUl.appendChild(dropdownLi);
        });
        
        details.appendChild(dropdownUl);
        li.appendChild(details);
      } else {
        // Regular navigation item
        if (item.href) {
          const a = document.createElement('a');
          a.href = item.href;
          a.textContent = item.text;
          if (item.active) {
            a.setAttribute('aria-current', 'page');
          }
          li.appendChild(a);
        } else if (item.onClick) {
          const button = this.createButton(
            item.text,
            item.onClick,
            item.className || 'outline',
            {
              title: item.title,
              'aria-label': item['aria-label'],
            }
          );
          li.appendChild(button);
        }
      }
      
      ul.appendChild(li);
    });

    nav.appendChild(ul);
    return nav;
  }

  /**
   * Create a header with navigation
   * @param {string} title - Header title
   * @param {Array} navItems - Navigation items
   * @param {Object} options - Header options
   * @returns {HTMLElement}
   */
  static createHeaderWithNav(title, navItems = [], options = {}) {
    const header = document.createElement('header');
    header.setAttribute('role', 'banner');
    header.className = options.className || '';

    // Add title
    if (title) {
      const titleEl = document.createElement('h1');
      titleEl.textContent = title;
      titleEl.setAttribute('id', options.titleId || 'page-title');
      header.appendChild(titleEl);
    }

    // Add navigation if provided
    if (navItems.length > 0) {
      const nav = this.createNavigation(
        navItems,
        options.navAriaLabel || 'Main navigation',
        options.navClassName || ''
      );
      header.appendChild(nav);
    }

    return header;
  }
}

// Export for use in other modules
export default UIComponents;
