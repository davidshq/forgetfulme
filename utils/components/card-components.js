/**
 * @fileoverview Card component creation utilities
 * @module components/card-components
 * @description Provides card creation utilities
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { createButton } from './button-components.js';
import { createForm } from './form-components.js';
import { createListItem } from './list-components.js';

/**
 * Create a card using Pico's article element with header, content, and footer
 * @param {string} title - Card title (optional)
 * @param {string|HTMLElement} content - Card content
 * @param {string|HTMLElement} footer - Card footer content (optional)
 * @param {string} className - Additional CSS classes
 * @param {Object} _options - Card options (unused)
 * @returns {HTMLElement}
 */
export function createCard(title, content, footer = '', className = '', _options = {}) {
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
export function createCardWithActions(title, content, actions = [], className = '') {
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
      const button = createButton(action.text, action.onClick, action.className || 'secondary');
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
export function createFormCard(title, formFields, onSubmit, submitText = 'Submit', className = '') {
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
  const form = createForm('card-form', onSubmit, formFields, {
    submitText,
    className: 'card-form',
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
export function createListCard(title, items, options = {}, className = '') {
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
    const listItem = createListItem(item, options);
    listContainer.appendChild(listItem);
  });

  article.appendChild(listContainer);

  return article;
}
