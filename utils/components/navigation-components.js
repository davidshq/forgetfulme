/**
 * @fileoverview Navigation component creation utilities
 * @module components/navigation-components
 * @description Provides navigation component creation utilities
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { createButton } from './button-components.js';

/**
 * Create a navigation menu using Pico's nav structure
 * @param {Array} items - Array of navigation items with text, href, and optional active state
 * @param {string} ariaLabel - ARIA label for the navigation
 * @param {string} className - Additional CSS classes
 * @returns {HTMLElement}
 */
export function createNavigation(items, ariaLabel = 'Main navigation', className = '') {
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
      const button = createButton(item.text, item.onClick, item.className || 'outline', {
        title: item.title,
        'aria-label': item['aria-label'],
      });
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
export function createBreadcrumb(items, className = '') {
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
export function createNavMenu(items, ariaLabel = 'Navigation menu', className = '') {
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
        const button = createButton(item.text, item.onClick, item.className || 'outline', {
          title: item.title,
          'aria-label': item['aria-label'],
        });
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
export function createHeaderWithNav(title, navItems = [], options = {}) {
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
    const nav = createNavigation(
      navItems,
      options.navAriaLabel || 'Main navigation',
      options.navClassName || '',
    );
    header.appendChild(nav);
  }

  return header;
}
