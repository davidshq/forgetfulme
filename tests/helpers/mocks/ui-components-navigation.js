/**
 * @fileoverview Navigation UI component mocks
 * @module mocks/ui-components-navigation
 * @description Navigation-related UI component mocks
 */

import { vi } from 'vitest';

/**
 * Creates navigation UI component mocks
 * @param {Object} document - Mock document object
 * @returns {Object} Navigation component mocks
 */
export const createNavigationComponents = document => ({
  createNavigation: vi.fn((items, ariaLabel, className) => {
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', ariaLabel || 'Main navigation');
    nav.className = className || '';

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
        li.appendChild(a);
      } else if (item.onClick) {
        const button = document.createElement('button');
        button.textContent = item.text;
        button.className = item.className || 'outline';
        li.appendChild(button);
      }
      ul.appendChild(li);
    });
    nav.appendChild(ul);
    return nav;
  }),
  createBreadcrumb: vi.fn((items, className) => {
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Breadcrumb');
    nav.className = `breadcrumb ${className || ''}`.trim();

    const ol = document.createElement('ol');
    items.forEach((item, index) => {
      const li = document.createElement('li');
      if (index === items.length - 1) {
        const span = document.createElement('span');
        span.textContent = item.text;
        span.setAttribute('aria-current', 'page');
        li.appendChild(span);
      } else {
        const a = document.createElement('a');
        a.href = item.href;
        a.textContent = item.text;
        li.appendChild(a);
      }
      ol.appendChild(li);
    });
    nav.appendChild(ol);
    return nav;
  }),
  createNavMenu: vi.fn((items, ariaLabel, className) => {
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', ariaLabel || 'Navigation menu');
    nav.className = `nav-menu ${className || ''}`.trim();

    const ul = document.createElement('ul');
    items.forEach(item => {
      const li = document.createElement('li');
      if (item.dropdown) {
        const details = document.createElement('details');
        details.className = 'dropdown';
        const summary = document.createElement('summary');
        summary.textContent = item.text;
        details.appendChild(summary);
        li.appendChild(details);
      } else if (item.href) {
        const a = document.createElement('a');
        a.href = item.href;
        a.textContent = item.text;
        li.appendChild(a);
      } else if (item.onClick) {
        const button = document.createElement('button');
        button.textContent = item.text;
        button.className = item.className || 'outline';
        li.appendChild(button);
      }
      ul.appendChild(li);
    });
    nav.appendChild(ul);
    return nav;
  }),
  createHeaderWithNav: vi.fn((title, navItems, options) => {
    const header = document.createElement('header');
    header.setAttribute('role', 'banner');
    header.className = options?.className || '';

    if (title) {
      const titleEl = document.createElement('h1');
      titleEl.textContent = title;
      titleEl.setAttribute('id', options?.titleId || 'page-title');
      header.appendChild(titleEl);
    }

    if (navItems && navItems.length > 0) {
      const nav = document.createElement('nav');
      nav.setAttribute('aria-label', options?.navAriaLabel || 'Main navigation');
      nav.className = options?.navClassName || '';
      header.appendChild(nav);
    }

    return header;
  }),
});
