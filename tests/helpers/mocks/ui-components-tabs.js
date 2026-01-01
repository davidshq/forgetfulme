/**
 * @fileoverview Tab UI component mocks
 * @module mocks/ui-components-tabs
 * @description Tab-related UI component mocks
 */

import { vi } from 'vitest';

/**
 * Creates tab UI component mocks
 * @param {Object} document - Mock document object
 * @returns {Object} Tab component mocks
 */
export const createTabComponents = document => ({
  createTabs: vi.fn((tabs, options) => {
    const container = document.createElement('div');
    container.className = options?.className || 'tab-container';

    const nav = document.createElement('div');
    nav.className = 'ui-tabs-nav';

    const content = document.createElement('div');
    content.className = 'ui-tabs-content';

    tabs.forEach((tab, index) => {
      const navItem = document.createElement('div');
      navItem.className = `ui-tab-nav-item ${index === 0 ? 'active' : ''}`;
      navItem.textContent = tab.title;
      nav.appendChild(navItem);

      const tabContent = document.createElement('div');
      tabContent.className = `ui-tab-content ${index === 0 ? 'active' : ''}`;
      tabContent.innerHTML = tab.content;
      content.appendChild(tabContent);
    });

    container.appendChild(nav);
    container.appendChild(content);
    return container;
  }),
  switchTab: vi.fn((container, tabIndex) => {
    const navItems = container.querySelectorAll('.ui-tab-nav-item');
    const contents = container.querySelectorAll('.ui-tab-content');

    navItems.forEach((item, index) => {
      if (index === tabIndex) {
        item.classList.add('active');
        contents[index].classList.add('active');
      } else {
        item.classList.remove('active');
        contents[index].classList.remove('active');
      }
    });
  }),
});
