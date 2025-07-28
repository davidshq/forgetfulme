/**
 * @fileoverview Container components for ForgetfulMe extension
 * @module ui-components/container-components
 * @description Provides container, list, section, and card creation utilities
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { ButtonComponents } from './button-components.js';
import { FormComponents } from './form-components.js';

/**
 * Container component creation utilities
 * @class ContainerComponents
 * @description Provides container, list, section, and card creation utilities
 *
 * @example
 * // Create a container with title
 * const container = ContainerComponents.createContainer('My Container', 'Subtitle');
 *
 * // Create a card with content
 * const card = ContainerComponents.createCard('Card Title', 'Card content');
 *
 * // Create a list item
 * const item = ContainerComponents.createListItem({ title: 'Item Title', meta: { status: 'active' } });
 */
export class ContainerComponents {
  /**
   * Create a container with header
   * @param {string} title - Container title
   * @param {string} subtitle - Container subtitle
   * @param {string} className - Additional CSS classes
   * @returns {HTMLElement}
   */
  static createContainer(title, subtitle = '', className = '') {
    const container = document.createElement('div');
    container.className = `container ${className}`.trim();

    if (title) {
      const header = document.createElement('header');
      
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
        const actionBtn = ButtonComponents.createButton(
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
    const element = options.useCard
      ? document.createElement('article')
      : document.createElement('section');
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
  static createCard(
    title,
    content,
    footer = '',
    className = '',
    _options = {}
  ) {
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
        const button = ButtonComponents.createButton(
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
  static createFormCard(
    title,
    formFields,
    onSubmit,
    submitText = 'Submit',
    className = ''
  ) {
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
    const form = FormComponents.createForm('card-form', onSubmit, formFields, {
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
   * Create a sidebar layout with main content area
   * @param {HTMLElement} sidebar - Sidebar element
   * @param {HTMLElement} main - Main content element
   * @param {Object} options - Layout options
   * @returns {HTMLElement}
   */
  static createSidebarLayout(sidebar, main, options = {}) {
    const layout = document.createElement('div');
    layout.className = `sidebar-layout ${options.className || ''}`.trim();

    // Add sidebar
    const sidebarContainer = document.createElement('aside');
    sidebarContainer.className = 'sidebar';
    sidebarContainer.appendChild(sidebar);
    layout.appendChild(sidebarContainer);

    // Add main content
    const mainContainer = document.createElement('main');
    mainContainer.className = 'main-content';
    mainContainer.appendChild(main);
    layout.appendChild(mainContainer);

    return layout;
  }

  /**
   * Create a responsive grid layout
   * @param {Array} items - Array of items to display in grid (can be DOM nodes or text objects)
   * @param {Object} options - Grid options
   * @returns {HTMLElement}
   */
  static createGrid(items, options = {}) {
    const grid = document.createElement('div');
    grid.className = `grid ${options.className || ''}`.trim();

    // Set grid columns if specified
    if (options.columns) {
      grid.style.gridTemplateColumns = `repeat(${options.columns}, 1fr)`;
    }

    // Add grid items
    items.forEach(item => {
      const gridItem = document.createElement('div');
      gridItem.className = 'grid-item';

      // Handle different item types
      if (item instanceof Node) {
        // If item is already a DOM node, append it directly
        gridItem.appendChild(item);
      } else if (typeof item === 'object' && item.text) {
        // If item is a text object, create a text node
        const textNode = document.createElement('span');
        textNode.textContent = item.text;
        if (item.className) {
          textNode.className = item.className;
        }
        gridItem.appendChild(textNode);
      } else if (typeof item === 'string') {
        // If item is a string, create a text node
        const textNode = document.createTextNode(item);
        gridItem.appendChild(textNode);
      } else {
        // Fallback: convert to string
        const textNode = document.createTextNode(String(item));
        gridItem.appendChild(textNode);
      }

      grid.appendChild(gridItem);
    });

    return grid;
  }
}
